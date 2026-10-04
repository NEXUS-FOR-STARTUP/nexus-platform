# Pricing, Chat & Intake Quickfixes

**Date**: 2026-09-17 09:00  
**Status**: Resolved  
**Scope**: Frontend Case Workspace, Intake Stepper, Backend Chat Access  
**Plan**: `plans/260917-0900-pricing-chat-intake-quickfixes/plan.md`  

---

## 1. What Happened

Gói 79k là gói thẩm định thuần túy bằng AI, không có chuyên viên hỗ trợ (supporter). Tuy nhiên, giao diện sinh viên vẫn hiển thị tab chat "Trao đổi với Supporter" và kết nối Centrifugo realtime gây tốn tài nguyên server và gây hiểu lầm cho người dùng. Ngoài ra, bước xác nhận Intake hiển thị nhầm nhãn "Hạn nộp bài mong muốn" (bug v5), và người dùng vẫn bấm chọn được gói 149k (vốn chưa hoàn thiện luồng phân công supporter).

## 2. Technical Decisions

1. **Chặn Toàn diện Tính năng Chat cho Gói 79k (`pkg_ai_audit`)**:
   - **Frontend**: Ẩn tab Chat khỏi `WorkspaceSidebar`, chặn chuyển hướng vào `activeTab === "discussion"`, và hủy subscription Centrifugo realtime cho các case thuộc gói 79k.
   - **Backend**: Thêm mã lỗi `CHAT_AI_TIER` (HTTP 409) vào `chat-access.ts` và use-case `send-message`. Bất kỳ yêu cầu gửi tin nhắn nào vào case 79k đều bị từ chối rõ ràng.
2. **Loại bỏ Nhãn Hạn Nộp Bài Thừa ở Bước 6 Intake**:
   - Xóa bỏ label và giá trị `Hạn nộp bài mong muốn` khỏi `ReviewSubmitStep.tsx` do form không còn thu thập trường này. Giữ lại thông tin về gói dịch vụ và thời gian SLA cam kết.
3. **Chặn Chọn Gói 149k Chưa Sẵn Sàng**:
   - Tại `PackageSelectionModal.tsx`, khi người dùng bấm chọn gói Premium 149k, hiển thị thông báo Mantine notification thông tin tính năng đang được hoàn thiện, không chuyển tiếp sang trang tạo hồ sơ.

## 3. Key Changes

- `apps/api/src/modules/cases/application/chat-access.ts`: Bổ sung kiểm tra gói `pkg_ai_audit` trả về lỗi `CHAT_AI_TIER`.
- `apps/api/src/modules/cases/application/send-message.usecase.ts`: Tiếp nhận kiểm tra gói và trả về HTTP 409.
- `apps/api/src/shared/infrastructure/tests/phase-03-messaging.test.ts`: Thêm test case chặn chat gói AI.
- `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx`: Điều kiện hóa tab Chat.
- `apps/web-1/app/dashboard/case/[id]/page.tsx`: Gating truy cập tab discussion.
- `apps/web-1/app/dashboard/intake/_components/Steps/ReviewSubmitStep.tsx`: Xóa bỏ nhãn deadline cũ.
- `apps/web-1/app/dashboard/_components/PackageSelectionModal.tsx`: Chặn chọn gói 149k bằng notification.

## 4. Verification

- Kiểm thử case gói 79k: Tab Chat hoàn toàn biến mất trên thanh điều hướng; gọi API POST gửi tin nhắn nhận ngay phản hồi 409 `CHAT_AI_TIER`.
- Màn hình xác nhận Intake sạch sẽ, không còn hiển thị thông tin hạn nộp trống.
- Bấm chọn gói 149k hiện notification rõ ràng, không làm gãy luồng người dùng.
- Toàn bộ test suite liên quan đến messaging và access control đều pass.
