# Phase 02 — Copy Fix (StatusGuidanceCard 2 branch + STAGE_LABELS)

- Priority: P2 | Status: implemented | Effort: 0.5h
- Depends: — | Blocks: —

## Context Links

- Quyết định gốc: `docs/research/decision-2026-08-25-intake-payment-stage-separation.md` (điểm sửa #4, #4b, #4c)
- Component: `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`
- Copy map: `apps/web-1/app/dashboard/case/[id]/_components/statusCopyMap.tsx` (lưu ý: copy `intake_ready`/`intake_pending` nằm INLINE trong component, KHÔNG nằm trong map)
- Notification labels: `apps/api/src/modules/notifications/application/notification-templates.ts:17-29`

## Overview

Sau phase-01, ranh giới stage/payment được khôi phục. Phase này dọn copy để UI nói đúng ranh giới đó:

1. `intake_ready` — nút không còn nghĩa "chỉ cập nhật" (trước đây nộp lại chạy T16 → ở nguyên). Giờ nộp = **nộp hồ sơ thật** (T2 → `submitted`).
2. `intake_pending` (non-free) — copy hiện tại "Chờ thanh toán dịch vụ" là tàn dư nghĩa A, nghe như **ép trả trước mới được nộp**. Thực tế đã verify: T2 guard chỉ `isOwner` (`case-machine.ts:68-72`), nộp hồ sơ không bao giờ bị chặn bởi payment — 402 chỉ ở `T5_ACCEPT` (admin duyệt). Copy phải nói đúng: nộp trước được, thanh toán là điều kiện để được duyệt/phục vụ.
3. `STAGE_LABELS` (notification email/telegram) — `intake_pending: "Chờ thanh toán"`, `intake_ready: "Sẵn sàng khởi động"` mang nghĩa A → đổi theo nghĩa B.

## Key Insights

- Hành vi KHÔNG đổi ở cả 3 chỗ — chỉ đổi **chữ**. Không đổi handler, không đổi điều kiện hiển thị.
- `canOpenIntake` (StatusGuidanceCard dòng 65-66) vẫn đúng: `hasTransition("T2_SUBMIT_INTAKE") || hasTransition("T16_EDIT_INTAKE") || canResubmit`. KHÔNG đổi logic này.
- Card `intake_pending` chỉ hiện khi `!hasCredits` (dòng 150-151) — giữ nguyên điều kiện; đây là banner gợi ý, không phải rào cản.
- Nhánh `isFree` của card `intake_pending` (title "Nâng cấp lên đánh giá chuyên sâu") KHÔNG đổi — ngữ nghĩa đã đúng (free case nộp được luôn, mua là upgrade).
- Không cần đổi `CaseStatusHeader` ping badge (decision §6: chỉ đổi chữ card guidance + labels).

## Requirements

- Đổi title/body/button ở branch `intake_ready` sang ngữ nghĩa "nộp hồ sơ".
- Đổi title/body ở branch `intake_pending` nhánh non-free sang ngữ nghĩa "có thể nộp trước, thanh toán sau"; giữ nút "Thanh toán ngay".
- Đổi 2 label trong `STAGE_LABELS`.
- Không đổi logic/handler/điều kiện hiển thị ở bất kỳ đâu.

## Architecture

Không đổi data flow. Chỉ là bản sao copy của 2 Alert branch + 2 entry trong map label tĩnh.

## Related Code Files

- **Sửa:** `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx` (dòng 149-178, 180-205)
- **Sửa:** `apps/api/src/modules/notifications/application/notification-templates.ts` (dòng 17-29)
- Không tạo/xóa file.

## Implementation Steps

### Step 1 — Đổi copy branch `intake_ready` (dòng 192-199)

**Hiện tại:**
```tsx
<div className="mantine-Alert-title mb-0.5">Cần cập nhật thông tin hồ sơ</div>
<p className="text-text-muted text-xs leading-relaxed">
  Vui lòng cập nhật thông tin hồ sơ khởi nghiệp trước khi gửi để Supporter có thể đánh giá chính xác.
</p>
```
và button (dòng 199): `Cập nhật ngay`

**Sau khi sửa:**
```tsx
<div className="mantine-Alert-title mb-0.5">Nộp hồ sơ khởi nghiệp</div>
<p className="text-text-muted text-xs leading-relaxed">
  Vui lòng nộp hồ sơ khởi nghiệp để Supporter có thể đánh giá chính xác.
</p>
```
và button: `Nộp hồ sơ`

Chính xác:
- Dòng 192: `Cần cập nhật thông tin hồ sơ` → `Nộp hồ sơ khởi nghiệp`
- Dòng 194: `Vui lòng cập nhật thông tin hồ sơ khởi nghiệp trước khi gửi để Supporter...` → `Vui lòng nộp hồ sơ khởi nghiệp để Supporter có thể đánh giá chính xác.`
- Dòng 199: `Cập nhật ngay` → `Nộp hồ sơ`

Không đụng icon (`Clock`), variant (`light`), màu (`blue`), hay cấu trúc Alert.

### Step 2 — Đổi copy branch `intake_pending` nhánh non-free (dòng 159, 168)

Chỉ đổi 2 dòng trong nhánh `!isFree`; nhánh `isFree` (dòng 166-167, 172) giữ nguyên.

**Hiện tại:**
- Dòng 159 (title): `Chờ thanh toán dịch vụ`
- Dòng 168 (body): `Vui lòng hoàn tất thanh toán để kích hoạt quy trình phản biện.`

**Sau khi sửa:**
- Dòng 159: `Hồ sơ chưa thanh toán`
- Dòng 168: `Bạn có thể nộp hồ sơ trước, thanh toán sau — phản biện chỉ bắt đầu sau khi thanh toán hoàn tất.`

Giữ nguyên:
- Nút dòng 172 `Thanh toán ngay` (CTA gợi ý thanh toán, không ép).
- Icon `Clock`, màu `yellow`, variant `light`, điều kiện hiển thị `if (hasCredits) return null` (dòng 150-151).

### Step 3 — Đổi `STAGE_LABELS` (notification-templates.ts dòng 17-29)

- Dòng 18: `intake_pending: "Chờ thanh toán"` → `intake_pending: "Chờ nộp hồ sơ"`
- Dòng 19: `intake_ready: "Sẵn sàng khởi động"` → `intake_ready: "Đã cập nhật hồ sơ"`

Các label khác (submitted, under_review, ...) KHÔNG đổi.

## Todo List

- [x] Step 1: title dòng 192 → "Nộp hồ sơ khởi nghiệp"
- [x] Step 1: body dòng 194 → ngữ nghĩa nộp hồ sơ
- [x] Step 1: button dòng 199 → "Nộp hồ sơ"
- [x] Step 2: title dòng 159 (non-free) → "Hồ sơ chưa thanh toán"
- [x] Step 2: body dòng 168 (non-free) → "có thể nộp trước, thanh toán sau"
- [x] Step 3: `intake_pending` label → "Chờ nộp hồ sơ"
- [x] Step 3: `intake_ready` label → "Đã cập nhật hồ sơ"
- [x] Không đổi `canOpenIntake` / `onOpenIntake` / `onOpenPayment` / bất kỳ logic nào

## Success Criteria

- [x] Stage `intake_ready`: title/body/button đúng ngữ nghĩa "nộp hồ sơ"; nút vẫn mở form intake (hành vi T2 — không đổi).
- [x] Stage `intake_pending` non-free: copy không còn nghĩa ép trả trước; nút "Thanh toán ngay" còn nguyên.
- [x] Nhánh `isFree` và các stage khác không đổi.
- [x] `STAGE_LABELS` 2 entry mới đúng; template notification vẫn compile.
- [x] Không lỗi TS (phase-04 `check-types` / build web nếu cần).

## Risk Assessment

| Rủi ro | Khả năng | Tác động | Giảm thiểu |
|---|---|---|---|
| Copy mới gây hiểu nhầm (case đã có credit) | Thấp | Thấp | Ngữ nghĩa "nộp hồ sơ" khớp hành vi T2 mới |
| Đổi nhầm sang branch khác (rejected/isFree) | Thấp | Thấp | Chỉ touch dòng đã liệt kê, xác nhận bằng line number |
| Label notification đổi nghĩa làm email/telegram sai ngữ cảnh | Thấp | Thấp | Label mới mô tả đúng nghĩa B; chỉ là chữ hiển thị, không logic |

## Security Considerations

- Không liên quan auth/data. Chỉ là văn bản hiển thị client-side + label template.

## Next Steps

- Phase 04: verify UI bằng browser nếu cần (stage `intake_ready` khó dựng thủ công → ưu tiên verify qua `check-types` + review diff).
