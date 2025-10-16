# Security Threat Assessment

## API Key Handling
- **Risk**: API key stored in `localStorage` in cleartext (`persistSettings` in `src/store.ts`). Local attackers with filesystem access can extract it.
- **Mitigation**: Consider encrypting settings using OS keychain APIs or storing only in memory; add an option to avoid persistence.

## File System Access
- **Risk**: Renderer relies on the preload bridge for FS operations. The bridge exposes wide write capabilities (`writeFile`, `rmdir`, `mkdir`) that operate on userData paths but accept arbitrary join results. Malicious prompts could try to coax agents into calling export/import routines that overwrite critical files.
- **Mitigation**: Harden preload by whitelisting directories or validating relative paths; sanitize tree IDs to disallow path traversal characters.

## Prompt Injection
- **Risk**: Agents send raw node text and user instructions to OpenRouter. Adversarial completions could include instructions to exfiltrate data or manipulate the workspace.
- **Mitigation**: Add system-level guardrails (e.g., reinforce prompts with refusal clauses), strip code blocks that look like commands, and surface prompts/responses in the UI for review before applying destructive actions.

## Autonomous Actions
- **Risk**: Agents can delete large portions of the tree (Witness, Copilot cull). There is no undo, so prompt-induced mistakes are irreversible once persisted.
- **Mitigation**: Implement snapshotting/undo or require confirmation before applying destructive batches; allow users to run agents in "dry-run" mode to inspect proposed changes.

## Runaway Autonomy
- **Risk**: `runScout`, `runCopilotOnNode`, and `expandNode` can issue many OpenRouter calls in parallel. Misconfigured branching factors or instructions could trigger API throttling or credit exhaustion.
- **Mitigation**: Add concurrency caps and rate-limit tracking; integrate budget limits in settings (stop after N tokens/dollars).

## Memory / CPU DoS
- **Risk**: Graph visualization recomputes layout for every render and may choke on very large trees (no virtualization or worker offload). Monaco holds entire branch text in memory.
- **Mitigation**: Introduce pagination or virtualization in the graph, move Dagre layout into a web worker, and cap expansion depth per run.

## Bookmark Bypass
- **Risk**: Bookmarks act as safety anchors, but import/export does not validate them. Malformed JSON could omit bookmarked nodes while referencing them in `bookmarkedNodeIds`, leading to inconsistent state.
- **Mitigation**: Validate tree integrity during import and refuse to load inconsistent bookmark references.

## Logging Exposure
- **Risk**: Agent outputs stored in `scout.outputs` and `copilot.outputs` may contain sensitive text echoed from the model. They persist in localStorage across sessions.
- **Mitigation**: Provide a "clear outputs" command and allow users to opt-out of persistence for logs.

## Electron Shell
- **Risk**: Developer tools are enabled in dev mode, and menu shortcuts allow toggling. If the app loads remote content (future feature), attackers could escalate.
- **Mitigation**: In production builds, disable `openDevTools`, set `contextIsolation` (already enabled), and audit any future remote content loads.

## TODOs
- Sanitize tree IDs/names before using them as directory names (`createNewTree`, `renameTree`).
- Add runtime checks that `window.electronAPI` path joins remain inside the intended `trees` directory.
- Implement structured logging and redaction before persisting agent transcripts.
- Add explicit agent stop buttons in the UI for Copilot (currently only toggled via settings).
