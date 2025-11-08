# Repository Structure - Detailed Notes

## Overview
Helm follows a standard Electron + React + TypeScript structure with clear separation between main process, renderer, and utilities. The repository is organized for maintainability with documentation following the flat uppercase naming convention specified in CLAUDE.md.

## Directory Purposes

### `/src` - Application Source
The core React application that runs in the Electron renderer process.

**Key Files:**
- `main.tsx` - React entry point, initializes theme and renders App
- `App.tsx` - Root component that assembles the layout (panels, editor, ribbon)
- `store.ts` - Single Zustand store containing all application state
- `types.ts` - Shared TypeScript type definitions (TreeNode, Tree, ScoutConfig, etc.)
- `electron.d.ts` - Type declarations for window.electronAPI bridge

**Organization Pattern:**
- Top-level files handle initialization and global state
- Component-specific logic lives in `/components`
- Pure business logic lives in `/utils`
- React-specific patterns live in `/hooks`

### `/src/components` - React UI Components
Presentation layer organized by function.

**Layout Components:**
- `Header.tsx` - Top bar with workspace dropdown and file operations
- `LeftPanel.tsx` / `RightPanel.tsx` - Configurable panel containers
- `BottomPanel.tsx` - Help content or embedded graph view
- `StatusRibbon.tsx` - Bottom status bar with font controls and window toggles
- `TextEditor.tsx` - Monaco editor with syntax highlighting and branch visualization

**Feature Modules (`/components/modules`):**
Each module is a self-contained panel that can be mounted in left/right slots:
- `Tree.tsx` - Hierarchical tree view with navigation and bookmarks
- `Graph.tsx` - ReactFlow visualization with Dagre auto-layout
- `Scout.tsx` - Agent preset management and execution controls
- `Copilot.tsx` - Autonomous follow-up configuration
- `Actions.tsx` - Manual tree operations (expand, merge, cull, bookmark)
- `Settings.tsx` - API key and model parameter configuration

### `/src/hooks` - Custom React Hooks
Reusable stateful logic.

- `useKeybindings.ts` - Global keyboard shortcuts for navigation, editing, and agent invocation

### `/src/utils` - Core Business Logic
Pure functions and orchestration logic independent of React.

- `agents.ts` - Scout/Witness/Campaign/Copilot orchestration, locking, branching decisions
- `openrouter.ts` - HTTP client with retry logic for OpenRouter API
- `fileSystem.ts` - Electron IPC wrappers for tree persistence, import/export, subtree extraction

### `/electron` - Desktop Shell
Electron main process that owns the window and provides filesystem access.

- `main.ts` - Application lifecycle, IPC handlers, window creation, menu setup
- `preload.ts` - Secure bridge exposing `window.electronAPI` to renderer

**IPC Channels:**
- `get-user-data-path` - Returns userData directory for tree storage
- `read-file` / `write-file` - Synchronous file I/O
- `read-dir` / `exists` / `mkdir` / `rmdir` / `stat` - Filesystem utilities
- `show-save-dialog` / `show-open-dialog` - Native file dialogs

### `/docs` - Documentation
Flat structure using uppercase naming (TOPIC-NAME.md pattern).

**Core Architecture:**
- `ARCHITECTURE.md` - System design, runtime model, data model, agent lifecycle
- `COMPONENT-MAP.md` - Component responsibilities and store dependencies
- `DATAFLOW.md` - Data flow patterns and synchronization

**Product & User Experience:**
- `HELM_PRODUCT_OVERVIEW.md` - Product vision and positioning
- `HELM_USER_FLOWS.md` - Common user workflows
- `HELM_COGNITIVE_MODEL.md` - Mental model for tree exploration

**Technical References:**
- `OPENROUTER.md` - API integration details
- `RUNTIME-SEQUENCE.md` - Execution flow diagrams
- `TREE-REDUCTION.md` - Pruning and merging algorithms
- `SECURITY-THREATS.md` - Security considerations
- `PERF-NOTES.md` - Performance optimization notes
- `TEST-PLAN.md` - Test scaffolding and regression checks

**Special Directories:**
- `_diagrams/` - Visual diagrams referenced in docs
- `archive/` - Old documentation (90+ days)

**Index:**
- `INDEX.md` - Documentation catalog for navigation

