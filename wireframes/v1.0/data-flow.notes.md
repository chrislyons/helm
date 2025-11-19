# Data Flow - Extended Documentation

## Overview

Helm implements a unidirectional data flow pattern centered on a Zustand store. All state lives in the store, components subscribe to relevant slices, and mutations flow through store actions. This architecture provides predictable state updates and simplifies debugging.

---

## Primary Data Flow Patterns

### 1. User Input → Store → Component Re-render

The most common pattern for UI interactions.

```
User Input (key/mouse)
    ↓
Event Handler (component)
    ↓
Store Action (mutation)
    ↓
State Update (immutable)
    ↓
Subscriber Notification
    ↓
Component Re-render
```

**Example: Node Selection**
1. User clicks node in Tree module
2. `onClick` handler calls `setCurrentNode(nodeId)`
3. Store updates `currentTree.currentNodeId`
4. TextEditor, Graph, Tree re-render with new selection

### 2. Store → Business Logic → External API → Store

Pattern for operations requiring external services.

```
Store State (input)
    ↓
Business Logic (orchestration)
    ↓
External API (OpenRouter)
    ↓
Response Processing
    ↓
Store Mutation (output)
```

**Example: Node Expansion**
1. Store provides current node text and context
2. `expandNode()` calls OpenRouter continuation model
3. API returns generated text variations
4. Function calls `addNode()` for each variation
5. Store updates, UI re-renders with new children

### 3. Store → Persistence Layer

Pattern for data durability.

```
Store Mutation
    ↓
Debounce Timer (500ms)
    ↓
Serialization (Map → JSON)
    ↓
IPC Call (preload bridge)
    ↓
File System Write
```

---

## State Slices and Data Shapes

### Tree State

**Primary Data Structure: TreeNode**
```typescript
{
  id: string,           // UUID
  text: string,         // Node content
  parentId: string | null,
  childIds: string[],
  locked: boolean,
  lockReason?: 'expanding' | 'scout-active' | 'witness-active' | 'copilot-deciding'
}
```

**Tree Container**
```typescript
{
  id: string,           // Workspace ID
  name: string,         // Display name
  nodes: Map<string, TreeNode>,
  rootId: string,
  currentNodeId: string,
  bookmarkedNodeIds: string[]
}
```

**Flow Characteristics**:
- Nodes stored in Map for O(1) lookup
- Parent/child relationships via ID references
- Bookmarks as separate array for efficient membership checks
- Locking prevents concurrent modifications

### Agent State

**ScoutConfig**
```typescript
{
  id: string,
  name: string,
  type: 'Scout' | 'Witness' | 'Campaign',
  instructions: string,
  vision: number,       // Parent context depth
  range: number,        // Branching factor
  depth: number,        // Max exploration depth
  active: boolean,
  activeNodeId: string | null,
  outputs: string[],    // Decision log
  buttonNumber?: number // Hotkey binding
}
```

**Flow Characteristics**:
- Configs persisted to localStorage
- Active state tracks execution
- Outputs accumulate during run

### Application State

**Settings**
```typescript
{
  apiKey: string,
  continuations: {
    modelName: string,
    temperature: number,
    topP: number,
    maxTokens: number,
    branchingFactor: number
  },
  assistant: {
    modelName: string,
    temperature: number,
    topP: number,
    maxTokens: number
  }
}
```

**Flow Characteristics**:
- Persisted to localStorage immediately
- Read on app initialization
- Model parameters affect all API calls

---

## Component Data Subscriptions

### TextEditor
**Subscribes to**:
- `currentTree.currentNodeId` - Which node to edit
- `currentTree.nodes` - For `getBranchText()`
- `settings.font*` - Display preferences

**Produces**:
- `updateNodeText(nodeId, text)` - On change
- Debounced save trigger

### Tree Module
**Subscribes to**:
- `currentTree.nodes` - For rendering hierarchy
- `currentTree.rootId` - Starting point
- `currentTree.currentNodeId` - Highlight current
- `currentTree.bookmarkedNodeIds` - Show indicators

**Produces**:
- `setCurrentNode(nodeId)` - On click

### Graph Module
**Subscribes to**:
- `currentTree.nodes` - Build graph data
- `currentTree.currentNodeId` - Highlight current

**Produces**:
- `setCurrentNode(nodeId)` - On node click

### Scout Module
**Subscribes to**:
- `scouts` - Agent configurations
- `scouts[i].active` - Running state
- `scouts[i].outputs` - Decision log

