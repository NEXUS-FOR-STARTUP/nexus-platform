# Phase 02 — FE intent, QR, fulfill

## Context Links

- [Phase 01](./phase-01-nghiep-vu-blast-radius.md)
- `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx`
- `apps/web-1/app/dashboard/payment/page.tsx`
- `apps/web-1/app/dashboard/payment/hooks/usePayment.ts`
- `apps/web-1/app/dashboard/wallet/hooks/useWallet.ts` (`useCreateDeposit`)
- `apps/web-1/app/dashboard/wallet/page.tsx`

## Overview

- Priority: P1
- Status: Completed
- File mới kebab-case, mỗi file < 200 dòng. Component không gọi `apiClient` — hook.

## Key Insights

Không `removeItem` trong `useEffect` cleanup của trang QR: React Strict Mode unmount giả sẽ xóa intent lúc dev. Xóa intent: fulfill success, bấm back về ví, **mount trang ví** (`clearAll`).

## Requirements

Luật 1–7 phase 01. Copy nút “Nạp tiền ngay” → ví biến mất.

## Architecture

`sessionStorage` key: `buyCreditAfterDeposit:${depositId}`

```ts
type BuyCreditAfterDepositIntent = {
  caseId: string;
  quantity: number;
  orderIdempotencyKey: string;
};
```

`orderIdempotencyKey` tạo **một lần** lúc save, không tạo lúc fulfill.

## Related Code Files

Tạo:

- `apps/web-1/app/dashboard/payment/credit-after-deposit-intent.ts`
- `apps/web-1/app/dashboard/case/[id]/_components/use-shortage-deposit-redirect.ts`
- `apps/web-1/app/dashboard/payment/hooks/use-fulfill-credit-after-deposit.ts`

Sửa:

- `CreditQuantityModal.tsx` — nhánh INSUFFICIENT
- `payment/page.tsx` — back + mount fulfill hook
- `wallet/page.tsx` — mount `clearAllBuyCreditAfterDepositIntents()`
- `apps/web-1/lib/deposit-display.ts` — thêm copy `backToCase: "Quay lại hồ sơ"` nếu `WALLET_COPY` đang chứa `backToWallet`

Không sửa: `WalletTopupModal.tsx`, `WalletProofTable.tsx`, `StatusGuidanceCard.tsx`, `case/[id]/page.tsx` (modal cùng chỗ).

## Implementation Steps

1. **intent module** — `save` / `read` / `clear(depositId)` / `clearAll`. `read`: JSON hỏng hoặc `quantity` không nguyên 1–50 hoặc `caseId` rỗng → `clear` + `null`. `sessionStorage` throw → no-op/`null`. `clearAll`: iterate key prefix `buyCreditAfterDeposit:`.

2. **`useShortageDepositRedirect(caseId)`** — trong hook: `useCreateDeposit` + `useRouter`. `startShortageDeposit({ quantity, suggestedTopup })`: `idempotency_key` nạp = `crypto.randomUUID()`; success → `save(depositId, { caseId, quantity, orderIdempotencyKey: crypto.randomUUID() })` → `router.push(`/dashboard/payment?pid=${depositId}`)`. Không nhét caseId lên URL.

3. **Modal** — `onError` `INSUFFICIENT_BALANCE`: tính `suggestedTopup` như hiện tại (`Math.max(required-current, 0)` fallback `quantity * unitPrice`, rồi `Math.max(..., 2000)`). Gọi `startShortageDeposit`. Đóng modal. **Xóa** toast Button Nạp tiền ngay + `router.push(/dashboard/wallet?amount=...)`. Nhánh đủ tiền giữ nguyên (kể cả upgrade free).

4. **`useFulfillCreditAfterDeposit(deposit)`** — `status !== "verified"` hoặc `read(deposit.id)` null → return. `useRef` started per deposit.id. `POST /orders` qua hook mới `useCreateCreditOrder` (cùng folder payment/hooks hoặc case hooks): body `{ idempotency_key: intent.orderIdempotencyKey, items: [{ service_type: "credit_audit", quantity, metadata_json: { case_id } }] }`. Không upgrade-package. Success (kể cả order cũ trùng key): `clear(deposit.id)`, invalidate `["case", caseId]` `["wallet"]`, toast mua thành công, `router.replace(`/dashboard/case/${caseId}`)`. Fail: không clear; toast BE; ở QR. Không loop tạo deposit.

5. **Payment page** — gọi hook sau khi có `payment`. Back (3 chỗ: missing pid, error, header ~77–84): `read(payment?.id)` có caseId → push case + `WALLET_COPY.backToCase`; không → ví như cũ. Bấm về ví: `clear(payment.id)` rồi push ví. Không đổi ProofUpload / amount_mismatch / rejected→`wallet?amount=`.

6. **Wallet page** — đầu component, `useEffect` once: `clearAllBuyCreditAfterDepositIntents()`.

## Todo List

- [x] intent module
- [x] shortage redirect hook
- [x] modal INSUFFICIENT
- [x] fulfill hook + create-order hook
- [x] payment back
- [x] wallet clearAll

## Success Criteria

- Đủ ví: không QR.
- Thiếu từ hồ sơ: không `/dashboard/wallet`, có QR.
- Treo QR + verified: về case, credit tăng.
- Vào ví rồi verified: credit không tăng, ví tăng.
- Nạp từ ví: không `POST /orders`.
- File mới < 200 dòng. Modal không phình quá 200 — logic nạp đã tách hook.

## Risk Assessment

Strict Mode xóa intent → không clear on QR unmount (bước 6 + back ví).

Fulfill 2 lần cùng key → BE `P2002` trả order cũ. `started` ref chặn double fire cùng mount.

## Security Considerations

Intent không phải secret. `POST /orders` session cookie. Không tin `quantity` client cho **giá** — server `resolveCreditAuditPrice`.

## Next Steps

Phase 03.
