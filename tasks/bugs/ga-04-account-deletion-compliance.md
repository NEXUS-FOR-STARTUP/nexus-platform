# GA-04: Xóa tài khoản / yêu cầu xóa dữ liệu cá nhân (Tuân thủ NĐ 13/2023/NĐ-CP)

- **ID:** GA-04
- **Priority:** P0 (Khẩn cấp / Pháp lý)
- **Category:** Legal / Compliance
- **Status:** Todo
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Căn cứ pháp lý:** Nghị định số 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân - Quyền xóa dữ liệu trong vòng 72 giờ)

---

## 1. Mô tả vấn đề
Hiện tại tầng Backend chỉ có chức năng Admin ban/unban người dùng (`admin.controller.ts:48-50`). Hoàn toàn chưa có endpoint cho người dùng tự yêu cầu xóa tài khoản hoặc Admin thực hiện quyền xóa dữ liệu cá nhân theo yêu cầu. Điều này vi phạm quy định pháp lý bắt buộc của NĐ 13/2023/NĐ-CP (quyền rút lại sự đồng ý và yêu cầu xóa dữ liệu cá nhân trong 72h).

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Endpoint API:**
   - Người dùng tự yêu cầu: `DELETE /api/profile/account` hoặc `POST /api/profile/deletion-request`.
   - Admin xử lý/duyệt xóa: `DELETE /api/admin/users/:id`.
2. **Xử lý dữ liệu & Ràng buộc toàn vẹn (Cascade / Anonymization):**
   - Không được làm đứt gãy tính toàn vẹn của dữ liệu tài chính (bảng `deposits`, `orders`, `user_wallets`).
   - Ẩn danh hóa thông tin cá nhân (PII): tên $\rightarrow$ `Anonymous User`, email $\rightarrow$ hash/null, số điện thoại $\rightarrow$ xóa.
   - Xóa các phiên đăng nhập (`sessions`), token xác thực (`verification`), tài khoản OAuth (`accounts`).
   - Vô hiệu hóa hoặc ẩn các case/message liên quan của người dùng.
3. **Giao diện người dùng (Frontend):**
   - Thêm khu vực "Vùng nguy hiểm (Danger Zone)" tại `apps/web-1/app/dashboard/settings/profile/` với nút "Xóa tài khoản".
   - Modal xác nhận 2 bước (yêu cầu nhập lại mật khẩu hoặc xác nhận OTP qua email).
