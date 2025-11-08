# Entry Points - Detailed Notes

## Overview
Helm provides multiple entry points for interaction: application startup sequence, user input handlers, component-triggered actions, store mutations, external API calls, and background processes. Understanding these entry points is crucial for debugging, extending functionality, and maintaining the application.

## Application Startup Sequence

### 1. Operating System Launch
**Trigger:** User double-clicks Helm.app or runs `helm` executable

**Platform Differences:**
- **macOS:** .app bundle, launched via Finder or Spotlight
- **Windows:** .exe installer, launched via Start Menu or desktop shortcut
- **Linux:** AppImage or .deb package, launched via app menu or terminal

**Process:**
1. OS loads Electron binary
2. Electron initializes Node.js runtime
3. Electron fires `app.whenReady()` event
4. Control passes to `electron/main.ts`

---

### 2. Electron Main Process Initialization
**File:** `electron/main.ts`

**Sequence:**
```typescript
app.whenReady().then(createWindow);
```

**createWindow() Function:**
1. Call `createMenu()` to build platform-specific menu
2. Create BrowserWindow with:
   - Dimensions: 1400x900
   - Preload script: `electron/preload.js`
   - Context isolation: true
   - Node integration: false
3. Hide menu bar on Windows/Linux (keep on macOS)
4. Load renderer:
   - Dev mode: Load `http://localhost:5173` (Vite dev server)
   - Prod mode: Load `dist/index.html` (bundled files)
5. Open DevTools in dev mode
6. Register window event handlers (closed, activate)

**IPC Handler Registration:**
Registered in module scope (before window creation):
- `get-user-data-path` → Returns `app.getPath('userData')`
- `join-path` → Path joining utility
- `read-file` → `fs.readFileSync(filePath, 'utf-8')`
- `write-file` → `fs.writeFileSync(filePath, content, 'utf-8')`
- `read-dir` → `fs.readdirSync(dirPath)`
- `exists` → `fs.existsSync(filePath)`
- `mkdir` → `fs.mkdirSync(dirPath, { recursive: true })`
- `rmdir` → `fs.rmSync(dirPath, { recursive: true, force: true })`
- `stat` → `fs.statSync(filePath)`
- `show-save-dialog` → `dialog.showSaveDialog(mainWindow, options)`
- `show-open-dialog` → `dialog.showOpenDialog(mainWindow, options)`

---

### 3. Renderer Process Initialization
**File:** `src/main.tsx`

**Sequence:**
1. Load theme from localStorage
2. Apply theme to `document.documentElement`
3. Call `ReactDOM.createRoot(document.getElementById('root')!)`
4. Render `<React.StrictMode><App /></React.StrictMode>`

**App Component Mount:**
1. Initialize Zustand store (first access)
2. Load state from localStorage:
   - Panel configuration (leftPanel, rightPanel)
   - Scout presets
   - Copilot config
   - Settings (API keys, model params)
   - Last opened tree ID
3. Load last opened tree from disk via `loadTree(lastOpenedTreeId)`
4. Render layout: Header, LeftPanel, TextEditor, RightPanel, BottomPanel, StatusRibbon
5. Attach `useKeybindings` hook for global shortcuts

**Store Initialization:**
```typescript
const useStore = create<State>((set, get) => ({
  // Initial state from defaults
  trees: new Map(),
  currentTree: null,
  scouts: loadScoutsFromLocalStorage(),
  copilot: loadCopilotFromLocalStorage(),
  settings: loadSettingsFromLocalStorage(),
  // ... actions
}));
```

**Tree Loading:**
- If `lastOpenedTreeId` exists: load tree from userData/trees/
- If not: show empty workspace
- On error: log and show empty workspace

---

## User Interaction Entry Points

### Keyboard Shortcuts
**Handler:** `src/hooks/useKeybindings.ts`

**Attached to:** `document` (global listener)

**Shortcut Categories:**

