# Research: thống nhất thanh toán dịch vụ CP1-4 + dịch vụ tương lai (2026-10-10)

## Bối cảnh (từ code)
- Tiền: `UserWallet` theo user, 1 VND nạp = 1 VND ví. `walletService.withdraw/refund/deposit`, idempotency key.
- Lượt chấm: `CreditLedger` theo `case_id`, không phân loại. Số dư = SUM(amount) theo case.
- Mua: `createOrderUseCase` chỉ nhận `service_type` thuộc `ALL_CREDIT_AUDIT_SERVICES` (hằng chuỗi). Rút ví -> ghi credit -> outbox `ORDER_PAID`.
- Nợ có sẵn:
  - Hàm tính số dư bị lặp ~9 chỗ: `credit-ledger.repository.ts`, `credit-audit-order.helpers.ts`, `case-transition.service.ts` (x2), `credit-refund.ts` (x2), `payment.repository.ts`, `purchase-credits.usecase.ts`, `get-case-detail.usecase.ts:154`.
  - Magic value trong `create-order.usecase.ts:140-145`: `unitPrice === 79000`, `pkg_ai_audit`, `pkg_tf_audit`.
- Đóng case: credit còn lại refund FIFO về ví (`refundRemainingCreditInTx`).
- Quyết định user: CP1-4 cùng 1 case. CP1 có thể nhiều idea (2-3).

## Mẫu ngoài ngành
Stripe Billing: 1 số dư tiền + *credit grant* có `applicability_config` giới hạn grant dùng cho price nào; balance summary lọc theo applicability.
- https://docs.stripe.com/api/billing/credit-grant/object
- https://docs.stripe.com/changelog/acacia/2025-02-24/billing-credits-price-level-applicability
Mẫu chung (Orb blocks, Lago wallets): ví tiền trả trước + quyền dùng (entitlement) theo sản phẩm.
- https://usagebox.com/articles/prepaid-credits-usage-based-billing-drawdown-expiry

## Phương án

| | A. Trừ ví mỗi lượt, bỏ credit | B. Credit chung, CP đắt tiêu nhiều credit | C. Credit có phạm vi `service_code` (khuyến nghị) |
|---|---|---|---|
| Ý tưởng | Bấm chấm = rút tiền ví ngay | 1 pool/case; CP2 audit = 2 credit | Ví = tiền duy nhất; mỗi gói cấp credit cho đúng 1 dịch vụ |
| Schema | Bỏ dần `CreditLedger` | Không đổi | +1 cột `service_code` + index |
| Gói combo (gói nhiều lượt, vd CP1 79k = 2 lượt hiện tại) | Mất, hoặc phải làm giảm giá riêng | Giữ | Giữ (`credits_granted`) |
| Tiêu lẫn CP1/CP2 | Không có khái niệm | Có, ngầm | Không thể |
| Refund FIFO khi đóng case | Không cần | Sai lệch vì credit khác giá | Đúng, theo từng `service_code` |
| Thêm dịch vụ mới | Thêm giá + điểm trừ tiền | Phải quy đổi ra credit | +1 dòng gói, +1 `service_code` |
| Rủi ro chuyển đổi | Cao: viết lại CP1 đang chạy, gate transition, refund | Thấp lúc đầu, nợ về sau | Trung bình: gom 9 chỗ tính số dư về 1 hàm |

## Khuyến nghị: C
- Bảng: `CreditLedger.service_type_id` FK -> `ServiceType` (đã có `code` unique), `@@index([case_id, service_type_id])`. Backfill dòng cũ -> ServiceType CP1 audit. Migration chỉ `--create-only`.
- Không thêm chuỗi `service_code` song song: `ServiceType.code` là nguồn duy nhất. Dịch vụ không theo checkpoint (debate, mentor) vẫn là 1 ServiceType.
- Gói = SKU: `ServicePackage.service_type_id` (đã có) + cột typed mới `credits_granted Int`. Không nhét vào `features` JSON. Order item gửi `package_id`; giá đọc từ `ServicePricing`. Bỏ hằng `ALL_CREDIT_AUDIT_SERVICES` và magic `79000`.
- Một hàm duy nhất `getCreditBalance(tx, caseId, serviceTypeId)`; mọi caller dùng nó.
- Tiêu: audit CP2 trừ 1 credit của ServiceType CP2 audit. Hết credit -> 402 như hiện tại.
- Refund FIFO: lặp theo từng `service_type_id`.
- UI: hiển thị số lượt còn theo từng dịch vụ.

