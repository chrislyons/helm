# Component Map - Detailed Notes

## Overview
Helm's component architecture follows a strict unidirectional data flow pattern with a single Zustand store as the source of truth. Components are organized into three categories: layout containers, feature modules, and utility layers. All state mutations go through store actions, and components use selectors to read only the slices they need.

## Component Responsibilities

### Core Components

#### **Store (src/store.ts)**
The central state management hub containing all application state.

**State Sections:**
- `trees: Map<string, Tree>` - All loaded workspaces
- `currentTree: Tree | null` - Active workspace with full node map
- `scouts: ScoutConfig[]` - Agent presets with button assignments
- `copilot: CopilotConfig` - Automated follow-up settings
- `settings: Settings` - API keys and model parameters
- `leftPanel / rightPanel / ribbonWindow` - UI layout state
- `bottomPanelHeight` - Resizable panel height

**Tree Mutation Actions:**
- `selectTree(id)` - Switch active workspace
- `setCurrentNode(id)` - Update editor focus
- `updateNodeText(id, text)` - Modify node content
- `lockNode(id, reason)` - Prevent concurrent modifications
- `unlockNode(id)` - Release lock
- `addNode(parentId, text)` - Create new child
- `deleteNode(id)` - Remove node and orphaned descendants
- `splitNodeAt(id, offset)` - Split node at cursor position
- `mergeWithParent(id)` - Collapse child into parent
- `massMerge()` - Collapse linear chains bottom-up
- `toggleBookmark(id)` - Mark/unmark anchor points
- `cullAndMergeToBookmarks()` - Delete non-bookmarked branches

**Workspace Actions:**
- `createTree(name)` - Initialize new empty tree
- `renameTree(id, name)` - Update workspace name
- `deleteTree(id)` - Remove workspace from storage
- `loadTreeList()` - Enumerate available workspaces

**Agent Actions:**
- `addScout(config)` - Create new agent preset
- `updateScout(id, config)` - Modify agent settings
- `deleteScout(id)` - Remove agent preset
- `addScoutOutput(text)` - Log agent activity
- `requestScoutStart(id)` - Queue agent invocation

**Settings Actions:**
- `updateSettings(partial)` - Update API keys and model params
- `updateCopilot(partial)` - Modify copilot config

**Persistence:**
- Debounced tree saves (500ms delay)
- Immediate localStorage saves for settings/layout
- beforeunload handler flushes pending saves

**Store Dependencies:**
- No external dependencies (pure state management)
- Imported by all components and utilities
- Accessed via `useStore` hook or `useStore.getState()`

---

#### **App (src/App.tsx)**
Root layout component that assembles the application shell.

**Responsibilities:**
- Arrange layout: left panel, editor, right panel, ribbon, bottom panel
- Wire up `useKeybindings` hook for global shortcuts
- Display agent invocation overlay when Cmd+X pressed
- Manage graph maximize state (via ref to StatusRibbon)

**Store Dependencies:**
- `scouts` - Display agent hotkeys in overlay
- `bottomPanelHeight` - Control resizable panel
- `ribbonWindow` - Determine bottom panel content

**Children:**
- Header (workspace management)
- LeftPanel (configurable module)
- TextEditor (Monaco editor)
- RightPanel (configurable module)
- BottomPanel (help or graph)
- StatusRibbon (controls)

---

### Layout Components

#### **Header (src/components/Header.tsx)**
Top navigation bar for workspace management.

**Responsibilities:**
- Workspace dropdown (select from available trees)
- Create new tree (prompts for name)
- Rename current tree (inline edit)
- Delete current tree (with confirmation)
- Extract subtree (export branch as new tree)
- Import tree (file picker for JSON)
- Export tree (save to filesystem)

**Store Dependencies:**
- `trees` - List available workspaces
- `currentTree` - Show active workspace name
- `selectTree` - Switch workspace
- `createTree` - Initialize new tree
- `renameTree` - Update workspace name
- `deleteTree` - Remove workspace

**Utility Dependencies:**
- `fileSystem.loadTreeList()` - Refresh workspace list
- `fileSystem.extractSubtree()` - Export branch
- `fileSystem.importTree()` - Load external tree

---

#### **LeftPanel / RightPanel (src/components/LeftPanel.tsx, RightPanel.tsx)**
Configurable module containers.