**Produces**:
- `addScout()`, `updateScout()`, `deleteScout()`
- `scoutStartRequest` flag

---

## Agent Data Flows

### Scout Execution Flow

```
1. User starts Scout
   ↓
2. Set scoutStartRequest flag
   ↓
3. runScout() reads config
   ↓
4. Lock current node
   ↓
5. Build context (vision parents)
   ↓
6. Call assistant model for decision
   ↓
7. Parse response (expand/cull)
   ↓
8. If expand:
   - Call continuation model (range times)
   - addNode() for each child
   - Recurse on children (depth times)
   ↓
9. Unlock node
   ↓
10. Update outputs in config
```

### Witness Execution Flow

```
1. User starts Witness
   ↓
2. For each node with siblings:
   ↓
3. Build sibling context
   ↓
4. Call assistant model for choice
   ↓
5. Parse response (chosen index)
   ↓
6. Merge unchosen siblings into chosen
   ↓
7. Continue to children
```

### Copilot Flow

```
1. User manually expands node
   ↓
2. If copilot.expansionEnabled:
   ↓
3. Queue runCopilotOnNode()
   ↓
4. Breadth-first through new children
   ↓
5. Scout-like decision for each
   ↓
6. Prune low-quality branches
```

---

## Persistence Data Flows

### Save Flow (Debounced)

```
Tree Mutation
    ↓
Schedule save (500ms debounce)
    ↓
If timer fires:
    ↓
Serialize tree:
  - Map<id, node> → Array<node>
  - JSON.stringify()
    ↓
window.electronAPI.writeFile()
    ↓
IPC to main process
    ↓
fs.writeFileSync()
```

### Load Flow

```
App initialization or tree select
    ↓
window.electronAPI.readFile()
    ↓
IPC to main process
    ↓
fs.readFileSync()
    ↓
JSON.parse()
    ↓
Array<node> → Map<id, node>
    ↓
Store setState()
```

### Settings Flow

```
Settings change
    ↓
updateSettings() action
    ↓
Store mutation
    ↓
localStorage.setItem('helm-settings', JSON.stringify())

App initialization
    ↓
localStorage.getItem('helm-settings')
    ↓
JSON.parse()
    ↓
Store initial state
```

---

## Event Flows

### Keyboard Event Flow

```
Document keydown event
    ↓
useKeybindings listener
    ↓
Match key combination
    ↓
Call appropriate action:
  - Navigation: setCurrentNode()
  - Expand: expandNode()
  - Bookmark: toggleBookmark()
  - Agent: scoutStartRequest
```

### Agent Invoke Modal Flow

```
Ctrl/Cmd+X pressed
    ↓
Show overlay with agent buttons
    ↓
User presses 1-9
    ↓
Find scout with buttonNumber
    ↓
Set scoutStartRequest
    ↓
Hide overlay
```

---

## Data Transformation Points

### Tree Serialization
- **In Memory**: `Map<string, TreeNode>`
- **On Disk**: `TreeNode[]` (JSON array)
- **Transform**: `Array.from(nodes.values())` / `new Map(nodes.map(n => [n.id, n]))`

### Context Building
- **Input**: Current node + vision depth
- **Output**: Concatenated parent text with markers
- **Transform**: Walk parent chain, join with delimiters

### Graph Layout
- **Input**: `Map<string, TreeNode>`
- **Output**: ReactFlow nodes/edges with positions
- **Transform**: Dagre layout algorithm

---

## Performance Considerations

### Reactive Updates
- Zustand uses shallow comparison for subscriptions
- Fine-grained selectors minimize re-renders
- Example: `useStore(s => s.currentTree.currentNodeId)` only updates on ID change

### Debouncing
- Saves debounced to prevent disk thrashing
- 500ms window batches rapid edits
- Flush on window close via `beforeunload`

### Parallelism
- Node expansion runs `Promise.all()` for children
- No rate limiting (can overwhelm API)
- Each child gets own continuation call

---

## Error Handling

### API Failures
- Retry with exponential backoff (3 attempts)
- On exhaustion: Unlock node, log error
- No user notification (silent failure)

### Persistence Failures
- File write failures logged to console
- No retry mechanism
- Data may be lost on crash

### State Inconsistencies
- Orphan nodes possible if crash during mutation
- No automatic cleanup
- Manual recovery via tree re-import

---

## References

- [DATAFLOW.md](../../docs/DATAFLOW.md) - Original data flow documentation
- [RUNTIME-SEQUENCE.md](../../docs/RUNTIME-SEQUENCE.md) - Execution sequences
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System design context
