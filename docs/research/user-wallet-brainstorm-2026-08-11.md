# User Wallet & Money Architecture — Brainstorm (2026-08-11)

**Mục đích:** Phân tích vấn đề tiền bạc hiện tại, chọn hướng thiết kế mới, chuẩn bị đầu vào cho plan User Wallet (plan riêng, độc lập với workflow-engine-refactor).

**Nguồn:** Phiên brainstorm 2026-08-11, dựa trên code thật (cavecrew-investigator + explore verify) + `note.txt` (tầm nhìn sản phẩm).

**Research bổ sung:** `docs/research/wallet-schema-research-2026-08-11.md` — double-entry ledger schema, service catalog 3 tables, pending window analysis, concurrency pattern.

> **Trạng thái triển khai (2026-08-11, cùng ngày):** Phần lõi ví VND đã ship — module `apps/api/src/modules/wallet/` 4 routes (`/api/wallet/balance`, `/history`, `/topups`, `/purchase-credits`) + Prisma `UserWallet`/`WalletTransaction`/`WalletTopup` + UI `/dashboard/wallet` (số dư, lịch sử, nạp tiền SePay QR) + nav "Ví của tôi". Phần chưa làm: `service_types`/`service_packages`/`service_pricing` catalog, refund về ví khi case hủy, migrate `credit_ledgers` cũ. Tài liệu bên dưới vẫn là thiết kế tham chiếu.

---

## 1. Hiện trạng — Dòng tiền đang chạy thế nào

Hệ thống hiện tại: credit gắn theo **case** (không theo user). Mỗi case có 1 "quỹ" riêng. Dòng tiền:

```
Học viên tạo payment → SePay webhook auto-verify (hoặc upload proof → admin xác nhận fallback) → ghi +credit vào case đó
     ↓
Supporter nộp output (T11) → -1 credit khỏi case
     ↓
Admin veto (T13) → ghi sổ "refund" về 0 (chỉ ghi sổ, KHÔNG trả tiền thật)
Admin reject (T12) → credit không đụng tới (case đóng, credit nằm chết)
User hủy case (T15) → chưa có code xử lý
```

**Điểm yếu cốt lõi:** credit là "vật phẩm gắn vào case" — không phải "tiền trong ví".

### Gotchas phát hiện khi điều tra code (2026-08-11)

| #   | Gotcha                                                                                     | File:line                                                                                  |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| G1  | SePay dedup dùng in-memory `Set` — restart server là mất cửa sổ dedup                      | `sepay-webhook.usecase.ts:35`                                                              |
| G2  | `requireCredits()` silently skip nếu `credit_ledgers` table chưa tồn tại (P2021 fallback)  | `case.types.ts:84-87`                                                                      |
| G3  | `payment_status` có giá trị thứ 4 `"not_required"` — FE `caseRequiresPayment` không handle | `ai-engine.routes.ts:103`                                                                  |
| G4  | Veto idempotency key `veto_{caseId}_{Date.now()}` — millisecond collision possible         | `veto-case.usecase.ts:46`                                                                  |
| G5  | Giá 39,000 VND hardcode 3 chỗ, không từ DB                                                 | `CreditQuantityModal.tsx:10`, `upgrade-package.usecase.ts:10`, `payment.repository.ts:195` |

**Nguồn:** `@explore` investigation 2026-08-11 — toàn bộ claim trong brainstorm được cross-check với code thật.

---

## 2. 5 Vấn đề cụ thể

| #      | Vấn đề                             | Hậu quả thực tế                                                                                                              |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **P1** | Credit chết trong case bị hủy      | User nạp 39k, case bị từ chối trước khi dùng → tiền mất, không dùng được cho case khác                                       |
| **P2** | "Refund" không trả tiền thật       | Veto (T13) chỉ reset số về 0 trong DB — không có luồng qua cổng thanh toán SePay                                             |
| **P3** | Không chuyển credit giữa các case  | 1 user có 3 case: case A thừa 5 credit, case B thiếu — không giải quyết được                                                 |
| **P4** | Chỉ có 1 loại service (39k/credit) | Không có chỗ cho AI đánh giá (gói 50-80k), combo AI+supporter (gói VIP 100-200k), team fit tặng thêm...                      |
| **P5** | Payment vẫn phụ thuộc người        | SePay webhook đã auto-verify, nhưng proof upload vẫn cần admin duyệt — chưa có flow tự động hoàn toàn cho AI instant service |

