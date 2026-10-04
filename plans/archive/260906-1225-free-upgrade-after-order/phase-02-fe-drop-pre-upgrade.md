# Phase 02 — FE bỏ pre-upgrade + return thiếu ví

## Context Links

- [Phase 01](./phase-01-be-upgrade-after-paid.md)
- `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx`
- `apps/web-1/app/dashboard/case/[id]/page.tsx`
- `apps/web-1/app/dashboard/payment/hooks/useCreateCreditOrder.ts` — không gọi upgrade (đúng)

## Overview

- Priority: P1
- Status: Completed
- Phase 01 xong trước: fulfill QR trên case còn FREE cần BE giá audit + upgrade lúc order paid.

## Key Insights

`CreditQuantityModal` nhận `packageId={PACKAGE_KEYS.AUDIT}` (giá UI) và `currentPackageId={caseData.package_id}` (chỉ để pre-upgrade). Xóa pre-upgrade → xóa prop.

**Bug phụ QR:** `onError` `INSUFFICIENT_BALANCE` không `return` sau `startShortageDeposit` → toast đỏ “Tạo đơn hàng thất bại” rồi nhảy QR. Không đổi banner. Sửa cùng file.

## Requirements

1. Xác nhận mua = chỉ `POST /orders`. Không `upgrade-package` từ FE.
2. `INSUFFICIENT_BALANCE`: `startShortageDeposit` + đóng modal; **không** toast “Tạo đơn hàng thất bại”.
3. Thiếu ví + FREE: banner `StatusGuidanceCard` giữ xanh dương (data không đổi). Không sửa card.

## Architecture

```
Xác nhận mua
  POST /orders
    200 → invalidate case/wallet, toast thành công, đóng modal
          BE đã upgrade nếu FREE
    400 INSUFFICIENT_BALANCE → startShortageDeposit → QR; return
    khác → toast thất bại
```

## Related Code Files

Sửa:

- `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx`
- `apps/web-1/app/dashboard/case/[id]/page.tsx`

Không sửa: `StatusGuidanceCard.tsx`, `WalletTopupModal.tsx`, `use-fulfill-credit-after-deposit.ts`.

## Implementation Steps

1. **`mutationFn`** — xóa block:

```ts
if (currentPackageId === PACKAGE_KEYS.FREE) {
  await apiClient.post(`/cases/${caseId}/upgrade-package`, {
    packageId: PACKAGE_KEYS.AUDIT,
  });
}
```

Giữ `POST /orders` `{ idempotency_key, items: [{ service_type: "credit_audit", quantity, metadata_json: { case_id } }] }`.

2. **Prop** — xóa `currentPackageId` khỏi interface + destructure. Xóa import `PACKAGE_KEYS` nếu không dùng; giữ `formatPrice`.

3. **`onError`** — sau `void startShortageDeposit({ quantity, suggestedTopup }).finally(() => { handleClose(); });` thêm **`return;`**. Toast thất bại chỉ khi `code !== "INSUFFICIENT_BALANCE"`.

4. **`page.tsx`** — `<CreditQuantityModal>` xóa `currentPackageId={caseData?.package_id ?? undefined}`. Giữ `packageId={PACKAGE_KEYS.AUDIT}`.

## Todo List

- [x] Xóa pre-upgrade + prop `currentPackageId`
- [x] `return` sau INSUFFICIENT
- [x] Cắt prop ở case page

## Success Criteria

Manual (dev, case `pkg_tf_free`, `intake_pending`):

| # | Input | Output |
|---|--------|--------|
| 1 | Ví 0, Xác nhận mua 1 | QR; banner **không** vàng; DB `pkg_tf_free`; không toast đỏ “Tạo đơn hàng thất bại” |
| 2 | Ví ≥ giá audit, Xác nhận mua | Banner teal “Đã có 1 credit”; DB `pkg_tf_audit`, `paid` |
| 3 | Ví 0, treo QR, verified + intent | Về case, credit ≥ 1, package audit |
| 4 | Ví 0, vào Ví trước verified | Package FREE, credit không tăng |

`npm run check-types` 0 error. File modal < 200 dòng.

## Risk Assessment

Phase 02 chạy khi phase 01 chưa merge: FREE + đủ ví → `INVALID_PRICE`. Cook tuần tự 01 rồi 02.

## Security Considerations

`POST /orders` vẫn auth + owner. Không tin `quantity` cho giá.

## Next Steps

Cook plan. Không changelog/roadmap trong phase.
