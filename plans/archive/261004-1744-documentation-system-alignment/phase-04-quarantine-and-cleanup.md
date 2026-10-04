# Phase 4: Quarantine & Cleanup

## Context Links
- `docs/AGENTS.md`
- `docs/ai-rules/documentation-rules.md`
- `docs/journal/`
- `docs/journals/`
- `Quy-trình-khởi-nghiệp-ban-đầu.md`
- `Đánh-giá-mục-lục-startup.md`

## Overview
- **Priority:** P3
- **Status:** Completed
- **Description:** Cách ly rõ ràng các vùng tài liệu tham khảo lịch sử, dọn dẹp các thư mục và file rác gây nhầm lẫn đường dẫn để agent tìm kiếm tài liệu chuẩn xác nhất.

## Key Insights
- Thư mục `docs/journal/` chỉ chứa 1 file đơn độc `260904-ui-first-pricing-integration.md`, trong khi thư mục chính chứa journal là `docs/journals/` (52 files). Sự tồn tại của 2 folder tên gần giống nhau tạo ra rủi ro agent đọc nhầm hoặc ghi file vào sai chỗ.
- Hai file `Quy-trình-khởi-nghiệp-ban-đầu.md` (55KB) và `Đánh-giá-mục-lục-startup.md` (11KB) ở thư mục gốc thực chất là bản xuất nội dung trò chuyện với ChatGPT, không có frontmatter hay cảnh báo, gây nhiễu context khi agent quét file markdown ở root.
- `docs/research/` (15 files) và `docs/nexus-document/` (43 files) nằm trực tiếp dưới `docs/` nhưng chưa được gắn nhãn Non-canonical trong quy tắc điều hướng tài liệu.

## Requirements
1. **Dọn dẹp thư mục journal**:
   - Di chuyển file `docs/journal/260904-ui-first-pricing-integration.md` sang `docs/journals/260904-ui-first-pricing-integration.md`.
   - Xóa bỏ thư mục rỗng `docs/journal/`.
2. **Cập nhật quy tắc phân loại tài liệu trong `docs/AGENTS.md` và `docs/ai-rules/documentation-rules.md`**:
   - Khẳng định danh sách **Non-canonical / Historical Reference (Tài liệu lịch sử - Tuyệt đối không dùng làm căn cứ code)** bao gồm:
     - `docs/journals/` (nhật ký thực thi theo ngày)
     - `docs/archive/` (tài liệu kiến trúc và spec cũ đã bị thay thế)
     - `docs/research/` (các bản thảo brainstorm, rca, nghiên cứu đã khép lại)
     - `docs/nexus-document/` (tài liệu báo cáo môn học CP1-CP4, slide thuyết trình)
   - Nhắc nhở: Khi agent tìm hiểu nghiệp vụ để code, CHỈ bám vào các file canonical: `system-architecture.md`, `codebase-summary.md`, `code-standards.md`, `project-context.md`, `docs/flows/`, `docs/requirements/`, `docs/technical-notes/`.
   - Sửa tham chiếu `project-changelog.md` thành `CHANGELOG.md` trong `docs/AGENTS.md`.
3. **Di chuyển 2 file dump chat ở root**:
   - Di chuyển `Quy-trình-khởi-nghiệp-ban-đầu.md` và `Đánh-giá-mục-lục-startup.md` vào `docs/nexus-document/reference/` hoặc `docs/archive/reference/`.
   - Thêm banner cảnh báo ở đầu file: "Tài liệu tham khảo nghiệp vụ khởi nghiệp - Không phải tài liệu kỹ thuật của hệ thống".

## Verification
- Kiểm tra không còn thư mục `docs/journal/`.
- Kiểm tra thư mục gốc sạch sẽ, không còn các file `.md` tự do không rõ nguồn gốc.
- Đảm bảo `docs/AGENTS.md` mô tả taxonomy phân minh, rõ ràng giữa canonical và historical.
