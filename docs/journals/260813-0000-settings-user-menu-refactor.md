# Settings Sidebar & User Menu Modal — Hồ sơ cá nhân

**Date**: 2026-08-13
**Status**: Completed — merged as PR #15 (commit `fbc4951`)
**Component**: apps/web-1 — settings UI + user menu (frontend-only)
**Plan**: 260813-0000-settings-user-menu-refactor (P1, effort 9h, progress 100)
**Branch**: feat/ui-profile

## What Happened

Frontend-only refactor: replaced the 8-item `Menu.Dropdown` avatar menu with a clean avatar-triggered Popover modal (info block + role-branched options + signout) and added `/dashboard/settings` with Facebook-pattern sidebar (Thông tin cơ bản / Đổi mật khẩu). Zero backend/API/DB changes. Shipped as PR #15 (`fbc4951`). Follows `docs/requirements/settings-sidebar-and-profile.md` (F07).

## Key Changes

- **UserMenu.tsx** (187 lines, self-contained: `useSession`, `useWalletBalance`, `signOut`) replaces dropdown; `DashboardShell` 200 → 60 lines.
- **`/dashboard/settings/*`** — config-driven sidebar (`settings-nav.ts`, 240px column); `/dashboard/profile` → redirect stub.
- **Profile page**: editable fields + "Lưu thay đổi"; email full read-only (`break-all`, `"—"` fallback); avatar "Đổi ảnh" → "đang phát triển" notification — no fake upload.
- **Change password**: TanStack Form + inline validation + `revokeOtherSessions: true`.
- **Removed**: fabricated username field, masked email, fake avatar preview.
- **`lib/auth-errors.ts`** — shared `translateError` (Vietnamese fallback + `rate limit` map).
- **Role-branched modal**: student → Hồ sơ/Thanh toán/Cài đặt; admin/supporter → workspace link + signout only.

## Key Risk Mitigated

Better Auth mutations do NOT throw — `useProfileMutations.ts` checks `result.error` then throws, so green/red toasts stay truthful. Used `mutate` + per-call `onSuccess` over `mutateAsync` (`handleSubmit` re-throws unwrapped errors). Dropped hand-written `FieldApi` generics (v1.33 needs 23 type args) — let TS infer.

## Verification Results

- `check-types` PASS (3/3 workspaces).
- Targeted eslint (13 files) 0 issues; repo-wide lint 206 **pre-existing** errors — deferred, out of scope.
- Code review **8.4/10 PASS**; tester **PASS**.
- Review fixes applied: focus-visible ring, `aria-current="page"`, 240px sidebar, email fallback.

## Unresolved / Open Items

- 4 manual QA items NOT run (code implemented, no dev click-through): login redirect chain, navbar session refetch after rename, 2-tab `revokeOtherSessions` logout, role-branched modal (3 roles).
- Repo-wide lint 206 pre-existing → separate task (react-hooks v6 `set-state-in-effect` first).
- Docs update pending docs-manager.
