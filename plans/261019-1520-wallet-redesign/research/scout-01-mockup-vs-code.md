# Wallet redesign: mockup vs `/dashboard/wallet`, API and pay-later plan

Read-only. Nothing was built or run. Line counts are from `wc -l`. I read `codegraph_explore` as optional and used `read`/`bash` directly. The Prisma schema I read was found at `.claude/worktrees/worker-omp-sdk/prisma/schema.prisma` and root `prisma/`. I did not diff the two.

## 1. Inventory

**Mockup** `design-system/mockups/wallet/` (1264 lines in total)

| File | Lines | Notes |
|---|---|---|
| `index.html` | 43 | Static page shell. |
| `css/base.css` | 102 | Tokens and layout. |
| `css/views.css` | 85 | Balance card, chips, QR box. |
| `js/app.js` | 83 | Router. Params: `tab=wallet\|spec`, `view=history\|proofs`, `topup=open`, `amount=N`. `Esc` closes the modals. |
| `js/views/balance.js` | 76 | Balance card, 3 meta stats, 2 tabs. |
| `js/views/history.js` | 170 | Expandable `<details>` rows, type tabs with counts, time-range select, Refresh, mobile "Xem thêm N". |
| `js/views/proofs.js` | 94 | Expandable rows, status tabs. |
| `js/views/topup-modal.js` | 186 | Step 1: amount + 4 presets. Step 2: fake QR box, labelled "Unvalidated proposal". "Tôi đã chuyển tiền" button. |
| `js/views/spec.js` | 74 | Reference only, not product UI. |
| `js/data/wallet.js` | 43 | Balance, status and type maps. |
| `js/data/transactions.js` | 155 | 6 sample transactions. |
| `js/data/deposits.js` | 47 | 4 sample deposits. |
| `js/icons.js` | 19 | Phosphor icons. |
| `REPORT.md` | 87 | Design notes. |

- **`tx-detail-modal.js` does not exist**, although `REPORT.md` lists it. `app.js` calls `closeTxDetailModal()` on `Esc`, which would throw a `ReferenceError` after the top-up modal closes. The "tx-detail modal" is really the inline `.txd` expanded row.
- Mockup states: collapsed and expanded rows, empty filter result, a "Đang tải…" button label. It has no error, skeleton or pagination state.
- Params the mockup defines that the app lacks: `?view`, `?topup=open`, `?tab`. The app reads only `?amount`. The `?amount=` handling already exists in `app/dashboard/wallet/page.tsx:15-19`.

**Current web code** (`apps/web-1/app/dashboard/wallet/**`, 1031 lines in total)

| File | Lines |
|---|---|
| `page.tsx` | 59 |
| `hooks/useWallet.ts` | 106 |
| `_components/WalletProofTable.tsx` | **371** (over the 200-line limit) |
| `_components/WalletTransactionTable.tsx` | 166 |
| `_components/WalletTransactionList.tsx` | 130 |
| `_components/WalletTopupModal.tsx` | 98 |
| `_components/WalletTransactionCardList.tsx` | 86 |
| `_components/wallet-transaction.types.ts` | 63 |
| `_components/WalletRowDetailAction.tsx` | 44 |
| `_components/WalletTransactionFilters.tsx` | 48 |
| `_components/WalletBalanceCard.tsx` | 43 |
| `_components/WalletTabsList.tsx` | 12 |

- The payment folder `app/dashboard/payment/**` is 1043 lines in total. `page.tsx` is 151, `PaymentView` 73, `ProofUpload` 136, `ProofPreview` 74, `PaymentDepositMeta` 53, `PaymentBankInfo` 42.
- `app/dashboard/payments/page.tsx` only redirects to `/dashboard/wallet`.
- Mantine components in use: `Tabs` (pills), `Paper`, `Table`, `Table.ScrollContainer`, `Badge`, `Pagination`, `Select`, `Skeleton`, `Modal`, `NumberInput`, `Button`, `Group`, `Stack`, `Divider`, `Center`, `Text`, `ActionIcon`, `Tooltip`.
- Mockup deviation: `WalletBalanceCard.tsx:19` still uses a gradient card with two decorative circles. The mockup removes both.

