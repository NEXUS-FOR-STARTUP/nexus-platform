# Phase 1: Backend Realtime Token Guard

## Overview
- **Date:** 2026-09-18
- **Priority:** P1
- **Status:** Completed
- **Target:** `apps/api/src/modules/realtime/http/realtime.controller.ts`, `apps/api/src/shared/infrastructure/tests/phase-03-messaging.test.ts`

## Key Insights
`subscriptionTokenHandler` hiện chỉ gọi `requireCaseAccess(c, caseId)` để kiểm tra quyền thành viên case. Nó không truy vấn `caseItem.package_id`. Khi client gửi `POST /api/realtime/subscriptions/:caseId`, backend vẫn ký JWT token cho channel `chat:<caseId>` dù case là `pkg_ai_audit`.

## Requirements
1. Trong `subscriptionTokenHandler`, sau khi `requireCaseAccess` thành công:
   - Truy vấn thông tin case hoặc lấy `package_id` từ case repository (`findCaseById` từ `modules/cases/infrastructure/persistence/cases.repository.js`).
   - Nếu `caseItem?.package_id === "pkg_ai_audit"`, trả về lỗi 409 `CHAT_AI_TIER` (hoặc AppError tương tự `sendMessageUseCase`) với thông điệp: "Gói Basic AI Audit không hỗ trợ tính năng chat realtime."
2. Bổ sung unit test trong `phase-03-messaging.test.ts` để kiểm tra guard này.

## Related Code Files
- `apps/api/src/modules/realtime/http/realtime.controller.ts`
- `apps/api/src/modules/cases/infrastructure/persistence/cases.repository.ts`
- `apps/api/src/shared/infrastructure/tests/phase-03-messaging.test.ts`

## Implementation Steps
1. Import `findCaseById` từ cases repository vào `realtime.controller.ts`.
2. Kiểm tra `caseItem.package_id === "pkg_ai_audit"` trong `subscriptionTokenHandler`, trả về 409 `CHAT_AI_TIER`.
3. Viết test case trong `phase-03-messaging.test.ts`.

## Success Criteria
- Request cấp token realtime cho case có `package_id === "pkg_ai_audit"` bị từ chối với status 409 `CHAT_AI_TIER`.
- Case bình thường vẫn nhận được token hợp lệ.
