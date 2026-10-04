# Phase 01: Seed + Order: 79k = 2 Credits

## Goal
Gói 79k khi mua sẽ cấp 2 credits thay vì 1. Hiển thị đúng trên UI.

## Changes

### 1.1 Seed Data: credits_granted trong metadata_json
**File:** `prisma/seeds/seed-active-packages.ts`

**KHÔNG đổi `features`** — giữ `string[]` vì `AdminPackagesSettings.tsx:118` dùng `Array.isArray(pkg.features) && pkg.features.join(" • ")`.

Dùng `metadata_json` thay vì `features`:
```typescript
// features giữ nguyên
features: ["2 lượt đánh giá AI", "Báo cáo 14 tiêu chí", "PDF A4"]

// Thêm metadata_json
metadata_json: { credits_granted: 2 }
```

### 1.2 Order: Đơn vị mua là "gói", không phải "credit"
**File:** `apps/api/src/modules/orders/application/create-order.usecase.ts`

**CRITICAL:** KHÔNG sửa quantity. Order quantity = 1 gói. Total = 1 × 79,000 = 79,000.

**3 chỗ cần sửa** (tất cả đọc `credits_granted` từ package `metadata_json`):

```typescript
// CreateOrderItem KHÔNG có service_package_id
// Phải resolve qua case → package_id
// caseRecord ĐÃ CÓ từ dòng 121-129 trong loop hiện tại
const pkg = await tx.servicePackage.findUnique({ where: { id: caseRecord.package_id } });
const creditsGranted = (pkg?.metadata_json as any)?.credits_granted ?? item.quantity;
```

**Sửa 1:** CreditLedger amount (dòng ~111):
```typescript
// Trước
amount: item.quantity,  // = 1
// Sau
amount: creditsGranted,  // = 2
```

**Sửa 2:** balance_after (dòng ~112):
```typescript
// Trước
balance_after: currentBalance + item.quantity,
// Sau
balance_after: currentBalance + creditsGranted,
```

**Sửa 3:** ORDER_PAID totalCredits (dòng ~171) — cộng dồn từng item (đơn nhiều case):
```typescript
// Trong loop (tx còn mở): stash creditsGranted từng item
const grantedByItem: number[] = [];
// ... mỗi vòng: grantedByItem.push(creditsGranted);

// Dòng ~171 (sau commit, KHÔNG query tx nữa):
// Trước
totalCredits: resolvedItems.reduce((sum, { item }) => sum + item.quantity, 0),
// Sau
totalCredits: grantedByItem.reduce((sum, g) => sum + g, 0),
```

`walletService.withdraw` vẫn trừ 79,000 (quantity × unit_price = 1 × 79k). Không đổi.

### 1.4 CreditQuantityModal: Không forced quantity=1
**File:** `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx`

```typescript
// Trước
quantity = 1  // forced

// Sau:Quantity mặc định = 1 (1 gói). Hiển thị:
// "Gói Basic AI Audit — 2 lượt đánh giá — 79,000 VND"
// Không cho chọn số lượng (luôn 1 gói)
```

### 1.5 Price Resolution: Không đổi
**File:** `apps/api/src/modules/orders/application/credit-audit-order.helpers.ts`

`resolveCreditAuditPrice` giữ nguyên: trả price per package (79,000). Không split per credit.

## Acceptance Criteria
- [ ] Mua 79k → CreditLedger.amount = 2, balance_after = 2 (NOT 1)
- [ ] Wallet trừ đúng 79,000 VND (NOT 158,000)
- [ ] Order items: quantity=1, unit_price=79000, amount=79000
- [ ] CreditQuantityModal hiển thị "2 lượt đánh giá — 79,000 VND"
- [ ] Không có thay đổi nào ở walletService.withdraw logic
