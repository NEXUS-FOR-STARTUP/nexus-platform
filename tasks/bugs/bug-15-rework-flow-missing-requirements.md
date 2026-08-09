# Bug 15: Luồng làm lại bị ép điền form riêng → trống "YÊU CẦU HIỆN TẠI"

## Thông tin gốc (Google Docs)

> Lỗi luồng. Điền intake xong bên admin sẽ nhận data của intake đó khi bị bắt yêu cầu làm lại làm "trang bắt điền vô form upload riêng" thay vì intake như cũ nên nó thành 1 bug trống nội dung phần "YÊU CẦU HIỆN TẠI".

**Bonus:** Gói dịch vụ miễn phí đó là gì vậy có khác gì với gói Premium không vì cơ bản là mua bán credit thôi mà mua rồi phải được thăng gói Premium chứ

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Flow bug + câu hỏi sản phẩm |
| Effort | **L** |
| Độ phức tạp | Cao: rework flow dùng sai endpoint (upload form thay vì intake) |
| Dependency | #17, #18 |
| Quyết định cần | **Bonus: gói miễn phí vs Premium khác gì?** — chưa trả lời |
| Vùng code | Rework/redo flow — case submission + intake form |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | High |
| Target | — |
| Ghi chú | Phải dùng lại intake form khi làm lại, không phải form upload riêng |

## Acceptance Criteria (draft)
- [ ] User làm lại → điền lại intake form như cũ (không phải form upload riêng)
- [ ] Admin nhận đủ nội dung "YÊU CẦU HIỆN TẠI"
- [ ] Trả lời câu hỏi gói miễn phí vs Premium
