# Brainstorm — Flow rối Intake / Payment / Credit (không phải bug nhỏ)

> Ghi chép session 2026-08-21 — PR #19 `feat/verify-email` (`d26ce16`) làm lộ ra rối flow, không phải bug lẻ. Tài liệu này chỉ ghi khám phá + vấn đề + câu hỏi, chưa chốt quyết định. Dùng làm input để viết lại doc luồng chuẩn sau.

**Trạng thái:** ghi chép — chưa chốt
**Phạm vi:** `apps/api/src/modules/cases/*`, `orders/*`, `wallet/*`, `payments/*`, `apps/web-1/app/dashboard/intake/*`, `team-fit/*`
**Liên quan:** PR #19, `docs/technical-notes/money-credit-completion-model-note.md`, `docs/flows/intake-flow.md`, `docs/flows/case-lifecycle-flow.md`

---

## 1. Bối cảnh trigger

- PR #19 thêm cổng `hasPaymentComplete` vào `T5_ACCEPT` + `402 PAYMENT_REQUIRED` + đổi `createOrder` thành `payment_status=paid` + `intake_pending → intake_ready`.
- Review ban đầu tưởng bug nhỏ "admin duyệt chưa trả tiền". Soi LSP + git history + doc thì thấy 2 trục bị trộn: **stage (intake_pending/ready/submitted)** vs **payment_status (unpaid/paid/not_required)** vs **credit (ledger/case)**.
- User chỉ ra: intake UI không có chọn gói, link cứng `?packageId=pkg_tf_audit`, team-fit mới tạo case tạm — khái niệm "gói free vs có phí" không hiện ra ở intake nhưng backend vẫn nhánh `isFree`.

---

## 2. Khám phá (evidence-backed)

### 2.1 Intake UI cứng packageId, không chọn gói

- `apps/web-1/app/dashboard/page.tsx:33`, `intake/page.tsx:71`, `DashboardEmptyState.tsx:24` đều `href="/dashboard/intake?packageId=pkg_tf_audit"` cứng.
- `intake/page.tsx:181-185` validate `packageId` phải tồn tại trong `/packages` active, sai → Alert đỏ.
- `useIntakeForm.ts:92-99` → `POST /cases` với `package_id`, `POST /cases/:id/intake` khi `caseId` tồn tại (edit).
- `prisma/seeds/seed-packages.ts:37-43` chỉ còn 2 gói active: `pkg_tf_free` (0đ) và `pkg_tf_audit` (39k). Gói 0-3 cũ đã deactivate.
- Kết luận: "chọn gói" không phải UX, là tham số ẩn để định giá và nhánh `isFree`.

### 2.2 Hai đường tạo case khác nhau

| Đường | Code | Package | Giá | `payment_status` lúc tạo | `user_facing_stage` lúc tạo | Ghi chú |
|---|---|---|---|---|---|---|
| Team-fit lưu AI | `save-team-fit.usecase.ts:83-111` `isFree = price===0` | `pkg_tf_free` (default) hoặc `pkg_tf_audit` nếu truyền | 0 / 39k | `paid` nếu free, ngược lại do `createCaseAndReport` quyết | `submitted` nếu free, `intake_pending` nếu paid | Tạo case tạm để lưu report, chưa phải intake đầy đủ |
| Intake tạo hồ sơ | `create-case.usecase.ts:94`, `case.repository.ts:181-183` `isFree = lockedPrice===0` | `pkg_tf_audit` cứng | 39k | `unpaid` | `intake_pending` | intake data đã kèm `rawBody` ngay lúc tạo |

→ Intake luôn paid-package, luôn `unpaid` lúc mới tạo. `isFree` chỉ thiết thực cho team-fit.

### 2.3 Stage vs Payment là 2 trục trực giao, nhưng code đang trộn

- `case-machine.ts` + `transition.types.ts:34-55`: `TARGET_STAGE` `T2_SUBMIT_INTAKE → submitted`, `T16_EDIT_INTAKE → intake_ready`, `T5_ACCEPT → under_review`. Guard `hasPaymentComplete` mới thêm vào T5 (PR 19) là đúng trục payment, nhưng `create-order.usecase.ts:169-170` lại lái trục stage: `if (stage===intake_pending) stage=intake_ready` khi mua.
- `submit-intake.usecase.ts:218-220`: `stage===intake_ready ? T16_EDIT : T2_SUBMIT`. Nghĩa là `intake_ready` + submit lần nữa = ở lại `intake_ready`, không lên `submitted`. Nếu mua trước khi nộp (PR 19 đẩy sang `intake_ready`), lần nộp tiếp theo kẹt.
- `money-credit-completion-model-note.md#5.3` đã chốt: "Mua credit KHÔNG đổi stage, KHÔNG đẩy vào hàng đợi. Chỉ T2 mới vào `submitted`." PR 19 vi phạm chốt này.

### 2.4 Tiền có 3 lớp, đã chốt nhưng chưa phản chiếu vào flow intake

