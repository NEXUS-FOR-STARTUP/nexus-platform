# Phase 3 — Cutover and cleanup

## Overview

- Priority: P2
- Status: Pending
- Brief: Drain queue cũ, xóa fallback, build/push worker lần cuối, đóng băng worker.

## Requirements

- Functional: không còn code checkpoint trong worker; tài liệu ghi rõ
  "đổi dịch vụ = deploy API only".
- Non-functional: zero downtime — deploy API trước (enqueue spec mới),
  worker mới đọc được cả hai; đợi queue drain rồi mới xóa nhánh cũ.

## Implementation Steps

1. Deploy API (spec mới) + worker mới (đọc cả hai payload) lên staging, smoke CP1 + CP2.
2. Prod: deploy API trước, sau đó build/push worker 1 lần cuối
   (hoặc `build worker-omp` local trên VPS).
3. Xác nhận queue không còn job payload cũ (`checkpoint` mà thiếu `specVersion`)
   trước khi đụng code — còn job cũ thì đợi drain.
4. Xóa fallback payload cũ trong worker, xóa field cũ khỏi `OmpJobPayload`.
   Worker giữ `@app/shared` cho types (`EvaluationJob`, `AgentExecutionResult`) và
   telemetry — chỉ xóa import `audit-checkpoints` / `audit-checkpoint-lookup`.
5. Cập nhật `apps/worker-omp/AGENTS.md` + deploy log: rule "worker chỉ rebuild khi
   engine đổi (CLI flags, sandbox, tracker, cancel, transport)".

## Todo List

- [ ] Staging smoke cả hai payload
- [ ] Prod deploy API → worker
- [ ] Queue drain, xóa fallback
- [ ] Docs + deploy log

## Success Criteria

- Worker không import gì từ `audit-checkpoints.ts`; grep rỗng.
- Thêm/sửa dịch vụ sau này chỉ cần deploy API.

## Risk Assessment

- Xóa fallback sớm khi queue còn job cũ → job fail. Mitigation: kiểm tra queue trước.
- Rollback: giữ image worker trước đó 1 version.

## Next Steps

- Cook: `ck cook plans/261012-worker-jobspec/plan.md` (khi prod ổn định, mạng hết lag).
