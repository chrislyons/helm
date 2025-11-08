# Data Flow - Detailed Notes

## Overview
Helm uses unidirectional data flow with the Zustand store as the single source of truth. All mutations flow through store actions, and components re-render reactively via subscriptions. Async operations (LLM calls, file I/O) integrate cleanly through store actions and IPC bridges. The architecture ensures consistency even during complex multi-step agent workflows.

## Core Data Flow Patterns

### Pattern 1: Synchronous UI Updates
**Flow:** User action → Store action → State mutation → Component re-render

**Example: Text editing**
1. User types in Monaco editor
2. Editor's `onChange` handler fires
3. Handler calls `store.updateNodeText(nodeId, newText)`
4. Store mutates `currentTree.nodes.get(nodeId).text = newText`
5. Store creates new reference for React change detection
6. All components subscribed to `currentTree` re-render
7. Store schedules debounced save timer (500ms)

**Key Characteristics:**
- Synchronous update (no async calls)
- Immediate UI feedback
- Debounced persistence prevents excessive disk writes
- Re-render limited to components subscribed to changed state slice

---

### Pattern 2: Async Operations with Store Integration
**Flow:** User action → Async operation → Store mutation → Re-render

**Example: Node expansion**
1. User presses Cmd+E in editor
2. Keybinding handler calls async expand function
3. Handler calls `store.lockNode(nodeId, 'expanding')`
4. Handler calls `await openrouter.callContinuationModel(prompt, settings)`
5. OpenRouter makes HTTP POST to API, retries on failure
6. API returns array of N continuation strings
7. For each continuation: `store.addNode(parentId, continuationText)`
8. Handler calls `store.unlockNode(nodeId)`
9. If copilot enabled, handler calls `runCopilotOnNode()`
10. Store triggers re-render of Tree, Graph, and Editor components

**Key Characteristics:**
- Lock acquired before async operation
- Unlock in finally block (error handling)
- Store mutations after async completion
- Optional chained async (Copilot follow-up)

---

### Pattern 3: Multi-Step Agent Workflows
**Flow:** User trigger → Agent loop → Multiple async calls → Store mutations → Status updates

**Example: Scout agent**
1. User presses Cmd+X, then 1 (for scout preset 1)
2. Keybinding calls `store.requestScoutStart('1')`
3. Scout module detects request via store subscription
4. Module calls `runScout(config, storeActions, shouldStop)`
5. Agent begins depth-first loop:
   - Lock current node
   - Fire N parallel continuation requests (`Promise.all`)
   - Wait for all continuations
   - Add all children to store
   - Fire decision prompt to assistant model
   - Parse decision response (keep/delete tags)
   - Delete rejected children from store
   - Unlock current node
   - Add log message to scout output
   - Check shouldStop flag
   - Recurse to first child if not stopped
6. Agent completes or stops:
   - Cleanup: delete partial work, unlock all nodes
   - Set `scout.active = false` in store
   - Add final log message

**Key Characteristics:**
- Long-running async loop
- Multiple API calls per iteration
- Parallel requests within iteration
- Store mutations throughout loop
- Cancellation via shared mutable ref
- Cleanup guarantees via finally blocks
- Progressive UI updates (log messages, tree changes)

---

### Pattern 4: Filesystem Persistence
**Flow:** Store mutation → Debounced save → Serialization → IPC → Disk write

**Example: Tree save**
1. User action triggers store mutation (e.g., addNode, updateNodeText)
2. Store schedules debounced save (500ms timer)
3. If another mutation occurs within 500ms, timer resets
4. After 500ms of silence:
   - Store calls `fileSystem.saveTree(currentTree)`
   - FileSystem serializes Tree:
     - Convert `nodes: Map<string, TreeNode>` to array format
     - Convert bookmarks Set to array
     - Stringify to JSON
   - FileSystem calls `window.electronAPI.writeFile(treePath, json)`
   - Preload script invokes `ipcMain.handle('write-file')`
   - Main process calls `fs.writeFileSync(treePath, json, 'utf-8')`
   - Disk write completes
   - Success/error bubbles back to renderer
5. Store marks save complete (no visible UI change)

**Key Characteristics:**
- Debouncing batches rapid edits
- Serialization handles complex types (Map → array)
- Secure IPC bridge (no direct filesystem access)
- Synchronous disk I/O (simple, no streaming)
- Error handling at multiple layers

---

### Pattern 5: Workspace Loading
**Flow:** User selection → IPC read → Deserialization → Store update → Full re-render

