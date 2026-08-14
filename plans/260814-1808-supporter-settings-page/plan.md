---
title: "Supporter Settings Page — Cài đặt cho supporter"
description: "Mirror student settings (profile + change password) cho supporter. Thin routes /supporter/settings/* tái dùng ProfileInfoForm + ChangePasswordForm + useProfileMutations qua relative import; parameterize nav; thêm link Cài đặt trong UserMenu cho supporter. Frontend-only, không API/DB."
status: completed
priority: P2
effort: 3h
progress: 100
branch: feat/supporter-settings
tags: [frontend, settings, supporter, profile, password, mantine, tanstack-form, refactor]
blockedBy: []
blocks: []
created: 2026-08-14
---

# Supporter Settings Page

## Overview

Frontend-only. Supporter hiện KHÔNG có trang Cài đặt — `UserMenu` chỉ hiển thị link Cài đặt cho student (`isStudent`), supporter/admin chỉ có "Trang chủ" + Đăng xuất. Student settings đã build xong ở `260813-0000-settings-user-menu-refactor` (role-agnostic: chỉ gọi Better Auth `updateUser`/`changePassword`). Plan này mirror cho supporter với **zero thay đổi behavior student** (chỉ parameterize nav).

Tiếp cận **Option A** (thin routes + relative import, precedent `supporter/case/[id]/page.tsx` import `../../../dashboard/case/[id]/...`):

1. Parameterize nav: `SETTINGS_NAV` (const, href hardcode `/dashboard/settings/*`) → `getSettingsNav(basePath)`.
2. Extract layout shell → `_components/SettingsLayout.tsx` (server component, `basePath` prop). Cả 2 layout wrap nó — DRY, không duplicate 19 dòng.
3. Thin supporter routes `/supporter/settings/*` → tái dùng `ProfileInfoForm`, `ChangePasswordForm` qua relative import.
4. `UserMenu` thêm link Cài đặt cho supporter. Wallet block + admin giữ nguyên.

## Scope

**IN**: supporter profile + change password (reuse). Nav parameterization. SettingsLayout extraction. UserMenu supporter link. Verify.

**OUT**: admin settings. API/backend/DB changes. Hook mới (reuse `useProfileMutations`). Đụng `supporter/layout.tsx` (role guard giữ nguyên). Thay đổi behavior student (ngoài nav parameterization = no-op về mặt hiển thị).

## Decisions (chốt)

| # | Chủ đề | Quyết định |
|---|--------|-----------|
| D1 | Nav param | `getSettingsNav(basePath: string): SettingsNavItem[]` — sub-path relative `"/profile"`, `"/password"`; href = `` `${basePath}${subPath}` ``. Xóa export `SETTINGS_NAV` (chỉ `SettingsSidebar` consume — đã grep xác nhận). |
| D2 | Layout reuse | Extract `SettingsLayout` (server component) vào `dashboard/settings/_components/SettingsLayout.tsx`. `dashboard/settings/layout.tsx` + `supporter/settings/layout.tsx` đều là thin wrapper. Không duplicate 19 dòng. |
| D3 | Backward compat | `SettingsSidebar` + `SettingsLayout` đều nhận `basePath?: string` default `"/dashboard/settings"` — student surface không đổi. |
| D4 | Supporter pages | Mirror đúng `dashboard/settings/{profile,password}/page.tsx` (useSession + loading + form). Không tạo form mới. |
| D5 | UserMenu | `isSupporter = user.role === "supporter"`; `settingsHref = student ? /dashboard/settings : supporter ? /supporter/settings : null`. Wallet item giữ student-only; admin không có Cài đặt + không có wallet. |
| D6 | Server/client | `SettingsLayout` + cả 2 layout = server component (no `"use client"`). `SettingsSidebar` giữ client. Nested layout dưới `supporter/layout.tsx` (client, DashboardShell) vẫn OK. |

## Files map (ownership — mỗi file thuộc đúng 1 phase, không chồng lấn)

| File | Action | Phase |
|------|--------|-------|
| `app/dashboard/settings/_components/settings-nav.ts` | SỬA → `getSettingsNav` | 01 |
| `app/dashboard/settings/_components/SettingsSidebar.tsx` | SỬA → `basePath` prop | 01 |
| `app/dashboard/settings/_components/SettingsLayout.tsx` | MỚI (extract 19 dòng layout) | 01 |
| `app/dashboard/settings/layout.tsx` | SỬA → thin wrapper | 01 |
| `app/supporter/settings/layout.tsx` | MỚI | 02 |
| `app/supporter/settings/page.tsx` | MỚI (redirect) | 02 |
| `app/supporter/settings/profile/page.tsx` | MỚI | 02 |
| `app/supporter/settings/password/page.tsx` | MỚI | 02 |
| `components/layout/_components/UserMenu.tsx` | SỬA → supporter link | 03 |

Không đụng: `useProfileMutations.ts`, `ProfileInfoForm.tsx`, `ChangePasswordForm.tsx`, `supporter/layout.tsx`, `lib/auth-client.ts`, backend, DB.

## Phases

