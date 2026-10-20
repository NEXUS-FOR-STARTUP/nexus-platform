---
title: "Redesign Ví Nexus (số dư, lịch sử, minh chứng, nạp tiền) theo mockup, giữ Mantine + logic cũ"
description: "Áp hình thức mockup wallet lên /dashboard/wallet: thẻ số dư phẳng, danh sách hàng mở rộng, tabs gạch dưới, chọn nhanh mức nạp; giữ phân trang/sắp xếp server, luồng nạp qua /dashboard/payment, và không dựng dữ liệu API không có."
status: pending
priority: P2
effort: 23h
tags: [frontend, web-1, ux, refactor, wallet]
blockedBy: []
blocks: []
created: 2026-10-19
branch: feat/landing-redesign
---

# Redesign Ví Nexus

Mockup: `design-system/mockups/wallet/` (`REPORT.md`, `index.html`). **Chỉ là đặc tả UX/UI.** Mockup có lỗi riêng (REPORT liệt kê `tx-detail-modal.js` không tồn tại; modal nạp tiền giả lập VietQR + cộng ví) nên không được chép nguyên.

Đọc trước: [gap-register](reports/gap-register.md) (28 mục), [mantine-reuse-map](reports/mantine-reuse-map.md), `research/scout-01-mockup-vs-code.md`, `design-system/wording/pages/wallet.md` (+ `payment.md`; scout chưa đọc), skill filter ở `../261019-1500-case-detail-redesign/reports/skill-filter-taste-minimalist.md`.

## Ground rules

1. Mantine trước; giữ `Tabs`, `Pagination`, `Select`, `Modal`, `NumberInput`, `Skeleton`. Style qua `classNames` + CSS module + biến. Không class vị trí cho `Modal`.
2. Giữ logic: `useWalletBalance`, `useWalletHistory` (page/limit/type/sort server-side), `useMyDeposits`, `useCreateDeposit` (key idempotency tạo lại khi mở, `submittingRef`), `MIN_TOPUP_AMOUNT`, chuyển hướng `/dashboard/payment?pid=`, `?amount=`, `clearAllBuyCreditAfterDepositIntents()`, polling 30s, `getDepositDisplay`, link minh chứng, skeleton/lỗi/trống.
3. **Không dựng dữ liệu API không có.** Mockup hiển thị Tổng đã nạp, Tổng đã dùng, "~3 lượt", số đếm theo loại, lọc 3/7 ngày, trạng thái dòng sổ, tên ngân hàng thu: tất cả thiếu nguồn thật (W-02…W-06). Mặc định: bỏ; thêm bằng plan backend riêng nếu chủ dự án muốn.
4. Mockup thiếu / code thiếu → báo (gap-register) và hỏi; không tự quyết lặng lẽ.
5. File ≤200 dòng (`WalletProofTable` 371 phải tách), style trong CSS module bằng biến, dùng lại `components/ui`, không `apiClient` trong component, không try/catch trong component, không `as any`.
6. Tiền: `formatVndAmount` (`79,000 VND`). Không CP1-CP4 trên UI. Lucide. Tiếng Việt. `size>=sm`. Không shadow nghỉ, không gradient.
7. Ponytail ultra: không thêm tuỳ chọn/abstraction ngoài yêu cầu; logic thuần mới kèm file assert nhỏ.
8. Cổng: `bun run check-types`, `bun run lint`, taste `lint.mjs`, smoke trình duyệt 1440/390 sáng + tối.

## Phản biện mockup (đã quyết trước)

| Mockup | Quyết | Lý do |
|---|---|---|
| VietQR trong modal + "Tôi đã chuyển tiền" | Bỏ | Luồng thật tạo `Deposit` rồi sang trang thanh toán có minh chứng, polling, xử lý từ chối; mockup tự nhận "chưa kiểm chứng" |
| 3 chỉ số phụ ở thẻ số dư | Bỏ | Không có endpoint; cộng client trên 1 trang cho số sai |
| Tab đếm số + lọc 3/7 ngày | Bỏ (có thể thêm bằng backend) | API không hỗ trợ |
| Chip trạng thái trên dòng sổ | Thay bằng chip **loại** | Dòng sổ không có trạng thái |
| Khối ngân hàng (tên, số TK, thụ hưởng) | Bỏ; giữ nội dung CK, mã GD ngân hàng, ghi có, cách xác minh (lazy) | Tài khoản thu là env chung, tài khoản đổi thì dòng cũ sai |
| Bỏ phân trang/sắp xếp | Giữ | Lịch sử không giới hạn |


## Quy ước ghi đè (sau rà soát)
- **Nhánh:** dùng nhánh hiện tại `feat/landing-redesign` (kết quả `git branch --show-current`); đổi nhánh khi bắt đầu code nếu muốn tách.
- **Test:** `AGENTS.md` chỉ cho test ở `apps/api`; web-1 không có runner. Mọi `*.test.ts` nêu trong phase **không commit**: kiểm hàm thuần bằng script tạm (xóa sau), cổng chính là `check-types` + `lint` + smoke trình duyệt. Thiếu hạ tầng test web ghi nhận là khoảng trống, không tự dựng.
- **Viền:** `frontend-ui-rules.md` §6.3 (bắt buộc) đòi viền Card/Paper 1.5px, không phải 1px của mockup. Dùng 1.5px qua biến.
- **Phụ thuộc:** Phase 1 của plan case-detail (token, `UnderlineTabs`, `StatusChip`, `ExpandableList`, `CopyIconButton`, `formatVndAmount`) là tiền đề cho plan này; chạy plan case P1 trước.