**Responsibilities:**
- Display current module (Tree, Graph, Scout, Copilot, Actions, Settings)
- Provide module switcher dropdown
- Persist panel configuration to localStorage

**Store Dependencies:**
- `leftPanel` / `rightPanel` - Read current module selection
- `updatePanels` - Switch active module

**Swappable Modules:**
- TreeModule - Hierarchical navigation
- GraphModule - Visual graph view
- ScoutModule - Agent management
- CopilotModule - Autonomous assistant config
- ActionsModule - Manual tree operations
- SettingsModule - API and model config

---

#### **BottomPanel (src/components/BottomPanel.tsx)**
Resizable panel at bottom of screen.

**Responsibilities:**
- Display help content (keyboard shortcuts, tips)
- Embed graph view when ribbon window is 'graph'
- Collapse/expand based on ribbonWindow state

**Store Dependencies:**
- `currentTree` - Pass to embedded graph
- `ribbonWindow` - Determine content ('help' or 'graph')

---

#### **StatusRibbon (src/components/StatusRibbon.tsx)**
Bottom status bar with controls.

**Responsibilities:**
- Font size controls (+ / - buttons)
- Ribbon window toggle (help ↔ graph)
- Help trigger button
- Expose graph maximize function to App

**Store Dependencies:**
- `ribbonWindow` - Read/write current state
- `setRibbonWindow` - Toggle help/graph
- `currentTree` - Display current tree info

---

### Editor Component

#### **TextEditor (src/components/TextEditor.tsx)**
Monaco editor wrapper for branch text editing.

**Responsibilities:**
- Display full branch text (ancestors + current node)
- Make only current node region editable (ancestors read-only)
- Register platform-specific keybindings (split, merge, expand)
- Show agent trigger overlay when Cmd+X pressed
- Sync Monaco content with store on node selection change
- Trigger Copilot after manual expand if enabled

**Store Dependencies:**
- `currentTree` - Read node text and compute branch
- `updateNodeText` - Save edits
- `lockNode` / `unlockNode` - Protect mutations
- `addNode` - Create children during expand
- `splitNodeAt` - Split at cursor
- `mergeWithParent` - Collapse into parent
- `massMerge` - Chain collapse
- `deleteNode` - Remove node
- `toggleBookmark` - Mark anchor
- `settings` - Model config and branching factor
- `addCopilotOutput` - Log copilot decisions

**Key Behaviors:**
- Branch text computed via `getBranchText` (concatenates ancestors)
- Read-only regions enforced via Monaco's `readOnly` ranges
- Keybindings registered via `editor.addCommand`
- Debounced text updates to avoid excessive store mutations

---

### Feature Modules

#### **TreeModule (src/components/modules/Tree.tsx)**
Hierarchical tree view for navigation.

**Responsibilities:**
- Display tree structure as nested list
- Indicate current node (highlight)
- Show bookmark indicators (star icon)
- Show scout activity markers (spinner/lock icon)
- Allow click-to-select navigation
- Provide bookmark toggle button per node

**Store Dependencies:**
- `currentTree` - Read tree structure
- `setCurrentNode` - Navigate to node
- `scouts` - Show active agent indicators
- `toggleBookmark` - Mark/unmark nodes

**UI Patterns:**
- Recursive component for nested rendering
- Depth-first traversal for display order
- Visual indentation for hierarchy

---

#### **GraphModule (src/components/modules/Graph.tsx)**
ReactFlow visualization with automatic layout.

**Responsibilities:**
- Render tree as directed acyclic graph
- Auto-layout using Dagre algorithm
- Highlight current node
- Show campaign agent paths (highlighted edges)
- Provide zoom controls (fit, zoom in, zoom out)
- Auto-fit viewport when selection changes
- Click nodes to navigate

**Store Dependencies:**
- `currentTree` - Convert to ReactFlow nodes/edges
- `setCurrentNode` - Navigate on click
- `scouts` - Highlight campaign paths

**Layout Algorithm:**
- Dagre with `rankdir: 'TB'` (top to bottom)
- Node spacing: 150 horizontal, 100 vertical
- Runs on every render (no memoization)
- Can stress renderer with large trees (1000+ nodes)

---

#### **ScoutModule (src/components/modules/Scout.tsx)**
Agent preset management and execution.

