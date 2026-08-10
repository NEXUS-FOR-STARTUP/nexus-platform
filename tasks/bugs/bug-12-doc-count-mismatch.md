# Bug 12: Admin thấy nhiều tài liệu, user chỉ thấy 1

## Thông tin gốc (Google Docs)

> [trang duyệt hồ sơ ở admin] thấy rất nhiều tài liệu nhưng qua [trang quản lý tài liệu ở user] thì chỉ thấy đúng 1 tài liệu sau khi user nó spam cả đống tài liệu

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Bug data consistency |
| Effort | **L** |
| Độ phức tạp | Cao: cần debug data layer — document visibility/versioning |
| Dependency | #13 (nguồn gây spam) |
| Quyết định cần | Doc nào là chuẩn? (admin hay user view) |
| Vùng code | Document listing — admin approve page vs user document management page |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | High |
| Target | — |
| Ghi chú | Admin thấy nhiều doc, user thấy 1 — cần truy vết data layer trước |

## Acceptance Criteria (draft)
- [ ] Số lượng tài liệu hiển thị nhất quán giữa admin và user
- [ ] Xác định rõ document nào là chuẩn (versioning/visibility)
