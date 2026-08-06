# Requirement: Administrative Packages Pricing Configuration & Price Locking Audit Trail

Tài liệu này xác định các yêu cầu chức năng và nghiệp vụ của tính năng cấu hình giá các gói dịch vụ dành cho Quản trị viên (Admin), cơ chế khóa giá (Price Locking) khi tạo case, nhật ký thay đổi giá gói dịch vụ (Audit Trail), và các helper xử lý giá tập trung. Tính năng này đã được triển khai và đưa vào vận hành.

## 1. Trạng thái
- **Trạng thái:** Đã hoàn thành (Implemented)
- **Phiên bản:** v1.2
- **Ngày cập nhật:** 2026-07-03

## 2. Nghiệp vụ & Luật (Business Rules)

### 2.1 Cấu hình giá Gói dịch vụ & Phân quyền
1. **Phân quyền truy cập (Access Control):** Chỉ người dùng có vai trò `role: "admin"` mới được phép thay đổi cấu hình giá các gói dịch vụ. Các vai trò khác (student, supporter) không có quyền truy cập endpoint backend này hoặc xem UI cấu hình.
2. **Ràng buộc dữ liệu (Data Validation):** Giá gói dịch vụ phải là một số nguyên không âm (lớn hơn hoặc bằng 0).
3. **Lưu trữ nhất quán (Persistence):** Khi thay đổi giá, thông tin phải được lưu trực tiếp vào bảng dữ liệu `ServicePackage` qua cơ chế Prisma ORM.

### 2.2 Khóa giá theo Case (Price Locking)
1. **Snapshot lúc tạo:** Khi một sinh viên tạo Case (`createCaseUseCase`), giá hiện tại của Gói dịch vụ (`ServicePackage.price`) phải được snapshot trực tiếp vào trường `locked_price` trên bảng `Case`.
2. **Bảo vệ giá cũ (Immutable Price Protection):** 
   - Mọi quyết định "Case này có cần thanh toán hay không" và "số tiền cần thanh toán là bao nhiêu" đều phải dựa trên `Case.locked_price`, không được đọc trực tiếp từ `ServicePackage.price` của gói dịch vụ sau khi case đã tạo.
   - Khi Admin thay đổi giá gói dịch vụ, sự thay đổi đó chỉ áp dụng cho các Case được tạo mới sau thời điểm đó. Tất cả các Case cũ (ở trạng thái unpaid, proof_uploaded, pending_verification, hoặc rejected) vẫn giữ nguyên giá cũ đã được khóa tại thời điểm tạo.
3. **Tái nộp minh chứng sau khi bị từ chối (Rejected Payment Resubmission):** Khi người dùng nộp lại minh chứng thanh toán mới sau khi bị Admin từ chối (Reject), số tiền yêu cầu thanh toán (`Payment.amount`) vẫn phải bằng `locked_price` của Case.

### 2.3 Nhật ký thay đổi giá gói dịch vụ (Pricing Audit Trail)
1. **Lưu vết lịch sử thay đổi gần nhất:** Trên bảng `ServicePackage`, hệ thống ghi nhận các thông tin lịch sử thay đổi giá gần nhất gồm:
   - `previous_price`: Giá trị trước khi thay đổi.
   - `last_price_changed_at`: Thời gian thực hiện thay đổi giá.
   - `last_price_changed_by`: Mã định danh (ID) của Admin thực hiện thay đổi.
2. **Giao diện Admin settings:** Khi hiển thị cấu hình gói dịch vụ trong Admin workspace, hiển thị rõ giá cũ bên cạnh giá hiện tại để hỗ trợ đối chiếu thông tin.

## 3. Đặc tả Kỹ thuật (Technical Specification)

### 3.1 Cấu trúc Dữ liệu (Database Schema)
- Bảng `service_packages` (`ServicePackage` model):
  - `price` (Int): Giá tiền hiện tại của gói.
  - `previous_price` (Int, nullable): Giá tiền trước khi thay đổi.
  - `last_price_changed_at` (DateTime, nullable): Thời điểm thay đổi giá gần nhất.
  - `last_price_changed_by` (String, nullable): Khóa ngoại liên kết tới người dùng thực hiện đổi giá.
- Bảng `cases` (`Case` model):
  - `locked_price` (Int, nullable): Giá gói dịch vụ đã được snapshot tại thời điểm tạo case.

### 3.2 Centralized Pricing Helpers (`apps/web-1/lib/pricing.ts`)
Để đảm bảo tính nhất quán giữa frontend và backend, các logic tính toán, định dạng và kiểm tra giá được tập trung trong file [pricing.ts](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/web-1/lib/pricing.ts):

1. **`getCaseEffectivePrice(caseData)`**
   - **Mục đích:** Trả về giá áp dụng chính thức cho Case.
   - **Logic:** Ưu tiên trả về `locked_price` nếu có giá trị, nếu không sẽ fallback về `package.price` của gói dịch vụ, hoặc `0` nếu cả hai đều không được thiết lập.
   - **Ký họa hàm:**
     ```typescript
     export function getCaseEffectivePrice(caseData?: {
       locked_price?: number | null;
       package?: { price?: number } | null;
     } | null): number {
       return caseData?.locked_price ?? caseData?.package?.price ?? 0;
     }
     ```

