# Bug Tracker — Nexus Platform

> Nguồn: [Google Docs — bugv3](https://docs.google.com/document/d/1zS1z67MHri9xtrXXQEb8EUI5DI2OHycZQJ1BEqA2h90/edit?tab=t.0)
> Import: 2026-08-08 · 18 bugs + 1 câu hỏi bonus · Status tab đã merge vào đây

## Master Tracking Table

| # | Bug | Severity | Effort | Dependency | Quyết định cần | Status |
|---|-----|----------|--------|------------|-----------------|--------|
| 1 | Supporter ốm → phân lại supporter, SLA có reset? | High | **XL** | — | SLA đếm tiếp/reset? User hủy stage nào? | **Done** |
| 2 | Supporter gửi report khi chưa chat/upload → "lỗi hệ thống" | Low | **S** | — | Chỉ đổi error message (note [b]) | **Done** |
| 3 | User không hiểu "lần 2 phải mua credit → chat → upload" | Medium | **M** | #4 | Nhỏ | **Done** |
| 4 | Supporter hết credit gửi report lần 2 | Medium | **M** | #2, #5, #18 | Nhỏ | **Done** |
| 5 | Chưa rõ ai xác nhận hoàn thành (user/supporter) | High | **M** | #4 | User hay supporter confirm? | **Done** |
| 6 | Lịch sử nội dung chữ nhỏ quá to | Low | S | — | — | **Done** |
| 7 | Giấu nút upload sinh viên khi chờ duyệt | Medium | **M** | #18 | Nhỏ | **Done** |
| 8 | Message chữ nhỏ giờ to | Low | S | — | — | **Done** |
| 9 | Trả tiền nhưng chưa cập nhật hồ sơ → admin duyệt trống | Medium | **L** | #17 | UX mới? | **Done** |
| 10 | Chưa căn giữa đẹp | Low | S | — | — | **Done** |
| 11 | Web không realtime (SePay) | High | — | — | — | **Done** |
| 12 | Admin thấy nhiều tài liệu, user thấy 1 | High | **L** | #13 | Doc nào chuẩn? | **Done** |
| 13 | Intake spam tài liệu không giới hạn | Medium | **M** | #12 | Giới hạn bao nhiêu? | **Done** |
| 14 | Intake lưu không giới hạn chữ | Medium | **M** | — | Giới hạn bao nhiêu? | **Done** |
| 15 | Luồng làm lại bị ép điền form riêng → trống "YÊU CẦU HIỆN TẠI" | High | **L** | #17, #18 | Gói miễn phí vs Premium? | **Done** |
| 16 | Không kick user khi admin xóa hồ sơ | Medium | **M** | #11 | Nhỏ | **Done** |
| 17 | Update intake mọi trạng thái (lui trang) | Medium | **M** | #7, #18 | Nhỏ — BR rõ | **Done** |
| 18 | Kẹt luồng: admin yêu cầu bổ sung → user nộp kẹt | **Critical** | **XL** | block #7 #15 #17 | Nhỏ — bug | **Done** |

> **Cập nhật 2026-08-16 — plan `260815-2154-backlog-bugs-fix` (8 phases):** đóng 8 bug còn lại.
> #1 Done — SLA đếm tiếp (không reset); T6 self-loop cho reassign ở `supporter_working`/`report_ready_to_publish`; refund credit dư FIFO theo giá mua thực tế (DESC), idempotency `refund-credit-{caseId}`; xóa supporter close-case route.
> #3 Done — banner credit guidance ở `report_ready` + nút mua credit; T11/T3 hết credit → 402 NO_CREDITS rõ; free-case `subtractCredit` no-op.
> #5 Done — user xác nhận hoàn thành qua T17; T14 admin-only; auto-done 7 ngày (neo latest T11, fire T14 ADMIN); mua credit case `done` → T19_REOPEN → `under_review`, re-arm SLA.
> #9 Done — admin list tách bucket `intake_pending` "Chờ sinh viên nộp hồ sơ"; review queue chỉ `submitted`/`triage_pending`; admin detail empty-state khi `intake_snapshot=null`.
> #12 Done (bỏ Partial) — bỏ "tài liệu chính", category codes, soft-supersede `superseded_at`, user read filter null, `unit_code v00`.
> #13 Done — max 10 tài liệu intake-only (`Cp1IntakeSchema` + FE).
> #14 Done — caps text intake (≤100 contact/primary_need, ≤254 email, ≤20000 blocker/summary/situations).
> #16 Done — xóa case → realtime `case_deleted` trên `chat:{caseId}` + FE kick/redirect + poll fallback 404.

> **Cập nhật 2026-08-14 — plan `260814-1825-reject-resubmit-loop-fix` (6 phases):**
> #18 Done — reject→edit→resubmit loop chạy trọn qua `POST /cases/:id/intake` atomic (T3/T4), không dead state; admin request-more-info đã xóa (giao tiếp triage = lý do từ chối T12 ≥10 ký tự).
> #17 Done — intake chỉ sửa được ở `triage_pending`/`cancelled` (400 INVALID_CASE_STAGE), `waiting_user` → 409 REVISION_REQUIRED.
> #7 Done — FE gating theo `allowed_transitions` + `filterTransitions` (T9 chỉ hiện ở waiting_user).
> #15 Done — nộp lại upsert v00 + docs (D13), content "YÊU CẦU HIỆN TẠI" giữ nguyên không trống.
> #4 Done — T11 credit check trong tx qua machine `hasCredit` (402 NO_CREDITS, không còn lỗi hệ thống).
> #2 Done — lỗi chuyển thành AppError có code (INVALID_TRANSITION/NO_CREDITS/409 DUPLICATE_CREDIT_CONSUMPTION), không còn 500 chung.
> #12 Partial — hết duplicate v00/DocumentRecord khi nộp lại (upsert deterministic ID); mâu thuẫn "admin thấy nhiều/user thấy 1" còn do #13.

## Effort Ranking (nặng → nhẹ)

| Tier | Effort | Bugs | Ghi chú |
|------|--------|------|---------|
| — | Done | Tất cả 18 bug | #2 #4 #6 #7 #8 #10 #11 #15 #17 #18 (2026-08-14) + #1 #3 #5 #9 #12 #13 #14 #16 (2026-08-16) |

## Execution Order (khuyến nghị)

Đã hoàn thành toàn bộ — không còn bug mở. Nhóm thực thi cuối (plan `260815-2154-backlog-bugs-fix`, 2026-08-16):
1. **#1** — SLA đếm tiếp + T6 self-loop reassign + refund FIFO credit dư
2. **#5 + #3** — completion flow (T17/T14/T19 + auto-done) + credit UX banner/402
3. **#13 + #12** — intake caps (10 docs, text limits) + document model (category, soft-supersede)
4. **#9 + #14** — admin queue bucket + text caps (cùng nhóm intake)
5. **#16** — realtime kick khi xóa case

## Open Decisions (cần chốt trước khi code)

Đã chốt hết trong plan `260815-2154-backlog-bugs-fix` (2026-08-15, locked — không re-litigate):

| # | Câu hỏi | Quyết định |
|---|---------|-----------|
| 1 | SLA khi reassign supporter: đếm tiếp hay reset? | Đếm tiếp (không reset) — T6 self-loop ở supporter_working/report_ready |
| 2 | Ai xác nhận hoàn thành: user hay supporter? | User xác nhận (T17 isOwner); T14 admin-only force-close; auto-done 7 ngày fire T14 ADMIN |
| 3 | Gói miễn phí vs Premium khác gì? | (không thuộc 8 bug này — đã chốt ở plan trước) |
| 4 | Giới hạn số tài liệu / số ký tự intake? | Max 10 tài liệu; text caps ≤100/≤254/≤20000 theo field |
| 5 | User có quyền hủy hồ sơ ở stage "báo cáo chờ gửi"? | Giữ nguyên quyền hủy của owner (T15) + refund credit dư |

## Structure

```
tasks/
├── README.md          ← master tracking (file này)
└── bugs/
    ├── bug-01-supporter-reassign-sla.md
    ├── bug-02-supporter-report-error-message.md
    ├── ... (18 files, 1 bug/file)
```

Mỗi file bug có: thông tin gốc từ Google Docs, phân tích, tracking table riêng.
