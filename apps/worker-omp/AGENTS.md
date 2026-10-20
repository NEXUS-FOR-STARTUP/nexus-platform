# WORKER OMP KNOWLEDGE BASE

## OVERVIEW

`apps/worker-omp` = dedicated AI evaluation daemon (Bun + BullMQ). Process long-running AI assessment jobs decoupled from HTTP API, run evaluation logic in sandboxed file structures, stream realtime telemetry via Redis Pub/Sub.

## STRUCTURE

```
src/
├── index.ts              # Daemon entry point, BullMQ worker initialization
├── config.ts             # Environment configuration (Redis, storage dir, providers)
├── omp-runner.ts         # Core evaluation pipeline & subprocess execution
├── process-registry.ts   # Active process tracking & Redis job-cancellation listener
├── storage.ts            # Job sandbox filesystem & dual-publish Redis logger
└── prompt-leak-guard.ts  # Sensitive prompt and API key redaction filter
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Daemon Entry | `src/index.ts` | Worker instance for `omp-queue`, concurrency=2 |
| Job Execution | `src/omp-runner.ts` | Orchestrates multi-stage evaluation pipeline |
| Job Cancellation | `src/process-registry.ts` | Subscribes Redis `job-cancellation` channel |
| Sandbox & Logs | `src/storage.ts` | Manages `storage/jobs/`, dual-publishes logs |
| Leak Prevention | `src/prompt-leak-guard.ts` | Sanitizes internal system prompts before streaming |

## QUEUE CONTRACT (BullMQ)

- **Queue Name**: `omp-queue`
- **Job ID Format**: `omp-${caseId}--${aiJobId}` (fallback `omp-${caseId}`)
- **Concurrency**: 2 concurrent evaluation jobs per worker instance
- **Lock Duration**: 600,000ms (10 minutes, 10-minute stalled interval)
- **Max Stalled Count**: 1 (prevents runaway re-executions)

## JOB SPEC CONTRACT (worker = dumb engine)

Since 2026-10-12 API sends self-contained JobSpec (`specVersion: 1`):
`instruction`, `requiredOutputs`, `optionalOutputs`, `milestones` (file → log
message). Worker resolves NOTHING domain-specific on this path: no prompt
selection, no checkpoint table, no output parsing (API finalizer reads
report files from disk).

- Add/edit service (new checkpoint, new output file, new wording) =
  **deploy API only**. Do NOT rebuild worker image.
- Rebuild worker ONLY when engine itself changes: OMP CLI flags, sandbox
  isolation, resource tracker, cancellation protocol, Redis/log transport.
- Legacy fields (`checkpoint`, `scope`, `promptMode`, `submissionType`) stay in
  `omp-runner.ts` ONLY as fallback for payloads queued before cutover;
  deleted once prod queue drains (plan
  `plans/261012-worker-jobspec/phase-03-cutover.md`).

## SANDBOX ENVIRONMENT

Every evaluation job runs in isolated directory structure:
```
storage/jobs/${caseId}/${jobId}/
├── input/             # Intake form data, uploaded pitch decks, documents
├── output/            # Generated outputs including final report.json
├── models.json        # Snapshot of AI model configurations
└── system_prompt/     # Checkpoint-specific system prompts
```

## REALTIME LOGGING & TELEMETRY

Evaluation logs filtered through `prompt-leak-guard.ts` to redact system prompts + internal API keys, then published via Redis Pub/Sub:
1. **Admin Channel (`job:logs:${jobId}`)**: Consumed by Admin Console Worker Terminal (`WorkerJobTerminal.tsx`).
2. **Student Channel (`job:logs:${caseId}`)**: Forwarded to client via Server-Sent Events (SSE) on Case Workspace.

## JOB CANCELLATION

- Worker subscribes Redis Pub/Sub channel `job-cancellation`.
- Admin triggers cancel from Admin Panel → message `{ "jobId": "..." }` published.
- `process-registry.ts` intercepts, terminates running child processes, clears temp files, marks job aborted.

## CRITICAL ARCHITECTURAL BOUNDARY

- **Worker-OMP responsibility**: run analysis, call LLM providers, generate `output/report.json`.
- **API responsibility**: fetch `report.json`, parse critique data, compile final PDF via Typst (`apps/api/src/modules/reports/infrastructure/pdf/`).
- **NEVER** add Typst or PDF generation libraries to `apps/worker-omp`.

## COMMANDS

```bash
bun run --filter @app/worker-omp dev    # Start in watch mode
bun run --filter @app/worker-omp start  # Production daemon start
```
