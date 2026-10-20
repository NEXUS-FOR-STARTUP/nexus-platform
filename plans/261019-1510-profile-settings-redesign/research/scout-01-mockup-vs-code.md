Findings below. Nothing was edited or run; every claim comes from reading the files.

## 1. Inventory

**Mockup** (`design-system/mockups/settings-profile/`, 846 lines total)

| File | Lines |
|---|---|
| `index.html` | 45 |
| `css/base.css` | 108 |
| `css/views.css` | 32 |
| `js/app.js` | 54 |
| `js/icons.js` | 18 |
| `js/data/user.js` | 80 |
| `js/views/profile.js` | 139 |
| `js/views/delete-modal.js` | 63 |
| `js/views/spec.js` | 220 |
| `REPORT.md` | 87 |

`spec.js` holds the password, sessions, notifications and spec tabs, not just the spec tab.

**Code** (`apps/web-1/app/dashboard/settings/`, 1332 lines total)

| File | Lines |
|---|---|
| `layout.tsx` | 6 |
| `page.tsx` | 5 (redirects to `/profile`) |
| `_components/SettingsLayout.tsx` | 25 |
| `_components/SettingsSidebar.tsx` | 37 |
| `_components/settings-nav.ts` | 23 |
| `profile/page.tsx` | 30 |
| `profile/_components/ProfileInfoForm.tsx` | 183 |
| `profile/_components/DeleteAccountModal.tsx` | 90 |
| `password/page.tsx` | 28 |
| `password/_components/ChangePasswordForm.tsx` | 161 |
| `sessions/page.tsx` | 30 |
| `sessions/_components/SessionsList.tsx` | 132 |
| `sessions/_components/SessionItem.tsx` | 86 |
| `sessions/_components/RevokeOthersModal.tsx` | 71 |
| `notifications/page.tsx` | 28 |
| `notifications/_components/NotificationPreferencesForm.tsx` | 68 |
| `hooks/useProfileMutations.ts` | 199 |
| `hooks/useSessionMutations.ts` | 74 |
| `hooks/useSessionQueries.ts` | 16 |
| `hooks/useNotificationPreferences.ts` | 40 |

- `ProfileInfoForm.tsx` is 183 lines and `useProfileMutations.ts` is 199, both close to the 200-line limit. A redesign that adds anything will break it unless split.
- `ProfileInfoForm` and `SettingsLayout` are also used by the admin, supporter and writer settings routes.
  - Admin, supporter and writer use `ProfileInfoForm` via `app/{admin,supporter,writer}/settings/profile/page.tsx`.
  - `layout.tsx` under `app/{writer,supporter}/settings` and `app/admin/settings` (I grepped the layouts only for `SettingsLayout` and did not read them to see how they pass `basePath`).
  - `getSettingsNav` hides the notifications tab when `basePath` is not `/dashboard/settings`.
  - Admin is desktop-only and out of scope. Any prop change on these shared components needs a regression check on those routes.

## 2. Mockup behaviour

**Shell**
- Routing is `?tab=profile|password|sessions|notifications|spec`.
- The sidebar has 4 nav items plus a spacer and a 5th "Quy ước (tham khảo)" item.
- Mobile (max-width 820px): the sidebar becomes a fixed drawer, 320px or 85vw wide.
  - It has a burger button, a scrim, and a close button.
  - Esc closes it.
  - Tab is trapped inside it.
  - It closes on resize back to desktop.
- Content uses `.view.on` with a 0.25s fade-in animation.

**Profile tab** (`profile.js`)
- Header: "Cài đặt" / "Quản lý thông tin cá nhân và bảo mật tài khoản".
- Card: "Thông tin cơ bản", plus the note "Thông tin hiển thị trên hệ thống và trong các báo cáo phản biện."
- Avatar is 96px with initials. The "Đổi ảnh" button sits beside a persistent note: "Dung lượng tối đa 2MB (.jpg, .png, .webp)".
- Avatar rules in the mockup:
  - Only size is checked, over 2MB. The inline alert reads "Tệp quá lớn" / "Dung lượng ảnh vượt quá 2MB. Vui lòng chọn tệp nhỏ hơn."
  - The type check is the `accept` attribute only, with no JS check.
  - A valid file gets an instant preview through `FileReader`. The Save button enables, with an info alert: "Đã chọn ảnh mới / Bấm 'Lưu thay đổi' để cập nhật…"
  - Nothing is uploaded. Avatar becomes a Save-gated change.
