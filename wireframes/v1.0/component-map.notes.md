# Component Map - Extended Documentation

## Overview

Helm's UI is built as a modular React application with a configurable panel system. Components are organized in a hierarchy with the App component at the root, managing layout and global keyboard handling. Individual modules are self-contained and can be placed in any panel slot.

---

## Component Hierarchy

### Root Level

#### App (`src/App.tsx`)
**Responsibility**: Root layout shell and global orchestration

**Features**:
- Flex layout with Header, Main (3-column), and conditional overlays
- Global keyboard event handling
- Agent invoke modal (Ctrl/Cmd+X)
- Panel configuration state

**Store Dependencies**:
- `currentTree` - Active workspace
- `scouts` - Agent configurations
- `panelConfig` - Module placement

**Children**: Header, LeftPanel, Center column, RightPanel

---

### Header Components

#### Header (`src/components/Header.tsx`)
**Responsibility**: Workspace management and navigation

**Features**:
- Dropdown workspace selector
- Create/rename/delete tree actions
- Tree list population from filesystem

**Store Dependencies**:
- `trees` - All workspaces
- `currentTreeId` - Selected workspace
- `createTree`, `selectTree`, `deleteTree`, `renameTree` actions

**External Dependencies**: FileSystemUtils for tree enumeration

---

### Panel Components

#### LeftPanel / RightPanel (`src/components/LeftPanel.tsx`, `RightPanel.tsx`)
**Responsibility**: Configurable module containers

**Features**:
- Top and bottom slots for modules
- Module swapping via configuration
- Consistent sizing and spacing

**Store Dependencies**:
- `panelConfig` - Which modules to render

**Renders**: Any of the 6 available modules based on config

#### BottomPanel (`src/components/BottomPanel.tsx`)
**Responsibility**: Collapsible content area below editor

**Features**:
- Help overlay (keyboard shortcuts)
- Graph visualization
- Resizable height (0-90%)
- Draggable divider

**Store Dependencies**:
- `bottomPanelHeight` - Current height
- `showHelp` - Help overlay visibility
- `bottomPanelContent` - 'graph' | 'help' | 'empty'

---

### Core UI Components

#### TextEditor (`src/components/TextEditor.tsx`)
**Responsibility**: Main text editing interface

**Features**:
- Monaco Editor integration
- Branch text display (root → current node)
- Read-only branch prefix, editable current node
- Cursor position management
- Font family/size from settings

**Store Dependencies**:
- `currentTree.currentNodeId` - Active node
- `getBranchText()` - Text composition
- `updateNodeText()` - Save changes

**Key Behavior**:
- Displays full path from root to current node
- Only current node text is editable
- Blur triggers debounced save

#### StatusRibbon (`src/components/StatusRibbon.tsx`)
**Responsibility**: Bottom control bar

**Features**:
- Font family dropdown
- Font size slider
- Graph panel toggle
- Ribbon collapse toggle

**Store Dependencies**:
- `ribbonWindow` - Visibility state
- `setBottomPanelHeight()` - Toggle graph

---

### Module Components

All modules are interchangeable and can be placed in any panel slot.

#### Tree (`src/components/modules/Tree.tsx`)
**Responsibility**: Hierarchical tree visualization

**Features**:
- Nested node display
- Current node highlighting
- Bookmark indicators (star icon)
- Lock indicators (lock icon)
- Click to navigate

**Store Dependencies**:
- `currentTree.nodes` - All nodes
- `currentTree.rootId` - Tree root
- `currentTree.currentNodeId` - Selection
- `currentTree.bookmarkedNodeIds` - Bookmarks
- `setCurrentNode()` - Navigation action

#### Graph (`src/components/modules/Graph.tsx`)
**Responsibility**: DAG visualization with ReactFlow

**Features**:
- Node/edge graph rendering
- Dagre automatic layout
- Pan and zoom controls
- Click node to navigate
- Visual node states (current, bookmarked, locked)

**Store Dependencies**:
- `currentTree.nodes` - Graph data
- `setCurrentNode()` - Navigation

**External Dependencies**:
- ReactFlow - Graph rendering
- Dagre - Layout algorithm

#### Scout (`src/components/modules/Scout.tsx`)
**Responsibility**: Agent configuration and execution

**Features**:
- Agent type selector (Scout/Witness/Campaign)
- Parameter sliders (vision, range, depth)
- Instructions textarea
- Start/stop buttons
- Output log display
- Button number binding (1-9)

**Store Dependencies**:
- `scouts` - Agent configurations
- `addScout`, `updateScout`, `deleteScout` - CRUD
- `scoutStartRequest` - Trigger flag

**External Dependencies**: AgentUtils for execution

#### Copilot (`src/components/modules/Copilot.tsx`)
**Responsibility**: Automatic quality control settings

