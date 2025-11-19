# Entry Points Notes

## Overview

Helm has multiple entry points for user interaction, system initialization, and external communication. Understanding these entry points is crucial for extending the application.

## Application Initialization

### Electron Bootstrap Sequence

1. **Electron Starts** (`electron/main.ts`)
   - `app.whenReady()` event
   - Create main window

2. **Create BrowserWindow**
   ```typescript
   new BrowserWindow({
     width: 1200,
     height: 800,
     webPreferences: {
       nodeIntegration: false,
       contextIsolation: true,
       preload: path.join(__dirname, 'preload.js')
     }
   })
   ```

3. **Load Application**
   - Development: Vite dev server URL
   - Production: `index.html` from dist

4. **Setup Menu Bar**
   - File menu (placeholder)
   - Edit menu (undo/redo/cut/copy/paste)
   - View menu (reload/dev tools)

### React Bootstrap Sequence

1. **main.tsx Entry**
   ```typescript
   // Load theme from localStorage
   const theme = localStorage.getItem('helm-theme');
   if (theme) document.body.classList.add(theme);

   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>
   );
   ```

2. **App Component Mount**
   - Render layout shell
   - Subscribe to store

### Store Initialization Sequence

On `create<AppState>()` call:

1. **Load UI State**
   - `bottomPanelHeight` from localStorage
   - `ribbonWindow` mode
   - `leftPanel` / `rightPanel` config

2. **Load Settings**
   - API key
   - Model configurations
   - Temperatures and limits

3. **Load Scouts**
   - Agent presets from localStorage
   - Mark all as inactive (no operations survive restart)

4. **Load Copilot**
   - Copilot config
   - Mark as disabled

5. **Load Tree List**
   - Async call to `getTreeListAsync()`
   - Populate `trees[]` array

6. **Load Last Tree**
   - Get `storedTreeId` from localStorage
   - Call `loadTree(storedTreeId)`
   - Set `currentTree` with preserved `currentNodeId`

7. **Register beforeunload**
   - Flush pending tree saves on window close

## Keyboard Entry Points

### Navigation Shortcuts

| Shortcut | Action | Handler Location |
|----------|--------|------------------|
| `Alt+↑` | Navigate to parent | `useKeybindings.ts` |
| `Alt+↓` | Navigate to first child | `useKeybindings.ts` |
| `Alt+←` | Navigate to previous sibling | `useKeybindings.ts` |
| `Alt+→` | Navigate to next sibling | `useKeybindings.ts` |

**Implementation:**
```typescript
// useKeybindings.ts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      navigateToParent();
    }
    // ... other shortcuts
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### Bookmark Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Alt+Shift+↑` | Previous bookmark | Sequential order |
| `Alt+Shift+↓` | Next bookmark | Sequential order |
| `Alt+Shift+←` | Ancestor bookmark | Up hierarchy |
| `Alt+Shift+→` | Descendant bookmark | Down hierarchy |

**Hierarchy Navigation:**
- Left: Find closest bookmarked ancestor
- Right: Find closest bookmarked descendant

### Node Operations

| Shortcut | Action | Store Action |
|----------|--------|--------------|
| `Ctrl+Enter` | Expand node | `expandNode()` via agents.ts |
| `Alt+Backspace` | Delete node | `deleteNode()` |
| `Ctrl/Alt+M` | Toggle bookmark | `toggleBookmark()` |
| `Ctrl+X` | Open agent menu | Set selection mode |

**Platform Detection:**
- Mac: `Cmd` key
- Windows/Linux: `Ctrl` key

### Agent Invocation

After `Ctrl+X`, press number 1-9:

```typescript
// Agent slots defined in ScoutConfig.buttonNumber
scouts.filter(s => s.buttonNumber === pressedNumber)
  .forEach(s => requestScoutStart(s.id));
```

### Monaco Editor Defaults

Standard Monaco shortcuts work in the editor:
- `Ctrl+Z` / `Ctrl+Y` - Undo/Redo
- `Ctrl+A` - Select all
- `Ctrl+C/V/X` - Copy/Paste/Cut
- `Ctrl+F` - Find
- `Ctrl+H` - Replace

**Custom Overrides in TextEditor.tsx:**
- Navigation shortcuts bound to Monaco commands
- Prevents default behavior

## Mouse Entry Points

### Header Interactions

| Element | Action | Result |
|---------|--------|--------|
| Tree dropdown | Click | Show workspace list |
| Tree option | Click | Switch workspace (`selectTree()`) |
| Create button | Click | Show name dialog, `createTree()` |
| Rename button | Click | Show name dialog, `renameTree()` |
| Delete button | Click | Show confirm dialog, `deleteTree()` |

### Panel Interactions

| Element | Action | Result |
|---------|--------|--------|
| Module selector | Click | Show module dropdown |
| Module option | Click | `updatePanels()` with new module |
| Resize handle | Drag | Update panel height |
| Ribbon toggle | Click | `setRibbonWindow()` |

### Tree View Interactions