---

## 3. Các hướng đã cân nhắc

### Hướng A: Giữ per-case, thêm chuyển credit (vá tạm)

Giữ credit từng case. Cho phép tái dùng credit case cũ khi resubmit. Thêm cổng hoàn tiền qua SePay.

- **Bỏ vì:** không giải quyết P3 (chuyển credit), P4 (nhiều gói), P5 (tự động). Chỉ trì hoãn vấn đề.

### Hướng B: Bán gói dịch vụ cố định (Option C trước đó)

Không bán credit. Bán gói: "5 lượt AI", "3 lượt supporter", combo "AI + supporter 2 lượt".

- **Bỏ vì:** đã thử trong quá khứ. User bị kẹt trong gói (dùng 3/5 lượt → thừa 2), phân vân giữa các gói (giá chênh cao → không biết chọn gì), không linh hoạt đổi ý giữa chừng.

### Hướng C: Ví user chứa credit (Option A trước đó)

Chuyển credit từ per-case → per-user. Mỗi user có 1 ví credit. Case trừ từ ví user.

- **Bỏ vì:** credit vẫn là khái niệm trung gian trừu tượng ("1 credit = gì?"). User vẫn phải hiểu thêm 1 lớp quy đổi. Không khác Hướng D về mặt kỹ thuật nhưng tệ hơn về UX.

---

## 4. Hướng chọn: User Wallet VND — "Nạp tiền = có điểm"

### Nguyên lý

| Ý                              | Chi tiết                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| **1 đơn vị = 1 VND**           | Không có credit, không có quy đổi. Nạp 100,000đ → ví có 100,000đ                                   |
| **Ví gắn user**                | 1 user = 1 ví. Tiền không chết theo case. Case hủy → tiền còn nguyên                               |
| **Giá dịch vụ = số VND**       | AI đánh giá = 50,000đ. Supporter chấm = 39,000đ. VIP combo = 150,000đ. Cứ đặt giá, hệ thống tự trừ |
| **Hoàn tiền = cộng ngược ví**  | Reject (chưa dùng) → hoàn 100%. Veto (đã dùng) → hoàn theo chính sách. Ghi rõ trong lịch sử ví     |
| **Mở gói mới = thêm dòng giá** | Không cần sửa architecture — mỗi service mới chỉ cần 1 dòng config giá                             |

### Dòng tiền mới

```
User nạp 200,000đ qua SePay → webhook xác nhận → ví +200,000đ
     ↓
Tạo case & chọn dịch vụ → hệ thống trừ tiền từ ví:
  • AI đánh giá:        -50,000đ
  • Supporter chấm:     -39,000đ
  • VIP AI+Supporter:  -150,000đ
  • Team fit bonus:     +0đ (platform tặng)
     ↓
Admin từ chối case (T12) → +39,000đ về ví (chưa dùng → hoàn toàn bộ)
Admin veto       (T13) → +39,000đ về ví (đã dùng → hoàn theo chính sách)
     ↓
User tạo case mới → dùng tiếp tiền trong ví
```

### Tại sao dùng VND trực tiếp, không trung gian

- **User KHÔNG phải học** "credit là gì". Họ biết tiền — ai cũng biết tiền.
- **Không có ma sát quy đổi.** Không cần "1 credit = ? đồng". Không cần "giá credit thay đổi thì sao".
- **Minh bạch với cơ quan thuế / kế toán.** Mỗi giao dịch là số tiền thật, dễ đối chiếu với tài khoản ngân hàng.
- **Khuyến mãi rõ ràng.** "Nạp 200k tặng 20k" — ai cũng hiểu. Không cần "tặng 2 credit".