### `/build` - Electron Builder Assets
Resources used during packaging.

- `icons/` - Application icons for macOS/Windows/Linux
- `entitlements/` - macOS code signing entitlements
- `installer.nsh` - Windows NSIS installer customization

### Configuration Files (Root)

**Package Management:**
- `package.json` - Dependencies, scripts, electron-builder config
- `package-lock.json` - Locked dependency versions

**TypeScript:**
- `tsconfig.json` - Renderer process TypeScript config
- `tsconfig.electron.json` - Main process TypeScript config
- `tsconfig.node.json` - Build tooling TypeScript config

**Build Tools:**
- `vite.config.ts` - Vite bundler configuration
- `electron-builder.yml` - Desktop packaging settings

**Styling:**
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

**Repository:**
- `CLAUDE.md` - Repository-specific AI coding rules (extends workspace/global)
- `.gitignore` - Git exclusions
- `.claudeignore` - Claude Code file exclusions

**Application:**
- `index.html` - HTML shell for renderer
- `icon.png` - Application icon source
- `prompts.json` - Agent prompt templates

### `/public` - Static Assets
Files copied directly to build output without processing.

### `/tests` - Test Suites
Test scaffolding and regression checks.

- `failing/` - Known failing tests for tracking technical debt

### Generated Directories (Gitignored)

**Development:**
- `node_modules/` - npm dependencies
- `dist/` - Vite build output (renderer)
- `dist-electron/` - TypeScript build output (main process)

**Production:**
- `release/` - Electron-builder packaged applications

## Code Organization Patterns

### State Management
All state lives in a single Zustand store (`src/store.ts`) with no prop drilling:
- Components use `useStore` selectors to read state
- Components call store actions to mutate state
- Async agent code uses `useStore.getState()` for imperative access

### Component Architecture
- **Controlled components** - TextEditor synchronizes with store via effects
- **Module pattern** - Each panel is self-contained with its own UI and logic
- **Single source of truth** - Store owns all tree mutations

### Persistence Strategy
- **Trees** - Debounced save to userData/trees/ via Electron IPC
- **Settings** - Immediate save to localStorage
- **Workspace state** - Panel layout, scouts, copilot config in localStorage

### Type Safety
- Strict TypeScript with explicit types in `src/types.ts`
- Electron API typed through `electron.d.ts`
- No `any` types in core business logic

## Where to Look for Changes

**Adding UI features:**
- New panels → `src/components/modules/`
- Layout changes → `src/App.tsx`, `src/components/[Panel].tsx`
- Keyboard shortcuts → `src/hooks/useKeybindings.ts`

**Modifying tree operations:**
- Store actions → `src/store.ts` (mutations)
- Agent logic → `src/utils/agents.ts` (orchestration)
- File I/O → `src/utils/fileSystem.ts` (persistence)

**API integration:**
- OpenRouter calls → `src/utils/openrouter.ts`
- Prompt templates → `prompts.json`
- Model config → `src/components/modules/Settings.tsx`

**Desktop integration:**
- IPC handlers → `electron/main.ts`
- Security bridge → `electron/preload.ts`
- Packaging → `electron-builder.yml`

**Documentation:**
- Architecture changes → `docs/ARCHITECTURE.md`
- Component updates → `docs/COMPONENT-MAP.md`
- New features → Create new `docs/TOPIC-NAME.md` and update `docs/INDEX.md`

## Configuration Inheritance

Per CLAUDE.md, this repository inherits conventions from:
1. `~/chrislyons/dev/CLAUDE.md` (workspace)
2. `~/.claude/CLAUDE.md` (global)

Conflicts resolved in order: Helm CLAUDE.md → Workspace → Global → Code

## Anti-Patterns to Avoid

**Documentation:**
- ❌ Don't use PREFIX### pattern (use TOPIC-NAME.md)
- ❌ Don't use lowercase filenames (use UPPERCASE.md)
- ❌ Don't create nested doc directories (keep flat except _diagrams/, archive/)
- ❌ Don't skip INDEX.md updates

**Code:**
- ❌ Don't bypass the store for state mutations
- ❌ Don't use React state for tree data (store owns all tree state)
- ❌ Don't call filesystem APIs directly (use utils/fileSystem.ts)
- ❌ Don't skip locking when mutating nodes during agent operations