#### Navigation (Always Active)
- **ArrowUp** - Select previous sibling
- **ArrowDown** - Select next sibling
- **ArrowLeft** - Select parent node
- **ArrowRight** - Select first child node

**Implementation:**
```typescript
if (e.key === 'ArrowUp') {
  e.preventDefault();
  const currentNode = getCurrentNode();
  const parent = getParent(currentNode);
  const siblings = parent.childIds;
  const currentIndex = siblings.indexOf(currentNode.id);
  if (currentIndex > 0) {
    setCurrentNode(siblings[currentIndex - 1]);
  }
}
```

#### Editing (Conditional: Editor Focused)
- **Cmd/Ctrl+Shift+S** - Split node at cursor position
- **Cmd/Ctrl+Shift+M** - Merge current node with parent
- **Cmd/Ctrl+Shift+K** - Mass merge linear chains
- **Cmd/Ctrl+B** - Toggle bookmark
- **Cmd/Ctrl+Backspace** - Delete current node

**Condition Check:**
```typescript
const isEditorFocused = document.activeElement?.closest('.monaco-editor');
if (!isEditorFocused) return;
```

#### Expansion (Conditional: Editor Focused)
- **Cmd/Ctrl+E** - Manual expand with optional Copilot follow-up

**Flow:**
1. Lock current node
2. Get branch text
3. Call OpenRouter for N continuations
4. Add children to tree
5. Unlock node
6. If copilot enabled: run copilot on new children
7. Save tree

#### Agent Invocation (Two-Step)
- **Cmd/Ctrl+X** - Enter agent selection mode (show overlay)
- **1-9** - Invoke scout preset by number

**Flow:**
1. User presses Cmd+X
2. Hook sets `scoutInvokeMode = true`
3. App shows overlay with agent hotkeys
4. User presses number key
5. Hook calls `requestScoutStart(presetId)`
6. Scout module detects request and starts agent

---

### Mouse Interactions
**Entry Points:** Various component onClick handlers

#### Tree Module Clicks
**Component:** `src/components/modules/Tree.tsx`

**Interactions:**
- Click node → `setCurrentNode(nodeId)`
- Click bookmark icon → `toggleBookmark(nodeId)`

#### Graph Module Clicks
**Component:** `src/components/modules/Graph.tsx`

**Interactions:**
- Click node → `setCurrentNode(nodeId)`
- Zoom controls → ReactFlow viewport methods

#### Button Clicks
**Components:** Header, Actions, Scout, Copilot, Settings modules

**Examples:**
- Create Tree button → `createTree(name)`
- Manual Expand button → `runExpansion()`
- Start Scout button → `runScout(config, storeActions, shouldStop)`
- Save Settings button → `updateSettings(newSettings)`

#### Dropdown Selections
**Components:** Header, LeftPanel, RightPanel

**Examples:**
- Workspace dropdown → `selectTree(treeId)`
- Panel module dropdown → `updatePanels({ leftPanel: 'graph' })`

---

### Text Input
**Component:** `src/components/TextEditor.tsx`

**Entry Point:** Monaco editor `onChange` event

**Flow:**
1. User types in Monaco editor
2. Monaco fires onChange with new text content
3. TextEditor extracts current node text (excluding ancestors)
4. TextEditor calls `updateNodeText(currentNodeId, newText)`
5. Store updates node.text
6. Store schedules debounced save (500ms)

**Debouncing:**
- Prevents save on every keystroke
- Batches rapid edits into single save
- Timer resets on each edit
- Flush on beforeunload (prevent data loss)

---

### Application Menu
**Defined in:** `electron/main.ts` (createMenu function)

**Menu Items:**

#### macOS-Specific
- **Helm → About** - Standard macOS about dialog
- **Helm → Services** - System services submenu
- **Helm → Hide / Quit** - Standard macOS app controls

#### File Menu
- **Close Window** (macOS) or **Quit** (Windows/Linux)

