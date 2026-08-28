---
phase: 2
title: API + policy email-only
status: completed
---

# Phase 02 — API + policy

## Context Links

- Plan: [plan.md](./plan.md)
- Validation: `packages/validation/src/index.ts` ~452–506
- Policy: `apps/api/src/modules/notifications/application/preference-policy.ts`
- Listener: `notification-listener.ts`
- Usecase: `notification-preferences.usecase.ts`
- Repo: `notification-preference.repository.ts`
- HTTP: `notifications.routes.ts` GET/PUT `/preferences`

## Overview

P1. Contract breaking PUT. Cùng PR với web-1.

## Key Insights

- v1 PUT reject `{ email_enabled: true }` (thiếu 6 field). v2 đó là payload đúng.
- `.strict()` giữ — client cũ gửi 7 key → 400. Cố ý.
- Telegram `return true` giữ. Không cúp kênh.
- Missing row = `email_enabled: true`.

## Requirements

- Schema Zod: chỉ `email_enabled: z.boolean()`.
- Xóa `NOTIFICATION_PREFERENCE_ACTIVE_FIELDS`, `RESERVED_FIELDS`, `toNotificationPreferenceResponse` extra fields.
- `DEFAULT_NOTIFICATION_PREFERENCES = { email_enabled: true }`.
- `allowsNotificationChannel`: in_app always true; email đọc flag; telegram true; xóa group maps.
- GET/PUT path giữ. Session user only.
- Repo select/upsert chỉ `email_enabled` (+ user_id/timestamps nội bộ).

## Architecture

```text
handleEvent
  → load prefs (email_enabled)
  → allowsNotificationChannel
       telegram → true
       in_app   → true
       email    → preference.email_enabled
  → insertOutboxRow nếu true
```

## Related Code Files

- Modify: `packages/validation/src/index.ts`
- Modify: `preference-policy.ts` (gút group + in_app)
- Modify: `notification-preference.repository.ts`
- Modify: `notification-preferences.usecase.ts`
- Modify: `notification-listener.ts` (snapshot type)
- Modify: controller nếu map `active_fields`
- Keep routes.

## Implementation Steps

1. Zod slim + default 1 field. Xóa active/reserved helpers.
2. Policy: xóa `CASE_STATUS_EVENTS`, `PAYMENT_ALERT_EVENTS`, `eventGroupFor`. Snapshot = `{ email_enabled }`.
3. Repo `select` / `toPreference` 1 boolean.
4. Usecase parse `UpdateNotificationPreferenceSchema` 1 field.
5. Listener fallback `ALL_ENABLED_PREFERENCE = { email_enabled: true }`.
6. Web types re-export từ `@repo/validation` — theo file `apps/web-1/types/notification.ts`.

## Todo List

- [x] Slim Zod + defaults
- [x] Gut policy
- [x] Slim repo + usecase + listener
- [x] Drop active/reserved trên GET response

## Success Criteria

- PUT `{ email_enabled: false }` 200, persist.
- PUT extra key 400, không upsert.
- `email_enabled: false` → không outbox email. in_app + telegram vẫn enqueue như `channelsFor`.

## Risk Assessment

- Quên gút listener → compile fail vì type 7 field.
- Fail-open load prefs: giữ (throw → vẫn enqueue + log).

## Security Considerations

requireAuth. Không sửa user khác. Không role-gate (supporter hit API vô hại — họ không có email channel).

## Next Steps

Phase 03 UI cùng contract.
