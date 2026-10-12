# Phase 2 — Worker runs spec only

## Overview

- Status: Done (2026-10-12) — legacy fallback kept until queue drain (phase 3)
- Brief: Worker bỏ mọi resolve domain, chỉ spawn OMP + watch file + kiểm tra required outputs.

## Requirements

- Functional: `executeOmpJob` nhận spec → chạy OMP với `instruction` → tick milestone
  từ `spec.milestones` → kiểm tra `spec.requiredOutputs` → trả `{status, rawLogs, metrics}`.
- Non-functional: fail fast nếu `specVersion` lạ; chỉ sync file có trong spec
  (file lạ agent sinh ra không lọt ra ngoài).

## Architecture

- `omp-runner.ts`: xóa `getAuditScopeEntry`, `buildRunnerPrompt`, nhánh `checkpoint === "CP1"`,
  logic parse report.json/reportMarkdown (finalizer đã làm từ disk).
- `process-spawner.ts` + `job-sandbox.ts`: `checkJobMilestones` nhận `milestones` map từ spec,
  xóa `MILESTONE_MESSAGE_BY_FILE` và default CP1 set.
- Xóa: `runner-instruction.ts` (đã move sang API).
- Tương thích: nếu payload thiếu `specVersion` (job cũ) → fallback nhánh cũ tạm thời.

## Related Code Files

- Modify: `apps/worker-omp/src/omp-runner.ts`
- Modify: `apps/worker-omp/src/process-spawner.ts`
- Modify: `apps/worker-omp/src/job-sandbox.ts`
- Delete: `apps/worker-omp/src/runner-instruction.ts`

## Implementation Steps

1. Nhận spec, fail fast khi `specVersion !== 1`.
2. Spawn OMP với `spec.instruction`, watch `spec.milestones`, collect theo
   `requiredOutputs`/`optionalOutputs`.
3. Trả kết quả gọn (status/rawLogs/metrics), không parse markdown/JSON.
4. Giữ fallback payload cũ có flag để phase 3 xóa.
5. Typecheck worker + smoke 1 job CP1 và 1 job CP2 trên staging.

## Todo List

- [ ] Runner chạy spec
- [ ] Milestone từ spec
- [ ] Fallback payload cũ
- [ ] Smoke CP1 + CP2

## Success Criteria

- `grep audit-checkpoints apps/worker-omp` rỗng (trừ fallback chờ xóa).
- Job CP1/CP2 chạy đúng khi chỉ đổi API, không đổi worker.

## Risk Assessment

- Xóa parse report trong worker: finalizer đọc từ disk nên không mất dữ liệu;
  smoke test xác nhận.
- Spec version lạ mà worker cũ chạy → fail fast rõ ràng thay vì chạy sai lặng lẽ.

## Next Steps

- Phase 3: drain queue, xóa fallback, build worker lần cuối.