#### Edit Menu (macOS Only)
- **Undo / Redo** - Standard text editing (Monaco handles)
- **Cut / Copy / Paste / Select All**

#### View Menu
- **Toggle Fullscreen** (F11)
- **Toggle Developer Tools** (Cmd/Ctrl+Shift+I)

**Note:** Most application actions triggered via UI buttons, not menu items

---

## Component Action Entry Points

### Header Component
**File:** `src/components/Header.tsx`

**Actions:**

#### Create Tree
**Trigger:** Click "New" button
**Flow:**
1. Prompt user for tree name (input dialog)
2. Call `fileSystem.createTree(name)`
3. FileSystem creates empty tree JSON in userData/trees/
4. Call `store.createTree(name)` to add to store
5. Call `store.selectTree(newTreeId)` to switch to it

#### Rename Tree
**Trigger:** Click tree name, edit inline
**Flow:**
1. Show inline input field
2. On blur/enter: call `store.renameTree(currentTreeId, newName)`
3. Store updates tree.name
4. Call `fileSystem.saveTree(currentTree)`

#### Delete Tree
**Trigger:** Click delete icon
**Flow:**
1. Show confirmation dialog
2. If confirmed: call `store.deleteTree(currentTreeId)`
3. Store removes tree from map
4. Call `fileSystem.deleteTree(treeId)` to remove file
5. If no trees left: show empty state

#### Select Tree
**Trigger:** Select from dropdown
**Flow:**
1. Call `fileSystem.loadTree(selectedTreeId)`
2. FileSystem reads JSON, deserializes to Tree object
3. Call `store.selectTree(loadedTree)`
4. Store sets currentTree, triggers re-render

#### Extract Subtree
**Trigger:** Click "Extract" button
**Flow:**
1. Show save dialog for new tree name
2. Call `fileSystem.extractSubtree(currentNodeId, currentTree)`
3. FileSystem creates new tree with current node as root
4. Save new tree to userData/trees/
5. Reload tree list in dropdown

---

### Actions Module
**File:** `src/components/modules/Actions.tsx`

**Actions:**

#### Manual Expand
**Trigger:** Click "Expand" button
**Flow:**
1. Lock current node
2. Get branch text
3. Call OpenRouter for N continuations (from settings.branchingFactor)
4. Add N children to tree
5. Unlock node
6. **Note:** Does NOT trigger Copilot (manual only)

#### Cull to Bookmarks
**Trigger:** Click "Cull to Bookmarks" button
**Flow:**
1. Call `store.cullAndMergeToBookmarks()`
2. Store builds keep-set: bookmarks + ancestors + selective descendants
3. Store builds delete-set: all nodes NOT in keep-set
4. Store deletes all nodes in delete-set
5. Store merges linear chains
6. Save tree

#### Mass Merge
**Trigger:** Click "Mass Merge" button
**Flow:**
1. Call `store.massMerge()`
2. Store identifies linear chains (nodes with single child)
3. Store merges bottom-up: concatenate text, adopt grandchildren, delete child
4. Repeat until no more single-child nodes
5. Save tree

#### Import Tree
**Trigger:** Click "Import" button
**Flow:**
1. Show open file dialog (filter: .json)
2. User selects file
3. Call `fileSystem.importTree(filePath)`
4. FileSystem reads JSON, validates structure
5. FileSystem copies to userData/trees/ with new ID
6. Call `store.loadTreeList()` to refresh dropdown

#### Export Tree
**Trigger:** Click "Export" button
**Flow:**
1. Show save file dialog (default: tree.json)
2. User selects save location
3. Call `fileSystem.saveTree(currentTree, customPath)`
4. FileSystem serializes and writes to selected location

---

### Scout Module
**File:** `src/components/modules/Scout.tsx`

**Actions:**

#### Create Preset
**Trigger:** Click "Add Scout" button
**Flow:**
1. Show form with preset fields (name, type, vision, range, depth, etc.)
2. On submit: call `store.addScout(config)`
3. Store adds to scouts array
4. Store saves to localStorage
5. Preset appears in list with hotkey assignment