**Example: Switch workspace**
1. User selects different tree from Header dropdown
2. Header calls `fileSystem.loadTree(treeId)`
3. FileSystem computes tree path from userData directory
4. FileSystem calls `window.electronAPI.readFile(treePath)`
5. Preload invokes `ipcMain.handle('read-file')`
6. Main process calls `fs.readFileSync(treePath, 'utf-8')`
7. JSON string returned to renderer via IPC
8. FileSystem deserializes:
   - Parse JSON string to object
   - Convert nodes array to `Map<string, TreeNode>`
   - Convert bookmark array to Set
   - Validate structure (has rootId, currentNodeId exists)
9. FileSystem returns Tree object
10. Header calls `store.selectTree(tree)`
11. Store sets `currentTree = tree`
12. All components re-render with new tree data

**Key Characteristics:**
- Full tree replacement (not incremental)
- Deserialization inverse of serialization
- Validation ensures tree integrity
- Single store mutation for entire workspace switch
- React optimizes re-render via memoization

---

## State Management Details

### Zustand Store Architecture

**State Structure:**
```typescript
{
  // Workspaces
  trees: Map<string, Tree>
  currentTree: Tree | null

  // UI Layout
  leftPanel: 'tree' | 'graph' | 'scout' | ...
  rightPanel: 'tree' | 'graph' | 'scout' | ...
  bottomPanelHeight: number
  ribbonWindow: 'help' | 'graph'

  // Agents
  scouts: ScoutConfig[]
  copilot: CopilotConfig

  // Settings
  settings: Settings
  automaticBookmarkConfig: AutoBookmarkConfig
}
```

**Action Categories:**
1. **Navigation:** setCurrentNode, selectTree
2. **Text editing:** updateNodeText
3. **Structure editing:** addNode, deleteNode, splitNodeAt, mergeWithParent, massMerge
4. **Bookmarks:** toggleBookmark, cullAndMergeToBookmarks
5. **Locking:** lockNode, unlockNode
6. **Workspace:** createTree, renameTree, deleteTree, loadTreeList
7. **Agents:** addScout, updateScout, deleteScout, requestScoutStart
8. **Settings:** updateSettings, updateCopilot
9. **UI:** updatePanels, setBottomPanelHeight, setRibbonWindow

**Mutation Discipline:**
- All actions create new object references (for React change detection)
- Maps are mutated in-place, then `new Map(oldMap)` for new reference
- Arrays use spread operator or slice for immutability
- Store never directly exposed to components (only via useStore hook)

**Subscription Model:**
- Components use selectors to subscribe to specific state slices
- `useStore(state => state.currentTree)` only re-renders when currentTree changes
- Zustand uses shallow equality for selector results
- No manual subscription/unsubscription (handled by React hooks)

---

### LocalStorage Persistence

**Persisted State:**
- `leftPanel` / `rightPanel` - Panel configuration
- `bottomPanelHeight` - Resizable panel height
- `scouts` - Agent presets (serialized to JSON)
- `copilot` - Copilot config (serialized to JSON)
- `settings` - API keys and model parameters
- `automaticBookmarkConfig` - Auto-bookmark settings
- `lastOpenedTreeId` - Workspace to load on startup
- `theme` - UI theme preference

**Persistence Timing:**
- Immediate save on every mutation (no debouncing)
- Written via `localStorage.setItem(key, JSON.stringify(value))`
- Read on app startup in store initialization
- Separate from tree data (which lives in Electron userData)

**Why LocalStorage?**
- UI state is ephemeral (not part of tree data model)
- No need for IPC overhead
- Instant persistence (no async)
- Survives app restarts but not workspace switches

---

## Execution Paths

### Path 1: Manual Node Expansion
```
User presses Cmd+E
  ↓
useKeybindings detects keydown event
  ↓
Handler calls store.lockNode(currentNodeId, 'expanding')
  ↓
Handler computes branchText via getBranchText(currentNodeId)
  ↓
Handler calls openrouter.callContinuationModel(branchText, settings)
  ↓
OpenRouter HTTP POST to API with Authorization header
  ↓
API returns { choices: [{ message: { content: "continuation1" }}] }
  ↓
OpenRouter parses response, extracts content strings
  ↓
For each continuation string:
  ↓
  Handler calls store.addNode(currentNodeId, continuationText)
  ↓
  Store creates new TreeNode { id: uuid(), text, parentId, childIds: [] }
  ↓
  Store adds node to currentTree.nodes Map
  ↓
  Store pushes id to parent.childIds array
  ↓
Handler calls store.unlockNode(currentNodeId)
  ↓
If copilot.enabled:
  ↓
  Handler calls runCopilotOnNode(currentNodeId, copilot, store, shouldStop)
  ↓
  Copilot locks each child, calls assistant model for decisions
  ↓
  Copilot deletes rejected children
  ↓
  Copilot unlocks all, adds output to copilot.outputs
  ↓
Store schedules debounced save
  ↓
After 500ms: saveTree writes to disk via IPC
  ↓
All components subscribed to currentTree re-render
```

