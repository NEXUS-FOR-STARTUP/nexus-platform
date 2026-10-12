# Phase 6: API Sinh File Đồng Bộ (Sync Generation)

Bỏ hoàn toàn cơ sở hạ tầng BullMQ Queue cho tính năng này. Sinh file DOCX và trả ngay trong 1 Request.

## 1. POST /api/v1/guided-documents/:caseId/generate
**Logic Backend:**
1. Lấy toàn bộ `ProjectAnswer` mới nhất của `caseId`.
2. Đọc `TemplateDef` (cp1.ts) để sắp xếp đúng thứ tự cấu trúc (đề mục, câu hỏi).
3. Dùng thư viện `docx` render văn bản ngay trong RAM buffer (bước này chỉ mất ~50-100ms do không dùng AI polish text).
4. Lấy buffer upload thẳng lên Cloudinary (bước này tốn khoảng 1-2s). Nhận về `secure_url`.
5. Sinh một bản ghi trong bảng `DocumentRecord` (tái sử dụng kiến trúc module documents có sẵn), gắn cờ `type: "GUIDED_DOC"`.
6. Trả ngay `secure_url` và `document_id` về cho Frontend tải xuống máy.

**Logic Frontend:**
- Trạng thái `isGenerating = true`.
- Hiển thị spinner (xoay tròn) hoặc thanh tiến trình giả lập (1-3s).
- Chờ response 200 OK -> Tự động tải file / Mở tab mới.
- Bắt lỗi timeout hoặc 500 để cho phép user thử lại.

## Lưu ý Nâng cấp (Upgrade Path):
- Hiện tại MVP dùng code-first `docx` (npm). Nếu sau này cần hỗ trợ form mẫu phức tạp của trường (trang bìa, header/footer, bảng biểu), xem giải pháp Template-driven (`docxtemplater`) trong [Báo cáo Nghiên cứu Kỹ thuật Sinh DOCX](./reports/2026-10-08-docx-generation-solutions-research.md).