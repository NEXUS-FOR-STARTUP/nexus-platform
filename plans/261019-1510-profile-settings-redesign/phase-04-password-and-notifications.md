# Phase 4: Tab Mật khẩu + Thông báo

Priority: P3 · Status: Pending · Effort: 3h · blockedBy: Phase 1 · Q-P1

SD = `apps/web-1/app/dashboard/settings`

## Context Links
- Mockup: tab password/notifications trong `js/views/spec.js`; `REPORT.md` §4.5
- `research/scout-01` §3 "Password", "Notifications (GA08)"; `reports/gap-register.md` P-01, P-05, P-09
- Code: `SD/password/_components/ChangePasswordForm.tsx` (161), `SD/notifications/_components/NotificationPreferencesForm.tsx` (68), `hooks/usePasswordMutations.ts` (từ P1), `hooks/useNotificationPreferences.ts` (40)

## Key insights
- **Mật khẩu:** mockup chỉ là bản giả (3 ô `type="text"`, nút khóa; ghi chú "Mockup tập trung vào màn Profile"). Hình thức không đủ cơ sở thiết kế lại thực chất. Code thật có: `PasswordInput` ×3, hai chế độ (đổi / đặt cho tài khoản OAuth), kiểm tra: "Vui lòng nhập mật khẩu hiện tại.", "Vui lòng nhập mật khẩu mới.", "Mật khẩu mới phải ít nhất 8 ký tự.", "Xác nhận mật khẩu không khớp.", `Tooltip` Info ở mật khẩu mới, thông báo "Các thiết bị khác đã được đăng xuất.", trạng thái tải `GET /profile/password-status` (hiện là Paper chỉ chứa nút đặt mật khẩu loading: xấu). → **Chỉ áp thẻ/typography mới + sửa trạng thái tải**; không đổi luật/chữ.
- **Thông báo:** schema `{ email_enabled: boolean }`; 1 `Switch` "Nhận email" lưu ngay, rollback khi lỗi, có chữ tải/lỗi. Mockup 4 công tắc không có chỗ lưu (P-01/Q-P1) → **không vẽ**. Chỉ đổi hình thức: hàng `label + description` cạnh `Switch`.
- `Switch` Mantine đã có `role="switch"`, `aria-checked`, Space/Enter: **không CSS tay** như mockup (44×24, núm 20px).
- Tên chuẩn: label "Nhận email", mô tả "Gửi thông báo tới email đã đăng ký." (giữ).

## Requirements
**Mật khẩu**
- Thẻ trắng viền (Paper) tiêu đề 18/500; 3 ô `PasswordInput` full-width; nút `size="sm"`; ghi nhãn chế độ như hiện tại.
- Trạng thái tải: skeleton đúng kích thước form (3 ô + nút), thay Paper-có-nút-loading.
- `autoComplete`: `current-password` (hiện tại), `new-password` cho mật khẩu mới/xác nhận (kiểm; scout chỉ thấy cái đầu).
**Thông báo**
- Một thẻ: tiêu đề, một hàng `Switch` (`label`, `description`), chữ trạng thái lưu/lỗi như hiện tại.

## Architecture
```
ChangePasswordForm.tsx (≤160)   restyle, tách PasswordFormSkeleton.tsx nếu cần
NotificationPreferencesForm.tsx (≤70)
settings-cards.module.css (dùng chung cho 4 tab, nếu P1/P2 chưa có)
```
Không tạo thành phần mới nếu CSS module chung đủ.

## Related code files
**Modify:** `ChangePasswordForm.tsx`, `NotificationPreferencesForm.tsx`, `password/page.tsx`, `notifications/page.tsx` (chỉ bao thẻ).
**Create:** `PasswordFormSkeleton.tsx` (nếu cần), dùng lại class chung.
**Delete:** không.

## Implementation steps
1. Đọc `design-system/wording/pages/settings-password.md`, `settings-notifications.md` (scout chưa đọc).
2. Đọc `ChangePasswordForm.tsx` đầy đủ; ghi vị trí trạng thái tải xấu.
3. Kịch bản trước sửa: tài khoản có mật khẩu (đổi mật khẩu sai/hợp lệ), tài khoản OAuth-only (đặt mật khẩu), tải password-status chậm (throttle), bật/tắt email, lỗi lưu (chặn mạng) → rollback.
4. `ChangePasswordForm`: bọc `Paper withBorder radius="md" p="lg"`; `Stack gap="md"`; skeleton khi `useHasPasswordQuery` đang tải.
5. `NotificationPreferencesForm`: bố cục `Group justify="space-between"`; `Switch` gốc; giữ `isFetching`/lỗi như hiện tại.
6. Chạy lại kịch bản; chụp 1440/390 sáng/tối.
7. Báo chủ dự án: Q-P1 (4 nhóm cần backend) — nếu họ quyết làm, tạo plan riêng; ở đây không giả.

## Todo
- [ ] Chốt Q-P1
- [ ] Đọc wording password + notifications
- [ ] Kịch bản trước sửa (5 ca)
- [ ] Restyle form mật khẩu + skeleton
- [ ] Restyle thông báo
- [ ] Smoke

## Success criteria
- 4 chuỗi lỗi mật khẩu giữ nguyên; hai chế độ vẫn chạy; thông báo "Các thiết bị khác đã được đăng xuất." còn.
- Trạng thái tải không còn Paper chứa nút loading.
- Công tắc email vẫn lưu tức thì + rollback khi lỗi.
- Không CSS cho `Switch`.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Đổi mật khẩu thật làm mất đăng nhập dev | Dùng tài khoản thử |
| `autoComplete` thiếu làm trình duyệt lưu sai | Bổ sung `new-password` (không đổi hành vi nghiệp vụ) |

## Security
`PasswordInput` giữ nguyên; không log mật khẩu; không đưa mật khẩu vào query/URL; thông báo lỗi dùng `translateAuthError` như cũ.

## Next steps
P5.
