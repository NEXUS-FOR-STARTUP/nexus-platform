# Workflow Engine Refactor — Brainstorm Final (2026-08-09)

**Mục đích:** Kết luận chuỗi bàn luận 2026-08-08/09 → đầu vào cho plan implement. Gồm: vấn đề gốc, thiết kế 5 lớp, transition table v2, quyết định engine, blockers, kế hoạch.

**Nguồn context:** `docs/research/rca-research-brainstorm-2026-08-08.md`, `docs/research/document-centric-audit-service-reference-2026-08-08.md`, `docs/research/engine-context-2026-08-08.md`, `docs/research/repo-context-pack-2026-08-08.md`, `tasks/bugs/` (18 files).

---

## 1. Vấn đề gốc (Root Cause)

**Hệ thống không có một "cổng duy nhất" định nghĩa *được làm gì, lưu gì, khi nào* — mỗi use case tự lo mọi thứ, nên cùng 1 luật mà chỗ chặn, chỗ không.**

Chuỗi nhân quả:
```
14 bugs (kẹt, lỗi hệ thống, spam doc, sửa sai thời điểm)
  ← mỗi use case check riêng (accept dùng symflow, submit-revision check array tay,
     supporter-output KHÔNG check, external-feedback chỉ check credit+auth)
  ← không có lớp chuẩn đứng giữa — ai cũng tự đọc DB, tự check, tự lưu, tự báo
  ← ROOT: thiếu cổng chung + luật không tập trung
```

