# Test Plan

## Integration Targets
1. **Graph operations**
   - Create a tree, add multiple children, run `massMerge`, and verify only the parent retains merged text and children are reassigned correctly.
   - Load a tree with bookmarks, run `cullAndMergeToBookmarks`, and confirm that non-bookmarked branches are removed while bookmarked paths persist.
2. **Agent loop start/stop**
   - Simulate starting a Scout agent on a mock tree with a stubbed OpenRouter client that returns deterministic completions and decisions. Assert that `lockNode`/`unlockNode` calls balance and `shouldStop` halts recursion.
   - For Campaign agents, ensure Witness merges reduce sibling counts and logs entries in the expected order.
3. **OpenRouter error handling**
   - Stub `fetch` to return HTTP 429/500 responses and validate that `withRetry` performs the expected exponential backoff attempts before bubbling errors.
   - Confirm Scout/Copilot default to `cull` on exceptions.
4. **Persistence I/O**
   - With a stubbed `window.electronAPI`, exercise `createNewTree`, `saveTree`, `loadTree`, `renameTree`, and `extractSubtree` to verify maps serialize/deserialize correctly and directories are created/deleted.

## Test Harness
- Use **Vitest** with the JSDOM environment for renderer-level tests and Node environment for pure utilities.
- Stub `window`/`localStorage` and `window.electronAPI` where needed. Provide helper factories for in-memory trees to avoid touching real disk.
- Expose async helpers for agent runners that inject fake OpenRouter clients to eliminate external HTTP calls.

## Current Failing Tests
The following scaffolds are added under `tests/failing/` and intentionally fail to document gaps:
1. `tree_id_sanitization.test.ts` — asserts that `createNewTree` rejects names containing path separators; current implementation uses raw `name.trim()` and would create nested directories.
2. `bookmark_import_validation.test.ts` — constructs a tree JSON with dangling bookmark IDs and expects `loadTree` to reject; the loader currently accepts invalid bookmark references silently.
3. `current_node_validation.test.ts` — loads a JSON payload whose `currentNodeId` is missing from `nodes` and expects `loadTree` to fail; the loader currently trusts the serialized `currentNodeId` and returns a broken tree.

Mark these tests with `test.fails` to document the invariant and guide future fixes. Once fixes land, convert them to passing assertions.

## Command
- Recommended: `vitest run` (add `"test": "vitest"` to `package.json`).
- Until Vitest is added to devDependencies, run the tests via `npx vitest run` after installing.
