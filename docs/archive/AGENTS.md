# Agent System

## Configuration Schema
- **ScoutConfig** (`src/types.ts`)
  - `type`: `'Scout' | 'Witness' | 'Campaign'` determines which runner is used.
  - Core parameters: `instructions`, `vision` (ancestor context depth), `range` (branching factor), `depth` (max recursion depth), `outputs` (log history), `buttonNumber` (keyboard hotkey).
  - Campaign extras: `cycles`, `campaignScout*` overrides, `campaignWitness*` overrides, `shotgunEnabled`/`shotgunLayers`/`shotgunRanges` for tapered branching.
- **CopilotConfig** (`src/types.ts`) controls the automated follow-up: `enabled`, `expansionEnabled`, `instructions`, `vision`, `range`, `depth`, `outputs`.
- Configurations persist via `persistScouts`/`persistCopilot` in `src/store.ts` and are reset to inactive on load.

## Launch Surface
- UI entry point: `src/components/modules/Scout.tsx` renders agent cards with start/stop buttons, exposes button assignments, and records outputs.
- Keyboard entry point: `useKeybindings` toggles "invoke mode" on Ctrl/Cmd+X, letting the user press 1–9 to queue a specific agent run.
- Start events update store state (`updateScout({ active: true, activeNodeId })`) before invoking the corresponding runner from `src/utils/agents.ts`.

## Tools & Callbacks
All runners receive the same function set from the store:
- `lockNode(reason)` / `unlockNode(id)` — mark nodes as busy; Scout uses `'scout-active'`, Witness uses `'witness-active'`, Copilot uses `'copilot-deciding'`, expansion uses `'expanding'`.
- `addNode(parentId, text)` — create new children with generated text.
- `deleteNode(id)` — remove nodes (guards against bookmarks and foreign locks).
- `mergeWithParent(id)` — collapse leaf-only children into their parent.
- `shouldStop()` — closure that reads a mutable flag toggled by the UI to stop long-running loops.
- `onOutput(output)` — appends assistant transcripts to the agent card via `addScoutOutput`.

## Runner Semantics
- **runScout**
  - Depth-first recursion; for each node it parallelizes `range` continuation calls, decides to expand/cull via `scoutDecision`, and recurses into "expand" children.
  - Supports "shotgun" ranges by adjusting branching factor for the first N layers.
  - Cleans up newly created children if cancellation is requested before decisions complete.
- **runWitness**
  - Maintains a `lockedNodes` set to avoid double-locking and releases all locks in a `finally` block.
  - Repeatedly prunes child subtrees that are safe (no bookmarks), evaluates sibling batches via `witnessDecision`, deletes losers, and merges single-child chains upward to the root.
  - Skips branches containing bookmarks and respects lock contention.
- **runCampaign**
  - Orchestrates alternating Scout and Witness phases with optional per-phase overrides.
  - After each Scout cycle, recomputes the deepest descendant to seed Witness traversal and logs status messages (start, stop, cycle completion).
- **runCopilotOnNode**
  - Executes breadth-first at most `depth` levels, respecting `expansionEnabled` before calling `expandNode`.
  - Protects the user's focus: it refuses to delete the current branch even if the decision returns `cull`.
  - Streams responses into `copilot.outputs` for display.

## Parallelism Model
- There is no worker pool; all async work leverages the browser event loop.
- Expansion requests within a single node use `Promise.all` to fan out HTTP calls; concurrency control relies on the user-set `branchingFactor`.
- Multiple agents can run concurrently provided they lock disjoint parts of the tree. Lock contention short-circuits operations (`lockNode` returns `false` when the node is busy for a different reason).

## Cancellation & Error Handling
- `shouldStop` closures read mutable flags stored in `activeScouts.current` (Agents panel). Setting the flag breaks out of loops and stops scheduling new work.
- Each runner wraps asynchronous sections in `try/finally` to ensure locks are released even if API calls fail.
- OpenRouter failures default to conservative actions: Scout and Copilot treat errors as `cull`, Witness keeps the first candidate. Errors are logged to the console and appended to agent outputs for visibility.

## Quality-Control Loop
- **Scout** decisions rely on prompts with `<decision>` tags; the Witness acts as a critic by comparing siblings and consolidating branches.
- **Campaign** couples the two: the Scout generates breadth, then Witness prunes and merges, repeating for a configured number of cycles.
- **Copilot** acts as a background reviewer of freshly generated nodes, with the ability to auto-expand interesting leads or cull weak branches based on its instructions.
- Manual quality control remains available via bookmarks and the `cullAndMergeToBookmarks` command, which agents respect by skipping bookmarked paths.
