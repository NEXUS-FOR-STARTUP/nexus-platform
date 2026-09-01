---
title: "Phase 01: Fix UX Logic trong StatusGuidanceCard"
status: completed
priority: P1
effort: 1h
branch: fix/ux-credit-block
created: 2026-09-01
completed: 2026-09-01
---

# Phase 01: Fix UX Logic trong StatusGuidanceCard

## Overview
- **Priority:** High
- **Current Status:** Completed
- **Brief description:** Khắc phục lỗi UX "Hết credit đánh giá" đè mất nút "Xác nhận hoàn thành".

## Nguồn gốc vấn đề (Problem Presentation)
1. **Root Cause**: Khi Supporter nộp báo cáo (`T11_SUBMIT_OUTPUT`), backend tự động trừ 1 credit của sinh viên để thanh toán cho vòng đánh giá vừa xong. Do sinh viên chỉ mua 1 credit ban đầu, số dư lúc này (`creditBalance`) rơi về `0`. Case lúc này ở trạng thái hiển thị `report_ready` (Báo cáo đã sẵn sàng).
2. **Defect trong UI**: Tại component `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`, logic cũ khi gặp `stage === "report_ready"` đã dùng câu lệnh kiểm tra `if (!hasCredits)` và **return sớm** một Alert báo lỗi màu Đỏ (hết credit) kèm nút "Mua credit".
3. **UX Impact**: Thẻ màu Xanh lá cây có nội dung "Báo cáo phản biện đã sẵn sàng" cùng nút **"Xác nhận hoàn thành"** (đóng case qua `T17_USER_CONFIRM_COMPLETE`) bị giấu hoàn toàn, dẫn đến người dùng không có cách nào đóng case ngoài việc chờ 7 ngày để hệ thống tự đóng, hoặc mua thêm credit một cách vô lý. Việc đóng case (confirm report) hoàn toàn không tiêu tốn credit mới.

## Giải pháp hợp nhất (Unified Fix)
Việc kiểm tra `hasCredits` không được phép chặn toàn bộ khung hiển thị ở trạng thái `report_ready`. Nó chỉ được quyền điều chỉnh thông điệp khuyến khích nộp thêm tài liệu ở lượt tiếp theo. 

## Requirements
- Nút "Xác nhận hoàn thành" (`onConfirmComplete`) **phải luôn luôn xuất hiện** nếu người dùng có quyền gọi transition này (`canConfirmComplete = true`), bất kể số dư credit.
- Trải nghiệm mượt mà (Smooth UX): Kết hợp khéo léo thông báo "Hết credit" vào thẻ thông báo chính.

## Architecture
Thay thế cấu trúc `if/return` rẽ nhánh bạo lực hiện tại bằng một giao diện duy nhất bao quát cả hai trạng thái.

## Related Code Files
- **Modify**: `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`

## Implementation Steps
1. Mở file `StatusGuidanceCard.tsx` tại hàm render của trạng thái `report_ready` (quanh dòng 299-358).
2. Xóa khối `if (!hasCredits)` chứa lệnh `return` Alert màu Đỏ.
3. Trong khối `return` thẻ Alert màu Xanh lá (`Báo cáo phản biện đã sẵn sàng`), gộp logic hiển thị bổ sung:
   - Nếu `!hasCredits`: Hiển thị cảnh báo nhỏ gọn: *"Bạn đã hết credit. Nếu muốn tiếp tục nộp bản sửa đổi mới, vui lòng mua thêm credit."* kèm theo nút **"Mua credit"**.
   - Nếu `hasCredits`: Hiển thị thông báo bình thường: *"Muốn tiếp tục cải thiện? Sửa tài liệu rồi gửi lại..."*
4. Đảm bảo nút **"Xác nhận hoàn thành"** luôn được render trong cùng thẻ đó, đặt ở vị trí nổi bật nhất.

## Todo List
- [X] Remove early return for `!hasCredits` in `report_ready` state.
- [X] Merge credit check logic into the main `CheckCircle2` success Alert.
- [X] Show "Xác nhận hoàn thành" as the primary action.
- [X] Show "Mua credit" as secondary action if `!hasCredits`.
- [X] Check layout consistency (margins, flexbox).

## Success Criteria
- Sinh viên có 0 credit vẫn nhìn thấy báo cáo sẵn sàng và bấm được "Xác nhận hoàn thành".
- Sinh viên nhận thức được rằng muốn sửa tài liệu tiếp thì cần mua credit (không bị cảm giác ép buộc để đóng case).
- Giao diện không bị chói (tránh cảnh báo đỏ cản trở luồng công việc chính yếu).

## Next Steps
- Cập nhật Project Changelog (đã ghi vào documentation rules).
- Cập nhật Roadmap nếu cần.

## Implementation Summary & Verification
- **Code Changes:**
  - File: `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`
  - Replaced early return blocking on `!hasCredits` when `stage === "report_ready"`.
  - Unified into single `Alert` (variant="light", color="green") with primary CTA "Xác nhận hoàn thành" (`onConfirmComplete && canConfirmComplete`).
  - Added non-blocking banner with "Mua credit" button (`onOpenPayment`) if `!hasCredits` to guide users on next submission rounds.
- **Review & Verification:**
  - CodeReviewer: Approved (Score 9.5/10). No security issues, zero performance regression.
  - Tester: 128 tests passing. Type-check clean across workspace. Next.js build clean. ESLint clean.