**Responsibilities:**
- CRUD for agent presets (Scout, Witness, Campaign)
- Configure agent parameters (vision, range, depth, cycles)
- Assign hotkeys (1-9 buttons)
- Start/Stop agent execution
- Display agent output log
- Show active agent status

**Store Dependencies:**
- `currentTree` - Target tree for agent runs
- `settings` - Model config
- `scouts` - Agent presets
- `addScout` / `updateScout` / `deleteScout` - Preset management
- `addScoutOutput` - Log messages
- `scoutStartRequest` - Queue execution
- `clearScoutStartRequest` - Clear queue
- Tree mutation actions - Pass to agent utils

**Agent Lifecycle:**
1. User clicks Start or presses Cmd+X → number
2. Module calls `runScout` / `runWitness` / `runCampaign`
3. Agent locks nodes, generates continuations, makes decisions
4. Store updated via passed action callbacks
5. shouldStop closure checked for cancellation
6. Agent unlocks nodes and sets active=false

---

#### **CopilotModule (src/components/modules/Copilot.tsx)**
Automated follow-up assistant configuration.

**Responsibilities:**
- Enable/disable copilot
- Edit custom instructions
- Configure vision, range, depth
- Toggle expansion feature
- Display latest copilot output

**Store Dependencies:**
- `copilot` - Read/write config
- `updateCopilot` - Save changes

**Copilot Trigger:**
- Not triggered from this module
- Triggered by TextEditor after manual expand
- Uses same agent utils as Scout

---

#### **ActionsModule (src/components/modules/Actions.tsx)**
Manual tree operation controls.

**Responsibilities:**
- Manual expand button (generate N children)
- Cull and merge to bookmarks
- Mass merge linear chains
- Import/Export tree JSON
- Automatic bookmark configuration (depth-based, leaf-based)
- Extract subtree to new tree

**Store Dependencies:**
- Tree mutation actions (all of them)
- `settings` - Branching factor
- `updateSettings` - Modify branching factor
- `automaticBookmarkConfig` - Auto-bookmark settings

**Utility Dependencies:**
- `AgentUtils.runScout` - Manual expand uses scout logic
- `FileSystemUtils` - Import/Export/Extract

---

#### **SettingsModule (src/components/modules/Settings.tsx)**
API and model configuration.

**Responsibilities:**
- OpenRouter API key input
- Continuation model selection and parameters
- Assistant model selection and parameters
- Branching factor (N continuations per expand)
- Model temperature and max tokens

**Store Dependencies:**
- `settings` - Read/write all settings
- `updateSettings` - Save changes

**Persistence:**
- Saved to localStorage immediately on change
- Loaded on app startup

---

### Utility Layer

#### **useKeybindings (src/hooks/useKeybindings.ts)**
Global keyboard shortcut handler.

**Responsibilities:**
- Navigation: ArrowUp/Down (sibling nav), ArrowLeft/Right (parent/child nav)
- Editing: Cmd+Shift+S (split), Cmd+Shift+M (merge), Cmd+Shift+K (mass merge)
- Bookmarks: Cmd+B (toggle bookmark)
- Deletion: Cmd+Backspace (delete node)
- Expansion: Cmd+E (manual expand with copilot trigger)
- Agents: Cmd+X (show agent selector), 1-9 (invoke preset)

**Store Dependencies:**
- `currentTree` - Read current selection
- `settings` - Expansion config
- `scouts` - Agent presets
- All tree mutation actions
- `requestScoutStart` - Queue agent

**Implementation Details:**
- Uses `useEffect` with `keydown` listener
- Prevents default browser shortcuts
- Uses `useStore.getState()` in async callbacks (avoid stale closures)
- scoutInvokeMode state controls agent selector overlay

---

#### **AgentUtils (src/utils/agents.ts)**
Agent orchestration and branching logic.

**Responsibilities:**
- `runScout(config, store, shouldStop)` - Depth-first expansion
- `runWitness(config, store, shouldStop)` - Sibling pruning
- `runCampaign(config, store, shouldStop)` - Alternating Scout/Witness
- `runCopilotOnNode(config, store, shouldStop)` - Automated follow-up
- Locking discipline (acquire before mutate, release always)
- Branching heuristics (parallel requests, decision prompts)
- Pruning logic (compare siblings, keep best)
- Cancellation handling (cleanup on stop)

