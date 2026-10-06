---
title: Migrate Worker OMP from CLI to SDK
description: Refactor apps/worker-omp to use @oh-my-pi/pi-coding-agent SDK in-process instead of spawning the OMP CLI.
status: pending
priority: high
effort: high
branch: feat/worker-omp-sdk-migration
tags: [refactor, omp, sdk, worker, performance]
created: 2026-10-06
---

# Plan: Migrate Worker OMP from CLI to SDK

> **Verified 2026-10-06** against `can1357/oh-my-pi` source + npm registry.
> See `reports/omp-sdk-verification-2026-10-06.md` for evidence and citations.

## 1. Context & Objectives
Currently, `apps/worker-omp` executes AI jobs by spawning a child process (`bun` or `omp` binary) using the OMP CLI. It intercepts `stdout`, buffers chunks, extracts JSON strings, and parses them manually. This approach is inefficient, creates unnecessary process overhead, and requires complex manual process management (PID tracking, `SIGTERM`/`SIGKILL`).

**Objective:** Replace the CLI child-process invocation with the native `@oh-my-pi/pi-coding-agent` SDK, running directly inside the Bun worker daemon.
- **Performance:** Eliminate ~60-100MB RAM overhead per job from spawning a new V8/Bun process.
- **Reliability:** Remove flaky stdout string parsing. Use strongly-typed event subscriptions.
- **Cleanliness:** Remove manual PID management; gracefully abort via `session.abort()`.

> ⚠️ **Verified constraints (Phase 0 spike, see `reports/SPIKE.md`)**:
> - The SDK exposes `createAgentSession()` (`src/sdk.ts`), `SessionManager.inMemory()`, and top-level `autoApprove`. `model` must be a `Model` object (resolve via `resolveCliModel`, or pass a raw selector through `modelPattern`).
> - The SDK is **Bun-only** (`engines.bun >= 1.3.14`, ships raw `.ts`, uses `Bun.randomUUIDv7()`). The worker (Bun) can integrate in-process, but `apps/api` (Node/Hono) **cannot**.

## 2. Execution Phases

### Phase 0: SDK Feasibility Spike (GATE)
**Do not start Phases 1–4 until this passes.** Prove the in-process SDK runs on the worker's Bun runtime and capture the real API surface.

Checklist:
- Install `@oh-my-pi/pi-coding-agent` (pin the version proven here) as a dependency in `apps/worker-omp`.
- Read `node_modules/@oh-my-pi/pi-coding-agent/src/sdk/`, `src/modes/`, and `src/session/agent-session-types.ts` to extract:
  - The real entry/factory signature (is it `createAgentSession`? or construct `AgentSession` directly with `AgentSessionConfig`?).
  - Required `AgentSessionConfig` fields (`agent`, `toolRegistry`, `codeModeState`, `autoApprove`, `builtInToolNames`, …).
  - How to resolve a `Model` object from a model id string (`resolveCliModel` / `resolveSessionModelSelector` in `config/model-resolver.ts`).
  - Event subscription API + payload shapes (assistant text delta field name; where token usage arrives).
  - `abort()` and `dispose()` semantics (graceful-wait vs immediate kill).
- Determine config/session/auth paths the SDK reads from (agent dir for `models.json`, session files, `auth.json`) — **verify, do not assume `.omp/agent`**.
- Run a minimal in-process `session.prompt("hi")` inside the `oven/bun:1-debian` image; confirm native deps (`@oh-my-pi/pi-natives`, `dist/*.node`) load.
- **Output:** `reports/SPIKE.md` — verified API surface + a working minimal runner.

**Exit criteria:** minimal in-process run succeeds under Bun AND the real factory signature is documented. If native deps or Bun compatibility fail, STOP and re-evaluate (fallback: keep CLI spawn).

### Phase 1: Dependencies & Dockerfile Alignment
- **`apps/worker-omp/package.json`**:
  - Add `@oh-my-pi/pi-coding-agent` (version proven in Phase 0).
- **`apps/worker-omp/Dockerfile`**:
  - Remove the global CLI installation step (`RUN bun add -g @oh-my-pi/pi-coding-agent@${OMP_VERSION}`).
  - Maintain the models copy step, but point it at the **actual SDK agent dir** (confirmed in Phase 0, not the assumed `.omp/agent`).
  - Ensure auth/credentials are provisioned wherever the SDK expects them (path + mechanism from Phase 0).

### Phase 2: Refactoring Registry & Event Parsing
- **`apps/worker-omp/src/process-registry.ts`**:
  - Rename `ActiveProcessEntry` to `ActiveJobEntry`.
  - Replace `proc: ChildProcess` with a generic cancellation callback `cancel: () => void`.
