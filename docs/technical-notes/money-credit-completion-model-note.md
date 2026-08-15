# Technical Note: Money — Credit — Completion Model

> Xác nhận logic chuẩn đã verify từ code (2026-08-15). Dùng làm cơ sở để viết lại doc hệ thống (project-context, flows, requirements, system-architecture). Mọi mục có citation file:line — kiểm tra lại nếu code đổi.

## 1. Ba tầng tiền tách bạch

```
Tiền thật (VND) ──nạp──▶ UserWallet (VND) ──mua──▶ CreditLedger (credit/case) ──trừ khi supporter nộp output (T11)
```

**Ví VND và credit là 2 thứ khác nhau.** Credit không phải ví tiền, không phải tiền thật — là ledger theo case mua bằng VND.

### 1.1 Wallet (VND)

- Entity: `UserWallet` (`prisma/schema.prisma:183-195`): `balance Int`, `currency "VND"`, map `user_wallets`
- Ledger: `WalletTransaction` (`schema.prisma:197-216`) — append-only, `balance_before/after`, type enum `deposit | withdrawal | refund | adjustment | migration | service_payment`
- Nạp vào (2 đường, cùng đích `walletService.deposit`):
  - SePay webhook tự động: `sepay-webhook.usecase.ts:76` — match `transfer_content` vs SePay `code` (regex CR-prefix `:111-114`)
  - Admin verify manual: `verify-deposit.usecase.ts:38-47`
- `WalletTopup` legacy — `@deprecated`, route trả 410 Gone (`wallet.routes.ts:55-63`)

### 1.2 Credit (per case)

- Entity: `CreditLedger` (`prisma/schema.prisma:606-622`): **`case_id` bắt buộc — credit theo case, không theo user**; `amount ±1`; type `purchase | consumption | refund`
- Mua qua Orders: `create-order.usecase.ts` — `service_type: "credit_audit"`, giá server-side từ package (client KHÔNG set được giá, chống fraud), withdraw VND từ ví (`:123-126`) → `creditLedger.create(amount: +quantity, type: 'purchase')` (`:141-152`)
- Giá chuẩn: **39,000 VND/credit** (`prisma/seeds/seed-packages.ts:39-42`)
- Legacy: `purchase-credits.usecase.ts` deprecated; dual-write ẩn sau flag `USE_ORDER_DOMAIN`/`DUAL_WRITE_*` — cleanup phase-09 pending

## 2. Credit tiêu thụ — khi nào, bao nhiêu

- **Điểm trừ DUY NHẤT: transition T11_SUBMIT_OUTPUT** — supporter nộp output. `case-machine.ts:138-142` (`actions: ['subtractCredit', 'lockPrice']`)
- Thực thi: `case-transition.service.ts:102-126` — `amount: -1`, **đúng 1 credit / 1 audit round** (mỗi lần supporter nộp output, kể cả revision), idempotency key `consume-{unitCode}-{caseId}`, trùng → 409 `DUPLICATE_CREDIT_CONSUMPTION`
- **KHÔNG trừ theo tài liệu, KHÔNG trừ khi download** — Documents module zero credit logic; download là Cloudinary signed URL
- UI ngữ nghĩa chuẩn: "Mỗi credit tương ứng với một lượt đánh giá từ Supporter" (`CreditQuantityModal.tsx:135`)

## 3. Credit và state machine — payment gate, không auto-close

- Guard `hasCredit` (`case-machine.ts:27-30`): `lockedPrice === 0` (case free) → skip; ngược lại cần `creditBalance >= 1`
- Áp cho đúng 3 transition: **T5_ACCEPT** (`:69-72`), **T11_SUBMIT_OUTPUT** (`:138-142`), **T3_RESUBMIT_AFTER_REJECT** (`:190-194`)
- **Hết credit → transition bị chặn → case đứng im ở state hiện tại.** KHÔNG có transition nào phản ứng với balance=0, KHÔNG auto-close. "Credit hết = hoàn tất case" là HIỂU SAI — không tồn tại trong machine
- Chat gate (D16): hết credit → `CHAT_LOCKED` khóa **24h** (`chat-access.ts:37-42`, `CHAT_LOCK_WINDOW_MS`), sau 24h chat tự mở lại kể cả balance=0. Case `closed`/`rejected`/free → chat đóng (`:25-27`)