## Phạm vi

- **Trong:** `apps/web-1/app/dashboard/wallet/**`.
- **Không đụng:** `app/dashboard/payment/**` (`PaymentView`, `PaymentDepositMeta`, `PaymentBankInfo` chung với trang công khai `/pay/receivable/[token]` của plan pay-later), `lib/deposit-display.ts` (chung với `getReceivableDisplay`). Hai nơi này cũng đang in tiền sai dấu chấm (W-22): liệt kê, Q-W6.
- **Ngoài:** API/DB (trừ khi chủ dự án chọn thêm `GET /wallet/summary`, `groupBy`, `days`), `admin`.

## Cross-Plan Dependencies

| Quan hệ | Plan | Ghi chú |
|---|---|---|
| Phụ thuộc artefact Phase 1 (không dùng `blockedBy` vì field theo cả plan) | [261019-1500-case-detail-redesign](../261019-1500-case-detail-redesign/plan.md) | Cần `UnderlineTabs`, `StatusChip`, `ExpandableList`, `CopyIconButton`, `formatVndAmount`, token `--ui-*` |
| Độc lập | [261019-1510-profile-settings-redesign](../261019-1510-profile-settings-redesign/plan.md) | Không chung file |
| Đã xem, không xung đột | [261016-1530-grant-wallet-funds-pay-later](../261016-1530-grant-wallet-funds-pay-later/plan.md) | Completed. Dòng `adjustment`/`platform_bonus` chỉ thấy ở ví vận hành; không thêm liên kết tới receivable. Không sửa `PaymentView`/nhãn `deposit-display` |
| Độc lập | landing, worker-jobspec | Không chạm |

## Phases

| Phase | Name | Effort | Status |
|---|---|---|---|
| 1 | [Nền ví: kiểu dữ liệu, tiền, hook lazy](./phase-01-wallet-foundation.md) | 3h | Pending |
| 2 | [Khung trang + thẻ số dư](./phase-02-page-shell-and-balance.md) | 2h | Pending |
| 3 | [Lịch sử giao dịch (hàng mở rộng)](./phase-03-transaction-history.md) | 7h | Pending |
| 4 | [Ảnh minh chứng nạp tiền](./phase-04-deposit-proofs.md) | 5h | Pending |
| 5 | [Modal nạp tiền + mức chọn nhanh](./phase-05-topup-modal.md) | 3h | Pending |
| 6 | [QA, hồi quy payment, tài liệu](./phase-06-qa-docs.md) | 3h | Pending |

## Câu hỏi cần chủ dự án quyết

| # | Câu hỏi | Mặc định | Chặn |
|---|---|---|---|
| Q-W1 | Tab loại có số đếm cần endpoint `groupBy`. Bỏ số đếm, hay mở plan backend nhỏ? | Bỏ số đếm | P3 |
| Q-W2 | Lọc khoảng thời gian (3/7 ngày) cần tham số `from`/`days` ở API. Bỏ, hay thêm backend? | Bỏ | P3 |
| Q-W3 | 3 chỉ số phụ (đã nạp / đã dùng / ~lượt) cần `GET /wallet/summary`; `~lượt` còn cần đơn giá gói ổn định. Bỏ, hay thêm backend (không gồm `~lượt`)? | Bỏ | P2 |
| Q-W4 | Dòng nạp tiền mở rộng chỉ hiện dữ liệu của giao dịch (nội dung CK, mã GD ngân hàng, ghi có, cách xác minh), **không** hiện tên ngân hàng/số TK/thụ hưởng (tài khoản thu chung, lấy từ env). Chấp nhận? | Có | P3 |
| Q-W5 | Tab Minh chứng: API chỉ trả deposit **đã có minh chứng**, trần 20, không `total`. Giữ nguyên hành vi (đếm trong mảng đã tải), hay mở rộng API? | Giữ | P4 |
| Q-W6 | Tiền sai dấu chấm còn ở `PaymentDepositMeta`, `ServiceCheckoutModal`, chuỗi lỗi API `wallet.types.ts:30` (chung với trang công khai pay-later hoặc ở API). Sửa trong plan riêng có hồi quy cả hai trang? | Plan riêng | ngoài |
| Q-W7 | `?view=history\|proofs` giữ trong URL (chia sẻ/Back)? Mockup có; code hiện state cục bộ. | Có, qua `useSearchParams` | P2 |

## Verification tổng

`/dashboard/wallet`, `?view=proofs`, `?amount=79000`; ca ví 0 giao dịch, ví nhiều trang, lọc từng loại, mở dòng nạp (lazy deposit) / dòng mua (lazy order), tab minh chứng đủ trạng thái, nạp thử tạo `Deposit` ở DB dev và chuyển sang `/dashboard/payment?pid=`. Hồi quy: trang payment + `/pay/receivable/[token]` không đổi.

## Unresolved

Q-W1..Q-W7; chưa đọc `design-system/wording/pages/wallet.md`, `payment.md`; đơn giá gói (nếu muốn `~lượt`); chưa chạy thử nạp thật (cần DB dev, **không** DB production).
