# Intake Package Adaptation & Document Categories UX

**Date**: 2026-09-16 14:00  
**Status**: Resolved  
**Scope**: Shared Validation, Intake Stepper, Document Categories, API & Web-1  
**Plan**: `plans/260916-1400-intake-package-adaptation-and-ux/plan.md`  

---

## 1. What Happened

Trước đây form Intake được thiết kế cứng nhắc theo 1 luồng duy nhất cho mọi gói dịch vụ, bắt buộc sinh viên nộp hồ sơ phải chọn "Nhu cầu hỗ trợ từ Mentor" dù đang mua gói 79k (vốn chỉ chạy thuần AI thẩm định). Danh mục tài liệu cũng bị phân mảnh với các ký tự đặc biệt (`/`, `()`, `&`), gây lỗi khi đồng bộ tên file và danh mục giữa frontend và backend.

## 2. Technical Decisions

1. **Chuẩn hóa Danh mục Tài liệu Cốt lõi**:
   - Định nghĩa 5 danh mục tài liệu chuẩn tại `@repo/validation`:
     1. `Thuyết minh ý tưởng`
     2. `Slide thuyết trình`
     3. `Nghiên cứu thị trường`
     4. `Kế hoạch tài chính`
     5. `Tài liệu bổ sung`
   - Cung cấp các hàm chuẩn hóa `canonicalizeDocCategory` và nhãn hiển thị `docCategoryLabel` có cơ chế fallback cho dữ liệu cũ.
2. **Form Intake Thích ứng Theo Gói (Adaptive Intake)**:
   - Gói 79k (`pkg_ai_audit`): Stepper tự động rút gọn thành 6 bước (bỏ hoàn toàn bước hỏi về Mentor / Supporter), hiển thị cam kết SLA kết quả nhanh trong 1 phút, form gửi payload sạch không chứa dữ liệu rác.
   - Gói 149k (`pkg_supporter_audit`): Giữ nguyên 7 bước đầy đủ với phần nhập nhu cầu chuyên sâu.
3. **Tương thích Dữ liệu Cũ tại Workspace**:
   - Màn hình tài liệu tự động gộp các danh mục cũ (như khảo sát, phỏng vấn) vào chung 1 nhóm "Nghiên cứu thị trường" để giao diện không bị lộn xộn.
4. **Trọng số Hoàn thiện Hồ sơ Phù hợp (Completeness Score)**:
   - Backend tính điểm độ đầy đủ hồ sơ theo gói: Gói 79k chia đều cho 4 tiêu chí cốt lõi (25% mỗi tiêu chí), giúp hồ sơ đạt 100% khi sinh viên điền đủ thông tin mà không bị trừ điểm oan.

## 3. Key Changes

- `packages/validation/src/index.ts`: Export 5 danh mục tài liệu chuẩn và các helper mapping. Chuyển trường `support_needs` sang optional trong schema.
- `apps/web-1/app/dashboard/intake/`: Tái cấu trúc stepper, điều kiện hóa các bước theo `package_id`.
- `apps/api/src/modules/cases/application/list-admin-cases.usecase.ts`: Cập nhật logic tính điểm completeness cho case 79k.
- `prisma/migrations/manual_canonicalize_doc_categories.sql`: Script chuẩn hóa dữ liệu tài liệu cũ trên production.

## 4. Verification

- Kiểm thử tạo hồ sơ gói 79k: Stepper chuyển 6 bước mượt mà, hồ sơ đạt 100% độ đầy đủ, không phát sinh lỗi validation.
- Bộ test suite `cp1-intake-validation.test.ts` tại backend đạt 63/63 tests pass.
- Các hồ sơ cũ mở trên case workspace hiển thị đúng các danh mục mới, không bị gãy giao diện.