**Features**:
- Master enable/disable toggle
- Post-expansion auto-run toggle
- Parameter configuration
- Output history display

**Store Dependencies**:
- `copilot` - Configuration
- `updateCopilot()` - Save settings

**Behavior**: Runs automatically after manual node expansion when enabled

#### Actions (`src/components/modules/Actions.tsx`)
**Responsibility**: Bulk tree operations

**Features**:
- Mass merge siblings
- Cull to bookmarks (prune non-bookmarked)
- Extract subtree (export branch)
- Import/export JSON

**Store Dependencies**:
- `massMerge()` - Merge action
- `cullAndMergeToBookmarks()` - Prune action

**External Dependencies**:
- AgentUtils for Witness
- FileSystemUtils for import/export

#### Settings (`src/components/modules/Settings.tsx`)
**Responsibility**: Application configuration

**Features**:
- API key input (masked)
- Continuation model selection
- Assistant model selection
- Temperature slider
- Top-P slider
- Max tokens input

**Store Dependencies**:
- `settings` - Current config
- `updateSettings()` - Save changes

---

## Utility Modules

### ZustandStore (`src/store.ts`)
**Responsibility**: Central state management

**State Slices**:
- `trees` - Map of all workspaces
- `currentTreeId` - Active workspace
- `scouts` - Agent configurations
- `copilot` - Copilot configuration
- `settings` - App settings
- `panelConfig` - UI layout

**Key Actions**:
- Tree CRUD: `createTree`, `loadTree`, `saveTree`, `deleteTree`
- Node mutations: `addNode`, `updateNodeText`, `deleteNode`
- Locking: `lockNode`, `unlockNode`
- Bookmarks: `toggleBookmark`, `cullAndMergeToBookmarks`

### AgentUtils (`src/utils/agents.ts`)
**Responsibility**: Agent orchestration logic

**Functions**:
- `expandNode()` - Single node expansion
- `runScout()` - Depth-first exploration
- `runWitness()` - Sibling pruning
- `runCampaign()` - Scout+Witness cycles
- `runCopilotOnNode()` - Auto-QC
- `scoutDecision()` - Parse expand/cull response
- `witnessDecision()` - Parse choice response

**Dependencies**: OpenRouterUtils, ZustandStore

### OpenRouterUtils (`src/utils/openrouter.ts`)
**Responsibility**: LLM API communication

**Functions**:
- `callContinuationModel()` - Text generation
- `callAssistantModel()` - Structured decisions
- `withRetry()` - Exponential backoff

**Pattern**: Promise-based with automatic retry on failure

### FileSystemUtils (`src/utils/fileSystem.ts`)
**Responsibility**: Persistence abstraction

**Functions**:
- `loadTree()` - Read from disk
- `saveTree()` - Write to disk
- `getTreeListAsync()` - Enumerate workspaces
- `createNewTree()` - Initialize new tree
- `extractSubtree()` - Export branch

**Interface**: Wraps Electron IPC with clean async API

### UseKeybindings (`src/hooks/useKeybindings.ts`)
**Responsibility**: Global keyboard shortcuts

**Bindings**:
- Navigation: Arrow keys, Ctrl+Up/Down
- Editing: Ctrl+Enter, Ctrl+B, Ctrl+M
- Agents: Ctrl+X, 1-9
- Mass ops: Ctrl+Shift+M, Ctrl+Shift+C

**Pattern**: Uses `useEffect` to attach/detach listeners

---

## Component Communication Patterns

### Direct Store Access
Components access store via `useStore()` hooks for reactive updates.
```typescript
const currentTree = useStore(state => state.currentTree)
```

### Action Dispatch
Components dispatch actions through store.
```typescript
const addNode = useStore(state => state.addNode)
addNode(parentId, text)
```

### Utility Invocation
Components call utilities for complex operations.
```typescript
import { runScout } from '../utils/agents'
await runScout(scoutConfig)
```

### Callback Props
Minimal prop drilling; most state access is direct from store.

---

## Module Dependencies Matrix

| Module | Store | AgentUtils | OpenRouter | FileSystem |
|--------|-------|------------|------------|------------|
| Header | ✓ | - | - | ✓ |
| TextEditor | ✓ | - | - | - |
| Tree | ✓ | - | - | - |
| Graph | ✓ | - | - | - |
| Scout | ✓ | ✓ | - | - |
| Copilot | ✓ | ✓ | - | - |
| Actions | ✓ | ✓ | - | ✓ |
| Settings | ✓ | - | - | - |

---

## References

- [COMPONENT-MAP.md](../../docs/COMPONENT-MAP.md) - Original component documentation
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System architecture
- [DATAFLOW.md](../../docs/DATAFLOW.md) - State management patterns
