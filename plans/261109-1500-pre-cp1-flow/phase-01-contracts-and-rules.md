# Phase 01 — Hợp đồng dữ liệu + luật cố định

## Context Links
- Demo nguồn: `temp-1/demo/data.js` (catalog), `temp-1/demo/engine.js` (luật)
- Brainstorm: `docs/research/brainstorm-2026-11-08-pre-cp1-team-idea-flow.md`
- Mẫu đã có: `packages/validation/src/catalogs/`, `packages/validation/src/index.ts`

## Overview
- **Ưu tiên:** P0 (chặn mọi phase sau)
- **Trạng thái:** pending
- Đưa toàn bộ catalog + 5 hàm luật từ demo vào `@repo/validation` để FE và BE dùng chung một nguồn. Không gọi AI, không đụng DB.

## Key Insights
- Demo đã có 9 trục năng lực (mức 1..3), 4 mức ngân sách, 8 nhóm network, 16 luật tài sản, 10 luật ý tưởng, 3 vai cột lõi, trần 6 người / sàn 4 người / ≥ 2 chuyên ngành.
- **Chuyên ngành = 9 mục** (`NX.MAJORS`): CNTT, Kỹ thuật phần mềm, An toàn thông tin, Trí tuệ nhân tạo, Kinh doanh, Tài chính – Ngân hàng, Marketing, Thiết kế đồ hoạ, Ngành khác. Không có "Ngôn ngữ Anh" — danh sách đi theo ngành đào tạo của trường, thiếu thì chọn "Ngành khác".
- **Map ngành → mảng nghề** (`TRACK_BY_MAJOR`): 4 ngành CNTT → `ky_thuat`, Kinh doanh + Tài chính → `kinh_doanh_tai_chinh`, Marketing → `marketing`, Thiết kế đồ hoạ → `ky_thuat`; chỉ `ASKED_MAJORS = ['Ngành khác']` phải hỏi chip.
- `team-fit` dùng `ROLE_TRACK_CODES` (3 mảng nghề) và `TeamMemberInputSchema` — **không dùng lại được** cho luồng này (khác cách đo).
- Luật phải **thuần** (không `Date`, không `Math.random`, không IO) để test được và để server tính lại y như FE.

## Requirements
- **Chức năng:** `computeCoverage`, `computeFlags`, `computeRecruit`, `computeZones`, `verdict`, `teamRule` — cùng chữ ký với `NX.eng` trong demo.
- **Phi chức năng:** cây `packages/validation` build ESM + `dist`, không import `zod` ngoài package; mỗi hàm < 60 dòng.

## Architecture
```
packages/validation/src/pre-cp1/
  catalog.ts   # CAPS(9), LEVELS(1..3), BUDGETS, NET_OPTIONS(8), ASSET_RULES(16),
               # IDEA_RULES(10), CORE_ROLES(3), TEAM_RULES, ASSET_PROMPTS(5),
               # INTERVIEW_QUESTIONS(5), SENSITIVE_TOPICS
  schemas.ts   # PreCp1InputSchema, PreCp1ReportSchema, PreCp1SavedResultSchema
  rules.ts     # 5 hàm luật thuần + COVER_LEVEL = 2
  index.ts     # re-export
```
`src/index.ts` re-export `./pre-cp1/index.js`.

## Related Code Files
**Tạo:** `packages/validation/src/pre-cp1/{catalog,schemas,rules,index}.ts`, `packages/validation/src/__tests__/pre-cp1-rules.test.ts`
**Sửa:** `packages/validation/src/index.ts` (thêm 1 dòng export)
**Xoá:** không

