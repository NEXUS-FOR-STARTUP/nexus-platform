# Phase 0 Spike Report — OMP SDK In-Process Integration

- **Verdict:** PASS (gate open — may proceed to Phases 1–4)
- **Date:** 2026-10-06
- **SDK:** `@oh-my-pi/pi-coding-agent@18.2.6` (pinned to match `Dockerfile` `OMP_VERSION=18.2.6`)
- **Runtime:** Bun 1.4.0 (Windows x64; SDK requires `bun >= 1.3.14` — satisfied)
- **Probe:** `../spike-probe.ts` → `SPIKE_PROBE_PASS` (no LLM call, no spend)

## Probe result (verbatim)

```
settings_ok
authStorage_ok
models_total: 5307
models_available: 191
resolved: opencode-go/deepseek-v4-pro
session_created: true
session_model: opencode-go/deepseek-v4-pro
subscribe_ok
abort_ok
dispose_ok
SPIKE_PROBE_PASS
```

## Verified API surface (all against installed 18.2.6 source)

| API | Location | Notes |
|---|---|---|
| `createAgentSession(options = {})` | `src/sdk.ts:1330` | Returns `Promise<CreateAgentSessionResult>` (`{ session, extensionsResult, eventBus, … }`) |
| `sessionManager?: SessionManager` | `src/sdk.ts:626` | Real option; JSDoc example uses `SessionManager.inMemory()` (`src/sdk.ts:1326`) |
| `SessionManager.inMemory(cwd?, storage?)` | `src/session/session-manager.ts:3618` | In-memory session, no file persistence. **Earlier verification report wrongly claimed this doesn't exist** (main-branch grep miss; 18.2.6 has it) |
| `autoApprove?: boolean` | `src/sdk.ts:675` | Top-level field — plan snippet position was correct |
| `model?: Model` | `src/sdk.ts:406` | Must be a `Model` object, not a string |
| `modelPattern?: string \| string[]` | `src/sdk.ts:416` | Raw CLI-style selector (`--model` equivalent), resolved after extensions load |
| `getApiKey` | `src/sdk.ts` (`AgentOptions["getApiKey"]`) | Env-key override, e.g. `getApiKey: async () => Bun.env.MY_KEY` (JSDoc example) |
| `agentDir` default | `@oh-my-pi/pi-utils` `src/dirs.ts:581` (`getAgentDir()`) | `~/.omp/agent` — Dockerfile's `/root/.omp/agent/models.json` copy target is correct |
| Auth default | `discoverAuthStorage()` (`src/sdk.ts:768`) | SQLite at `<agentDir>/agent.db` |
| `session.prompt(text, options?)` | `src/session/agent-session.ts:6298` | Returns `Promise<boolean>`; throws when no model/key |
| `session.subscribe(listener)` | `src/session/agent-session.ts:4446` | Returns unsubscribe `() => void` |
| `session.abort(options?)` | `src/session/agent-session.ts:8202` | **Cooperative/graceful** — signals agent loop, cancels compaction/handoff/bash/eval, drains queues. NOT an immediate kill |
| `session.dispose(options?)` | `src/session/agent-session.ts:4705` | Async cleanup; call in `finally` |
| `resolveCliModel({ cliModel, modelRegistry, settings })` | `src/config/model-resolver.ts:1872` | String selector → `Model`; needs `ModelRegistry` refreshed first |
| `AgentSessionEvent` | `src/session/agent-session-events.ts:13` | Core `AgentEvent` + session extras |
| `AgentEvent` | `@oh-my-pi/pi-agent-core` `src/types.ts:1121` | `agent_start/end`, `turn_start/end`, `message_start/update/end`, `tool_execution_*`, `tool_stream_update` |
| Streaming text | `@oh-my-pi/pi-ai` `src/types.ts:1393` | `message_update.assistantMessageEvent`: `{ type: "text_delta", delta: string, … }` |
| Usage | `agent_end.telemetry?: AgentRunSummary` | Present only when `AgentTelemetryConfig` supplied on the run |
| Single-file SDK entry | `src/sdk.ts` (4498 lines) | There is **no** `src/sdk/` directory in 18.2.6 |
| Natives (Windows) | `@oh-my-pi/pi-natives-win32-x64/pi_natives.win32-x64-baseline.node` | Present; loaded fine during probe |

## Canonical integration pattern (mirrors `src/compress/session.ts`)

```ts
import {
  createAgentSession,
  discoverAuthStorage,
  SessionManager,
  Settings,
} from "@oh-my-pi/pi-coding-agent";
import { ModelRegistry } from "@oh-my-pi/pi-coding-agent/config/model-registry";
import { resolveCliModel } from "@oh-my-pi/pi-coding-agent/config/model-resolver";

const [settings, authStorage] = await Promise.all([
  Settings.init({ cwd }),
  discoverAuthStorage(),
]);
const modelRegistry = new ModelRegistry(authStorage);
await modelRegistry.refresh();
const resolved = resolveCliModel({ cliModel: selectedModel, modelRegistry, settings });
if (resolved.error || !resolved.model) throw new Error(resolved.error ?? `Model "${selectedModel}" not found`);

const { session } = await createAgentSession({
  cwd,
  settings,
  authStorage,
  modelRegistry,
  model: resolved.model,
  sessionManager: SessionManager.inMemory(cwd),
  disableExtensionDiscovery: true,
  enableMCP: false,
  hasUI: false,
  autoApprove: true,
});
const unsub = session.subscribe(listener);
try {
  await session.prompt(prompt);
} finally {
  unsub();
  await session.dispose();
}
```

## Event mapping for the `event-parser.ts` rewrite

- Accumulate assistant text from `message_update` where `assistantMessageEvent.type === "text_delta"` → `delta`.
- Tool activity from `tool_execution_start / tool_execution_end` (replaces stdout JSON scraping).
- Run totals from `agent_end.telemetry` (requires passing telemetry config) or per-message usage.
- Cancel via `session.abort()`; expect in-flight work to wind down gracefully, not die instantly.

## Corrections to `omp-sdk-verification-2026-10-06.md`

1. `SessionManager.inMemory()` **exists** in 18.2.6 — the "does not exist" claim was a main-branch grep artifact. Retracted.
2. `autoApprove` **is** a top-level `CreateAgentSessionOptions` field — plan snippet position correct.
3. Agent/config dir is `~/.omp/agent` (not `~/.pi/agent`, which belongs to the other fork) — plan + Dockerfile models.json path correct.
4. `model` must still be a `Model` object (or use `modelPattern` for raw strings) — that part of the report stands.

## Still open (for implementation / staging)

- [ ] Live `prompt()` end-to-end (needs credentials + spend — do in staging, not dev).
- [ ] Linux Docker image check (`oven/bun:1-debian` + linux natives) — `docker build` the worker and run the probe inside.
- [ ] `onnxruntime-node` postinstall was blocked by bun trust policy (`bun pm untrusted`); confirm nothing in the agent path needs it, or run `bun pm trust` in the image build if required.
- [ ] Confirm usage/telemetry plumbing meets the worker's credit-accounting needs.