- Name field: required `*`, placeholder "Nhập tên hiển thị".
  - Error text is "Tên hiển thị không được để trống." with `aria-invalid`.
  - It is validated on submit only and clears on input.
- Email is disabled, with the label hint "Không thể thay đổi" (icon plus visible text, plus a title attribute).
- Save is disabled until the form is dirty. Success alert: "Thành công / Đã cập nhật thông tin tài khoản thành công."
- Danger zone: heading "Vùng nguy hiểm", a red-outline box, and a quiet-red "Xóa tài khoản" button.

**Delete modal** (`delete-modal.js`)
- Title: "Xác nhận xóa tài khoản".
- Body: "Bạn có chắc chắn muốn xóa… Toàn bộ phiên đăng nhập sẽ bị hủy và thông tin tài khoản sẽ được ẩn danh hóa…"
- Input label: "Nhập XOA hoặc XÓA để xác nhận:", placeholder "Nhập XOA hoặc XÓA".
- Buttons: "Hủy" and "Xác nhận xóa tài khoản". The confirm button stays disabled until the trimmed, uppercased input is `XOA` or `XÓA`.
- Esc, the X button, and a click on the scrim all close it.
- Confirming only shows a simulation alert. There is no API call.

**Password tab** (inside `spec.js`)
- It is a stub: three disabled plain text inputs, with a disabled button, and the note "Màn hình phụ… Mockup tập trung vào màn Profile".
- It uses `type="text"`, not password inputs. It has no validation, no show/hide toggle and no tooltip.

**Sessions tab**
- Four sample sessions, each with a device icon, device name, location, IP and "activeText".

| Session | Device | Location | IP | Active |
|---|---|---|---|---|
| 1 | Chrome trên Windows 11 | Hà Nội | 118.70.192.44 | current |
| 2 | Safari trên iPhone 15 Pro | TP.HCM | 14.161.22.105 | 2 giờ trước |
| 3 | Edge trên Windows 10 | Đà Nẵng | 42.114.18.90 | 3 ngày trước |
| 4 | Chrome trên MacOS Sonoma | Hà Nội | 118.70.192.44 | 1 tuần trước |

- The current session shows a "Thiết bị này" chip and "Đang hoạt động" text, with no button.
- Others get a "Đăng xuất" button that revokes immediately, with no confirmation.
- "Đăng xuất khỏi thiết bị khác" also acts immediately. It uses a hard-coded "tất cả 3 thiết bị khác" message and has no confirm modal.
- There are no loading, error or empty states.

**Notifications tab**
- Four rows, each with a custom Switch (44×24, `role="switch"`, `aria-checked`, Space/Enter handling, 0.2s transition).
- The four rows: eval_results, wallet_balance, case_deadline, system_news (the last one off by default).
- Each toggle shows an inline alert, "Đã cập nhật: Tùy chọn "…" đã được bật/tắt." There is no save call.

**Mockup-only extras**: the Spec tab (typography, palette, house rules), the in-page `.mock` disclaimers, and the Phosphor icons. All of these must stay out of production.

## 3. Current code

**Forms and validation** (TanStack Form v1 via `useForm`)

| Form | Rule | Exact string |
|---|---|---|
| Profile name | `!value.trim()` | "Tên hiển thị không được để trống." (`ProfileInfoForm.tsx` ~L98-100) |
| Current password | empty | "Vui lòng nhập mật khẩu hiện tại." |
| New password | empty | "Vui lòng nhập mật khẩu mới." |
| New password | under 8 characters | "Mật khẩu mới phải ít nhất 8 ký tự." |
| Confirm password | not equal to new | "Xác nhận mật khẩu không khớp." |

- Errors show only once the field is touched. They are passed to the Mantine `TextInput` / `PasswordInput` `error` prop.
- The profile form submit button is never disabled for "not dirty". It only shows a loading state.

**API calls, all through hooks**
- `updateName`: Better Auth `updateUser({name})`. It manually throws on `result.error`.
- `changePassword`: `POST /profile/password/change`.
- `setPassword`: `POST /profile/password`.
- `useHasPasswordQuery`: `GET /profile/password-status`.
- `changeAvatar`: `POST /profile/avatar` (multipart).
- `deleteAccount`: `DELETE /profile/account`, then `signOut`, `queryClient.clear()`, `router.replace("/auth")`.
- Sessions: `GET /profile/sessions`, `DELETE /profile/sessions/:id`, `POST /profile/sessions/revoke-others`.
- Notifications: `GET` and `PUT /notifications/preferences`.