**API** (`apps/api/src/modules/`)

| Module | Files | Routes |
|---|---|---|
| `wallet/` | `wallet.routes.ts` 51, `wallet.service.ts` 234, `wallet.repository.ts` 139 | `GET /wallet/balance`, `GET /wallet/history` |
| `deposits/` | `deposit.controller.ts` 71, `deposit.repository.ts` 144 | `GET/POST /deposits`, `GET /deposits/:id`, `POST /deposits/:id/verify` |
| `payments/` | `payments.controller.ts` 234 | Proof upload at `POST /payments/proof`. |
| `orders/` | – | `GET /orders/:id` returns items. |

## 2. Logic to preserve

- **Deposit creation and redirect.** `WalletTopupModal.tsx:36-47` sends `{amount, idempotency_key}` through `useCreateDeposit`, then `router.push('/dashboard/payment?pid=' + depositId)`.
  - The idempotency key is regenerated on each modal open (`:25-29`), with a `submittingRef` guard against double submits.
  - `MIN_TOPUP_AMOUNT = 2000` and `DEFAULT_TOPUP_AMOUNT = 50000` are in the file.
  - `useCreateDeposit` invalidates the `["wallet"]` and `["deposits"]` queries and shows an error notification (`useWallet.ts:82-105`).
- **Shortage flow.** `use-shortage-deposit-redirect.ts` also calls `useCreateDeposit` and saves a buy-credit-after-deposit intent. `page.tsx:22` calls `clearAllBuyCreditAfterDepositIntents()` on mount. Keep both.
- **Rejected deposits.** `payment/page.tsx:133-135` sends the user to `/dashboard/wallet?amount=N`.
- **Polling.**
  - Balance, history and deposits refetch every 30 s.
  - `useDepositDetail` polls every 5 s.
  - The balance also feeds `UserMenu` and `ServiceCheckoutModal`.
- **Server-side history paging and sorting.**
  - Query params: `page`, `limit` (max 50), `type`, `sortBy=created_at|amount`, `sortOrder`.
  - The UI uses limit 10.
  - It shows `Pagination` and a "Hiển thị X trên tổng số Y" line. The sort buttons are in table headers.
- **Description cleanup.** A regex strips the trailing `(+100.000 VND)` that the API appends in `describeTransaction` (`wallet-display.constants.ts:17-21`).
- **Proof handling.**
  - `proof_file_url` is resolved against `NEXT_PUBLIC_API_URL`, with a PDF vs image icon (`WalletProofTable.tsx:215-235`).
  - `WalletRowDetailAction` links to `depositDetailHref(source_id)`.
  - A service payment row shows a disabled tooltip: "Thanh toán dịch vụ - không có ảnh chứng minh".
- **Status copy.** `getDepositDisplay` in `lib/deposit-display.ts` is the single source of status labels.

## 3. Data feasibility

`GET /wallet/history` returns raw Prisma rows plus `source_description`. The fields are `id, wallet_id, type, amount, currency, balance_before, balance_after, source_type, source_id, reference_type, reference_id, idempotency_key, metadata_json, created_at`. The `useWallet.ts` type only declares part of them. All of them already reach the client.

