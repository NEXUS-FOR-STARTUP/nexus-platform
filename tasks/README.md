# Bug Tracker — Nexus Platform

> Nguồn: [Google Docs — bugv3](https://docs.google.com/document/d/1zS1z67MHri9xtrXXQEb8EUI5DI2OHycZQJ1BEqA2h90/edit?tab=t.0)
> Import: 2026-08-08 · 18 bugs + 1 câu hỏi bonus · Status tab đã merge vào đây

## Master Tracking Table

| # | Bug | Severity | Effort | Dependency | Quyết định cần | Status |
|---|-----|----------|--------|------------|-----------------|--------|
| 1 | Supporter ốm → phân lại supporter, SLA có reset? | High | **XL** | — | SLA đếm tiếp/reset? User hủy stage nào? | Backlog |
| 2 | Supporter gửi report khi chưa chat/upload → "lỗi hệ thống" | Low | **S** | — | Chỉ đổi error message (note [b]) | Backlog |
| 3 | User không hiểu "lần 2 phải mua credit → chat → upload" | Medium | **M** | #4 | Nhỏ | Backlog |
| 4 | Supporter hết credit gửi report lần 2 | Medium | **M** | #2, #5, #18 | Nhỏ | Backlog |
| 5 | Chưa rõ ai xác nhận hoàn thành (user/supporter) | High | **M** | #4 | User hay supporter confirm? | Backlog |
| 6 | Lịch sử nội dung chữ nhỏ quá to | Low | S | — | — | **Done** |
| 7 | Giấu nút upload sinh viên khi chờ duyệt | Medium | **M** | #18 | Nhỏ | Backlog |
| 8 | Message chữ nhỏ giờ to | Low | S | — | — | **Done** |
| 9 | Trả tiền nhưng chưa cập nhật hồ sơ → admin duyệt trống | Medium | **L** | #17 | UX mới? | Backlog |
| 10 | Chưa căn giữa đẹp | Low | S | — | — | **Done** |
| 11 | Web không realtime (SePay) | High | — | — | — | **Done** |
| 12 | Admin thấy nhiều tài liệu, user thấy 1 | High | **L** | #13 | Doc nào chuẩn? | Backlog |
| 13 | Intake spam tài liệu không giới hạn | Medium | **M** | #12 | Giới hạn bao nhiêu? | Backlog |
| 14 | Intake lưu không giới hạn chữ | Medium | **M** | — | Giới hạn bao nhiêu? | Backlog |
| 15 | Luồng làm lại bị ép điền form riêng → trống "YÊU CẦU HIỆN TẠI" | High | **L** | #17, #18 | Gói miễn phí vs Premium? | Backlog |
| 16 | Không kick user khi admin xóa hồ sơ | Medium | **M** | #11 | Nhỏ | Backlog |
| 17 | Update intake mọi trạng thái (lui trang) | Medium | **M** | #7, #18 | Nhỏ — BR rõ | Backlog |
| 18 | Kẹt luồng: admin yêu cầu bổ sung → user nộp kẹt | **Critical** | **XL** | block #7 #15 #17 | Nhỏ — bug | Backlog |

## Effort Ranking (nặng → nhẹ)

| Tier | Effort | Bugs | Ghi chú |
|------|--------|------|---------|
| 1 | **XL** | #1, #18 | Quyết định lớn + core state machine. #18 là blocker chặn production |
| 2 | **L** | #9, #12, #15 | UX/BR + sửa flow, đụng nhiều tầng |
| 3 | **M** | #3, #4, #5, #7, #13, #14, #16, #17 | Kỹ thuật thuần, ít quyết định |
| 4 | **S** | #2, #6, #8, #10 | Fix nhỏ / message / UI |
| — | Done | #6, #8, #10, #11 | Hoàn thành |

## Execution Order (khuyến nghị)

1. **#18** — bug chặn production, fix trước (mở đường #7, #17, #15)
2. **#4 + #5 + #2** — nhóm hoàn thành quy trình (cần chốt 1 quyết định)
3. **#1** — effort lớn nhất, cần chốt SLA policy sớm (đụng admin + supporter)
4. **#15 + #9** — cần chốt UX + câu hỏi gói miễn phí
5. Nhóm M (#3, #7, #13, #14, #16, #17) — kỹ thuật thuần, làm xen kẽ
6. **#12** — debug data layer, đợi #13 (hết spam thì dễ truy vết)

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
