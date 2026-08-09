# Phase 06 — Refund/Resubmit Policy 🔒 BLOCKED

- Priority: P1 | Status: Blocked | Effort: 0h (estimate ~4h sau khi mở)
- Depends: Phase 03 (CaseTransitionService), quyết định sản phẩm Q1 Q3 Q4
- Blocks: Cleanup symflow

## Overview

Pha 2: Implement T12-T15 (reject/veto/complete/cancel) + refund policy sau khi quyết định sản phẩm Q1 Q3 Q4 được chốt. Script fix data kẹt trên prod (SELECT chỉ đọc, script an toàn).

## BLOCKERS — Quyết định sản phẩm cần chốt

| Q | Câu hỏi | Ảnh hưởng | Transition |
|---|---|---|---|
| **Q1** | Resubmit sau veto: free re-triage hay mua credit mới? | Quyết định guard `hasCredit` trong T3/T4 + action refund bao nhiêu | T3, T4 |
| **Q3** | Reject khi supporter ĐÃ render (service rendered): refund hay không? | Guard `blocked_Q3` → logic thực: nếu rendered → no refund | T12 |
| **Q4** | Ai bấm "hoàn thành"? User confirm hay supporter tự đóng? | Guard `isOwner` hay `isAssignedSupporter`; nếu user confirm → FE cần nút | T14 |
| **Q5** (optional) | Check credit lúc nộp hồ sơ hay lúc duyệt? | Vị trí credit check: T2 guard hay T5 guard. Hiện tại check ở cả 2 nơi (split) | T2, T5 |

## Requirements (sau khi Q được chốt)

### T12 — Reject thường (Admin)
- Từ `submitted / triage_pending` → `rejected / cancelled`
- Guard: `isAdmin` + `reasonMinLength` (lý do ≥ 10 ký tự)
- **Q3 resolved**: nếu supporter đã render → refund 0; nếu chưa → refund toàn bộ credit
- Action: `resetStatus` → đổi cả 2 cột

### T13 — Veto 48h (Admin)
- Từ `submitted|under_review / bất kỳ` → `rejected / cancelled`
- Guard: `isAdmin` + `isWithin48h` (case.created_at < 48h)
- **Q1 resolved**: hoàn toàn bộ credit (refund) + cho phép resubmit miễn phí (T4)

### T14 — Hoàn thành
- Từ `report_ready / report_ready_to_publish` → `completed / done`
- **Q4 resolved**: guard tương ứng (owner hoặc supporter)
- Action: `emitStageChanged` → notify 2 phía
- **Fix #5**: notify user + supporter khi case hoàn thành

### T15 — User hủy
- Từ mọi stage mở (chưa final) → `closed / cancelled`
- Guard: `isOwner`
- **Q3 context**: refund theo policy (nếu supporter chưa render → refund; nếu đã render → no refund)

### T3 — Resubmit sau reject thường
- Từ `rejected / cancelled` → `submitted / triage_pending`
- **Q1 resolved**: guard isOwner + credit check (nếu cần mua credit mới)
- Action: `upsertDoc` (version_no++), `resetStatus`

### T4 — Resubmit sau veto (BP1)
- **Q1 resolved**: free re-triage (không cần credit) hay mua credit mới
- Action: `resetStatus` + credit policy

## Architecture (pseudocode — incomplete, cần Q để hoàn thiện)

```typescript
// transition-registry.ts — unblock T12-T15

// Thay blocked_Q3 = logic thực
const guards = {
  // ... (giữ guards cũ)

  // Q3: reject khi supporter chưa render → refund; đã render → no refund
  canRejectWithRefund: ({ event }) => {
    // Logic phụ thuộc Q3 answer
    // if (Q3 === 'refund_only_if_not_rendered') {
    //   return !event.data.supporterHasRendered;
    // }
    return false; // placeholder
  },

  // Q1: resubmit policy
  canResubmitAfterVeto: ({ event }) => {
    // if (Q1 === 'free') return true;
    // if (Q1 === 'buy_new_credit') return event.data.creditBalance >= 1;
    return false; // placeholder
  },

  // Q4: who completes
  canComplete: ({ event, context }) => {
    // if (Q4 === 'supporter') return event.actor.role === 'SUPPORTER';
    // if (Q4 === 'user') return event.actor.id === event.data.caseOwnerId;
    return false; // placeholder
  },
};
```

### Script fix data kẹt (prod) — F15: TÁCH thành file operational

> **F15 (red team):** Script fix data = database remediation (operational task), KHÔNG thuộc scope code change. Tách ra file riêng `scripts/fix-stuck-cases-2026-08-09.sql` (theo convention repo — `scripts/db-cleanup-old-g0-3.sql`, `scripts/migrate-invalid-status.ts` là tiền lệ) và reference từ đây — KHÔNG nhét vào phase checklist (tránh plan bị block vì "script chưa chạy xong").