| Mockup field | Today? | Detail |
|---|---|---|
| Balance before / after | **Yes** | `balance_before` and `balance_after` are returned. |
| Time to the second | **Yes** | `created_at` is an ISO string. Only `formatDateTime` drops the seconds. |
| Transaction ID, reference | **Yes** | `id`, `source_id`, `reference_id`. |
| Source label ("Nguồn phát sinh") | Partial | Use `source_type` plus the `SOURCE_DESCRIPTIONS` map, which exists only server-side. |
| Row status chip (`Thành công`, `Hoàn tất`, `Đã hoàn tiền`, `Đã cộng`) | **No** | A ledger row has no status. Only deposits have a status enum. The mockup invented these labels. Derive the chip from `type` or drop it. |
| Total deposited, total spent | **No** | No aggregate endpoint exists. Needs something like `GET /wallet/summary` with `SUM(amount)` by type. A client sum of the current page would be wrong. |
| `~3 lượt chấm` | **No** | The mockup hardcodes `floor(balance/50000)` while the sample data says 3 (158,000/50,000 = 3.16). Real prices vary (42,000, 50,000, 79,000 for 2 credits). Needs a package unit price from the packages API [UNVERIFIED], or drop it. |
| Bank name, account number, beneficiary | Partial | Not in history rows. `GET /deposits/:id` returns `bankInfo` from env (`BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_NAME`). Those are the platform's receiving account, not the student's bank. The mockup's account holder differs between files: `CONG TY CO PHAN` in `wallet.js` vs `CONG TY CP` in the transactions. Both are fake. A history row to a deposit needs one extra call per expanded row, using `source_id`. |
| Bank transaction ID, credited-at | Partial | `GET /deposits/:id` returns `bank_transaction_id` and `bank_credited_at`. `GET /deposits` returns `bank_transaction_id` but not `bank_credited_at`. |
| Transfer content | **Yes** | `transfer_content` in the deposit list and detail. |
| Verification mechanism ("Tự động…") | Partial | Detail returns `verification_source` (`manual` or `auto`) and `verified_by`. The list does not. |
| Payment method "VietQR (SePay)" | No | Static string only. |
| Order items, quantity, unit price | Partial | `GET /orders/:id` returns `items[{service_type, quantity, unit_price, amount, metadata_json}]`, `total_amount` and `status`. The link is `tx.source_id` = order id, for rows with `source_type='order'` (`payForOrder` and `order-in-tx`). Cost: one extra request per expanded row, so fetch lazily on expand. There is no human item name, only `service_type`. |
| `ref` as `CASE-44441B32` | No | History rows carry no `case_id`. `case_refund` and `case_consume` rows use the case id as `source_id`, but order payments do not. |
| Audit trail for non-deposit transactions | Partial | Only the fields above plus `metadata_json`. `grant` puts `{receivableId, ...}` there. There is no actor field, and the API gives no admin name for `admin_refund`. |
| Tab counts `Tất cả (6)` | **No** | `/wallet/history` returns only `total` for the current filter. Per-type counts need a new endpoint or `groupBy`. |
| 3-day / 7-day filter | **No** | There is no `from`/`to`/`days` param. Needs an API change (`getTransactionHistory` where clause). Client-side filtering is only valid within one page. |
| Proof tab counts and status tabs | Partial | `GET /deposits` returns `{deposits}` with no total, `limit` ≤ 20 hardcoded in the hook, and filtering is client-side (`WalletProofTable.tsx:44-50`). |
| `actual_amount` ("Số tiền thực nhận") | **No** | The deposit model has no such column. `amount_mismatch` exists, but the received amount is not stored or returned. |
| `proof_name` (file name) | **No** | Only `proof_file_url`. The name could be derived from the URL. |
| `verified_at` | Partial | The list returns `updated_at` as `verified_at` for verified rows (`list-deposits.usecase.ts:20`). Rejected rows get `null`. |

Two structural findings affect the type tabs:

1. **"Mua gói" tab will be empty.** Order payments call `walletService.withdraw`, which writes `type='withdrawal'` with `source_type='order'` (`order-in-tx.ts:97`, `withdraw()` defaults `referenceType 'adjustment'`). `service_payment` is written only by `payForOrder`, and I found no caller of it. The mockup's filters `service_payment` and the real "Trừ ví" (`withdrawal`) type. Decide how to group: by `withdrawal` or by `source_type='order'`.
2. **Case refunds to the wallet.**
   - `refund()` with a transaction writes `type='refund'`.
   - Without a transaction it calls `deposit()`, which hardcodes `type='deposit'` (`wallet.service.ts:166`).
   - Such a refund then shows in "Nạp tiền" with a case id as `source_id`. `WalletTransactionTable` would then link it to `/dashboard/payment?pid=<caseId>`.
   - The mockup does not account for this.

