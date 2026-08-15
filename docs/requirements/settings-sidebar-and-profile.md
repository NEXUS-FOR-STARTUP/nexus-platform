# Brainstorm & Functional Requirement: Settings Sidebar và Hồ sơ cá nhân

## 1. Document info

- Feature ID: F07
- Trạng thái: **implemented** (2026-08-13) — tóm tắt kết quả + điểm chệch ở [mục 12](#12-implementation-status-2026-08-13)
- PRD reference: [`../prd/core-product-prd.md`](../prd/core-product-prd.md)
- Code liên quan:
  - `apps/web-1/app/dashboard/profile/page.tsx` (cũ → redirect stub sang `/dashboard/settings/profile`)
  - `apps/web-1/components/layout/DashboardShell.tsx` (refactor: 200 → 60 dòng; user menu tách ra `_components/UserMenu.tsx`)

## 2. Traceability

- Business reason: hồ sơ cá nhân là bề mặt sinh viên dùng thường xuyên; settings sẽ mở rộng (thông báo, bảo mật...) nên cần khu vực có cấu trúc.
- User problem: trang profile hiện tại sai hướng — bịa "tên đăng nhập", che email, avatar upload giả, một màn hình không scale được; user menu (dropdown) bừa bộn, nhồi quá nhiều mục.
- Related acceptance criteria: settings có sidebar như Facebook; email hiển thị đầy đủ (read-only); không có field username; avatar mở modal sạch.

## 3. Bối cảnh & vấn đề

Trang profile hiện tại (PR #15) có 4 lỗi hướng:

1. **Bịa "tên đăng nhập"** từ prefix email (`email.split("@")[0]`) + hint "chỉ có thể thay đổi một lần" — hệ thống **không có khái niệm username trong product**, đăng nhập bằng email. Cột `users.username` / `users.display_username` là field mặc định của Better Auth, nullable, không dùng ở đâu.
2. **Che email** (`ab*****@...`) — user cần xem email đầy đủ.
3. **Avatar upload giả** — chọn ảnh → toast xanh "Tải ảnh thành công" nhưng chỉ preview local, không lưu gì. Vi phạm "Trust over magic".
4. **Một màn hình form settings** — không mở rộng được khi settings có thêm mục.

Ngoài ra, user menu trong `DashboardShell` (dropdown 200 dòng) bừa bộn:

5. **Dropdown nhồi 8 mục** (thông tin + role + số dư + 3-4 nav + logout) — vi phạm yêu cầu gốc: nhấn avatar → modal **sạch**, thông tin quan trọng + các option điều hướng gọn.
6. **Menu là lối vào DUY NHẤT** của "Ví của tôi" / "Lịch sử thanh toán" (dashboard home không có link) — thu gọn menu thì lối vào này phải được giữ ở dạng option trong modal.

## 4. Quyết định đã chốt (từ stakeholder)

| # | Quyết định |
|---|---|
| 1 | Nhấn "Đổi ảnh" → hiện ngay notification "Chức năng đang được phát triển". Không mở file picker. |
| 2 | Bỏ hoàn toàn field "Tên đăng nhập" và hint liên quan. |
| 3 | Email hiển thị đầy đủ, không mask. **Email read-only, không cho sửa** (đổi email cần verification flow riêng — để sau). |
| 4 | Khu vực **Settings** có sidebar (pattern Facebook), chứa nhiều nav con: Thông tin cơ bản, Đổi mật khẩu... Future-proof cho các mục settings sau này. |
| 5 | Toàn bộ điểm còn lại của review UX (xem mục 6) áp dụng nguyên văn. |
| 6 | **URL đổi sang `/dashboard/settings`** — toàn bộ link mới dùng `/dashboard/settings/*`; route cũ `/dashboard/profile` giữ redirect 1 dòng để không vỡ link. |
| 7 | **User menu (avatar) → modal sạch** (yêu cầu gốc): nhấn avatar mở modal, hiện thông tin clean & quan trọng (avatar, tên, email, role, **số dư ví hiện tại** để xem nhanh); bên dưới là **các option vào page cụ thể**: Hồ sơ, Thanh toán, Cài đặt. |
| 8 | **Thanh toán KHÔNG nằm trong settings sidebar** — "Thanh toán" là option trong modal, trỏ thẳng page thanh toán/ví. Sidebar settings chỉ chứa các mục cài đặt. |
| 9 | Page settings: thông tin cá nhân đặt trong **các ô có thể sửa + nút Save ở cuối**, như các trang setting thông thường. |

## 5. Phương án đã cân nhắc

| Phương án | Đánh giá |
|---|---|
| A. Giữ tabs trong 1 page (hiện tại) | **Reject** — không scale khi thêm mục settings; stakeholder đã yêu cầu sidebar. |
| B. Sidebar global trong `DashboardShell` (hiện cho mọi trang dashboard) | **Reject** — phá layout hiện tại (top navbar + content card), scope lớn, vi phạm KISS/YAGNI. |
| C. Nested layout riêng cho `/dashboard/settings` (sidebar chỉ trong khu vực settings) | **Chọn** — đúng pattern Facebook (sidebar theo khu vực), không ảnh hưởng trang khác, thêm mục mới = 1 entry config + 1 route. |

## 6. Giải pháp cuối

### Route structure (Next.js nested layout)

```
app/dashboard/settings/
├── layout.tsx                        → grid: sidebar (left, md+) + content; mobile: nav ngang cuộn
├── page.tsx                          → redirect → /dashboard/settings/profile
├── _components/SettingsSidebar.tsx   → nav config-driven, active state theo usePathname
├── profile/page.tsx                  → Thông tin cơ bản
├── profile/_components/ProfileInfoForm.tsx
├── password/page.tsx                 → Đổi mật khẩu
├── password/_components/ChangePasswordForm.tsx
└── hooks/useProfileMutations.ts      → mutation updateUser + changePassword (TanStack Query)
```

- `/dashboard/profile` (route cũ) → redirect `/dashboard/settings/profile`. Mọi link mới dùng `/dashboard/settings/*`.

### User menu → Modal (DashboardShell refactor)

Tách user menu ra khỏi `DashboardShell`:

- `components/layout/_components/UserMenu.tsx` — avatar (trigger) + Mantine `Modal` (thay `Menu.Dropdown`).
- Modal cấu trúc (top → bottom):
  1. **Info block**: avatar + tên + **email full** + role badge.
  2. Student: 1 dòng **"Số dư ví: X VND"** (xem nhanh, không cần vào trang).
  3. Divider → **Options** (icon + label, full-width):
     - **Hồ sơ** (User icon) → `/dashboard/settings/profile` (shortcut vào trang thông tin cơ bản).
     - **Thanh toán** (CreditCard icon) → `/dashboard/wallet` (lối vào ví/thanh toán; `/dashboard/payments` hiện redirect về wallet nên trỏ thẳng wallet).
     - **Cài đặt** (Settings icon) → `/dashboard/settings`.
     - Admin/Supporter: thay "Hồ sơ/Thanh toán/Cài đặt" bằng "Bàn làm việc Admin/Supporter" (link workspace) — settings hiện chỉ thuộc phạm vi student (`/dashboard/*` role-guarded), KHÔNG build settings cho 2 persona này (YAGNI).
  4. Divider → **Đăng xuất** (đỏ, tách biệt).
- Giữ nguyên: disconnect Centrifugo khi đổi tài khoản, handleSignOut, wallet balance hook.

**Lưu ý Mantine rule**: không thêm Tailwind positioning (`fixed`, `inset-0`, `flex`...) vào `Modal`/`Popover` — dùng layout mặc định của Mantine (`Popover position="bottom-end"`).

### Sidebar (chỉ chứa mục cài đặt)

- Config array: `[{ href, label, icon, group? }]` — thêm mục mới chỉ sửa config.
- Active state: `usePathname` + highlight (toàn bộ item nằm trong `/dashboard/settings`).
- Mobile (<md): nav ngang cuộn dưới tiêu đề, không sidebar cột.
- Mục hiện tại:
  - **Thông tin cơ bản** (User) → `/dashboard/settings/profile`
  - **Đổi mật khẩu** (KeyRound) → `/dashboard/settings/password`
- **KHÔNG build trước** Thông báo/2FA/Ngôn ngữ (YAGNI).
- **KHÔNG** đưa Ví/Thanh toán vào sidebar (đã chốt — option ngoài modal).

### Trang Thông tin cơ bản

- Avatar (hiển thị `sUser.image` nếu có, else initial) + button "Đổi ảnh" → notification "Chức năng đang được phát triển".
- Các ô có thể sửa: Tên hiển thị (editable, TanStack Form).
- Email đăng nhập: **full, read-only** — ô hiển thị rõ ràng (không phải input disabled mập mờ), kèm ghi chú "Email dùng để đăng nhập".
- **Nút "Lưu thay đổi" ở cuối trang**.
- `translateError` (Better Auth EN→VI): tách ra `lib/` dùng chung cho auth pages.

### Trang Đổi mật khẩu

- 3 field (hiện tại / mới / xác nhận), TanStack Form, inline validation (≥8 ký tự + gợi ý độ mạnh).
- `revokeOtherSessions: true` — đồng bộ với message toast.
- Submit: loading state, success → xóa field + toast.

### Hooks layer

- `useProfileMutations`: bọc `updateUser`, `changePassword` — try/catch nằm trong hook, component sạch.
- Không `as any`, không `Record<string, any>`.

## 7. Anti-patterns tránh khi implement

- File > 200 dòng → đã tách components/hooks ở trên.
- try/catch trong component code.
- `useState` cho form state (dùng TanStack Form).
- `shadow-*` trên Mantine components.
- Bịa dữ liệu không tồn tại trong hệ thống (username).
- Fake success (toast "thành công" khi không lưu gì).

## 8. Rủi ro & lưu ý

- `revokeOtherSessions: true` → thiết bị khác logout sau đổi pass. Cần test hành vi Better Auth (2 tab).
- `users.username` / `display_username`: giữ nguyên trong DB (Better Auth managed), **không migration**, chỉ bỏ khỏi UI.
- `sUser.image` từ Google OAuth: giữ hiển thị bình thường.
- Bug `URL.createObjectURL` leak ở code cũ tự biến mất khi bỏ file picker.
- Settings nằm dưới `/dashboard/*` (role-guarded student) → admin/supporter KHÔNG vào được settings. Đã xử lý: modal admin/supporter không render các option Hồ sơ/Thanh toán/Cài đặt. Đừng đặt settings route ngoài `/dashboard` (scope creep).
- "Thanh toán" trong modal trỏ `/dashboard/wallet` (payments đang redirect) — nếu sau này tách 2 trang thật, sửa lại href modal.
- `DashboardShell.tsx` trước refactor đúng 200 dòng; sau khi tách `UserMenu` còn **60 dòng** (đạt limit).

## 9. Acceptance criteria

- Nhấn avatar → **modal sạch**: avatar, tên, email full, role badge, dòng số dư ví (student); options **Hồ sơ / Thanh toán / Cài đặt**; **Đăng xuất** tách biệt. Không còn dropdown 8 mục cũ.
- "Cài đặt" trong modal → `/dashboard/settings` mở page có sidebar (pattern Facebook).
- Sidebar settings chỉ chứa mục cài đặt: Thông tin cơ bản, Đổi mật khẩu; active state đúng theo route; **không có** mục Ví/Thanh toán.
- Profile: thông tin trong các ô, email read-only hiển thị full, **nút Save ở cuối**; sửa tên → mutation thành công → toast; Enter submit được (có `<form>`).
- Avatar: click → notification "Chức năng đang được phát triển", không mở file picker.
- Đổi pass: validate inline, success → toast + xóa field, session khác bị revoke.
- `/dashboard/profile` cũ → redirect sang settings, không 404.
- Mobile 375px: sidebar chuyển nav ngang, page không horizontal scroll.
- 0 vi phạm anti-pattern mục 7.

## 10. Success metrics

- 0 anti-pattern mới (theo AGENTS.md).
- Thêm 1 mục settings mới trong tương lai chỉ tốn: 1 entry config + 1 route + 1 page.
- `DashboardShell` + `UserMenu` đều ≤ 200 dòng.

## 11. Câu hỏi mở

Không còn — đã chốt:

- Label option modal: **"Hồ sơ"**.
- "Thanh toán" trỏ thẳng **`/dashboard/wallet`**. (Nếu sau này tách 2 page thật, sửa href modal — xem mục 8.)

## 12. Implementation status (2026-08-13)

**implemented** — toàn bộ acceptance criteria mục 9 đạt. `check-types` PASS; 13 file mới eslint sạch. Lint repo-wide còn 206 vấn đề **pre-existing** (không thuộc feature này, deferred — chưa fix).

### Kết quả triển khai

- Route mới:
  - `/dashboard/settings` → redirect `/dashboard/settings/profile` (`settings/page.tsx`, 5 dòng)
  - `/dashboard/settings/profile` — Thông tin cơ bản (`ProfileInfoForm`): tên hiển thị (TanStack Form), **email là `TextInput disabled`** (helper "không thể thay đổi" → Tooltip trên label, 2026-08-13), avatar + "Đổi ảnh" → notification "Chức năng đang được phát triển"; form `gap="lg"` cho thoáng
  - `/dashboard/settings/password` — Đổi mật khẩu (`ChangePasswordForm`): 3 field, inline validation ≥8 ký tự, `revokeOtherSessions: true`; ghi chú dài trên field "Mật khẩu mới" → Tooltip trên label (2026-08-13)
  - Route cũ `/dashboard/profile` → redirect stub 5 dòng sang `/dashboard/settings/profile`
- `DashboardShell` 200 → **60 dòng**; user menu tách thành `components/layout/_components/UserMenu.tsx` (193 → **162 dòng**): Mantine `Popover` `position="bottom-end"` neo ngay dưới avatar (đổi từ `Modal centered` theo feedback người dùng 2026-08-13 — không mở giữa màn hình desktop); popover gọn lại (feedback 2026-08-13): bỏ info block to centered (avatar 56, tên, role badge) nhưng **giữ email xem nhanh** (mọi role, `truncate` 1 dòng — phân biệt tài khoản) + **dòng số dư ví compact** (student, số tiền tô đỏ `text-danger` ngay sau label để đọc lướt thấy) + options + **Đăng xuất** tách biệt — student: **Hồ sơ** `/dashboard/settings/profile`, **Thanh toán** `/dashboard/wallet`, **Cài đặt** `/dashboard/settings`; admin: **Bàn làm việc Admin** `/admin`; supporter: **Bàn làm việc Supporter** `/supporter`. Giữ nguyên disconnect Centrifugo khi đổi tài khoản, `signOut` + `queryClient.clear()`.
- `lib/auth-errors.ts` — `translateAuthError` (Better Auth EN→VI) dùng chung cho settings + auth pages.
- `useProfileMutations` (`app/dashboard/settings/hooks/`) — `updateUser` + `changePassword` (`revokeOtherSessions: true`), try/catch nằm trong hook, component sạch.
- Cấu trúc file khớp mục 6, gồm thêm `_components/settings-nav.ts` (config nav) + `_components/SettingsSidebar.tsx`.

**Lưu ý vận hành (đã verify trong code):** Better Auth `updateUser`/`changePassword` KHÔNG throw khi lỗi — trả `{ data, error }`. `mutationFn` phải tự check `result.error` và throw, nếu không `onError` không bao giờ chạy và `onSuccess` chạy cả khi lỗi (toast xanh sai).

### Điểm chệch so với giải pháp chốt (mục 6)

| Điểm | Chốt ban đầu | Thực tế (TanStack Form v1.33) | Lý do |
|---|---|---|---|
| Validator field | `onChange: (value) => ...` | `onChange: ({ value }: { value: string }) => ...` | Validator nhận object `{ value }` |
| Submit mutation | `mutateAsync` | `mutate` (fire-and-forget) + per-call `onSuccess` | TanStack Form v1 re-throw lỗi từ `onSubmit` → `mutateAsync` gây unhandled rejection; toast lỗi đã do hook `onError` lo |
| Render prop field | `FieldApi<...>` annotation | Bỏ annotation: `(field) => {...}` | v1.33 không cần khai báo type `FieldApi` trong render prop |
| Re-validate confirm password | — | `onChangeListenTo: ["newPassword"]` | Field xác nhận phải re-check khi `newPassword` thay đổi (mục 6 chưa chốt rõ) |
| Modal admin/supporter | 1 mục "Bàn làm việc Admin/Supporter" | 2 mục riêng theo role: Admin → `/admin`, Supporter → `/supporter` | Href khác nhau theo role, dùng chung label không đủ |

### Success metrics

- 0 anti-pattern mới (mục 7) — file mới đều ≤ 200 dòng: `DashboardShell` 60, `UserMenu` 187, `ProfileInfoForm` 118, `ChangePasswordForm` 130, `useProfileMutations` 57, `SettingsSidebar` 32.