2. **`caseRequiresPayment(caseData)`**
   - **Mục đích:** Kiểm tra xem Case có cần thực hiện thanh toán hay không.
   - **Logic:** Case cần thanh toán nếu giá áp dụng thực tế (effective price) lớn hơn `0` và trạng thái thanh toán hiện tại (`payment_status`) khác `"paid"`.
   - **Ký họa hàm:**
     ```typescript
     export function caseRequiresPayment(caseData: Case): boolean {
       const price = getCaseEffectivePrice(caseData);
       return price > 0 && caseData.payment_status !== "paid";
     }
     ```

3. **`formatPrice(price)`**
   - **Mục đích:** Định dạng số tiền sang chuỗi hiển thị tiền tệ (VND).
   - **Logic:** Trả về `"Miễn phí"` nếu giá trị bằng `0`, ngược lại dùng `Intl.NumberFormat` định dạng theo chuẩn tiền tệ Việt Nam (`vi-VN`, ví dụ: `100.000 ₫`).
   - **Ký họa hàm:**
     ```typescript
     export function formatPrice(price: number): string {
       if (price === 0) return "Miễn phí";
       return new Intl.NumberFormat("vi-VN", {
         style: "currency",
         currency: "VND",
         maximumFractionDigits: 0,
       }).format(price);
     }
     ```

4. **`validatePaymentProof(file)`**
   - **Mục đích:** Kiểm tra file minh chứng thanh toán (ảnh biên lai/PDF) do người dùng tải lên.
   - **Ràng buộc:** Kích thước tối đa là 5MB; định dạng phải thuộc danh sách `["image/jpeg", "image/png", "image/webp", "application/pdf"]`.
   - **Thông báo:** Sử dụng `@mantine/notifications` để hiển thị cảnh báo lỗi cụ thể cho người dùng nếu không thỏa mãn.
   - **Ký họa hàm:**
     ```typescript
     export function validatePaymentProof(file: File): boolean
     ```

### 3.3 Backend API
- **Endpoint cập nhật giá gói:** `PUT /api/admin/packages/:id/price`
  - **Controller Handler:** `updatePackagePriceHandler` trong [admin.controller.ts](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/api/src/modules/admin/http/admin.controller.ts)
  - **Use Case:** [update-package-price.usecase.ts](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/api/src/modules/admin/application/update-package-price.usecase.ts)
  - **Repository:** `updatePackagePrice` trong [package.repository.ts](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/api/src/modules/packages/infrastructure/persistence/package.repository.ts)
  - **Đầu vào (Body Schema):**
    ```json
    {
      "price": number
    }
    ```
  - **Phản hồi (Response):** `200 OK` với JSON chứa thông tin gói dịch vụ đã cập nhật (gồm cả audit metadata).

- **API chi tiết Case:** `GET /api/cases/:id`
  - **Use Case:** [get-case-detail.usecase.ts](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/api/src/modules/cases/application/get-case-detail.usecase.ts)
  - **Mô tả:** API trả về trường `locked_price` trong phản hồi để frontend sử dụng.

- **API Upload Payment Proof:** `POST /api/payments/upload-proof` (hoặc tương tự)
  - **Use Case:** [upload-payment-proof.usecase.ts](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/api/src/modules/payments/application/upload-payment-proof.usecase.ts)
  - **Mô tả:** Đọc `Case.locked_price` để gán giá trị chính xác cho `Payment.amount`, thay vì dùng giá của `ServicePackage` tại thời điểm tải lên.

### 3.4 Frontend UI Components liên quan
- **Custom Hook:** [useAdminPackages.ts](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/web-1/app/admin/hooks/useAdminPackages.ts)
- **UI Admin Settings:** [AdminPackagesSettings.tsx](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/web-1/app/admin/_components/AdminPackagesSettings.tsx) - hiển thị danh sách gói và lịch sử thay đổi giá cũ của Admin.
- **UI Student Workspace & Payment:**
  - [UnpaidAlertBanner.tsx](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/web-1/app/dashboard/case/[id]/_components/UnpaidAlertBanner.tsx): Sử dụng `getCaseEffectivePrice` hiển thị số tiền cần trả trên banner thông báo.
  - [CreditPanel.tsx](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/web-1/app/dashboard/case/[id]/_components/CreditPanel.tsx) + [CreditQuantityModal.tsx](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx): mua credit (giá 39,000 VND/credit) — thay thế `PaymentDrawer` (đã không còn tồn tại).
  - [CreditTransactionHistory.tsx](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/web-1/app/dashboard/case/[id]/_components/CreditTransactionHistory.tsx) + [CreditBalanceCard.tsx](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/web-1/app/dashboard/case/[id]/_components/CreditBalanceCard.tsx): lịch sử giao dịch + số dư credit.
  - [/payment/page.tsx](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/web-1/app/dashboard/case/[id]/payment/page.tsx): Trang thanh toán chi tiết sử dụng `caseRequiresPayment`, `getCaseEffectivePrice` để tạo mã QR chuyển khoản chính xác và hiển thị thông tin hóa đơn.