---

### Path 2: Scout Agent Execution
```
User presses Cmd+X then 1
  ↓
useKeybindings detects 'X' keydown, enters scoutInvokeMode
  ↓
User presses '1' keydown
  ↓
Handler calls store.requestScoutStart('1')
  ↓
Store sets scoutStartRequest = '1'
  ↓
Scout module subscribed to scoutStartRequest detects change
  ↓
Module retrieves scout config by id from store.scouts array
  ↓
Module calls runScout(config, storeActions, shouldStop)
  ↓
runScout begins depth-first loop at currentNodeId
  ↓
For each node (up to depth limit):
  ↓
  Call store.lockNode(nodeId, 'scout-active')
  ↓
  Compute branchText via getBranchText(nodeId)
  ↓
  Fire N parallel continuation requests:
    Promise.all([
      callContinuationModel(branchText + vision1),
      callContinuationModel(branchText + vision2),
      ...
    ])
  ↓
  Wait for all N continuations
  ↓
  For each continuation:
    Call store.addNode(nodeId, continuationText)
  ↓
  Build decision prompt with all child texts
  ↓
  Call callAssistantModel(decisionPrompt)
  ↓
  Parse response for <keep>id</keep> and <delete>id</delete> tags
  ↓
  For each id in delete list:
    Call store.deleteNode(id)
  ↓
  Call store.unlockNode(nodeId)
  ↓
  Call store.addScoutOutput(`Expanded node ${nodeId}, kept ${keepCount}`)
  ↓
  Check shouldStop():
    If true: break loop, cleanup, return
  ↓
  Recurse to first kept child
  ↓
Agent completes or stops:
  ↓
  Call store.unlockNode(all locked nodes) in finally
  ↓
  Set scout.active = false
  ↓
  Call store.addScoutOutput('Scout complete')
```

---

### Path 3: Tree Merge Operation
```
User presses Cmd+Shift+M
  ↓
useKeybindings detects keydown event
  ↓
Handler calls store.mergeWithParent(currentNodeId)
  ↓
Store retrieves currentNode from currentTree.nodes Map
  ↓
If currentNode.id === rootId: abort (cannot merge root)
  ↓
Store retrieves parentNode via currentNode.parentId
  ↓
Store concatenates parentNode.text + '\n' + currentNode.text
  ↓
Store sets parentNode.text = concatenatedText
  ↓
Store removes currentNodeId from parentNode.childIds array
  ↓
For each childId in currentNode.childIds:
  ↓
  Store pushes childId to parentNode.childIds
  ↓
  Store retrieves childNode from Map
  ↓
  Store sets childNode.parentId = parentNode.id
  ↓
Store deletes currentNodeId from currentTree.nodes Map
  ↓
Store sets currentTree.currentNodeId = parentNode.id
  ↓
Store creates new Map reference: new Map(currentTree.nodes)
  ↓
Store schedules debounced save
  ↓
All components subscribed to currentTree re-render
  ↓
TextEditor recomputes branch text, updates Monaco model
  ↓
TreeModule re-renders with updated hierarchy
  ↓
GraphModule re-runs Dagre layout, re-renders
```

---

### Path 4: Bookmark-Based Culling
```
User clicks "Cull to Bookmarks" in Actions module
  ↓
Actions calls store.cullAndMergeToBookmarks()
  ↓
Store builds keepSet:
  ↓
  Add all bookmarked node ids
  ↓
  For each bookmark, trace ancestors to root, add to keepSet
  ↓
  For each bookmark, add first child in each subtree to keepSet
  ↓
Store builds deleteSet: all node ids NOT in keepSet
  ↓
For each id in deleteSet:
  ↓
  Store calls deleteNode(id)
  ↓
  deleteNode removes from Map
  ↓
  deleteNode removes from parent.childIds
  ↓
  deleteNode recursively deletes orphaned children
  ↓
Store performs merge pass:
  ↓
  For each bookmarked node:
    ↓
    If node has single child:
      ↓
      Merge child into node (concatenate text, adopt grandchildren)
      ↓
      Delete child node
      ↓
Store schedules debounced save
  ↓
All components re-render with culled tree
```

