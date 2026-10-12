# Phase 1 — API builds JobSpec

## Overview

- Status: Done (2026-10-12)
- Brief: API resolve toàn bộ domain trước khi enqueue; payload BullMQ tự chứa.

## Requirements

- Non-functional: instruction vài KB trong `job.data` (sống qua worker restart);
  không đọc instruction từ disk ở worker.
- Functional: coordinator gọi builder mới, payload có `specVersion: 1`, `instruction`,
  `requiredOutputs`, `optionalOutputs`, `milestones`, `model`.
  (`milestones` chỉ là map file → câu log hiển thị trong khung log; progress thật
  do API tính từ file presence qua `scanJobOutput` + `computeProgressSteps`, không đổi.)
- Mới: `apps/api/src/modules/ai-engine/application/job-spec-builder.ts`
  - Input: `checkpoint`, `scope`, `submissionType` (+ prompt files, milestone text).
  - Move `buildRunnerPrompt` từ `apps/worker-omp/src/runner-instruction.ts` sang đây.
  - Move `MILESTONE_MESSAGE_BY_FILE` từ `job-sandbox.ts` sang đây (dạng `milestones` map).
  - Đọc `required/optional outputs` từ `AUDIT_CHECKPOINTS` (API đã có quyền đọc).
- Sửa: `omp-audit-coordinator.ts` gọi builder, enqueue spec thay vì `checkpoint/scope/promptMode`.
- Sửa: `OmpJobPayload` trong `infrastructure/queue/omp-queue.ts` thành shape spec mới
  (giữ field cũ optional cho tương thích queue đang chạy).

## Related Code Files

- Modify: `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts`
- Modify: `apps/api/src/modules/ai-engine/infrastructure/queue/omp-queue.ts`
- Create: `apps/api/src/modules/ai-engine/application/job-spec-builder.ts`
- Unchanged: `omp-audit.service.ts` (prepareSandbox đã đúng), `omp-audit-finalizer.ts`

## Implementation Steps

1. Viết `job-spec-builder.ts`: resolve plan qua `resolveAuditPlan`, dựng instruction,
   map outputs/milestones, gắn `specVersion: 1`.
2. Sanitize tên file ở builder (chặn `../`, absolute path) — fail fast 400.
3. Coordinator enqueue spec; giữ field cũ cho job đã nằm trong queue.
4. Typecheck API: `bun run check-types`.

## Todo List

- [ ] Builder + sanitize
- [ ] Coordinator enqueue spec
- [ ] Type `OmpJobPayload` mới
- [ ] Typecheck pass

## Success Criteria

- Payload trong Redis chứa đủ `instruction` + outputs + milestones, không cần worker resolve thêm.
- API typecheck pass.

## Risk Assessment

- Payload to hơn (instruction vài KB) — BullMQ/Redis chịu được, không đáng kể.
- Job cũ trong queue thiếu spec → worker phase 2 vẫn đọc nhánh cũ tới khi drain.

## Next Steps

- Phase 2: worker chạy theo spec.
