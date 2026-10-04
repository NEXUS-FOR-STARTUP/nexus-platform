---
phase: 4
title: Tests email-only preference
status: completed
---

# Phase 04 — Tests

## Context Links

- Plan: [plan.md](./plan.md)
- `apps/api/src/shared/infrastructure/tests/notification-preferences.test.ts`
- `phase-08-notifications.test.ts` (nếu còn reference group/in_app gate)

## Overview

P1. node:test only `apps/api`. Không thêm test web.

## Key Insights

- v1 test 7 field + group AND channel. Viết lại hành vi mới.
- PUT `{ email_enabled: true }` **được** (v1 fail).
- Isolation: 2 user độc lập vẫn test được với 1 field.

## Requirements

Behavior tests:

1. Missing row GET → `email_enabled: true`.
2. PUT `{ email_enabled: false }` persist; GET lại false.
3. PUT unknown field / non-boolean → VALIDATION_ERROR, không upsert.
4. `allowsNotificationChannel(..., "in_app")` true dù email off.
5. `allowsNotificationChannel(..., "email")` false khi email off.
6. `allowsNotificationChannel(..., "telegram")` true.
7. handleEvent: email off → không insert outbox email; in_app vẫn insert.
8. Load prefs throw → fail-open enqueue (giữ v1).

Xóa assert `case_status_updates` / `payment_alerts` / `in_app_enabled` / reserved.

## Architecture

DI giống file hiện tại: fake `findByUserId` / `upsert` / outbox. Không đụng DB thật trong unit test.

## Related Code Files

- Modify: `notification-preferences.test.ts`
- Modify: `phase-08-notifications.test.ts` nếu còn gate group
- Không tạo file test mới trừ khi phase-08 >200 dòng và conflict.

## Implementation Steps

1. Rewrite fixture `completePreference = { email_enabled: true }`.
2. Drop tests group matrix.
3. Chạy `tsx --test` file preference (+ phase-08 nếu đụng).
4. `tsc --noEmit` api + web-1 + validation sau generate.
5. Browser smoke student: 1 switch, Lưu, reload. **Sau** migrate local. Không smoke nếu bảng chưa slim.

## Todo List

- [x] Rewrite preference tests
- [x] Fix phase-08 leftovers
- [x] Run targeted node:test
- [x] Typecheck changed workspaces

## Success Criteria

- Preference tests pass. Không còn 7-field assertion.
- Typecheck sạch 3 workspace.
- Smoke: optional, ghi rõ nếu skip vì chưa deploy migration.

## Risk Assessment

- Full `npm test` API có fail sẵn GA-21 DB auth — không lấy làm regression GA-08.

## Security Considerations

N/A tests.

## Next Steps

Ticket: Status Rework → Done khi cook xong. Journal mới. Không apply prod.