Verify: nếu 1 cổng duy nhất với đúng 5 lớp → bug thời điểm (#2 #4 #7 #9 #17) mất vì luật 1 chỗ; bug lưu (#12 #13) mất vì action chuẩn upsert; #18 mất vì transition đổi cả 2 cột; kẹt veto mất vì action reset status.

## 2. Bối cảnh — Trạng thái code thật (đã verify)

- `case.types.ts` — 11 stage, `isValidStageTransition` (bảng tay, 1 nửa split-brain), `requireCredits` (line 22 trong submit-intake — chặn resubmit sau veto)
- `case-workflow.ts` (domain) — symflow definition: 8 places, 9 transitions (accept_case, assign_supporter, start_work, request_info, resume_work, publish_report, complete_case, cancel, reopen), initialMarking triage_pending
- `case-workflow-engine.ts` (infrastructure/persistence) — markingStore trên `internal_status`, SLA hook 48h khi vào supporter_working, `canTransition`/`applyTransition`
- Admin-side dùng engine đều: accept, assign, update-status, veto. Submit path bỏ qua: submit-intake, submit-revision (+Upload), submit-supporter-output, submit-external-feedback
- `submitCaseRevision` (case.repository.ts:466-471) — đổi stage nhưng KHÔNG đổi internal_status → gốc #18
- `rejectCase` repo default `internal_status: "cancelled"` (case.repository.ts:267) → reject thường CŨNG kẹt resubmit (doc cũ ghi "reject thường chạy" — SAI)
- `resubmitCaseUseCase` (POST /:id/resubmit) → đổi CẢ stage='submitted' + status='triage_pending' (đúng chuẩn) nhưng KHÔNG cập nhật intake content. FE dùng `submitIntake` (POST /:id/intake) — có content nhưng kẹt credit. **2 đường resubmit, mỗi đường nửa đúng nửa sai**
- Bug #2 cơ chế: `createSupporterOutput` (case.repository.ts:521-573) credit check trong tx + idempotency `consume-{unitCode}-{caseId}` → upload lần 2 cùng version = P2002 → "Lỗi hệ thống"; khác version = NO_CREDITS (#4)
- `upsertDocumentRecordsForUnit` (document.repository.ts:224) tồn tại — **0 caller**
- `DocumentRecord` KHÔNG có unique key → upsert cần thêm `@@unique([lifecycle_unit_id, doc_type, seq])` (1 dòng migration)
- FE type `Case` đã có sẵn `allowed_transitions?: string[]` (apps/web-1/types/case.ts:23) — chưa thấy BE trả
- Admin FE có `RejectCaseModal.tsx` riêng (không chỉ Veto)
- `completeCaseUseCase`, `deleteCaseUseCase`, `updateCaseSettingsUseCase`, `upgradePackageUseCase` — chưa đọc sâu

## 3. Thiết kế — 5 lớp (định nghĩa rõ tên/nghĩa/phạm vi)

| Lớp | Tên | Nghĩa | Phạm vi | Ai làm |
|---|---|---|---|---|
| L1 | Validation | Kiểm tra dữ liệu nhập (file ≤ 5, ≤ 15MB, ký tự giới hạn) | Lúc nhập, không liên quan trạng thái | Code (zod + documentType check — đã có) |
| L2 | Guard | Điều kiện được làm (đúng người, credit ≥ 1, paid, stage đúng) | Chạy TRƯỚC khi chuyển | Code + engine hỗ trợ |
| L3 | Transition | Bộ luật "từ A được sang B" + đổi cột internal_status | CHỈ quản lý trạng thái | Engine (symflow → XState v5) |
| L4 | Action | Lưu dữ liệu kèm (upsert doc, trừ/hoàn credit, đổi stage) | Cùng 1 transaction với L3 | Code |
| L5 | Effect | Thông báo sau (emit event → notify) | SAU khi commit | Code (event bus có sẵn) |

Nguyên tắc: **mọi hành động thay đổi state đi qua 1 cổng duy nhất** (CaseTransitionService), chạy đủ L1→L5 trong 1 transaction. Use case không tự check/lưu riêng.

## 4. Transition Table v2 (16 transitions)

| # | Hành động | Ai | Từ (stage/status) | Đến (stage/status) | Guard | Action | Fix |
|---|---|---|---|---|---|---|---|
| T1 | Tạo case | User | — | intake_pending / triage_pending | Gói active, giá lock, đủ trường | Tạo case + checkpoint | — |
| T2 | Nộp hồ sơ lần đầu | User | intake_pending\|ready / triage_pending | submitted / triage_pending | Owner/member, đủ field, ≤ giới hạn | Tạo v00 duy nhất | #13 #14 |
| T3 | Nộp lại sau reject thường | User | rejected / cancelled | submitted / triage_pending | Owner, [Q1] | Upsert v00, đổi cả 2 cột | #12 #18 |
| T4 | Nộp lại sau veto | User | rejected / cancelled | submitted / triage_pending | [Q1] | Upsert v00 + credit policy | BP1 |
| T5 | Duyệt hồ sơ | Admin | submitted / triage_pending | under_review / accepted_unassigned | Payment = paid | — | #9 |
| T6 | Phân supporter | Admin | under_review / accepted_unassigned | under_review / assigned | Supporter hợp lệ | Ghi lịch sử assign | #1 |
| T7 | Supporter nhận việc | Supporter | under_review / assigned | under_review / supporter_working | Đúng người phân | sla_deadline_at = +48h | #1 |
| T8 | Yêu cầu bổ sung | Supporter | under_review / supporter_working | need_more_information / waiting_user | Đúng người phân | Notify user | — |
| T9 | Nộp bản sửa | User | need_more_information / waiting_user | revision_submitted / supporter_working | Owner/member, có credit | Tạo v01+, **tự resume_work** (đổi cả 2 cột) | **#18** #3 #4 |
| T10 | Bắt đầu chấm bản sửa | Supporter | revision_submitted / supporter_working | under_review / supporter_working | Đúng người phân | — | — |
| T11 | Gửi báo cáo (output) | Supporter | under_review / supporter_working | report_ready / report_ready_to_publish | Đúng người, credit ≥ 1 | Trừ 1 credit (idempotent theo version), đổi cả 2 cột | **#2 #4** |
| T12 | Từ chối thường | Admin | submitted / triage_pending | rejected / cancelled | Lý do ≥ 10 ký tự | Refund nếu chưa render [Q3] | reject mất tiền |
| T13 | Veto (48h) | Admin | submitted\|under_review / bất kỳ | rejected / cancelled | Trong 48h | Hoàn toàn bộ credit | — |
| T14 | Hoàn thành | [Q4] | report_ready / report_ready_to_publish | completed / done | [Q4] | Notify 2 phía | #5 |
| T15 | User hủy | User | mọi stage mở | closed / cancelled | [Q: stage nào?] | Refund theo policy | #1 |
| T16 | Sửa thông tin hồ sơ | User | intake_pending\|ready / triage_pending | giữ nguyên | **Chỉ khi chưa nộp** | Upsert v00 | **#17** |

Ngoài bảng: external feedback KHÔNG đổi stage (chỉ gắn tài liệu assessment).

## 5. Quyết định engine — ĐỔI symflow → XState v5

**Lý do (theo tiêu chí: bớt drama, ổn định dài hạn, maintainable — KHÔNG phải chi phí code):**

| Tiêu chí | Symflow | XState v5 |
|---|---|---|
| Agent code | ❌ gần như không có trong training data — đoán sai API, loop sửa | ✅ rất nhiều — viết đúng lượt đầu |
| Ổn định dài hạn | ❌ cộng đồng nhỏ, rủi ro abandoned | ✅ Stately.ai đứng sau, active |
| Maintainable | ⚠️ config lạ (Symfony style), không typegen | ✅ typegen bắt lỗi lúc build, Stately Studio visualize |
| Guard/action theo tên | ⚠️ guards có, actions = event listener | ✅ guard/actions khai báo trong config (registry luôn) |
| Data hiện có | — | ✅ không đổi — marking vẫn trên internal_status |

**Giữ nguyên 3 thứ:**
1. DB không đổi — marking vẫn cột `internal_status`, stage vẫn `user_facing_stage`
2. Thiết kế 5 lớp + transition table v2 không đổi
3. Guard/action map theo tên trong XState config (thay registry tự xây)

**Ghi rõ cho agent:**
- XState **v5**, không phải v4 (`cond` → `guard`, actor model mới)
- Dùng config thuần `createMachine` — KHÔNG actor model (máy chạy 1 lần khi transition, không chạy nền)
- entry actions = L4 lưu dữ liệu; sau commit = L5 emit event bus (không side effect trong transition)
- Chuyển `phase-07-symflow-transitions.test.ts` sang XState tương đương

## 6. Kiến trúc đích

```
Mọi use case thay đổi state (nộp, duyệt, gửi, sửa, veto, resubmit)
        ↓
CaseTransitionService.execute({ transition, caseId, actor, data })
  L1 Validation → L2 Guard → L3 XState (can/transition) → L4 Action (transaction) → L5 Effect
        ↓ đọc luật từ ↓
transition-registry.ts  (bảng v2 → XState createMachine config + guards/actions theo tên)
```

**File mới:** `transition-registry.ts` (XState machine config — 16 transitions), `case-transition.service.ts` (cổng 5 lớp).
**Sửa:** 5-6 use case (submit-intake, submit-revision, submit-supporter-output, accept thêm guard paid, veto/resubmit), FE render nút theo `allowed_transitions` (type đã có).
**Schema:** +1 dòng `@@unique([lifecycle_unit_id, doc_type, seq])` trên DocumentRecord (migration đơn giản).

## 7. BLOCKER — 5 quyết định sản phẩm CHƯA CHỐT (chặn phase refund/resubmit)

- **Q1** — Resubmit sau refund (veto): free re-triage hay phải mua credit mới? (T3, T4)
- **Q2** — Giới hạn doc: bao nhiêu file? ký tự: bao nhiêu chữ? (T2, L1)
- **Q3** — Reject khi supporter ĐÃ chấm xong (service rendered): refund hay không? (T12)
- **Q4** — Ai bấm "hoàn thành": user xác nhận hay supporter tự đóng? (T14)
- **Q5** — Check credit lúc nộp hồ sơ (T2) hay lúc admin duyệt (T5)?

> Plan implement nên pha 1 = fix engine + T1-T11/T16 (không phụ thuộc Q), pha 2 = T12-T15 + refund/resubmit (cần Q1, Q3, Q4).

## 8. Kế hoạch 4 bước

1. **B1:** Viết `transition-registry.ts` (bảng v2 → XState v5 config, guard/action theo tên) — chưa đụng logic cũ
2. **B2:** Viết `case-transition.service.ts` + chuyển **submit-revision** (bug Critical #18) qua cổng — mở rộng test phase-07
3. **B3:** Lan: supporter-output (#2 #4), intake (#12 #13 #17), accept guard paid (#9), veto/resubmit (BP1), FE allowed_transitions (#7)
4. **B4:** Refund/resubmit policy — **sau khi chốt Q1 Q3 Q4** + script fix data kẹt (case dính waiting_user/cancelled trên prod — cẩn thận DB safety rules, không chạy destructive)

## 9. Tiêu chí thành công (verification)

- [ ] 14 bugs backlog: từng bug có test hoặc verify thủ công → đóng
- [ ] Mọi use case thay đổi state đi qua CaseTransitionService (không còn check tay rải rác)
- [ ] Không có transition nào đổi 1 cột — stage + status luôn đi đôi
- [ ] `phase-07` + test mới chuyển XState pass
- [ ] Case kẹt cũ trên prod được fix data
- [ ] allowed_transitions FE render đúng theo stage (không hardcode)

## 10. Unresolved / cần verify khi lên plan

- `resubmitCase` route có tồn tại trong cases.controller.ts không (cases.routes.ts)?
- `completeCaseUseCase`, `deleteCaseUseCase`, `updateCaseSettingsUseCase`, `upgradePackageUseCase` — đọc sâu trước khi map transition
- FE đang gọi đường nào để resubmit (StatusGuidanceCard.tsx:207 — xác nhận hiện gọi /intake)
- Gói free vs Premium khác gì (bug 15 bonus) — chưa trả lời
