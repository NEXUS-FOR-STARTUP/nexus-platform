# Phase 6 — Supporter freeze and Zalo contact

## Context Links
- [plan.md](./plan.md)
- Web: `apps/web-1/proxy.ts:93,119,135`, `app/dashboard/layout.tsx:22-28`, `app/auth/page.tsx:19-20`, `use-email-otp-login.ts:98-99`, `use-email-password-login.ts:63-64`, `components/layout/AppShell.tsx:72,306-325`, `DashboardShell.tsx:38`, `_components/UserMenu.tsx:36-48`, `app/supporter/**`, `intake/page.tsx:223-224`
- API: `apps/api/src/index.ts:17,164`, `modules/supporter/**`, `modules/cases/http/cases.routes.ts:53,63`
- Zalo: `components/landing/ContactUs.tsx:23-30,64-70`, `public/logo/zalo.png`

## Overview
- Priority: P2.
- Status: Pending.
- Khóa luồng supporter: code giữ lại nhưng không ai gọi tới. Ẩn chat. Thay bằng nhóm Zalo.

## Key Insights
- Supporter phụ thuộc vào: route guard, redirect sau đăng nhập, menu, router API `/api/supporter`, route `GET /supporters`, upload output, T6 assign, thông báo `CASE_ASSIGNED`.
- Listener và relay thông báo là phần dùng chung → không đụng.
- Link Zalo viết cứng ở 2 chỗ.

## Requirements
1. **Không comment code.** Xóa hẳn dòng import, mount, nhánh redirect. File supporter giữ lại, đầu file thêm JSDoc `@deprecated Supporter flow frozen 2026-10-11; not mounted. See plans/261011-1454-ux-redesign-hanh-trinh.`
2. Web:
   - `proxy.ts`: bỏ nhánh `isSupporterRoute` và matcher `/supporter/:path*`.
   - Đăng nhập: role `supporter` đi vào `/dashboard` như user thường; route `/supporter` trả 404 (không còn được mount qua guard).
   - AppShell, DashboardShell, UserMenu: bỏ nhánh supporter.
   - Intake: bỏ guard `pkg_supporter_audit`.
3. API:
   - Bỏ import + `app.route('/api/supporter', …)`.
   - Bỏ route `GET /supporters` và `supporter-outputs/upload`; giữ handler và usecase (deprecated).
   - T6 assign bên admin giữ nguyên nhưng ẩn nút gán supporter trong admin UI.
   - **Ngừng bán gói supporter:** `pkg_supporter_audit` đang `is_active: true` và thuộc `cp1_audit` (`seed-active-packages.ts:119-133`), nên sẽ lọt vào hộp mua Ý tưởng. Đặt `is_active: false` trong seed và lọc `features.mode = 'human_verified'` khỏi catalog. Chạy seed prod theo `docs/vps-deployment-guide.md`, không sửa DB tay.
   - **Không đụng state machine:** AI audit cũng dùng `internal_status = 'supporter_working'` (`omp-audit-coordinator.ts:430`). Đóng băng chỉ gỡ route và UI, không xóa hay chặn state.
   - Trước khi bật: đếm case đang gán supporter (`assigned_supporter_auth_user_id IS NOT NULL` và chưa `done`/`cancelled`) qua `READONLY_DATABASE_URL` theo `docs/db-query-guide.md`. Có case → admin liên hệ qua Zalo và đóng thủ công trước khi deploy.
4. Chat: trang sinh viên không render `TabDiscussionChat`, không gọi `useRealtimeChat` hay `useCaseUnreadCount`.
5. Zalo:
   - Biến môi trường `NEXT_PUBLIC_ZALO_GROUP_URL` trong root `.env` và `.env.example`, ghi tài liệu, kèm giá trị mặc định hiện tại. Thêm `ARG`/`ENV` vào `apps/web-1/Dockerfile` (cạnh dòng 40-43), build args trong compose và `docs/docker-build-push-guide.md`; cùng việc này cho `NEXT_PUBLIC_JOURNEY_WORKSPACE`.
   - Một hằng số đọc env trong `apps/web-1/lib/env` (hoặc nơi web-1 đang đọc env public).
   - Thay 2 chỗ cũ.
   - Tạo `ZaloSupportCard` dùng ở Tổng quan và khi lỗi chấm hoặc thanh toán cần hỗ trợ.
   - Tách `ZaloIcon` dùng chung.

## Related Code Files
Sửa: các file ở Context Links; `apps/api/src/index.ts`; `cases.routes.ts`; admin UI nút gán supporter; `.env.example`; `docs/` chỗ liệt kê env.
Tạo: `apps/web-1/components/contact/ZaloIcon.tsx`, `ZaloSupportCard.tsx`.
Thêm `@deprecated`: `app/supporter/**`, `modules/supporter/**`, `TabDiscussionChat.tsx`, `useRealtimeChat.ts`, `useCaseUnreadCount.ts`, các usecase chat.

## Implementation Steps
1. Env + `ZaloIcon` + `ZaloSupportCard`; thay ở landing và AppShell.
2. Web: gỡ nhánh supporter; thêm `@deprecated`.
3. API: gỡ mount/route; thêm `@deprecated`; cập nhật test API dựa vào route đã gỡ (xóa test của route không còn mount).
4. Chạy `check-types`, `lint`, test API. Đăng nhập bằng tài khoản supporter thử → vào dashboard thường.

## Todo List
- [ ] `NEXT_PUBLIC_ZALO_GROUP_URL` + 3 chỗ dùng
- [ ] Gỡ supporter web
- [ ] Gỡ supporter API
- [ ] Ẩn chat ở trang sinh viên
- [ ] `@deprecated` các file giữ lại
- [ ] Typecheck, lint, test

## Success Criteria
- `grep` không còn import nào từ code đang chạy tới `app/supporter` hoặc `modules/supporter`.
- Không còn URL Zalo viết cứng trong `apps/web-1`.