**Dependencies:**
- `OpenRouterClient` - Generate continuations and decisions
- Store actions - Mutate tree state
- Prompt templates from `prompts.json`

**Concurrency:**
- Uses `Promise.all` for parallel continuation requests
- No rate limiting (rely on OpenRouter)
- Locks prevent overlapping mutations on same node

**Error Handling:**
- Retries via OpenRouterClient
- Failed expansions → delete new children
- Failed decisions → default to cull or keep-first
- Always unlock nodes in finally blocks

---

#### **FileSystemUtils (src/utils/fileSystem.ts)**
Filesystem abstraction over Electron IPC.

**Responsibilities:**
- `loadTreeList()` - Enumerate trees from userData/trees/
- `loadTree(id)` - Deserialize JSON to Tree object
- `saveTree(tree)` - Serialize Tree to JSON
- `createTree(name)` - Initialize new empty tree
- `renameTree(id, name)` - Update tree filename
- `deleteTree(id)` - Remove tree file
- `extractSubtree(nodeId)` - Export branch as new tree
- `importTree(path)` - Load external tree JSON

**Serialization:**
- Maps → arrays (JSON compatible)
- Arrays → Maps (runtime performance)
- Handles missing fields gracefully

**IPC Calls:**
- All calls go through `window.electronAPI`
- Async wrappers over synchronous Node.js fs operations
- Error handling with try/catch

---

#### **OpenRouterClient (src/utils/openrouter.ts)**
HTTP client for LLM API calls.

**Responsibilities:**
- `callContinuationModel(prompt, settings)` - Generate text
- `callAssistantModel(prompt, settings)` - Generate decisions
- `withRetry(fn, maxRetries=3)` - Exponential backoff
- Header injection (Authorization, HTTP-Referer, X-Title)
- Response parsing (choices[0].message.content with fallback to .text)

**Retry Logic:**
- 3 attempts max
- Exponential backoff: 1s, 2s, 4s
- Retries on network errors and 5xx responses
- Bubbles up after max retries

**Request Format:**
```json
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [{"role": "user", "content": "..."}],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

---

## Component Interaction Patterns

### Module Swapping
- LeftPanel and RightPanel read `leftPanel` / `rightPanel` state
- Each module is a self-contained component
- Panel state persisted to localStorage
- Switching panels re-mounts component (loses transient state)

### Store Access Patterns
- **React components:** Use `useStore(state => state.field)` selectors
- **Async callbacks:** Use `useStore.getState().action()` for latest state
- **Mutations:** Always through store actions, never direct property access

### Event Flow
1. User action (click, keyboard, text edit)
2. Component calls store action
3. Store mutates state (immutably)
4. All subscribed components re-render
5. Effects run (e.g., debounced save)

### Locking Protocol
1. Call `lockNode(id, reason)` before mutation
2. Perform async operation (API call, computation)
3. Mutate tree via store action
4. Call `unlockNode(id)` in finally block

### Agent Coordination
- Agents receive shouldStop closure (mutable ref)
- UI updates shouldStop.current = true on cancel
- Agents check shouldStop before each iteration
- Cleanup: delete new children, unlock nodes, set active=false

---

## Public APIs

### Store Actions (used by components)
```typescript
// Navigation
setCurrentNode(nodeId: string)
selectTree(treeId: string)

// Text editing
updateNodeText(nodeId: string, text: string)

// Structure editing
addNode(parentId: string, text: string): string
deleteNode(nodeId: string)
splitNodeAt(nodeId: string, offset: number)
mergeWithParent(nodeId: string)
massMerge()

// Bookmarks
toggleBookmark(nodeId: string)
cullAndMergeToBookmarks()

// Locking
lockNode(nodeId: string, reason: LockReason)
unlockNode(nodeId: string)

// Workspace
createTree(name: string)
renameTree(treeId: string, name: string)
deleteTree(treeId: string)
loadTreeList()

// Agents
addScout(config: ScoutConfig)
updateScout(id: string, config: ScoutConfig)
deleteScout(id: string)
requestScoutStart(id: string)

// Settings
updateSettings(partial: Partial<Settings>)
updateCopilot(partial: Partial<CopilotConfig>)
```

### Agent Utils API (used by modules and hooks)
```typescript
async runScout(
  config: ScoutConfig,
  storeActions: StoreActions,
  shouldStop: () => boolean
): Promise<void>

