---
title: "GA-08 v2: email-only preferences"
description: "Giữ bảng notification_preferences. Xóa 6 cột. Còn user_id, email_enabled, created_at, updated_at. Student 1 switch email. In-app luôn. Telegram ngoài scope."
status: completed
priority: P1
branch: feat/gap-analysis-tasks
tags: [notification, preferences, settings, prisma]
created: 2026-08-28
ticket: tasks/bugs/ga-08-notification-preferences.md
brainstorm: plans/260828-1345-ga08-email-only-preferences/reports/brainstorm.md
supersedes:
  - 260828-1900-ga08-notification-preferences
  - 260828-1057-ga08-pref-ui-grouping
blockedBy: []
blocks: []
---

# GA-08 v2: email-only

## Status

Completed 2026-08-28. Local migrate deploy applied. Prod not applied.

## Context

v1: 7 boolean, 4 switch, in-app tắt được, group AND channel. Cột telegram/chat/marketing chết. v2 đập group + in-app + telegram khỏi GA-08. **Không xóa bảng** — xóa cột thừa.

## Approach

1. DROP 6 cột. Giữ `user_id` PK, `email_enabled`, `created_at`, `updated_at`.
2. Policy: in-app luôn. email theo flag. telegram không đụng.
3. `GET`/`PUT /api/notifications/preferences` chỉ `{ email_enabled }`.
4. Student Settings: 1 switch Email + Lưu. Xóa tab supporter.
5. SQL tay. Apply local `migrate deploy`. Không `migrate dev` full / reset / `db push`. Không DROP trên Supabase.

## Phases

| Phase | File | Status |
|---|---|---|
| 1 Schema | [phase-01-schema.md](./phase-01-schema.md) | completed |
| 2 API + policy | [phase-02-api-policy.md](./phase-02-api-policy.md) | completed |
| 3 UI | [phase-03-ui.md](./phase-03-ui.md) | completed |
| 4 Tests | [phase-04-tests.md](./phase-04-tests.md) | completed |

## Non-goals

- Telegram UI, cột, hoặc cúp fan-out
- Tắt in-app
- Group case / chat / payment / marketing
- Admin settings
- Hủy outbox đã enqueue
- Apply migration prod

## Cook

```text
/ck:cook --auto D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/plans/260828-1345-ga08-email-only-preferences/plan.md
```