- **`apps/worker-omp/src/event-parser.ts`**:
  - Deprecate raw string matching (`line.startsWith("{")`).
  - Rewrite `parseAndLogAgentEvent` to consume the **real OMP event shapes** from Phase 0 (expect accumulated text deltas, not Pi v1.x `text_end`/`content`).
  - Retain masking of internal file paths, but mask the **real session dir** confirmed in Phase 0 (not the assumed `.omp-session/`).

### Phase 3: Core Execution (The SDK Integration)
- **`apps/worker-omp/src/process-spawner.ts`**:
  - **DELETE** this file — but first relocate its non-spawn responsibilities (see below).
- **`apps/worker-omp/src/omp-runner.ts`**:
  - Remove imports of `spawnOmpProcess`.
  - Build the session via the **verified pattern** (`reports/SPIKE.md`): `Settings.init` + `discoverAuthStorage` + `ModelRegistry.refresh` + `resolveCliModel`, then `createAgentSession({ ..., model: resolved.model, sessionManager: SessionManager.inMemory(cwd), agentRegistry: new AgentRegistry(), hasUI: false, autoApprove: true })` (other options left at SDK defaults = CLI parity; raw selector strings can also go through the `modelPattern` option).
  - Relocate the **milestone watcher interval** from `process-spawner.ts` into the new `session-runner.ts` module (instead of `omp-runner.ts`, to respect the 200-line file convention).
  - Bind cancellation: `registerActiveJob(jobId, { cancel: () => void session?.abort(...) })`, and call `unregisterActiveJob(jobId)` in a `finally` block.
  - Subscribe to events and `await session.prompt(prompt)`.
  - Cleanup: always `await session.dispose()` in a `finally` block.
- **Scope decision (DECIDED 2026-10-06):** `apps/api/src/modules/ai-engine/omp-audit.service.ts` **keeps its CLI spawn path** — the SDK is Bun-only and the API runs Node, so in-process migration there is impossible. Additionally observed: only the worker Dockerfile installs the OMP CLI globally; the API image has neither the global install nor the `omp` binary, so the audit spawn path likely already falls back to a missing binary in prod (dead path) — verify separately, out of scope for this migration.

### Phase 4: Metrics & Cleanup
- **`packages/shared/src/metrics.ts`** / **`omp-runner.ts`**:
  - With no child PID to track via `pidusage`, track `process.pid` (the worker daemon itself) or calculate the memory delta via `process.memoryUsage()` before/after.
  - Fix the `pidusage.clear()` **race** that `concurrency: 2` would trigger: the clear/measure must be scoped per-job, not global.
- **`apps/worker-omp/src/config.ts`**:
  - Remove the `resolveAgentRuntime()` function (which searched for the `cli.js` path).

## 3. Risks & Mitigations
- **Process Isolation Loss:** The agent shares the event loop with the BullMQ worker. A fatal crash in native bindings could crash the daemon. *Mitigation:* Robust `try/catch`/`finally` around `session.dispose()`; validate native dep stability in Phase 0.
- **Bun-only SDK / API split:** The API cannot run the SDK in-process. *Mitigation:* Keep `omp-audit.service.ts` on the CLI spawn path; document the split.
- **Memory Leaks:** Session history retained in memory. *Mitigation:* Use `SessionManager.inMemory(cwd)` (verified to exist in 18.2.6) for ephemeral job sessions and call `session.dispose()` in a `finally` after every job.
- **Metrics Accuracy:** Tracking `process.pid` measures the whole daemon, not an isolated job. *Mitigation:* Document this limitation; use `process.memoryUsage().heapUsed` deltas for per-job estimates.
- **Cancellation semantics:** `abort()` may be graceful (waits for the agent to go idle) rather than an immediate kill. *Mitigation:* Confirm in Phase 0; adjust the cancellation UX expectation accordingly.

## 4. Acceptance Criteria
- [x] `reports/SPIKE.md` exists; a minimal in-process SDK run passes under the worker's Bun image.
- [ ] Worker starts and successfully processes an AI job from the BullMQ queue without spawning the `omp` CLI (within the worker). _(code complete 2026-10-06; live run = staging)_
- [ ] Logs stream correctly to Redis without `[object Object]` or parsing errors. _(needs live run)_
- [ ] `report.json` and `triad_handoff_packet.md` are produced successfully in the workspace output. _(needs live run)_
- [ ] Canceling a job via Redis Pub/Sub triggers the SDK abort (halt timing per Phase 0 findings). _(wired + graceful semantics verified in source; needs live run)_
- [ ] No residual memory leaks after consecutive job executions. _(needs live runs)_
- [x] The `omp-audit.service.ts` decision is recorded (kept as CLI spawn — DECIDED 2026-10-06).
