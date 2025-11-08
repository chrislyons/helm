# Architecture Overview - Detailed Notes

## Overview
Helm is an Electron desktop application built with React 18, TypeScript, and Zustand for state management. It follows a clear separation of concerns between the Electron main process (Node.js environment) and the renderer process (browser environment with React). The architecture emphasizes a single source of truth for state, unidirectional data flow, and secure IPC communication.

## Architectural Layers

### Desktop Environment Layer
Helm runs as a native desktop application on macOS, Windows, and Linux using Electron 28. The operating system provides:
- Native window management
- Filesystem access (via Electron's sandboxed IPC)
- System dialogs and menus
- Application lifecycle events

### Electron Main Process
The main process (`electron/main.ts`) runs in a privileged Node.js environment and owns:

**Window Management:**
- Creates and manages the BrowserWindow
- Sets window size (1400x900), icon, and web preferences
- Configures preload script and context isolation
- Handles window lifecycle events (closed, activate)

**IPC Handler Registry:**
- `get-user-data-path` - Returns Electron's userData directory
- `join-path` - Path manipulation helper
- `read-file` / `write-file` - Synchronous file I/O
- `read-dir` - Directory listing
- `exists` / `mkdir` / `rmdir` / `stat` - Filesystem utilities
- `show-save-dialog` / `show-open-dialog` - Native file pickers

**Application Menu:**
- Platform-specific menus (File, Edit, View, Window on macOS)
- Minimal menu to avoid conflicts with custom keybindings
- Hidden menu bar on Windows/Linux
- Developer tools toggle (Cmd/Ctrl+Shift+I)

**Environment Detection:**
- Dev mode: Loads Vite dev server (http://localhost:5173)
- Production mode: Loads bundled dist/index.html

### Preload Bridge
The preload script (`electron/preload.ts`) creates a secure bridge between the renderer and main process:

**Security Model:**
- Context isolation enabled (renderer cannot access Node.js directly)
- Exposes a constrained `window.electronAPI` object
- All IPC calls are async and validated
- No direct filesystem or Node.js access from renderer

**API Surface:**
```typescript
window.electronAPI = {
  getUserDataPath(), joinPath(), readFile(), writeFile(),
  readDir(), exists(), mkdir(), rmdir(), stat(),
  showSaveDialog(), showOpenDialog()
}
```

### State Layer (Renderer)

**Zustand Store (src/store.ts):**
The entire application state lives in a single Zustand store:
- **Tree data:** `trees` (all loaded trees), `currentTree` (active workspace)
- **Node state:** Node maps, locks, bookmarks, current selection
- **UI layout:** Panel configuration, bottom panel height, ribbon window state
- **Agent state:** Scout presets, copilot config, active agent tracking
- **Settings:** API keys, model parameters, defaults

**Persistence:**
- Tree data → User data directory (debounced saves)
- Settings/UI layout → localStorage (immediate saves)
- On load: Rehydrate state from both sources
- On beforeunload: Flush pending tree saves

**State Mutation:**
- All mutations go through store actions
- Actions maintain invariants (parent-child bidirectional links)
- Locking prevents concurrent agent mutations
- Components never mutate state directly

**LocalStorage:**
Used for ephemeral UI state that doesn't belong in tree files:
- Panel layout (which module in left/right)
- Scout presets and button assignments
- Copilot configuration
- Last opened tree ID
- Font size and theme

### UI Layer (Renderer)

**Component Hierarchy:**
```
App (root)
├── Header (workspace management)
├── LeftPanel (configurable module)
├── TextEditor (Monaco editor)
├── RightPanel (configurable module)
├── BottomPanel (help or graph)
└── StatusRibbon (controls)
```

**Panel System:**
- Left and right panels are swappable module containers
- Each module (Tree, Graph, Scout, Copilot, Actions, Settings) is self-contained
- Panel state persisted to localStorage
- Bottom panel can show help or an embedded graph view

**Monaco Editor:**
- Read-only ancestor text region
- Editable current node text
- Platform-specific keybindings for tree operations
- Syntax highlighting and line numbers
- Overlays for agent invocation UI

**ReactFlow Graph:**
- Dagre auto-layout for tree visualization
- Interactive navigation (click to select node)
- Auto-fit viewport on selection change
- Campaign highlights for active agent paths

### Logic Layer (Renderer)

**React Hooks:**
- `useKeybindings.ts` - Global keyboard shortcuts
  - Navigation: Up/Down/Left/Right
  - Editing: Split, merge, mass merge, bookmark toggle
  - Expansion: Cmd/Ctrl+E for manual expand
  - Agents: Cmd/Ctrl+X for scout invocation
  - Copilot: Auto-runs after manual expand if enabled

**Agent Orchestration (utils/agents.ts):**
Core business logic for autonomous tree exploration:

- **Scout:** Depth-first expansion with parallel branching
- **Witness:** Sibling pruning and chain merging
- **Campaign:** Alternating Scout/Witness cycles with increasing vision/range/depth
- **Copilot:** Automated follow-up after manual user expansions

All agents:
- Respect locking discipline (lock before mutate, unlock always)
- Honor cancellation tokens (shouldStop closures)
- Update store via actions (lockNode, addNode, deleteNode, etc.)
- Call OpenRouter for continuations and decisions

**Filesystem Utils (utils/fileSystem.ts):**
Abstracts Electron IPC for tree persistence:
- `loadTreeList` - Enumerate available trees
- `loadTree` - Deserialize JSON to Tree object (arrays → Maps)
- `saveTree` - Serialize Tree to JSON (Maps → arrays)
- `createTree` - Initialize new empty tree
- `renameTree` / `deleteTree` - Workspace management
- `extractSubtree` - Export branch as standalone tree
- `importTree` - Import external tree JSON

**OpenRouter Client (utils/openrouter.ts):**
HTTP client with retry logic:
- `callContinuationModel` - Generate text continuations (branching)
- `callAssistantModel` - Generate decisions (Scout/Witness choices)
- Exponential backoff (3 retries max)
- Custom headers: Authorization, HTTP-Referer, X-Title
- Response parsing with fallbacks

### External Services

**OpenRouter API:**
- Unified LLM gateway supporting multiple models
- Two usage patterns:
  1. Continuation model: Generate branch text (prompt includes ancestry)
  2. Assistant model: Make pruning/keeping decisions (prompt includes sibling comparison)
- No streaming (full responses only)
- API key stored in settings (default empty)

### Persistent Storage

**User Data Directory:**
- Platform-specific location:
  - macOS: `~/Library/Application Support/Helm`
  - Windows: `%APPDATA%/Helm`
  - Linux: `~/.config/Helm`
- Managed by Electron's `app.getPath('userData')`

**Tree Storage:**
- Directory: `userData/trees/`
- Format: JSON files (one per tree)
- Structure: `{ id, name, nodes: [...], rootId, currentNodeId, bookmarkedNodeIds }`
- Serialization: Maps converted to arrays for JSON compatibility
- Debouncing: 500ms delay to batch rapid mutations

### Development Tools

**Vite Dev Server:**
- HMR (Hot Module Replacement) for instant updates
- Runs on localhost:5173 by default
- Auto-detected by Electron main process via `VITE_DEV_SERVER_URL`

**Chrome DevTools:**
- Opened automatically in dev mode
- Toggle via Cmd/Ctrl+Shift+I
- Full React DevTools support
- Network inspection for OpenRouter calls

## Core Interactions

### User Input Flow
1. User types in Monaco editor
2. `onChange` event triggers `updateNodeText` action
3. Store mutates current node's text field
4. Debounced save timer schedules persistence
5. After 500ms, `saveTree` writes to disk via IPC

### Tree Expansion Flow
1. User presses Cmd/Ctrl+E in editor
2. Keybinding hook calls store action
3. Store locks current node
4. `openrouter.callContinuationModel` generates N continuations
5. Store adds new child nodes
6. Store unlocks node
7. If Copilot enabled, auto-runs on new children
8. Debounced save persists changes

### Agent Execution Flow
1. User clicks Scout start button or presses Cmd/Ctrl+X → number
2. Agent config retrieved from store
3. `runScout` begins depth-first traversal
4. For each node: lock → expand → decide → recurse
5. Parallel requests via `Promise.all(continuations)`
6. Decision prompt sent to assistant model
7. Prune rejected branches, keep selected ones
8. Continue until depth limit or cancellation
9. Unlock all nodes, update agent status

### File Operations Flow
1. User selects workspace from Header dropdown
2. Header calls `fileSystem.loadTree(id)`
3. `loadTree` calls `window.electronAPI.readFile(path)`
4. Preload bridges to `ipcMain.handle('read-file')`
5. Main process reads file with Node.js fs module
6. JSON deserialized and returned to renderer
7. Store updates `currentTree`
8. All components re-render from new tree state

## Key Design Patterns

### Unidirectional Data Flow
- State lives in store only
- Components read via selectors (`useStore(state => state.x)`)
- Components write via actions (`useStore.getState().actionName()`)
- No local component state for tree data

### Locking Discipline
- Every mutation protected by `lockNode` / `unlockNode`
- Lock reasons: expanding, scout-active, witness-active, copilot-deciding
- Prevents concurrent modifications
- Released in finally blocks to handle errors

### Invariant Maintenance
- Parent-child links are bidirectional
- Store actions maintain both `parentId` and `childIds[]`
- Bookmarks prevent deletion/merging
- Root node cannot be deleted

### Async State Access
- React hooks for synchronous component code
- `useStore.getState()` for async callbacks (agents, keybindings)
- Ensures latest state without stale closures

### Error Handling
- OpenRouter retries with exponential backoff
- Failed expansions → delete new children
- Failed decisions → default to cull/keep-first
- Agents always unlock nodes even on error

## Tech Stack Summary

**Desktop Framework:** Electron 28
**UI Framework:** React 18 with TypeScript
**State Management:** Zustand (single store)
**Code Editor:** Monaco Editor (VS Code editor)
**Graph Visualization:** ReactFlow + Dagre layout
**Styling:** Tailwind CSS
**Build Tool:** Vite (fast HMR, ESM bundling)
**Packaging:** electron-builder (macOS/Windows/Linux)
**LLM Gateway:** OpenRouter API

## Complexity Management

### Tree Size
- No virtualization in graph view (Dagre layout runs every render)
- Large trees (1000+ nodes) may stress renderer
- Witness pruning and culling to manage size

### Concurrency
- Agents use `Promise.all` for parallel continuations
- No explicit rate limiting (rely on OpenRouter's limits)
- Locking prevents overlapping mutations

### Persistence
- Debounced saves (500ms) batch rapid edits
- beforeunload event ensures no data loss
- No autosave during agent runs (rely on debounce)

### Undo/Redo
- Not implemented (technical debt)
- Users must rely on bookmarks and exports
- Suggestion: Implement command pattern for reversible actions

## Areas for Future Enhancement

1. **Command pattern** - Enable undo/redo for tree operations
2. **Streaming responses** - Show partial LLM output as it generates
3. **Graph virtualization** - Handle trees with 10,000+ nodes
4. **Agent queueing** - Prevent overlapping agent runs with better scheduling
5. **Incremental persistence** - Only save changed subtrees
6. **Web version** - Replace Electron with browser-based storage APIs
7. **Collaborative editing** - CRDTs for multi-user tree editing
