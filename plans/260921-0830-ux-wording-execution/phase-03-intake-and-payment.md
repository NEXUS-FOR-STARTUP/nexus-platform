# Phase 3: Intake & Payment (Conversion Funnel)

## 1. Mục tiêu & Nguyên tắc chuyển đổi
- **Xóa bỏ chữ `Credit` khỏi Student UI:** Sinh viên không mua "credit" vô hình — sinh viên mua **"Lượt đánh giá"** cho dự án.
- **Rõ ràng về gói 79.000đ:** Khẳng định gói gồm **2 lượt đánh giá** (Lượt 1: đánh giá lần đầu; Lượt 2: đánh giá lại sau khi chỉnh sửa).
- **Chuẩn hóa đối tượng:** `Hồ sơ / Case → Dự án`, `File nộp / Input package → Tài liệu của nhóm`.
- **Minh bạch cơ chế Ví & Thanh toán:** Ví chỉ là phương tiện nạp tiền. Sau khi nạp đủ, hệ thống cấp lượt đánh giá cho dự án.
- **Không hứa hẹn sai thời gian:** Bỏ các cụm *"tức thì"*, *"< 1 phút"*; dùng *"thường có sau khoảng 10 phút"*.

---

## 2. Danh sách Files cần sửa

### A. Intake Form
1. `apps/web-1/app/dashboard/intake/page.tsx`
2. `apps/web-1/app/dashboard/intake/_components/IntakeProgressStepper.tsx`
3. `apps/web-1/app/dashboard/intake/_components/IntakeChatFlow.tsx`
4. `apps/web-1/app/dashboard/intake/_components/Steps/ProjectContextStep.tsx`
5. `apps/web-1/app/dashboard/intake/_components/Steps/DocumentInputStep.tsx`
6. `apps/web-1/app/dashboard/intake/_components/Steps/SituationStep.tsx`
7. `apps/web-1/app/dashboard/intake/_components/Steps/SupportNeedsStep.tsx`
8. `apps/web-1/app/dashboard/intake/_components/Steps/BoundaryStep.tsx`
9. `apps/web-1/app/dashboard/intake/_components/Steps/ContactStep.tsx`
10. `apps/web-1/app/dashboard/intake/_components/Steps/ReviewSubmitStep.tsx`

### B. Package Selection & Credit Modals
11. `apps/web-1/app/dashboard/_components/PackageSelectionModal.tsx`
12. `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx`
13. `apps/web-1/app/dashboard/case/[id]/_components/CreditBalanceCard.tsx`
14. `apps/web-1/app/dashboard/case/[id]/_components/CreditActions.tsx`
15. `apps/web-1/app/dashboard/case/[id]/_components/UnpaidAlertBanner.tsx`

### C. Wallet & Payment Pages
16. `apps/web-1/app/dashboard/wallet/page.tsx`
17. `apps/web-1/app/dashboard/wallet/_components/WalletBalanceCard.tsx`
18. `apps/web-1/app/dashboard/wallet/_components/WalletTopupModal.tsx`
19. `apps/web-1/app/dashboard/wallet/_components/WalletTransactionTable.tsx`
20. `apps/web-1/app/dashboard/payment/page.tsx`
21. `apps/web-1/app/dashboard/case/[id]/payment/page.tsx`

---

## 3. Chi tiết thay đổi

### 3.1. Nhóm Intake Form
- **Tiêu đề trang (`intake/page.tsx`):**
  - Cũ: `Tạo hồ sơ đánh giá mới`
  - Mới: `Đăng ký đánh giá dự án`
  - Subtitle: *Cung cấp thông tin dự án và tải lên tài liệu để bắt đầu quy trình đánh giá.*
- **`IntakeProgressStepper.tsx` (Nguyên tắc bắt buộc: KHÔNG THAY ĐỔI CẤU TRÚC HOẶC THỨ TỰ BƯỚC):**
  - Giữ nguyên 100% các bước hiện hữu trong code (bao gồm cả bước thông tin liên hệ / người đại diện).
  - Chỉ đổi label của các bước theo đúng semantic của dữ liệu đang nhập:
    - Bước thông tin/bối cảnh: `Thông tin dự án` (thay vì `Context`)
    - Bước tài liệu: `Tải tài liệu` (thay vì `Tài liệu nộp`)
    - Bước liên hệ: `Thông tin liên hệ`
    - Bước khó khăn/vấn đề: `Tình trạng hiện tại` (thay vì `Điểm kẹt`)
    - Bước xác nhận: `Xác nhận & Nộp`
- **`DocumentInputStep.tsx`:**
  - Tiêu đề: `Tải lên tài liệu dự án`
- Hướng dẫn (Bám sát capability thật của hệ thống): *Hỗ trợ PDF, PPTX, DOCX, XLSX, MD và TXT · tối đa 5 tệp, 15MB mỗi tệp.*
  - Xóa bỏ hoàn toàn mọi nhắc đến `Google Drive link`.
- **`ReviewSubmitStep.tsx`:**
  - Tiêu đề: `Kiểm tra thông tin trước khi gửi`
  - Nút Submit: `Tạo dự án & Tiếp tục thanh toán` (Thay vì `Nộp hồ sơ ngay`).
  - Ghi chú chân trang: *Sau khi tạo dự án, bạn sẽ tiến hành chọn gói và bắt đầu quá trình đánh giá.*

