# GA-09: Phân trang và tìm kiếm Server-Side cho danh sách Case (User & Admin)

- **ID:** GA-09
- **Priority:** P1
- **Category:** Admin / Performance
- **Status:** Done
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Báo cáo hoàn thành:** `docs/journals/journal-2026-08-25-ga09-ga10-case-list-export.md`

---

## 1. Mô tả vấn đề
Trước đây, các hàm lấy danh sách case (`list-cases.usecase.ts` và `list-admin-cases.usecase.ts`) truy vấn và trả về toàn bộ danh sách trong database mà không hỗ trợ phân trang (pagination), không tìm kiếm text search, và không sắp xếp (sorting) ở tầng server. Khi số lượng case tăng lên, UI và API sẽ bị nghẽn và tải chậm nghiêm trọng.

## 2. Giải pháp thực hiện
- Xây dựng cơ chế phân trang `findPagedCasesByRole` và `findPagedCasesAdmin`:
  - Query parameters chuẩn: `page`, `limit` (mặc định 10, tối đa 50), `search` (tìm theo `case_code`, `title`, tên sinh viên), `sortBy`, `sortOrder` (`asc`/`desc`).
  - Trả về payload chuẩn: `{ data: Case[], pagination: { total, page, limit, totalPages } }`.
- Phía Admin hỗ trợ thêm bộ lọc theo `stage`, `view` (`intake_pending`, `triage`, `working`), và chấm điểm độ hoàn thiện (`completeness`).
- Cập nhật Frontend hook `useCasesList.ts` và component bảng Mantine để điều khiển phân trang mượt mà.

## 3. Bằng chứng mã nguồn (Evidence)
- Backend:
  - `apps/api/src/modules/cases/application/list-cases.usecase.ts`
  - `apps/api/src/modules/admin/application/list-admin-cases.usecase.ts`
  - `apps/api/src/modules/cases/infrastructure/case.repository.ts`
- Frontend:
  - `apps/web-1/app/dashboard/cases/hooks/useCasesList.ts`
  - `apps/web-1/app/dashboard/admin/_components/AdminCasesTable.tsx`
- Báo cáo: `docs/journals/journal-2026-08-25-ga09-ga10-case-list-export.md`.
