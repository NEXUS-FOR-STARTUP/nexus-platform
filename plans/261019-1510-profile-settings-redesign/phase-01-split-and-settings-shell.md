# Phase 1: Tách file + khung Cài đặt

Priority: P2 · Status: Pending · Effort: 3h · blockedBy: case plan Phase 1 · Q-P5, Q-P6

SD = `apps/web-1/app/dashboard/settings`

## Context Links
- Mockup: `index.html`, `css/base.css`, `js/app.js`; `REPORT.md` §3, §4
- `research/scout-01` §1, §3 "Nav và layout"; `reports/gap-register.md` P-11, P-13, P-14, P-15
- Code: `SD/_components/SettingsLayout.tsx` (25), `SettingsSidebar.tsx` (37), `settings-nav.ts` (23), `SD/profile/_components/ProfileInfoForm.tsx` (183), `SD/hooks/useProfileMutations.ts` (199)

## Key insights
- `SettingsLayout`/`SettingsSidebar`/`getSettingsNav` và `ProfileInfoForm` được **admin, supporter, writer** dùng chung (grep `SettingsLayout` ở `app/{admin,supporter,writer}/settings/layout.tsx`; scout chưa đọc cách truyền `basePath`).
- `getSettingsNav` ẩn tab thông báo khi `basePath` ≠ `/dashboard/settings`. Giữ.
- Sidebar: `grid-cols-1 md:grid-cols-[240px_1fr]`, mobile là dải cuộn ngang; mockup mobile là drawer. Push back (Q-P6): 4 mục không cần drawer.
- `useProfileMutations.ts` 199 dòng và `ProfileInfoForm.tsx` 183 dòng: thêm bất cứ gì sẽ vượt 200 → tách trước khi redesign (đây là lý do Phase 1 tồn tại).
- Tiêu đề trang mockup: "Cài đặt" / "Quản lý thông tin cá nhân và bảo mật tài khoản". Nhãn hiện tại: h1 + description trong `SettingsLayout`; đối chiếu `design-system/wording/pages/settings.md` trước khi đổi chữ.

## Requirements
- Tách `useProfileMutations` thành hook theo chức năng, **không đổi hành vi hay chữ ký công khai** (các nơi import giữ nguyên qua file re-export duy nhất? **Không**: clean cutover, cập nhật mọi caller).
- Sidebar desktop 240px: mục đang chọn nền `--color-brand-subtle` chữ `--color-brand`; mục khác chữ `--color-text`, hover `--color-surface-soft`; icon Lucide hiện có.
- Mobile: dải liên kết ngang cuộn được, mục đang chọn có gạch dưới 3px brand (cùng ngôn ngữ tabs gạch dưới), không nền; `aria-current="page"`.
- Tiêu đề `--ui-text-title` 24/500, mô tả `--ui-text-note` 14/400 muted.

## Architecture
```
hooks/useProfileMutations.ts (199)  →  tách:
  hooks/useUpdateProfileName.ts       updateName
  hooks/useChangeAvatar.ts            changeAvatar + validateAvatarFile
  hooks/usePasswordMutations.ts       changePassword, setPassword, useHasPasswordQuery
  hooks/useDeleteAccount.ts           deleteAccount (+ signOut, queryClient.clear, router.replace)
settings.module.css                   .layout .sidebar .link .linkActive .navStrip .linkStripActive
```
Mỗi hook giữ nguyên thân hàm; chỉ di chuyển. Constants (2MB, extensions) vào `avatar-limits.ts` nếu đang gõ cứng.

## Related code files
**Modify:** `SettingsLayout.tsx`, `SettingsSidebar.tsx`, tất cả file import `useProfileMutations` (tìm bằng LSP references), 3 route khác dùng `ProfileInfoForm`.
**Create:** 4 hook trên, `settings.module.css`, (tuỳ) `avatar-limits.ts`.
**Delete:** `hooks/useProfileMutations.ts`.

## Implementation steps
1. `xd://lsp` references cho `useProfileMutations` và mỗi export (`updateName`, `changeAvatar`, `changePassword`, `setPassword`, `useHasPasswordQuery`, `deleteAccount`); ghi danh sách caller.
2. Đọc `useProfileMutations.ts` đầy đủ (199 dòng); tách theo bảng; giữ query key, `onSuccess`, thông báo, `translateAuthError`, `throw` khi `result.error` (Better Auth).
3. Cập nhật caller; xóa file cũ; `check-types`.
4. Đọc `app/{admin,supporter,writer}/settings/layout.tsx` để biết cách truyền `basePath`; quyết định không đổi API props của `SettingsLayout`/`Sidebar` (Q-P5 mặc định "đổi cho tất cả").
5. `settings.module.css` + restyle `SettingsLayout` (header 24/500 + 14/400) và `SettingsSidebar` (desktop dọc, mobile dải ngang gạch dưới).
6. Smoke 4 route sinh viên + 3 route vai trò khác ở 1440; 390 chỉ sinh viên.

## Todo
- [ ] Chốt Q-P5, Q-P6
- [ ] LSP references `useProfileMutations`
- [ ] Tách 4 hook, cập nhật caller, xóa file cũ
- [ ] Restyle layout + sidebar
- [ ] Smoke 7 route

## Success criteria
- `bun run check-types` sạch; không còn import `useProfileMutations`.
- Mọi file mới ≤200 dòng (hook ≤100).
- Hành vi mutation không đổi (đổi tên, đổi mật khẩu, đổi ảnh, xóa tài khoản chạy như trước: smoke tay).
- Sidebar/dải khớp mockup ở 1440/390; 3 route vai trò khác không vỡ.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Tách hook làm lệch query key → không refetch session | Giữ chuỗi key y nguyên; smoke đổi tên → header cập nhật |
| Route admin/supporter/writer vỡ do restyle | Smoke 3 route; fork nếu vỡ (Q-P5) |
| `deleteAccount` thiếu `queryClient.clear()` sau tách | Test tay xóa tài khoản trên tài khoản thử |

## Security
`deleteAccount` giữ thứ tự: gọi API → `signOut` → `queryClient.clear()` → chuyển `/auth`. Không log email/tên. **Không chạy xóa tài khoản trên dữ liệu thật**: dùng tài khoản thử dùng một lần trong DB dev (không phải DB production: kiểm `DATABASE_URL` trỏ localhost trước).

## Next steps
P2.
