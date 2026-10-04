# Journal — 2026-08-08: Realtime chat plan với Centrifugo

## Tóm tắt

Lập plan chi tiết cho realtime chat (Centrifugo v6) thay polling 5s hiện tại. Hard mode: research → red team → validation → hydrate tasks. Không đổi Prisma schema — không migration.

## Quyết định

- Transport: Centrifugo v6 (Docker `centrifugo/centrifugo:v6`), server-side publish, DB vẫn source of truth
- Auth: connect token JWT + subscription token per channel (cả 2 exp 15m), gate qua requireCaseAccess
- Wire: publish trực tiếp trong `send-message.usecase` (KHÔNG qua event-bus — notification-listener auto-register mọi DOMAIN_EVENTS sẽ lọt vào pipeline)
- Deploy: ngoài scope thực thi — checklist để sẵn phase 5
- Access revocation: chấp nhận window 15m

## Red team — lỗi bắt được (đáng giá nhất)

| Severity | Lỗi | Fix |
|---|---|---|
| CRITICAL | `centrifuge@^6.x` không tồn tại — SDK 5.7.0 (server v6 ≠ SDK major) | `^5.7.0` |
| CRITICAL | `newSubscription` remount (StrictMode/nav) → DuplicateSubscriptionException | cleanup `removeSubscription` + `getSubscription` guard |
| CRITICAL | Phase 5 build web chỉ thêm build-arg mới, MẤT `NEXT_PUBLIC_API_URL` → prod web chết im lặng | Giữ cả 2 args |
| HIGH | Dev origin https://localhost:3001 sai — web dev là http | `http://localhost:3001` |
| HIGH | Dev container secret `dev-secret` ≠ .env → token sign lệch | Single source từ .env |
| HIGH | next.config không có rewrite → fetch token relative 404 dev | Base `NEXT_PUBLIC_API_URL` |
| MEDIUM | Payload nguyên User row (leak email) + Centrifugo history lưu 600s | Sanitize projection |
| MEDIUM | Env đọc lúc module load → test set env sau import fail | Đọc per-call |
| MEDIUM | Subscribe getToken throw Error → SDK retry vô hạn | `UnauthorizedError` (401/403) |
| MEDIUM | Logout/đổi tk — socket gắn sub cũ → mọi sub mới bị từ chối | Session-change disconnect |
| LOW | security-headers middleware phụ thuộc container api labels | Chấp nhận + note |
| LOW | `depends_on: db` thừa (centrifugo không dùng DB) | Bỏ |

## Files tạo

`plans/260808-1030-realtime-chat-centrifugo/` — plan.md + 5 phase files + docs/research/centrifugo-realtime-chat-2026-08-08.md

## Next

Implement theo phase 1→5 (tasks đã hydrate). Run `/clear` rồi `/ck:cook E:\FPT\Semester_7\EXE101\product-workspace\nexus-platform\plans\260808-1030-realtime-chat-centrifugo\plan.md`
