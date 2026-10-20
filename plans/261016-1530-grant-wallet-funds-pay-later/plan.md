---
title: "Khoản ứng nợ (receivables) + cấp ví vận hành: làm trước, thu tiền sau"
description: "Ba bảng receivables, receivable_payments, receivable_adjustments trong DB; tạo khoản nợ và cấp VND vào ví vận hành trong cùng một transaction; ghi thanh toán một phần, xoá nợ có lý do."
status: completed
priority: P2
effort: 32h
tags: [wallet, receivables, admin, pay-later, api, prisma]
blockedBy: []
blocks: []
created: 2026-10-16
---

# Khoản ứng nợ + cấp ví vận hành

Nguồn thiết kế: [brainstorm report](../reports/261016-brainstorm-pay-later-receivable-and-grant-wallet-funds.md).

## Vấn đề

Khách Zalo gửi tài liệu, vận hành chạy đánh giá trước rồi mới gửi QR. Ví vận hành thiếu tiền. Khách không mua credit. Cần: (1) cách có VND trong ví để chạy case, (2) sổ nợ gắn chặt với khoản cấp đó để không có khoản cấp mồ côi.

## Quyết định đã chốt

- **Nợ nằm trong DB cùng feature.** Khoản nợ là lý do nghiệp vụ để tạo giá trị ví. Để nợ ở Sheet thì không chặn được cấp mồ côi.
- **Không có endpoint cấp ví đứng riêng, và không cấp số tiền tự do.** Chỉ có `createReceivable`. Khi có "mua lượt hộ", đầu vào là `packageId + quantity + caseId` (khớp `createOrderUseCase`); số cấp **do giá đơn quyết định**, không do người dùng nhập. Một transaction: tạo nợ → cấp VND bằng đúng giá đơn → tạo đơn và trả bằng ví (`walletService.withdraw`, `type: withdrawal`, `source_type: order`) → ghi `creditLedger` purchase. Ví tăng rồi giảm bằng nhau.
- Cấp VND: `WalletService.grant` mới, `type: adjustment`, `source_type: platform_bonus`, `source_id: receivable.id`. Không dùng `deposit` (hardcode `type: 'deposit'`, 3 caller: `sepay-webhook`, `verify-deposit`, `refund`).
- Ba bảng cộng thêm, plural snake_case: `receivables`, `receivable_payments`, `receivable_adjustments`. Không sửa/xoá bảng cũ. Thanh toán một phần và `bank_ref` duy nhất cần bảng thanh toán riêng; mỗi sự kiện xoá nợ là một dòng ledger riêng (có `idempotency_key` unique) để tính lũy kế và chống xoá hai lần.
- Còn nợ và trạng thái **tính từ dữ liệu** (`receivable_payments`, `receivable_adjustments`), không lưu cột chỉnh tay. Xoá nợ là dòng ledger có lý do (`manual` hoặc `refund`). Không xoá hàng.
- Chống tạo đôi khi bấm hai lần: `request_key` (UUID từ client) unique trên `receivables`; khoá idempotency của cấp ví là `grant:${request_key}`.
- Tiền khách trả là chuyển khoản ngân hàng, ghi nhận bằng `receivable_payments`. Không cấp credit mới cho khách.
- **Dùng lại chính trang payment, không dùng lại `Deposit`.** Tách phần giao diện chung của `apps/web-1/app/dashboard/payment/page.tsx` thành `PaymentView` (giữ nguyên hành vi nạp tiền, có hồi quy), rồi dùng lại ở route công khai `/pay/[token]` cho khoản nợ (khách Zalo chưa có tài khoản và `/dashboard/*` bị `proxy.ts` chặn khi chưa đăng nhập). Dữ liệu QR dùng `getDepositBankInfo(code, còn nợ)` có sẵn; trạng thái trang theo dõi webhook SePay. Mã nợ `CRDEBT` + 6 hex in hoa (bắt đầu `CR` để regex webhook bắt được; nạp ví hiện dùng `CRTOPUP` + 6 hex, `create-deposit.usecase.ts:L12-18`; phase 1 mục 16 kiểm trùng). Webhook có nhánh riêng cho `CRDEBT`: ghi `receivable_payments` với `gross_amount` (tiền thật từ ngân hàng) và `applied_amount` (phần trừ nợ); chuyển dư thì phần dư nằm lại trong sổ, đặt `review_reason` để hoàn khách; **không** gọi `walletService.deposit`. Dùng `Deposit` sẽ cộng VND thật vào ví người trả, phá lập luận "khách không mua credit" và làm lệch doanh thu. Link công khai dùng `public_token` ngẫu nhiên 32 byte, DTO tối thiểu không lộ thông tin khách.
- Khách chưa có tài khoản: lưu `customer_name`, `customer_contact` dạng chữ, không khoá ngoại tới `user`.
- **Gắn nguồn gốc bằng `receivables.order_id`** (FK nullable, unique, tới `orders`) và `grant_tx_id`. Không sửa bảng `orders`. Báo cáo doanh thu theo đơn loại các đơn có trong `receivables.order_id` ra khỏi doanh thu thường; tiền thật thu được thể hiện qua `receivable_payments`. Mức loại trừ chính xác chốt ở phase 1.
- **Cổng chặn (đã xác minh một phần):** `createOrderUseCase` tự mở `prisma.$transaction` (`create-order.usecase.ts:L83`), nên **không** chạy được trong transaction của bên gọi. Phase 3 bắt đầu bằng refactor tách `createOrderInTx(tx, userId, request)` (thân dòng 84–239), `createOrderUseCase` gọi lại nó; xử lý P2002 replay giữ ngoài transaction. Không lùi về cấp VND số tự do.
- **Phạm vi của bất biến "không trộn lô" là `(case_id, service_type_id)`**, vì số dư lượt và FIFO hoàn tiền đều tính theo từng loại. Một case có thể có lượt CP1 tài trợ và lượt CP2 mua thật mà không trộn lô.
- **Hoàn tiền không được trả lại tiền tặng và không để nợ mở cho dịch vụ đã huỷ.** Đơn tài trợ ghi `price_per_credit: 0` nên mọi đường hoàn (FIFO theo `creditLedger.metadata_json.price_per_credit`) hoàn 0đ cho lượt đó. Vì 0đ làm hoàn sai khi trộn với lượt mua thật, **case tài trợ không bao giờ nhận lượt mua thật** (kiểm cứng trong `createOrderInTx`, khoá hàng case, 409 hai chiều). Mọi đường hoàn/huỷ (`refundRemainingCreditInTx`, `refundCaseAllInTx`, xoá case, `admin_veto` L102-103 hoàn thẳng `lockedPrice`) tự xoá nợ tỷ lệ theo lượt chưa dùng trong cùng transaction.
- **Xoá nợ khi hoàn tiền phân bổ theo từng lô, tính lũy kế riêng cho từng khoản nợ**: lượt chưa dùng gán cho lô mới nhất trước (cùng thứ tự `planServiceRefund`), mỗi khoản nợ ghi `target − tổngĐãXoáDoHoàn` với `target = round(amount_due × tổngLượtĐãHoànCủaNó / creditsGranted)`. Không tra khoản nợ chỉ bằng `(case, loại dịch vụ)` vì một cặp có thể có nhiều lô tài trợ. Hoàn hết thì tổng mỗi khoản đúng `amount_due`; trùng sự kiện thì unique `idempotency_key` (`refund:${eventKey}:${receivable_id}`) chặn xoá lần hai.
- **Một bước duy nhất, không tách `fundReceivable`.** Khi có `purchase`, `createReceivable` đòi sẵn `caseId` và `packageId` ngay lúc tạo; case phải tồn tại trước và thuộc người nhận ví (tài khoản vận hành). Không có trạng thái "nợ chưa tài trợ". Lỗi ở bước mua thì không còn nợ, không còn giao dịch cấp; sửa dữ liệu rồi tạo lại với cùng `requestKey`. UI chọn case và gói từ danh sách, không gõ id; `amountDue` điền sẵn bằng giá đơn, chỉnh được nhưng không thấp hơn. Khoản nợ thuần (không `purchase`) vẫn tạo được để chỉ ghi sổ, không cấp ví. Đã cân nhắc và bỏ phương án tách hai bước (ghi nợ trước, mua hộ sau): thêm trạng thái dễ bị quên, thêm endpoint và khoá idempotency, mà chỉ có một người vận hành.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [Xác nhận bất biến ví và schema (chỉ đọc)](./phase-01-confirm-wallet-invariants.md) | Done |
| 2 | [Schema receivables + migration cộng thêm](./phase-02-receivables-schema.md) | Done (migration `20261016160000_receivables_pay_later`, `20261016180000_receivable_debtor_snapshot`) |
| 3 | [Backend: tạo nợ + cấp ví, ghi thanh toán, xoá nợ, danh sách](./phase-03-backend-receivables.md) | Done |
| 4 | [UI admin](./phase-04-admin-ui.md) | Done |
| 5 | [Docs, runbook, bàn giao prod](./phase-05-docs-runbook-prod.md) | Done |


