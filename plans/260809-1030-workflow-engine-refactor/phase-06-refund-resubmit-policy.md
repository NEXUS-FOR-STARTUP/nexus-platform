# Phase 06 — Refund/Resubmit Policy (T12-T15)

- Priority: P1 | Status: Pending | Effort: 4h
- Depends: Phase 03 (CaseTransitionService + refundCredit action)
- Blocks: Cleanup symflow

## Overview

Implement T12-T15 (reject/veto/complete/cancel) + T3/T4 resubmit + refund policy. **Policy sản phẩm đã chốt 2026-08-09 (one-shot — hết blocker).** Script fix data kẹt trên prod (SELECT chỉ đọc, script an toàn). Cuối phase: cleanup symflow.

## Quyết định sản phẩm ĐÃ CHỐT (2026-08-09)

| Q | Quyết định | Áp dụng |
|---|---|---|
| **Q1a** | T3 resubmit sau reject thường: free nếu credit đã hoàn; **tốn credit mới nếu chưa hoàn** | T3 guard `hasCredit` |
| **Q1b** | T4 resubmit sau veto: **hoàn 100% credit + nộp lại miễn phí** (giữ hành vi vetoCaseUseCase hiện tại) | T4 guard KHÔNG cần hasCredit |
| **Q3** | Reject/hủy: supporter đã render → **giữ credit**; chưa render → credit chưa trừ = không mất gì | T12, T15 |
| **Q4** | T14 hoàn thành: **supporter tự đóng** → notify user (fix #5) | T14 guard isAssignedSupporter |
| **Q5** | Check credit **khi admin duyệt (T5)**; KHÔNG check khi nộp (T2) — xóa `requireCredits` khỏi submit-intake | T2, T5 |

## Requirements

### T12 — Reject thường (Admin)
- Từ `submitted / triage_pending` → `rejected / cancelled`
- Guard: `isAdmin` + `reasonMinLength` (lý do ≥ 10 ký tự)
- **Q3**: T12 chỉ xảy ra ở `submitted` (chưa duyệt) → supporter CHƯA BAO GIỜ render → credit chưa trừ → KHÔNG có gì để refund. Action rỗng (không refund)
- Emit `CASE_REJECTED` (L5)

### T13 — Veto 48h (Admin)
- Từ `submitted|under_review / bất kỳ` → `rejected / cancelled`
- Guard: `isAdmin` + `isWithin48h` (case.created_at < 48h)
- **Q1b**: hoàn toàn bộ credit — action `refundCredit` → zero-out balance (pattern vetoCaseUseCase:31-50 — creditLedger `type: 'refund'`, idempotency_key `veto_{caseId}_{ts}`)
- Emit `CASE_REJECTED` (L5)

### T14 — Hoàn thành (Supporter tự đóng — Q4)
- Từ `report_ready / report_ready_to_publish` → `completed / done`
- Guard: `isAssignedSupporter` (Q4 — supporter bấm sau khi gửi report)
- Action: emit `CASE_STAGE_CHANGED` + notify user + supporter (L5 — **fix #5**)

### T15 — User hủy
- Từ MỌI stage mở (chưa final) → `closed / cancelled`
- Guard: `isOwner`
- **Q3**: credit CHƯA trừ (chưa qua T11) → không mất gì, balance nguyên vẹn (coi như được trả). Credit ĐÃ trừ (đã submit output) → giữ, không hoàn. Kết quả thực tế: T15 KHÔNG hoàn credit — chỉ T13 (veto) hoàn 100%

### T3 — Resubmit sau reject thường
- Từ `rejected / cancelled` → `submitted / triage_pending`
- **Q1a**: guard `isOwner` + `hasCredit` (creditBalance ≥ 1). Lưu ý: T12 chỉ từ `submitted` (chưa trừ credit) → credit còn nguyên → hasCredit thường pass; guard vẫn bắt buộc chặn user hết credit
- Action: `upsertDoc` (version mới — **fix #12**: content được upsert), `resetStatus` → đổi cả 2 cột

### T4 — Resubmit sau veto (BP1)
- Từ `rejected / cancelled` → `submitted / triage_pending`
- **Q1b**: guard `isOwner` — KHÔNG cần hasCredit (veto đã refund → balance = 0 nhưng nộp lại free)
- Action: `resetStatus` + `upsertDoc` (**fix BP1**: hết kẹt cancelled)

## Architecture (pseudocode — policy thật, không placeholder)

```typescript
// transition-registry.ts — unblock T12-T15, guards policy thật

const guards = {
  // ... (giữ guards cũ)

  // Q1a: T3 resubmit sau reject thường — tốn credit nếu chưa hoàn
  canResubmitAfterReject: ({ event }) => {
    // Q1a: nếu credit đã hoàn (balance ≥ 1 sau refund/không trừ) → free.
    // Thực tế T12 chỉ từ submitted (chưa trừ) → balance còn nguyên → pass.
    // Guard chặn trường hợp balance = 0 (user hết credit) → cần mua mới
    return event.data.creditBalance >= 1;
  },

  // Q3: T12 reject — supporter chưa render (case chưa duyệt) → không refund.
  // T15 hủy — không hoàn credit (đã chốt). Cả 2 không cần guard refund riêng

  // Q4: T14 complete — supporter tự đóng
  canComplete: ({ event }) => {
    return event.data.roleVerified === 'SUPPORTER'
      && event.data.caseAssignedSupporterId === event.actor.id;
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

- [ ] **ĐÃ CHỐT 2026-08-09**: Q1a/Q1b/Q3/Q4/Q5 (không cần hỏi PO)
- [ ] Tạo `scripts/fix-stuck-cases-2026-08-09.sql` (F15) — READ-ONLY, theo db-query-guide
- [ ] Unblock T12-T15 + T3/T4 trong transition-registry (phase-02 machine) + guards policy thật
- [ ] Implement T12 (reject thường: isAdmin + reasonMinLength, KHÔNG refund — Q3)
- [ ] Implement T13 (veto 48h: isWithin48h + action `refundCredit` — Q1b)
- [ ] Implement T14 (complete: isAssignedSupporter — Q4 + notify 2 phía — fix #5)
- [ ] Implement T15 (cancel: isOwner, KHÔNG refund — Q3)
- [ ] Implement T3, T4 (resubmit: hasCredit T3 / free T4 + upsert content — fix #12 + BP1)
- [ ] Thêm action `refundCredit` vào executor phase-03 (pattern vetoCaseUseCase:31-50)
- [ ] Chạy script SELECT fix data kẹt → báo cáo (KHÔNG tự UPDATE/DELETE — F15)
- [ ] Cleanup symflow: xóa package + 2 files + sửa imports
- [ ] Unit test: T12-T15 guard pass/fail
- [ ] Integration test: refund credit đúng policy (T13 hoàn 100%, T12/T15 không hoàn)
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
| Refund policy sai → mất tiền user | Cao | Rất cao | Test kỹ refund action (T13 hoàn 100%, T12/T15 không hoàn). Manual verify trước prod. Rollback script sẵn |
| Cleanup symflow quên import → build fail | Trung bình | Trung bình | Search toàn bộ codebase `symflow`, `case-workflow`, `caseWorkflow` trước khi xóa |
| Script SELECT chạm data nhạy cảm | Thấp | Thấp | Dùng READONLY_DATABASE_URL (guest). Script chỉ SELECT, không UPDATE |
| T15/T12 nhầm thành refund (Q3) → mất tiền | Trung bình | Cao | Policy ghi rõ ở requirements: chỉ T13 refund. Integration test assert T12/T15 KHÔNG tạo creditLedger entry |

## Security Considerations

- Refund credit: transaction atomic (trừ credit + đổi stage trong cùng tx)
- Script fix data: READONLY_DATABASE_URL. Không UPDATE/DELETE tự động
- Cleanup: xóa hết symflow imports trước khi uninstall (tránh runtime error)

## Next Steps

→ Sau phase 06: Plan hoàn thành. Close plan, cập nhật changelog, archive research docs.
→ Optional: Plan refactor case.repository.ts (573 dòng → tách file).
