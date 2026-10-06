# Verification Report: Worker OMP CLI→SDK Migration Plan

- **Date:** 2026-10-06
- **Plan under review:** `plans/2026-10-06-worker-omp-sdk-migration/plan.md`
- **Scope:** Verify the SDK API assumptions in the plan against the real `@oh-my-pi/pi-coding-agent` source and npm registry.
- **Verdict:** Feasible in principle, but **Phase 3's SDK snippet is written against a different package's API** and will not typecheck. Requires a Phase 0 feasibility spike before implementation.

---

## Executive Summary

The migration goal is sound: `@oh-my-pi/pi-coding-agent` **does** ship a programmatic SDK (`AgentSession`, `SessionManager`, `sdk`, `modes`), and the worker's Bun runtime matches the package's `engines.bun >= 1.3.14` requirement. However, the plan's code snippet uses `createAgentSession({ cwd, model, sessionManager: SessionManager.inMemory(), autoApprove })`, which matches **neither** the OMP SDK nor the package the harness actually runs. `SessionManager.inMemory()` does not exist anywhere in the OMP SDK, `autoApprove` is a nested option (not top-level), and `model` must be a `Model` object, not a string.

Two concrete blockers require resolution before any implementation:

1. **Fabricated API** — `SessionManager.inMemory()` is not exported (verified by full-file grep across both `agent-session.ts` and `session-manager.ts`).
2. **Runtime split** — the SDK is Bun-only. The worker (Bun) can integrate in-process, but `apps/api` (Node/Hono) cannot; `omp-audit.service.ts` must keep spawning the CLI.

## Research Methodology

- **Sources consulted:** npm registry (`npm view`), GitHub raw source (`can1357/oh-my-pi`), GitHub repository tree (API rate-limited mid-investigation).
- **Date of materials:** OMP `18.6.2` (main branch) / `18.6.1` (latest published).
- **Key search terms:** `@oh-my-pi/pi-coding-agent`, `createAgentSession`, `SessionManager.inMemory`, `autoApprove`, `AgentSession`, `engines`.

## Key Findings

### 1. Package identity (VERIFIED)

| Fact | Evidence |
|------|----------|
| Package exists on npm | `@oh-my-pi/pi-coding-agent`, latest `18.6.1` (registry) / `18.6.2` (main) |
| It is a fork | `README.md`: *"Fork of [Pi](https://github.com/badlogic/pi-mono) by @mariozechner"*, built by **Stencil Labs** |
| Version `18.2.6` exists | Present in `npm view @oh-my-pi/pi-coding-agent versions` |

The plan's package name (`@oh-my-pi/pi-coding-agent`) is **correct**.

### 2. The SDK exists (VERIFIED)

`packages/coding-agent/src/index.ts` exports:

```ts
export * from "./sdk";                     // SDK for programmatic usage
export * from "./session/agent-session";   // class AgentSession
export * from "./session/session-manager"; // class SessionManager
export * from "./modes";                   // Run modes for programmatic SDK usage
export * from "./session/auth-storage";
```

`AgentSession` is a real class (`agent-session.ts`, ~13,000 lines) with `.prompt()`, `.abort()`, `.sessionManager`, `.agent`, `.settings`. This **refutes the earlier "no programmatic SDK" blocker** — an in-process integration is possible.

### 3. The plan's snippet is written against the WRONG API (VERIFIED)

The plan Phase 3 writes:

```ts
const { session } = await createAgentSession({
  cwd: jobDir,
  model: selectedModel,
  sessionManager: SessionManager.inMemory(), // No persistent history junk
  autoApprove: true,
});
```

Findings per symbol:

- **`SessionManager.inMemory()` — DOES NOT EXIST.** Full-file grep of `session-manager.ts` (4,280 lines) and `agent-session.ts` (13,066 lines) returned `no matches: "inMemory"` and `no matches: "static async"`. There is no static in-memory factory on `SessionManager`.
- **`createAgentSession` — exists but unverified signature.** Referenced in a `agent-session.ts` comment (*"`createAgentSession` always builds one (carrying the real identity)"*), but it is exported from `./sdk` / `./modes`, which could not be fetched (GitHub API 403 rate-limit). It is **not** a simple `{ cwd, model, autoApprove }` factory — `AgentSession` is constructed via `constructor(config: AgentSessionConfig)` where `config.agent`, `config.toolRegistry`, `config.codeModeState`, etc. are required low-level inputs.
- **`autoApprove` — exists but nested.** It appears as `config.autoApprove` passed into `new SessionTools(sessionToolsHost, { autoApprove: config.autoApprove, ... })`. It is a `SessionTools` option inside `AgentSessionConfig`, not a top-level session option.
- **`model` — must be a `Model` object, not a string.** The type is `Model` from `@oh-my-pi/pi-ai`; strings are resolved via `resolveCliModel` / `resolveSessionModelSelector` in `config/model-resolver.ts`.

The snippet most closely matches **`@earendil-works/pi-coding-agent@1.0.4`** (the original badlogic Pi v1.x SDK API), which is a different package:

| | `@earendil-works/pi-coding-agent@1.0.4` | `@oh-my-pi/pi-coding-agent@18.x` |
|---|---|---|
| `engines` | `node >= 22.19.0` | `bun >= 1.3.14` |
| `bin` | `pi → dist/bundle/cli.js` (compiled JS) | `omp → src/cli.ts` (raw TS source) |
| `main` | `./dist/index.js` | `./src/index.ts` |
| subpath exports | `./client`, `./rpc-entry`, `./experimental/plugin` | `./sdk`, `./session/*`, `./modes`, `./tools`, … |

**Conclusion:** the plan author likely copied the SDK example from badlogic Pi v1.x docs, not from OMP v18. The two forks have diverged substantially.

