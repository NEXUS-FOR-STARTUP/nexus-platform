# WORKER OMP KNOWLEDGE BASE

## OVERVIEW

`apps/worker-omp` is a dedicated AI evaluation daemon built with Bun and BullMQ. It processes long-running AI assessment jobs decoupled from the HTTP API, executes evaluation logic in sandboxed file structures, and provides realtime streaming telemetry via Redis Pub/Sub.

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
| Job Execution | `src/omp-runner.ts` | Orchestrates the multi-stage evaluation pipeline |
| Job Cancellation | `src/process-registry.ts` | Subscribes to Redis `job-cancellation` channel |
| Sandbox & Logs | `src/storage.ts` | Manages `storage/jobs/` and dual-publishes logs |
| Leak Prevention | `src/prompt-leak-guard.ts` | Sanitizes internal system prompts before streaming |

## QUEUE CONTRACT (BullMQ)

- **Queue Name**: `omp-queue`
- **Job ID Format**: `omp-${caseId}--${aiJobId}` (fallback `omp-${caseId}`)
- **Concurrency**: 2 concurrent evaluation jobs per worker instance
- **Lock Duration**: 600,000ms (10 minutes, with 10-minute stalled interval)
- **Max Stalled Count**: 1 (prevents runaway re-executions)

## SANDBOX ENVIRONMENT

Every evaluation job runs in an isolated directory structure:
```
storage/jobs/${caseId}/${jobId}/
├── input/             # Intake form data, uploaded pitch decks, documents
├── output/            # Generated outputs including final report.json
├── models.json        # Snapshot of AI model configurations
└── system_prompt/     # Checkpoint-specific system prompts
```

## REALTIME LOGGING & TELEMETRY

Logs emitted during evaluation are filtered through `prompt-leak-guard.ts` to redact system prompts and internal API keys, then published via Redis Pub/Sub:
1. **Admin Channel (`job:logs:${jobId}`)**: Consumed by the Admin Console Worker Terminal (`WorkerJobTerminal.tsx`).
2. **Student Channel (`job:logs:${caseId}`)**: Forwarded to the client via Server-Sent Events (SSE) on the Case Workspace.

## JOB CANCELLATION

- The worker subscribes to the Redis Pub/Sub channel `job-cancellation`.
- When an admin triggers job cancellation from the Admin Panel, a message `{ "jobId": "..." }` is published.
- `process-registry.ts` intercepts this message, terminates any running child processes, clears temp files, and marks the job aborted.

## CRITICAL ARCHITECTURAL BOUNDARY

- **Worker-OMP responsibility**: Execute analysis, call LLM providers, and generate `output/report.json`.
- **API responsibility**: Fetch `report.json`, parse critique data, and compile it into final PDF documents using Typst (`apps/api/src/modules/reports/infrastructure/pdf/`).
- **NEVER** introduce Typst or PDF generation libraries into `apps/worker-omp`.

## COMMANDS

```bash
bun run --filter @app/worker-omp dev    # Start in watch mode
bun run --filter @app/worker-omp start  # Production daemon start
```
