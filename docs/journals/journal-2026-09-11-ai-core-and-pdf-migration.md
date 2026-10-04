# AI Core & PDF Migration: OMP Worker, SQLite DB và Typst PDF Engine

**Date**: 2026-09-11 17:00  
**Status**: Resolved  
**Scope**: AI Engine, Worker OMP, Backend API, Typst PDF  
**Plan**: `plans/260911-1700-ai-core-and-pdf-migration/plan.md`  

---

## 1. What Happened

Hệ thống cần tích hợp lõi AI Thẩm định gói 79k từ sandbox sang Nexus Platform theo phương án tinh giản, dữ liệu tập trung và chạy được ngay cho khách hàng thực tế. Toàn bộ tri thức tiêu chí (14 criteria, 29 bẫy lỗi và dữ liệu hồ sơ 12 nhóm sinh viên FPT) được lưu trực tiếp trong SQLite cục bộ thay vì viết nhiều tầng boilerplate TypeScript phức tạp.

## 2. Technical Decisions

1. **SQLite Database làm Trung tâm Tri thức (`startup_knowledge.db`)**:
   - Lưu trữ trực tiếp tiêu chí, bẫy lỗi và dữ liệu đối chiếu tại `data/knowledge/startup_knowledge.db`.
   - OMP Worker truy vấn trực tiếp file SQLite qua công cụ tra cứu tích hợp sẵn trong OMP CLI.
2. **Kế thừa Cơ chế OMP Worker Sandbox**:
   - Thiết lập thư mục thực thi job độc lập (`input/`, `knowledge/`, `system_prompt/`, `AGENTS.md`).
   - Gọi `omp` CLI tự động phân tích và xuất thẳng ra `output/report.json` kèm `output/input_clarification_audit.md`.
3. **Biên dịch Báo cáo Typst PDF A4 Vector**:
   - Chuyển markdown thẩm định sang file PDF A4 sắc nét bằng Typst CLI với template `report.typ` và font `Merriweather`.
4. **Tích hợp Backend & Giao diện Sinh viên**:
   - Lưu kết quả `report.json` vào bảng `reports` gắn với Case.
   - Frontend hiển thị giao diện báo cáo radar phản biện và cung cấp nút tải trực tiếp file PDF.

## 3. Key Changes

- `apps/worker-omp`: Thiết lập daemon worker chạy BullMQ lắng nghe `omp-queue`, quản lý sandbox job và chạy OMP CLI.
- `apps/api/src/modules/ai-engine/`: Triển khai service điều phối audit, quản lý trạng thái AI job và phát sự kiện qua SSE.
- `apps/api/src/modules/reports/`: Tích hợp dịch vụ biên dịch Typst PDF từ output của worker.
- `apps/web-1`: Thêm màn hình chờ radar quét AI và trình xem báo cáo phản biện kèm tải PDF.

## 4. Verification

- Kiểm thử chạy OMP Worker xử lý intake thành công xuất đủ `report.json` và markdown.
- Biên dịch Typst CLI cục bộ ra PDF chuẩn A4, hiển thị đúng font tiếng Việt Merriweather.
- Sinh viên nhận kết quả thẩm định qua SSE và tải file PDF thành công.
