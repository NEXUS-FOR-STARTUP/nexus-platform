# Phase 3 — Backend: publish service + wire send-message

- Priority: P1 | Status: Completed | Effort: 2.5h
- Depends: Phase 1 (env `CENTRIFUGO_URL`, `CENTRIFUGO_API_KEY`), Phase 2 (module realtime, `chatChannel`)

> **Sync-back 2026-08-08:** Done — khớp plan 100%, check-types PASS (bao gồm `response.body?.cancel()` ở error path + `toPublishMessage` sanitize sender). Smoke publish chưa chạy (chưa có Centrifugo container — gom vào phase 5 E2E).

## Overview

Centrifugo publish service (HTTP API `/api/publish`) + wire vào `send-message.usecase.ts`: sau `createCaseMessage` commit, fire-and-forget publish `{type:"message", message}` lên channel `chat:{caseId}`.

**Quyết định kiến trúc**: KHÔNG dùng event-bus. Lý do: `registerNotificationListener` loop qua `Object.values(DOMAIN_EVENTS)` — thêm `case.message_sent` vào domain-events sẽ tự đăng ký handler notification pipeline cho từng tin nhắn (recipients/templates không có mapping cho type này → hành vi không kiểm soát). Gọi trực tiếp publish service trong usecase — KISS, khớp pragmatism hiện tại (usecase đã gọi repo/credit trực tiếp).

## Key Insights

- Centrifugo HTTP API publish: `POST {CENTRIFUGO_URL}/api/publish` body `{"channel": "...", "data": {...}}`, header `X-API-Key`
- Publish SAU commit, TRƯỚC return (khớp pattern notification plan: post-commit, pre-return)
- Fire-and-forget: fail KHÔNG fail request chính. Tin đã lưu DB; client fallback refetch 60s tự bù
- Timeout ngắn (3s) — Centrifugo down không kéo request
- **Env đọc TẠI LÚC GỌI** (không đọc lúc module load) — test set process.env sau import vẫn hoạt động; runtime cũng linh hoạt hơn
- **Payload sanitize**: KHÔNG publish nguyên object `createCaseMessage` (có `sender` = full User row — email, username...). Projection gọn: field hiển thị + `sender: {id, name, role, image}`. Ít data trên wire + Centrifugo history 600s + privacy
- **Access revocation window**: member bị xóa khỏi case vẫn nhận publication tối đa 15m (subscription token TTL; authz chỉ check lúc subscribe). Chấp nhận + document — kèm fallback: bị xóa quyền → token hết hạn → SDK refresh thất bại → tự unsubscribe

## Files

| File | Action | Nội dung |
|---|---|---|
| `apps/api/src/modules/realtime/infrastructure/centrifugo.service.ts` | MỚI | `publishToChannel(channel, data)` |
| `apps/api/src/modules/cases/application/send-message.usecase.ts` | SỬA | publish sau `createCaseMessage` |

## Implementation Steps

### 1. centrifugo.service.ts
```typescript
import logger from "../../../shared/infrastructure/logger.js";

const PUBLISH_TIMEOUT_MS = 3000;

export async function publishToChannel(channel: string, data: unknown): Promise<boolean> {
  const url = process.env.CENTRIFUGO_URL || "http://localhost:8010";
  const apiKey = process.env.CENTRIFUGO_API_KEY || "";
  if (!apiKey) {
    logger.warn({ channel }, "CENTRIFUGO_API_KEY missing — skip publish");
    return false;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PUBLISH_TIMEOUT_MS);
    const response = await fetch(`${url}/api/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ channel, data }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      logger.error({ channel, status: response.status }, "centrifugo publish non-200");
      return false;
    }
    return true;
  } catch (error) {
    logger.error({ channel, err: error }, "centrifugo publish failed");
    return false;
  }
}
```

- Env đọc trong hàm (per-call) — test chạy sau khi set process.env OK
- Node 24 có `fetch` global — không cần dep
- NEVER throw — usecase không biết Centrifugo tồn tại

### 2. send-message.usecase.ts — thêm publish
Vị trí: sau `const result = await createCaseMessage(...)`, trước `return result`. KHÔNG `await` (fire-and-forget):

```typescript
import { publishToChannel } from "../../realtime/infrastructure/centrifugo.service.js";
import { chatChannel } from "../../realtime/domain/realtime.types.js";

  const result = await createCaseMessage({
    caseId,
    userId,
    userRole,
    content: trimmedContent,
  });

  void publishToChannel(chatChannel(caseId), { type: "message", message: toPublishMessage(result) }).catch((e) => {
    logger.error({ caseId, err: e }, "chat publish unexpected failure");
  });

  return result;
```

Helper sanitize (trong cùng file hoặc realtime module — field tối thiểu, không leak User row):
```typescript
function toPublishMessage(msg: any) {
  return {
    id: msg.id,
    case_id: msg.case_id,
    sender_auth_user_id: msg.sender_auth_user_id,
    sender_role_snapshot: msg.sender_role_snapshot ?? null,
    content: msg.content,
    created_at: msg.created_at,
    sender: msg.sender
      ? { id: msg.sender.id, name: msg.sender.name, role: msg.sender.role, image: msg.sender.image ?? null }
      : null,
  };
}
```

`void` + catch đúp an toàn (publishToChannel đã catch, catch ngoài phòng async throw bất ngờ).

Payload contract (phải khớp client phase 4 — client dùng `message.id` + `message.content` + `message.created_at` + `message.sender`):
```json
{
  "type": "message",
  "message": {
    "id": "...", "case_id": "...", "sender_auth_user_id": "...",
    "sender_role_snapshot": "...", "content": "...", "created_at": "...",
    "sender": { "id": "...", "name": "...", "role": "...", "image": null }
  }
}
```

## Todo List

- [x] centrifugo.service.ts (publishToChannel, timeout 3s, never throw)
- [x] send-message.usecase.ts wire publish post-commit
- [ ] Smoke: gửi tin qua REST → log publish success + subscriber nhận (dùng wscat hoặc centrifuge-js snippet)

## Success Criteria

- Gửi tin REST 201 + log `centrifugo publish` thành công (level debug/info)
- Subscriber (wscat với token) nhận payload đúng shape
- Centrifugo down → gửi tin VẪN 201, DB có tin, log error, không 5xx
- `npm run check-types --workspace=apps/api` pass

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Publish chậm kéo request | AbortController 3s + không await trong usecase |
| API key thiếu → publish skip | Log warning — feature degrade, không crash |
| Publish race với client mount | Client refetch initial khi mount → tin cũ bù |
| Double publish (nếu refactor sau này gọi 2 lần) | Publish ở đúng 1 điểm: usecase. Ghi chú trong code comment ngắn |

## Security Considerations

- `X-API-Key` chỉ nằm server-side — không lộ ra client
- Publish data = object DB trả về (không có field nhạy cảm mới)
- Channel name từ caseId đã qua requireCaseAccess ở controller — không inject channel tùy ý

## Next Steps

→ Phase 4 (frontend) consume payload contract này + token endpoints phase 2