**Avatar flow (GA05)**
- It is a native hidden `<input type=file>` driven by a ref, not Mantine `FileButton`.
- It validates on mutation (`validateAvatarFile`):
  - Extension must be `.jpg`, `.jpeg`, `.png` or `.webp`, else "Chỉ hỗ trợ ảnh .jpg, .jpeg, .png hoặc .webp".
  - Size over 2MB gives "Dung lượng ảnh tối đa là 2MB".
- Errors appear as a toast, not inline.
- It uploads immediately on file pick. There is no preview and no Save gate. On success it shows a toast, "Đã cập nhật ảnh đại diện.", and refetches the session.
- There is no help text about the limits on the page.

**Delete account (GA04)**
- The modal is Mantine `Modal` (`centered`, `radius="md"`) and has no `className` positioning.
- The input is a `TextInput` with a label, a description and `placeholder="XOA"`.
- The confirm rule matches the mockup: trimmed, uppercased input must be `XOA` or `XÓA`.
- Close is blocked while loading. Title is "Xóa tài khoản vĩnh viễn".
- Cancel reads "Hủy bỏ" and confirm reads "Xác nhận xóa tài khoản".

**Sessions (GA06)**
- `SessionItem` shows `{os} • {browser}`, a `Phiên hiện tại` Badge (teal, light), and the line `IP: … • Đăng nhập lúc: dd/mm/yyyy hh:mm`.
- Per-session "Đăng xuất" is `size="xs"`, which breaks the control size rule (≥ sm).
- The bulk button is "Đăng xuất tất cả thiết bị khác". It is hidden when there are no other sessions and opens `RevokeOthersModal`.
- There is a loading skeleton (3 rows), an error state with a "Tải lại" button, and an empty state.
- The icon is Laptop, Smartphone, Tablet or Globe from the User-Agent.

**Does the API return location or "last active"?** No.
- `ActiveSessionDtoSchema` (`packages/validation/src/index.ts` ~L791) has `id`, `ipAddress`, `userAgent`, `createdAt`, `expiresAt` and `isCurrent`.
- There is no geolocation and no last-seen field. `list-sessions.usecase.ts:44-48` maps only those fields.
- Showing location or "2 giờ trước" needs backend work: geo-IP lookup and a last-activity field. This is a **high** gap.

**Notifications (GA08)**
- The form is a single Mantine `Switch` labelled "Nhận email", with the description "Gửi thông báo tới email đã đăng ký."
- It saves immediately and rolls back the draft on error.
- It has a loading text ("Đang tải cài đặt thông báo..."), an error text, and a toast on save failure.
- The schema is `{ email_enabled: boolean }`, strict (`index.ts` ~L684).
- There are no categories. Four groups in the UI would need a new schema, new API and a DB column change. This is a **blocker** if the mockup's four toggles are expected to persist.

**Password**
- The form has `PasswordInput` for current, new and confirm, with `autoComplete="current-password"` only on the current one.
- It has two modes: change, and "set password" for OAuth-only accounts.
- Set-password mode hides the current-password field. It shows the label "Mật khẩu" / "Xác nhận mật khẩu" and the button "Đặt mật khẩu".
- The new-password field has an Info tooltip.
- The success toast tells the user "Các thiết bị khác đã được đăng xuất."
- The loading state is odd: a Paper containing only a loading "Đặt mật khẩu" button.

**Nav and layout**
- `SettingsLayout` is a header (h1 plus description) over a `grid-cols-1 md:grid-cols-[240px_1fr]` layout.
- `SettingsSidebar` is Next `Link`s. On mobile it is a horizontally scrolling tab strip (`flex md:flex-col overflow-x-auto`). Active state uses `aria-current="page"`.
- Icons are Lucide `User`, `KeyRound`, `MonitorSmartphone` and `Bell`.
- The nav is route-based (`/dashboard/settings/<tab>`). The mockup is `?tab=` query-based, so it has no direct code equivalent.

## 4. Mockup element → existing component