### 3.2. Nhóm Package Selection Modal (`PackageSelectionModal.tsx`)
- **Tiêu đề modal:** `Chọn gói đánh giá cho dự án`
- **Gói 79.000đ (Sản phẩm hoạt động cốt lõi):**
  - Tên hiển thị: **Đánh giá Dự án Tự động**
  - Đơn giá: `79.000đ` – `Gói 2 lượt đánh giá`
  - Mô tả: *Đánh giá tài liệu qua 5 nhóm tiêu chí cốt lõi. Bao gồm 2 lượt (đánh giá ban đầu và đánh giá lại sau khi sửa).* *(Bỏ từ "toàn diện")*.
  - Bỏ claim `< 1 phút` -> Thay bằng: *Kết quả thường có sau khoảng 10 phút*.
  - Nút bấm: `Chọn gói này`
- **Xử lý lựa chọn Premium (Chốt quyết định dứt điểm):**
  - **ẨN HOÀN TOÀN THẺ PREMIUM KHỎI MODAL CHỌN GÓI TRONG ĐỢT NÀY.**
  - Sinh viên chưa thể mua hoặc sử dụng quy trình này; ẩn hoàn toàn để tập trung vào gói 79k, tránh gây hiểu lầm hoặc lỗi mua.
  - Không hiển thị giá 149.000đ, không hiển thị checklist tính năng chưa hỗ trợ.
### 3.3. Nhóm Modal & Card số dư lượt (`CreditQuantityModal.tsx`, `CreditBalanceCard.tsx`)
- **`CreditQuantityModal.tsx`:**
  - Tiêu đề Modal: `Mua gói đánh giá dự án` (Thay vì `Thanh toán gói đánh giá`)
  - Label số lượng: `Số lượng gói (79.000đ / gói 2 lượt)` (Thay vì `Số lượng credit`)
  - Tình trạng ví thiếu tiền: `Số dư chưa đủ — cần nạp thêm ${formatPrice(shortage)} để mua gói đánh giá`
  - Nút bấm khi thiếu tiền: `Nạp tiền & Mua gói qua VietQR`
  - Nút bấm khi đủ tiền: `Thanh toán ${formatPrice(totalAmount)}`
  - Toast thành công (Chốt duy nhất, tính động theo số lượt thực nhận): `Đã thêm ${creditsGranted} lượt đánh giá cho dự án. Hãy nhấn "Bắt đầu đánh giá" để tiến hành phân tích.`
- **`CreditBalanceCard.tsx`:**
  - Label số dư: `Lượt đánh giá khả dụng` (Thay vì `Số dư credit`)
  - Đơn vị: `lượt` (Thay vì `credit`)
  - Trạng thái hết: Badge `Hết lượt đánh giá` (Thay vì `Hết credit`)
  - Nút hành động: `Mua thêm lượt đánh giá` (Thay vì `Mua credit`)
- **`UnpaidAlertBanner.tsx`:**
  - Cũ: *Dự án chưa kích hoạt credit thẩm định...*
  - Mới: *Dự án chưa có lượt đánh giá. Nhóm cần mua gói đánh giá (79.000đ / 2 lượt) để bắt đầu phân tích tài liệu.*
  - Nút CTA: `Mua lượt đánh giá ngay`

### 3.4. Nhóm Wallet & Payment (`wallet/page.tsx`, `payment/page.tsx`)
- **`WalletBalanceCard.tsx`:**
  - Tiêu đề: `Số dư ví Nexus`
  - Subtitle: *Dùng để thanh toán các gói đánh giá dự án.*
  - Nút nạp: `Nạp tiền vào ví`
- **`WalletTopupModal.tsx`:**
  - Hướng dẫn gợi ý nạp: *Gợi ý nạp 79.000đ để mua gói 2 lượt đánh giá dự án.*
- **`WalletTransactionTable.tsx`:**
  - Loại giao dịch nạp: `Nạp tiền qua VietQR`
  - Loại giao dịch trừ (Chốt duy nhất): `Mua gói đánh giá dự án (${creditsGranted} lượt)`

---

## 4. Checklist kiểm tra & Tiêu chí nghiệm thu (Verification)

1. **Build & Type Check:**
   ```bash
   bun run check-types
   ```
2. **Grep cấm từ trong Intake & Payment (Bao gồm Case Components):**
   ```bash
   grep -E "credit|Credit|Hồ sơ chưa đặt tên|Google Drive|thẩm định chuyên sâu|SLA|149\.000" apps/web-1/app/dashboard/intake/ apps/web-1/app/dashboard/wallet/ apps/web-1/app/dashboard/payment/ 'apps/web-1/app/dashboard/case/[id]/_components/'
   ```
   *Kỳ vọng:* Không còn từ `credit`, `Google Drive` hoặc giá `149.000` hiển thị trên UI sinh viên.
3. **Kiểm tra trực quan (UI Flow Verification):**
   - Modal chọn gói hiển thị rõ ràng: `79.000đ` kèm dòng `Gói 2 lượt đánh giá`.
   - Card số dư trong trang chi tiết dự án hiển thị `X lượt`, không còn chữ `credit`.
   - Modal thanh toán giải thích rõ ràng số tiền và số lượt nhận được.
   - Không có bước nào hứa hẹn kết quả có sau `< 1 phút`.
