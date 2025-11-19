# Component Map Notes

## Overview

Helm's React components follow a hierarchical structure with the App component as the root. Components subscribe to the Zustand store for state and dispatch actions to modify state.

## Component Hierarchy

### Root Component

**App.tsx**
- Root layout shell managing the grid layout
- Renders all major sections
- Subscribes to: `scouts`, `bottomPanelHeight`, `ribbonWindow`, `leftPanel`, `rightPanel`

### Layout Components

#### Header.tsx
**Purpose:** Workspace selector with tree CRUD operations

**Store Dependencies:**
- `trees` - List of available tree IDs
- `currentTree` - Currently loaded tree
- `createTree()` - Create new workspace
- `selectTree()` - Switch workspace
- `renameTree()` - Rename current workspace
- `deleteTree()` - Delete workspace

**Key Features:**
- Dropdown menu with tree list
- Create/rename/delete buttons
- Shows current tree name

#### LeftPanel.tsx / RightPanel.tsx
**Purpose:** Swappable module containers

**Store Dependencies:**
- `leftPanel` / `rightPanel` - Panel configuration
- `updatePanels()` - Update panel configuration

**Key Features:**
- Top and bottom slots for modules
- Module selector dropdowns
- Consistent rendering logic

#### BottomPanel.tsx
**Purpose:** Expandable panel for Help/Graph

**Store Dependencies:**
- `bottomPanelHeight` - Height as percentage
- `ribbonWindow` - Current view mode

**Key Features:**
- Conditional rendering based on `ribbonWindow`
- Resizable via drag
- Contains Help or Graph content

#### StatusRibbon.tsx
**Purpose:** Controls and indicators below editor

**Store Dependencies:**
- `ribbonWindow` - Current ribbon mode
- `setRibbonWindow()` - Toggle ribbon content

**Key Features:**
- Font size controls
- Help/Graph toggle
- Mode indicators

### Core Components

#### TextEditor.tsx
**Purpose:** Monaco Editor wrapper with custom keybindings

**Store Dependencies:**
- `currentTree` - Current tree data
- `settings` - Model settings
- `copilot` - Copilot configuration
- `updateNodeText()` - Update node content
- `setCurrentNode()` - Navigate nodes
- `addNode()` - Create child nodes
- `deleteNode()` - Remove nodes
- `lockNode()` / `unlockNode()` - Locking

**Key Features:**
- Monaco Editor integration
- Custom keybindings (Alt+Arrow, etc.)
- Branch text display (path from root)
- Expansion trigger (Ctrl+Enter)
- Read-only decorations for parent content

**Dependencies:**
- `agents.ts` - For `expandNode()` and `runCopilotOnNode()`
- `useKeybindings.ts` - Global shortcuts

### Swappable Modules

These modules can be placed in any panel slot (left/right, top/bottom).

#### TreeModule (Tree.tsx)
**Purpose:** Hierarchical tree view

**Store Dependencies:**
- `currentTree` - Tree data
- `setCurrentNode()` - Node selection
- `toggleBookmark()` - Bookmark management

**Key Features:**
- Nested node display
- Visual bookmark indicators
- Click to select
- Collapse/expand branches

#### GraphModule (Graph.tsx)
**Purpose:** DAG visualization

**Store Dependencies:**
- `currentTree` - Tree data
- `scouts` - Active agents
- `setCurrentNode()` - Node selection

**Key Features:**
- ReactFlow rendering
- Dagre auto-layout
- Highlighted active agent nodes
- Pan/zoom controls
- Auto-fit on selection change

#### ScoutModule (Scout.tsx)
**Purpose:** Agent CRUD and lifecycle management

**Store Dependencies:**
- `currentTree` - For node context
- `scouts` - Agent list
- `scoutStartRequest` - Pending start request
- `addScout()` - Create agent
- `updateScout()` - Modify agent
- `deleteScout()` - Remove agent
- `requestScoutStart()` - Trigger agent start
- `clearScoutStartRequest()` - Clear request

**Key Features:**
- Agent type selection (Scout/Witness/Campaign)
- Configuration UI (vision, range, depth)
- Start/stop controls
- Output log display
- Button number assignment (1-9)

**Dependencies:**
- `agents.ts` - For `runScout()`, `runWitness()`, `runCampaign()`

#### CopilotModule (Copilot.tsx)
**Purpose:** Auto-QC settings

**Store Dependencies:**
- `copilot` - Copilot configuration
- `updateCopilot()` - Modify settings

**Key Features:**
- Enable/disable toggle
- Expansion toggle
- Instructions text area
- Parameter sliders (vision, range, depth)

#### ActionsModule (Actions.tsx)
**Purpose:** Batch tree operations

**Store Dependencies:**
- `currentTree` - Tree data
- `settings` - For expansion settings
- `automaticBookmarkConfig` - Bookmark criteria
- `massMerge()` - Merge single-child chains
- `cullAndMergeToBookmarks()` - Prune to bookmarks

**Key Features:**
- Expand current node button
- Mass merge button
- Cull to bookmarks button
- Import/export functionality
- Automatic bookmark settings

