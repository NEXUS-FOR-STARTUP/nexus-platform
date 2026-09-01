# Báo cáo Khảo sát Kỹ thuật: GA-06 Security & Invariants

## 1. Các bất biến bảo mật (Security Invariants)
1. **Không để lộ Session Token**: Session token là bí mật xác thực nhạy cảm lưu trong httpOnly cookie. Client không bao giờ nhận `token` từ API.
2. **Không tự thu hồi phiên hiện tại qua nút đơn lẻ**: Phiên hiện tại chỉ có Badge "Phiên hiện tại" và không có nút "Đăng xuất" riêng biệt ở dòng đó (người dùng muốn đăng xuất máy hiện tại sẽ dùng nút Đăng xuất trên thanh điều hướng / UserMenu).
3. **Lọc phiên đã hết hạn ở tầng Server**: Truy vấn `WHERE user_id = :userId AND expires_at > NOW()` đảm bảo không rò rỉ metadata các phiên cũ đã hết hạn.
4. **Bảo vệ quyền sở hữu Session (IDOR Protection)**: Mọi thao tác DELETE/REVOKE phải kèm điều kiện `user_id = :authenticatedUserId`.
5. **Giao dịch nguyên tử khi thu hồi hàng loạt**: Thao tác thu hồi tất cả phiên khác (`revoke-others`) phải dùng `prisma.$transaction` để đảm bảo tính nhất quán (Atomicity).

## 2. Phân tích các ca biên (Edge Cases & Failure Modes)
| STT | Kịch bản | Rủi ro | Giải pháp kỹ thuật |
|---|---|---|---|
| 1 | Thu hồi phiên đã bị xóa trước đó | Lỗi 404 hoặc exception | Xử lý idempotent: Trả về thành công nếu session không còn tồn tại hoặc số dòng xóa = 0. |
| 2 | Mất kết nối mạng / DB timeout | UI bị đơ trạng thái loading | TanStack Mutation error handling kèm Mantine Notification báo lỗi cụ thể. |
| 3 | UserAgent rỗng / bot / dị dạng | Parser crash gây vỡ UI | `ua-parser.ts` bọc safe fallback, mặc định "Thiết bị không xác định". |
| 4 | IP dạng IPv6 / Private IP / Localhost | Hiển thị chuỗi `::1` hoặc `127.0.0.1` | Hiển thị nhãn thân thiện "Localhost (::1)" hoặc giữ nguyên IP sạch. |
| 5 | Centrifugo WebSocket sau khi thu hồi phiên khác | Client khác vẫn giữ kết nối WS ngắn hạn | Centrifugo JWT TTL chỉ 15 phút, sau 15 phút refresh token sẽ bị chặn bởi Better Auth 401. |