## 4. Refund — về VND, không hoàn credit

- Trigger: **T13_VETO** (admin, trong 48h từ khi tạo case): `case-machine.ts:114-118,143-147`, action `refundCredit`
- Thực thi: `case-transition.service.ts:128-135` → `walletService.refund(ownerId, lockedPrice, 'admin_veto', ...)`
- **Hoàn `locked_price` VND về ví**, tạo `WalletTransaction type: 'refund'`. **Credit đã tiêu KHÔNG được hoàn lại** — không code nào tạo credit-ledger `type: 'refund'`
- T12_REJECT (triage, trước khi trả tiền) → không refund vì chưa trừ gì

## 5. Logic hoàn thành (chuẩn cho bug #5 — đang chốt)

Credit hết chỉ nghĩa "hết lượt review". Hoàn thành case do deliverable + user quyết định:

| Hành động user sau khi nhận report | Tín hiệu | Xử lý chuẩn |
|---|---|---|
| Xác nhận hoàn thành (T17) | Xong | → `done`, tick rõ 2 phía |
| Gửi bản tài liệu ĐÃ SỬA của user lên (round mới) | Muốn tiếp tục | → `supporter_working`; **không trừ credit**; supporter đọc bản mới → nộp báo cáo mới (T11) → **lúc này mới trừ 1 credit** |
| Im lặng 7 ngày | Không tín hiệu | → auto-done (cron; interim admin force-close) |
| Mua credit cho case đã done | Muốn tiếp tục lâu dài dự án | ✅ **CHỐT B: mua credit cho case done = tự động reopen** |

**Vòng lặp round chuẩn (user tự sửa tài liệu của mình, KHÔNG yêu cầu supporter sửa báo cáo):**

```
supporter nộp báo cáo (T11, trừ 1 credit) → report_ready
  └─ user ĐỌC báo cáo → tự SỬA tài liệu của user → gửi bản đã sửa lên (KHÔNG trừ credit)
       └─ supporter đọc bản mới nhất → viết báo cáo góp ý tiếp → nộp (T11, trừ 1 credit) → report_ready
            └─ lặp lại đến khi user xác nhận hoàn thành (T17) hoặc im lặng 7 ngày
```

- Mỗi round = 1 credit, trừ **tại thời điểm supporter nộp output** — machine hiện tại đã đúng, không đổi
- Hiện tại supporter tự gọi T14 → done (`complete-case.usecase.ts:15-19`) — lệch chuẩn, đang sửa theo bug #5
- Bug UI kèm theo: `supporter/page.tsx:25` filter `report_ready_to_publish` vào tab "Đã hoàn thành" (sai — là "đã giao")

### 5.1 Reopen (quyết định B — chốt 2026-08-15)

Lý do: user có thể tiếp tục lâu dài dự án của họ trên cùng 1 case (lịch sử chat, doc, đánh giá giữ nguyên).

**Luồng chuẩn:**

```
done ──user mua credit cho case này (order)──▶ REOPEN ──▶ supporter_working
                                                        ├─ user tải tài liệu mới lên
                                                        ├─ supporter đọc → viết → nộp output (T11, trừ 1 credit round mới)
                                                        └─ về report_ready_to_publish → chờ user confirm lại
```

