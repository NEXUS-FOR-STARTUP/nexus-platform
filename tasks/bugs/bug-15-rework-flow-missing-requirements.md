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
| Status | Done (2026-08-14 — plan `260814-1825-reject-resubmit-loop-fix`) |
| Assignee | — |
| Priority | High |
| Target | — |
| Ghi chú | Phải dùng lại intake form khi làm lại, không phải form upload riêng |

## Acceptance Criteria (draft)
- [x] User làm lại → điền lại intake form như cũ (không phải form upload riêng)
- [x] Admin nhận đủ nội dung "YÊU CẦU HIỆN TẠI"
- [x] Trả lời câu hỏi gói miễn phí vs Premium

> **Done note:** nộp lại = 1 action atomic `POST /cases/:id/intake` (lưu content + transition cùng tx, D3), upsert unit v00 + docs — content "YÊU CẦU HIỆN TẠI" giữ nguyên.
>
> **Bonus answer (đã chốt, plan 260809 phase-05):** ngoài scope — business decision. Model hiện tại: free = `pkg_tf_free` "Team-fit Free" (0đ), trả phí = `pkg_tf_audit` (39.000đ). Mua credit KHÔNG tự thăng gói; upgrade gói qua `upgrade-package` riêng.