---

## 5. Kiến trúc đề xuất

### Models (DB)

> **Đã nghiên cứu chi tiết:** `docs/research/wallet-schema-research-2026-08-11.md` — Prisma schema đầy đủ, service catalog 3 tables, concurrency pattern.

```
user_wallets
  - id (uuid)
  - user_id (unique, 1 user 1 ví)
  - balance (int, VND — cached, updated atomically trong tx)
  - created_at / updated_at

wallet_transactions
  - id (uuid)
  - wallet_id → user_wallets
  - type: deposit | withdrawal | refund | adjustment | migration
  - amount (int, VND — dương = vào ví, âm = ra ví)
  - balance_before (int)
  - balance_after (int)
  - source_type: payment | case_consume | admin_refund | platform_bonus | migration
  - source_id: (payment_id | case_id | null — truy xuất ngược)
  - idempotency_key (unique — chống trùng giao dịch)
  - metadata (jsonb)
  - created_at

service_types          ← MỚI: phân loại dịch vụ (ai_review, supporter_review, vip_combo, team_fit)
service_packages       ← SỬA: thêm service_type_id FK, giữ name + features
service_pricing        ← MỚI: lịch sử giá per package (is_current, previous_price, changed_by)
```

**Ghi sổ kép:** mỗi giao dịch ghi `balance_before` + `balance_after`. Không bao giờ UPDATE balance trực tiếp — luôn INSERT transaction + UPDATE wallet.balance trong cùng 1 DB transaction.

**Concurrency:** `SELECT ... FOR UPDATE` lock wallet row khi spend — ngăn 2 case trừ tiền cùng lúc vượt số dư. Không cần `version_no`.

### Service

```
WalletService
  ├─ deposit(userId, amount, idempotencyKey)    → +amount
  ├─ withdraw(userId, amount, serviceType, caseId, idempotencyKey) → -amount
  ├─ refund(userId, amount, reason, caseId, idempotencyKey)        → +amount
  ├─ getBalance(userId) → int
  └─ getTransactionHistory(userId, limit, offset) → Transaction[]

Dependency: PrismaClient (gọi trong tx), event bus (emit WALLET_CHANGED sau commit)
```

### Tích hợp với CaseTransitionService (plan workflow-engine)

Thay vì guard `hasCredit` đọc `credit_balance` từ case ledger, guard mới sẽ gọi:

```
WalletService.getBalance(actorId) → nếu >= servicePrice → pass
```

Action `subtractCredit` trong executor (phase-03) sẽ gọi:

```
WalletService.withdraw(actorId, servicePrice, 'supporter_output', caseId, idempotencyKey)
```

Action `refundCredit` (T13) sẽ gọi:

```
WalletService.refund(actorId, servicePrice, 'admin_veto', caseId, idempotencyKey)
```

---

## 6. Kế hoạch chuyển đổi (Migration)

### Dữ liệu cũ → mới

1. Tạo bảng `user_wallets` + `wallet_transactions` (migration mới, `--create-only`)
2. Chạy script: với mỗi case đang có credit_balance > 0 → cộng `balance * 39,000` vào ví của chủ case, kèm 1 transaction loại `migration`
3. **Kiểm tra trên clone production DB trước** — sai 1 case là mất tiền user thật
4. Sau khi xác nhận đúng → chạy production
5. Giữ bảng `credit_ledgers` cũ (read-only) để audit — không xóa
6. Gotchas G1-G5 trong §1 được fix bởi kiến trúc mới (xem `wallet-schema-research` §5)

### Song song cũ & mới

Tương tự workflow-engine (symflow + XState song song): trong giai đoạn chuyển đổi, cả 2 hệ thống credit cùng chạy. Case mới → dùng ví. Case cũ → dùng credit ledger. Khi tất cả case cũ đóng → xóa credit_ledgers.

### Rollback

Nếu migration ví gặp lỗi: revert code, quay lại credit ledger cũ. Ví đã tạo KHÔNG ảnh hưởng (code cũ không đọc ví).

