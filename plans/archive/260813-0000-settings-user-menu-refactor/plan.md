---
title: "Settings Sidebar & User Menu Modal — Hồ sơ cá nhân"
description: "Refactor khu vực hồ sơ sinh viên: avatar mở modal sạch (info + options Hồ sơ/Thanh toán/Cài đặt + Đăng xuất), settings có sidebar pattern Facebook (Thông tin cơ bản, Đổi mật khẩu). Sửa triệt để các lỗi UX của PR #15: bỏ username bịa, email hiển thị full read-only, avatar không fake upload."
status: completed
priority: P1
effort: 9h
branch: feat/ui-profile
tags: [frontend, settings, profile, user-menu, mantine, tanstack-form, ux]
blockedBy: []
blocks: []
created: 2026-08-13
---

# Settings Sidebar & User Menu Modal

## Overview

Frontend-only refactor. Nguồn quyết định: [`docs/requirements/settings-sidebar-and-profile.md`](../../docs/requirements/settings-sidebar-and-profile.md) (F07, đã chốt toàn bộ, không còn câu hỏi mở).

Thay đổi:

1. **Avatar → Modal sạch** (thay `Menu.Dropdown` 8 mục): info block (avatar, tên, email full, role, số dư ví với student) + options **Hồ sơ / Thanh toán / Cài đặt** + **Đăng xuất** tách biệt.
2. **Khu vực Settings có sidebar** (pattern Facebook): `/dashboard/settings/*` — Thông tin cơ bản, Đổi mật khẩu. Config-driven, future-proof.
3. **Trang Thông tin cơ bản**: các ô có thể sửa + nút "Lưu thay đổi" ở cuối. Email full, read-only. Avatar "Đổi ảnh" → notification "Chức năng đang được phát triển" (không fake upload).
4. **Đổi mật khẩu**: TanStack Form, inline validation, `revokeOtherSessions: true`.
5. **Xóa bỏ**: field "Tên đăng nhập" (bịa từ email), mask email, avatar preview giả.
6. **URL**: route cũ `/dashboard/profile` → redirect `/dashboard/settings/profile`.

## Yêu cầu UX (từ skill ui-ux-pro-max, đã lọc qua Nexus design tokens)

- **Style**: Flat — dùng token Mantine có sẵn (`bg-surface-app`, `border-border-app`, `text-text-app`, `text-text-muted`, `brand`, `danger`). Không shadow trên Mantine components, không gradient.
- **Forms**: label rõ, error inline dưới field, loading state nút submit, helper text cho mật khẩu, `<form>` thật (Enter submit).
- **Nav**: active state rõ (không chỉ màu), icon Lucide + label, cursor-pointer, focus ring giữ.
- **Accessibility**: contrast 4.5:1 (token sẵn đã pass), touch target ≥44px (size md), Esc đóng modal (Mantine mặc định), reduced-motion (Mantine mặc định).
- **Responsive**: 375px — sidebar chuyển nav ngang cuộn; 768px+ sidebar cột 240px.
- **Anti-patterns (AGENTS.md)**: không `as any` (dùng `FieldApi` type), không try/catch trong component (đẩy vào hook), không `useState` form state (TanStack Form), file ≤200 dòng, Vietnamese-first.

## UI Library — Mantine v9 (bắt buộc, đồng nhất hệ thống)

- **Mọi UI component dùng Mantine v9** (`@mantine/core`, `@mantine/notifications`): `Paper`, `Stack`, `Group`, `TextInput`, `PasswordInput`, `Modal`, `Avatar`, `Badge`, `Button`, `Text`, `Divider`, `ScrollArea` — KHÔNG tự dựng component bằng div thuần khi Mantine đã có.
- Tailwind chỉ dùng cho layout ngoài (grid, spacing, responsive, token màu) — KHÔNG thêm Tailwind positioning vào Mantine components (Mantine rule trong `apps/web-1/AGENTS.md`).
- Component Mantine dùng props chuẩn: `size="md"`, `radius="md"`, `variant="light"`, `centered` (Modal), `withCloseButton` — không override class thừa.
- Pattern tham khảo code hiện có: `BanUserModal.tsx` (Modal), `PaymentHistoryList.tsx` (Paper/Card list), `SupportNeedsStep.tsx` (form.Field + Mantine input).

