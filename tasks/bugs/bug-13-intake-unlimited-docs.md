# Bug 13: Intake spam tài liệu không giới hạn

## Thông tin gốc (Google Docs)

> [trang intake ở user] có thể spam nhiều tài liệu thoải mái không giới hạn (trừ giới hạn 15k mb)

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Validation thiếu |
| Effort | **M** |
| Độ phức tạp | Trung bình: thêm max-count validation |
| Dependency | #12 (spam gây lệch doc count) |
| Quyết định cần | Giới hạn bao nhiêu tài liệu? |
| Vùng code | Intake upload — `apps/web-1/app/dashboard/intake/` + API validation |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | Medium |
| Target | — |
| Ghi chú | Hiện chỉ giới hạn dung lượng (15MB), không giới hạn số file |

## Acceptance Criteria (draft)
- [ ] Giới hạn số tài liệu tối đa khi upload intake
- [ ] Báo lỗi rõ ràng khi vượt giới hạn
