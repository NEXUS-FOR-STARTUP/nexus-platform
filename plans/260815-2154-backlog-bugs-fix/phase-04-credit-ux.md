# Phase 04 — Credit UX (#3)

- Priority: P0 | Status: Pending | Effort: 3h
- Depends: Phase 03 | Blocks: —

## Overview

User hiểu rule "mỗi lượt đánh giá = 1 credit" đúng thời điểm. 2 điểm chạm: banner user tại `report_ready` (guidance/đỏ+mua) + BE surfacing 402 NO_CREDITS rõ khi T11 bị chặn.

## Requirements

- Banner `report_ready` trên user case page:
  - Có credit → "Supporter đã gửi báo cáo. Muốn tiếp tục? Sửa tài liệu rồi gửi lại — mỗi lượt đánh giá mới = 1 credit."
  - Hết credit → banner đỏ + nút "Mua credit" (tái dùng `CreditPanel`/`CreditBalanceCard`).
- T11 (và T5/T3) bị chặn bởi credit → BE throw **402 NO_CREDITS** rõ ("Hết credit...") thay vì 400 generic INVALID_TRANSITION.
- KHÔNG thêm confirm modal khi user gửi bản sửa (gửi free).

## Architecture

### BE surfacing (case-transition.service.ts `transitionInTx`)

Trước `tryTransition`: nếu `transition` ∈ {T11_SUBMIT_OUTPUT, T3_RESUBMIT_AFTER_REJECT} và `creditBalance < 1` (với `hasCredit` không skip) → `AppError 402 NO_CREDITS 'Hết credit...'`. Đặt trước tryTransition để 402 ưu tiên hơn 400 guard.
- > **Red-team fix m5:** KHÔNG đưa T5 vào pre-check — T5 là admin accept, admin không nên thấy lỗi "Hết credit" của user; T5 giữ 400 generic (guard hasCredit chặn sẵn). Chỉ T11 (supporter-facing) + T3 (user-facing) surface 402.
- > **Red-team fix M4:** free case (`lockedPrice===0`) — guard hasCredit skip nhưng action `subtractCredit` vẫn throw 402 khi balance<1 (`case-transition.service.ts:110-112`) → free case KHÔNG BAO GIỜ tới được report_ready. **Sửa luôn trong phase này:** `subtractCredit` no-op khi `lockedPrice === 0`. KHÔNG defer.

### FE banner (StatusGuidanceCard.tsx)

- Precedent: `StatusGuidanceCard.tsx:144-173` credit-gate (intake_pending hasCredits + buy button onOpenPayment).
- Thêm branch `report_ready` trước static copy `:246-261`: đọc creditBalance từ case detail; 2 trạng thái.
- `case/[id]/page.tsx:148` onOpenPayment wiring sẵn → truyền xuống nút "Mua credit".

### Message supporter (surface API message)

`SupporterOutputUploadModal.tsx:58-67,105-108` đã surface API message → BE 402 sẽ hiện rõ, không cần đổi FE nhiều.

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/services/case-transition.service.ts` (110-112, 186-210) | SỬA: pre-check 402 NO_CREDITS cho T11/T3; subtractCredit no-op khi lockedPrice===0 |
| `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx` (144-173, 246-261) | SỬA: +branch report_ready banner 2 trạng thái + nút mua |
| `apps/web-1/app/dashboard/case/[id]/page.tsx` (148) | VERIFY: onOpenPayment wiring truyền xuống banner |
| `apps/web-1/app/supporter/case/[id]/_components/SupporterOutputUploadModal.tsx` (58-67, 105-108) | VERIFY: surface 402 message |

## Implementation Steps

1. `case-transition.service.ts`: thêm pre-check credit → 402 NO_CREDITS (trước tryTransition).
2. `StatusGuidanceCard.tsx`: thêm branch report_ready (2 trạng thái) trước static copy; nút "Mua credit" gọi onOpenPayment.
3. `page.tsx`: đảm bảo creditBalance + onOpenPayment truyền vào StatusGuidanceCard.
4. `npm run check-types` + `npm test` (verify NO_CREDITS test nếu có).

## Todo List

- [ ] BE: 402 NO_CREDITS pre-check T11/T3 trong transitionInTx (KHÔNG T5)
- [ ] BE: subtractCredit no-op khi lockedPrice === 0 (fix free-case edge)
- [ ] FE: StatusGuidanceCard branch report_ready (guidance + đỏ + mua credit)
- [ ] FE: page.tsx wiring creditBalance + onOpenPayment
- [ ] `npm run check-types` PASS
- [ ] `npm test` PASS
- [ ] Manual: hết credit → banner đỏ + nút mua; supporter nộp output khi user hết credit → message 402 rõ

## Success Criteria

- User hết credit ở report_ready → thấy banner đỏ + nút "Mua credit" (tái dùng CreditPanel).
- Có credit → banner guidance giải thích round mới = 1 credit.
- Supporter nộp output khi user hết credit → 402 NO_CREDITS rõ, không 400 generic.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 402 pre-check phá free case (lockedPrice 0) | Trung bình | Trung bình | Check `hasCredit` skip logic trước khi throw (free → không throw) |
| Banner chồng copy static cũ | Thấp | Thấp | Branch trước static copy, return sớm |
| CreditPanel chưa expose đúng prop | Thấp | Thấp | Tái dùng pattern intake_pending precedent (:144-173) |

## Next Steps

→ Phase 08: tests + docs sync (kèm verify NO_CREDITS surfacing).