## Skills cần kích hoạt NGAY khi bắt đầu implement

1. **`ck:ui-ux-pro-max`** — đã kích hoạt khi lập plan (design system query); khi implement, chạy lại `--domain ux` cho forms/modal/nav nếu gặp quyết định visual.
2. **`ck:frontend-development`** (React/Next.js + Mantine) — tham khảo pattern chuẩn trước khi viết component.
3. **`ck:ui-styling`** — nếu cần tinh chỉnh style Mantine theme tokens.
4. **`aesthetic`** — tham chiếu khi đánh giá chất lượng visual trước khi delivery (pre-flight: hierarchy, spacing, micro-interaction).
5. **`ck:web-frameworks`** — nested layout App Router Next.js 16 (thay thế phần docs bị Scout Block chặn).

Quy tắc: skill là tham khảo — KHÔNG override quyết định đã chốt trong F07 và design tokens hiện tại của hệ thống.

## Files map

```
MỚI  apps/web-1/app/dashboard/settings/layout.tsx                 (grid sidebar + content)
MỚI  apps/web-1/app/dashboard/settings/page.tsx                   (redirect → profile)
MỚI  apps/web-1/app/dashboard/settings/_components/SettingsSidebar.tsx
MỚI  apps/web-1/app/dashboard/settings/_components/settings-nav.ts (config array)
MỚI  apps/web-1/app/dashboard/settings/profile/page.tsx
MỚI  apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx
MỚI  apps/web-1/app/dashboard/settings/password/page.tsx
MỚI  apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx
MỚI  apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts
MỚI  apps/web-1/lib/auth-errors.ts                                (translateError dùng chung)
MỚI  apps/web-1/components/layout/_components/UserMenu.tsx        (avatar trigger + modal)
SỬA  apps/web-1/components/layout/DashboardShell.tsx              (bỏ dropdown, mount UserMenu)
SỬA  apps/web-1/app/dashboard/profile/page.tsx                    (→ redirect stub)
```

Không đụng: backend, DB, `lib/auth-client.ts` (đã có `updateUser`/`changePassword`), `useWalletBalance` (tái dùng trong modal).

## Dependencies

Không có. Frontend-only, không conflict plan nào (toàn bộ `plans/` đã archive).

## Risks

| Risk | Mitigation |
|---|---|
| **Better Auth mutations KHÔNG throw** — `updateUser`/`changePassword` trả `{ data, error }` | `mutationFn` phải tự check `result.error` rồi throw, nếu không toast xanh chạy cả khi lỗi (đã sửa trong phase-02 snippet) |
| `updateUser` xong session name chưa refresh | Sau success, xác minh name hiển thị; nếu không tự cập nhật → `useSession().refetch()` (repo chưa từng dùng refetch — code đầu tiên, phải test thật; check Better Auth docs, không đoán) |
| `revokeOtherSessions: true` logout thiết bị khác | Test 2 tab khi đổi mật khẩu |
| Settings nằm dưới `/dashboard` (role-guarded student) | Admin/supporter: modal KHÔNG render options Hồ sơ/Thanh toán/Cài đặt — chỉ workspace link + Đăng xuất |
| `DashboardShell.tsx` hiện 200 dòng | Tách `UserMenu` phải giữ shell ≤200 dòng |
| Modal phá layout vì Tailwind positioning | KHÔNG thêm `fixed`/`inset-0`/`flex` vào `Modal` — Mantine rule |
| `check-types` (turbo) chạy cả apps/api → `prisma:generate` | Đảm bảo `.env` có DATABASE_URL hợp lệ trước khi verify (xem phase-05) |
| Next.js 16 docs bị Scout Block chặn (`node_modules/next/dist/docs`) | web-1/AGENTS.md bắt buộc đọc guide trước khi code → dùng webfetch nextjs.org (App Router nested layouts/redirect) hoặc xin mở ngoại lệ Scout Block trước phase-01 |
| Lint web-1 = `eslint --max-warnings 0` → warning cũng fail | Không `any`, không warning mới — xác minh bằng `npm run lint` |

## Phases

