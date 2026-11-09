# Phase 02 — AI gán nhãn (tài sản, ý tưởng)

## Context Links
- Mẫu AI đã chạy: `apps/api/src/modules/ai-engine/application/evaluate-team-fit.usecase.ts` (`generateObject` + `getGoogleModel` + `mapAIError`)
- Rate limit mẫu: `apps/api/src/modules/ai-engine/application/team-fit-rate-limit.ts`
- Prompt gốc: `temp-1/demo/server.ts` (SYSTEM + buildPrompt)
- Schemas: Phase 01 (`PreCp1InputSchema`, `ASSET_RULES`, `IDEA_RULES`)

## Overview
- **Ưu tiên:** P0 (web cần để bước "Điều bạn đang có" và "Ý nghĩ của bạn" có nhãn)
- **Trạng thái:** pending
- Một endpoint duy nhất: `POST /api/pre-cp1/label`, hai loại `assets` | `idea`. Trả nhãn + câu trích; chưa lưu gì.

## Key Insights
- AI **chỉ đọc văn bản và gán id từ allowlist**. Không cho model tự đặt id mới, không cho nó viết lời khuyên — mọi câu chữ hiển thị do code soạn.
- Thiếu AI phải **không chặn luồng**: trả `aiOk: false, labels: []`, UI mời người dùng tự tick nhãn.
- **Không fallback đoán bằng từ khoá** như demo: im lặng đoán sai tệ hơn nói "chưa đọc được".

## Requirements
- **Chức năng:** `POST /api/pre-cp1/label` (auth), body `{ kind, payload }` → `{ aiOk, labels: [{ id, quote }] }`. `assetsOther` (ô "Không có trong danh sách?") **không gửi lên đây**: nó không map được vào 16 nhãn, nên đi thẳng vào `computeZones` thành hướng "Nguồn lực bạn kể thêm".
- **Phi chức năng:** timeout 20s; nhiệt độ 0.1; tối đa 8 nhãn/lần; rate limit 20 lần/giờ/người dùng.

## Architecture
```
apps/api/src/modules/pre-cp1/
  domain/label.dto.ts              # LabelRequestSchema, LabelResult, ALLOWED_IDS
  application/label-pre-cp1.usecase.ts
  application/pre-cp1-rate-limit.ts
  http/pre-cp1.routes.ts           # POST /label (requireAuth)
```
Mount: `app.route('/api/pre-cp1', preCp1Router)` trong `apps/api/src/index.ts` (sau dòng 164).

## Related Code Files
**Tạo:** 4 file trên + `apps/api/src/shared/infrastructure/tests/pre-cp1-label.test.ts`
**Sửa:** `apps/api/src/index.ts` (1 import + 1 route)
**Tham chiếu, không sửa:** `ai-engine/*`, `services/google-provider.ts`

## Implementation Steps
1. `label.dto.ts`: `LabelRequestSchema = z.discriminatedUnion('kind', [{ kind: literal('assets'), payload: { answers: array({ id: enum(ASSET_PROMPT_IDS), text: string.max(600) }).min(1).max(5) } }, { kind: literal('idea'), payload: { pain?: string.max(600), idea?: string.max(600), madlibs?: IdeaInputSchema } }])` — nhánh Mad Libs gửi `madlibs`, server ghép 6 ô thành một câu trước khi gọi `buildPrompt` (client không phải tự ghép, để prompt không lệch).
2. `label-pre-cp1.usecase.ts`:
   - `buildPrompt(kind, payload)` — port nguyên từ `temp-1/demo/server.ts` (SYSTEM đã viết sẵn, tiếng Việt, cấm bịa).
   - `generateObject({ model: getGoogleModel(), schema: LabelOutputSchema, temperature: 0.1, abortSignal: AbortSignal.timeout(20_000) })` với `LabelOutputSchema = { ids: array({ id: string, quote: string.max(120) }).max(8) }`.
   - `filterLabels(kind, ids)` — hàm thuần: bỏ id ngoài allowlist (`ASSET_RULES` / `IDEA_RULES` id), cắt `quote` 120 ký tự, dedupe theo id. **Đây là chỗ test**.
   - Bọc try/catch: lỗi → log `{ kind, duration_ms }` + trả `{ aiOk: false, labels: [] }`, không throw 5xx cho UI.
3. `pre-cp1-rate-limit.ts`: cùng cơ chế `team-fit-rate-limit` (Map theo userId, cửa sổ trượt), 20 lần/giờ. Vượt → `AppError(429, 'PRE_CP1_RATE_LIMITED', 'Bạn đã thử nhiều lần. Thử lại sau ít phút.')`.
4. `pre-cp1.routes.ts`: `requireAuth` → `c.req.json()` → `LabelRequestSchema.safeParse` → 400 có `issues` → gọi usecase → `{ ok: true, ...result }`; lỗi khác bọc `handleError`.
5. Test (`node:test`, file riêng, chạy có timeout):
   - `filterLabels` loại id lạ, cắt quote, dedupe.
   - Prompt builder có đủ 5 câu trả lời / có `pain` + `idea`, không rò id cấm.
   - Rate limit: lần 21 → 429.

## Todo List
- [ ] dto + allowlist
- [ ] usecase + prompt + filter
- [ ] rate limiter
- [ ] route + mount
- [ ] 3 test xanh

## Success Criteria
`curl -X POST /api/pre-cp1/label` với 2 câu trả lời mẫu trả đúng id trong allowlist; tắt mạng/API key sai → `aiOk:false` và HTTP 200; test file xanh.

## Risk Assessment
- **Chi phí**: 2 lần gọi/người dùng → rate limit + `maxOutputTokens` nhỏ (đặt qua env `AI_PRE_CP1_MODEL`, mặc định dùng chung model của `AI_TEAM_FIT_MODEL`).
- **Prompt injection** trong câu trả lời tự do: SYSTEM phải nói rõ "chỉ trả JSON id", và kết quả vẫn qua allowlist ở server.
- **Model trả id tiếng Việt** → allowlist lọc sạch, không crash.

## Security Considerations
Yêu cầu đăng nhập; body giới hạn độ dài bằng Zod (chống payload lớn); không log nội dung người dùng, chỉ log `kind`/`duration_ms`/số nhãn.

## Next Steps
Phase 03 độc lập; Phase 04 cần endpoint này.