#### Update Preset
**Trigger:** Edit preset fields and save
**Flow:**
1. Modify config fields (vision, range, depth, cycles, etc.)
2. Call `store.updateScout(presetId, updatedConfig)`
3. Store updates scouts array
4. Store saves to localStorage

#### Delete Preset
**Trigger:** Click delete icon
**Flow:**
1. Call `store.deleteScout(presetId)`
2. Store removes from scouts array
3. Store saves to localStorage

#### Start Agent
**Trigger:** Click "Start" button or press Cmd+X → number
**Flow:**
1. Retrieve preset config from store
2. Create shouldStop ref (mutable flag)
3. Call agent function based on type:
   - Scout: `runScout(config, storeActions, shouldStop)`
   - Witness: `runWitness(config, storeActions, shouldStop)`
   - Campaign: `runCampaign(config, storeActions, shouldStop)`
4. Agent runs asynchronously, updating store throughout
5. Module displays output log
6. On completion: agent sets active=false

#### Stop Agent
**Trigger:** Click "Stop" button
**Flow:**
1. Set `shouldStop.current = true`
2. Agent checks shouldStop in loop, breaks on true
3. Agent cleanup: delete partial work, unlock nodes
4. Agent sets active=false
5. Module displays "Agent stopped" message

---

### Copilot Module
**File:** `src/components/modules/Copilot.tsx`

**Actions:**

#### Enable/Disable
**Trigger:** Toggle switch
**Flow:**
1. Call `store.updateCopilot({ enabled: !copilot.enabled })`
2. Store updates copilot.enabled
3. Store saves to localStorage
4. If disabled: no auto-run after manual expand

#### Configure
**Trigger:** Edit fields (instructions, vision, range, depth)
**Flow:**
1. Modify config fields
2. Call `store.updateCopilot(updatedFields)`
3. Store updates copilot config
4. Store saves to localStorage

**Note:** Copilot is NOT triggered from this module; it's triggered by TextEditor after manual expand

---

### Settings Module
**File:** `src/components/modules/Settings.tsx`

**Actions:**

#### Update API Key
**Trigger:** Edit API key input field
**Flow:**
1. Type in input field
2. On blur/change: call `store.updateSettings({ apiKey: newKey })`
3. Store updates settings.apiKey
4. Store saves to localStorage

#### Update Models
**Trigger:** Edit model dropdown or parameters
**Flow:**
1. Select model or change temperature/max_tokens
2. Call `store.updateSettings({ continuationModel: newModel })`
3. Store updates settings
4. Store saves to localStorage

**Model Parameters:**
- Continuation model (for branching)
- Assistant model (for decisions)
- Temperature (0.0 - 1.0)
- Max tokens (response length)
- Branching factor (N children per expand)

---

## Store Action Entry Points

All user interactions eventually call store actions. Store is the single source of truth.

### Navigation Actions
```typescript
setCurrentNode(nodeId: string)
selectTree(treeId: string)
```

**Called by:**
- Tree module (node click)
- Graph module (node click)
- Keybindings (arrow keys)
- Header (workspace dropdown)

---

### Text Editing Actions
```typescript
updateNodeText(nodeId: string, text: string)
```

**Called by:**
- TextEditor (Monaco onChange)

---

### Structure Editing Actions
```typescript
addNode(parentId: string, text: string): string
deleteNode(nodeId: string)
splitNodeAt(nodeId: string, offset: number)
mergeWithParent(nodeId: string)
massMerge()
```

**Called by:**
- Keybindings (split, merge, delete shortcuts)
- Actions module (manual operations)
- Agents (expansion, pruning)
- Copilot (auto-follow-up)

---

### Bookmark Actions
```typescript
toggleBookmark(nodeId: string)
cullAndMergeToBookmarks()
```

