# Bug 9: Trả tiền nhưng chưa cập nhật hồ sơ → admin duyệt trống

## Thông tin gốc (Google Docs)

> tạo case, đã trả tiền rồi nhưng chưa cập nhật thông tin hồ sơ, bên admin phần duyệt chi tiết sẽ bị trống, không tốt. cần phải có ux khác

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | UX: empty-state cho hồ sơ chưa điền thông tin |
| Effort | **L** |
| Độ phức tạp | Trung bình: UX empty-state + guard |
| Dependency | #17 (update intake chỉ khi chưa gửi) |
| Quyết định cần | **UX mới cho hồ sơ thiếu thông tin** — chưa chốt |
| Vùng code | Admin approve detail page + intake form |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | Medium |
| Target | — |
| Ghi chú | Cần thiết kế UX khác cho case đã trả tiền nhưng thiếu thông tin hồ sơ |

## Acceptance Criteria (draft)
- [ ] Admin duyệt chi tiết không bị trống khi case thiếu thông tin
- [ ] UX chỉ rõ trạng thái "chờ user cập nhật thông tin"