```sql
-- AN TOÀN: SELECT chỉ đọc. Không destructive.
-- Chạy qua READONLY_DATABASE_URL (guest account)
-- Đầy đủ: scripts/fix-stuck-cases-2026-08-09.sql

-- 1. Case kẹt waiting_user (bug #18 — revision nhưng không resume)
SELECT c.id, c.case_code, c.user_facing_stage, c.internal_status, c.updated_at
FROM cases c
WHERE c.internal_status = 'waiting_user'
  AND c.updated_at < NOW() - INTERVAL '7 days'
ORDER BY c.updated_at ASC;

-- 2. Case kẹt cancelled sau veto (BP1 — không resubmit được)
SELECT c.id, c.case_code, c.user_facing_stage, c.internal_status, c.updated_at
FROM cases c
WHERE c.internal_status = 'cancelled'
  AND c.user_facing_stage = 'rejected'
  AND c.updated_at < NOW() - INTERVAL '30 days'
ORDER BY c.updated_at ASC;

-- 3. DocumentRecords duplicate (spam doc bug #2 #13)
SELECT lifecycle_unit_id, doc_type, seq, COUNT(*) as cnt
FROM document_records
WHERE lifecycle_unit_id IS NOT NULL
GROUP BY lifecycle_unit_id, doc_type, seq
HAVING COUNT(*) > 1;

-- 4. Case internal_status lệch user_facing_stage (split-brain)
SELECT c.id, c.case_code, c.user_facing_stage, c.internal_status
FROM cases c
WHERE (c.user_facing_stage = 'submitted' AND c.internal_status NOT IN ('triage_pending', 'cancelled'))
   OR (c.user_facing_stage = 'under_review' AND c.internal_status NOT IN ('accepted_unassigned', 'assigned', 'supporter_working'))
   OR (c.user_facing_stage = 'completed' AND c.internal_status != 'done')
ORDER BY c.updated_at DESC;
```

**QUAN TRỌNG:** Script trên là READ-ONLY. Sau khi chạy → báo cáo số lượng case kẹt → human quyết định fix từng case. KHÔNG script UPDATE/DELETE tự động. Chạy theo quy trình `docs/db-query-guide.md`.

### Cleanup symflow (sau khi mọi use case chuyển xong)

```bash
# apps/api
npm uninstall symflow
```

Xóa files:
- `apps/api/src/modules/cases/domain/case-workflow.ts`
- `apps/api/src/modules/cases/infrastructure/persistence/case-workflow-engine.ts`

Sửa imports:
- `get-case-detail.usecase.ts`: xóa `caseWorkflow.transitions`, dùng `getAvailableTransitions`
- Bất kỳ file nào import `case-workflow-engine` hoặc `case-workflow`

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/cases/domain/transition-registry.ts` | **SỬA** — Unblock T12-T15 (khai báo lại trong machine + guard thật) |
| `apps/api/src/modules/cases/application/case-transition.service.ts` | **SỬA** — Thêm refund action |
| `apps/api/src/modules/cases/application/veto-case.usecase.ts` | **SỬA** — Chuyển qua service |
| `apps/api/src/modules/cases/application/resubmit-case.usecase.ts` | **SỬA** — Chuyển qua service + fix #12 (upsert content) |
| `apps/api/src/modules/cases/application/complete-case.usecase.ts` | **SỬA** — Chuyển qua service |
| `scripts/fix-stuck-cases-2026-08-09.sql` | **MỚI (operational)** — F15: tách script fix data, reference từ phase này |
| `apps/api/src/modules/cases/domain/case-workflow.ts` | **XÓA** (cleanup) |
| `apps/api/src/modules/cases/infrastructure/persistence/case-workflow-engine.ts` | **XÓA** (cleanup) |
| `apps/api/package.json` | **SỬA** — `npm uninstall symflow` |

## Todo List

- [ ] **TRƯỚC KHI BẮT ĐẦU**: Chốt Q1, Q3, Q4 với product owner
- [ ] Tạo `scripts/fix-stuck-cases-2026-08-09.sql` (F15) — READ-ONLY, theo db-query-guide
- [ ] Implement T12 guard + action (refund policy)
- [ ] Implement T13 guard + action (veto 48h)
- [ ] Implement T14 guard + action (complete + notify)
- [ ] Implement T15 guard + action (cancel + refund)
- [ ] Implement T3, T4 (resubmit policy + upsert content — fix #12)
- [ ] Chạy script SELECT fix data kẹt → báo cáo (KHÔNG tự UPDATE/DELETE — F15)
- [ ] Cleanup symflow: xóa package + 2 files + sửa imports
- [ ] Unit test: T12-T15 guard pass/fail
- [ ] Integration test: refund credit đúng policy
- [ ] Regression test: mọi test cũ vẫn pass sau cleanup
- [ ] check-types root PASS

## Success Criteria

- T12-T15 hoạt động (guard đúng, action đúng, refund đúng policy)
- 14 bugs: tất cả đóng (gồm BP1, #5, #12)
- symflow bị xóa khỏi codebase (không import, không deps)
- Script SELECT chạy trên prod → báo cáo số case kẹt (file operational riêng — F15)
- `npm test` pass, check-types pass

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Q1-Q4 không được chốt → phase kéo dài vô hạn | Trung bình | Cao | Phase này là pha 2 — pha 1 chạy độc lập. Deadline pha 2 phụ thuộc product |
| Cleanup symflow quên import → build fail | Trung bình | Trung bình | Search toàn bộ codebase `symflow`, `case-workflow`, `caseWorkflow` trước khi xóa |
| Script SELECT chạm data nhạy cảm | Thấp | Thấp | Dùng READONLY_DATABASE_URL (guest). Script chỉ SELECT, không UPDATE |
| Refund policy sai → mất tiền user | Cao | Rất cao | Test kỹ refund action. Manual verify trước prod. Rollback script sẵn |

## Security Considerations

- Refund credit: transaction atomic (trừ credit + đổi stage trong cùng tx)
- Script fix data: READONLY_DATABASE_URL. Không UPDATE/DELETE tự động
- Cleanup: xóa hết symflow imports trước khi uninstall (tránh runtime error)

## Next Steps

→ Sau phase 06: Plan hoàn thành. Close plan, cập nhật changelog, archive research docs.
→ Optional: Plan refactor case.repository.ts (573 dòng → tách file).
