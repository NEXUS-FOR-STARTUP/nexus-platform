# Phase 07: Frontend Refactor

**Status:** pending | **Effort:** 4h | **Depends:** Phase 01-05 | **Blocked by:** —

## Overview

Update all frontend components to use new `deposits` and `orders` API endpoints instead of old `payments` and `wallet/topups`. Keep backward compatibility during transition — old components still work if new API not available.

## Task Breakdown

### T07.1: WalletTopupModal → POST /deposits

**File:** `apps/web-1/app/dashboard/wallet/_components/WalletTopupModal.tsx`

**Current:** `useCreateTopup` calls `POST /wallet/topups`

**Change:** use `POST /deposits`

```typescript
// In useCreateTopup hook:
const response = await apiClient.post("/deposits", { amount });
// Response now: { depositId, amount, transferContent, bankInfo }
```

**File:** `apps/web-1/app/dashboard/wallet/hooks/useWallet.ts`

```typescript
// New hook replacing useCreateTopup
export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation<DepositResult, { response?: { data?: { message?: string } } }, number>({
    mutationFn: async (amount: number) => {
      const response = await apiClient.post("/deposits", { amount });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
    },
    onError: (error) => {
      notifications.show({
        title: "Tạo mã nạp tiền thất bại",
        message: error?.response?.data?.message || "Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });
}

export interface DepositResult {
  depositId: string;
  amount: number;
  transferContent: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}
```

**WalletTopupModal** renamed prop references: `topupResult` → `depositResult`, `createTopup` → `createDeposit`. Rest of UI (bank info display, transfer content, copy button) stays same.

### T07.2: CreditQuantityModal → POST /orders (GAP-4 fixed)

**File:** `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx`

**Current:** hardcode `CREDIT_PRICE = 39000` (L10), POST `/payments` với `amount` client-tự-tính (tạo lỗ hổng giá).

**Change:** POST `/orders` — CHỈ gửi `quantity` + `case_id`. `unit_price` resolve SERVER-SIDE từ service package (T03.4). Giá hiển thị lấy từ `GET /api/packages/:id` (T03.11) — bỏ hẳn constant `CREDIT_PRICE`.

```typescript
// Trong component: fetch giá package của case (gói hiện tại, sau khi upgrade logic xử lý)
const { data: pkg } = useQuery({
  queryKey: ["package", "price", packageId],
  queryFn: () => apiClient.get(`/packages/${packageId}`).then((r) => r.data),
  enabled: !!packageId,
});
const unitPrice = pkg?.price ?? 0; // fallback 0 → button disabled nếu chưa load / lỗi

const mutation = useMutation({
  mutationFn: async () => {
    if (packageId === "pkg_tf_free") {
      // BẮT BUỘC trước: nâng cấp gói (locked_price = giá gói tại server) — giữ nguyên luồng cũ
      await apiClient.post(`/cases/${caseId}/upgrade-package`, {
        packageId: "pkg_tf_audit",
      });
    }
    const res = await apiClient.post("/orders", {
      items: [{
        service_type: "credit_audit",
        quantity,
        // KHÔNG gửi unit_price — server resolve giá (GAP-4)
        metadata_json: { case_id: caseId },
      }],
    });
    return res.data;
  },
  onSuccess: (data) => {
    notifications.show({
      title: "Mua credit thành công",
      message: `Đã trừ ${data.totalAmount.toLocaleString("vi-VN")}₫ và thêm ${quantity} credit vào hồ sơ`,
      color: "teal",
    });
    router.refresh(); // Reload page to see updated credit balance
  },
  onError: (error: any) => {
    const message = error?.response?.data?.message || "Vui lòng thử lại sau.";
    notifications.show({ title: "Mua credit thất bại", message, color: "red" });
  },
});
```

**Remove:** constant `CREDIT_PRICE` (L10) + `router.push(/dashboard/payment?pid=...)` redirect. Sau order, credit đến ngay (wallet deduction trong cùng tx server-side). Không cần trang payment riêng.

**Lưu ý ordering:** `unit_price` display dùng `GET /packages/:id` — gói phải lấy sau khi upgrade hoặc dùng package mục tiêu `pkg_tf_audit` cho case free (nếu modal chỉ cho mua ở case free → hardcode tên gói mục tiêu, KHÔNG hardcode giá).