| Element | Action | Result |
|---------|--------|--------|
| Node row | Click | `setCurrentNode(nodeId)` |
| Bookmark icon | Click | `toggleBookmark(nodeId)` |
| Collapse icon | Click | Toggle local expand state |

### Graph View Interactions

| Element | Action | Result |
|---------|--------|--------|
| Graph node | Click | `setCurrentNode(nodeId)` |
| Canvas | Drag | Pan view |
| Scroll wheel | Scroll | Zoom in/out |
| Fit button | Click | Fit all nodes in view |

### Scout Module Interactions

| Element | Action | Result |
|---------|--------|--------|
| Create button | Click | `addScout(newScout)` |
| Start button | Click | `requestScoutStart(id)`, `updateScout({active: true})` |
| Stop button | Click | `updateScout({active: false})` |
| Delete button | Click | `deleteScout(id)` |
| Config fields | Change | `updateScout(id, updates)` |
| Output clear | Click | `updateScout(id, {outputs: []})` |

### Actions Module Interactions

| Element | Action | Result |
|---------|--------|--------|
| Expand button | Click | `expandNode()` on current |
| Mass merge button | Click | `massMerge()` |
| Cull to bookmarks | Click | `cullAndMergeToBookmarks()` |
| Export button | Click | Show save dialog, export tree |
| Import button | Click | Show open dialog, import tree |

## Editor Entry Points

### Text Input

| Action | Handler | Notes |
|--------|---------|-------|
| Typing | Monaco onChange | Debounced to `updateNodeText()` |
| Paste | Monaco onPaste | Inserted at cursor |
| Cut | Monaco onCut | Remove selected |

**Important:** Only the current node's text is editable. Parent text is read-only via Monaco decorations.

### Editor Navigation

Standard Monaco navigation within the editor:
- Arrow keys for cursor movement
- Shift+Arrow for selection
- Ctrl+Arrow for word jumping
- Home/End for line start/end

## API Entry Points

### OpenRouter Calls

**Continuation Model:**
```typescript
// Called from: agents.ts expandNode()
callContinuationModel(branchText: string, settings: Settings)
// Returns: Array of generated text strings
```

**Assistant Model:**
```typescript
// Called from: agents.ts scoutDecision(), witnessDecision(), copilotDecision()
callAssistantModel(systemPrompt: string, userMessage: string, settings: Settings)
// Returns: Decision string ('expand', 'cull', nodeId)
```

## IPC Entry Points

### File Operations

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `read-file` | Renderer → Main | Load file contents |
| `write-file` | Renderer → Main | Save file contents |
| `read-dir` | Renderer → Main | List directory contents |
| `mkdir` | Renderer → Main | Create directory |
| `rmdir` | Renderer → Main | Delete directory recursively |
| `exists` | Renderer → Main | Check if file exists |
| `stat` | Renderer → Main | Get file stats |

### Dialog Operations

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `show-save-dialog` | Renderer → Main | Export file dialog |
| `show-open-dialog` | Renderer → Main | Import file dialog |

### Path Operations

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `get-user-data-path` | Renderer → Main | Get `~/.config/Helm/` |
| `join-path` | Renderer → Main | Cross-platform path join |

## Adding New Entry Points

### Adding a Keyboard Shortcut

1. **Global Shortcut** (`useKeybindings.ts`):
   ```typescript
   if (e.altKey && e.key === 'n') {
     e.preventDefault();
     // Your action
   }
   ```

2. **Editor Shortcut** (`TextEditor.tsx`):
   ```typescript
   editor.addCommand(
     monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN,
     () => {
       // Your action
     }
   );
   ```

### Adding a Mouse Interaction

1. Create handler in component
2. Connect to store action
3. Add to JSX with onClick/onChange

### Adding an IPC Channel

1. **Main Process** (`electron/main.ts`):
   ```typescript
   ipcMain.handle('new-channel', async (event, args) => {
     // Implementation
     return result;
   });
   ```

2. **Preload** (`electron/preload.ts`):
   ```typescript
   newChannel: (args) => ipcRenderer.invoke('new-channel', args)
   ```

3. **Types** (`src/electron.d.ts`):
   ```typescript
   newChannel: (args: ArgType) => Promise<ReturnType>
   ```

## Common Modification Points

### Changing Navigation Behavior
- File: `src/hooks/useKeybindings.ts`
- Functions: `navigateToParent()`, `navigateToChild()`, etc.

### Changing Agent Behavior
- File: `src/utils/agents.ts`
- Functions: `runScout()`, `runWitness()`, etc.

### Changing Persistence
- Store: `src/store.ts`
- File System: `src/utils/fileSystem.ts`

### Changing API Integration
- File: `src/utils/openrouter.ts`
- Consider adding new model types or providers

## References

- [docs/HELM_USER_FLOWS.md](../../docs/HELM_USER_FLOWS.md) - User interaction flows
- [docs/RUNTIME-SEQUENCE.md](../../docs/RUNTIME-SEQUENCE.md) - Runtime sequences
- [component-map.notes.md](./component-map.notes.md) - Component details
