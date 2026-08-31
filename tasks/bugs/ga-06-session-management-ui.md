# GA-06: Giao diện quản lý phiên đăng nhập & thiết bị (Session Management UI)

- **ID:** GA-06
- **Priority:** P1
- **Category:** Security
- **Status:** Done
- **Completion Date:** 2026-08-28
- **Báo cáo kế hoạch:** `docs/journals/journal-2026-08-27-ga06-session-management-plan.md`
- **Báo cáo hoàn thành:** `docs/journals/journal-2026-08-28-ga06-session-management-cook.md`
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Tiêu chuẩn:** OWASP Session Management Cheat Sheet

---

## 1. Mô tả vấn đề
Bảng `sessions` trong cơ sở dữ liệu đã lưu trữ đầy đủ `ip_address`, `user_agent`, `created_at`, `expires_at` (`auth.ts`). Tuy nhiên, trên giao diện người dùng (`apps/web-1/app/dashboard/settings/`):
- Thanh điều hướng cài đặt (`settings-nav.ts`) trước đây chỉ có 2 mục: "Thông tin cơ bản" và "Đổi mật khẩu".
- Người dùng không có màn hình danh sách thiết bị đang đăng nhập, không thể nhận biết các phiên bất thường, và chỉ có một hàm `revokeOtherSessions` bị ẩn khi đổi mật khẩu.

---

## 2. Yêu cầu triển khai & Kết quả nghiệm thu (Acceptance Criteria)

1. **API Endpoints (Hono Profile Module):**
   - `GET /api/profile/sessions`: Lấy danh sách phiên còn hạn (`expires_at > now()`, `take: 100`), xác định `isCurrent` bằng `session.id` bất biến trên server, loại bỏ trường `token` bí mật.
   - `DELETE /api/profile/sessions/:id`: Thu hồi 1 phiên cụ thể của user hiện tại (chặn xóa phiên hiện tại qua API này, bảo vệ chống IDOR).
   - `POST /api/profile/sessions/revoke-others`: Thu hồi tất cả phiên khác của user hiện tại với guard kiểm tra `currentSessionId` hợp lệ.

2. **Giao diện người dùng (Frontend Mantine UI v9):**
   - Thêm tab "Thiết bị & Phiên đăng nhập" vào `settings-nav.ts` (icon `MonitorSmartphone` từ `lucide-react`) cho cả `/dashboard/settings` và `/supporter/settings`.
   - Trang `/dashboard/settings/sessions` và `/supporter/settings/sessions`: Hiển thị danh sách thiết bị với Icon (Desktop / Mobile / Tablet / Globe), OS & Trình duyệt (qua parser User-Agent an toàn), địa chỉ IP, thời gian đăng nhập/hết hạn, gắn Badge "Phiên hiện tại".
   - Nút "Đăng xuất" cho từng phiên khác (kèm scoped loading theo `sessionId`) và nút "Đăng xuất khỏi tất cả thiết bị khác" với Modal xác nhận an toàn.

---

## 3. Kiến trúc & Giải pháp Kỹ thuật (Technical Architecture)

### 3.1. Shared Validation (`packages/validation/src/index.ts`)
- `ActiveSessionDtoSchema` & `ActiveSessionDto`: `{ id: z.string().min(1), ipAddress, userAgent, createdAt, expiresAt, isCurrent }`. Dùng `z.string().min(1)` tương thích với chuỗi alphanumeric/nanoid của Better Auth (không dùng UUID).
- `ActiveSessionsResponseSchema` & `ActiveSessionsResponse`.
- `RevokeSessionParamsSchema` & `RevokeSessionParams`.
- User-Agent parser utility (`parseUserAgent`, `formatIpAddress`).

### 3.2. Backend Layer (`apps/api`)
- **UseCases (`apps/api/src/modules/profile/application/`):**
  - `listSessionsUseCase`: Truy vấn `prisma.session.findMany` với snake_case column names (`user_id`, `expires_at`, `created_at`, `ip_address`, `user_agent`), `take: 100`, lọc `expires_at > now()`, đối chiếu `s.id === currentSessionId` và map sang DTO (loại bỏ `token`).
  - `revokeSessionUseCase`: Chặn self-revoke (`targetSessionId === currentSessionId`), xóa an toàn theo `id` và `user_id`, ghi audit log `profile.revoke_session`.
  - `revokeOtherSessionsUseCase`: Guard `currentSessionId` hợp lệ, xóa tất cả phiên có `user_id === userId` và `id !== currentSessionId`, ghi audit log `profile.revoke_other_sessions`.
- **HTTP Layer (`apps/api/src/modules/profile/http/`):**
  - `session.controller.ts`: Handler cho 3 endpoints.
  - `profile.routes.ts`: Đăng ký `GET /sessions`, `DELETE /sessions/:id`, `POST /sessions/revoke-others` bảo vệ bởi `requireAuth`.

