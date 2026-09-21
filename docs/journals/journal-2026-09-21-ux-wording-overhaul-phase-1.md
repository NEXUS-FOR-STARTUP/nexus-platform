# Journal: UX Wording Overhaul - Full Execution (Phases 1 to 6)

- **Date:** 2026-09-21
- **Scope:** `plans/260921-0830-ux-wording-execution/` & Full Monorepo Student UI Overhaul
- **Status:** Completed

## 1. 10 Quyết định Định vị & Wording Ràng buộc Đã Thực thi
1. **Team Fit (Phase 2):** Khẳng định tính chất preview/surface scan sơ bộ, không overclaim phân tích sâu. Giữ nguyên 3 field implementation thật (`Chuyên ngành`, `Thế mạnh / kỹ năng nổi bật`, `Kinh nghiệm`).
2. **Bỏ từ "toàn diện":** Loại bỏ hoàn toàn tính từ tiếp thị này khỏi toàn bộ copy sinh viên và landing page.
3. **5 nhóm tiêu chí chuẩn AI engine:** Bám sát engine thật: `vấn đề, thị trường, mô hình kinh doanh, lợi thế cạnh tranh và khả năng triển khai`.
4. **Giữ nguyên cấu trúc Intake (Phase 3):** Không thay đổi thứ tự hay số lượng bước intake. Đổi label theo semantic dữ liệu nộp.
5. **Định dạng Upload thật (Phase 3 & 6):** Cắt chuyển sạch hằng số `CP1_MAX_DOCUMENTS = 5` tại `packages/validation/src/index.ts`, cập nhật kiểm thử boundary, thông báo đúng: `Hỗ trợ PDF, PPTX, DOCX, XLSX, MD và TXT · tối đa 5 tệp, 15MB mỗi tệp`.
6. **Xử lý bug hiển thị "Phiên bản 0" (Phase 5):** Thêm guard kiểm tra kiểu và map `displayVersion = round.version_no + 1` để v00 hiển thị đúng là Phiên bản 1.
7. **Error / Refund state (Phase 4):** Phân biệt `rejected` với `failed`. Chỉ hiển thị thông báo hoàn lượt khi backend xác nhận có sự cố kỹ thuật và refund event.
8. **Chốt 1 quyết định duy nhất (Xóa sạch phương án "hoặc / alternative"):**
   - H1: `Đánh giá và phản biện dự án khởi nghiệp`
   - Hero CTA: `Kiểm tra nhanh ý tưởng` -> `/dashboard/team-fit`
   - Secondary CTA: `Xem bảng giá`
   - Header CTA: `Đăng nhập`
   - Premium: Ẩn hoàn toàn khỏi Landing và modal chọn gói trong đợt này.
9. **Tránh hardcode "2 lượt" (Phase 3 & 6):** Expose `totalCredits` từ backend API order response, loại bỏ client arithmetic, toast hiển thị động theo `data.totalCredits`.
10. **Privacy FAQ (Phase 1):** Bỏ từ "an toàn", sử dụng đúng câu factual mô tả việc truyền dữ liệu tới AI providers kèm link dẫn tới `/privacy`.

## 2. Kết quả Thực thi Chi tiết Từng Phase
- **Phase 1 (Landing, Pricing, FAQ, Contact):** Ẩn Premium card, căn giữa gói 79.000đ (Bao gồm 2 lượt đánh giá), bỏ contact form giả lập thay bằng thẻ liên hệ thật, link `/privacy`.
- **Phase 2 (Team Fit Free Preview):** Chuẩn hóa step labels (`Ý tưởng cốt lõi`, `Thành viên nhóm`, `Kết quả sơ bộ`), ví dụ placeholder cụ thể, constant friendly error fallback cho mọi lỗi save/mutation, upsell banner hướng tới tài liệu hoàn chỉnh.
- **Phase 3 (Intake & Payment):** Cutover `CP1_MAX_DOCUMENTS = 5`, cập nhật `DocumentInputStep.tsx`, `ReviewSubmitStep.tsx`, ẩn Premium ở `PackageSelectionModal.tsx`, chuẩn hóa `CreditQuantityModal.tsx` và `CreditBalanceCard.tsx` (dùng "lượt đánh giá", bỏ "credit").
- **Phase 4 (Case & Evaluation States):** Tách biệt `studentStatusThemeMap` riêng cho Student UI, giữ nguyên `statusThemeMap` cho Admin, humanize `radar.utils.ts`, `RadarHeader.tsx`, `StatusGuidanceCard.tsx`, cập nhật tabs `WorkspaceTabs.tsx` & `WorkspaceSidebar.tsx`.
- **Phase 5 (Report & Revision):** `displayVersion` từ 1-based, severity badges (`Cần giải quyết ngay`, `Quan trọng`, `Cần lưu ý`, `Gợi ý hoàn thiện`), nút `Mở xem toàn màn hình` và `Tải báo cáo (PDF)`, cập nhật `CreditActions.tsx`.
- **Phase 6 (Consistency Sweep & Polish):** Quét sạch các từ cấm `CP1`, `Checkpoint 1`, `thẩm định`, `kiểm định`, `Supporter chuyên môn`, `Mentor` khỏi các hook, demo preset, console log viewer và alert sinh viên.

## 3. Verification & Checks
- `turbo run check-types`: 100% Passed (0 errors trên 7 packages).
- Unit tests: `cp1-intake-validation.test.ts` (10 passed), `credit-audit-order-upgrade.test.ts` (passed).
- Banned terms grep: 0 matches trên toàn bộ UI sinh viên.