async runWitness(config: ScoutConfig, ...): Promise<void>
async runCampaign(config: ScoutConfig, ...): Promise<void>
async runCopilotOnNode(nodeId: string, ...): Promise<void>
```

### FileSystem Utils API (used by Header and Actions)
```typescript
async loadTreeList(): Promise<string[]>
async loadTree(id: string): Promise<Tree>
async saveTree(tree: Tree): Promise<void>
async createTree(name: string): Promise<string>
async renameTree(id: string, name: string): Promise<void>
async deleteTree(id: string): Promise<void>
async extractSubtree(nodeId: string, tree: Tree): Promise<void>
async importTree(path: string): Promise<Tree>
```

---

## Where to Make Changes

### Adding a new UI feature
- **New panel:** Create in `src/components/modules/`, add to panel switcher
- **Layout change:** Modify `src/App.tsx` or panel components
- **New control:** Add to existing module or StatusRibbon

### Modifying tree operations
- **Store mutation:** Add/modify action in `src/store.ts`
- **UI trigger:** Add button in ActionsModule or keybinding in useKeybindings
- **Validation:** Add invariant checks in store action

### Changing agent behavior
- **Algorithm:** Modify `src/utils/agents.ts` (runScout/Witness/Campaign)
- **Prompts:** Edit `prompts.json`
- **Config:** Add field to ScoutConfig in `src/types.ts`
- **UI:** Update ScoutModule for new config fields

### Integrating a new LLM provider
- **Client:** Modify `src/utils/openrouter.ts` or create new client
- **Settings:** Add provider config to Settings type
- **UI:** Update SettingsModule with provider selection

### Improving persistence
- **Serialization:** Modify FileSystemUtils (src/utils/fileSystem.ts)
- **Debouncing:** Adjust `TREE_SAVE_DEBOUNCE_MS` in store
- **Format migration:** Add version field and migration logic

---

## Common Workflows

### User navigates tree
1. User clicks node in TreeModule or GraphModule
2. Module calls `setCurrentNode(nodeId)`
3. Store updates `currentTree.currentNodeId`
4. TextEditor effect runs, recomputes branch text, updates Monaco
5. GraphModule re-renders with new highlight

### User expands node
1. User presses Cmd+E in TextEditor
2. useKeybindings calls expand logic
3. Store locks node
4. OpenRouter generates N continuations
5. Store adds N child nodes
6. If copilot enabled, runCopilotOnNode executes
7. Store unlocks node
8. TreeModule and GraphModule re-render

### User runs Scout agent
1. User presses Cmd+X → 1 (for preset 1)
2. useKeybindings calls `requestScoutStart('1')`
3. ScoutModule detects request, starts agent
4. runScout performs depth-first expansion
5. Agent updates store via passed actions
6. ScoutModule displays output log
7. Agent completes, sets active=false

### User saves workspace
1. User edits text in TextEditor
2. onChange calls `updateNodeText(id, text)`
3. Store updates node.text
4. Store schedules debounced save (500ms)
5. After delay, saveTree serializes to JSON
6. FileSystemUtils writes to userData/trees/

---

## Shared Utilities

### getBranchText
Concatenates ancestor texts from root to current node.

**Used by:**
- TextEditor (display full context)
- OpenRouter prompts (include ancestry)

### getNodeDepth
Calculates distance from root.

**Used by:**
- Agents (depth limiting)
- Automatic bookmarks (depth-based marking)

### getDescendants
Recursively collects all child nodes.

**Used by:**
- Delete (remove orphans)
- Extract subtree (export branch)
- Cull operations (identify keep-set)

---

## Component Testing Strategy

### Unit Tests
- Store actions (mutation logic)
- Serialization helpers (Map ↔ array)
- Agent decision logic (Scout/Witness)
- OpenRouter retry logic

### Integration Tests
- Tree operations (add, delete, split, merge)
- Agent workflows (Scout → Witness → Campaign)
- Persistence (save → load → verify)

### E2E Tests
- User flows (create tree → expand → bookmark → cull)
- Keyboard shortcuts (navigation, editing, agents)
- Module switching (panel configuration)

See `docs/TEST-PLAN.md` for regression scaffolds.
