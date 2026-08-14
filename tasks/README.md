# Bug Tracker — Nexus Platform

> Nguồn: [Google Docs — bugv3](https://docs.google.com/document/d/1zS1z67MHri9xtrXXQEb8EUI5DI2OHycZQJ1BEqA2h90/edit?tab=t.0)
> Import: 2026-08-08 · 18 bugs + 1 câu hỏi bonus · Status tab đã merge vào đây

## Master Tracking Table

| # | Bug | Severity | Effort | Dependency | Quyết định cần | Status |
|---|-----|----------|--------|------------|-----------------|--------|
| 1 | Supporter ốm → phân lại supporter, SLA có reset? | High | **XL** | — | SLA đếm tiếp/reset? User hủy stage nào? | Backlog |
| 2 | Supporter gửi report khi chưa chat/upload → "lỗi hệ thống" | Low | **S** | — | Chỉ đổi error message (note [b]) | **Done** |
| 3 | User không hiểu "lần 2 phải mua credit → chat → upload" | Medium | **M** | #4 | Nhỏ | Backlog |
| 4 | Supporter hết credit gửi report lần 2 | Medium | **M** | #2, #5, #18 | Nhỏ | **Done** |
| 5 | Chưa rõ ai xác nhận hoàn thành (user/supporter) | High | **M** | #4 | User hay supporter confirm? | Backlog |
| 6 | Lịch sử nội dung chữ nhỏ quá to | Low | S | — | — | **Done** |
| 7 | Giấu nút upload sinh viên khi chờ duyệt | Medium | **M** | #18 | Nhỏ | **Done** |
| 8 | Message chữ nhỏ giờ to | Low | S | — | — | **Done** |
| 9 | Trả tiền nhưng chưa cập nhật hồ sơ → admin duyệt trống | Medium | **L** | #17 | UX mới? | Backlog |
| 10 | Chưa căn giữa đẹp | Low | S | — | — | **Done** |
| 11 | Web không realtime (SePay) | High | — | — | — | **Done** |
| 12 | Admin thấy nhiều tài liệu, user thấy 1 | High | **L** | #13 | Doc nào chuẩn? | **Partial** |
| 13 | Intake spam tài liệu không giới hạn | Medium | **M** | #12 | Giới hạn bao nhiêu? | Backlog |
| 14 | Intake lưu không giới hạn chữ | Medium | **M** | — | Giới hạn bao nhiêu? | Backlog |
| 15 | Luồng làm lại bị ép điền form riêng → trống "YÊU CẦU HIỆN TẠI" | High | **L** | #17, #18 | Gói miễn phí vs Premium? | **Done** |
| 16 | Không kick user khi admin xóa hồ sơ | Medium | **M** | #11 | Nhỏ | Backlog |
| 17 | Update intake mọi trạng thái (lui trang) | Medium | **M** | #7, #18 | Nhỏ — BR rõ | **Done** |
| 18 | Kẹt luồng: admin yêu cầu bổ sung → user nộp kẹt | **Critical** | **XL** | block #7 #15 #17 | Nhỏ — bug | **Done** |

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
| 1 | **XL** | #1 | Quyết định lớn + core state machine (SLA reassign) |
| 2 | **L** | #9, #12, #13 | UX/BR + sửa flow, đụng nhiều tầng |
| 3 | **M** | #3, #5, #14, #16 | Kỹ thuật thuần, ít quyết định |
| 4 | **S** | — | Fix nhỏ / message / UI |
| — | Done | #2, #4, #6, #7, #8, #10, #11, #15, #17, #18 | Hoàn thành (2026-08-14: #18 + 5 bug liên quan) |
| — | Partial | #12 | Hết dup v00/doc, chờ #13 |

## Execution Order (khuyến nghị)

1. **#1** — effort lớn nhất, cần chốt SLA policy sớm (đụng admin + supporter)
2. **#5 + #3** — nhóm hoàn thành quy trình (cần chốt 1 quyết định)
3. **#13 + #12** — giới hạn intake (số tài liệu) → hết spam thì truy vết #12 dễ
4. **#9 + #14** — cần chốt UX + giới hạn chữ
5. Nhóm M còn lại (#16) — kỹ thuật thuần, làm xen kẽ

## Open Decisions (cần chốt trước khi code)

| # | Câu hỏi | Ảnh hưởng |
|---|---------|-----------|
| 1 | SLA khi reassign supporter: đếm tiếp hay reset? | #1 |
| 2 | Ai xác nhận hoàn thành: user hay supporter? | #4, #5 |
| 3 | Gói miễn phí vs Premium khác gì? | #15 (bonus) |
| 4 | Giới hạn số tài liệu / số ký tự intake? | #13, #14 |
| 5 | User có quyền hủy hồ sơ ở stage "báo cáo chờ gửi"? | #1 |

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
