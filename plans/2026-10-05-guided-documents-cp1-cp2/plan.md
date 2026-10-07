# Kế hoạch Triển khai: Guided Documents CP1/CP2 (Kiến trúc Ponytail - 1 Bảng)

**Cập nhật:** 2026-10-08 (Dựa trên Quyết định Tối giản Ponytail)
**Mục tiêu:** Cho phép sinh viên/founder điền form trả lời các câu hỏi (CP1/CP2) để tự động xuất ra file DOCX chuẩn.

## Nguyên tắc cốt lõi (Ponytail Approach)
1. **Hardcode Template:** Không xây dựng hệ thống Admin UI và DB để quản lý template. CP1 và CP2 được viết cứng bằng TypeScript.
2. **Khóa 1 chiều (1-Way Lock):** Chỉ khóa UI câu hỏi sau nếu câu trước chưa điền (để dắt tay sinh viên). Bỏ hoàn toàn logic `needs_review` hay vô hiệu hóa dây chuyền khi quay lại sửa câu cũ.
3. **1 Bảng Duy Nhất:** Chỉ lưu trạng thái text mới nhất vào `ProjectAnswer`. Không lưu lịch sử keystroke. DocumentRecord (file DOCX) mới là snapshot vĩnh viễn.
4. **Import Stateless:** Gọi AI tách text từ file cũ và trả thẳng JSON về Frontend điền vào form. Không lưu bảng nháp.
5. **Sinh File Đồng Bộ:** API nối text và xuất file DOCX chạy đồng bộ (sync), cực nhanh, không cần Queue hay Worker.

## Các Giai đoạn Triển khai
- [Yêu cầu Nghiệp vụ Gốc](./brainstorm.md) (Business Ground Truth)
- [Báo cáo Hướng dẫn Triển khai Kỹ thuật](./reports/2026-10-08-technical-implementation-guidelines.md) (Dành cho Dev/Agent)
- [Báo cáo Nghiên cứu Kỹ thuật Sinh DOCX & Lộ trình Template-driven](./reports/2026-10-08-docx-generation-solutions-research.md) (Phương án dự phòng)
- [Phase 1: Cơ sở Dữ liệu (1 Bảng)](./phase-01-database.md)
- [Phase 2: Hardcode Templates](./phase-02-templates.md)
- [Phase 3: API Authoring (Upsert)](./phase-03-api.md)
- [Phase 4: Import Stateless](./phase-04-import-stateless.md)
- [Phase 5: Frontend Workspace (Khóa 1 chiều)](./phase-05-frontend.md)
- [Phase 6: API Sinh File Đồng bộ](./phase-06-sync-generate.md)