## 4. Copy that breaks the repo rules

**Currency** (rule: `158,000 VND`, comma thousands, VND after the number). The mockup uses `toLocaleString("vi-VN")`, which gives dot separators:

- `158.000 VND` (balance), `250.000 VND`, `92.000 VND`
- `+100.000 VND` and `-50.000 VND` in rows, `50.000 VND` in the items table
- Preset chips: `50.000đ`, `79.000đ`, `100.000đ`, `200.000đ` (also `đ`, banned)
- `Tối thiểu 2.000 VND · Gợi ý nạp 79.000 VND để mua gói 2 lượt đánh giá dự án` (`topup-modal.js`)
- `79.000 VND` in `qr-amount-text`
- `REPORT.md` examples: `158.000 VND`, `79.000 VND`

The **current code also violates the rule**, because it uses the same `vi-VN` locale:

- `formatVND` in `wallet-transaction.types.ts:48-50`
- `WalletBalanceCard.tsx:33`
- `PaymentDepositMeta.tsx:44`, `ServiceCheckoutModal.tsx` (`formatVnd`)
- The API error string at `wallet.types.ts:30`
- `describeTransaction` (the regex that strips `(+100.000 VND)` only matches dot or comma)

The current `NumberInput` description already says `2,000 VND` and `79,000 VND`, but `thousandSeparator=","` and `formatVND` disagree with each other.

**CP1 / CP2 in UI strings:**

- `balance.js`: "Dùng để thanh toán các gói đánh giá dự án Ý tưởng (CP1) và Thị trường (CP2)."
- `transactions.js`: "Giai đoạn Thị trường (CP2) · Trừ số dư ví", "Giai đoạn Ý tưởng (CP1) · Trừ số dư ví"
- Order items: "Lượt chấm phản biện Thị trường (CP2)" (and CP1)
- `spec.js`: "Chi trả cho các lượt phản biện CP1/CP2"
- `REPORT.md` §4.1 repeats the CP1/CP2 sentence.

The current balance card says only "Dùng để thanh toán các gói đánh giá dự án", which is already compliant.

**Status and type labels vs real enums:**

- `Hoàn tất` is styled orange on a debit. It is not a real status (see section 3). Orange means pending elsewhere (`pending → "Đang chờ xác minh"`, orange), so this contradicts the palette.
- `Thành công`, `Đã hoàn tiền`, `Đã cộng` also have no backing field.
- `Mua gói đánh giá` is `service_payment`, which orders do not produce (section 3). `Điều chỉnh` (orange) is used in the mockup for a student "khuyến mãi", but `adjustment` is the type of `platform_bonus` grants for the operator wallet (see section 6).
- `Trừ ví`, the mockup's type chip for `withdrawal`, has no filter tab.
- Mockup proof statuses: `Đang chờ xác minh`, `Đã vào ví`, `Từ chối`, `Sai số tiền` (orange).
  - The first three match `STATUS_LABELS` in `WalletProofTable.tsx:24-29`.
  - The code uses `yellow` for `amount_mismatch`.
  - `getDepositDisplay` says `Số tiền chưa khớp`, `Cần xử lý lại`, `Đã cộng vào ví`, `Cần bổ sung chứng minh`. Neither source matches these labels. `design-system/wording/` is canonical, so the user must pick one source.
- Other terms: `Tôi đã chuyển tiền` and `Đã tạo mã nạp thành công` (step 2); `lượt chấm` is not in wording [UNVERIFIED against `design-system/wording/`].
- Also, `Phosphor` icons (`icons.js`) must become Lucide. `alert()` on success must become a Mantine notification.

## 5. GAPS & RISKS

