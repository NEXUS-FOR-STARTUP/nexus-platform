# Runbook: làm trước, thu tiền sau (khoản ứng nợ)

Dùng khi khách gửi tài liệu qua Zalo, vận hành chạy đánh giá trước rồi mới gửi QR, và ví vận hành không đủ tiền.

## Luồng vận hành

1. Khách gửi tài liệu qua Zalo.
2. **Tạo case dưới tài khoản vận hành** và nhập tài liệu (cần có case trước khi tạo nợ kèm mua lượt).
3. Admin → **Khoản nợ** → **Tạo khoản nợ**: nhập tên/Zalo khách, hạn trả, bật **Mua lượt hộ**, chọn người nhận ví (chủ case), case, gói, số lượng. Số phải thu điền sẵn bằng giá đơn (chỉnh cao hơn được, không thấp hơn).
   - Một transaction: ví vận hành +giá đơn (`adjustment`/`platform_bonus`) rồi −giá đơn (`withdrawal`), case nhận lượt. Số dư ví không đổi.
   - Không có ô nhập số tiền cấp, không có endpoint cấp ví đứng riêng.
4. Chạy đánh giá (admin chủ động; đơn tài trợ mặc định không tự chạy audit).
5. Gửi bản tóm tắt cho khách qua Zalo.
6. Bấm **Tạo link thanh toán**, gửi link `/pay/<token>` qua Zalo. Trang hiện QR, ngân hàng, số còn nợ, nội dung chuyển khoản `CRDEBT…`.
7. Khách chuyển khoản **giữ nguyên nội dung `CRDEBT…`**. SePay gọi webhook, hệ thống tự ghi thanh toán, trang tự chuyển trạng thái. Nhập tay chỉ khi webhook không khớp.
8. Khi `Đã thu đủ`, gửi bản đầy đủ.

## Quy tắc

- Thanh toán nợ **không tạo `Deposit`** và **không cộng ví**. Khách không nhận thêm credit khi trả nợ.
- Link `/pay/<token>` là bí mật mang theo: ai có link xem được mã nợ, số tiền, QR. Không đăng công khai.
- Một cặp (case, loại dịch vụ) không trộn lượt tài trợ với lượt mua thật (409), và không cấp tài trợ thêm vào cặp đã từng hoàn lượt.
- Doanh thu admin **không** tính đơn tài trợ. Tiền thật thu được nằm ở `receivable_payments`.

## Xử lý tình huống

| Tình huống | Làm gì |
|---|---|
| Chuyển thiếu | Trạng thái `Thu một phần`, QR lần sau theo số còn lại |
| Chuyển dư | Dòng thanh toán giữ `gross` (tiền thật), `applied` = phần trừ nợ; khoản nợ có cờ cần xem. **Hoàn phần dư cho khách thủ công** |
| Sai nội dung chuyển khoản | Webhook không khớp; dùng **Ghi thanh toán** nhập tay với mã giao dịch ngân hàng (không được trùng) |
| Khách không trả | Sau hạn thành `Quá hạn`; nhắc; cuối cùng **Xoá nợ** có lý do (không hoàn tác trong v1) |
| Nghi lộ link / mất link | **Tạo link mới**: link cũ chết ngay |
| Hoàn/huỷ lượt đã tài trợ | Hệ thống tự xoá nợ tương ứng trong cùng transaction, ví không tăng. Xoá nợ tính theo `amount_due`, phân bổ theo từng lô |
| Khách đã trả nhiều hơn phần dịch vụ đã giao | Ngoài phạm vi: xử lý hoàn tiền thủ công |

## Cấu hình

- `PUBLIC_WEB_URL`: base URL web để dựng link thanh toán (prod: `https://nexusforstartup.site`).
- SePay đã cấu hình tiền tố `CR`, hậu tố 6-30 (xem `.env.example`); `CRDEBT` + 6 hex khớp mẫu này.
- Che token trong log: log request của API đã che `/api/public/receivables/<token>`. **Reverse proxy/Next phải che đường dẫn `/pay/<token>` trong access log** (chưa kiểm cấu hình proxy trên VPS).

## Checklist bàn giao prod (người dùng thực hiện, agent không chạm prod)

1. Migration chưa được tạo trong `prisma/migrations/`. Tạo bằng `prisma migrate dev --create-only` trên DB local đã xác nhận, đối chiếu với `plans/261016-1530-grant-wallet-funds-pay-later/migration-preview.sql` (chỉ `CREATE TABLE`, `CREATE INDEX`, `ADD CONSTRAINT` trên bảng mới; không `DROP`/`ALTER` bảng cũ; có 3 ràng buộc `CHECK`).
2. Backup theo `docs/db-backup-guide.md`.
3. Áp migration (`prisma migrate deploy`) **trước** khi deploy API: truy vấn thống kê admin tham chiếu bảng `receivables`.
4. Đặt `PUBLIC_WEB_URL`, deploy API + web.
5. Tạo một khoản nợ thử với đơn nhỏ; kiểm lịch sử ví (+X rồi −X), đơn, danh sách nợ, trang `/pay/<token>` ở cửa sổ ẩn danh; chuyển khoản thử một khoản nhỏ và kiểm webhook.
6. Rồi mới dùng thật.

## Giới hạn đã biết

- Hai request ghi thanh toán/xoá nợ đồng thời được chặn bằng khoá hàng `FOR UPDATE`; việc này chỉ kiểm chứng được trên Postgres thật (chưa chạy).
- Danh sách lọc trạng thái và phân trang trong bộ nhớ (đủ cho vài trăm khoản nợ).
- Phân bổ xoá nợ khi hoàn tiền dựa trên giả định lô cũ dùng trước (cùng giả định FIFO hiện có).
- Khoá idempotency hoàn tiền hiện có là vĩnh viễn theo (case, loại dịch vụ); vì vậy không cấp tài trợ thêm vào cặp đã hoàn.