- `money-credit-completion-model-note.md#1-2`: `VND ví → Credit/Case (ledger) → trừ khi T11`. `payment_status` là tem hệ quả của mua credit, không phải số dư ví. `hasCredit` check `creditBalance>=1`, `hasPaymentComplete` check `paid/not_required`. T5 cũ chỉ check credit → lọt duyệt chùa.
- Order cũ (`origin/dev:create-order.usecase.ts`) chỉ `wallet.withdraw + creditLedger.create`, không đụng `payment_status`/`stage`. Nên tem mãi `unpaid` dù đã trả — đó là bug gốc khiến cổng mới nếu không kèm dán tem sẽ chặn luôn hồ sơ đã trả.

### 2.5 Lịch sử intake_pending/ready

- `git log 0616700` "allow editing intake before admin approval" thêm `intake_ready` để cho sửa trước duyệt, lock sau duyệt. Không liên quan payment.
- `payment-verification-flow.md` đã deferred — flow verify chuyển khoản thủ công bỏ, giờ chỉ còn wallet/orders.

---

## 3. Vấn đề lớn hơn bug nhỏ (tổng hợp)

1. **Trộn trục:** Payment (tem) bị dùng để lái stage (intake_ready). Hai trục phải độc lập.
2. **Thứ tự không rõ:** Intake trước hay trả tiền trước? Doc cũ nói song song (nạp trước vẫn được, không đổi stage), PR 19 ép trả → ready → mới nộp, mâu thuẫn.
3. **Kẹt intake:** Mua trước khi nộp → `intake_ready` → submit chọn `T16_EDIT` → kẹt `intake_ready` mãi, không tới `submitted` để duyệt.
4. **Khái niệm gói mờ:** UI không cho chọn nhưng backend vẫn nhánh `isFree`. Người đọc tưởng "không có gói free/paid" nhưng code vẫn có, gây hiểu nhầm khi review PR 19.
5. **Team-fit vs Intake lẫn:** Cùng bảng `case` nhưng một bên free tạm, một bên audit 39k. Chưa rõ khi nào team-fit case được upgrade sang audit, `upgrade-package.usecase.ts` chỉ cho `pkg_tf_audit` nhưng chưa nối vào flow intake.
6. **Tem paid gắn với mua credit có đúng?** Nếu coi "trả tiền = mua credit" thì đúng. Nếu sau này có trả tiền riêng (chuyển khoản, admin verify) thì lại sai — chưa chốt.

---

## 4. Câu hỏi mở (chưa chốt, cần quyết)

**Q1 — Thứ tự chuẩn:**
- A: Intake → Nộp (`submitted`) → Trả (mua credit) → Duyệt
- B: Intake → Trả → Nộp → Duyệt
- C: Song song, không ép thứ tự, duyệt cần `submitted + paid + credit`

**Q2 — Tem paid định nghĩa:**
- Tem = hệ quả của mua credit (hiện PR 19)?
- Hay tem = verified payment (ví/transfer) độc lập, credit mua riêng sau?
- Nạp ví nhưng chưa mua credit có tính đã trả không?

**Q3 — intake_pending vs intake_ready có cần 2 trạng thái?**
- Giữ 2 để phân biệt "mới tạo" vs "đã sửa" (cho phép sửa trước duyệt)?
- Hay gộp thành `draft → submitted` (YAGNI, sửa khi chưa duyệt là được, không cần 2 stage)?
- Nếu giữ, ai được phép chuyển sang `intake_ready` — chỉ T16 hay cả mua credit?

**Q4 — Gói team-fit free có nên tồn tại chung bảng case?**
- Giữ chung nhưng filter admin queue chỉ `submitted` (hiện FE bucket `intake_pending` riêng)?
- Hay tách type `team_fit_report` vs `audit_case` rõ ràng?

**Q5 — Sửa PR 19 thế nào cho không kẹt?**
- Chỉ dán tem `paid`, bỏ nhảy stage (đúng doc 5.3)?
- Hay giữ nhảy stage nhưng sửa `submitIntake` để `intake_ready → T2 → submitted`?

---

## 5. Rủi ro nếu không làm rõ

- Giữ trộn trục → flow mới nhìn "fix" nhưng tạo kẹt intake, QA khó phát hiện vì chỉ kẹt khi mua trước khi nộp (path ít test).
- Giữ 2 trục lẫn → doc và code lệch, người mới đọc `money-credit-completion-model-note` sẽ hiểu sai PR 19.
- Không chốt Q2 → sau này thêm phương thức trả khác (bank transfer) sẽ đụng tem `paid` hiện tại.

---

## 6. Next steps đề xuất (chưa làm)

- [ ] Chốt Q1-Q5 trong 1 session ngắn (30') với owner, ghi vào `docs/flows/case-lifecycle-flow.md` + `intake-flow.md`
- [ ] Viết lại `money-credit-completion-model-note.md#5.3-5.4` cho khớp quyết định mới, bỏ đoạn deferred payment nếu không dùng
- [ ] Sửa PR 19: giữ cổng T5 + dán tem, bỏ/thay nhảy stage, thêm test `intake_pending → mua → nộp → submitted` và `mua trước nộp` không kẹt
- [ ] Làm rõ `upgrade-package` có phải cầu nối team-fit → audit không, hay bỏ

---

*Ghi chú: Tài liệu này chỉ ghi chép, không quyết. Mọi thay đổi code sau phải bám doc đã chốt lại.*
