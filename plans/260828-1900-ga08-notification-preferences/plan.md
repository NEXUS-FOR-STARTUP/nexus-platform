---
title: "GA-08: Notification Preferences"
description: "Cài đặt nhận thông báo cho student/supporter. Lưu 7 field ticket; runtime chỉ case/payment × in-app/email."
status: completed
priority: P1
branch: feat/gap-analysis-tasks
tags: [notification, preferences, settings, prisma]
created: 2026-08-27
updated: 2026-08-28
ticket: tasks/bugs/ga-08-notification-preferences.md
report: docs/journals/journal-2026-08-28-ga08-notification-preferences.md
supersededBy: 260828-1345-ga08-email-only-preferences
---

# Notification Preferences GA-08

## Status

Completed 2026-08-28. **Superseded** by [`plans/260828-1345-ga08-email-only-preferences/plan.md`](../260828-1345-ga08-email-only-preferences/plan.md). Báo cáo v1: [`docs/journals/journal-2026-08-28-ga08-notification-preferences.md`](../../docs/journals/journal-2026-08-28-ga08-notification-preferences.md).

## Context

Implement GA-08 for student and supporter settings. Ticket requires a `NotificationPreference` linked to `User`, three channel fields (`email_enabled`, `telegram_enabled`, `in_app_enabled`), four group fields (`case_status_updates`, `chat_messages`, `payment_alerts`, `marketing_news`), `GET`/`PUT /api/notifications/preferences`, and a Settings tab. Current runtime has real events only for case and payment; chat uses Centrifugo and marketing has no event source. Scope decision: create/store all ticket fields, but implement user-visible/runtime behavior only for `case_status_updates`, `payment_alerts`, `in_app_enabled`, and `email_enabled`; do not implement Telegram, chat, or marketing delivery behavior.

## Approach

- [x] 1. Preference contract: 7 snake_case fields; active = case/payment × in-app/email; reserved = telegram/chat/marketing default true, no dispatch
- [x] 2. Prisma model `NotificationPreference` 1–1 User, additive migration SQL, no backfill
- [x] 3. Shared Zod + `GET`/`PUT /api/notifications/preferences` scoped to session user
- [x] 4. Gate `handleEvent` before outbox; missing row = all true; queued rows unchanged
- [x] 5. Settings tab student + supporter; 4 switches; manual Save; reserved forced true
- [x] 6. Behavior tests (defaults, isolation, invalid PUT, group/channel, queued row)

## Phases

| Phase | Trọng tâm | Status |
|---|---|---|
| Schema | Model + additive migration | Completed |
| API | Validation, GET/PUT, listener gate | Completed |
| UI | Nav, hook, form, student/supporter pages | Completed |
| Tests | Preference + phase-08 | Completed 26/26 |
| Review | code-reviewer 7/10, 0 critical; vá 2 HIGH | Completed |

## Non-goals

- Telegram / chat / marketing delivery
- Cancel queued outbox on preference change
- Apply migration to local/prod in this task

## Open

- Apply `20260828190000_add_notification_preferences` via `prisma migrate deploy`
- Browser smoke after table exists