---

## Event Flows

### Text Edit Event
```
Monaco onChange event
  → TextEditor handler
  → store.updateNodeText(nodeId, newText)
  → Store mutation
  → Debounce save timer
  → (After 500ms) saveTree → IPC → Disk
```

### Navigation Event
```
User clicks node in Tree module
  → TreeModule onClick handler
  → store.setCurrentNode(nodeId)
  → Store updates currentNodeId
  → TextEditor useEffect detects change
  → TextEditor recomputes branch text
  → TextEditor updates Monaco model
  → GraphModule useEffect detects change
  → GraphModule centers viewport on node
```

### Keyboard Shortcut Event
```
User presses Cmd+E
  → Document keydown listener
  → useKeybindings handler
  → Check if editor focused
  → Call expand logic
  → (Follow async expansion path)
```

### Agent Cancellation Event
```
User clicks Stop in Scout module
  → Scout module sets shouldStop.current = true
  → (Running agent checks shouldStop in loop)
  → Agent breaks loop
  → Agent cleanup: delete partial work, unlock nodes
  → Agent sets active = false
  → Scout module re-renders with stopped status
```

---

## Data Transformations

### Tree Serialization (Memory → Disk)
```typescript
// In memory
Tree {
  id: string
  name: string
  nodes: Map<string, TreeNode>
  rootId: string
  currentNodeId: string
  bookmarkedNodeIds: string[]
}

// Serialized to disk
{
  id: string
  name: string
  nodes: Array<[string, TreeNode]>  // Map entries as array
  rootId: string
  currentNodeId: string
  bookmarkedNodeIds: string[]
}

// Process
1. Call Array.from(tree.nodes.entries())
2. Wrap in JSON.stringify()
3. Write string to disk
```

### Tree Deserialization (Disk → Memory)
```typescript
// From disk
{
  id: string
  name: string
  nodes: Array<[string, TreeNode]>
  rootId: string
  currentNodeId: string
  bookmarkedNodeIds: string[]
}

// In memory
Tree {
  id: string
  name: string
  nodes: Map<string, TreeNode>
  rootId: string
  currentNodeId: string
  bookmarkedNodeIds: string[]
}

// Process
1. JSON.parse(fileContent)
2. Create new Map(parsed.nodes)
3. Return Tree object
```

### Branch Text Computation
```typescript
// Input: currentNodeId
// Output: Concatenated ancestor texts

function getBranchText(nodeId: string): string {
  const path = [];
  let current = nodeId;

  while (current !== null) {
    const node = tree.nodes.get(current);
    path.unshift(node.text);  // Prepend
    current = node.parentId;
  }

  return path.join('\n');
}
```

### ReactFlow Graph Transformation
```typescript
// Input: Tree with Map of nodes
// Output: ReactFlow nodes and edges

function treeToGraph(tree: Tree) {
  const nodes = Array.from(tree.nodes.values()).map(node => ({
    id: node.id,
    data: { label: node.text.substring(0, 50) },
    type: 'default',
    position: { x: 0, y: 0 }  // Dagre will compute
  }));

  const edges = Array.from(tree.nodes.values()).flatMap(node =>
    node.childIds.map(childId => ({
      id: `${node.id}-${childId}`,
      source: node.id,
      target: childId
    }))
  );

  return { nodes, edges };
}
```

---

## Concurrency and Locking

### Locking Discipline
**Purpose:** Prevent overlapping mutations on the same node

**Lock Reasons:**
- `'expanding'` - Manual user expansion
- `'scout-active'` - Scout agent processing
- `'witness-active'` - Witness agent pruning
- `'copilot-deciding'` - Copilot decision-making

**Protocol:**
1. Before mutation: `store.lockNode(nodeId, reason)`
2. Perform async operation (API call, computation)
3. Mutate tree via store actions
4. After mutation: `store.unlockNode(nodeId)` in finally block

**Enforcement:**
- Actions check `node.locked` before mutations
- If locked, throw error or skip silently
- UI shows lock indicators (spinners, disabled buttons)

### Parallel Requests
**Scenario:** Scout agent generates N continuations

**Implementation:**
```typescript
const continuations = await Promise.all(
  Array(branchingFactor).fill(null).map(() =>
    callContinuationModel(branchText, settings)
  )
);
```

