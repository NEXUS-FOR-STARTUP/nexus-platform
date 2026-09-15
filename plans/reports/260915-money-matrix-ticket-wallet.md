# Ma trận tiền vé + ví — 3 kiến trúc chồng nhau (HEAD 1c164dc)

- **Ngày:** 2026-09-15. **Phạm vi:** thanh toán/gói/ví/order/deposit/credit trên HEAD.
- **Kết luận 1 dòng:** Bug T1/A/T3-4 không phải lỗi logic đơn lẻ mà là rác lịch sử của 3 kiến trúc sống chung: K1 mua-gói, K2 credit-lẻ, K3 ví+order. Quyết định: giữ model **vé + ví** (ví VND là source of truth của TIỀN, ledger là source of truth của LƯỢT).
- **Scout:** LedgerWriters, WalletWriters, KeyFormats, ArchLayers (4/4 xong, file:line đã kiểm chứng).
- **Status sau commit `a0ba854` (2026-09-15, `chore: cutover legacy 39k Q1-Q6`):** Q1 FIXED (xóa `LEGACY_AUDIT_PACKAGE_KEY`); Q2 FIXED (xóa `AUDIT`/`LEGACY_AUDIT` ở `web-1/lib/pricing.ts`); Q3 FIXED (comment → `pkg_ai_audit`); Q4 FIXED (docstring → `:reportId/download`); Q5 FIXED FE-only (`RoundCard.tsx:58-60` fallback `|| "initial"`, `types/case.ts:124` union `| null`, BE giữ null truthful — xem report PR37 Thread 6); Q6 FIXED (docs → 79k = 2 credits). Còn mở toàn bộ ma trận: M1-M5, U1-U5, R1, D1-D3 + 6 luật vé+ví (§6). §5 vẫn đúng (hardcode 39k ở `payment.repo:184`, tests, seeds chưa đụng).

## 0. Định nghĩa (cho người chưa biết gì)

- **Ví (`UserWallet` + `WalletTransaction`, schema:187-220):** két VND per-user. Mỗi biến động ghi 1 row `balance_before/after`. Có `SELECT FOR UPDATE` chống double-spend — nhưng chỉ hiệu lực trong cùng 1 transaction.
- **Ledger (`CreditLedger`, schema:637-653):** sổ vé per-case. Row `+N` mua vé, `-1` xé vé. Balance = `SUM(amount)`. Không có lock nào; mọi đường ghi đều `SUM` rồi tự tính `balance_after` bằng tay.
- **Gãy atomicity (nested-tx giả):** Prisma không có transaction lồng. Caller mở outer tx, gọi `walletService.*` lại tự mở inner tx → inner commit độc lập, outer rollback không kéo ví về. Kết quả: tiền trừ rồi, vé chưa có (hoặc ngược lại).
- **Idempotency key:** mã chống làm 2 lần. Cùng key + unique = lần 2 bị chặn. Hai đường khác format key thì không chặn được nhau.

## 1. Ba kiến trúc còn sống chung

| Lớp | Đại diện | Trạng thái |
|---|---|---|
| K1 mua-gói | `Case.package_id/locked_price/payment_status` (schema:315-358), `case-machine` guard `hasPaymentComplete`, `payments/*`, `purchase-credits.usecase` | `@deprecated`, routes 410, nhưng `verifyPayment` vẫn ghi ledger khi `USE_ORDER_DOMAIN≠true`; `DUAL_WRITE_PAYMENT` ghi thêm row `payments` |
| K2 credit-lẻ | `CreditLedger` SUM, `case-transition` actions `subtractCredit`/`refundCredit`, `credit-refund.ts` | Live, là tàn dư thủ công |
| K3 ví+order+deposit | `UserWallet/Deposit/Order/Outbox`, `create-order.usecase`, `verify-deposit`, `sepay-webhook`, listener `ORDER_PAID` (`credit_audit` auto / `credit_audit_manual` cho user tự bấm) | Hiện hành |

Tiền chảy K3: Deposit → ví → Order (withdraw VND + ledger +vé, link `order_id`) → trigger (xé vé) → cancel/đóng (hoàn).

## 2. 7 đường ghi ledger (vé) — không đường nào lock

