# Phase 2: Frontend Adaptive Intake Form & Tối ưu Giao diện

## 1. Mục tiêu
Chuyển đổi Form Intake (`apps/web-1/app/dashboard/intake/`) thành form thích ứng động theo gói dịch vụ (`Adaptive Form`).
Hỗ trợ đầy đủ các luồng dẫn đến form:
1. **Tạo case mới theo gói**: `/dashboard/intake?packageId=pkg_ai_audit` (hoặc `pkg_supporter_audit`).
2. **Cập nhật / Nộp hồ sơ cho case đã tạo**: `/dashboard/intake?caseId=...` (từ luồng Team Fit sau khi thanh toán hoặc tiếp tục hồ sơ đang dang dở).
Quy tắc bất biến: **Mỗi case cố định 1 gói duy nhất**, không cho phép đổi gói giữa chừng để tránh rủi ro logic tiền tệ & state.

## 2. Các tệp tin tác động
- `apps/web-1/app/dashboard/intake/page.tsx`
- `apps/web-1/app/dashboard/intake/_components/IntakeProgressStepper.tsx`
- `apps/web-1/app/dashboard/intake/_components/IntakeChatFlow.tsx`
- `apps/web-1/app/dashboard/intake/_components/Steps/DocumentInputStep.tsx`
- `apps/web-1/app/dashboard/intake/_components/Steps/ReviewSubmitStep.tsx`
- `apps/web-1/app/dashboard/intake/_components/Steps/SupportNeedsStep.tsx`
- `apps/web-1/app/dashboard/intake/hooks/useIntakeForm.ts`

## 3. Chi tiết thực hiện

### Bước 1: Trích xuất gói chính xác cho mọi luồng trong `page.tsx`
1. Đảm bảo hỗ trợ đồng thời cả 2 luồng URL:
   ```typescript
   // Luồng 1: Có caseId (luồng Team Fit, nộp tiếp) -> Trích xuất từ existingCaseData
   // Luồng 2: Chưa có caseId -> Trích xuất từ searchParams packageId
   const effectivePackageId = isUpdateMode
     ? (existingCaseData?.case?.package_id || existingCaseData?.package_id || "")
     : packageId;
   const isAiOnlyPackage = effectivePackageId === "pkg_ai_audit";
   ```
2. Dynamic `stepsList`:
   - Nếu `isAiOnlyPackage`:
     ```typescript
     const stepsList = [
       IntakeStep.SITUATION,
       IntakeStep.CONTACT,
       IntakeStep.PROJECT_CONTEXT,
       IntakeStep.DOCUMENTS,
       IntakeStep.BOUNDARY,
       IntakeStep.REVIEW,
     ];
     ```
   - Nếu gói có Supporter (`pkg_supporter_audit` hoặc fallback):
     Đầy đủ 7 bước bao gồm `IntakeStep.SUPPORT_NEEDS`.
3. Guard trạng thái loading & error:
   - `isLoadingForm`: hiển thị `LoadingSkeleton` chừng nào chưa tải xong dữ liệu case (`isUpdateMode && isLoadingCase`) hoặc packages (`!isUpdateMode && isLoadingPackages`), triệt tiêu 100% hiện tượng giật giao diện (flicker).
   - `isPackagesError`: hiển thị thông báo lỗi kết nối rõ ràng nếu API `/packages` bị sự cố.
4. Dynamic Banner SLA:
   - Gói 79k: *"⚡ Thời gian xử lý: Kết quả thẩm định tự động hoàn tất trong vòng 1 phút sau khi gửi"*
   - Gói 149k: *"⏱ Thời gian phản biện: 24h–48h có Mentor chuyên môn đồng hành và phản hồi"*

### Bước 2: Khắc phục kẹt điều hướng trong `IntakeChatFlow.tsx`
1. Truyền prop `stepsList: IntakeStep[]` vào `IntakeChatFlow`:
   - Điều hướng nút "Tiếp tục" / "Quay lại" dựa trên index của `stepsList` thay vì cộng trừ cứng:
     ```typescript
     const currentIdx = stepsList.indexOf(currentStep);
     const handleNext = () => {
       if (currentIdx < stepsList.length - 1) {
         setCurrentStep(stepsList[currentIdx + 1]);
       }
     };
     const handlePrev = () => {
       if (currentIdx > 0) {
         setCurrentStep(stepsList[currentIdx - 1]);
       }
     };
     ```
2. Khắc phục tính `canProceed` và `selectableSteps`:
   - Khi `step === IntakeStep.SUPPORT_NEEDS` mà không nằm trong `stepsList`, tự động trả về `true`, không làm khóa các bước tiếp theo trên sidebar Stepper.

### Bước 3: Đảm bảo tính nhất quán của bản nháp & Presets
1. Bản nháp (Draft):
   - Không cho phép đổi gói. Bản nháp gắn liền với gói của case hoặc `packageId` khởi tạo.
   - Khi load bản nháp cho gói AI, tự động reset trường `support_needs` về `undefined` hoặc rỗng để không bị đọng dữ liệu cũ.
2. Demo Presets:
   - Nếu `isAiOnlyPackage`: khi bấm áp dụng preset, bỏ qua việc gán `support_needs` của preset để tránh ô nhiễm dữ liệu gói AI.

### Bước 4: Clean Submit Payload & Trang Xác nhận (`ReviewSubmitStep.tsx`)
1. Submit Payload trong `useIntakeForm.ts`:
   - Tuân thủ Quyết định 1A: Với gói AI (`isAiOnlyPackage`), không gửi `support_needs` (hoặc gửi `undefined`), để dữ liệu trung thực, sạch sẽ và phù hợp với schema nới lỏng.
2. Cập nhật `ReviewSubmitStep.tsx`:
   - Nhận prop `isAiOnlyPackage: boolean`.
   - Nếu `isAiOnlyPackage`: ẩn hoàn toàn box "Ghi chú thêm cho Supporter" và box "Nhu cầu hỗ trợ chính", thay bằng badge trực quan: *"Hình thức thẩm định: Đánh giá tự động bằng AI (OMP Engine)"*.

### Bước 5: Cập nhật `DocumentInputStep.tsx`
- Dropdown hiển thị 5 danh mục tài liệu mới đơn nghĩa, không dùng `/` hay `()`:
  1. Thuyết minh ý tưởng
  2. Slide thuyết trình
  3. Nghiên cứu thị trường
  4. Kế hoạch tài chính
  5. Tài liệu bổ sung
