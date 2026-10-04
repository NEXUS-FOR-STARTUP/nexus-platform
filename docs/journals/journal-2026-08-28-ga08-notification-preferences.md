# Journal: GA-08 Notification Preferences

**Date:** 2026-08-28
**Status:** Done
**Priority:** P1
**Ticket:** `tasks/bugs/ga-08-notification-preferences.md`
**Plan:** `plans/260828-1900-ga08-notification-preferences/`
**Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md` P1#4

---

## 1. Plan đã duyệt (tóm tắt)

Ticket bắt 7 field (`email_enabled`, `telegram_enabled`, `in_app_enabled`, `case_status_updates`, `chat_messages`, `payment_alerts`, `marketing_news`), `GET`/`PUT /api/notifications/preferences`, tab Settings.

Runtime hiện chỉ có event case + payment. Chat đi Centrifugo. Marketing không có nguồn event.

**Quyết định scope:** lưu đủ 7 field. Behavior thật chỉ 4 field: `case_status_updates`, `payment_alerts`, `in_app_enabled`, `email_enabled`. Telegram / chat / marketing reserved — default `true`, không UI, không lọc dispatch.

Group và channel độc lập: gửi khi cả group lẫn channel đều bật. Thiếu row = tất cả `true`. Không backfill. Lọc trước `insertOutboxRow`. Outbox đã enqueue không đụng.

---

## 2. Đã giao vs plan

| Plan | Kết quả |
|---|---|
| Model `NotificationPreference`, `user_id` PK, 7 boolean default true, `User` 1–1 Cascade | Đúng. `@@map("notification_preferences")` |
| Migration additive, không `migrate dev` full / reset / `db push` | File `prisma/migrations/20260828190000_add_notification_preferences/migration.sql`. **Chưa apply** |
| Shared Zod trong `packages/validation` | `NotificationPreferenceSchema` strict 7 field; GET thêm `active_fields` / `reserved_fields` |
| `GET`/`PUT /api/notifications/preferences`, scope `c.get("user").id` | `notifications.routes.ts` |
| Gate `handleEvent` sau resolve/channels, trước outbox | `preference-policy.ts` + `loadPreferences` |
| UI 4 switch, manual Save, reserved luôn `true` | Student + supporter Settings |
| Test DI: default, isolation, PUT invalid, group/channel, queued row | `notification-preferences.test.ts` 9/9 + phase-08 15/15 |

Map event (giữ nguyên plan):

- `case_status_updates`: `case.assigned`, `case.approved`, `case.rejected`, `case.stage_changed`, `report.published`, `request_more_info`
- `payment_alerts`: `payment.proof_uploaded`, `payment.verified`, `payment.rejected`, `deposit.verified`, `deposit.rejected`, `order.paid`, `order.refunded`, `wallet.balance_changed`

---

## 3. Lệch plan / vá sau review

- Test nằm file mới `notification-preferences.test.ts` (phase-08 đã >200 dòng), cùng DI style.
- Migration viết SQL tay, không chạy `prisma migrate dev --create-only` (tránh Prisma CLI đụng DB).
- Reviewer 7/10, 0 critical. Vá 2 HIGH:
  1. Save lỗi giữ draft (bỏ `save.isPending` khỏi sync effect).
  2. `loadPreferences` throw → fail-open, vẫn enqueue + log.
- Overlay `Can't resolve './ua-parser.js'` **không phải GA-08** — re-export sẵn, Turbopack, chuỗi sessions.

---

## 4. File

| Layer | Path |
|---|---|
| Schema | `prisma/schema.prisma` |
| Migration | `prisma/migrations/20260828190000_add_notification_preferences/migration.sql` |
| Validation | `packages/validation/src/index.ts` |
| Policy | `apps/api/src/modules/notifications/application/preference-policy.ts` |
| Usecase | `apps/api/src/modules/notifications/application/notification-preferences.usecase.ts` |
| Listener | `apps/api/src/modules/notifications/application/notification-listener.ts` |
| Repo | `apps/api/src/modules/notifications/infrastructure/persistence/notification-preference.repository.ts` |
| HTTP | `notifications.controller.ts`, `notifications.routes.ts` |
| Test | `apps/api/src/shared/infrastructure/tests/notification-preferences.test.ts` |
| Nav | `apps/web-1/app/dashboard/settings/_components/settings-nav.ts` |
| Hook | `apps/web-1/app/dashboard/settings/hooks/useNotificationPreferences.ts` |
| UI | `.../notifications/_components/NotificationPreferencesForm.tsx` |
| Pages | `/dashboard/settings/notifications`, `/supporter/settings/notifications` |

---

## 5. Verification

- API tests: **26 pass / 0 fail** (9 preference + 15 phase-08).
- `tsc --noEmit`: sạch `apps/api`, `apps/web-1`, `packages/validation` sau `prisma generate`.
- Browser smoke student/supporter: **chưa chạy** (cần migrate apply + session).
- Full `npm test` API: fail sẵn vì DB auth (GA-21), không regression GA-08.

---

## 6. Chưa làm / follow-up

1. Apply migration local/prod: `npx prisma migrate deploy` — **không** `migrate dev` full, reset, `db push`.
2. Browser smoke sau khi bảng tồn tại.
3. Telegram / chat / marketing: chỉ khi có nguồn event riêng.
4. Hủy outbox đã enqueue: ngoài scope; cần identity trên outbox + re-check relay.
