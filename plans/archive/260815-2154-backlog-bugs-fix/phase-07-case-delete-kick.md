# Phase 07 — Case Delete Kick (#16)

- Priority: P0 | Status: Done | Effort: 2h
- Depends: Phase 03 | Blocks: —

## Overview

Khi admin xóa case → push tín hiệu realtime `case_deleted` vào kênh `chat:{caseId}` → user/supporter bị kick (toast + redirect). Fallback poll 404.

## Requirements

- `delete-case.usecase.ts` sau `deleteCase` → `publishToChannel(chatChannel(caseId), { type: 'case_deleted', caseId })`.
- FE `useRealtimeChat.ts` publication handler thêm nhánh `case_deleted` (toast "Hồ sơ đã bị xóa" + redirect `/dashboard` + invalidate queries).
- Fallback: poll `useCaseDetails` nhận 404 → redirect (WS sub chỉ mount khi mở tab discussion).
- Không thêm notification riêng (toast đủ); supporter xem case bị xóa bị kick cùng cơ chế.

## Architecture

- Reuse `publishToChannel` (`centrifugo.service.ts:5`) + `chatChannel` (`realtime.types.ts:5`) — không thêm kênh mới. Pattern publish: `send-message.usecase.ts:72`.
- `delete-case.usecase.ts:35-38` hook sau `deleteCase`.
- FE handler `useRealtimeChat.ts:40-49` (hiện chỉ xử lý `type:"message"`) → thêm branch.
- WS sub chỉ mount ở `TabDiscussionChat.tsx:103` → poll fallback `useCaseDetails.ts:31` (10s) 404 → redirect; error block `case/[id]/page.tsx:66-74` + supporter `:64-72`.

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/cases/application/delete-case.usecase.ts` (35-38) | SỬA: publish case_deleted sau deleteCase |
| `apps/api/src/modules/realtime/centrifugo.service.ts` (5) | VERIFY: publishToChannel |
| `apps/api/src/modules/realtime/realtime.types.ts` (5) | VERIFY: chatChannel |
| `apps/web-1/app/dashboard/case/[id]/hooks/useRealtimeChat.ts` (40-49) | SỬA: +case_deleted branch (toast + redirect + invalidate) |
| `apps/web-1/app/dashboard/case/[id]/hooks/useCaseDetails.ts` (31) | SỬA: poll 404 → redirect fallback |
| `apps/web-1/app/dashboard/case/[id]/page.tsx` (66-74) | VERIFY: error block redirect |
| `apps/web-1/app/supporter/case/[id]/page.tsx` (64-72) | VERIFY: error block redirect |

## Implementation Steps

1. `delete-case.usecase.ts`: sau deleteCase → publishToChannel(chatChannel(caseId), {type:'case_deleted', caseId}).
2. `useRealtimeChat.ts`: thêm branch case_deleted → toast + redirect /dashboard + invalidate query.
3. `useCaseDetails.ts`: poll 404 → redirect fallback.
4. `npm run check-types`.

## Todo List

- [x] delete-case: publish case_deleted
- [x] useRealtimeChat: case_deleted branch
- [x] useCaseDetails: 404 fallback redirect
- [x] `npm run check-types` PASS
- [ ] Manual: admin xóa case → user/supporter mở case bị kick (toast + redirect); không mở tab chat vẫn bị kick qua poll 404

## Success Criteria

- Xóa case → user + supporter bị kick (realtime, không cần reload).
- Fallback poll 404 → redirect (kể cả WS không mount).
- Không thêm kênh/notification mới.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Publish sau delete → kênh đã mất subscriber | Thấp | Thấp | Publish ngay sau delete; poll fallback bảo hiểm |
| Redirect loop khi case thật sự còn nhưng lỗi mạng | Thấp | Trung bình | Chỉ redirect khi 404 (không phải lỗi 5xx) |

## Next Steps

→ Phase 08: tests + docs sync.