| # | File:line | Live? | Amount | Ghi chú |
|---|---|---|---|---|
| W1 trigger | `omp-audit-coordinator:308-321` | Live | `-1` | Guard `queued/processing` ngoài tx (TOCTOU), key mới mỗi lần |
| W2 refund hệ thống | `omp-audit-coordinator:50-76` | Live | `+1` | Check report ngoài tx; không gọi cho cancel/duplicate |
| W3 order mua | `create-order:148-159` | Live (chính) | `+creditsGranted` | `features.credits_granted × qty`, fallback hardcode 79k |
| W4 verify cũ | `payment.repository:177-204` | Chỉ khi `USE_ORDER_DOMAIN≠true` | meta quantity hoặc `amount/39000` | K1, có thể cộng chồng với W3 |
| W5 trừ tay | `case-transition:104-129` | Live (tàn dư) | `-1`, key `consume-unit-case` | Cùng 1 audit với W1 = trừ 2 lần, key không dedup chéo |
| W6 hoàn FIFO | `credit-refund:54-136` | Live | `-balance` về 0, nối ví duy nhất | `walletService.refund` + ledger cùng tx |
| W7 mua cũ | `purchase-credits:34-55` | Chết (410), code còn | `+quantity` | Mở lại = cộng chồng với W3 |

Chốt duy nhất: `idempotency_key @unique` (schema:645). Không constraint nào cấm balance âm.

## 3. Đường ghi ví (tiền) — 4/4 caller gãy atomicity

| Caller | File:line | Gãy |
|---|---|---|
| Verify nạp tay | `verify-deposit:41` + `deposit()` inner | Ví commit trước, `deposit.status` sau → retry = double tiền (cứu bởi P2002) |
| SePay auto | `sepay-webhook:75-76` | Như trên |
| Order mua vé | `create-order:52` + `withdraw:92` | Ví trừ rồi, ledger+order có thể rollback → **mất tiền không vé** |
| Mua cũ | `purchase-credits:34+42` | Như trên + `reference_id` lệch (ví=`caseId`, ledger=`packageId`) |

Hoàn kép: `refundRemainingCredit` (C5, `refund-credit-${caseId}`, ví+ledger FIFO) vs `refundCredit` veto (C6, `refund-${caseId}`, chỉ ví, hoàn nguyên `lockedPrice`). Cùng case veto chạy cả 2 → hoàn 2 lần vì khác namespace key. `order.wallet_transaction_id = order.id` (`create-order:101`) không phải FK tới `walletTransaction.id`.

## 4. 12 format key — 4 đỏ 2 vàng

- **Đỏ:** `purchase-...-quantity` thiếu timestamp (mua lại combo = P2002 oan; retry = 500 vì không catch); `order-sha256(cart)` deterministic (mua lại giỏ đã xài = chặn oan); `refund-` vs `refund-credit-` 2 namespace (hoàn kép); `deposit-create-randomUUID` fallback (mỗi retry 1 deposit mới).
- **Vàng:** `refund-credit-${caseId}` thiếu reason/timestamp; `consume-` fallback `case-${caseId}` (vòng audit mới bị chặn oan).
- Nối được ví↔ledger chỉ ở K3 order (chung `order.id`) và refund-credit (chung key). Còn lại mỗi sổ 1 format — không JOIN tự động.

## 5. Giá 3 đời + gói đơn trị

- `features` đổi shape không migrate: free `string[]` → audit `{items,sla_hours}` → AI `{...,credits_granted:2}`. `pkg_supporter_audit` 149k **không có** `credits_granted`. Đọc giá bằng 3 tầng fallback hardcode (`create-order:137-145`, `payment.repo:184` chia 39k, FE `??79000`, test hardcode 39k).
- `Case.package_id` đơn trị: case 79k mua thêm 149k ("bao gồm Basic AI") không có chỗ lưu combo — ghi đè là mất dấu quyền.

## 6. Luật vé + ví (đã chốt)

1. Tiền chỉ vào/ra ví; lượt chỉ vào/ra ledger. Hủy queued → hoàn lượt; đền tiền thật → hoàn VND kèm hủy lượt, 1 sự kiện 2 bút toán.
2. Mọi purchase bắt buộc có `order_id`. Giết đường K1 ghi ledger lén.
3. `balance_after` bỏ hoặc tính trong `SELECT FOR UPDATE cases`. 7 đường không tự tính.
4. `credits_granted` ra khỏi JSON hiển thị → column riêng. Xóa hardcode 79k/39k.
5. Key mua lại có nonce; key hoàn có reason/timestamp; gộp 2 namespace `refund-`.
6. `walletService.*` nhận `tx` ambient (JOIN), không tự mở tx — sửa 4 caller gãy.

## 7. Dependency với PR37

T1 race, A refund mù, T3/4 guard blanket đều là triệu chứng của ma trận trên. Fix thread lẻ trên nền chưa dọn = vá 1 trong 7 đường ghi. Thứ tự: dọn nền (mục 8 trong plan nháp) rồi mới fix P0 trên nền sạch.
