# Phase 4 — Frontend: centrifuge-js + hook + Dockerfile ARG

- Priority: P1 | Status: Completed | Effort: 3h
- Depends: Phase 2 (token endpoints), Phase 1 (NEXT_PUBLIC_CENTRIFUGO_URL)

> **Sync-back 2026-08-08:** Done — centrifuge 5.7.0, singleton client, useRealtimeChat (dedupe id + sort created_at + cleanup), refetch 5s→60s, TabDiscussionChat +2 dòng, Dockerfile ARG + build guide. check-types PASS, lint sạch. Deviation: session-change guard đặt ở `DashboardShell.tsx` (ngoài ownership list — justify: disconnect khi session user id đổi). Todo "verify fetch token base" chưa confirm runtime — chờ E2E phase 5.

## Overview

Web-1 nhận realtime: dep `centrifuge`, singleton client, hook `useRealtimeChat(caseId)`, wire vào `TabDiscussionChat`, bỏ poll 5s (fallback 60s). Sửa Dockerfile để in NEXT_PUBLIC_CENTRIFUGO_URL lúc build.

## Key Insights

- **Dockerfile trap**: web image chỉ pass `NEXT_PUBLIC_API_URL` làm ARG. NEXT_PUBLIC_* inline tại build time → thiếu ARG = URL rỗng runtime. Phải thêm ARG+ENV + update build guide
- **SDK version**: server v6 ≠ SDK major. `centrifuge` npm latest = **5.7.0** (`^5.7.0`). API dùng: `newSubscription(channel, {getToken})` — giống nhau v5/v6
- **Không có next rewrite**: `next.config.ts` rỗng (chỉ standalone output) → fetch token phải dùng base `NEXT_PUBLIC_API_URL` (giống apiClient), KHÔNG dùng relative `/api/...` (dev web :3001 vs API :8000 = 404)
- **Duplicate subscription crash**: StrictMode double-effect + tab switch + case→case nav → `newSubscription(sameChannel)` lần 2 ném DuplicateSubscriptionException. Cleanup phải `client.removeSubscription(sub)` + mount guard `getSubscription()`
- Singleton client (module-level) — 1 WebSocket per tab, không 1 per component
- `getToken` callback: SDK tự refresh trước khi exp → gọi lại endpoint mỗi lần (15m)
- Subscription `getToken`: 401/403 phải throw `UnauthorizedError` (SDK export) — throw Error thường → SDK retry vô hạn → outsider hammer subscribe-token endpoint
- **Logout/đổi tài khoản**: connection token sub cũ ≠ session mới → Centrifugo từ chối mọi subscription mới. Phải disconnect + recreate client khi session đổi
- Dedupe theo `message.id` — publish + refetch có thể trùng
- Bỏ `refetchInterval: 5000` → 60s (fallback phòng WebSocket chết lặng)
- TabDiscussionChat giữ nguyên UI — chỉ thêm 1 dòng hook

## Files

| File | Action | Nội dung |
|---|---|---|
| `apps/web-1/package.json` | SỬA | + `"centrifuge": "^5.7.0"` |
| `apps/web-1/lib/realtime/centrifuge-client.ts` | MỚI | singleton + subscribe/unsubscribe helpers |
| `apps/web-1/app/dashboard/case/[id]/hooks/useRealtimeChat.ts` | MỚI | hook: subscribe → append cache |
| `apps/web-1/app/dashboard/case/[id]/hooks/useCaseChat.ts` | SỬA | poll 5s → 60s fallback |
| `apps/web-1/app/dashboard/case/[id]/_components/TabDiscussionChat.tsx` | SỬA | + `useRealtimeChat(caseId)` |
| `apps/web-1/Dockerfile` | SỬA | + ARG/ENV NEXT_PUBLIC_CENTRIFUGO_URL |
| `docs/docker-build-push-guide.md` | SỬA | build command + `--build-arg NEXT_PUBLIC_CENTRIFUGO_URL` |

## Implementation Steps

### 1. Cài dep
```bash
npm install centrifuge --workspace=nexus-platform-web-1   # ^5.7.0 — server v6 ≠ SDK major
```

### 2. lib/realtime/centrifuge-client.ts
```typescript
import { Centrifuge } from "centrifuge";

let client: Centrifuge | null = null;
let currentUserId: string | null = null;

const CENTRIFUGO_URL =
  process.env.NEXT_PUBLIC_CENTRIFUGO_URL || "ws://localhost:8010/connection/websocket";

const TOKEN_API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function getCentrifugeClient(): Centrifuge {
  if (client) return client;
  client = new Centrifuge(CENTRIFUGO_URL, {
    getToken: async () => {
      const res = await fetch(`${TOKEN_API_BASE}/api/realtime/connection-token`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Không lấy được token kết nối");
      return (await res.json()).token;
    },
  });
  client.connect();
  return client;
}

export function disconnectCentrifugeClient() {
  client?.disconnect();
  client = null;
}
```

- `TOKEN_API_BASE` = NEXT_PUBLIC_API_URL (prod cùng origin qua Traefik → rỗng/hay không cần; dev :3001→:8000 phải có base). **Verify lúc implement**: apiClient dùng base gì thì dùng đúng base đó
- `credentials: "include"` — cookie Better Auth
- `disconnectCentrifugeClient()` — gọi khi session user id đổi (logout/login khác tài khoản): connection token sub cũ vô hiệu với session mới

