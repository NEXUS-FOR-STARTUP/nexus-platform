# Brainstorm & Design Summary: Chính sách Pháp lý & Ghi nhận Consent (GA-12)

- **Mã nhiệm vụ:** GA-12 (P1#8)
- **Ngày lập:** 2026-08-30
- **Phân loại:** Legal / Compliance / Frontend & Schema Integration
- **Căn cứ pháp lý:** Nghị định số 13/2023/NĐ-CP (Điều 11 — Sự đồng ý của chủ thể dữ liệu), Luật An ninh mạng 2018, Luật Bảo vệ quyền lợi người tiêu dùng 2023.

---

## 1. Problem Statement (Vấn đề cần giải quyết)

1. **Thiếu văn bản pháp lý chính thức:** Người dùng đăng ký tài khoản nhưng hệ thống chưa có trang Điều khoản dịch vụ (`/terms`) và Chính sách bảo mật (`/privacy`).
2. **Checkbox đăng ký là text tĩnh:** `AuthPanel.tsx` có checkbox "Tôi đồng ý với điều khoản dịch vụ" nhưng không có liên kết điều hướng đến văn bản thực tế.
3. **Footer chưa có link thật:** `AppShell.tsx` footer đang trỏ `href: "#"` cho hai liên kết chính sách.
4. **Không lưu bằng chứng chấp thuận (Consent Audit Trail):** Database chưa lưu trữ `consent_version` và `consented_at` khi người dùng tạo tài khoản, vi phạm quy định về trách nhiệm chứng minh sự đồng ý theo Điều 11 Nghị định 13/2023/NĐ-CP.

---

## 2. Các phương án đã đánh giá (Evaluated Approaches)

| Tiêu chí | Phương án A (Khuyến nghị): Full Compliance (Văn bản + Consent Tracking) | Phương án B: Trang tĩnh thuần túy (Static-only) | Phương án C: Tích hợp Third-party CMP (Iubenda/Termly) |
|---|---|---|---|
| **Văn bản pháp lý** | Soạn thảo bespoke theo đúng dữ liệu thực tế của Nexus (AI, SePay, Centrifugo, Cloudinary). | Template chung chung, không sát thực tế codebase. | Sinh tự động qua widget bên ngoài. |
| **Ghi nhận Consent DB** | Thêm `consent_version`, `consented_at` vào bảng `users`. Bắt buộc ghi nhận khi signup. | Không lưu DB, chỉ validate ở frontend. | Lưu trên cloud của CMP, không chủ động truy xuất được trong DB. |
| **Tuân thủ NĐ 13/2023** | **Đạt 100%** (Có văn bản + Bằng chứng đồng ý + Quyền xóa 72h đã có ở GA-04). | **Không đạt** (Thiếu bằng chứng đồng ý). | Đạt nhưng phát sinh chi phí hàng tháng & phụ thuộc cookie banner bên thứ ba. |
| **Độ phức tạp kỹ thuật** | Thấp - Trung bình (Migration an toàn additive + 2 page Next.js + Better Auth hook). | Cực thấp (2 static page). | Trung bình (Tích hợp script ngoài). |

**Quyết định:** Chọn **Phương án A**.

---

## 3. Thiết kế Chi tiết & Kế hoạch Triển khai (Solution Design)

### 3.1. Cấu trúc Nội dung Văn bản Pháp lý

#### A. Điều khoản dịch vụ (`/terms` - Terms of Service)
1. **Định nghĩa & Phạm vi Dịch vụ:** Dịch vụ tư vấn, phản biện, cấu trúc hóa ý tưởng/tài liệu cho sinh viên khởi nghiệp (EXE101/CP1).
2. **Quyền Sở hữu Trí tuệ (IP Rights - Trọng tâm):**
   - Mọi ý tưởng, bản thuyết trình, file tài liệu do sinh viên tải lên **thuộc quyền sở hữu trí tuệ tuyệt đối của sinh viên/nhóm sinh viên**.
   - Nexus chỉ được cấp quyền hạn chế (limited license) để lưu trữ và phân tích dữ liệu phục vụ trực tiếp cho việc xử lý case của nhóm.
3. **Liêm chính Học thuật (Academic Integrity):**
   - Nexus là công cụ hỗ trợ phân tích và phản biện; **tuyệt đối không viết hộ bài, không làm thay sản phẩm**.
   - Nexus không cam kết điểm số hoặc kết quả vượt qua môn học của nhà trường.
4. **Vận hành Case & Thanh toán:** Quy tắc sử dụng ví VND, quy định trừ lượt khi supporter nộp báo cáo, quy định hoàn tiền khi admin veto.
5. **Quy tắc Ứng xử & Chấm dứt Tài khoản:** Cấm spam, cấm dùng bot/cào dữ liệu, quy định về khóa tài khoản khi vi phạm.

#### B. Chính sách Bảo mật Dữ liệu Cá nhân (`/privacy` - Privacy Policy)
1. **Thông tin Bên kiểm soát Dữ liệu:** Nexus Platform & thông tin tiếp nhận yêu cầu bảo vệ dữ liệu.
2. **Danh mục Dữ liệu Xử lý:**
   - Dữ liệu tài khoản: Họ tên, email, mật khẩu (mã hóa argon2id/bcrypt), avatar.
   - Dữ liệu kỹ thuật: Địa chỉ IP, User-Agent, Session logs (OWASP compliance).
   - Dữ liệu giao dịch: Lịch sử nạp tiền qua SePay, mã đơn hàng.
   - Dữ liệu dự án: Nội dung idea, tài liệu checkpoint, nội dung chat realtime.
3. **Bên thứ ba Xử lý Dữ liệu (Sub-processors):**
   - Vercel AI SDK (OpenAI/Google Gemini): Phân tích ý tưởng và hỗ trợ supporter soạn thảo draft.
   - SePay / VietQR: Xử lý giao dịch nạp ví ngân hàng.
   - Centrifugo: Hạ tầng kết nối realtime chat.
   - Cloudinary: Lưu trữ hình ảnh và tệp tài liệu.
   - Resend: Gửi email OTP xác thực và thông báo hệ thống.
4. **Quyền của Chủ thể Dữ liệu (Nghị định 13/2023):**
   - Quyền được biết, quyền đồng ý, quyền truy cập, quyền chỉnh sửa.
   - **Quyền rút lại sự đồng ý & Xóa dữ liệu:** Quy trình xóa tài khoản tự động trong 72h (đã kiểm thử tại GA-04).
5. **Thời hạn lưu trữ & Cam kết Thông báo Sự cố (Data Breach):** Cam kết xử lý và thông báo sự cố rò rỉ dữ liệu trong 72 giờ.

---

### 3.2. Thiết kế Cơ sở Dữ liệu & An toàn Migration (`prisma-migration-safety.md`)

- **Bản chất thay đổi:** Additive Safe Change (Thêm 2 cột nullable vào bảng `users`).
- **Chi tiết trường bổ sung:**
  ```prisma
  // In model User (prisma/schema.prisma)
  consent_version    String?   // Phiên bản điều khoản đồng ý (vd: "2026-08-v1")
  consented_at       DateTime? // Thời điểm ghi nhận đồng ý
  ```
- **Quy trình tuân thủ an toàn:**
  1. Thêm trường dạng nullable `?` trong `prisma/schema.prisma`.
  2. Tạo migration an toàn bằng lệnh:
     ```bash
     npx prisma migrate dev --create-only --name add_user_consent_tracking
     ```
  3. Kiểm tra file SQL sinh ra (chỉ chứa các lệnh `ALTER TABLE "users" ADD COLUMN ...`).
  4. Thực hiện `prisma generate` để cập nhật TypeScript types.

---

### 3.3. Tích hợp Frontend & API

1. **Trang `/terms` và `/privacy`:**
   - Xây dựng layout tĩnh với Mantine UI v9, font chữ rõ ràng, thanh điều hướng mục lục bên hông (TOC).
   - Responsive tốt trên cả mobile và desktop.
2. **Cập nhật `AuthPanel.tsx`:**
   - Sửa label checkbox thành:
     `Tôi đồng ý với [Điều khoản dịch vụ](/terms) và [Chính sách bảo mật](/privacy)` (mở new tab `target="_blank"`).
   - Khi submit form đăng ký thành công, gửi metadata hoặc gọi endpoint cập nhật `consent_version = "2026-08-v1"` và `consented_at = now()`.
3. **Cập nhật `AppShell.tsx`:**
   - Trỏ `footerLinks` từ `#` sang `/privacy` và `/terms`.

---

## 4. Kế hoạch Thực hiện Chi tiết (Phases)

- **Phase 1 (Schema & Migration):** Cập nhật `schema.prisma`, sinh migration additive an toàn theo `prisma-migration-safety.md`, chạy `prisma generate` và kiểm tra type check.
- **Phase 2 (Content Drafting):** Soạn thảo hoàn chỉnh nội dung văn bản tiếng Việt cho `/terms` và `/privacy` bám sát thực tế kiến trúc Nexus.
- **Phase 3 (Frontend Pages & Layout):** Tạo `apps/web-1/app/terms/page.tsx` và `apps/web-1/app/privacy/page.tsx`.
- **Phase 4 (Auth & Footer Integration):** Cập nhật `AuthPanel.tsx` (hyperlink + ghi nhận consent) và `AppShell.tsx` (footer links).
- **Phase 5 (Verification & QA):** Kiểm thử luồng đăng ký mới, kiểm tra lưu DB, kiểm tra hiển thị trên mobile/desktop, chạy `npm run check-types` và `npm test`.

---

## 5. Tiêu chí Nghiệm thu (Acceptance Criteria)

1. Truy cập được `/terms` và `/privacy` từ mọi trình duyệt mà không cần đăng nhập.
2. Checkbox tại form đăng ký chứa link mở tab mới tới 2 trang trên.
3. Người dùng đăng ký mới được lưu `consent_version = "2026-08-v1"` và `consented_at` trong bảng `users`.
4. Footer trên toàn trang web dẫn link chính xác đến 2 trang chính sách.
5. Toàn bộ TypeScript check pass 100% (`npm run check-types`).
