---
phase: 1
title: Schema slim notification_preferences
status: completed
---

# Phase 01 — Schema

## Context Links

- Plan: [plan.md](./plan.md)
- Brainstorm: [reports/brainstorm.md](./reports/brainstorm.md)
- Safety: `.agents/rules/prisma-migration-safety.md`
- Model: `prisma/schema.prisma` `NotificationPreference`
- Old migration: `prisma/migrations/20260828190000_add_notification_preferences/migration.sql`

## Overview

Priority P1. Destructive DROP COLUMN. Giữ bảng. Local only.

## Key Insights

- `user_id` đã là PK = id. Không thêm uuid.
- Screenshot local đã có bảng + row. Không edit migration 20260828190000.
- Classify: **destructive**. Cook phải xác nhận host local trước khi `migrate deploy`. Supabase / unknown → stop.

## Requirements

- Model còn: `user_id`, `email_enabled`, `created_at`, `updated_at`.
- Relation User 1–1 Cascade giữ.
- Default `email_enabled true`.
- Không DROP TABLE. Không đụng `users`.

## Architecture

```text
notification_preferences
  user_id         TEXT PK FK users.id CASCADE
  email_enabled   BOOLEAN NOT NULL DEFAULT true
  created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  updated_at      TIMESTAMP(3) NOT NULL
```

DROP: `telegram_enabled`, `in_app_enabled`, `case_status_updates`, `chat_messages`, `payment_alerts`, `marketing_news`.

## Related Code Files

- Modify: `prisma/schema.prisma` (`NotificationPreference` ~701–716)
- Create: `prisma/migrations/<timestamp>_slim_notification_preferences/migration.sql`
- Keep: `20260828190000_add_notification_preferences`

## Implementation Steps

1. Classify DB: host localhost/docker = local. `supabase.co` / `pooler.supabase.com` = **blocked**. Không echo URL/password.
2. Confirm user trước khi viết SQL (safety protocol). Plan này đã chốt schema; cook vẫn nói lại DROP 6 cột rồi chờ nếu cook session khác.
3. Sửa model — xóa 6 Boolean. Giữ 4 field + relation + `@@map`.
4. SQL tay. **Không** `prisma migrate dev` full. Được `--create-only` nếu local, hoặc viết folder migration.

```sql
ALTER TABLE "notification_preferences"
  DROP COLUMN "telegram_enabled",
  DROP COLUMN "in_app_enabled",
  DROP COLUMN "case_status_updates",
  DROP COLUMN "chat_messages",
  DROP COLUMN "payment_alerts",
  DROP COLUMN "marketing_news";
```

5. `prisma generate` sau schema. Apply: human/`migrate deploy` **local only**.

## Todo List

- [x] Classify DATABASE_URL host (no secrets)
- [x] Edit `NotificationPreference` model
- [x] New migration SQL DROP 6 columns
- [x] `prisma generate`

## Success Criteria

- `schema.prisma` model đúng 4 field.
- Migration mới chỉ DROP 6 cột, không DROP TABLE.
- File 20260828190000 nguyên.

## Risk Assessment

- Prod apply nhầm → mất cột, mất data group/channel. Mitigation: refuse nếu host không local.
- Local chưa có bảng → DROP fail. Mitigation: `migrate status`; nếu v1 chưa apply, deploy v1 rồi v2.

## Security Considerations

Không lộ connection string. Không `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`.

## Next Steps

Phase 02 phụ thuộc generate client.
