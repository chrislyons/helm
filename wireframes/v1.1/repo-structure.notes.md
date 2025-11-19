# Repository Structure Notes

## Overview

Helm follows a standard Electron + React + Vite project structure with clear separation between main process (Node.js), renderer process (React), and shared configuration.

## Directory Purposes

### `/src` - React Application

The heart of the application, containing all renderer process code.

**Core Files:**
- `main.tsx` - React entry point, initializes theme from localStorage
- `App.tsx` - Root layout component, manages panel system (5302 lines)
- `store.ts` - **Critical file** - Zustand store with all application state (1343 lines)
- `types.ts` - TypeScript interfaces for Tree, TreeNode, ScoutConfig, etc.

**Key Architecture Decision:** Single store pattern with Zustand provides predictable state management without Redux boilerplate.

### `/src/components` - UI Layer

**Layout Components:**
- `Header.tsx` - Workspace selector with tree CRUD operations
- `LeftPanel.tsx` / `RightPanel.tsx` - Swappable module containers
- `BottomPanel.tsx` - Help/Graph toggle panel
- `StatusRibbon.tsx` - Font controls and ribbon state
- `TextEditor.tsx` - Monaco editor wrapper with extensive keybindings

**Technical Note:** Panels use a `PanelConfig` type with `top` and `bottom` slots, allowing users to customize their workspace layout.

### `/src/components/modules` - Swappable Modules

Each module can be placed in any panel slot:

| Module | Purpose | Key Dependencies |
|--------|---------|------------------|
| `Tree.tsx` | Hierarchical view | `currentTree`, `setCurrentNode` |
| `Graph.tsx` | DAG visualization | ReactFlow, Dagre, `scouts` |
| `Scout.tsx` | Agent management | Full agent orchestration |
| `Actions.tsx` | Tree operations | Expand/cull, import/export |
| `Copilot.tsx` | Auto-QC settings | `copilot`, `updateCopilot` |
| `Settings.tsx` | Configuration | API key, model settings |

### `/src/utils` - Business Logic

**Critical Files:**

1. **`agents.ts`** (~800 lines)
   - `runScout()` - Depth-first expansion with decisions
   - `runWitness()` - Sibling pruning and chain merging
   - `runCampaign()` - Scout→Witness cycles
   - `runCopilotOnNode()` - Auto-QC after expansion
   - `expandNode()` - Core branching logic

2. **`openrouter.ts`**
   - `callContinuationModel()` - Text generation
   - `callAssistantModel()` - Decision making
   - Retry logic with exponential backoff (1s, 2s, 4s)

3. **`fileSystem.ts`**
   - Tree CRUD operations
   - Map↔Array serialization
   - IPC abstraction layer

### `/src/hooks` - React Hooks

- `useKeybindings.ts` - Global keyboard shortcuts
  - Alt+Arrow: Navigation
  - Alt+Shift+Arrow: Bookmark navigation
  - Ctrl+X: Agent invocation
  - Alt+Backspace: Delete node

### `/electron` - Main Process

**Files:**
- `main.ts` - Window management, IPC handlers, native menu
- `preload.ts` - Context bridge for secure API exposure

**IPC Channels:**
- File operations: `read-file`, `write-file`, `exists`, `mkdir`, `rmdir`
- Dialogs: `show-save-dialog`, `show-open-dialog`
- Paths: `get-user-data-path`, `join-path`

### `/docs` - Documentation

**Key Documents:**
- `ARCHITECTURE.md` - System design overview
- `COMPONENT-MAP.md` - Component hierarchy
- `DATAFLOW.md` - State flow diagrams
- `RUNTIME-SEQUENCE.md` - Execution sequences
- `SECURITY-THREATS.md` - Security considerations
- `UX-PMF-ANALYSIS.md` - User experience analysis

**Organization:**
- `_diagrams/` - Visual assets
- `archive/` - Archived docs (>90 days old)

### `/build` - Build Assets

- `icons/` - App icons for all platforms
- `installer.nsh` - NSIS installer script (Windows)
- `entitlements/` - macOS code signing entitlements

### `/wireframes` - Architecture Diagrams

Version-tagged Mermaid diagrams with accompanying notes.

## Configuration Files

### Build Pipeline

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, metadata |
| `vite.config.ts` | Vite build configuration with electron plugin |
| `electron-builder.yml` | Packaging for DMG (macOS), NSIS (Windows) |

### TypeScript

| File | Target |
|------|--------|
| `tsconfig.json` | React/Vite compilation |
| `tsconfig.electron.json` | Electron main process |
| `tsconfig.node.json` | Node.js tooling |

### Other

- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS pipeline
- `prompts.json` - Agent system prompts (Scout, Witness, Copilot)

## Code Organization Patterns

### Where to Find Code

| Looking for... | Location |
|----------------|----------|
| State management | `src/store.ts` |
| Agent algorithms | `src/utils/agents.ts` |
| API integration | `src/utils/openrouter.ts` |
| Keybindings | `src/hooks/useKeybindings.ts`, `src/components/TextEditor.tsx` |
| Panel layout | `src/App.tsx` |
| Tree persistence | `src/utils/fileSystem.ts` |
| IPC handlers | `electron/main.ts` |

### File Size Indicators

- `store.ts` (1343 lines) - Complex state logic
- `agents.ts` (~800 lines) - Agent orchestration
- `App.tsx` (5302 bytes) - Layout complexity
- `TextEditor.tsx` - Monaco integration

## Technical Debt & Complexity

### Areas of High Complexity

1. **`store.ts`** - Consider splitting into domain slices:
   - `treeStore.ts` - Tree state and operations
   - `agentStore.ts` - Scout/Copilot state
   - `uiStore.ts` - Panel and UI state

2. **`agents.ts`** - Algorithm complexity:
   - Nested async operations
   - Lock management across agents
   - Multiple cancellation paths

3. **`TextEditor.tsx`** - Monaco integration:
   - Platform-specific keybindings
   - Custom decorations
   - Read-only region management

### Improvement Opportunities

- Add unit tests for agent algorithms
- Extract keybinding configuration to separate file
- Consider state machine for agent lifecycle

## Common Workflows

### Adding a New Module

1. Create `src/components/modules/NewModule.tsx`
2. Add to `PanelModule` type in `src/types.ts`
3. Add case in panel rendering logic (`LeftPanel.tsx`, `RightPanel.tsx`)
4. Update panel defaults if needed in `store.ts`

### Adding a New Keybinding

1. Add to `useKeybindings.ts` for global shortcuts
2. Add to `TextEditor.tsx` Monaco commands if editor-specific
3. Update Help panel content if user-facing

### Modifying Agent Behavior

1. Modify algorithm in `src/utils/agents.ts`
2. Update prompts in `prompts.json` if prompt changes
3. Add/update ScoutConfig properties in `types.ts`
4. Update UI in `Scout.tsx` for new settings

## References

- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System design
- [docs/COMPONENT-MAP.md](../../docs/COMPONENT-MAP.md) - Component details
- [docs/INDEX.md](../../docs/INDEX.md) - Full documentation index