## Implementation Steps
1. `catalog.ts`: copy nguyên `NX.MAJORS`, `NX.TRACKS`, `NX.TRACK_BY_MAJOR`, `NX.ASKED_MAJORS`, `NX.TRACK_WORK`, `NX.CAPS`, `NX.LEVELS`, `NX.BUDGETS`, `NX.NET_OPTIONS`, `NX.ASSET_RULES`, `NX.IDEA_RULES`, `NX.CORE_ROLES`, `NX.TEAM_RULES`, `NX.ASSET_PROMPTS`, `NX.INTERVIEW_QS` từ demo; đặt tên `as const` và type suy ra (`CapCode`, `IdeaRuleId`, …). Giữ nguyên id tiếng Anh để dữ liệu cũ/mới không lệch.
2. `schemas.ts`:
   - `PreCp1MemberSchema`: `{ name?: string.max(40), major: enum(MAJOR_LABELS), majorOther?: string.max(60), roleTrackHint?: enum(ROLE_TRACK_CODES), caps: z.partialRecord(z.enum(CAP_CODES), z.union([z.literal(1), z.literal(2), z.literal(3)])), unsure: boolean, extra?: string.max(200) }` — `roleTrackHint` **bắt buộc chỉ khi** `major = "Ngành khác"` (refine); 8 ngành còn lại đi qua `TRACK_BY_MAJOR` (Thiết kế đồ hoạ → `ky_thuat`), vì `trackCoverage` hiện công khai số người theo mảng và UI không hỏi "mảng nghề" riêng.
   - `PreCp1InputSchema`: `{ school, course, goal: 'pass'|'real'|'unsure', budget: enum(BUDGET_CODES), team: min(1).max(50), assets: z.partialRecord(enum(ASSET_PROMPT_IDS), z.string().max(600)), assetsNone: array(enum(ASSET_PROMPT_IDS)), network: array(enum(NET_IDS)).max(9), networkOther?: string.max(200), ideaMode: enum(['none','draft','structured']), pain?: string.max(600), idea?: string.max(600), madlibs?: IdeaInputSchema, sensitive: array(enum(SENSITIVE_IDS)), assetTags: z.partialRecord(enum(ASSET_RULE_IDS), z.enum(['yes','no'])), ideaTags: z.partialRecord(enum(IDEA_RULE_IDS), z.enum(['yes','no'])) }` — trần theo **trường**: **refine `school === FPT` → `team ≤ TEAM_RULES.sizeMax` = 6** (kèm ≥2 chuyên ngành nếu môn là EXE101); **trường khác không giới hạn số người** — `max(50)` chỉ là chặn kỹ thuật của API, không phải luật sản phẩm, ghi rõ trong comment.
   - Hai dạng ý tưởng dùng lại schema có sẵn: `IdeaInputSchema` (`packages/validation/src/index.ts:27`) cho Mad Libs, `pain`/`idea` (text ≤600) cho nháp. Luật đọc cả hai: có `madlibs` thì ghép `problem + solution` làm câu để gán nhãn/cờ. `ideaMode` là nguồn duy nhất quyết định nhánh.
   - `aiResult?: unknown` và `aiLabels?: LabelQuote[]` **không** nằm trong input: cả hai là tham số riêng của `POST /save` (Phase 03). Input chỉ chứa câu trả lời người dùng, nên `input_hash` không đổi chỉ vì AI gán nhãn khác đi.
   - `LabelQuote = { id, quote: string.max(120) }` — nhãn AI thô, **chỉ để hiển thị lại**, không vào luật.
   - `PreCp1ReportSchema`: `{ version: literal(1), teamRule, coverage: { roles[], empty[], single[], overload[], want, need, room, capped }, flags: array(5), verdict: { level, title, detail }, recruit: array, zones: array }`
3. `rules.ts`: port 1-1 từ `engine.js` — `teamRule`, `teamStats`, `computeCoverage`, `computeFlags` (5 trục Năng lực / Tiền / Thời gian / Luật / Gặp khách), `verdict`, `computeZones`, `computeRecruit`. **Giữ nguyên** ngưỡng đang chạy trong demo để phase 4 không lệch kết quả; ghi chú "ngưỡng giả thuyết" bằng comment thường.
   - Nguồn duy nhất cho tài sản/ý tưởng là nhãn đã xác nhận: `confirmedAssetIds(input) = assetTags[id] === 'yes'`, `confirmedKinds(input)` tương tự với `ideaTags`.
   - **Không port `hit()`/đường đoán từ khoá** của demo: prod không đoán ngầm. Nhờ vậy FE (xem trước) và BE (tính lại lúc lưu) đọc đúng một nguồn và không thể lệch nhau.
   - `aiLabels` không được truyền vào bất kỳ hàm luật nào và **không** vào `input_hash`/`input_snapshot`; nó chỉ được ghi vào cột `ai_labels` lúc lưu (Phase 03).
4. Test: dựng 12 ca cố định và so với giá trị chụp từ demo:
   - 5 kỹ sư phần mềm (cap trần 6 → need 1, phát hiện 2 vai trống)
   - 1 người, môn khác (không có mục "giữ tới hết môn")
   - 4 người đủ 3 vai (không cần tuyển)
   - 1 người gánh cả 3 vai (overload)
   - 2 người cùng gánh build+money (không overload)
   - đội chỉ có người viết (reach trống → cần talker)
   - ý tưởng "pin hạt nhân mini" (cờ Luật = blocked)
   - ý tưởng B2B bệnh viện (cờ Gặp khách = hard)
   - nhãn tài sản: cùng một câu "mẹ mở quán cà phê", tick `yes` → cờ Năng lực tính quán; tick `no` → không tính; `assetTags` rỗng → không suy ra từ chữ (chốt hành vi trái với demo)
   - schema: `major: "Ngành khác"` thiếu `roleTrackHint` → parse fail; `major: "Thiết kế đồ hoạ"` không cần chip → parse pass và map ra `ky_thuat`
   - schema trần nhóm: trường FPT + 7 người → parse fail; trường khác + 12 người → parse pass (không giới hạn); FPT + 1 người (chỉ mình) → parse pass
5. Export ở `src/index.ts`, chạy build + test.

## Todo List
- [ ] `catalog.ts` xong, id khớp demo 100%
- [ ] `schemas.ts` parse được state demo hiện tại (chạy thử 6 preset)
- [ ] `rules.ts` 7 hàm + comment nguồn ngưỡng
- [ ] 12 ca test xanh
- [ ] `src/index.ts` export
- [ ] `npx tsc --noEmit` sạch

## Success Criteria
`cd packages/validation && bun run build && bun run test` xanh; 12 ca cho ra đúng `empty/single/overload/need/capped` và đúng 5 cờ như demo.

## Risk Assessment
- **Lệch hành vi so với demo** khi port tay → test dùng chính số liệu chụp từ demo làm kỳ vọng.
- Catalog phình to trong `validation` (vốn là schemas) → chấp nhận: đã có tiền lệ `catalogs/`.

## Security Considerations
Không có IO, không secret. Input schema là hàng rào duy nhất cho phase 2/3.

## Next Steps
Phase 02 (AI nhãn) và Phase 03 (DB/lưu) có thể chạy song song sau khi phase này xanh.
