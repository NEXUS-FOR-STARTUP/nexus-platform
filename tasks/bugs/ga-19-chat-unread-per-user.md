# GA-19: Đếm số tin nhắn chưa đọc theo từng người dùng (Chat Unread-per-User)

- **ID:** GA-19
- **Priority:** P2
- **Category:** Chat / UX
- **Status:** Todo
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`

---

## 1. Mô tả vấn đề
Tại trang Case Workspace (`apps/web-1/app/dashboard/case/[id]/page.tsx:113`), badge tin nhắn trên tab Chat hiện đang hiển thị `messages?.length` — tức là **tổng số tin nhắn** có trong cuộc trò chuyện, thay vì số tin nhắn mới mà người dùng hiện tại chưa đọc (`unread_count`).
Người dùng và Supporter không thể phân biệt được case nào có tin nhắn mới cần phản hồi gấp, dễ dẫn tới bỏ sót tin nhắn quan trọng.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Database & Schema:**
   - Tạo model `CaseChatReadState` lưu: `case_id`, `user_id`, `last_read_message_id`, `last_read_at` (hoặc mảng `read_by` trong `CaseMessage`).
2. **Backend API & Realtime:**
   - Endpoint: `POST /api/cases/:id/chat/read` (đánh dấu đã đọc tới tin nhắn $M$).
   - Tính toán `unread_count` theo từng user khi trả về danh sách case hoặc chi tiết case.
   - Bắn event Centrifugo thông báo trạng thái đã đọc (Read Receipt) cho đối phương.
3. **Frontend UI:**
   - Badge tab Chat chỉ hiện số lượng tin chưa đọc (nếu unread = 0 thì ẩn badge).
   - Tự động gọi API đánh dấu đã đọc khi người dùng mở tab Chat và cuộn tới tin nhắn cuối.