## Mở rộng sau (độ khó trên C)
- Khuyến mãi: dễ, nhưng refund hiện tại có bẫy. `refundRemainingCreditInTx` lấy SUM toàn bộ số dư rồi phân bổ FIFO chỉ trên dòng `type: purchase`. Lượt tặng ghi `type: promo` sẽ bị định giá theo giá lượt đã mua -> hoàn tiền thật cho lượt miễn phí. Và `resolvePurchaseUnitPrice` bỏ qua giá 0 ở bước 1-3, rơi xuống bước 4 đọc `OrderItem.unit_price` (giá niêm yết) -> cũng hoàn tiền thật. Cách đúng: lượt tặng đi qua order như mua bình thường, `OrderItem.unit_price`/`amount` = giá sau giảm (0), và resolver coi giá 0 là hợp lệ (dùng `!== undefined`, không `> 0`). Thêm test: đổi mã 100% rồi đóng case -> hoàn 0đ.
- Mở khóa 1 lần: dễ. Grant 1 dòng, không bao giờ tiêu; kiểm tra "có grant". Cần cờ trên ServiceType để refund bỏ qua loại này.
- Combo nhiều dịch vụ: vừa. Bảng `PackageGrant(package_id, service_type_id, credits)` thay cột `credits_granted` (tạo bảng, backfill, bỏ cột sau). Cần luật chia giá combo cho từng dịch vụ để refund đúng: quyết định kinh doanh.
- Hạn dùng: khó nhất. Số dư không còn là SUM; phải trừ theo từng grant (FIFO) và loại grant hết hạn. Làm được vì đã có 1 hàm số dư + logic FIFO trong `credit-refund.ts`, nhưng là thay đổi thật.

## Quyết định (2026-10-10)
- CP2: 1 ServiceType + 1 gói; lượt dùng chung cho chấm bảng hỏi phỏng vấn và chấm toàn bộ CP2 (2 vòng).
- Chi phí token không là ràng buộc giá (subscription + model rẻ).
- Lượt tặng = mã giảm giá 100%, team tự tạo và phát.

## Mã giảm giá (tối thiểu)
- `DiscountCode`: `code` unique (chuẩn hóa in hoa), `percent_off Int` 1-100, `service_type_id` FK (mã chỉ áp cho 1 dịch vụ), `max_redemptions Int?`, `redeemed_count Int`, `expires_at?`, `is_active`, `created_by`.
- `DiscountRedemption`: `code_id`, `user_id`, `order_id` unique, `@@unique([code_id, user_id])` (1 người dùng 1 lần).
- Đổi mã trong cùng transaction tạo order. `max_redemptions` null = không giới hạn -> tăng đếm vô điều kiện. Có giới hạn -> `updateMany where { id, redeemed_count: { lt: prisma.discountCode.fields.max_redemptions } }`; 0 dòng -> hết lượt. (Không so `< NULL`: SQL trả unknown, mã không giới hạn sẽ luôn báo hết.) Test cả 2 nhánh. Giá tính ở server, client chỉ gửi chuỗi mã.
- Tổng 0đ: bỏ bước rút ví. `Order.metadata_json` giữ giá niêm yết + mã.
- Tạo mã: endpoint admin + form trong trang admin (không chạy script vào DB prod).

## Câu hỏi còn mở
- CP1 nhiều idea trong 1 case: làm sau CP2 (user chốt).
- Giá gói CP2: 79k (user chốt). Số lượt mặc định 4 (bảng hỏi + chấm toàn bộ 2 vòng + dư 1), là giá trị seed `credits_granted`, đổi được.
