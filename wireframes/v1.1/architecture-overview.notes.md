# Architecture Overview Notes

## High-Level Design

Helm is a desktop application built on the Electron framework, combining a Node.js main process with a React-based renderer process. The architecture follows a layered approach with clear separation of concerns.

## Process Model

### Main Process (Electron)

**Responsibilities:**
- Application lifecycle management
- Native window creation and management
- File system access via IPC handlers
- Native dialog integration
- Menu bar configuration

**Key Implementation:**
```typescript
// electron/main.ts
- BrowserWindow (1200x800, resizable)
- IPC handler registration (12 channels)
- Context isolation enabled
- Node integration disabled
```

### Preload Script (Security Boundary)

**Purpose:** Securely expose Node.js capabilities to the renderer.

**Implementation:**
```typescript
// electron/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, data) => ipcRenderer.invoke('write-file', path, data),
  // ... other async wrappers
});
```

**Security Model:**
- `nodeIntegration: false`
- `contextIsolation: true`
- All Node.js access through `contextBridge`

### Renderer Process (React)

**Tech Stack:**
- React 18+ with functional components
- Zustand for state management
- Monaco Editor for text editing
- ReactFlow + Dagre for DAG visualization
- Tailwind CSS for styling

## Architectural Layers

### 1. UI Layer

**Components:**
- Layout components (Header, Panels, StatusRibbon)
- Swappable modules (Tree, Graph, Scout, etc.)
- Monaco Editor wrapper with custom keybindings

**Design Pattern:** Container/Presenter with Zustand subscriptions

### 2. State Management Layer

**Zustand Store:**
- Single source of truth pattern
- No Redux complexity
- Direct state mutations with `set()`

**State Domains:**

| Domain | Contents | Persistence |
|--------|----------|-------------|
| Tree State | `trees[]`, `currentTree`, nodes, bookmarks | File system |
| Agent State | `scouts[]`, `copilot`, active state | localStorage |
| UI State | Panels, ribbon, bottom panel height | localStorage |
| Settings | API key, model configs, temperatures | localStorage |

**Persistence Strategy:**
- Tree data → JSON files in `userData/trees/`
- UI/Settings → localStorage keys
- Debounced saves (500ms) with flush on `beforeunload`

### 3. Business Logic Layer

**Core Utilities:**

1. **agents.ts** - Agent orchestration
   - Scout algorithm (depth-first expansion)
   - Witness algorithm (sibling pruning)
   - Campaign (Scout→Witness cycles)
   - Copilot (auto-QC on expansion)

2. **openrouter.ts** - API client
   - Two model types (continuation, assistant)
   - Retry logic with exponential backoff
   - Response parsing

3. **fileSystem.ts** - IPC abstraction
   - Tree CRUD operations
   - Map↔Array serialization
   - Path resolution

### 4. External Services Layer

**OpenRouter API:**
- Single LLM gateway for multiple providers
- Two distinct model roles:
  - **Continuation Model** - Text generation (branching)
  - **Assistant Model** - Decision making (Scout/Witness/Copilot)

**Default Models:**
- Continuation: `meta-llama/llama-3.1-405b`
- Assistant: `openai/gpt-oss-20b`

## Agent System Architecture

The agent system is the core innovation of Helm, enabling autonomous tree exploration.

### Agent Types

| Agent | Algorithm | Use Case |
|-------|-----------|----------|
| **Scout** | Depth-first expansion + cull decisions | Explore promising directions |
| **Witness** | Sibling pruning + chain merging | Quality control |
| **Campaign** | Scout→Witness cycles | Full autonomous exploration |
| **Copilot** | Auto-QC after manual expansion | Assisted writing |

### Node Locking Discipline

Prevents concurrent agent conflicts:

```typescript
type LockReason =
  | 'expanding'        // During API call
  | 'scout-active'     // Scout operating
  | 'witness-active'   // Witness pruning
  | 'copilot-deciding' // Copilot QC
```

**Lock Rules:**
- Cannot lock if different reason already holds lock
- Same-reason locks treated as success
- Always unlock in `finally` block

### Cancellation Pattern

```typescript
const shouldStop = () =>
  !useStore.getState().scouts.find(s => s.id === scoutId)?.active;

// Checked at each step in agent loop
if (shouldStop()) {
  // Cleanup incomplete work
  return;
}
```

## Data Flow Patterns

### User Input Flow
```
User Action → Keybinding/UI Handler → Store Action → State Update → React Re-render
                                           ↓
                                    Persistence (debounced)
```

### Agent Execution Flow
```
Request → Lock Node → API Call (expand) → API Call (decide) → Update Tree → Unlock
                                 ↓
                           Store.getState() for latest state
```

### File System Flow
```
Store Action → fileSystem.ts → window.electronAPI → preload.ts → IPC → main.ts → fs
```

## Key Architectural Decisions

### Why Zustand over Redux?

- Simpler API with less boilerplate
- Direct state mutations
- Easy async operations
- Smaller bundle size
- Direct state access via `getState()`

### Why Monaco Editor?

- Industry-standard code editor
- Customizable keybindings
- Read-only decorations
- Platform-specific key handling

### Why ReactFlow + Dagre?

- Smooth DAG visualization
- Auto-layout with Dagre
- Pan/zoom controls
- Node selection integration

### Why OpenRouter?

- Single API for multiple LLM providers
- Easy model switching
- Consistent interface
- Usage tracking

## Design Patterns Used

1. **Single Store** - Zustand for all application state
2. **Composition** - Swappable panel modules
3. **Strategy** - Different agent algorithms
4. **Observer** - Zustand subscriptions
5. **Command** - Keybinding actions
6. **Decorator** - Monaco text decorations

## Areas of Complexity

### State Management

The 1343-line `store.ts` handles:
- Tree manipulation (add, delete, merge, split)
- Agent lifecycle
- Persistence
- Bookmark navigation

**Consideration:** Could benefit from domain slicing.

### Agent Algorithms

`agents.ts` contains sophisticated algorithms:
- Nested async operations
- Recursive tree traversal
- Lock management
- Cancellation handling

**Consideration:** Add comprehensive unit tests.

### Monaco Integration

Custom keybindings and decorations require:
- Platform detection
- Monaco command registration
- State synchronization

## Security Considerations

1. **API Key Storage** - localStorage (consider secure storage)
2. **Context Isolation** - Enabled for security
3. **No Node Integration** - Renderer cannot access Node.js directly
4. **File System Access** - Limited to userData directory

## Performance Considerations

1. **Tree Serialization** - Map↔Array conversion on save/load
2. **Debounced Saves** - 500ms delay prevents excessive writes
3. **ReactFlow** - May stress renderer on large trees (no virtualization)
4. **API Calls** - Retry logic with exponential backoff

## Future Architecture Considerations

1. **State Slicing** - Split store.ts into domain modules
2. **Testing** - Add unit tests for agent algorithms
3. **Virtualization** - Add for large tree visualization
4. **Secure Storage** - Consider Electron's safeStorage for API key

## References

- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - Detailed architecture
- [docs/DATAFLOW.md](../../docs/DATAFLOW.md) - Data flow diagrams
- [docs/RUNTIME-SEQUENCE.md](../../docs/RUNTIME-SEQUENCE.md) - Execution sequences
