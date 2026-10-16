# Phase 4: UI admin

## Context Links

- [Phase 3](./phase-03-backend-receivables.md)
- `apps/web-1/AGENTS.md` (đọc trước khi sửa web-1), `design-system/wording/`
- Mẫu: `apps/web-1/app/admin/hooks/useAdminUsers.ts`, `apps/web-1/app/admin/_components/CreateUserModal.tsx`

## Overview

- Priority: P2.
- Status: Pending, chờ phase 3.
- Trang admin "Khoản ứng nợ": danh sách, tạo nợ (kèm "mua lượt hộ" tuỳ chọn), ghi thanh toán, xoá nợ.

## Key Insights

- Admin Desktop-only (`DesktopOnlyNotice`), không thêm layout mobile.
- Hook chứa mutation/`apiClient`; component không gọi `apiClient`, không try/catch.
- Mantine v9 + Lucide, không shadow trên Card/Paper, không class Tailwind định vị đè Modal.

## Requirements

- Hooks trong `apps/web-1/app/admin/hooks/`: `useReceivables` (danh sách + lọc trạng thái), `useCreateReceivable`, `useReceivablePaymentInfo`, `useRecordReceivablePayment`, `useWriteOffReceivable`. Dùng schema zod từ `packages/validation`; invalidate danh sách và số dư ví khi thành công. Danh sách làm mới định kỳ (như `useMyDeposits`, `refetchInterval`) để thấy thanh toán tự khớp từ SePay.
- Danh sách: mã nợ, khách, liên hệ, case, phải thu, đã thu, còn nợ, hạn, trạng thái (badge). Dòng tổng: tổng đang nợ, số khoản quá hạn.
- Modal tạo nợ: tên/liên hệ khách, số tiền phải thu, hạn trả; mục "Mua lượt hộ" (tuỳ chọn). Khi bật mục này, **bắt buộc chọn case và gói ngay trong modal** (một bước, không tách `fundReceivable`): (a) chọn người nhận ví (mặc định tài trợ cho tài khoản vận hành), (b) chọn case từ danh sách case thuộc người nhận đó, (c) chọn gói từ danh sách gói đang bán (dùng lại endpoint danh sách gói có sẵn `listPackagesUseCase`; hiển thị tên loại như "Chấm bài Ý tưởng" hoặc "Chấm bài Thị trường", giá, số lượt mỗi gói), (d) số lượng gói. Hiển thị giá đơn và tổng số lượt để xác nhận; `amountDue` tự điền bằng giá đơn, chỉnh được, không thấp hơn. Danh sách case theo chủ sở hữu dùng endpoint có sẵn nếu phase 1 mục 19 xác nhận có; thiếu thì thêm `GET admin/cases?ownerId=` chỉ đọc. Nút xác nhận khoá khi chưa chọn đủ case và gói. Không có ô nhập số tiền cấp. **`requestKey` là một UUID ổn định cho cả lần nhập form**: sinh khi mở modal, giữ nguyên khi bấm đôi, khi timeout rồi thử lại và khi sửa case, gói hay số lượng. Chỉ sinh key mới sau khi tạo thành công hoặc đóng và mở lại modal. Đổi key theo từng trường sẽ biến retry sau timeout (không biết lần trước đã ghi chưa) thành khoản nợ và đơn thứ hai. Backend tự xử lý: key trùng và dữ liệu giống thì trả bản ghi cũ; key trùng mà dữ liệu khác thì 409; key chưa ghi gì (lần trước lỗi và đã rollback) thì tạo bình thường.
- **Dùng lại chính trang payment (`/dashboard/payment`) cho khoản nợ.** Hiện `page.tsx` là trang chi tiết nạp tiền (`?pid=`, poll 5 giây, huy hiệu trạng thái, `PaymentDepositMeta`, `PaymentBankInfo`, bằng chứng, đường quay lại ví). Tách phần giao diện chung thành `PaymentView` (header + huy hiệu + lời giải thích + meta + QR/ngân hàng + khe `children` cho phần riêng của nạp tiền: bằng chứng, tải bằng chứng, nút nạp lại), để `dashboard/payment/page.tsx` bọc `PaymentView` giữ **nguyên hành vi** nạp tiền (mục tiêu hồi quy). Khách chưa có tài khoản và `/dashboard/*` bị `proxy.ts` chặn khi chưa đăng nhập, nên khoản nợ mở ở **route công khai** `apps/web-1/app/pay/[token]/page.tsx` (ngoài `/dashboard`, không cần phiên), dùng cùng `PaymentView`, `PaymentBankInfo`, cùng kiểu poll 5 giây (khách thấy huy hiệu chuyển "đã thanh toán" khi webhook ghi). Không có khe bằng chứng, không có nút quay lại ví.
- Chỉnh các component dùng chung bằng prop có mặc định, không đổi hành vi nạp tiền: `PaymentBankInfo` thêm `qrAlt`; `PaymentDepositMeta` có chữ "Nạp tiền" cứng trong `WALLET_COPY.depositActivityText` nên thêm prop `activityText` (mặc định giữ chữ cũ) và `transferContent` nhận mã `CRDEBT…`. Thêm ánh xạ trạng thái nợ sang huy hiệu cùng bộ lớp màu hiện có (như `getDepositDisplay`): `open`/`partial`/`overdue` hiển thị chờ thanh toán, `settled` đã thanh toán, `written_off` đã đóng. Từ ngữ khách thấy theo `design-system/wording/`, không nhắc CP1/CP2, không lộ thông tin nội bộ.
- Bảo mật trang công khai: `robots: noindex`, `Referrer-Policy: no-referrer` (token nằm trong URL), không ghi token vào log, bố cục tối giản không có điều hướng dashboard.
- **Panel trong admin:** chi tiết khoản nợ có nút **"Tạo link thanh toán"** (gọi `POST admin/receivables/:id/payment-link`, hiện link một lần kèm nút sao chép và cảnh báo "link chỉ hiển thị lúc này"). Khi đã có link, nút đổi thành **"Tạo link mới"** (xoay, link cũ chết, có xác nhận). Nút sao chép mã `CRDEBT…` và số còn nợ luôn có. Admin dùng nút này sau khi chạy xong đánh giá, đúng lúc gửi link cho khách qua Zalo; làm mới trang không làm mất khả năng gửi vì tạo link mới được.
- Modal ghi thanh toán tay (dự phòng khi webhook không khớp): số tiền, mã giao dịch ngân hàng, thời điểm. Khoản `needs_review` hiện cờ và lý do. Modal xoá nợ: số tiền, lý do bắt buộc, cảnh báo không hoàn tác.
- Từ ngữ tiếng Việt, không nhắc CP1/CP2.

