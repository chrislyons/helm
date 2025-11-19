# Architecture Overview - Extended Documentation

## Overview

Helm is a desktop application built on the Electron framework, combining Node.js for native capabilities with React for the user interface. The architecture follows a strict separation of concerns between the main process (Electron), renderer process (React), and external services (OpenRouter API).

---

## Architectural Layers

### 1. User Layer
The human interface through keyboard shortcuts and mouse interactions. Helm is optimized for keyboard-driven workflows with extensive shortcut support.

**Key Interactions:**
- Arrow keys: Tree navigation
- Ctrl/Cmd+Enter: Node expansion
- Ctrl/Cmd+X: Agent invocation modal
- Ctrl/Cmd+B: Bookmark toggle
- Ctrl/Cmd+M: Node merge operations

### 2. Electron Shell (Main Process)
The Node.js process that owns the application window and provides native OS access.

**Responsibilities:**
- Application lifecycle management (start, quit, focus)
- Window creation and configuration
- IPC handler registration for filesystem operations
- Native dialog access (save/open dialogs)

**Security Model:**
- Context isolation enabled
- Node integration disabled in renderer
- All native APIs accessed through IPC

### 3. Context Bridge (Preload)
The security boundary between Electron and React.

**Purpose:**
- Expose safe subset of Node.js APIs to renderer
- Prevent direct access to sensitive operations
- Type-safe interface via `window.electronAPI`

**Exposed Operations:**
```typescript
- getUserDataPath()
- joinPath(...paths)
- readFile(path)
- writeFile(path, data)
- readDir(path)
- exists(path)
- mkdir(path)
- stat(path)
- rmdir(path)
- showSaveDialog(options)
- showOpenDialog(options)
```

### 4. Renderer Process (React App)
The UI layer running in Chromium, containing all user-facing logic.

**Sub-layers:**

#### UI Layer
- **Panel System**: Configurable left/right/bottom panels with swappable modules
- **Monaco Editor**: Full-featured text editing with syntax awareness
- **ReactFlow**: Interactive DAG visualization with Dagre layout

#### State Management
- **Zustand Store**: Single source of truth for all application state
- **localStorage**: Persistent settings, agent configs, UI preferences

#### Business Logic
- **agents.ts**: Scout/Witness/Campaign/Copilot orchestration
- **fileSystem.ts**: IPC abstraction for persistence operations
- **openrouter.ts**: HTTP client with retry/backoff for API calls

### 5. Agent System
Autonomous exploration and quality control agents.

**Agent Types:**
- **Scout**: Depth-first tree explorer with vision/range/depth parameters
- **Witness**: Sibling pruner that evaluates and merges low-quality branches
- **Campaign**: Combined Scout+Witness cycles with parameter scaling
- **Copilot**: Background auto-QC that runs after manual expansions

**Agent Lifecycle:**
1. User configures agent parameters
2. User triggers agent start
3. Agent acquires node lock
4. Agent calls OpenRouter for decisions/continuations
5. Agent mutates tree via store actions
6. Agent releases lock
7. UI re-renders from store changes

### 6. External Services
OpenRouter API for LLM access.

**Models Used:**
- **Continuation Model**: Text generation (e.g., Llama 3.1 405B)
- **Assistant Model**: Structured decisions (e.g., GPT-4)

**API Pattern:**
- Direct HTTP calls from renderer (no backend proxy)
- User provides own API key
- Exponential backoff retry (1s → 2s → 4s)

### 7. Persistence Layer
File-based storage in user data directory.

**Structure:**
```
~/.config/Helm/  (Linux)
~/Library/Application Support/Helm/  (macOS)
  └── trees/
      └── {treeId}/
          └── tree.json
```

**Persistence Strategy:**
- Debounced saves (500ms window)
- JSON serialization (Map → array)
- Flush on window close

---

## Key Architectural Decisions

### 1. Zustand over Redux
**Rationale**: Simpler API, less boilerplate, direct `getState()` access for async callbacks where React hooks aren't available.

### 2. No Backend Server
**Rationale**: Direct OpenRouter calls from renderer reduce complexity. User manages own API key, no server costs or auth complexity.

### 3. Locking Mechanism
**Rationale**: Prevent concurrent agent mutations on same node. Simple boolean lock with reason tracking prevents race conditions.

### 4. Debounced Persistence
**Rationale**: Tree mutations can be rapid during exploration. Debouncing prevents excessive disk I/O while ensuring data safety.

### 5. Vision-based Context
**Rationale**: LLMs need context to make good decisions. Vision parameter controls how much parent history to include, balancing context quality vs. token cost.

---

## Design Patterns

### Unidirectional Data Flow
```
User Input → Store Action → State Update → Component Re-render → Side Effects
```

### Command Pattern (Agents)
Agents encapsulate complex multi-step operations (expand, evaluate, prune) as discrete units that can be started, stopped, and composed.

### Observer Pattern (Zustand)
Components subscribe to store slices and automatically re-render on relevant state changes.

### Adapter Pattern (IPC)
`fileSystem.ts` adapts Electron IPC to a clean async interface, hiding IPC complexity from business logic.

### Retry with Backoff
All OpenRouter calls use exponential backoff to handle transient failures gracefully.

---

## Performance Considerations

### Rendering
- No virtualization in Graph component (large trees can stress renderer)
- Monaco Editor handles its own virtualization
- ReactFlow uses native DOM for nodes

### Memory
- Full tree held in memory (Map<string, TreeNode>)
- No lazy loading of subtrees
- localStorage limited to ~5MB

### Network
- No request batching for parallel expansions
- Individual retry per request
- No caching of LLM responses

---

## Security Model

### Electron Security
- Context isolation: Renderer can't access Node.js
- No remote content: All code bundled locally
- IPC boundary: Explicit API surface

### Data Security
- API key stored in localStorage (not encrypted)
- Tree data stored in plain JSON (not encrypted)
- No network transmission of user data (except to OpenRouter)

### Threat Considerations
- Malicious tree import could contain scripts (JSON only, mitigated)
- API key exposure if device compromised
- No input sanitization for LLM prompts

---

## Extension Points

### Adding New Agent Types
1. Extend `ScoutConfig.type` union in `types.ts`
2. Add orchestration function in `agents.ts`
3. Add UI in `Scout.tsx` module

### Adding New UI Modules
1. Create `src/components/modules/NewModule.tsx`
2. Add to module list in panel components
3. Register in panel configuration

### Adding New IPC Operations
1. Add handler in `electron/main.ts`
2. Expose in `electron/preload.ts`
3. Add type in `electron.d.ts`
4. Use via `window.electronAPI` in renderer

### Adding New Store Slices
1. Extend state interface in `store.ts`
2. Add initial state
3. Add actions
4. Components access via `useStore()`

---

## References

- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - Detailed system design
- [RUNTIME-SEQUENCE.md](../../docs/RUNTIME-SEQUENCE.md) - Execution sequences
- [OPENROUTER.md](../../docs/OPENROUTER.md) - API integration details