### 3.3. Frontend Layer (`apps/web-1`)
- **Utility `apps/web-1/lib/utils/ua-parser.ts`:**
  - Phân tích OS và Trình duyệt với thứ tự ưu tiên Regex chính xác (Edge $\rightarrow$ Opera $\rightarrow$ Cốc Cốc $\rightarrow$ Brave $\rightarrow$ Chrome $\rightarrow$ Safari $\rightarrow$ Firefox) và cắt ngắn chuỗi để chống ReDoS.
  - `formatIpAddress`: Chuẩn hóa IPv4, IPv6, bỏ prefix `::ffff:`, hiển thị Localhost thân thiện.
- **Custom Hooks (`apps/web-1/app/dashboard/settings/hooks/`):**
  - `useSessionQueries.ts`: `useActiveSessionsQuery` gọi relative path `/profile/sessions`.
  - `useSessionMutations.ts`: `useRevokeSessionMutation` và `useRevokeOtherSessionsMutation` với `onSettled` cache invalidation và toast notifications.
- **Components (`apps/web-1/app/dashboard/settings/sessions/_components/`):**
  - `SessionsList.tsx`: Container card, header action, danh sách session items.
  - `SessionItem.tsx`: Item thiết bị, icon Lucide, badge "Phiên hiện tại", nút Đăng xuất với scoped loading.
  - `RevokeOthersModal.tsx`: Mantine Modal xác nhận đăng xuất hàng loạt.
- **Pages:**
  - `apps/web-1/app/dashboard/settings/sessions/page.tsx` (Student)
  - `apps/web-1/app/supporter/settings/sessions/page.tsx` (Supporter)

---

## 4. Tóm tắt Kiểm thử & Nghiệm thu (Verification & Tests)
- **Unit Tests:** `apps/api/src/shared/infrastructure/tests/session-management.test.ts` (16 test cases bao phủ `listSessionsUseCase`, `revokeSessionUseCase`, `revokeOtherSessionsUseCase`, IDOR protection, self-revoke guard, Zod validation, `parseUserAgent`, `formatIpAddress`).
- **Type Checking:** `npm run check-types` pass 100% không lỗi trên cả 3 packages (`apps/api`, `apps/web-1`, `packages/validation`).
- **Code Review:** Đánh giá đạt chuẩn bảo mật OWASP Session Management và Clean Architecture.

---

## 5. Danh sách File thay đổi / bổ sung
| Workspace / Module | File Path | Mục đích |
|---|---|---|
| Validation | `packages/validation/src/index.ts` | Zod schemas, types DTO, UA parser export |
| API Application | `apps/api/src/modules/profile/application/list-sessions.usecase.ts` | UseCase liệt kê session còn hạn và đánh dấu isCurrent |
| API Application | `apps/api/src/modules/profile/application/revoke-session.usecase.ts` | UseCase thu hồi 1 session cụ thể (chặn current session) |
| API Application | `apps/api/src/modules/profile/application/revoke-other-sessions.usecase.ts` | UseCase thu hồi tất cả session khác |
| API HTTP | `apps/api/src/modules/profile/http/session.controller.ts` | Controller handlers cho session management |
| API HTTP | `apps/api/src/modules/profile/http/profile.routes.ts` | Đăng ký routes `/sessions`, `/sessions/:id`, `/sessions/revoke-others` |
| API Tests | `apps/api/src/shared/infrastructure/tests/session-management.test.ts` | 16 unit test cases cho session management |
| Web Utility | `apps/web-1/lib/utils/ua-parser.ts` | Phân tích User-Agent & format IP address |
| Web Nav | `apps/web-1/app/dashboard/settings/_components/settings-nav.ts` | Thêm tab `/sessions` vào settings navigation |
| Web Hooks | `apps/web-1/app/dashboard/settings/hooks/useSessionQueries.ts` | TanStack Query hook lấy danh sách phiên |
| Web Hooks | `apps/web-1/app/dashboard/settings/hooks/useSessionMutations.ts` | TanStack Mutation hooks thu hồi phiên |
| Web UI | `apps/web-1/app/dashboard/settings/sessions/_components/SessionItem.tsx` | Component hiển thị từng session |
| Web UI | `apps/web-1/app/dashboard/settings/sessions/_components/SessionsList.tsx` | Component danh sách session |
| Web UI | `apps/web-1/app/dashboard/settings/sessions/_components/RevokeOthersModal.tsx` | Modal xác nhận thu hồi tất cả phiên khác |
| Web Page | `apps/web-1/app/dashboard/settings/sessions/page.tsx` | Trang quản lý thiết bị của sinh viên |
| Web Page | `apps/web-1/app/supporter/settings/sessions/page.tsx` | Trang quản lý thiết bị của supporter |