| # | Severity | Gap | Decision for the user |
|---|---|---|---|
| 1 | **blocker** | The mockup's VietQR step 2 inside the modal contradicts the real flow. `WalletTopupModal.tsx:41-46` redirects to `/dashboard/payment?pid=`, which does proof upload, 5 s polling, rejection and the shortage intent. The mockup's "Tôi đã chuyển tiền" simulates a credited deposit with no verification, and the QR is a placeholder. | Keep the redirect and drop mockup step 2. The mockup itself marks step 2 as unvalidated. |
| 2 | **blocker** | Type tabs and counts: "Mua gói" is empty (`withdrawal`, not `service_payment`). Per-type counts need a new API. Without it, tabs show no counts. | Add a summary or `groupBy` endpoint, or drop counts? Which type grouping? |
| 3 | **blocker** | Mockup drops server paging and sort. The real history is paginated at 10 with `sortBy`/`sortOrder` and a total. Expandable rows plus "Xem thêm" (mobile only) assumes all rows are loaded. | Keep `Pagination` below the list. Keep sorting (it moves to a Select if the table headers go)? |
| 4 | high | Row status chip is invented (section 3). | Derive from `type` or drop. |
| 5 | high | 3-day and 7-day filters: no API. The "Tất cả thời gian" option is the only real one. | Add a `days` param, or drop. |
| 6 | high | `Tổng đã nạp / đã dùng` and `~N lượt chấm` need an API (or removal). `~lượt` has no stable price. | Add `/wallet/summary`? Drop `~lượt`? |
| 7 | high | Proofs tab: the API lists only deposits that already have a proof (`deposit.repository.ts:findDepositsByUser`), caps at 20, and returns no total. A pending deposit with no proof is not visible (the user can still reach it via the `pid` link). The mockup counts "Chờ xác minh (n)" over everything. | Is that intended? Does the mockup's "Tất cả (4)" mean 4 total? |
| 8 | high | Dropped: the proof image/PDF view and link (`WalletProofTable.tsx:215-235`). The mockup shows only a file name. | Keep the real link in the expanded row. |
| 9 | high | Dropped: `rejected` status filter (the mockup has 3 status tabs), and the "Chi tiết" link to `/dashboard/payment?pid=` from deposit rows. The mockup has no way to reach upload-proof or a rejected-deposit retry. | Keep the detail link in the expanded row. |
| 10 | med | Dropped states: skeleton, error with retry, empty-by-filter, balance error card, 30 s refetch indicator. `isFetching` on Refresh. | Keep all in the redesign. |
| 11 | med | Dropped: mobile card list (`WalletTransactionCardList`). The mockup uses one `<details>` layout for all widths, which seems intentional ("Xem thêm" after 5 on mobile). | Confirm the card list can be deleted. Replacing it also removes the 371-line `WalletProofTable`, which must be split (≤200 lines). |
| 12 | med | Expanded detail needs an extra fetch for orders and for deposit rows (bank info, `bank_credited_at`, `verification_source`). Fetching on expand means hooks plus a loading state per row. | One endpoint to enrich history, or lazy per-row hooks? |
| 13 | med | Mockup's "Ngân hàng thụ hưởng / số TK / tên" is the platform's receiving account and comes from env (`BANK_*`), not a per-deposit stored value. Env defaults are fakes (`0909090909`). If the account changes, old rows would show the new one. | Show only the deposit's `transfer_content` and `bank_transaction_id`? |
| 14 | med | Mockup header "Quản lý số dư trả trước và đối soát lịch sử giao dịch đánh giá dự án" is new copy not in `design-system/wording/` [UNVERIFIED]. | Run through the wording dictionary. |
| 15 | med | The existing violation of the currency rule is wider than the wallet page (section 4). | Add a shared `formatVnd` using comma and fix every call site? |
| 16 | med | `tab=wallet\|spec`, nav, topbar and burger in the mockup are mock scaffolding. `?view` and `?topup=open` would be new URL state. | Keep `?view` (shareable tab)? `?topup=open` is not needed (the Nạp tiền button already opens it). |
| 17 | low | Deposit cancel or expire: **neither exists in the API** (no such route or status), so the mockup does not drop anything. Do not add them. | None. |
| 18 | low | Admin adjustment display: the mockup does show an `adjustment` tab, but its sample is a student bonus. `admin_refund` and `platform_bonus` labels live only in the server's `SOURCE_DESCRIPTIONS`. | Move the labels client-side? |
| 19 | low | The mockup's tabs are `variant`-like (3 px blue underline), not the `pills` the code uses. Mantine `Tabs` `variant="default"` is the closest. | Confirm. |