### T07.3: CreditPanel → update props

**File:** `apps/web-1/app/dashboard/case/[id]/_components/CreditPanel.tsx`

**Current props:**
```typescript
interface CreditPanelProps {
  creditBalance: number | null | undefined;
  creditLedger?: CreditEntry[];
  payments?: Payment[];
  // ...
  onBuyCredits: () => void;
}
```

**Change:** Remove `payments` prop, `paymentStatus` prop. Credit purchase is now handled by order — credit appears immediately after purchase (no "pending verification" state needed for wallet-funded orders).

```typescript
interface CreditPanelProps {
  creditBalance: number | null | undefined;
  creditLedger?: CreditEntry[];
  onBuyCredits: () => void;
}
```

Remove pending verification / rejected payment UI blocks (lines 48-58, 89-112). These were Payment-specific — order-based purchases don't have these states.

### T07.4: UnpaidAlertBanner → conditional remove

**File:** `apps/web-1/app/dashboard/case/[id]/_components/UnpaidAlertBanner.tsx`

**Current:** Shows "Chưa thanh toán" / "Đang chờ xác thực" / "Bị từ chối" based on `payment_status` + `payments`.

**Change (H8 fix):** Do NOT remove outright. Gate on new domain availability:
```typescript
// Show old banner only if case has payment_status AND no orders exist yet
const shouldShowBanner = caseData.payment_status !== 'paid' && (!orders || orders.length === 0);
if (!shouldShowBanner) return null;
```

**Rationale:** During transition (Phase 02-08), old cases with pending payments still need visibility. Banner removed in Phase 09 after data migration complete.

### T07.5: CreditTransactionHistory → add deposit rows

**File:** `apps/web-1/app/dashboard/case/[id]/_components/CreditTransactionHistory.tsx`

**Current:** Combines `payments` (pending/rejected) + `ledger entries` (purchase/consumption/refund).

**Change:** Replace `payments` prop with `orders` prop. Show orders instead of pending payments.

```typescript
interface CreditTransactionHistoryProps {
  entries?: CreditEntry[];
  orders?: Array<{                          // NEW — replaces payments
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    items?: Array<{ service_type: string; quantity: number }>;
  }>;
  pricePerCredit?: number;
  isLoading?: boolean;
}
```

UnifiedItem type updated:
```typescript
type UnifiedItem =
  | { kind: "order"; id: string; timestamp: number; created_at: string; data: OrderRow }
  | { kind: "ledger"; id: string; timestamp: number; created_at: string; data: CreditEntry };
```

For `kind: "order"` items, show:
- Title: "Mua credit" (if `items[0].service_type === "credit_audit"`)
- Status badge: "Đã thanh toán" (green) vs "Đang xử lý" (yellow)
- Amount: total_amount (VND) → + {credits} credit

### T07.6: AdminPaymentVerificationTable → AdminDepositVerificationTable

**File:** `apps/web-1/app/admin/_components/AdminPaymentVerificationTable.tsx`

**Current:** Shows Payment rows with case_code, package_name, amount, transfer_content, bank_transaction_id, proof_file_url, approve/reject.

**Change:** Rename to `AdminDepositVerificationTable`. Show Deposit rows:

```typescript
interface AdminDepositVerificationTableProps {
  deposits: Array<{
    id: string;
    user_id: string;
    amount: number;
    transfer_content: string;
    status: string;
    proof_file_url: string | null;
    bank_transaction_id: string | null;
    created_at: string;
    user?: { display_username?: string | null; name: string };
  }>;
  onApprove: (depositId: string) => void;
  onReject: (depositId: string) => void;
}
```

Columns change:
- Remove: "Mã hồ sơ", "Gói dịch vụ"
- Add/change: "Người nạp" (user.display_username), "Nội dung CK", "Số tiền", "Mã GD ngân hàng", "Thời gian", "Biên lai", "Thao tác"
- Status filter: "pending" → "Chờ xác minh", "verified" → "Đã duyệt", "rejected" → "Bị từ chối"

### T07.7: Admin page → update verify calls