## Trạng thái triển khai (2026-10-16)

- Code: `apps/api/src/modules/receivables/`, `orders/application/order-in-tx.ts` + `funded-lot.guard.ts`, hook hoàn tiền trong `services/credit-refund.ts` và `case-transition.service.ts`, nhánh `CRDEBT` trong `sepay-webhook.usecase.ts`, `packages/validation/src/receivables.ts`, web `app/admin/receivables`, `app/pay/[token]`, `PaymentView`.
- Migration đã tạo trong `prisma/migrations/` (`20261016160000_receivables_pay_later`, `20261016180000_receivable_debtor_snapshot`); [migration-preview.sql](./migration-preview.sql) là bản xem trước sinh offline ban đầu.
- Lệch so với plan: (1) `amount` của `receivable_adjustments` cho phép 0 (`CHECK >= 0`) để dòng hoàn luôn ghi được số lượt và làm tròn lũy kế đúng; xoá tay vẫn bắt `> 0` ở API. (2) Body/response API dùng snake_case theo quy ước repo (`request_key`, `amount_due`, ...). (3) Thêm quy tắc: không cấp tài trợ vào cặp (case, loại dịch vụ) đã từng hoàn lượt (409), vì khoá idempotency hoàn tiền hiện có là vĩnh viễn theo cặp. (4) `refundCredit` (admin_veto, hiện không transition nào dùng) với CP1 tài trợ đi qua `refundRemainingCreditInTx` thay vì hoàn `lockedPrice`.
- Chưa kiểm chứng (cần Postgres thật): tính nguyên tử qua rollback transaction thật, khoá hàng `FOR UPDATE` khi hai request đồng thời, migration, smoke UI, cấu hình che token ở reverse proxy/Next, SePay gửi `CRDEBT…` qua ngân hàng thật.
- Suite API chạy bằng `bun test` (tsx không chạy được ở WSL vì esbuild Windows). Có sẵn ~16 test lỗi không liên quan (Redis/Typst/nguồn tĩnh).
## Dependencies

- Phase 2 chờ phase 1 (enum `adjustment` có trong `type` không; nếu thiếu thì migration có thêm thay đổi enum, phải xin xác nhận riêng).
- Phase 3 chờ phase 2. Phase 4 và 5 chờ phase 3, làm song song được.
- Không phụ thuộc plan `261012-worker-jobspec`.

## Ràng buộc

- Mọi lệnh DB/Prisma xin xác nhận từng bước (`.agents/rules/prisma-migration-safety.md`). Agent chỉ `migrate dev --create-only` trên DB local; áp migration lên prod do user chạy ngoài agent.
- Mantine v9, Lucide, TanStack Query qua hook, admin Desktop-only, file dưới 200 dòng.