**Overlap with `261016-1530-grant-wallet-funds-pay-later` (status completed):**

- **No code conflict.** That plan created `WalletService.grant` (`type='adjustment'`, `source_type='platform_bonus'`, `source_id=receivable.id`, `metadata_json={receivableId,…}`), the `receivables` modules, `app/admin/receivables`, `app/pay/receivable/[token]` and `PaymentView`.
- **Grants land on the operator's own wallet, not on students.** The plan's invariant is "ví tăng rồi giảm bằng nhau" inside one transaction. So an operator's history gets an `adjustment` row (`Hệ thống tặng thưởng (+N VND)`) followed by a debit. This is the real-life case for the mockup's `Điều chỉnh` tab, and the sample "Cộng khuyến mãi sinh viên EXE101" is not backed by anything.
- **Pay-later debits use `order` as the source.** They go through `withdraw`, not `service_payment`. This is the same finding as gap 2.
- **`PaymentView`, `PaymentDepositMeta`, `PaymentBankInfo` are shared** with `app/pay/receivable/[token]/_components/PayReceivableView.tsx`. If the wallet redesign touches them (for example the currency format fix), it changes the public pay page too. Run both pages for regression, or leave them alone.
- **`getReceivableDisplay` and `DepositDisplay`** in `lib/deposit-display.ts` also serve receivables. Changing status wording here changes receivable copy. Do not change the label map without checking both.
- **`orders.wallet_transaction_id` holds the order id, not a transaction id** (`order-in-tx.ts:107`). It cannot be used to join an order to a ledger row. Use `tx.source_id` = order id instead.
- **A grant row's `source_type` is `platform_bonus`** and the history `type` is `adjustment`. There is no reference page for it. Showing a receivable link would need a new student-facing route, and students should not see operator receivables at all.
- A refund that reduces the receivable (plan §"Hoàn tiền") never touches the wallet, so it adds no wallet row.

## 6. REUSE

- **Hooks** (`wallet/hooks/useWallet.ts`): `useWalletBalance`, `useWalletHistory` (paging, type, sort), `useMyDeposits`, `useCreateDeposit`. Also `useDepositDetail` and `useUploadPaymentProof` in `payment/hooks/usePayment.ts`, and `getProofUrl` (this one resolves relative URLs more correctly than the inline code in `WalletProofTable`).
- **Mantine:**
  - Layout and controls: `Tabs` (`variant="default"`), `Paper withBorder`, `Accordion` or a custom `<details>`, `Pagination`, `Select`, `Skeleton`.
  - Modal: `Modal centered radius="md"` with `NumberInput` (`thousandSeparator=","`, `min`, `step`), and `Button`.
  - Mantine `CopyButton` for the mockup's copy-inline button.
  - A `Group` of `Button variant="default"` for the preset chips.
- **Shared helpers:** `lib/deposit-display.ts` (`WALLET_COPY`, `getDepositDisplay`, `depositDetailHref`), `wallet-transaction.types.ts` (`TYPE_LABELS`, `TYPE_COLORS`, `formatDateTime`), `components/ui/LoadingSkeleton`, `WalletRowDetailAction`.
- **Layout and colour tokens:** `bg-surface-app`, `border-border-app`, `text-text-muted`, `bg-success-soft` / `danger-soft` / `warning-soft` / `info-soft` (used in `PaymentView`), `tabular-nums`.
- **Constants:** `MIN_TOPUP_AMOUNT` and `DEFAULT_TOPUP_AMOUNT` in the modal (move to a shared constants file if the presets use them). `SOURCE_DESCRIPTIONS` is server-only today.

Not checked: `design-system/wording/` (canonical copy), the live page in a browser, and the unit prices of packages.