- Reopen = bắt đầu audit round mới: user tải tài liệu mới → supporter đọc, viết, gửi tài liệu đánh giá
- **Không cần admin duyệt lại** — case đã accept + supporter đã gán; mua credit = tín hiệu đủ (chốt 2026-08-15)
- Mỗi round mới = 1 credit, nhất quán mô hình hiện tại (T11 trừ credit mỗi lần nộp output)
- Chat tự mở lại khi rời `done` (chat gate theo stage)
- Document lifecycle: round mới = unit version mới (`vNN`) — khớp model `case → checkpoint → version → assessment`

### 5.2 UX vòng 2 — bug #3 (chốt 2026-08-15)

Mục tiêu: user hiểu rule "mỗi lượt đánh giá = 1 credit" đúng thời điểm. Hai điểm chạm duy nhất (KISS — bỏ confirm modal):

1. **Banner user — stage `report_ready`** (chính): trên khu upload/chat
   - Có credit: "Supporter đã gửi báo cáo đánh giá. Muốn tiếp tục cải thiện? Sửa tài liệu rồi gửi lại — mỗi lượt đánh giá mới = 1 credit."
   - Hết credit: banner đỏ + nút "Mua credit" (tái dùng `CreditPanel`/`CreditBalanceCard` sẵn có) — 1 component, 2 trạng thái
2. **Message supporter — T11 bị chặn vì user hết credit**: thay lỗi generic 400 `INVALID_TRANSITION` bằng thông báo rõ: "Sinh viên chưa đủ credit. Không thể nộp báo cáo — yêu cầu sinh viên mua thêm credit."

KHÔNG thêm confirm khi user gửi bản đã sửa (gửi bản sửa free — không có gì để chặn).

### 5.3 Bug #9 — paid nhưng chưa nộp intake (chốt 2026-08-15)

- **Mua credit KHÔNG đổi state case, KHÔNG gửi cho admin duyệt** — order chỉ trừ ví VND + tạo creditLedger. Case chỉ vào hàng đợi duyệt khi user nộp intake (T2 → `submitted`)
- Nạp credit trước intake = hợp lý, giữ nguyên — không chặn
- Gốc bug: `useAdminCases.ts:16` gọi `/admin/cases` không filter → list hiện mọi state
- Fix (chỉ code, không đổi flow):
  1. Admin list: hàng đợi duyệt chỉ hiện `submitted`/`triage_pending`; case chưa nộp intake tách mục "Chờ sinh viên nộp hồ sơ"
  2. Admin detail: `intake_snapshot = null` → empty-state "Sinh viên đã thanh toán nhưng chưa nộp hồ sơ" + vô hiệu nút duyệt

### 5.4 Bug #16 — kick user khi admin xóa case (chốt 2026-08-15)

- Hiện trạng: `delete-case.usecase.ts:36` hard-delete, không emit event, không publish realtime; FE không xử lý deleted-state
- Chốt: **đẩy tín hiệu `CASE_DELETED` vào kênh `chat:{caseId}`** (tái dùng kênh sẵn có — không thêm kênh mới)
- FE: nhận tín hiệu → toast "Hồ sơ đã bị xóa" + redirect `/dashboard` + invalidate queries; fallback: poll `useCaseDetails` nhận 404 → redirect
- Không thêm notification riêng (toast đủ); supporter xem case bị xóa cũng bị kick cùng cơ chế

### 5.5 Bug #1 — reassign supporter & SLA (chốt 2026-08-15)

- **SLA đếm tiếp, KHÔNG reset khi reassign** — SLA là cam kết "bao giờ có kết quả" với user, không phụ thuộc ai làm; user không quan tâm supporter nào bận
- **Reassign tự do**: admin đổi supporter sớm nhất có thể khi biết supporter bận — không có cửa sổ chờ bắt buộc (code hiện tại đã cho phép: `assign-supporter.usecase.ts:45-47` chỉ chặn final stage)
- **Thêm cảnh báo SLA**: admin list hiển thị SLA deadline + đánh dấu sắp hết hạn/quá hạn
- Lịch sử assign đã có: `caseEvent "supporter_assigned"` + metadata + auditLogger (`case.repository.ts:369-379`)
- **User hủy case**: giữ nguyên 2 đường đã có guard — xóa khi stage `submitted` (chưa duyệt, `delete-case.usecase.ts:27-33`); đóng (T15_CANCEL) ở `report_ready`. Không mở rộng stage mới
- Kèm rule refund credit dư — xem mục 8

