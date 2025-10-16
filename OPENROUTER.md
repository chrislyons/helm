# OpenRouter Integration

## Key Management
- The OpenRouter API key lives in `Settings.apiKey` (`DEFAULT_SETTINGS` in `src/store.ts` initializes it to an empty string).
- `updateSettings` persists the key to `localStorage` via `persistSettings`. The key is never written to disk beyond the browser storage layer.
- UI surfaces (`Settings` module, Actions panel, TextEditor/Keybindings) block expansion attempts when `apiKey` is falsy and prompt the user to fill it in first.

## Request Construction
- Endpoints: `https://openrouter.ai/api/v1/chat/completions` for both continuation and assistant roles (`src/utils/openrouter.ts`).
- Payload shape:
  - Continuations: single `user` message containing the branch text, plus `model`, `temperature`, `top_p`, `max_tokens` from `settings.continuations`.
  - Assistant flows (Scout/Witness/Copilot): two messages (`system`, `user`) composed from prompt templates in `prompts.json` and user-provided instructions.
- Headers: `Content-Type: application/json`, `Authorization: Bearer <apiKey>`, `HTTP-Referer: https://helm.local`, `X-Title: Helm`.
- Retries: `withRetry` wraps fetch, retrying up to three times with exponential backoff (1 s, 2 s, 4 s).

## Response Handling
- Responses are parsed as JSON and expected to contain at least one entry in `choices`.
- Continuations return `choices[0].message.content ?? choices[0].text ?? ''`.
- Assistant flows return the same; callers parse `<decision>` or `<choice>` tags depending on the prompt.
- Errors: non-2xx responses throw `Error('API request failed: ...')`, bubbling to the caller. Agents catch exceptions, log them, and fall back to conservative actions (typically treating the result as `cull`).

## Model Selection & Credits
- Default models: `meta-llama/llama-3.1-405b` for continuations, `openai/gpt-oss-20b` for assistant tasks. Users can override in Settings.
- The application does not auto-detect cost tiers or track credit usage. All budgeting is left to the user.

## Streaming & Rate Limits
- Calls await the entire HTTP response; there is no streaming UI. Latency is directly proportional to model response time and branching factor.
- There is no explicit rate-limit backoff beyond the retry helper. High parallelism from large branching factors could hit OpenRouter limits; errors surface to the console and agent logs.

## Safety & Prompting
- Prompt templates live in `prompts.json` and rely on explicit XML-like tags to guide LLM behavior (`<decision>`, `<choice>`).
- No additional moderation or sanitization is performed. Prompt injection defenses are limited to user vigilance and the bookmark-based guard rails in Witness/Copilot logic.
