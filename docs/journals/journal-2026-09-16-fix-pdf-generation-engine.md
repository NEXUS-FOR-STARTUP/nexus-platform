# Fix Typst PDF Generation Engine on Production Docker

**Date**: 2026-09-16 20:00  
**Status**: Resolved  
**Scope**: Dockerfile, Backend Build Pipeline, Typst Runtime, Reports Service  
**Plan**: `plans/260916-2000-fix-pdf-generation-engine/plan.md`  

---

## 1. What Happened

Trên môi trường Production Docker, người dùng bấm nút tải báo cáo thẩm định (`GET /api/reports/:id/download?view=inline`) bị lỗi `500 PDF_GENERATION_FAILED`. Nguyên nhân gốc là do Docker image của `apps/api` thiếu binary thực thi `typst` và script build của API không copy các tài nguyên tĩnh (`templates/report.typ` và font chữ `fonts/Merriweather/*`) vào thư mục phân phối `dist/`.

## 2. Technical Decisions

1. **Cài đặt Binary Typst Chính thức vào Container Docker**:
   - Thêm bước tải và giải nén release binary `typst-x86_64-unknown-linux-musl` trực tiếp vào `/usr/local/bin/typst` trong multi-stage build của `apps/api/Dockerfile`.
2. **Đóng gói Static Assets vào Thư mục `dist/`**:
   - Bổ sung lệnh copy thư mục `templates` và `fonts` trong script `build` của `apps/api/package.json`.
3. **Cơ chế Fallback Đường dẫn Tài nguyên (Path Resolution)**:
   - Trong `pdfService.ts`, thiết lập cơ chế kiểm tra đường dẫn đa tầng: kiểm tra trước tại thư mục cùng cấp với `__dirname` (`dist/modules/reports/infrastructure/pdf/templates/`), nếu không có sẽ fallback về thư mục gốc dự án hoặc biến môi trường `TYPST_TEMPLATES_DIR`.
4. **Bảo tồn Font Chữ Tiếng Việt Đẹp Chuẩn In Ấn**:
   - Sử dụng font Merriweather nhúng kèm, đảm bảo báo cáo A4 xuất ra không bị lỗi ô vuông chữ có dấu (tofu character) trên server Linux Alpine/Debian.

## 3. Key Changes

- `apps/api/Dockerfile`: Tải và cài đặt Typst CLI binary, copy static assets sang production image.
- `apps/api/package.json`: Cập nhật `build` script tự động sao chép templates và fonts vào `dist/`.
- `apps/api/src/modules/reports/infrastructure/pdf/pdfService.ts`: Cải thiện hàm tìm kiếm template và font với cơ chế fallback path an toàn.

## 4. Verification

- Chạy build Docker image của API và kiểm tra lệnh `typst --version` trong container trả về phiên bản hợp lệ.
- Thực hiện test gọi API xuất PDF từ môi trường container: Báo cáo biên dịch thành công trong ~800ms, file PDF A4 mở ra hiển thị chuẩn xác toàn bộ tiêu đề, bảng biểu và ký tự tiếng Việt.
- Nút "Tải báo cáo PDF" trên giao diện sinh viên hoạt động trơn tru, không còn lỗi 500.
