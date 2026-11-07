# Phase 5: Trang admin mã giảm giá

## Context Links
- [plan.md](./plan.md)
- `apps/api/src/modules/admin/application/discount-codes.usecase.ts`
- `discount-code.repository.ts` (`listDiscountCodes`)
- UI `AdminDiscountCodes` (vị trí cần tìm)

## Overview
- Priority: P3
- Status: Pending
- Mã cá nhân do hệ thống phát (`created_by = SYSTEM_USER_ID`) sẽ xuất hiện lẫn mã admin, không phân biệt được chủ và case.

## Key Insights
- Admin DTO chưa có `owner_user_id`, `case_id`.
- Admin tạo mã không set hai cột mới (mã dùng chung, NULL), vẫn hợp lệ; unique `(owner,case,service)` coi NULL khác nhau.
- Admin chỉ desktop (`DesktopOnlyNotice`).

## Requirements
- Mặc định danh sách chỉ hiện mã admin; có bộ lọc xem mã hệ thống phát.
- Mã cá nhân hiển thị chủ (email/tên) và dự án.

## Architecture
Repository thêm điều kiện lọc theo `owner_user_id IS NULL`; DTO thêm trường; UI thêm bộ lọc (Mantine SegmentedControl).

## Related Code Files
Modify: `discount-code.repository.ts`, admin DTO/mapper, `packages/validation` (admin schema nếu có), UI `AdminDiscountCodes` + hook.

## Implementation Steps
1. Đọc repository, DTO và UI admin.
2. Thêm lọc + trường vào API.
3. Cập nhật UI; ngôn ngữ tiếng Việt.
4. Test repository/usecase (lọc đúng).
5. Typecheck api + web-1.

## Todo List
- [ ] API lọc + DTO
- [ ] UI bộ lọc + cột chủ/dự án
- [ ] Test
- [ ] Typecheck

## Success Criteria
Danh sách mặc định không còn mã cá nhân; bật bộ lọc thấy mã cá nhân kèm chủ và dự án.

## Risk Assessment
Thấp. Hợp đồng API admin thay đổi tương thích (thêm trường, tham số tùy chọn).

## Security Considerations
Endpoint admin giữ nguyên guard; không lộ email người dùng cho vai trò khác.

## Next Steps
Không.
