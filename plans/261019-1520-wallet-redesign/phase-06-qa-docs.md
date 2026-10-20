# Phase 6: QA, hồi quy payment, tài liệu

Priority: P2 · Status: Pending · Effort: 3h · blockedBy: Phase 2-5

## Context Links
- `reports/gap-register.md` mục D (pay-later), W-22
- `../261019-1500-case-detail-redesign/reports/skill-filter-taste-minimalist.md`
- `research/scout-01` mục "Not checked"

## Key insights
- Web-1 không test runner: cổng = `check-types`, `lint` (zero warnings), smoke trình duyệt + các file assert nhỏ từ P1/P3/P4/P5.
- Rủi ro lớn nhất không nằm trong thư mục ví: trang payment và `/pay/receivable/[token]` dùng chung `PaymentView`/`PaymentDepositMeta`/`deposit-display`. Plan này **không sửa** các file đó nên chỉ cần xác nhận không đổi.
- Smoke có thao tác ghi (tạo deposit): **chỉ DB dev**.

## Requirements
- Ma trận smoke 1440/768/390 × sáng/tối.
- Bàn phím: Tab → hàng mở rộng (Enter/Space), Esc đóng modal, focus trả về nút "Nạp tiền".
- Tài liệu: `apps/web-1/AGENTS.md` (nếu số hook/file đổi); `design-system/wording/pages/wallet.md` chỉ khi đổi chữ.
- Báo chủ dự án các mục còn mở (Q-W1…Q-W6) và quyết định mặc định đã dùng.

## Related code files
**Modify:** `apps/web-1/AGENTS.md` (nếu cần), `plans/261019-1520-wallet-redesign/plan.md` (status).
**Create:** `plans/261019-1520-wallet-redesign/reports/qa-final.md`.
**Delete:** không (mockup chờ duyệt).

## Implementation steps
1. `bun run check-types`, `bun run lint`; chạy các file test (`wallet-row`, `wallet-sort`, `wallet-proof`, `parseTopupAmount`, `parseWalletView`, `formatVndAmount`).
2. Taste `lint.mjs` trên `app/dashboard/wallet/`: 0 FAIL; giải thích từng WARN.
3. Ma trận trong `qa-final.md`:
   | Tình huống | 1440 sáng | 1440 tối | 768 | 390 | Ghi chú |
   |---|---|---|---|---|---|
   | Ví 0 giao dịch | | | | | trống có hướng dẫn |
   | Ví nhiều trang | | | | | phân trang, sắp xếp |
   | Mỗi loại tab | | | | | deposit, trừ ví, hoàn, điều chỉnh |
   | Mở dòng nạp | | | | | lazy deposit |
   | Mở dòng mua | | | | | lazy order |
   | Minh chứng 4 trạng thái | | | | | rejected có chi tiết |
   | Modal nạp | | | | | chọn nhanh, `?amount=` |
   | Lỗi API (chặn mạng) | | | | | thử lại |
4. Hồi quy: mở `/dashboard/payment?pid=<deposit dev>` và `/pay/receivable/<token dev>` — ảnh chụp trước/sau không đổi (không sửa file, nhưng chứng minh).
5. Grep trong `wallet/`: `vi-VN` cho tiền (không), `đ\b`/`₫` (không), `\d\.\d{3} VND` (không), `CP[1-4]`/`cp[1-4]_` (không hiển thị), `apiClient` (không), `try {` trong `.tsx` (không), `as any` (không), `shadow`/`bg-linear` (không), `Phosphor` (không).
6. `wc -l` mọi file ≤200; `WalletProofTable.tsx`, `WalletTransactionTable.tsx`, `WalletTransactionCardList.tsx`, `WalletTabsList.tsx`, `WalletRowDetailAction.tsx`, `WalletTransactionFilters.tsx` đã xóa, không còn tham chiếu.
7. Cập nhật docs/status; liệt kê việc để plan riêng: `GET /wallet/summary`, `groupBy` đếm, tham số `days`, sửa tiền sai dấu chấm ở payment/checkout/API, nối deposit-list gồm deposit chưa có minh chứng.

## Todo
- [ ] check-types, lint, test
- [ ] Taste lint
- [ ] Ma trận smoke
- [ ] Hồi quy payment + pay-later
- [ ] Grep quy tắc, `wc -l`
- [ ] `qa-final.md`

## Success criteria
- Không hồi quy ở `/dashboard/payment` và trang công khai.
- Mọi ô ma trận có bằng chứng hoặc ghi "chưa thấy được vì…".
- Lint/type sạch trong phạm vi sửa; file xóa không còn tham chiếu.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Không có token công khai pay-later để thử | Ghi rõ không kiểm; không báo đã kiểm |
| Smoke nạp tạo rác DB dev | Chấp nhận (DB dev); không DB production |

## Security
Không log PII/mã giao dịch; không hardcode URL/secret; thao tác ghi chỉ DB dev.

## Next steps
Chủ dự án duyệt → xóa `design-system/mockups/wallet/`; quyết các plan backend nhỏ (Q-W1…Q-W3, Q-W5, Q-W6).
