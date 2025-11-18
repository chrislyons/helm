# Entry Points - Extended Documentation

## Overview

Helm has multiple entry points for different purposes: application initialization, IPC communication, user interactions (keyboard/mouse), and development workflows. Understanding these entry points is essential for debugging, extending functionality, and onboarding new developers.

---

## Application Initialization

### Electron Main Process

**File**: `electron/main.ts`

**Initialization Sequence**:
1. `app.whenReady()` - Wait for Electron to initialize
2. `createWindow()` - Create BrowserWindow with preload script
3. Register IPC handlers for filesystem operations
4. Load content based on environment

**Window Configuration**:
```typescript
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false
  }
})
```

**Content Loading**:
- Development: `http://localhost:5173` (Vite dev server)
- Production: `file://dist/index.html` (bundled app)

### React Renderer

**File**: `src/main.tsx`

**Initialization Sequence**:
1. Import React and App component
2. Import global CSS
3. `ReactDOM.createRoot(document.getElementById('root'))`
4. Render `<App />` component

**Store Initialization**:
- Zustand store initializes on first access
- Loads settings from localStorage
- Loads last opened tree ID

---

## IPC Endpoints

All filesystem operations route through IPC for security. The preload script exposes these as `window.electronAPI` methods.

### File System Operations

| Endpoint | Handler | Purpose |
|----------|---------|---------|
| `get-user-data-path` | `app.getPath('userData')` | Get app data directory |
| `join-path` | `path.join(...parts)` | Platform-safe path joining |
| `read-file` | `fs.readFileSync(path)` | Read file contents |
| `write-file` | `fs.writeFileSync(path, data)` | Write file contents |
| `read-dir` | `fs.readdirSync(path)` | List directory contents |
| `exists` | `fs.existsSync(path)` | Check path existence |
| `mkdir` | `fs.mkdirSync(path, { recursive: true })` | Create directory |
| `stat` | `fs.statSync(path)` | Get file metadata |
| `rmdir` | `fs.rmSync(path, { recursive: true })` | Delete directory |

### Dialog Operations

| Endpoint | Handler | Purpose |
|----------|---------|---------|
| `show-save-dialog` | `dialog.showSaveDialog(options)` | Native save dialog |
| `show-open-dialog` | `dialog.showOpenDialog(options)` | Native open dialog |

**Usage Example**:
```typescript
// In renderer (via fileSystem.ts)
const userData = await window.electronAPI.getUserDataPath()
const treePath = await window.electronAPI.joinPath(userData, 'trees', treeId, 'tree.json')
const data = await window.electronAPI.readFile(treePath)
```

---

## Keyboard Shortcuts

Defined in `src/hooks/useKeybindings.ts`, these are global handlers attached to the document.

### Navigation Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `↑` / `↓` | Navigate siblings | Move between sibling nodes |
| `←` / `→` | Navigate parent/child | Expand/collapse navigation |
| `Ctrl+↑` | Go to parent | Jump to parent node |
| `Ctrl+↓` | Go to first child | Jump to first child |
| `Home` | Go to root | Jump to tree root |
| `End` | Go to deepest | Jump to deepest descendant |

### Editing Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Enter` | Expand node | Generate child nodes via LLM |
| `Ctrl+B` | Toggle bookmark | Bookmark/unbookmark current node |
| `Ctrl+M` | Merge with parent | Combine current node with parent |
| `Ctrl+D` | Delete node | Delete current node and children |
| `Ctrl+S` | Split node | Split at cursor position |

### Agent Trigger Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+X` | Invoke modal | Show agent selection overlay |
| `1-9` | Start agent | Start agent bound to button number |
| `Ctrl+K` | Toggle Copilot | Enable/disable auto-QC |
| `Escape` | Stop agents | Cancel running agents |

### Mass Operation Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+M` | Mass merge | Merge all single-child chains |
| `Ctrl+Shift+C` | Cull to bookmarks | Delete non-bookmarked branches |

**Implementation Pattern**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      expandCurrentNode()
    }
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [])
```

---

## UI Entry Points

### Header Actions

**Workspace Selector**:
- Dropdown lists all available trees
- Click to switch workspace
- "New" button creates tree
- "Delete" button removes tree
- Inline rename on double-click

**Implementation**: `src/components/Header.tsx`

### Panel Interactions

**Node Selection**:
- Click node in Tree module → `setCurrentNode()`
- Click node in Graph module → `setCurrentNode()`

**Text Editing**:
- Type in Monaco editor → `onChange` handler
- Blur or Ctrl+S → debounced save

**Parameter Changes**:
- Slider drag → immediate state update
- Input blur → save to localStorage

### Button Actions

**Agent Control**:
- Start button → set `scoutStartRequest` flag
- Stop button → set `active = false`

**Action Buttons**:
- Mass Merge → `massMerge()` action
- Cull → `cullAndMergeToBookmarks()` action
- Export → show save dialog, write JSON

**Settings**:
- Input change → update store
- Component unmount → persist to localStorage

---

## NPM Script Entry Points

### Development

**`npm run dev`**
```bash
concurrently "npm run dev:vite" "npm run dev:electron"
```
- Starts Vite dev server on :5173
- Compiles Electron TypeScript
- Launches Electron with hot reload

**`npm run dev:vite`**
```bash
vite
```
- Runs Vite development server
- Hot module replacement enabled
- Serves React app

**`npm run dev:electron`**
```bash
tsc -p tsconfig.electron.json && electron .
```
- Compiles Electron TypeScript
- Starts Electron process

### Build

**`npm run build`**
```bash
tsc && vite build && tsc -p tsconfig.electron.json
```
- Type-check React code
- Bundle React with Vite
- Compile Electron main process

### Distribution

**`npm run dist:mac`**
```bash
npm run build && electron-builder --mac
```
- Build app
- Package for macOS (DMG + ZIP)

**`npm run dist:win`**
```bash
npm run build && electron-builder --win
```
- Build app
- Package for Windows (NSIS installer)

---

## Development Workflow Entry Points

### Adding New Feature

1. **UI Component**: Create in `src/components/`
2. **Store Slice**: Add state/actions to `src/store.ts`
3. **Business Logic**: Add to appropriate util file
4. **Keyboard Binding**: Register in `useKeybindings.ts`

### Adding New IPC Handler

1. Register handler in `electron/main.ts`:
```typescript
ipcMain.handle('new-operation', async (event, arg) => {
  return someResult
})
```

2. Expose in `electron/preload.ts`:
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  newOperation: (arg) => ipcRenderer.invoke('new-operation', arg)
})
```

3. Add type in `src/electron.d.ts`:
```typescript
interface ElectronAPI {
  newOperation: (arg: string) => Promise<Result>
}
```

### Debugging Entry Points

**Renderer DevTools**:
- View → Toggle Developer Tools
- Or: `Ctrl+Shift+I`

**Main Process Debugging**:
- Use `--inspect` flag with Electron
- Attach VS Code debugger

**Console Logging**:
- Renderer: browser console
- Main: terminal where Electron started

---

## Environment Differences

### Development Mode
- Hot reload enabled
- Source maps available
- DevTools accessible
- Console logging verbose

### Production Mode
- Code minified/bundled
- DevTools still accessible (for debugging)
- Console logging reduced
- Better performance

### Packaged App
- Runs from asar archive
- Auto-update capability (if configured)
- Native menus
- System tray integration (if configured)

---

## References

- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System design
- [RUNTIME-SEQUENCE.md](../../docs/RUNTIME-SEQUENCE.md) - Execution flows
- package.json - Script definitions
