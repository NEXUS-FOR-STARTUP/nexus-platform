# Phase 4: Ảnh minh chứng nạp tiền

Priority: P2 · Status: Pending · Effort: 5h · blockedBy: Phase 1, 2 · Q-W5

WD = `apps/web-1/app/dashboard/wallet`

## Context Links
- Mockup: `js/views/proofs.js` (94), `REPORT.md` §4.3
- `reports/gap-register.md` W-10, W-13, W-14, W-24, W-28
- Code: `WD/_components/WalletProofTable.tsx` (**371**), `useMyDeposits`, `getProofUrl` (`payment/hooks/usePayment.ts`), `lib/deposit-display.ts` (`getDepositDisplay`, `depositDetailHref`), `STATUS_LABELS` cục bộ `WalletProofTable.tsx:24-29`

## Key insights
- `WalletProofTable` 371 dòng: bảng, lọc trạng thái client-side, icon PDF vs ảnh (`:215-235`), nhãn trạng thái cục bộ (`STATUS_LABELS`, `amount_mismatch` màu `yellow`) **lệch** `getDepositDisplay` ("Số tiền chưa khớp", "Đã cộng vào ví", "Cần bổ sung chứng minh"). Chọn **một nguồn: `getDepositDisplay`** (W-28); không sửa bản đồ nhãn của nó (dùng chung với `getReceivableDisplay`).
- API list: chỉ deposit **đã có minh chứng** (`findDepositsByUser`), trần 20 (cứng trong hook), không `total`. Q-W5: giữ; đếm theo trạng thái = đếm trong mảng đã tải, nhãn "trong 20 gần nhất" khi mảng đạt 20.
- Mockup bỏ trạng thái "rejected" khỏi tab lọc (chỉ 3) và bỏ "Chi tiết" → mất đường nộp lại. **Giữ rejected** và nút "Xem chi tiết".
- Không có `actual_amount` → bỏ "Số tiền thực nhận". `proof_name` suy từ URL (đoạn cuối, `decodeURIComponent` bọc kiểm lỗi trong hàm thuần, không trong component).
- `verified_at`: list trả `updated_at` khi đã xác minh; rejected → `null`.
- Liên kết xem minh chứng dùng `getProofUrl` (đúng hơn đoạn ghép URL tay hiện tại).

## Requirements
- Tab lọc trạng thái (Tabs gạch dưới hoặc `SegmentedControl`): Tất cả / Chờ xác minh / Đã vào ví / Bị từ chối / Số tiền chưa khớp (nhãn từ `getDepositDisplay`); có số đếm trong mảng đã tải.
- Dòng thu gọn: ngày tạo, mã nạp, nội dung CK (copy), số tiền, `StatusChip` (tone từ `getDepositDisplay`).
- Dòng mở rộng: số tiền yêu cầu, tên file minh chứng + icon (PDF/ảnh) + link xem, xác minh lúc (nếu có), "Xem chi tiết nạp tiền" → `/dashboard/payment?pid=`.
- Trạng thái: skeleton, lỗi + thử lại, trống ("Chưa có ảnh minh chứng nào" + hướng dẫn nạp tiền để tải minh chứng).

## Architecture
```
WalletProofTable.tsx (≤120)         đổi tên WalletProofList.tsx; state lọc + useMyDeposits + ghép
 ├─ WalletProofFilters.tsx (≤60)
 ├─ WalletProofRow.tsx (≤70)        Summary
 ├─ WalletProofDetail.tsx (≤90)     Panel
 └─ wallet-proof.ts (≤60) + test    proofFileName(url), countByStatus(list), toChipTone(display)
```

## Related code files
**Modify:** `page.tsx`/`WalletTabs.tsx` (đổi import), `wallet.module.css`.
**Create:** 4 file component + `wallet-proof.ts` + `wallet-proof.test.ts`.
**Delete:** `WalletProofTable.tsx` (371).

## Implementation steps
1. Đọc đủ `WalletProofTable.tsx` (371) + `useMyDeposits`; liệt kê hành vi: lọc, icon, link, sắp xếp mặc định, phân trang (nếu có), trạng thái.
2. Kịch bản trước sửa: mỗi trạng thái (pending, verified, rejected, amount_mismatch), mở ảnh, mở PDF, "Chi tiết".
3. `wallet-proof.ts`: `proofFileName(url)` (đoạn cuối path, giải mã an toàn, trả "Tệp minh chứng" khi lỗi), `countByStatus`, `toChipTone`; test 5 ca (URL ảnh, PDF, có ký tự %, URL rỗng, mảng rỗng).
4. Dòng/Panel như Requirements; icon `FileText` (PDF) / `Image` (ảnh) Lucide; link `Anchor target="_blank" rel="noopener noreferrer"` với `getProofUrl(url)`.
5. Nhãn trạng thái: `getDepositDisplay(deposit)`; không `STATUS_LABELS` cục bộ.
6. Xóa `WalletProofTable.tsx`; `LSP references` trước khi xóa.
7. Smoke 4 trạng thái (tạo deposit mẫu ở DB dev bằng luồng nạp thật + tải minh chứng, hoặc dữ liệu seed dev: **không DB production**).

## Todo
- [ ] Chốt Q-W5
- [ ] Đọc `WalletProofTable` 371 dòng
- [ ] `wallet-proof.ts` + test
- [ ] Filters/Row/Detail
- [ ] Bỏ `STATUS_LABELS` cục bộ
- [ ] Xóa file cũ
- [ ] Smoke 4 trạng thái

## Success criteria
- 4 trạng thái hiển thị đúng chữ `getDepositDisplay`; rejected vẫn có đường "Xem chi tiết".
- Xem được ảnh và PDF minh chứng (link mở được).
- Không file >200; `WalletProofTable.tsx` đã xóa, không còn tham chiếu.
- Không thêm hay sửa nhãn trong `deposit-display.ts`.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Số đếm tab sai vì mảng chỉ có 20 | Nhãn "trong 20 gần nhất" khi `length === 20` |
| Thiếu deposit "pending" chưa có minh chứng trong list | Ghi vào báo cáo cho chủ dự án (Q-W5); không sửa API |
| URL minh chứng tương đối bị ghép sai | Dùng `getProofUrl` |

## Security
Link minh chứng chỉ hiện cho chủ deposit; `rel="noopener noreferrer"`; không hiển thị đường dẫn nội bộ trong text, chỉ tên tệp.

## Next steps
P5.
