# Repository Structure - Extended Documentation

## Overview

Helm follows a standard Electron + React project structure with clear separation between main process (Node.js), renderer process (React), and build/documentation assets. The codebase is organized for maintainability with distinct concerns isolated into logical directories.

---

## Directory Breakdown

### `/src` - React Application (5,148 LOC)

The renderer process React application using TypeScript and Vite as the build tool.

**Root Files:**
- `main.tsx` - React DOM entry point, mounts `<App />` to `#root`
- `App.tsx` - Root layout shell with configurable panel system
- `store.ts` - Zustand state management (central nervous system)
- `types.ts` - All TypeScript interfaces and type definitions
- `index.css` - Global CSS with Tailwind utilities
- `electron.d.ts` - Type declarations for `window.electronAPI`

**`/components`** - UI Components
- Panel containers (Left, Right, Bottom) with swappable modules
- Core widgets: Header, StatusRibbon, TextEditor
- Each component uses Zustand hooks for state access

**`/components/modules`** - Swappable UI Modules
- Tree, Graph, Scout, Copilot, Actions, Settings
- All modules export consistent interface for panel system
- Self-contained with own state subscriptions

**`/utils`** - Core Business Logic
- `agents.ts` - Scout/Witness/Campaign orchestration logic
- `openrouter.ts` - HTTP client with retry/backoff
- `fileSystem.ts` - Electron IPC abstraction for persistence

**`/hooks`** - React Custom Hooks
- `useKeybindings.ts` - Global keyboard shortcut handler

### `/electron` - Main Process

Electron shell providing native desktop capabilities.

**Files:**
- `main.ts` - Window creation, IPC handler registration
- `preload.ts` - Context-isolated API bridge (`window.electronAPI`)

**Key Insight:** All filesystem operations route through IPC for security.

### `/docs` - Documentation (Flat Naming)

Following CLAUDE.md conventions with uppercase, flat file names.

**Structure:**
- Root `*.md` files - Active documentation
- `_diagrams/` - Mermaid diagrams and visuals
- `archive/` - Deprecated docs (>90 days)
- `INDEX.md` - Documentation catalog

### `/build` - Build Assets

Platform-specific packaging resources.

**Contents:**
- `icons/` - App icons for macOS (.icns), Windows (.ico), Linux (.png)
- `installer.nsh` - NSIS script for Windows installer
- `entitlements/` - macOS code signing entitlements

### `/tests` - Test Scaffolds

Regression test templates for identified bugs.

**Status:** Tests are scaffolded but not yet implemented (see `docs/TEST-PLAN.md`)

---

## Configuration Files

### Package Management
- `package.json` - Dependencies, scripts, metadata (npm, not pnpm)
- `package-lock.json` - Dependency lockfile

### TypeScript
- `tsconfig.json` - React/Vite compilation
- `tsconfig.electron.json` - Main process compilation
- `tsconfig.node.json` - Node.js tooling

### Build Tools
- `vite.config.ts` - Development server and bundling
- `electron-builder.yml` - Cross-platform packaging
- `postcss.config.js` - PostCSS pipeline
- `tailwind.config.js` - Tailwind CSS customization

### Application
- `prompts.json` - LLM prompt templates for agents
- `index.html` - HTML entry point

---

## Code Organization Patterns

### 1. Colocation by Feature
Modules contain all related code (UI, logic, types) in single files. This keeps context together and reduces jumping between files.

### 2. Utility Extraction
Shared business logic lives in `/utils`, imported by components. This prevents duplication and centralizes complex operations.

### 3. Single Store Pattern
All application state in `store.ts`. Components access via hooks, async operations via `getState()`. No prop drilling or context providers.

### 4. Type-First Development
`types.ts` defines all interfaces upfront. Components and utilities import shared types for consistency.

---

## Finding Code by Purpose

| Looking For | Location |
|-------------|----------|
| UI Components | `src/components/` |
| Swappable Panels | `src/components/modules/` |
| State Management | `src/store.ts` |
| Type Definitions | `src/types.ts` |
| Agent Logic | `src/utils/agents.ts` |
| API Calls | `src/utils/openrouter.ts` |
| File Operations | `src/utils/fileSystem.ts` |
| Keyboard Shortcuts | `src/hooks/useKeybindings.ts` |
| Electron Window | `electron/main.ts` |
| IPC Bridge | `electron/preload.ts` |
| LLM Prompts | `prompts.json` |
| Build Config | `electron-builder.yml` |

---

## Technical Debt & Notes

### Known Issues
1. **No Test Implementation** - Test scaffolds exist but no actual tests
2. **No Linting Config** - ESLint/Prettier not configured
3. **Missing Error Boundaries** - React errors can crash app

### Extension Points
1. Add new module: Create `src/components/modules/NewModule.tsx`
2. Add new IPC handler: Register in `electron/main.ts`, expose in `preload.ts`
3. Add new store slice: Extend state interface in `store.ts`
4. Add new agent type: Extend `ScoutConfig.type` union in `types.ts`

---

## References

- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System design overview
- [COMPONENT-MAP.md](../../docs/COMPONENT-MAP.md) - Component hierarchy
- [DATAFLOW.md](../../docs/DATAFLOW.md) - State flow patterns