## 6. Bất nhất đã phát hiện (cần xử lý khi viết lại doc)

1. **Free-case edge**: guard `hasCredit` skip khi `lockedPrice === 0` nhưng action `subtractCredit` vẫn throw `NO_CREDITS` 402 khi balance < 1 (`case-transition.service.ts:110`) — free case đạt T11 sẽ fail ở action. Chưa rõ cố ý hay bug
2. `NO_CREDITS` 402 thực tế không reachable ở paid flow (guard chặn trước, trả 400 `INVALID_TRANSITION`) — chỉ xảy ra ở edge trên
3. ~~Refund full `lockedPrice` không prorated theo credit đã tiêu~~ ✅ xem mục 8

## 7. Chưa rõ / cần quyết định

- ~~Mua credit cho case done: chặn (A) hay reopen (B)?~~ ✅ **CHỐT: B (reopen)** — xem mục 5.1
- ~~Reopen có cần admin duyệt lại không?~~ ✅ **CHỐT: không cần** — case đã accept, supporter đã gán
- ~~N ngày auto-done = bao nhiêu? (đề xuất 7)~~ ✅ **CHỐT: 7 ngày** — sau 7 ngày im lặng ở `report_ready_to_publish` → auto-done (cron; interim admin force-close)
- ~~Revision sau delivery có free không?~~ ✅ **CHỐT: user gửi bản đã sửa KHÔNG trừ credit; mỗi lần supporter nộp báo cáo mới = 1 credit** (đúng machine hiện tại — user tự sửa doc của mình, supporter đọc bản mới rồi nộp báo cáo mới)
- ~~Refund credit dư khi case kết thúc~~ ✅ **CHỐT** — xem mục 8

## 8. Refund credit dư khi case kết thúc (chốt 2026-08-15)

> Verify 2026-08-15: hiện chỉ T13_VETO hoàn `locked_price`; T12/T15/delete/supporter-close KHÔNG refund; credit dư đông cứng vĩnh viễn. Scaffolding (`ORDER_REFUNDED`, `OrderStatus:"refunded"`, `createCreditEntry type:'refund'`, UI tab "Hoàn credit") đều dormant.

**Rule chung (common sense):** case kết thúc không trọn vẹn mà user còn credit chưa dùng → **hoàn VND về ví đúng giá mua tại thời điểm mua** (không theo giá hiện tại). Ví dụ: mua 3 credit giá 39k, sau này giá lên 49k, credit còn dư 3 → hoàn 3×39k = 117k VND.

**Chi tiết chốt:**

| Điểm | Quyết định |
|---|---|
| Giá quy đổi | **Đúng giá mua từng credit** (FIFO theo purchase entry + order thực tế — không dùng giá hiện hành, không dùng `locked_price`) |
| Trigger | Các đường kết thúc cần refund: T12 reject, T13 veto, T15 cancel, admin delete, supporter close — nếu `credit_balance > 0` → hoàn số dư |
| T13_VETO hiện tại | Giữ nguyên khoản hoàn `locked_price` (chưa nhận dịch vụ) + hoàn thêm credit dư theo rule mới — 2 khoản độc lập |
| Chống hoàn kép | Idempotency key `refund-credit-{caseId}` (case kết thúc đúng 1 lần) |
| Credit đã tiêu | Không hoàn (đã nhận lượt đánh giá) |

**Nguyên tắc:** user mua dư credit rồi case kết thúc không dùng hết mà giữ = scam tiền user → bắt buộc refund. Chỉ các logic cần refund mới hoàn — case hoàn thành bình thường (done) không hoàn gì.
