# Tree Reduction Strategies

## Mass Merge (`store.massMerge`)
- Walks the tree depth-first to produce a `(nodeId, depth)` list sorted deepest-first.
- Skips the root, bookmarked nodes, and nodes/parents locked for non-witness reasons.
- Merges only when a node is the sole child of its parent: appends the child's text to the parent, splices the child from `parent.childIds`, reassigns grandchildren to the parent, and deletes the node.
- Updates bookmarks (removing merged nodes) and current selection when the merged node was focused.
- Complexity: `O(n)` traversal plus `O(k)` merges (`k ≤ n`). Because the tree is mutated in place with Map lookups, runtime remains linear in the number of nodes visited.

## Cull & Merge to Bookmarks (`store.cullAndMergeToBookmarks`)
- Builds `nodesToKeep` consisting of:
  - All bookmarked nodes.
  - All ancestors of each bookmark (ensuring structural integrity).
  - Descendants of bookmarks: if a bookmark has no nested bookmarks, all descendants are kept; otherwise only paths that lead to nested bookmarks survive.
- Deletes every node not in `nodesToKeep`, updating parent `childIds` along the way.
- Runs a bookmark-aware merge pass similar to `massMerge`, but respecting the reduced keep set and skipping locked nodes.
- Resets `currentNodeId` to the root if the previous selection was removed.
- Complexity: two full traversals (`O(n)`) plus deletion loops. In worst cases (dense bookmarks) the operation approaches `O(n log n)` due to repeated lookups, but Map storage keeps it close to linear.

## Witness Agent Pruning (`runWitness`)
- Recursively prunes child subtrees that are safe (no bookmarks) before comparing siblings. Uses `hasBookmarkedDescendant` to guard against deleting marked content.
- Compares siblings in chunks (`chunkSize = max(2, range)`) to limit the number of OpenRouter calls, deleting losers between rounds until each parent has ≤1 child.
- After sibling reduction, merges single-child parents upward to compress chains.
- Complexity: worst-case `O(n * range)` per recursion layer due to repeated chunk evaluation, plus OpenRouter latency. Practical performance depends on branching factor and tree size.

## Copilot Decisions (`runCopilotOnNode`)
- Treats agent output as a quality gate: nodes flagged `cull` are deleted unless they represent the user's current branch.
- When `expansionEnabled` is true, Copilot calls `expandNode` for the chosen node and repeats the process for newly added children up to the configured depth.
- Because each expansion spawns `branchingFactor` remote requests, the cost grows exponentially with depth; cancellation (`shouldStop`) provides the only guard.

## Failure Modes & Edge Cases
- **Cycles**: Reduction assumes acyclic parent/child relationships; the store never guards against manual cycle injection. Introducing a cycle would cause infinite loops in traversal helpers (`getBranchText`, `massMerge`), so upstream mutations must enforce tree invariants.
- **Bookmarks**: Bookmarked nodes act as hard barriers. If users over-use bookmarks, reduction commands may produce minimal or no change, leaving performance issues unresolved.
- **Locked Nodes**: Long-running agents can leave nodes locked if they crash before releasing. Reduction functions skip locked nodes, so a stuck lock can block merges until the app reloads (reloads clear locks).
- **ID Collisions**: New nodes rely on `crypto.randomUUID()`; collisions are extremely unlikely but not handled explicitly.
