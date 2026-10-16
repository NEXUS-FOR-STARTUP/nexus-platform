# Phase 2: Schema receivables + migration cộng thêm

## Context Links

- [Phase 1 findings](./phase-01-confirm-wallet-invariants.md)
- `prisma/schema.prisma`, `docs/db-migration-guide.md`
- `.agents/rules/prisma-migration-safety.md`

## Overview

- Priority: P1.
- Status: Pending, chờ phase 1.
- Thêm ba bảng mới (`receivables`, `receivable_payments`, `receivable_adjustments`). Phân loại migration: **additive safe change** (chỉ tạo bảng mới, không đụng bảng cũ).

## Key Insights

- Quy ước schema: bảng số nhiều, cột snake_case.
- Còn nợ/trạng thái tính từ `receivable_payments` và `receivable_adjustments`, không lưu để khỏi lệch. Không có cột `written_off_amount`: tổng xoá nợ là `SUM(receivable_adjustments.amount)`.
- Khoá ngoại tới `wallet_transactions` cho khoản cấp, để nối nợ với giao dịch ví thật.

## Requirements

`receivables`:

| Cột | Ghi chú |
|---|---|
| `id` | uuid |
| `code` | unique, mã hiển thị dùng làm nội dung chuyển khoản |
| `request_key` | unique, chống tạo đôi |
| `customer_name`, `customer_contact` | chữ tự do (Zalo) |
| `case_id` | nullable, khoá ngoại tuỳ chọn |
| `order_id` | nullable, unique, khoá ngoại `orders` (đơn mua hộ do nợ này tài trợ) |
| `amount_due` | int VND, > 0 |
| `due_at` | thời hạn trả |
| `grant_tx_id` | nullable, unique, khoá ngoại `wallet_transactions` |
| `review_reason` | nullable, đặt khi tiền vào cần người xem (chuyển dư so với còn nợ) |
| `public_token_hash` | nullable (rỗng cho tới khi admin bấm "Tạo link thanh toán"), unique, SHA-256 (hex) của token 32 byte ngẫu nhiên (`crypto.randomBytes(32)`, base64url). DB không lưu token gốc, nên lộ DB không lộ link. Token gốc chỉ hiện một lần lúc tạo hoặc xoay; tra cứu bằng cách băm token trong URL. Là bí mật mang theo (bearer) |
| `public_token_rotated_at` | nullable, thời điểm xoay token gần nhất |
| `created_by` | id admin |
| `created_at`, `updated_at` | |

Không lưu `beneficiary_user_id`, `service_type_code`, `quantity`, `grant_amount`: suy ra từ `order_id` (người mua, gói, số lượt) và `grant_tx_id` (số tiền cấp). Bản sao chỉ có thể lệch nhau.

`receivable_payments`:

| Cột | Ghi chú |
|---|---|
| `id` | uuid |
| `receivable_id` | khoá ngoại, index |
| `gross_amount` | int VND, > 0, số tiền thật nhận từ ngân hàng (SePay `transferAmount`), không bao giờ cắt |
| `applied_amount` | int VND, >= 0 và <= `gross_amount`, phần trừ vào nợ. Chuyển dư thì `applied_amount < gross_amount`; phần dư `gross_amount − applied_amount` là tiền phải trả lại khách, tổng dư theo khoản nợ tính bằng `SUM(gross_amount − applied_amount)` |
| `bank_ref` | unique, mã giao dịch ngân hàng (SePay `id` khi tự khớp) |
| `paid_at` | thời điểm khách chuyển |
| `source` | `sepay` hoặc `manual` |
| `recorded_by` | nullable, id admin (rỗng khi `source = sepay`) |
| `created_at` | |

Ràng buộc CHECK (nếu dùng được trong convention của repo): `gross_amount > 0`, `0 <= applied_amount <= gross_amount`. `paid` = `SUM(applied_amount)`; `overpaid` = `SUM(gross_amount − applied_amount)`. Mỗi lần SePay báo tiền về ghi đúng một dòng (unique `bank_ref`), kể cả khi khoản nợ đã hết hoặc không khớp số tiền, để tiền thật không mất khỏi sổ.