**Called by:**
- Keybindings (Cmd+B)
- Tree module (bookmark icon click)
- Actions module (cull button)

---

### Locking Actions
```typescript
lockNode(nodeId: string, reason: LockReason)
unlockNode(nodeId: string)
```

**Called by:**
- Agents (before/after mutations)
- Keybindings (before expand)
- TextEditor (before expand)

**Lock Reasons:**
- `'expanding'` - Manual user expansion
- `'scout-active'` - Scout agent
- `'witness-active'` - Witness agent
- `'copilot-deciding'` - Copilot

---

### Workspace Actions
```typescript
createTree(name: string)
renameTree(treeId: string, name: string)
deleteTree(treeId: string)
loadTreeList()
```

**Called by:**
- Header (workspace management)
- Actions module (import/export)

---

### Agent Actions
```typescript
addScout(config: ScoutConfig)
updateScout(id: string, config: Partial<ScoutConfig>)
deleteScout(id: string)
requestScoutStart(id: string)
addScoutOutput(text: string)
```

**Called by:**
- Scout module (preset CRUD, start/stop)
- Keybindings (Cmd+X → number)
- Agents (output logging)

---

## External API Entry Points

### OpenRouter API
**Client:** `src/utils/openrouter.ts`

**Endpoints:**

#### POST /chat/completions (Continuation Model)
**Purpose:** Generate text continuations for branching

**Request:**
```json
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [{ "role": "user", "content": "Branch text..." }],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**Headers:**
- `Authorization: Bearer <apiKey>`
- `HTTP-Referer: https://helm.app`
- `X-Title: Helm`

**Called by:**
- Manual expand (Keybindings, Actions module)
- Scout agent (depth-first expansion)
- Copilot (auto-follow-up)

#### POST /chat/completions (Assistant Model)
**Purpose:** Generate keep/delete decisions for pruning

**Request:**
```json
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [{ "role": "user", "content": "Decision prompt with siblings..." }],
  "temperature": 0.3,
  "max_tokens": 1000
}
```

**Called by:**
- Scout agent (after expansion)
- Witness agent (pruning pass)
- Copilot (decide on children)

**Retry Logic:**
- 3 attempts max
- Exponential backoff: 1s, 2s, 4s
- Retry on network errors and 5xx
- Bubble error after max retries

---

### Electron Filesystem IPC
**Bridge:** `window.electronAPI` (exposed by preload.ts)

**Handlers:**

#### read-file
**Purpose:** Read tree JSON from disk

**Call:** `await window.electronAPI.readFile(filePath)`

**Returns:** JSON string

**Called by:**
- FileSystem.loadTree (workspace loading)

#### write-file
**Purpose:** Write tree JSON to disk

**Call:** `await window.electronAPI.writeFile(filePath, jsonString)`

**Returns:** true on success

**Called by:**
- FileSystem.saveTree (debounced saves)

#### read-dir
**Purpose:** List trees in userData/trees/

**Call:** `await window.electronAPI.readDir(dirPath)`

**Returns:** Array of filenames

**Called by:**
- FileSystem.loadTreeList (workspace dropdown)

#### exists
**Purpose:** Check if file/directory exists

**Call:** `await window.electronAPI.exists(path)`

**Returns:** boolean

**Called by:**
- FileSystem utilities (before read/write)

#### mkdir
**Purpose:** Create directory recursively

**Call:** `await window.electronAPI.mkdir(dirPath)`

**Returns:** true on success

**Called by:**
- FileSystem initialization (ensure userData/trees/ exists)

#### rmdir
**Purpose:** Delete directory recursively

**Call:** `await window.electronAPI.rmdir(dirPath)`

**Returns:** true on success

**Called by:**
- FileSystem.deleteTree (remove tree file)

#### stat
**Purpose:** Get file metadata

**Call:** `await window.electronAPI.stat(filePath)`

**Returns:** `{ isFile, isDirectory, size, mtime }`