- [x] **Phase 01** — [Settings nav parameterization + layout extraction](./phase-01-settings-nav-parameterization.md) — 1h
- [x] **Phase 02** — [Supporter settings routes](./phase-02-supporter-settings-routes.md) — 1h
- [x] **Phase 03** — [UserMenu link + verify](./phase-03-user-menu-link-verify.md) — 1h

## Dependencies

- `260813-0000-settings-user-menu-refactor` (student settings) đã **completed** — đây là tiền đề (tái dùng form/hook của nó).
- Không blockedBy plan nào. Frontend-only, không conflict.
- Branch hiện tại = `feat/workflow-engine-refactor` (không liên quan). **Cut `feat/supporter-settings` trước khi start** để tránh lẫn commit.

## Risks (likelihood × impact)

| Risk | L×I | Mitigation |
|------|-----|-----------|
| `SETTINGS_NAV` còn consumer ẩn ngoài `SettingsSidebar` → compile break | Low × High | Đã grep toàn `apps/web-1`: chỉ 3 file (layout, settings-nav, SettingsSidebar). Phase-01 sửa đồng thời cả 3. |
| Relative import sai depth (`../../../`) → resolve fail | Med × High | Dùng đúng precedent `supporter/case/[id]` (3 cấp). Verify `check-types` bắt ngay. |
| Nested layout dưới `supporter/layout.tsx` (client + role guard) gây double shell | Med × Med | `supporter/layout.tsx` KHÔNG đụng; settings layout chỉ render SettingsLayout bên trong DashboardShell. Manual check trước khi merge. |
| UserMenu thêm nhánh làm vỡ student/admin menu | Low × Med | Giữ wallet `isStudent`-only, settings `student||supporter`; admin không đổi. Manual matrix 3 role. |
| `check-types` (turbo) chạy cả `apps/api` → cần `prisma:generate` | Med × Low | Đã có `.env` DATABASE_URL. Nếu fail ngoài web-1 scope → chạy targeted `tsc --noEmit` web-1. |
| `npm run lint` fail warning pre-existing (206 lỗi repo-wide từ plan trước) | High × Low | Chỉ chạy targeted eslint trên file đổi. Lint repo-wide KHÔNG thuộc scope — không block merge feature này. |
| Better Auth `updateUser` xong name navbar chưa refresh (đã thấy ở plan trước) | Low × Low | Form gọi `refetch` từ `useSession` (đã có sẵn). Manual verify name refresh. |

## Backwards compatibility

- `SettingsSidebar`/`SettingsLayout` default `basePath="/dashboard/settings"` → student surface không đổi.
- `getSettingsNav` thay `SETTINGS_NAV` = refactor nội bộ `_components/`, không public API.
- Không migration (không DB), không contract change (không API).
- `/dashboard/settings/*` giữ nguyên URL + hành vi.

## Test matrix

| Layer | What | Tool |
|-------|------|------|
| Type | web-1 workspace typecheck | `npm run check-types` |
| Lint | targeted eslint file đổi (0 warning) | `npx eslint <files>` |
| Unit | **Không có** — frontend không có test (Node runner chỉ ở `apps/api`) | — |
| Manual | matrix 3 role × settings flow | bảng phase-03 |

## Rollback

Git-only, revert per phase (mỗi phase 1 commit gọn):
- **Phase 01**: revert 3 sửa + xóa `SettingsLayout.tsx` → student settings về nguyên trạng (default basePath đảm bảo không vỡ giữa chừng).
- **Phase 02**: xóa 4 file `supporter/settings/*`.
- **Phase 03**: revert `UserMenu.tsx` → supporter mất link Cài đặt.
Không cascading (không shared state, không migration).

## Success criteria

- Supporter đăng nhập → UserMenu hiện "Cài đặt" → `/supporter/settings` redirect `/supporter/settings/profile` → update name + change password hoạt động (Better Auth, `revokeOtherSessions`).
- Student flow `/dashboard/settings/*` unchanged (nav, redirect, form hoạt động).
- Admin UserMenu unchanged (không Cài đặt, không wallet).
- `npm run check-types` PASS; targeted lint sạch.
- Mọi file mới/sửa ≤ 200 dòng (quy tắc AGENTS.md).

## Verification

```bash
npm run check-types          # root turbo — đảm bảo web-1 pass
npx eslint <changed files>   # targeted, 0 warning
```

Manual (bảng đầy đủ phase-03):
- Supporter: UserMenu "Cài đặt" → điều hướng → đổi tên (toast xanh) → đổi pass (2 tab, tab kia logout).
- Student: `/dashboard/settings/*` nav + form không đổi.
- Admin: menu không có Cài đặt.
- Responsive 375px sidebar ngang; 768px+ cột 240px.

## Unresolved questions

- Không có. Scope + approach đã chốt (Option A). Branch: cần cut `feat/supporter-settings` trước khi implement (hiện đang `feat/workflow-engine-refactor`).

### Resolution (final — 2026-08-14)

- Branch `feat/supporter-settings` đã cut, toàn feature merged. Không còn open question.
- Mọi risk trong bảng Risks đã mitigated: `check-types` PASS, eslint 0 warning, manual matrix 3 role pass, code review APPROVED (9/10).
- `pre-existing lint 206 lỗi repo-wide` (High×Low) nằm ngoài scope — xác nhận không block merge feature.
