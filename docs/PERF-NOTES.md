# Performance Notes

## Hot Paths
- **Agent loops** (`runScout`, `runWitness`, `runCopilotOnNode`) fan out network calls and mutate large tree sections synchronously on the renderer thread. Latency stacks up with branching factor and depth.
- **Graph rendering** (`GraphContent`) recomputes Dagre layout on every render and stores all nodes/edges in memory. For large trees this becomes CPU-bound and can cause layout thrashing.
- **Text editor updates**: `updateNodeText` mutates the tree Map and triggers re-render of the entire editor because Monaco re-renders branch text.

## Large Tree Thresholds
- ReactFlow without virtualization will struggle once node counts exceed a few hundred. The stress goal (2000 nodes / 3000 edges) will likely cause sluggish pan/zoom and expensive Dagre layout passes.
- Monaco editor concatenates the entire root-to-leaf branch in memory. Extremely deep branches or large node texts can consume significant memory and degrade diffing performance.

## Memory Considerations
- Trees are stored as `Map<string, TreeNode>`; clones involve `new Map(tree.nodes)` which doubles memory temporarily during updates.
- Agent outputs and bookmarks persist in arrays, so long-running sessions can accumulate large strings in localStorage.

## Debouncing & Batching
- Tree saves are debounced at 500 ms (`scheduleTreeSave`). Rapid-fire edits stay in memory until the timer fires. Force saves occur when switching trees or unloading the window.
- Graph auto-centering throttles updates using timeouts (`AUTO_CENTER_DELAY_MS` of 35 ms) to avoid layout jitter.
- No batching for agent network calls beyond the implicit `Promise.all` per node; consider a queue to bound concurrency.

## Suggestions
- Move Dagre layout into a web worker or memoize layout results per subtree to avoid recomputation on minor changes.
- Add virtualization or level-of-detail rendering to ReactFlow for large graphs.
- Introduce global concurrency limits for OpenRouter calls to avoid saturating the API under large branching factors.
- Implement lazy-loading of agent outputs and provide a cap to avoid unbounded log growth.
- Profile Monaco updates; consider representing branch text as a tree diff instead of full string concatenation to reduce re-renders.