**Called by:**
- FileSystem utilities (validate paths)

#### show-save-dialog
**Purpose:** Native save file picker

**Call:** `await window.electronAPI.showSaveDialog({ defaultPath, filters })`

**Returns:** Selected file path or undefined

**Called by:**
- Header (extract subtree)
- Actions module (export tree)

#### show-open-dialog
**Purpose:** Native open file picker

**Call:** `await window.electronAPI.showOpenDialog({ filters, properties })`

**Returns:** Selected file path or undefined

**Called by:**
- Actions module (import tree)

---

## Background Processes

### Debounced Save Timer
**Location:** `src/store.ts` (inside mutation actions)

**Trigger:** Any tree mutation (updateNodeText, addNode, deleteNode, etc.)

**Flow:**
1. Store mutation occurs
2. Store clears existing save timer (if any)
3. Store sets new timer: `setTimeout(() => saveTree(currentTree), 500)`
4. If another mutation occurs within 500ms, timer resets
5. After 500ms of silence, saveTree executes
6. FileSystem serializes tree and writes to disk

**Flush on Exit:**
```typescript
window.addEventListener('beforeunload', () => {
  if (currentTree) {
    fileSystem.saveTree(currentTree);  // Synchronous
  }
});
```

---

### Long-Running Agents

#### Scout Agent Loop
**Entry:** `runScout(config, storeActions, shouldStop)`

**Flow:**
1. Start at current node
2. Lock node
3. Parallel expand: fire N continuation requests
4. Add all children to tree
5. Decision: fire assistant model request
6. Prune rejected children
7. Unlock node
8. Check shouldStop: if true, cleanup and return
9. Recurse to first kept child
10. Repeat until depth limit or shouldStop

**Background Characteristics:**
- Async function (returns Promise)
- Long-running (seconds to minutes)
- Interruptible (shouldStop flag)
- Updates store progressively (visible to UI)

#### Witness Agent Loop
**Entry:** `runWitness(config, storeActions, shouldStop)`

**Flow:**
1. Start at deepest descendant
2. Lock sibling set
3. Compare siblings in chunks (size = max(2, range))
4. Decision: fire assistant model request
5. Keep one sibling per chunk, delete rest
6. Unlock siblings
7. Check shouldStop: if true, cleanup and return
8. Move to parent level
9. Repeat until root or shouldStop

#### Campaign Agent Cycles
**Entry:** `runCampaign(config, storeActions, shouldStop)`

**Flow:**
1. For cycle 1 to N:
   - Compute cycle overrides (vision, range, depth)
   - Run private Scout phase with overrides
   - Find deepest descendant
   - Run private Witness phase with overrides
   - Check shouldStop: if true, cleanup and return
2. After all cycles: return

**Characteristics:**
- Alternates between Scout and Witness
- Increasing parameters per cycle
- Can run for minutes to hours

#### Copilot Auto-Run
**Entry:** `runCopilotOnNode(nodeId, config, storeActions, shouldStop)`

**Trigger:** After manual expand in TextEditor (if copilot.enabled)

**Flow:**
1. Get node's children (newly created)
2. For each child (breadth-first):
   - Lock child
   - Build decision prompt
   - Fire assistant model request
   - If decision is "delete": delete child
   - If decision is "keep": optionally expand child
   - Unlock child
   - Check shouldStop
3. Add output to copilot.outputs

**Characteristics:**
- Triggered automatically, not by user action
- Short-lived (processes immediate children only)
- Respects same locking discipline as agents

---

## Environment-Specific Entry Points

### Development Mode
**Detection:** `!app.isPackaged` in electron/main.ts

