# Journal: Chat message rate-limit brainstorm → plan

**Date:** 2026-08-21

**Plan:** `plans/260821-2219-chat-message-rate-limit/`

**Status:** Implemented 2026-08-22. Chưa gộp module vào usecase (user hỏi 2 file; chưa chốt).

## Context

User muốn 1s giữa hai tin để đỡ spam / đầy DB. Phân vân dual-timer web+API (RTT) và clock CPU.

## Chốt

- Dual-timer: không làm. Luật 1s chỉ API. Web không đếm 1s.
- CPU/NTP: bỏ. Cửa sổ 1s không dính.
- 1s/user **không** chống đầy DB (~86k tin/ngày). Cap ngày = sau.
- 10 người cùng lúc = hợp lệ. Limit theo người, không theo tải.
- Đua: tin 2 lúc tin 1 chưa INSERT → claim `Map` sync trước `await`.
- Web: `isSending` chặn Enter song song. Không phải rate limit.

## Plan

Phase 1: `claimMessageSendSlot` + 429 `RATE_LIMITED`.  
Phase 2: `handleSend` `|| isSending`.

## Cook

- `message-send-rate-limit.ts` + wire `sendMessageUseCase` sau check độ dài, trước `findCaseById`.
- `handleSend`: `if (!inputText.trim() || isSending) return`.
- Test claim 7/7. `tsc --noEmit` API + web pass. Review PASS, 0 critical.

## Next

User hỏi gộp file module. Changelog/commit tách API / web / docs.
