# Component Map

| Component | Location | Responsibilities | Store Dependencies |
| --- | --- | --- | --- |
| `App` | `src/App.tsx` | Layout root, connects panels, editor, ribbon, bottom panel; wires keybinding hook and graph refs. | `scouts`, `bottomPanelHeight`, `setBottomPanelHeight`, `ribbonWindow` |
| `Header` | `src/components/Header.tsx` | Workspace selection, creation, renaming, deletion, subtree extraction; triggers file dialogs. | `trees`, `currentTree`, `selectTree`, `createTree`, `renameTree`, `deleteTree`, `extractSubtree`, `loadTreeList` |
| `LeftPanel` / `RightPanel` | `src/components/LeftPanel.tsx`, `src/components/RightPanel.tsx` | Configurable panel slots that swap between module components. | `leftPanel`, `rightPanel`, `updatePanels` |
| `BottomPanel` | `src/components/BottomPanel.tsx` | Hosts help content or embedded graph depending on ribbon selection. | `currentTree`, `ribbonWindow` |
| `StatusRibbon` | `src/components/StatusRibbon.tsx` | Font controls, ribbon window toggle, help trigger, exposes graph maximize hook. | `setRibbonWindow`, `ribbonWindow`, `currentTree` |
| `TextEditor` | `src/components/TextEditor.tsx` | Monaco editor with read-only ancestor region, command bindings, agent trigger UI. | `currentTree`, `updateNodeText`, `lockNode`, `unlockNode`, `addNode`, `splitNodeAt`, `mergeWithParent`, `massMerge`, `deleteNode`, `toggleBookmark`, `settings`, `addCopilotOutput` |
| `Actions` module | `src/components/modules/Actions.tsx` | Buttons for expansion, culling, merging, import/export, automatic bookmark tools. | Tree mutators (`lockNode`, `unlockNode`, `addNode`, `deleteNode`, `cullAndMergeToBookmarks`, etc.), `settings`, `updateSettings`, `automaticBookmarkConfig` |
| `Tree` module | `src/components/modules/Tree.tsx` | Displays tree hierarchy, supports selection, bookmark indicators, scout activity markers. | `currentTree`, `setCurrentNode`, `scouts`, `toggleBookmark` |
| `Graph` module | `src/components/modules/Graph.tsx` | ReactFlow visualization with Dagre layout, zoom controls, focus heuristics, campaign highlights. | `currentTree`, `setCurrentNode`, `scouts` |
| `Scout` module | `src/components/modules/Scout.tsx` | CRUD for agent presets, start/stop lifecycle, button assignments, output log. | `currentTree`, `settings`, `lockNode`, `unlockNode`, `addNode`, `deleteNode`, `mergeWithParent`, `scouts`, `addScout`, `updateScout`, `deleteScout`, `addScoutOutput`, `scoutStartRequest`, `clearScoutStartRequest` |
| `Copilot` module | `src/components/modules/Copilot.tsx` | Toggle copilot automation, edit instructions, adjust vision/range/depth, display latest output. | `copilot`, `updateCopilot` |
| `Settings` module | `src/components/modules/Settings.tsx` | Edit OpenRouter API key and model parameters for continuations/assistant models. | `settings`, `updateSettings` |
| `Actions` overlay (Agent selector) | within `App` | Displays active agent hotkeys when user presses Ctrl/Cmd+X. | `scouts`, `scoutInvokeMode` from hook |
| `useKeybindings` | `src/hooks/useKeybindings.ts` | Global navigation/editing shortcuts, expansion triggers, agent invocation flow, copilot follow-up. | Reads from `currentTree`, `settings`, `scouts`; writes via `setCurrentNode`, `deleteNode`, `mergeWithParent`, `massMerge`, `addNode`, `lockNode`, `unlockNode`, `toggleBookmark`, `requestScoutStart` |

> Components share a single store instance; access patterns that rely on `useStore.getState()` (e.g., inside async handlers) bypass React render cycles and must manually trigger updates via store actions.
