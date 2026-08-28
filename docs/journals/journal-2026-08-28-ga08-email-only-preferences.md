---
title: "GA-08 v2 email-only preferences"
date: 2026-08-28
status: done
ticket: tasks/bugs/ga-08-notification-preferences.md
plan: plans/260828-1345-ga08-email-only-preferences/
---

# Journal: GA-08 v2 email-only preferences

**Date:** 2026-08-28
**Status:** Done
**Priority:** P1
**Ticket:** `tasks/bugs/ga-08-notification-preferences.md`
**Plan:** `plans/260828-1345-ga08-email-only-preferences/`
**v1:** `docs/journals/journal-2026-08-28-ga08-notification-preferences.md`

---

## 1. Context

v1 Done sáng 2026-08-28: 7 cột, 4 switch, in-app tắt được. User đập group / in-app / telegram khỏi GA-08.

Cook `--auto` plan `260828-1345-ga08-email-only-preferences`. Không DROP TABLE — DROP 6 cột. Giữ `notification_preferences`.

---

## 2. Đã giao vs plan

| Plan | Kết quả |
|---|---|
| DROP 6 cột; giữ `user_id` PK, `email_enabled`, `created_at`, `updated_at` | Đúng. Model 4 field. Relation User 1–1 Cascade |
| Migration SQL tay; không đụng `20260828190000` | `prisma/migrations/20260828210000_slim_notification_preferences/migration.sql`. File v1 nguyên |
| Local `migrate deploy`; prod không apply | Local applied (`localhost:5432` `nexus_db`). Prod **chưa** |
| Policy: in-app luôn; email theo flag; telegram ungated | `preference-policy.ts` |
| GET/PUT `{ email_enabled }`. Missing row = true. Extra keys 400 `.strict()` | Zod slim. Client cũ 7 key → 400 cố ý |
| Student 1 switch email + Lưu | `/dashboard/settings/notifications` |
| Xóa tab supporter | Page supporter deleted. Nav ẩn `/notifications` khi `basePath` starts with `/supporter` |
| Test preference 9 + phase-08 15 | **26/26** |

---

## 3. Verification

- API tests: **26 pass / 0 fail** (preference 9 inner + phase-08 15).
- `tsc --noEmit`: sạch `packages/validation`, `apps/api`, `apps/web-1` sau next typegen. Xóa stale `.next/dev/types/validator.ts`.
- Review: **9.6/10**, 0 critical, auto-approve.
- Browser smoke: **skipped** (không session).

---

## 4. File

| Layer | Path |
|---|---|
| Schema | `prisma/schema.prisma` |
| Migration v1 (untouched) | `prisma/migrations/20260828190000_add_notification_preferences/migration.sql` |
| Migration v2 | `prisma/migrations/20260828210000_slim_notification_preferences/migration.sql` |
| Validation | `packages/validation/src/index.ts` |
| Policy | `apps/api/src/modules/notifications/application/preference-policy.ts` |
| Test | `apps/api/src/shared/infrastructure/tests/notification-preferences.test.ts` |
| Form | `apps/web-1/app/dashboard/settings/notifications/_components/NotificationPreferencesForm.tsx` |
| Nav | `apps/web-1/app/dashboard/settings/_components/settings-nav.ts` |
| Deleted | `apps/web-1/app/supporter/settings/notifications/page.tsx` |

---

## 5. Follow-up

1. Prod `npx prisma migrate deploy` — human. Không `migrate dev` full / reset / `db push`.
2. Browser smoke student: 1 switch, Lưu, reload.
3. Telegram UI / cột / cúp kênh: later, ngoài GA-08.
