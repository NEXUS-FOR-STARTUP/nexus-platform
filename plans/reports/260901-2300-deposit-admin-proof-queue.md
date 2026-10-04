---
title: Deposit admin proof queue — option analysis
date: 2026-09-01
status: recommendation
tags: [deposits, admin, sepay, business]
---

# Deposit admin queue: pending QR vs minh chứng

## RCA — đúng

Không có code tự upload ảnh rỗng.

`POST /deposits` tạo row `status=pending`, `proof_file_url=null`. Redirect QR. SePay happy path tự `verified` + cộng ví. Admin không cần thấy row này.

Admin tab "Duyệt minh chứng thanh toán" lọc `status === "pending"` (`admin/page.tsx` ~234–239). Mọi lần mở QR vào hàng đợi. Cột proof fallback "Không tìm thấy file". Menu vẫn **Duyệt / Từ chối**.

Proof upload (`POST /payments/proof` + `deposit_id`) **chỉ ghi URL**, không đổi status. Discriminator thật = `proof_file_url`, không phải status.

Origin: financial refactor 2026-08-12. Payment cũ: tạo = `unpaid`, upload proof = `pending_verification`, admin lọc cái sau. Deposit gộp 1 status `pending`. FE admin copy filter cũ sai nghĩa.

## Nghiệp vụ thật

```
Học viên tạo mã nạp
  → pending, chưa tiền, chưa ảnh     [chờ ngân hàng / SePay]
  → SePay khớp số tiền               [auto verified, admin out]
  → SePay sai số tiền                [amount_mismatch, cần người]
  → Học viên gửi ảnh bill            [pending + proof, cần admin đối chiếu]
```

Tab admin tên "Duyệt minh chứng" = việc 4, không phải việc 1.

Prod (báo cáo 01/09): pending 19, có ảnh 2, không ảnh 17 (89.5%). 4 QR liên tiếp cùng user hôm nay = 4 dòng rác.

## Lỗ hổng tiền (không nằm 2 phương án gốc)

`verifyDepositUseCase` **không** check `proof_file_url`. Admin bấm Duyệt trên row QR trống → cộng ví. BE cho phép. UI còn hiện nút.

`amount_mismatch` không nằm filter pending → trộn tab lịch sử. Domain type `DepositStatus` thiếu `amount_mismatch`.

## So sánh

### Phương án 1 — lọc admin queue

Queue = `pending && proof_file_url`. Badge cùng điều kiện. Ẩn Duyệt khi không có ảnh.

- Khớp tên tab. Discriminator đã có sẵn.
- Không Prisma, không backfill prod.
- Không đảo domain deposit (refactor 12/08 cố ý 1 status `pending`).
- Sửa 1–2 file FE.

Thiếu nếu chỉ lọc FE: API vẫn verify không ảnh. Phải kèm chặn BE.

### Phương án 2 — thêm `pending_verification`

Upload proof → đổi status. Admin lọc status đó. Giống Payment cũ.

- Status = nguồn sự thật. Dễ SLA / notify admin / query.
- Tốn: proof upload, filter, verify, student copy, domain type, backfill `pending+proof` → `pending_verification`.
- `status` đang `String` — không bắt buộc ALTER enum, nhưng **UPDATE prod** = mutation. Safety rule: tránh khi chưa cần.
- `amount_mismatch` vẫn status thứ 4. Máy trạng thái phình. Undo quyết định domain 12/08.

Chưa có SLA/notify "có bill chờ duyệt" → YAGNI.

## Khuyến nghị

**Phương án 1 + chặn BE. Không làm 2.**

1. Admin list + badge: `status==="pending" && proof_file_url`.
2. Table: không menu Duyệt nếu không có ảnh. Từ chối QR bỏ mặc = sản phẩm khác (expire), đừng nhét vào "duyệt minh chứng".
3. `verifyDepositUseCase` khi `verified`: require `proof_file_url` **hoặc** `status==="amount_mismatch"` (SePay đã thấy tiền). Reject không cần ảnh.

Không đụng schema. Không backfill.

Để sau (không chặn bug này): queue riêng `amount_mismatch`; expire pending không ảnh; notify admin khi có proof.

Liên quan plan banner ví `260901-2254-remove-deposit-stuck-banner`: cùng gốc `pending` không ảnh bị treat như "cần người". Độc lập file.
