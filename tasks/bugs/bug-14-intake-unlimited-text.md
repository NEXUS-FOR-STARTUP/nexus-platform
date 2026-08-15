# Bug 14: Intake lưu không giới hạn chữ

## Thông tin gốc (Google Docs)

> [trang intake ở user] có thể lưu không giới hạn chữ (cả API lẫn FE chẳng có validation cho phép lưu không giới hạn)

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Validation thiếu (FE + BE) |
| Effort | **M** |
| Độ phức tạp | Trung bình: thêm max-length validation cả API lẫn FE |
| Dependency | Không có |
| Quyết định cần | Giới hạn bao nhiêu ký tự? |
| Vùng code | Intake text fields — `apps/api` + `apps/web-1/app/dashboard/intake/` |

## Tracking

| Field | Value |
|-------|-------|
| Status | Done |
| Assignee | — |
| Priority | Medium |
| Target | 2026-08-16 |
| Ghi chú | Đã fix trong plan `260815-2154-backlog-bugs-fix` (2026-08-16): `contact.full_name/student_code/team_role`, `support_needs.primary_need` ≤100; `email` ≤254; `current_blocker/case_summary/current_situations[]` ≤20000 trong `Cp1IntakeSchema` + FE; URL/zalo/boundary miễn cap |

## Acceptance Criteria (draft)
- [x] Giới hạn ký tự các field text trong intake (FE + BE)
- [x] Báo lỗi/thông báo rõ khi vượt giới hạn