| # | Phase | Effort | Files |
|---|---|---|---|
| 01 | Settings layout + sidebar skeleton | 1.5h | settings/layout.tsx, page.tsx, _components/* |
| 02 | Trang Thông tin cơ bản | 2.5h | profile/*, hooks/useProfileMutations.ts, lib/auth-errors.ts |
| 03 | Trang Đổi mật khẩu | 2h | password/* |
| 04 | UserMenu modal + DashboardShell refactor | 2h | components/layout/* |
| 05 | Cleanup + verify | 1h | dashboard/profile redirect, check-types, lint |

## Verification

```bash
npm run check-types
npm run lint
```

Manual:
- 375px + 768px + 1440px; dark/light mode
- Avatar click → modal; Esc/backdrop đóng; options điều hướng đúng + modal đóng
- Save tên → toast xanh; Enter submit; email không sửa được; "Đổi ảnh" → notification đang phát triển
- Đổi pass: validation inline, success → field reset, session tab khác bị logout
- `/dashboard/profile` → redirect settings, không 404

## Implementation Notes

> Sync-back kết quả thực tế (2026-08-13). Toàn bộ 5 phase đã hoàn thành. Plan đánh dấu `completed`.

### Tổ chức thực thi (lệch kế hoạch phase — không lệch scope)

- **Phase 02 + 03 gộp chung 1 agent** (cùng `useProfileMutations`/`translateAuthError`, tách 2 phase tiết kiệm 1 lần context load). Files cả 2 phase nằm trong 1 PR, verify chung.

### Điểm chệch thực tế so với snippet trong plan

| # | Chệch | Lý do / cách xử lý |
|---|---|---|
| (a) | Validator TanStack Form nhận `{ value }`, không phải `value` trực tiếp | `validators={{ onChange: ({ value }) => ... }}` — thay vì `value => ...` |
| (b) | Dùng `mutate` + per-call `onSuccess` thay `mutateAsync` trong `handleSubmit` | `mutateAsync` bị `handleSubmit` re-throw → dùng `mutate` với `onSuccess` riêng, tránh unwrapped error lan ra |
| (c) | `FieldApi<TParentData, TName>` 2 generic KHÔNG hợp lệ với TanStack Form v1.33 (cần 23 type args) | Bỏ annotation render-props, để TS tự infer type từ `form.Field` |
| (d) | Thêm `onChangeListenTo: ["newPassword"]` vào confirm field | Để lỗi "không khớp" tự re-validate khi user sửa lại `newPassword` |

- Phase 04: `UserMenu.tsx` = 187 dòng (self-contained: tự gọi `useSession`, `useWalletBalance`, `signOut`; `handleSignOut` chuyển hẳn vào UserMenu). `DashboardShell.tsx` 200 → **60 dòng**.
- Phase 05: `profile/page.tsx` → redirect stub. `check-types` PASS (3/3 workspace). Targeted eslint 13 file = 0 vấn đề. Lint repo-wide FAIL 206 lỗi **pre-existing, KHÔNG thuộc scope** — đã quyết định defer task riêng (xem phase-05).

### Kết quả review

- Code-reviewer: **8.4/10 PASS**; tester: **PASS**.
- Fix sau review (đã apply): focus-visible ring (avatar trigger + option buttons + signout + sidebar link); `auth-errors` fallback tiếng Việt + map `rate limit`; email fallback `"—"` + `break-all` trong modal/profile; grid sidebar 220px → **240px** (đúng spec); `aria-current="page"` trên sidebar active link.
- Sau fix: `check-types` re-run PASS; targeted eslint vẫn sạch.

### QA thủ công còn lại (chưa test — dev manual, chưa có người chạy)

- [ ] Login → redirect chain `/dashboard/settings/profile` hiển thị đúng sau đăng nhập.
- [ ] Đổi tên → navbar refetch (session name refresh sau `updateUser`).
- [ ] Đổi pass với 2 tab → tab kia logout (`revokeOtherSessions`).
- [ ] Modal với 3 role (student/admin/supporter) → đúng options theo role.

### Docs (chưa cập nhật)

- Docs cập nhật chưa chạy — **pending docs-manager** (xem phase-05 mục 4).
