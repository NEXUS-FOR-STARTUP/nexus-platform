# Bug 3: User không hiểu "lần 2 phải mua credit → chat → upload"

## Thông tin gốc (Google Docs)

> [user] nếu muốn tiếp tục hồ sơ này thì nó phải tự hiểu rằng upload tài liệu sẽ được đánh giá lần 2? phải có 1 thông báo hay 1 cảnh báo hay 1 cái block gì đó để [user] hiểu là "à muốn làm lần 2 thì phải mua credit trước rồi chat hỏi rồi upload file lần 2"

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | UX: cần thông báo/cảnh báo/block hướng dẫn quy trình lần 2 |
| Effort | **M** |
| Độ phức tạp | Trung bình: thêm notice/block + flow hint |
| Dependency | #4 (luồng lần 2 có credit) |
| Quyết định cần | Nhỏ — chỉ cần chốt nội dung thông báo |
| Vùng code | `apps/web-1/app/dashboard/case/[id]/` — case detail flow |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | Medium |
| Target | — |
| Ghi chú | UX gợi ý: banner/block khi user muốn làm tiếp lần 2 |

## Acceptance Criteria (draft)
- [ ] User thấy hướng dẫn rõ ràng: làm lần 2 = mua credit → chat → upload file
- [ ] Thông báo xuất hiện đúng thời điểm (sau lần 1 kết thúc / khi user tương tác tiếp)