**Characteristics:**
- Fire all N requests simultaneously
- Wait for all to complete (slowest determines latency)
- No rate limiting (rely on OpenRouter's limits)
- If one fails and retries exhaust, entire Promise.all rejects

### Agent Coordination
**Problem:** Prevent multiple agents from running simultaneously

**Solution:**
- Each agent type has `active` flag in store
- Before starting: check if any agent active
- If active: show error, don't start
- Agent sets active=true at start, active=false at end

**Cancellation:**
- Each agent receives `shouldStop` closure
- UI updates `shouldStop.current = true` on cancel
- Agent checks `shouldStop()` before each iteration
- On true: break loop, cleanup, set active=false

---

## Error Handling

### API Call Failures
**Retry Logic:**
- Up to 3 attempts per call
- Exponential backoff: 1s, 2s, 4s
- Retry on network errors and 5xx responses
- After 3 failures: bubble error to caller

**Caller Handling:**
- Expansion: delete new children, unlock node, show error
- Decisions: default to keep-first or cull-all, unlock, log error
- Agents: stop iteration, cleanup, set active=false, log error

### IPC Failures
**Scenarios:**
- File not found (loadTree)
- Permission denied (writeFile)
- Disk full (writeFile)

**Handling:**
- IPC returns error via rejected promise
- Caller shows error dialog to user
- State remains unchanged (no partial writes)

### Store Mutation Failures
**Scenarios:**
- Node not found (invalid ID)
- Lock conflict (already locked)
- Invariant violation (delete root, merge root)

**Handling:**
- Action throws error or returns early
- Error caught by caller
- UI shows error message
- State remains consistent (atomicity)

---

## Performance Considerations

### Debouncing
**Purpose:** Batch rapid mutations to reduce disk writes

**Implementation:**
- 500ms timer per tree
- Timer resets on each mutation
- After 500ms silence: trigger save
- beforeunload event flushes immediately

**Tradeoffs:**
- Pro: Reduces disk I/O, prevents SSD wear
- Con: Risk of data loss if crash within 500ms window

### Rendering Optimization
**React Memoization:**
- Components use selectors to subscribe to minimal state slices
- Zustand uses shallow equality for selector results
- React memo() for expensive components (Graph)
- useMemo() for expensive computations (getBranchText)

**Graph Layout:**
- Dagre layout runs on every render (no caching)
- Can stress CPU with large trees (1000+ nodes)
- Suggestion: Memoize layout based on tree structure hash

### Map vs Array
**Decision:** Use Map for nodes, Array for serialization

**Rationale:**
- Map provides O(1) lookups by ID
- Array provides O(n) lookups but JSON-serializable
- Tradeoff: Serialize/deserialize overhead vs runtime performance

---

## Undo/Redo Model (Not Implemented)

**Current State:**
- No undo/redo functionality
- All mutations are permanent (until next save)
- Users must rely on bookmarks and exports for safety

**Future Implementation (Command Pattern):**
```typescript
interface Command {
  execute(store: Store): void;
  undo(store: Store): void;
}

class AddNodeCommand implements Command {
  constructor(parentId: string, text: string) { ... }
  execute(store) { store.addNode(this.parentId, this.text); }
  undo(store) { store.deleteNode(this.nodeId); }
}

// Store maintains command history
undoStack: Command[] = [];
redoStack: Command[] = [];
```

**Challenges:**
- Agent operations are multi-step (hard to undo atomically)
- Async operations complicate undo (what if API call in progress?)
- Memory overhead for large command histories

---

## Where to Make Changes

### Adding new store actions
- **Location:** `src/store.ts`
- **Process:** Define action in store, ensure immutability, update TypeScript types

### Modifying persistence format
- **Location:** `src/utils/fileSystem.ts` (serialization/deserialization)
- **Process:** Add version field, write migration logic, test on old files

### Changing data flow for feature
- **Example:** Add streaming LLM responses
- **Changes:**
  1. Modify `openrouter.ts` to handle SSE
  2. Update store actions to accept partial text
  3. Update TextEditor to show streaming updates
  4. Add UI for streaming progress

### Optimizing graph rendering
- **Location:** `src/components/modules/Graph.tsx`
- **Changes:**
  1. Memoize Dagre layout based on tree hash
  2. Virtualize ReactFlow for large trees
  3. Add layout caching to store

### Implementing undo/redo
- **Locations:** `src/store.ts`, `src/hooks/useKeybindings.ts`
- **Changes:**
  1. Define Command interface
  2. Wrap all store actions in command pattern
  3. Add undo/redo stack to store
  4. Add Cmd+Z and Cmd+Shift+Z keybindings
  5. Handle async command cancellation
