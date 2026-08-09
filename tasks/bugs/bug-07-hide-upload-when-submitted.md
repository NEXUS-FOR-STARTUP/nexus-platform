# Bug 7: Giấu nút upload sinh viên khi chờ duyệt

## Thông tin gốc (Google Docs)

> khi trạng thái đã nộp chờ duyệt thì nên bỏ nút upload file của sinh viên đúng k nhỉ

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | UI: condition theo status |
| Effort | **M** (thấp-trung bình) |
| Độ phức tạp | Thấp: ẩn nút dựa trên case status |
| Dependency | #18 (status flow) — phải biết status hợp lệ |
| Quyết định cần | Nhỏ |
| Vùng code | `apps/web-1/app/dashboard/case/[id]/` — upload button + status check |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | Medium |
| Target | — |
| Ghi chú | Ẩn upload khi case ở trạng thái đã nộp chờ duyệt |

## Acceptance Criteria (draft)
- [ ] Sinh viên không thấy nút upload khi hồ sơ ở trạng thái "đã nộp chờ duyệt"
