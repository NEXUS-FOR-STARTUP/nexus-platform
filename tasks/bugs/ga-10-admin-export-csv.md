# GA-10: Xuất dữ liệu CSV/Excel cho Quản trị viên (Admin Data Export)

- **ID:** GA-10
- **Priority:** P1
- **Category:** Admin / Operations
- **Status:** Done
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Báo cáo hoàn thành:** `docs/journals/journal-2026-08-25-ga09-ga10-case-list-export.md`

---

## 1. Mô tả vấn đề
Admin không có tính năng xuất dữ liệu danh sách case, danh sách nạp tiền (`deposits`), giao dịch (`transactions`), và đơn hàng (`orders`) ra file CSV hoặc Excel. Việc đối soát tài chính định kỳ, thống kê doanh thu và báo cáo thủ công gặp nhiều khó khăn.

## 2. Giải pháp thực hiện
- Xây dựng UseCase `ExportAdminDataUseCase` (`apps/api/src/modules/admin/application/export-admin-data.usecase.ts`):
  - Hỗ trợ xuất 4 loại tài nguyên: `cases`, `deposits`, `transactions`, `orders`.
  - Cơ chế đọc batch (500 dòng/lần), giới hạn tối đa 10,000 dòng/lần xuất để tránh tràn RAM.
  - Chuẩn hóa module `csv-serialize.ts`: Thêm UTF-8 BOM (`\uFEFF`) để Excel hiển thị tiếng Việt có dấu chuẩn xác 100%, escape ký tự đặc biệt theo chuẩn RFC 4180.
- Xây dựng Controller & Route:
  - Route `GET /api/admin/export/:resource` có guard `requireAdmin`.
  - Header HTTP trả về: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="{resource}-{date}.csv"`.
- Thêm nút "Xuất CSV" trên các bảng quản trị tương ứng trong Dashboard Admin.

## 3. Bằng chứng mã nguồn (Evidence)
- Backend:
  - `apps/api/src/modules/admin/application/export-admin-data.usecase.ts`
  - `apps/api/src/shared/infrastructure/csv-serialize.ts`
  - `apps/api/src/modules/admin/http/admin.controller.ts:405-422`
- Báo cáo: `docs/journals/journal-2026-08-25-ga09-ga10-case-list-export.md`.
