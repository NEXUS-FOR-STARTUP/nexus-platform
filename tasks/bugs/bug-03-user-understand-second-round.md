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
| Status | Done |
| Assignee | — |
| Priority | Medium |
| Target | 2026-08-16 |
| Ghi chú | Đã fix trong plan `260815-2154-backlog-bugs-fix` (2026-08-16): banner credit guidance ở `report_ready` (có credit → guidance, hết credit → đỏ + nút "Mua credit"), BE throw 402 NO_CREDITS rõ khi T11/T3 hết credit, fix free-case `subtractCredit` no-op khi `lockedPrice===0` |

## Acceptance Criteria (draft)
- [x] User thấy hướng dẫn rõ ràng: làm lần 2 = mua credit → chat → upload file
- [x] Thông báo xuất hiện đúng thời điểm (sau lần 1 kết thúc / khi user tương tác tiếp)