`receivable_adjustments` (xoá nợ, một dòng cho mỗi sự kiện):

| Cột | Ghi chú |
|---|---|
| `id` | uuid |
| `receivable_id` | khoá ngoại, index |
| `kind` | `manual` hoặc `refund` |
| `amount` | int VND, > 0, số nợ đã xoá thực tế |
| `credits` | nullable, số lượt chưa dùng của sự kiện hoàn (chỉ `kind = refund`) |
| `idempotency_key` | unique, `refund:${eventKey}:${receivable_id}` (mỗi khoản nợ một khoá riêng cho cùng sự kiện hoàn) hoặc `manual:${requestKey}` |
| `reason` | bắt buộc |
| `created_by` | nullable |
| `created_at` | |

`receivables.code`: định dạng `CRDEBT` + 6 ký tự hex in hoa (chỉ A-Z0-9, không dấu gạch). Bắt đầu bằng `CR` để regex `CR[A-Z0-9]{6,}` của webhook SePay hiện có bắt được, và khác `CRTOPUP` của nạp ví. Ngân hàng hay bỏ ký tự đặc biệt khi chuyển, nên mã không có dấu gạch.

## Architecture

`receivables` 1—N `receivable_payments`; `receivables` 1—N `receivable_adjustments`; `receivables` N—1 (tuỳ chọn) `cases`; `receivables` 1—1 (tuỳ chọn) `orders` qua `order_id`; `receivables` 1—1 (tuỳ chọn) `wallet_transactions` qua `grant_tx_id`.

Chỉ mục ngoài các unique ở trên: `receivables(case_id)` (tìm khoản nợ khi hoàn tiền), `receivables(due_at)` (lọc quá hạn), `receivable_payments(receivable_id)`, `receivable_adjustments(receivable_id)`. Không có cột trạng thái, `paid`, `outstanding`: tính từ `SUM(receivable_payments.applied_amount)` và `SUM(receivable_adjustments.amount)`.

## Related Code Files

Sửa: `prisma/schema.prisma` (thêm ba model, quan hệ ngược tối thiểu).
Tạo: thư mục migration mới sinh bởi `--create-only`.
Xoá: không.

## Implementation Steps

1. **Trước mọi lệnh**: kiểm `DATABASE_URL`/`DIRECT_URL` trỏ đâu mà không in giá trị; nếu không phải localhost/Docker `db` thì dừng, không chạy Prisma mutation.
2. Giải thích plan thay đổi cho user, xin xác nhận (theo Interactive Safety Protocol).
3. Sửa `schema.prisma`, `prisma validate`, `prisma format`.
4. `prisma migrate dev --create-only` chỉ trên DB local. Đọc SQL sinh ra: phải chỉ có `CREATE TABLE`, `CREATE INDEX`, `ADD CONSTRAINT` trên bảng mới; **không** có `DROP`/`ALTER` bảng cũ.
5. Áp migration lên DB local, chạy smoke. Không chạy `migrate reset`/`db push`.
6. `prisma generate`.

## Todo

- [ ] Kiểm host DB, xin xác nhận
- [ ] Sửa schema
- [ ] Tạo migration `--create-only`, đọc SQL
- [ ] Áp lên DB local
- [ ] `prisma generate`

## Success Criteria

- SQL migration chỉ tạo bảng mới.
- Local: tạo, đọc, vi phạm unique (`code`, `request_key`, `bank_ref`, `grant_tx_id`, `idempotency_key`) bị từ chối.
- `check-types` xanh sau `generate`.

## Risk Assessment

- Thay đổi enum `type` nếu thiếu `adjustment`: rủi ro cao hơn, tách thành bước riêng, xin xác nhận riêng.
- Migration chạy nhầm lên prod: không có lệnh nào agent chạy trên prod; checklist prod ở phase 5.

## Security Considerations

- Không in/echo chuỗi kết nối. Không lệnh phá huỷ. Không xoá hàng, thiết kế không có đường xoá `receivables`.

## Next Steps

Phase 3.
