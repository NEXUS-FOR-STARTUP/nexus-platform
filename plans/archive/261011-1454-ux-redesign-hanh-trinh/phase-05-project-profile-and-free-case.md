# Phase 5 — Project profile and free case creation

## Context Links
- [plan.md](./plan.md), [phase-04](./phase-04-journey-workspace-shell.md)
- `apps/web-1/app/dashboard/page.tsx:55-66,115`, `app/dashboard/_components/PackageSelectionModal.tsx`, `DashboardEmptyState`
- `apps/web-1/app/dashboard/intake/**`, `hooks/useIntakeForm.ts:160-164`
- `apps/api/src/modules/cases/application/create-case.usecase.ts:65-111`, `cases.dto.ts:9-10`, `submit-intake.usecase.ts:48-172`
- `packages/validation/src/index.ts:419-503` (intake schema)
- `apps/web-1/app/dashboard/case/[id]/_components/CaseOverviewPanel.tsx:113-168`

## Overview
- Priority: P2.
- Status: Pending.
- Tạo dự án không chọn gói. Intake chuyển thành "Hồ sơ dự án" sửa được, có một ô "Ghi chú thêm".

## Key Insights
- `package_id` bắt buộc khi tạo case và quyết định `locked_price`, `payment_status`, stage khởi đầu. Đọc ở khoảng 14 chỗ (admin stats, chat-access, upgrade, orders…) → **giữ cột**, server mặc định `pkg_tf_free`.
- Bộ chấm đọc intake nguyên khối (`unit.content`) → đổi trường không làm vỡ chấm.
- Phải giữ: contact `{full_name, student_code, team_role, zalo, email}`, `school`, `course_context`, `group_no`, `project_name`, `current_blocker`, `documents` (đồng bộ lên dòng case + header + admin).
- Gộp được vào `notes`: `primary_need`, `expected_outputs`, `lecturer_feedback`, `extra_notes`, `current_situations`, `case_summary`, `team_status_summary`.
- `submit-intake` chỉ cho phép stage `triage_pending|cancelled`; nộp lại hiện upsert v00 (D13).

## Requirements
1. `POST /cases`: `package_id` optional, mặc định `pkg_tf_free` (hằng số cấu hình). Dashboard có nút "Tạo dự án" mở form ngắn (tên dự án, trường, lớp, nhóm) → vào thẳng workspace Tổng quan.
2. Bỏ `PackageSelectionModal` khỏi dashboard và empty state; bỏ `?checkout=true`.
3. Form "Hồ sơ dự án" một trang (không còn chat từng bước):
   - Thông tin liên hệ.
   - Thông tin lớp, nhóm.
   - Vấn đề hiện tại.
   - Tài liệu giai đoạn Ý tưởng (upload qua endpoint giai đoạn `CP1` của phase 1).
   - "Ghi chú thêm" (textarea, giới hạn ký tự theo hằng số). Phía trên có quote hướng dẫn: "Nhắn AI điều bạn muốn được góp ý nhất: nhóm đang vướng gì, giảng viên đã nhận xét gì, bạn kỳ vọng nhận được gì."
4. Sửa được nhiều lần (bỏ chặn stage của hồ sơ, giữ kiểm tra chủ sở hữu). Mỗi lần lưu upsert v00 như hiện tại.
5. Schema: các trường cũ thành optional + `.passthrough()` cho dữ liệu cũ; thêm `notes`. `boundary_confirmations` chuyển thành một checkbox đồng ý ở cuối form.
6. `CaseOverviewPanel` và modal admin hiện `notes`; snapshot cũ vẫn hiện các trường cũ nếu có.

## Related Code Files
Sửa: `create-case.usecase.ts`, `cases.dto.ts`, `submit-intake.usecase.ts`, `packages/validation/src/index.ts`, `app/dashboard/page.tsx`, `DashboardEmptyState`, `intake/page.tsx` + hooks, `CaseOverviewPanel.tsx`, `AdminCaseDetailModal.tsx`.
Tạo: `app/dashboard/case/[id]/_components/workspace/profile/ProjectProfileForm.tsx` (+ sections ≤200 dòng mỗi file), `hooks/useProjectProfile.ts`.
Xóa (khi hết người gọi): `IntakeChatFlow` và các step component, `PackageSelectionModal.tsx` nếu không còn ai dùng.

## Implementation Steps
1. API: `package_id` mặc định; bỏ chặn stage khi lưu hồ sơ; test tạo case không gói, sửa hồ sơ lần 2.
2. Validation: schema mới + passthrough; test snapshot cũ vẫn parse.
3. Web: form tạo dự án ngắn; `ProjectProfileForm`; nối nút "Cập nhật hồ sơ" ở Tổng quan.
4. Gỡ `PackageSelectionModal`, `?checkout=true`.
5. Kiểm tra trình duyệt: tạo dự án → hồ sơ → tải file Ý tưởng → chấm Ý tưởng.

## Todo List
- [ ] Tạo case không cần gói
- [ ] Hồ sơ sửa nhiều lần
- [ ] Schema `notes` + tương thích dữ liệu cũ
- [ ] Form hồ sơ một trang + quote hướng dẫn
- [ ] Gỡ chọn gói ở dashboard
- [ ] Kiểm tra trình duyệt

## Success Criteria
- Người mới tạo dự án mà không thấy giá hay gói.
- Case cũ có intake đầy đủ vẫn hiện đúng ở Tổng quan và admin.

## Risks
- Admin stats nhóm theo `package_id`: case mới đều là `pkg_tf_free` cho tới khi mua. `applyPaidCreditCaseUpdate` hiện nâng `package_id` khi mua CP1; giữ hành vi này để thống kê admin còn ý nghĩa.
