# Phase 5: Docs, runbook, bàn giao prod

## Context Links

- [Phase 3](./phase-03-backend-receivables.md)
- `CHANGELOG.md`, `docs/system-architecture.md`, `docs/vps-deployment-guide.md`, `docs/db-migration-guide.md`
- `.agents/rules/documentation-management.md`, `.agents/rules/prisma-migration-safety.md`

## Overview

- Priority: P2.
- Status: Pending, chờ phase 3 (song song với phase 4).
- Ghi thay đổi, quy trình vận hành pay-later, checklist bàn giao prod. Agent không chạm prod.

## Key Insights

- Migration prod là bước riêng, do user chạy ngoài agent, sau khi deploy code theo quy trình bình thường.
- Chạy đúng thứ tự: backup/ kiểm trước, áp migration, rồi mới bật chức năng.

## Requirements

- `CHANGELOG.md`: mục mới cho receivables và cấp ví.
- `docs/system-architecture.md`: thêm ba bảng (`receivables`, `receivable_payments`, `receivable_adjustments`), `WalletService.grant`, giao dịch `adjustment`/`platform_bonus`, nêu rõ không đi qua `deposit` và không có endpoint cấp ví đứng riêng.
- `docs/pay-later-runbook.md` (tạo mới): luồng vận hành (nhận tài liệu qua Zalo → **tạo case dưới tài khoản vận hành và nhập tài liệu** → tạo nợ kèm mua lượt hộ, chọn case và gói ngay lúc tạo → chạy đánh giá → gửi tóm tắt → bấm "Tạo link thanh toán" và gửi link `/pay/<token>` cho khách qua Zalo; khách mở trang thanh toán dùng lại giao diện trang payment, quét QR, nội dung chuyển khoản là mã `CRDEBT…` → webhook SePay tự ghi thanh toán và trang tự chuyển trạng thái, nhập tay chỉ khi không khớp), quy tắc (không có số tiền cấp tự do; phải có case trước khi tạo nợ kèm mua hộ; link là bí mật, không đăng công khai; thanh toán nợ không tạo `Deposit` và không cộng ví; khách phải giữ nguyên mã `CRDEBT…`), cách xử lý chuyển thiếu, chuyển dư (`needs_review`, hoàn lại khách), xoá nợ, **nghi lộ link hoặc mất link thì tạo link mới** (link cũ chết), và việc che token trong log truy cập.
- Checklist prod (user thực hiện): đọc SQL migration, xác nhận chỉ `CREATE`; theo `docs/db-backup-guide.md` backup trước; áp migration; deploy; tạo một khoản nợ thử với đơn nhỏ, kiểm lịch sử ví, đơn, danh sách nợ; rồi mới dùng thật.

## Related Code Files

Sửa: `CHANGELOG.md`, `docs/system-architecture.md`.
Tạo: `docs/pay-later-runbook.md`.
Xoá: không.

## Implementation Steps

1. Đọc `CHANGELOG.md`, `docs/system-architecture.md` hiện tại.
2. Viết runbook và checklist prod; đánh dấu bước nào do người thực hiện.
3. Cập nhật status phase trong `plan.md` khi xong.

## Todo

- [ ] CHANGELOG
- [ ] system-architecture
- [ ] `docs/pay-later-runbook.md`
- [ ] Checklist prod
- [ ] Cập nhật status plan

## Success Criteria

- Người chưa đọc code vẫn làm đúng luồng chỉ bằng runbook.
- Checklist nêu rõ: migration chỉ tạo bảng, ai chạy, backup trước, kiểm sau.

## Risk Assessment

- Runbook lệch hành vi thật: viết sau khi phase 3 và smoke xong.
- Quên backup trước migration: checklist ghi bước này ở đầu.

## Security Considerations

- Không ghi chuỗi kết nối DB, mật khẩu, hoặc dữ liệu khách thật vào tài liệu.

## Next Steps

Sau khi xong, đánh giá có cần giao diện khách xem công nợ không (ngoài phạm vi).
