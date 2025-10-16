# Helm Architecture Overview

## Runtime and Process Model
- **Desktop shell**: Helm is packaged as an Electron application. The Electron main process (`electron/main.ts`) owns the application window, registers IPC handlers for filesystem access (`ipcMain.handle('read-file' | 'write-file' | 'exists' | 'mkdir' | 'rmdir' | 'stat')`), and loads either the Vite dev server or the production bundle depending on `app.isPackaged`.
- **Preload bridge**: `electron/preload.ts` exposes a constrained `window.electronAPI` surface composed of asynchronous wrappers over the IPC endpoints. The renderer never gains direct Node.js access and must call through this boundary for persistence or dialog access.
- **Renderer**: A single React 18 tree bootstrapped from `src/main.tsx` renders the UI. There are no web workers; all agent orchestration and graph computation run on the renderer thread. Global state lives in a single Zustand store (`src/store.ts`) that is imported across components and agent utilities.

## UI Stack and Reactivity
- **Component layout**: `src/App.tsx` arranges the shell—left/right panels, Monaco editor, ribbon, bottom panel, and optional agent overlay. Panel content swaps between modules (Tree, Graph, Agents, Copilot, Actions, Settings) that live in `src/components/modules`.
- **Editor**: `src/components/TextEditor.tsx` wraps Monaco, synchronizes branch text via store selectors, and registers platform-specific keybindings that map directly to store actions (split, merge, mass merge, expand) and asynchronous agent calls.
- **Graph view**: `src/components/modules/Graph.tsx` uses ReactFlow plus Dagre layouting to render the tree as a DAG, highlight the current node, and auto-fit the viewport whenever the selection changes.
- **Keybindings**: `src/hooks/useKeybindings.ts` attaches global handlers for navigation, editing, agent invocation, and Copilot automation. The hook interacts with the store through both React hooks and `useStore.getState()` to access up-to-date state inside async callbacks.

## Persistence & Settings
- **Trees**: Trees are saved under the user-data `trees/` directory managed by Electron. `src/utils/fileSystem.ts` handles serialization (Maps flattened to arrays) and deserialization (arrays rehydrated into Maps) and exposes helpers for import/export and subtree extraction. Saves are debounced (`TREE_SAVE_DEBOUNCE_MS`) and flushed on `beforeunload`.
- **Local storage**: UI layout, scouts, copilot settings, automatic bookmark configuration, and the last opened tree ID are persisted in `window.localStorage` through helper loaders/persistors inside `src/store.ts`. On load, agents and copilot are explicitly marked inactive.
- **API keys**: The OpenRouter key is stored in the settings object (default empty string) and persisted via `persistSettings`.

## Module Responsibilities
- `src/store.ts`: Central state machine for tree operations, locking, bookmarking, panel layout, settings persistence, and exposes a large action surface consumed by UI and agents.
- `src/utils/agents.ts`: Agent orchestration (Scout/Witness/Campaign/Copilot). Encapsulates OpenRouter calls, branching heuristics, pruning, and locking discipline.
- `src/utils/openrouter.ts`: HTTP client with exponential backoff, shared across continuation and assistant flows.
- `src/components/modules/*.tsx`: UI panels wired to store actions (e.g., `Scout.tsx` starting agent runs; `Actions.tsx` calling expansion helpers; `Graph.tsx` visualizing state).
- `src/components/Header.tsx` + `utils/fileSystem.ts`: Workspace lifecycle (load, create, rename, delete, extract).

## Data Model
- **TreeNode**: `{ id, text, parentId, childIds[], locked, lockReason }` with `lockReason` enumerating `expanding`, `scout-active`, `witness-active`, `copilot-deciding`.
- **Tree**: `{ id, name, nodes: Map<string, TreeNode>, rootId, currentNodeId, bookmarkedNodeIds[] }`.
- **Agents**: `ScoutConfig` models all agent types with additional Campaign overrides and shotgun parameters; `CopilotConfig` controls automated follow-up.
- **Settings**: Split between continuation model (includes branching factor) and assistant model. All defaults live in `DEFAULT_SETTINGS` and `DEFAULT_COPILOT` constants.
- **Invariants**:
  - `Tree.nodes` must contain at least the `rootId`; every child listed in `childIds` must exist in the map.
  - Parent-child relationships are maintained whenever nodes are added, deleted, split, merged, or culled (store mutators update both sides).
  - Locked nodes prevent conflicting agent mutations; locks are released via `unlockNode` regardless of success or failure.
  - Bookmarked nodes are treated as anchors—delete/merge functions short-circuit when encountering bookmarks.

## Agent Lifecycle & Concurrency
- **Trigger points**: Users start agents via the Agents panel (`src/components/modules/Scout.tsx`) or keyboard (Ctrl/Cmd+X). Copilot auto-runs after manual expansions if enabled (`useKeybindings` and `TextEditor`).
- **Scout**: `runScout` performs depth-first expansion. For each node, it locks, parallelizes continuation requests (`Promise.all`), decides per child (`scoutDecision`), and recurses while honoring `shouldStop` cancellation tokens and `lockNode`/`unlockNode` discipline.
- **Witness**: `runWitness` prunes siblings and merges chains upward. It maintains a `lockedNodes` set, avoids bookmarked paths, compares siblings in `chunkSize = max(2, range)` batches, and uses `witnessDecision` responses to keep one continuation per chunk.
- **Campaign**: Alternates between private Scout and Witness phases, deriving per-cycle overrides (vision/range/depth) and running until `cycles` or cancellation. After each scout phase it recomputes the deepest descendant to seed Witness pruning.
- **Copilot**: `runCopilotOnNode` mirrors Scout semantics but respects `config.expansionEnabled`, skips deleting the user's current branch, and iterates breadth-first across the chosen depth. Copilot output is recorded via store actions.
- **Cancellation**: Each agent receives a `shouldStop` closure whose flag is flipped by the UI. On cancellation, generators attempt cleanup (deleting new children, unlocking nodes).

## OpenRouter Integration
- Two entry points—`callContinuationModel` (branch expansion) and `callAssistantModel` (decisions). Both serialize chat-style payloads, attach `Authorization: Bearer <apiKey>`, `HTTP-Referer`, and `X-Title` headers, and retry up to three times with exponential backoff (`withRetry`). Responses are parsed for `choices[0].message.content` with fallbacks to `.text`.
- The code assumes streaming is unnecessary: calls await full responses. There is no explicit rate limiting beyond `Promise.all` concurrency.
- Errors bubble up to callers; most agent loops catch and log, defaulting to cull/delete behavior on failure.

## Complexity Management
- **Mass merge**: Collapses linear chains bottom-up while respecting bookmarks and locks.
- **Cull & merge to bookmarks**: Builds a keep-set consisting of bookmarks, their ancestors, and selective descendants, deletes everything else, then performs a bookmark-aware merge pass.
- **Witness pruning**: Repeatedly trims sibling sets and merges single-child chains as part of the Witness agent routine.
- **Graph layout**: Dagre layout runs on every render; there is no virtualization, so large trees may stress the renderer.

## Copilot vs. Autonomous Agents
- **Manual + Copilot**: When a user expands a node via keybinding/editor action, Copilot may immediately process new children if enabled, sharing the same locking primitives and respecting a stop condition tied to `copilot.enabled`.
- **Autonomous**: Agents started from the panel manage their own loops, update their `active` status in the store, and log outputs to the UI.
- **Arbitration**: Locks (`lockNode`) prevent simultaneous Scout/Witness/Copilot actions on the same node. Copilot avoids deleting the current focus, while Witness explicitly honors bookmarks to maintain human-marked anchors.