### 3. hooks/useRealtimeChat.ts
```typescript
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Centrifuge, UnauthorizedError } from "centrifuge";
import { getCentrifugeClient } from "@/lib/realtime/centrifuge-client";
import type { CaseMessage } from "@/types";

const TOKEN_API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function useRealtimeChat(caseId: string) {
  const queryClient = useQueryClient();
  const subRef = useRef<ReturnType<Centrifuge["newSubscription"]> | null>(null);

  useEffect(() => {
    if (!caseId) return;
    const client = getCentrifugeClient();
    const channel = `chat:${caseId}`;

    // Guard mount: StrictMode double-effect + tab switch không crash duplicate
    const existing = client.getSubscription(channel);
    if (existing) {
      subRef.current = existing;
      return;
    }

    const sub = client.newSubscription(channel, {
      getToken: async () => {
        const res = await fetch(
          `${TOKEN_API_BASE}/api/realtime/cases/${encodeURIComponent(caseId)}/subscribe-token`,
          { credentials: "include" },
        );
        if (res.status === 401 || res.status === 403) {
          throw new UnauthorizedError("Không có quyền theo dõi hội thoại"); // chống retry vô hạn
        }
        if (!res.ok) throw new Error("Lỗi lấy token subscription");
        return (await res.json()).token;
      },
    });

    sub.on("publication", (ctx) => {
      const data = ctx.data as { type?: string; message?: CaseMessage };
      if (data?.type !== "message" || !data.message?.id) return;
      queryClient.setQueryData<CaseMessage[]>(["case-messages", caseId], (old = []) => {
        if (old.some((m) => m.id === data.message!.id)) return old;
        return [...old, data.message!];
      });
    });

    sub.subscribe();
    subRef.current = sub;
    return () => {
      sub.removeAllListeners();
      sub.unsubscribe();
      client.removeSubscription(sub); // xóa khỏi registry — remount không duplicate crash
      subRef.current = null;
    };
  }, [caseId, queryClient]);
}
```

- Cleanup: unsubscribe + removeAllListeners + **removeSubscription** (bắt buộc — không là StrictMode/nav chuyển case crash DuplicateSubscriptionException)
- Dedupe theo id — refetch/backfill không trùng tin

### 4. useCaseChat.ts — giảm poll
```typescript
refetchInterval: 60_000, // Fallback an toàn — realtime chính qua WebSocket (useRealtimeChat)
```

### 5. TabDiscussionChat.tsx
Thêm 1 dòng sau `useCaseChat(caseId)`:
```tsx
useRealtimeChat(caseId);
```
Không đổi UI khác.

### 5b. Logout/đổi tài khoản — disconnect socket
Thêm effect nhỏ (đặt trong `DashboardShell` hoặc cùng nơi dùng `useSession` để redirect):
```tsx
const { data: session } = useSession();
const prevUserId = useRef<string | null>(null);
useEffect(() => {
  const uid = session?.user?.id ?? null;
  if (prevUserId.current && prevUserId.current !== uid) {
    disconnectCentrifugeClient(); // sub cũ gắn user cũ — phải reconnect
  }
  prevUserId.current = uid;
}, [session?.user?.id]);
```
Không có → login tài khoản khác trong cùng tab: mọi subscription mới bị Centrifugo từ chối (sub token ≠ connection sub) tới khi hết hạn 15m.

### 6. Dockerfile (SỬA — chống trap)
Sau dòng `ARG NEXT_PUBLIC_API_URL`:
```dockerfile
ARG NEXT_PUBLIC_CENTRIFUGO_URL
ENV NEXT_PUBLIC_CENTRIFUGO_URL=$NEXT_PUBLIC_CENTRIFUGO_URL
```

### 7. docs/docker-build-push-guide.md
Cập nhật lệnh build web thêm:
```bash
--build-arg NEXT_PUBLIC_CENTRIFUGO_URL="wss://${DOMAIN}/connection/websocket"
```

## Todo List

- [x] centrifuge ^5.7.0 cài vào web-1
- [x] lib/realtime/centrifuge-client.ts singleton + disconnect helper
- [x] hooks/useRealtimeChat.ts (dedupe + cleanup + getSubscription guard + removeSubscription + UnauthorizedError)
- [x] useCaseChat.ts poll 5s → 60s
- [x] TabDiscussionChat.tsx gọi hook
- [x] Session-change disconnect (step 5b)
- [x] Dockerfile ARG + build guide update
- [ ] Verify fetch token base (NEXT_PUBLIC_API_URL — next.config không có rewrite)

## Success Criteria

- 2 tab cùng case: tab A gửi → tab B nhận <1s (không refresh, không F5)
- Rời trang → subscription cleanup (DevTools Network: không publication còn tới)
- Reconnect: tắt mạng 10s bật lại → tin gửi trong lúc mất được catch-up (recovery)
- Refetch 60s vẫn chạy (fallback), không double message (dedupe)
- `npm run lint` web 0 warning; `npm run check-types` web pass

## Risk Assessment

| Risk | Mitigation |
|---|---|
| NEXT_PUBLIC_CENTRIFUGO_URL rỗng prod | Dockerfile ARG (step 6) + verify build log chứa URL |
| Cookie không tới token endpoints (khác origin) | credentials include + verify base URL (step 3 note) |
| Publication spam sau cleanup | unsubscribe + removeAllListeners |
| SDK version API khác | centrifuge v6 SDK — `newSubscription(channel, {getToken})` pattern chuẩn docs |
| Window focus refetch trùng tin | Dedupe id |

## Security Considerations

- Token fetch có credentials — cookie-only, không lộ secret
- Không log token
- Channel name do server tạo (`chat:{caseId}`) — client không tự chọn channel string tùy ý (subscribe-token endpoint gate access)## Next Steps

→ Phase 5 (tests + verify + deploy)
