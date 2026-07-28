# Backend Demo Path Realignment

**Date:** 2026-06-29
**Plan:** `260629-1722-mvp-demo-realignment-backend` — MVP demo realignment backend
**Status:** Never executed (orphaned)
**Parent:** `260629-1722-mvp-demo-realignment` (superseded)

## What Happened

Backend-only child plan của MVP demo realignment parent. Mục tiêu: stabilise demo-critical backend contracts — route contracts, status transitions, role gates, messaging, reports, packages. 4 phases, tất cả pending, không bao giờ có execution session.

## The Brutal Truth

Plan này died on the vine. Không ai chạy, không có implementation session nào được ghi nhận. Lý do: các thay đổi mà plan định làm đã được thực hiện scattered qua frontend realignment plan hoặc bị replace bởi architecture decisions mới hơn (vd: package seed-on-read behavior giữ nguyên từ đầu, không cần plan riêng).

## Key Decisions (đã chốt trong plan)

| Decision | Detail |
|----------|--------|
| Report publish authority | Chỉ Reports module được publish report. Không cho phép messaging hay case module bypass. |
| Attachment/reference semantics | Metadata-only — không lưu file blob trong DB, chỉ link/reference. Upload và storage là infrastructure layer riêng. |
| Package seed-on-read | Giữ nguyên behavior: không seed package khi tạo, chỉ seed khi đọc lần đầu. Prevents duplicate seeding trên concurrent request. |
| Idempotent no-op | Repeated commands (duplicate assign, duplicate status transition) là no-op, không throw error. Đảm bảo idempotency trên retry. |

## Why Not Implemented

- **Phân tán implementation:** Backend contract changes (status machine, role gates) được thực hiện rải rác trong các fix plan và refactor nhỏ hơn, không thông qua plan này.
- **Architecture drift:** Kiến trúc sau này (supporter/admin module tách biệt, event-based decoupling) khiến một số decision trong plan trở nên outdated hoặc không còn applicable.
- **No owner assigned:** Không có assignee, không có deadline. Plan chỉ tồn tại như reference document.

## Impact

Dù không bao giờ được execute, các architectural decisions từ plan này vẫn ảnh hưởng đến codebase hiện tại:

- **Report publish ownership** vẫn thuộc Reports module — không module nào khác bypass được.
- **Package behavior** vẫn giữ seed-on-read semantic.
- **Idempotent pattern** được áp dụng ở nhiều nơi (status transitions, message delivery).
- **Attachment semantics** không bao giờ chuyển sang blob storage — metadata-only là chuẩn hiện tại.

## Lessons Learned

- Plans cần owner và execution window rõ ràng. Nếu không ai chạy, nó không phải plan — nó là draft.
- Backend contract decisions nên được implement ngay khi chốt, không để pending chờ executor.
- Scattered implementation không thông qua plan dẫn đến decisions không được trace, khó audit sau này.
- Nếu plan không được schedule trong 48h sau khi approve, khả năng nó không bao giờ được chạy là rất cao.

## Next Steps

- Archive plan. Các decisions còn valid đã được absorbed vào codebase qua con đường khác.
- Không cần resurrect — những gì cần làm đã được làm (không qua plan này, nhưng đã làm).
- Dùng lessons này cho plan workflow sau: require owner + execution window + auto-cancel nếu quá hạn.