**File:** `apps/web-1/app/admin/page.tsx`

**Current:** Calls `POST /payments/:id/verify` for approve/reject.

**Change:** Calls `POST /deposits/:id/verify`:

```typescript
async function handleApproveDeposit(depositId: string) {
  await apiClient.post(`/deposits/${depositId}/verify`, { status: "verified" });
}

async function handleRejectDeposit(depositId: string) {
  // Open rejection reason modal, then:
  await apiClient.post(`/deposits/${depositId}/verify`, { status: "rejected", rejectionReason });
}
```

### T07.8: Wallet page → update history display

**File:** `apps/web-1/app/dashboard/wallet/_components/WalletTransactionItem.tsx`

**Current:** Shows `sourceType`, `sourceId`.

**Change:** Show `referenceType` with Vietnamese labels:
```typescript
const TYPE_LABELS: Record<string, string> = {
  deposit: "Nạp tiền",
  withdrawal: "Rút tiền",
  service_payment: "Mua dịch vụ",
  refund: "Hoàn tiền",
  adjustment: "Điều chỉnh",
  migration: "Chuyển đổi",
};
```

### T07.9: Payment history page → redirect to wallet

**File:** `apps/web-1/app/dashboard/payments/*`

**Change:** Redirect `/dashboard/payments` → `/dashboard/wallet` (301). Payment history is now unified in wallet page via deposits + orders tabs. No need to merge — redirect keeps old URLs working.

### T07.10: Frontend types update

**File:** `apps/web-1/types/payment.ts`

Add new types:
```typescript
export interface Deposit {
  id: string;
  amount: number;
  currency: string;
  transfer_content: string;
  status: "pending" | "verified" | "rejected";
  proof_file_url: string | null;
  bank_transaction_id: string | null;
  bank_credited_at: string | null;
  verified_by: string | null;
  verification_source: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    display_username?: string | null;
  };
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: "pending" | "paid" | "refunded" | "cancelled";
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: string;
  service_type: string;
  quantity: number;
  unit_price: number;
  amount: number;
  metadata_json?: Record<string, unknown> | null;
}
```

**File:** `apps/web-1/types/case.ts`

Update `CreditLedger` interface:
```typescript
export interface CreditLedger {
  id: string;
  amount: number;
  balance_after: number;
  type: "purchase" | "consumption" | "refund";
  reference_type: string | null;   // ADD
  reference_id: string | null;
  created_at: string;
}
```

**File:** `apps/web-1/lib/pricing.ts` — REMOVE

Pricing is now in DB (`service_packages.price`, `service_pricing.price`). `CREDIT_PRICE` constant was hardcoded (39000) — use `service_packages.price` from API response instead.

## Testing

- E2E: Open wallet page → click "Nạp tiền" → enter amount → POST /deposits → see bank info + transfer content
- E2E: Open case detail → click "Mua credit" → select quantity → POST /orders → credit balance increases immediately
- E2E: Admin page → see deposit list → click "Duyệt" → deposit verified → wallet balance increases
- E2E: Wallet topup modal → create deposit → Sepay auto-verify (simulate) → wallet balance auto-updates
- Visual: Check all status badges (pending/verified/rejected/paid) render with correct colors
- Visual: Check mobile responsiveness unchanged

## Rollback

1. Git revert all frontend files
2. Old API paths still active (Phase 02-05 backend runs alongside old routes)
3. No data loss — FE is presentation layer only

## Deliverables

- [ ] WalletTopupModal → POST /deposits
- [ ] CreditQuantityModal → POST /orders
- [ ] CreditPanel — remove payment-related states
- [ ] UnpaidAlertBanner — removed from case detail page
- [ ] CreditTransactionHistory — orders instead of payments
- [ ] AdminPaymentVerificationTable → AdminDepositVerificationTable
- [ ] Admin page → verify deposits
- [ ] WalletTransactionItem → reference_type labels
- [ ] Payment history page → redirect `/dashboard/payments` → `/dashboard/wallet` (T07.9)
- [ ] types/payment.ts — new types
- [ ] types/case.ts — CreditLedger.reference_type
- [ ] lib/pricing.ts — removed
- [ ] ESLint web 0 warning
- [ ] check-types passes