**Entry Points:**
- Vite dev server (http://localhost:5173)
- HMR (Hot Module Replacement) for instant updates
- DevTools auto-open
- Source maps for debugging

**Startup:**
1. Terminal 1: `npm run dev:vite` (starts Vite server)
2. Terminal 2: `npm run dev:electron` (compiles and starts Electron)
3. Electron loads `VITE_DEV_SERVER_URL` or defaults to localhost:5173

### Production Mode
**Detection:** `app.isPackaged` in electron/main.ts

**Entry Points:**
- Bundled dist/index.html
- No DevTools (unless manually opened)
- Optimized bundles (minified, tree-shaken)

**Startup:**
1. User launches packaged app (Helm.app, Helm.exe)
2. Electron loads dist/index.html from asar archive
3. React app initializes from bundled JavaScript

---

## Where to Add New Entry Points

### Adding a new keyboard shortcut
**Location:** `src/hooks/useKeybindings.ts`

**Steps:**
1. Add key detection in switch/if statement
2. Call store action or async function
3. Prevent default browser behavior
4. Test across platforms (macOS uses Cmd, Windows/Linux use Ctrl)

### Adding a new IPC handler
**Locations:** `electron/main.ts`, `electron/preload.ts`

**Steps:**
1. Register handler in main.ts: `ipcMain.handle('new-handler', async (_, arg) => { ... })`
2. Expose in preload.ts: `newHandler: (arg) => ipcRenderer.invoke('new-handler', arg)`
3. Call from renderer: `window.electronAPI.newHandler(arg)`
4. Add TypeScript types in `src/electron.d.ts`

### Adding a new store action
**Location:** `src/store.ts`

**Steps:**
1. Add action function to store definition
2. Ensure immutability (create new references)
3. Maintain invariants (parent-child links, locks, etc.)
4. Add TypeScript type to State interface
5. Call from component or utility

### Adding a new agent type
**Location:** `src/utils/agents.ts`

**Steps:**
1. Define new agent function: `runNewAgent(config, storeActions, shouldStop)`
2. Follow locking discipline (lock before mutate, unlock always)
3. Check shouldStop regularly
4. Update ScoutModule to support new type
5. Add to agent type enum in types.ts

### Adding a new module panel
**Location:** `src/components/modules/`

**Steps:**
1. Create new component file: `NewModule.tsx`
2. Subscribe to needed store slices
3. Call store actions for mutations
4. Add to panel switcher in LeftPanel.tsx and RightPanel.tsx
5. Update panel type enum in store

---

## Debugging Entry Points

### Finding where an action is triggered
1. Search for store action name in codebase: `grep -r "updateNodeText"`
2. Check Keybindings for shortcuts
3. Check component onClick handlers
4. Check agent utilities for mutations

### Tracing execution flow
1. Use browser DevTools debugger
2. Set breakpoints in store actions
3. Inspect call stack to see caller
4. Use React DevTools to inspect props/state

### Monitoring IPC calls
1. Open Electron DevTools
2. Check Console for IPC errors
3. Add logging in preload.ts: `console.log('IPC:', channel, args)`
4. Add logging in main.ts handler

### Profiling agent performance
1. Add timing logs in agent utils: `console.time('Scout iteration')`
2. Monitor network tab for OpenRouter calls
3. Check store mutations in React DevTools
4. Profile with Chrome DevTools Performance tab

---

## Summary of All Entry Points

**Startup:**
- OS launch → Electron → Main process → Renderer

**User Input:**
- Keyboard → useKeybindings → Store actions
- Mouse → Component handlers → Store actions
- Text → Monaco onChange → updateNodeText
- Menu → Electron menu handlers

**Components:**
- Header → Workspace management
- Actions → Manual operations
- Scout → Agent control
- Copilot → Auto-follow-up config
- Settings → API and model config

**Store:**
- Navigation, editing, structure, bookmarks, locking, workspace, agents

**External:**
- OpenRouter → Continuation and decision models
- Filesystem IPC → Tree persistence

**Background:**
- Debounced save timer
- Long-running agents (Scout, Witness, Campaign, Copilot)

**Environment:**
- Dev: Vite server, HMR, DevTools
- Prod: Bundled files, optimized