| Mockup element | Mantine / existing equivalent |
|---|---|
| Name field with `error` | `TextInput` `error=` (already used) |
| Disabled email with hint | `TextInput disabled`, label with `Tooltip` + `Info` (already present). The mockup makes the hint always visible, so use `description=` or keep the label plus tooltip |
| Avatar 96px plus initials fallback | `Avatar size={96}` (already present) |
| "Đổi ảnh" + hidden input | `FileButton accept=...` would replace the ref plus hidden input. Note it has no 2MB check, so keep `validateAvatarFile` |
| Size/type note | `Text size="sm" c="dimmed"` |
| Custom Switch | `Switch` (already used) with `color="brand"`, `label`, `description`. No custom CSS is needed |
| Alert bars ("p-notice", "sess-notice") | `notifications.show` toasts (existing pattern) or Mantine `Alert` |
| Dirty-gated Save | `form.Subscribe` on `isDirty`/`canSubmit` plus `Button disabled`. Not currently implemented |
| Delete modal | `DeleteAccountModal` exists and already has the same rule. It only needs copy and layout changes |
| Danger box | Existing `Paper` with `border-red-500/30` |
| Mobile drawer | Mantine `Drawer` (see rule below), triggered by `Burger` from `@mantine/core` |
| Session list items | `Paper` plus `Badge` (already present) |
| Password inputs | `PasswordInput` (the mockup's `type="text"` is wrong and should not be copied) |
| Spinner | `Loader2` from lucide (already used) |

## GAPS & RISKS

| # | Mismatch | Severity | Decision needed |
|---|---|---|---|
| 1 | Sessions show location, and "last active" times (2 giờ trước, 3 ngày trước). The API returns neither. | high | Drop location, or add geo-IP plus last-seen in the backend? Which fields does the UI show? |
| 2 | Notifications: the mockup has 4 persisted toggles. The API has one `email_enabled` boolean. | blocker | Keep one email switch, or add schema, API and DB for 4 categories? "Bản tin hệ thống" and "Nhắc hạn nộp" may not exist as sendable events. |
| 3 | The mockup's per-session and bulk logout act at once with no confirm. Code has a confirm modal for bulk logout, none for single. | med | Keep the modal (safer, extra step) or follow the mockup? Mockup copy also hard-codes "tất cả 3 thiết bị". |
| 4 | Avatar: mockup previews first and applies on Save, with a size-only check. Code uploads at once on pick, no preview, and checks both extension and size. | high | Choose upload-on-pick or preview + Save. A Save-gated avatar needs preview state and an upload step moved into submit. Also keep the extension check; the mockup drops it. |
| 5 | Avatar errors: mockup uses an inline alert, code a toast. Mockup also shows the limit as always-visible text. | low | Inline vs toast. Either way add the visible "Tối đa 2MB (.jpg, .jpeg, .png, .webp)" note. |
| 6 | Save button: mockup disables it until dirty. Code leaves it enabled. | low | Adopt dirty-gating? It needs `form.Subscribe`. |
| 7 | Password tab in the mockup is a disabled stub with `type="text"`. Code has a real form with set-vs-change modes, a status query, an Info tooltip and "other devices signed out" copy. | med | Redesign the password UI too, or leave it? Do not drop the set-password mode or `PasswordInput`. |
| 8 | The mockup's `?tab=` query routing and the Spec tab are not real. Code uses route pages. | med | Keep route-based navigation; omit Spec. |
| 9 | Mobile nav: the mockup uses a drawer with a burger, scrim, focus trap and Esc. Code uses a scrolling pill strip. | med | Do you want the drawer on mobile? If yes, the drawer MUST use Mantine `Drawer` with no Tailwind positioning classes (AGENTS rule). Hand-rolled fixed CSS from the mockup would break it. |
| 10 | Delete modal copy differs (see table below). | low | Which copy is final? |
| 11 | Icons: mockup uses Phosphor. | low | Map to Lucide: `AlertTriangle`, `Trash2`, `ImagePlus`, `Info`, `Monitor`, `Smartphone`, `Laptop`, `Tablet`, `LogOut`, `Bell`, `KeyRound`, `User`. |
| 12 | Mockup removes the mobile "device type" detection for sessions. Code derives Laptop/Smartphone/Tablet/Globe, and parses `Windows 10/11`, `macOS` and so on. | low | Keep the real parser (`@repo/validation`). The mockup's strings like "Windows 11" and "MacOS Sonoma" are not producible, because the parser only yields `Windows 10/11` and `macOS`. |
| 13 | The mockup drops: the `IP khác nhau` sessions loading skeleton, error + "Tải lại", empty state, the "Phiên hiện tại" badge copy (mockup says "Thiết bị này"), the password-status loading state, the OAuth-only set-password flow, `translateAuthError` mapping, and Better Auth error throwing in `updateName`. | high | Must be kept. The mockup is silent on all of them. |
| 14 | File-size limits: shared `ProfileInfoForm` and `SettingsLayout` are used by admin/supporter/writer routes. A visual redesign changes those pages too. | med | Confirm the change applies to all roles, or fork the student version. |
| 15 | The mockup's 4 text sizes and 16px base body text differ from code, which uses `size="sm"` and `size="xs"` for body text, below the mockup's 14px floor. Also `size="xs"` on the sessions buttons conflicts with the ≥ sm control rule. | low | Raise `xs` to `sm` as part of the redesign. |

**Wording / AGENTS checks**
- No currency, CP1–CP4 or Phosphor rule violations appear in the mockup copy.
- `design-system/wording/pages/settings-profile.md` is the canonical copy. Its terms differ from the mockup in places (checked against the files I read):

| Item | Canonical (wording + code) | Mockup |
|---|---|---|
| Delete modal title | "Xóa tài khoản vĩnh viễn" | "Xác nhận xóa tài khoản" |
| Cancel button | "Hủy bỏ" | "Hủy" |
| Delete input label | "Xác nhận thao tác" | "Nhập XOA hoặc XÓA để xác nhận:" |
| Placeholder | "XOA" | "Nhập XOA hoặc XÓA" |
| Success toast | "Đã cập nhật thông tin hồ sơ." | "Đã cập nhật thông tin tài khoản thành công." |
| Current-session badge | "Phiên hiện tại" | "Thiết bị này" |
| Bulk-logout button | "Đăng xuất tất cả thiết bị khác" | "Đăng xuất khỏi thiết bị khác" |

- Where the mockup disagrees with the wording folder, the wording folder wins per the rules. The user should confirm which side they want if they prefer the mockup copy, since `settings-sessions.md` and `settings-notifications.md` would then need updating as well.
- Parts of `settings-profile.md` rendered with mojibake in my shell. The text I quoted is from the lines that decoded correctly.
- The mockup's "Quy ước" spec copy and the hard-coded `.mock` disclaimers must not ship.
- Hard-coded values in the mockup (2MB, `XOA`) match code constants: `MAX_AVATAR_FILE_SIZE_BYTES` and the inline `["XOA","XÓA"]`.

## REUSE

- **Mantine**: `Paper`, `TextInput`, `PasswordInput`, `Avatar`, `Button`, `Modal`, `Switch`, `Badge`, `Skeleton`, `Tooltip`, `Group`, `Stack`, `Text`. `Drawer` and `Burger` if the mobile drawer is wanted. `FileButton` is optional.
- **Hooks** (keep as-is): `useProfileMutations` (`updateName`, `changePassword`, `setPassword`, `changeAvatar`, `deleteAccount`, `useHasPasswordQuery`), `useSessionMutations`, `useActiveSessionsQuery`, `useNotificationPreferences`.
- **Components**: `DeleteAccountModal`, `RevokeOthersModal`, `SessionItem`, `SessionsList`, `SettingsLayout`, `SettingsSidebar`, `getSettingsNav`.
- **Utils**: `parseUserAgent` and `formatIpAddress` via `@/lib/utils/ua-parser`, `ActiveSessionDto` from `@repo/validation`, `translateAuthError`, `notifications.show`.
- **CSS tokens**: `bg-surface-app`, `border-border-app`, `text-text-muted`, `text-text-primary`, `text-brand`, `bg-surface-soft`, `bg-brand-soft`, `font-heading`, `font-body`.

**Not checked**: I did not read `design-system/wording/pages/settings-password.md` or `settings-notifications.md` in full; I opened only the first part of `settings-sessions.md`. I did not confirm whether `useSession` exposes a `refetch`-based session refresh for avatars across the navbar. I did not review the mobile behaviour of the admin, supporter and writer layouts.

**Risk**: gaps 1 and 2 need backend and schema decisions before any UI work, and gap 14 means a visual change to the shared profile and layout components lands on every role.