### 4. Runtime constraint (VERIFIED — new finding)

```json
// packages/coding-agent/package.json
"engines": { "bun": ">=1.3.14" },
"bin": { "omp": "src/cli.ts" }
```

- `mintSessionId()` calls `Bun.randomUUIDv7()`; `Bun.*` and `withFileLock` are used throughout.
- The package ships **raw TypeScript source**, not compiled JS (only `dist/cli.js` bundle + `dist/*.node` natives for the CLI).

**Impact:**
- **Worker (`apps/worker-omp`, `oven/bun:1-debian`):** in-process SDK is viable. ✅
- **API (`apps/api`, Node/Hono):** cannot import the SDK in-process. `omp-audit.service.ts` (a second CLI spawn site the plan ignores) must keep spawning the CLI. ⚠️

### 5. Internal architecture differs from plan assumptions (VERIFIED)

Dependencies are `@oh-my-pi/pi-agent-core`, `@oh-my-pi/pi-ai`, `@oh-my-pi/pi-utils`, `@oh-my-pi/pi-catalog`, `@oh-my-pi/pi-tui`, `@oh-my-pi/pi-wire` — not `@earendil-works/*`. Event, message, and model types all come from these packages, so the plan's `event-parser.ts` rewrite must target OMP's actual event shapes, not the v1.x ones.

## Unverified (requires a Phase 0 spike)

GitHub API rate-limited the deeper fetch. The following could not be confirmed from source and must be verified by installing the package locally:

1. Exact `createAgentSession` signature and which fields are required vs optional.
2. Full `AgentSessionConfig` shape (required `agent`, `toolRegistry`, `codeModeState`, `autoApprove`, `builtInToolNames`, …).
3. `session.subscribe` / `session.abort` / `session.dispose` exact signatures and event payload shapes (`text_delta` vs `text_end`; usage on `message_update` vs `turn_end`).
4. Whether `dist/cli.js` (the bundle) matches the path the current worker/API code spawns, or whether spawning `omp` (Bun bin) is required.
5. Native dependency compatibility (`@oh-my-pi/pi-natives`, `dist/*.node`) with the `oven/bun:1-debian` image.

## Recommendations

1. **Insert Phase 0 "SDK feasibility spike"** before Phase 1. Gate the whole migration on it:
   - `bun add @oh-my-pi/pi-coding-agent@18.6.1` (or latest) in `apps/worker-omp`.
   - Read `dist/types/index.d.ts` + `node_modules/@oh-my-pi/pi-coding-agent/src/sdk/` and `src/modes/` to extract the real factory signature.
   - Verify `bun run` of a minimal in-process session works on `oven/bun:1-debian`.
2. **Rewrite Phase 3 snippet** to use the verified factory/`AgentSession` API (drop `SessionManager.inMemory()`, resolve `Model` object, nest `autoApprove`).
3. **Add an explicit decision** on `apps/api/omp-audit.service.ts`: keep CLI spawn (recommended, since Node cannot in-process) and remove it from "delete all CLI paths" scope.
4. **Verify event shapes** before rewriting `event-parser.ts`; do not assume v1.x `text_end`/`content`.

## Appendix — Evidence URLs

- npm package: <https://www.npmjs.com/package/@oh-my-pi/pi-coding-agent>
- `src/index.ts`: <https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/index.ts>
- `package.json` (18.6.2): <https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/package.json>
- `src/session/agent-session.ts`: <https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/session/agent-session.ts>
- `src/session/session-manager.ts`: <https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/session/session-manager.ts>
- Contrast package: `@earendil-works/pi-coding-agent@1.0.4` (engines `node >=22.19.0`)

## Addendum — Phase 0 spike corrections (2026-10-06)

The spike installed `@oh-my-pi/pi-coding-agent@18.2.6` (pinned to `Dockerfile` `OMP_VERSION`) and verified against the installed source + a passing in-process probe (`../spike-probe.ts` → `SPIKE_PROBE_PASS`). Full results in `SPIKE.md`. Corrections to this report:

1. **RETRACTED: "`SessionManager.inMemory()` does not exist."** It exists in 18.2.6 (`src/session/session-manager.ts:3618`) and the SDK JSDoc itself shows `sessionManager: SessionManager.inMemory()` as usage (`src/sdk.ts:1326`). The main-branch grep miss was a version/refactor artifact — claims are hereby pinned to 18.2.6.
2. **CORRECTED: `autoApprove` is a top-level `CreateAgentSessionOptions` field** (`src/sdk.ts:675`), not nested. The plan snippet's position was right.
3. **CONFIRMED: agent dir is `~/.omp/agent`** (`@oh-my-pi/pi-utils` `src/dirs.ts:581`). The `~/.pi/agent` path belongs to the other fork and never applied here — plan + Dockerfile `models.json` path correct as-is.
4. **CONFIRMED: `model` must be a `Model` object** (`src/sdk.ts:406`); raw selector strings go through `modelPattern` or `resolveCliModel` (`src/config/model-resolver.ts:1872`). Canonical pattern mirrors `src/compress/session.ts` (Settings + discoverAuthStorage + ModelRegistry.refresh + resolveCliModel).
5. **CONFIRMED: `abort()` is cooperative/graceful** (`src/session/agent-session.ts:8202`), not an immediate kill — "immediately halts" acceptance stays softened.
6. **CONFIRMED events:** `session.subscribe(listener): () => void` (`agent-session.ts:4446`); text streams as `message_update` → `AssistantMessageEvent { type: "text_delta", delta }` (`@oh-my-pi/pi-ai` `src/types.ts:1393`); usage via `agent_end.telemetry` (needs `AgentTelemetryConfig`).
7. Recommendation 2 above ("drop `SessionManager.inMemory()`") is superseded — the verified pattern **uses** it.