---

## 7. Liên quan đến plan workflow-engine-refactor

Plan workflow-engine-refactor đang implement engine chuyển trạng thái — KHÔNG đụng đến tiền. Tuy nhiên:

- Guard `hasCredit` + action `subtractCredit`/`refundCredit` trong plan HIỆN TẠI đọc/ghi từ `credit_ledgers` (case-level)
- Khi có User Wallet, 3 chỗ này sẽ chuyển sang gọi `WalletService`
- **Khuyến nghị:** trong plan workflow-engine, ghi chú "credit logic sẽ migrate sang User Wallet (plan sau)" — tránh code xong rồi sửa lại

### Điều chỉnh trong plan workflow-engine

| Chỗ                     | Thay đổi (ghi chú, không code)                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| Guard `hasCredit`       | Ghi chú: hiện đọc `event.data.creditBalance` từ case ledger; sau wallet → gọi `WalletService.getBalance()` |
| Action `subtractCredit` | Ghi chú: hiện ghi `credit_ledgers`; sau wallet → gọi `WalletService.withdraw()`                            |
| Action `refundCredit`   | Ghi chú: hiện ghi `credit_ledgers`; sau wallet → gọi `WalletService.refund()`                              |
| T5/Accept guard         | Ghi chú: hiện check `hasCredit` trên case ledger; sau wallet → check ví user                               |

Không cần sửa code workflow-engine — chỉ thêm comment `// TODO: migrate to WalletService after user-wallet plan`.

---

## 8. Câu hỏi mở — ĐÃ CHỐT (2026-08-11)

| #   | Câu hỏi                   | Quyết định                                                                                                               | Lý do                                                                                                                          |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Giá dịch vụ lưu ở đâu?    | **DB — 3 tables:** `service_types` → `service_packages` → `service_pricing`                                              | Linh hoạt, audit trail đầy đủ, thêm service mới = INSERT không migration. Xem `wallet-schema-research` §2.                     |
| 2   | Pending balance?          | **Không cần.** SePay webhook auto-verify → vào ví ngay                                                                   | Bank transfer là push payment, không thể chargeback. Pending chỉ có ý nghĩa với card network. Xem `wallet-schema-research` §3. |
| 3   | Hoàn tiền thật qua SePay? | **Chỉ refund nội bộ (VND về ví).** Không rút về ngân hàng                                                                | MVP — không cần KYC doanh nghiệp + SePay refund API. Tiền ở trong hệ thống.                                                    |
| 4   | Số dư âm?                 | **Không.** balance < price → chặn                                                                                        | Không nợ xấu. User nạp thêm dễ qua SePay.                                                                                      |
| 5   | Audit trail cho admin?    | **Đã có** `getAdminStatsUseCase` + payment verification table. Thêm API list wallet_transactions (filter user/case/date) | Dashboard cơ bản đủ cho MVP. Mở rộng sau nếu cần.                                                                              |

---

## 9. Ước lượng

| Hạng mục                                          | Effort   |
| ------------------------------------------------- | -------- |
| Plan User Wallet (document)                       | ~2h      |
| Migration + schema                                | 2h       |
| WalletService                                     | 3h       |
| Sửa guard/action trong workflow-engine (tích hợp) | 2h       |
| Sửa FE (hiển thị ví, lịch sử giao dịch)           | 3h       |
| Script migrate dữ liệu cũ + test clone DB         | 2h       |
| Test (unit + integration + concurrent)            | 3h       |
| **Tổng**                                          | **~17h** |

---

## 10. Tiếp theo

1. ~~Chốt các câu hỏi mở~~ ✅ Đã chốt 2026-08-11 (xem §8)
2. Tạo plan `plans/user-wallet/` — triển khai sau khi workflow-engine-refactor hoàn thành
3. Ghi chú tích hợp vào `phase-03-case-transition-service.md` (guard/action credit → wallet)
4. Cập nhật `project-context.md` / PRD — thêm mô tả "ví người dùng" vào product scope
