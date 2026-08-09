# Journal: Notification System (in-app + Email + Telegram)

**Date:** 2026-08-07

**Commit:** `3f07bd5` (feat, 55 files, +3723/−6), `8b2a5d9` (docs sync)

**Status:** Completed — tests 16/16, check-types 3/3, review 2 pass. Chưa deploy VPS.

## What Changed

Hệ thống notification 3 kênh (in-app / Resend email / Telegram grammY) cho Nexus Platform.

**Event bus:** `shared/domain/domain-events.ts` + `shared/infrastructure/event-bus.ts` (queueMicrotask), 9 domain events. 11 emit points gắn vào usecases — emit sau commit, trước return, KHÔNG emit khi no_op.

**Pipeline:**
- `notification-listener`: resolveRecipients (role + skip-actor), channel mapping → ghi `notification_outbox`
- Outbox rows: unique `(event_id, channel, recipient)`, `processing_at` reclaim, `provider_message_id` anchor idempotency, `recipient_type`
- `notification-relay`: poll 2s, claim bằng `FOR UPDATE SKIP LOCKED`, backoff 2s→8s→32s→2m→10m, max 5 attempts, purge 30d
- Channels: in_app insert + SSE ping / Resend email (`Idempotency-Key = outbox.id`) / Telegram

**SSE hub:** in-process singleton, cap 5 conn/user, heartbeat 25s, `retry: 5000`.

**Frontend:** `NotificationBell` (Mantine Menu) + `useNotifications` hook (TanStack Query + EventSource `withCredentials`), mount trong `DashboardShell` cả 3 roles.

**DB:** migration `20260807040000_add_notifications` (+2 models: `Notification`, `NotificationOutbox`) — đã áp dụng local Docker DB (DATABASE_URL=localhost; DIRECT_URL vẫn trỏ Supabase pooler, chưa đụng).

## Key Decisions

1. **Outbox pattern** thay vì gửi trực tiếp trong usecase — tách transaction ghi dữ liệu khỏi side-effect gửi email/Telegram; `provider_message_id` là anchor idempotency chống double-send khi relay retry.
2. **Email budget cut**: chỉ `stage_changed` + `auto-verified` gửi email; các event còn lại chỉ in_app. Lý do: chi phí Resend, email dễ thành spam — tiết kiệm từ review pass 1.
3. **Skip-actor**: người thực hiện hành động không nhận notification của chính mình (resolveRecipients).
4. Kênh Telegram/Resend optional — không init khi thiếu key, không crash.

## Bugs Caught in Review

**Pass 1 (CRITICAL ×2, HIGH ×1):**
- **Templates-key mismatch (CRITICAL)**: 8/9 event render ra raw type string (dot vs underscore) — template lookup sai key → user thấy text kiểu `idea.stage_changed`. Fix + regression test.
- **SSE hub Set.delete leak (CRITICAL)**: client disconnect không xóa khỏi Set → conn leak, heartbeat gửi vào socket chết.
- **Claim race (HIGH)**: relay có thể claim cùng outbox 2 lần — fix bằng SKIP LOCKED.

**Pass 2 (H1 ×2, M1, M2):**
- `update-case-status` emit khi internal status change (H1) — fix gate.
- Listener partial-failure cascade (H2) — fix để không nuốt toàn bộ pipeline.
- Unread-count SSE invalidation (M1).
- `close-case` thiếu `isFinalCaseStage` gate (M2).

## Verification

- `phase-08-notifications.test.ts`: **16/16 pass** (real local DB)
- Root `check-types`: 3/3 workspace pass
- 19 test failures pre-existing — xác nhận KHÔNG do feature này (git stash run trên HEAD: thiếu Cloudinary creds / DB state local)
- Migration đã áp dụng local, chưa chạy migrate deploy

## Deploy Checklist (VPS)

- [ ] 6 env vars optional mới vào `.env.prod` (Resend, Telegram, SSE origin…)
- [ ] `docker build --no-cache` (schema change — cache cũ giữ Prisma client cũ)
- [ ] `prisma migrate deploy` TRƯỚC `up -d`
- [ ] Verify SSE: không bị gzip nén (Traefik stream labels), CORS PATCH preflight OK
- [ ] Sau khi lên: kiểm tra relay log không có retry vô hạn, outbox không tích lũy

## Unresolved

- Chưa deploy VPS — checklist trên chưa thực thi.
- Email budget cut cần theo dõi sau deploy: nếu tỉ lệ open thấp, xem lại whitelist event.