## Architecture

Trang admin → danh sách (`useReceivables`) → các modal → hook mutation → endpoint phase 3 → invalidate.

## Related Code Files

Sửa: điều hướng admin (thêm mục), nơi khai báo route/trang admin theo mẫu.
Tạo: trang `apps/web-1/app/admin/receivables/page.tsx`, các component danh sách và modal (mỗi file dưới 200 dòng), 4 hook.
Xoá: không.

## Implementation Steps

1. Đọc `apps/web-1/AGENTS.md`, `design-system/wording/`.
2. Tạo hook, rồi danh sách, rồi các modal theo mẫu `CreateUserModal`.
3. Thêm mục điều hướng admin và trang.
4. `bun run lint`, `bun run check-types`.

## Todo

- [ ] 4 hook
- [ ] Danh sách + dòng tổng
- [ ] Modal tạo nợ (+ cấp ví)
- [ ] Modal ghi thanh toán, modal xoá nợ
- [ ] Điều hướng admin
- [ ] Lint, check-types, smoke trình duyệt local

## Success Criteria

Smoke trên local: tạo nợ kèm mua hộ, thấy case nhận đúng số lượt, ví người nhận không đổi và có hai dòng lịch sử (cấp "Hệ thống tặng thưởng" và "Mua gói đánh giá"); ghi hai lần thanh toán (một phần, rồi phần còn lại) thì trạng thái chuyển `partial` rồi `settled`; ghi quá số còn nợ bị chặn với thông báo rõ; bấm xác nhận hai lần liên tiếp không tạo hai khoản nợ.

## Risk Assessment

- Gõ thừa số 0 ở số tiền cấp: backend giới hạn `GRANT_MAX_VND`, modal hiển thị số tiền định dạng để xác nhận.
- Dữ liệu danh sách cũ: invalidate sau mỗi mutation.

## Security Considerations

- Quyền thật nằm ở backend; UI chỉ là tiện lợi. Không lưu thông tin khách trong storage trình duyệt.

## Next Steps

Phase 5.
