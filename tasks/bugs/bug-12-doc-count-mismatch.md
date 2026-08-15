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
| Status | Done |
| Assignee | — |
| Priority | High |
| Target | 2026-08-16 |
| Ghi chú | Đã fix trong plan `260815-2154-backlog-bugs-fix` (2026-08-16): bỏ "tài liệu chính", category codes lưu `metadata_json.category`, soft-supersede (`superseded_at` + index) — nộp lại mark record cũ ngoài bộ mới, user read filter `superseded_at null`, fix `unit_code "intake"→"v00"` |

## Acceptance Criteria (draft)
- [x] Số lượng tài liệu hiển thị nhất quán giữa admin và user
- [x] Xác định rõ document nào là chuẩn (versioning/visibility)