#### SettingsModule (Settings.tsx)
**Purpose:** API and model configuration

**Store Dependencies:**
- `settings` - Settings object
- `updateSettings()` - Modify settings

**Key Features:**
- API key input (masked)
- Model name inputs
- Temperature sliders
- Top-p sliders
- Max tokens inputs
- Branching factor input

## Utility Modules

### agents.ts

**Exports:**
- `runScout(startNodeId, scout, shouldStop)` - Scout algorithm
- `runWitness(startNodeId, witness, shouldStop)` - Witness algorithm
- `runCampaign(startNodeId, campaign, shouldStop)` - Campaign algorithm
- `runCopilotOnNode(nodeId)` - Copilot auto-QC
- `expandNode(nodeId)` - Single expansion

**Dependencies:**
- `openrouter.ts` - API calls
- `fileSystem.ts` - Branch text retrieval
- `useStore.getState()` - Direct state access

### openrouter.ts

**Exports:**
- `callContinuationModel(branchText, settings)` - Text generation
- `callAssistantModel(system, user, settings)` - Decision making

**Features:**
- `withRetry()` wrapper (3 retries, exponential backoff)
- Response parsing
- Error handling

### fileSystem.ts

**Exports:**
- `saveTree(tree)` - Persist tree to file
- `loadTree(treeId)` - Load tree from file
- `createNewTree(name)` - Create new tree
- `deleteTree(treeId)` - Delete tree directory
- `renameTree(oldId, newName)` - Rename tree
- `extractSubtree(tree, nodeId, name)` - Extract subtree
- `getTreeListAsync()` - List all trees
- `getBranchText(tree, nodeId, vision)` - Get ancestor text

**Features:**
- Map↔Array serialization
- IPC abstraction via `window.electronAPI`

### useKeybindings.ts

**Registered Shortcuts:**

| Shortcut | Action |
|----------|--------|
| Alt+ArrowUp | Navigate to parent |
| Alt+ArrowDown | Navigate to first child |
| Alt+ArrowLeft | Navigate to previous sibling |
| Alt+ArrowRight | Navigate to next sibling |
| Alt+Shift+ArrowUp | Previous bookmark (sequence) |
| Alt+Shift+ArrowDown | Next bookmark (sequence) |
| Alt+Shift+ArrowLeft | Ancestor bookmark |
| Alt+Shift+ArrowRight | Descendant bookmark |
| Alt+Backspace | Delete current node |
| Ctrl/Alt+M | Toggle bookmark |
| Ctrl+X | Agent invocation (then number) |

## Store Dependencies by Component

| Component | Key State | Actions Used |
|-----------|-----------|--------------|
| App | scouts, UI state | - |
| Header | trees, currentTree | createTree, selectTree, renameTree, deleteTree |
| TextEditor | currentTree, settings, copilot | updateNodeText, setCurrentNode, addNode, deleteNode, lock/unlock |
| ScoutModule | scouts, scoutStartRequest | addScout, updateScout, deleteScout, requestScoutStart |
| CopilotModule | copilot | updateCopilot |
| ActionsModule | currentTree, settings, automaticBookmarkConfig | massMerge, cullAndMergeToBookmarks |
| SettingsModule | settings | updateSettings |
| TreeModule | currentTree | setCurrentNode, toggleBookmark |
| GraphModule | currentTree, scouts | setCurrentNode |

## Component Patterns

### State Subscription
All components use Zustand's `useStore` hook:
```typescript
const currentTree = useStore(state => state.currentTree);
const setCurrentNode = useStore(state => state.setCurrentNode);
```

### Action Dispatch
Actions are called directly from the store:
```typescript
const { addNode, deleteNode } = useStore();
// In handler:
addNode(parentId, text);
```

### Async State Access
In async callbacks, use `getState()`:
```typescript
const tree = useStore.getState().currentTree;
```

## Common Workflows

### Adding a New Module

1. Create `src/components/modules/NewModule.tsx`
2. Add module type to `PanelModule` in `types.ts`:
   ```typescript
   export type PanelModule = 'Tree' | ... | 'NewModule' | null;
   ```
3. Add case in `LeftPanel.tsx` and `RightPanel.tsx`:
   ```typescript
   case 'NewModule':
     return <NewModule />;
   ```

### Connecting to Store

1. Import `useStore` from `../store`
2. Select needed state/actions
3. Subscribe to minimal state for performance

### Adding Keybindings

1. Register in `useKeybindings.ts` for global shortcuts
2. Register in `TextEditor.tsx` for Monaco-specific
3. Use Monaco's `addCommand()` API

## Performance Considerations

- **Minimize subscriptions** - Select only needed state
- **Debounce saves** - Tree saves are debounced 500ms
- **Memoize computations** - Especially in Tree/Graph modules
- **Virtual scrolling** - Consider for large tree lists

## References

- [docs/COMPONENT-MAP.md](../../docs/COMPONENT-MAP.md) - Detailed component docs
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System architecture
- [docs/HELM_USER_FLOWS.md](../../docs/HELM_USER_FLOWS.md) - User workflows
