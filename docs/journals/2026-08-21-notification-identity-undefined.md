# Journal: Notification identity + undefined case code

**Date:** 2026-08-21

**Plan:** `local://notification-identity-undefined-plan.md`

**Status:** Done. Phase-08 15/15 PASS. `tsc --noEmit` apps/api PASS.

## Bug

`CASE_APPROVED` emit chỉ `{ caseId }`. Template `case.approved` đọc `payload.caseCode` → persist + email `Case undefined`. Cùng lỗ trên `CASE_REJECTED` (reject + veto). Telegram assignment thiếu tên supporter dù event đã có `supporterName`.

## Fix

1. `accept-case` / `reject-case` / `veto-case`: `findCaseById` trước `executeTransition`, 404 `Không tìm thấy case`, emit `caseCode: caseItem.case_code`. HTTP `{ stage, status }` không đổi.
2. `notification-templates.ts`: `payloadText(payload, key, fallback)` — trim string rỗng → `chưa xác định`. Dùng cho `caseCode`, `supporterName`, `reason`, `query`, stage keys.
3. `case.assigned` supporterBody: `Case ${code} được giao cho bạn. Supporter phụ trách: ${name}.` Student body giữ câu cũ, cũng guard name.

## Verify

- `npx tsx --test src/shared/infrastructure/tests/phase-08-notifications.test.ts` — 15/15, gồm identity + missing-`caseCode` fallback.
- `npx tsc --noEmit` trong `apps/api` — sạch.
- Full `npm test --workspace apps/api` vẫn fail sẵn (DB auth, test không liên quan). Không phải regression của fix này.

## Note

Outbox cũ đã persist `Case undefined` không re-render. Chỉ event mới sạch.
