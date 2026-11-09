# Phase 07 — Suy ra input cho AI từ form gộp (không hỏi "mảng nghề")

## Context Links
- Contract AI hiện tại: `packages/validation/src/index.ts:27-52` (`IdeaInputSchema`, `TeamMemberInputSchema`, `ROLE_TRACK_CODES`, `ROLE_TRACK_LABELS`, `MAX_TEAM_MEMBERS = 6`)
- Prompt AI: `apps/api/src/modules/ai-engine/application/evaluate-team-fit.usecase.ts` (`SYSTEM_PROMPT_FREE`, `AI_TIMEOUT_MS = 30_000`)
- Catalog nguồn: `temp-1/demo/data.js` (`NX.CAPS`, `NX.LEVELS`, `NX.MAJORS`)
- Input mới: `PreCp1Input` (Phase 01)

## Overview
- **Ưu tiên:** P0 (chặn Phase 04)
- **Trạng thái:** pending
- Người dùng chỉ khai **chuyên ngành + 9 năng lực**. AI vẫn cần `roleTrack`/`strengths`/`experience`, nên suy ra bằng một hàm thuần, có test — không bắt người dùng gõ lại, không đổi prompt.

## Key Insights
- `ROLE_TRACK_CODES` chỉ có 3 giá trị (Kỹ thuật · Marketing · Kinh doanh–Tài chính), chuyên ngành đã bao trùm → map 1-1 là đủ, không cần hỏi thêm (trừ "Ngành khác").
- `strengths` chỉ cần ≥1 chuỗi, tối đa 10 → lấy 3 năng lực mạnh nhất là đủ căn cứ cho AI, đúng tinh thần prompt ("mọi nhận định phải có dẫn chứng").
- `experience` không bắt buộc → lấy ô thêm 1 dòng của mỗi người.
- **Trần 6 người** (`MAX_TEAM_MEMBERS`) thấp hơn luồng (cho tới 8): nhóm 7-8 người thì **không gọi AI** (không cắt bớt người rồi để AI phán sai). Đi nhánh "chưa chấm được theo ngành".
- `IdeaInputSchema` có min length (problem ≥10, solution ≥10, targetCustomer ≥5, mvp ≥5) → phải validate 6 ô trước khi gọi AI, không để server trả 400 giữa luồng.

## Requirements
- **Chức năng:** từ `PreCp1Input` sinh `{ idea, team }` khớp `TeamFitInputSchema`, hoặc trả `null` khi không đủ điều kiện.
- **Phi chức năng:** hàm thuần, không IO; cùng input → cùng output; FE và BE dùng chung; ≤ 120 dòng.

## Architecture
```
packages/validation/src/pre-cp1/derive-team-fit.ts
  deriveTeamFitInput(input): { idea: IdeaInput; team: TeamMemberInput[] } | null
  ROLE_TRACK_BY_MAJOR: Partial<Record<MajorCode, RoleTrackCode>>  // 8 ngành; "Ngành khác" lấy từ roleTrackHint
  strengthsOf(member): string[]      // top 3 năng lực mức ≥2, dạng "code (làm chắc)"
```
Bảng map chuyên ngành:
| Chuyên ngành | roleTrack | Ghi chú |
|---|---|---|
| Công nghệ thông tin · Kỹ thuật phần mềm · An toàn thông tin · Trí tuệ nhân tạo | `ky_thuat` | rõ, không hỏi |
| Kinh doanh · Tài chính – Ngân hàng | `kinh_doanh_tai_chinh` | rõ, không hỏi |
| Marketing | `marketing` | rõ, không hỏi |
| Thiết kế đồ hoạ | `ky_thuat` | map cứng: công việc chính vẫn là làm ra sản phẩm hình ảnh |
| Ngành khác | theo chip người dùng chọn (bắt buộc ở UI) — `roleTrackHint` | **không tự đoán** |

`trackCoverage` đang hiển thị số người theo từng mảng trong `TeamFitReportCard.tsx:61-94` — suy sai sẽ thành số liệu bịa mà người dùng đọc được, nên chỉ chuyên ngành **không map được** mới phải hỏi thay vì gán. Chip hiện ngay dưới ô chuyên ngành, chỉ 3 lựa chọn, một lần bấm.

Điều kiện trả `null`: `ideaMode !== 'structured'`, Mad Libs thiếu ô/không đạt min length, `team.length > 6`, hoặc `team.length === 0`.

## Related Code Files
**Tạo:** `packages/validation/src/pre-cp1/derive-team-fit.ts`, `packages/validation/src/pre-cp1/__tests__/derive-team-fit.test.ts`
**Sửa:** `packages/validation/src/pre-cp1/index.ts` (export), `apps/web-1/app/dashboard/start/_hooks/useTeamFitEvaluation.ts` (chỉ gọi khi hàm trả khác null)
**Xoá:** không

## Implementation Steps
1. `derive-team-fit.ts`: hằng map + `strengthsOf` + hàm chính. `major` gửi lên AI: `majorOther` nếu có, ngược lại label chuyên ngành.
2. `strengthsOf`: lọc `caps` có mức ≥2, sắp theo mức giảm dần rồi theo thứ tự catalog (ổn định), lấy 3, chuỗi `"<nhãn ngắn> (<mức>)"`; rỗng → `["chưa rõ mạnh việc gì"]`.
3. `experience`: `extra?.trim()` có chữ → `[extra]`, không thì `[]`.
4. Test (bảng): 9 chuyên ngành (8 map cứng + "Ngành khác" kèm chip) → roleTrack đúng; **"Ngành khác" thiếu `roleTrackHint` → `PreCp1MemberSchema` fail**; 0/1/3 năng lực → strengths đúng, không rỗng; 7 người → `null`; idea nháp → `null`; Mad Libs thiếu 1 ô → `null`; `extra` trống → `experience: []`.
5. Nối vào `useTeamFitEvaluation`: gọi hàm client-side (dùng chung package) để dựng payload; server **vẫn** là nơi chấm điểm. Nếu `null` → bỏ qua bước AI, ResultView đi nhánh "chưa chấm được theo ngành".
6. Kiểm chất lượng: chạy 3 kịch bản mẫu (5 kỹ sư / nhóm cân đối / 1 mình) qua endpoint thật ở dev; đọc kết quả xem `industryRoles`/`areas` có bám vào strengths mới hay không. Nếu AI trả nhận xét rỗng hoặc lạc → ghi lại, điều chỉnh `strengthsOf` (không sửa prompt ở bước này).

## Todo List
- [ ] map chuyên ngành + `strengthsOf` + hàm chính
- [ ] test bảng 9 ngành (8 ngành map cứng + "Ngành khác" theo chip)
- [ ] nối vào hook, nhánh `null` không gọi AI
- [ ] chạy 3 kịch bản ở dev, đọc kết quả AI
- [ ] `cd packages/validation && bun run build && bun run test`

## Success Criteria
Cùng một `PreCp1Input` → cùng payload; 7 người / idea nháp → `null` (không gọi AI); payload khớp `TeamFitInputSchema` (Zod parse qua); AI ở dev trả `industryRoles` có dẫn chứng trích từ strengths, không rỗng; không hỏi thêm câu nào về mảng nghề/sở trường/kinh nghiệm trên UI.

## Risk Assessment
- **AI đọc chuỗi sinh tự động như dữ liệu thật**: `"code (làm chắc)"` là mô tả mức, không phải kinh nghiệm; nếu AI suy diễn quá (ví dụ "đã làm 2 năm") thì prompt đã cấm bịa — kiểm ở bước 6.
- **Ngành "khác" quên chọn chip** → payload sai roleTrack; UI bắt buộc chip khi chọn "Ngành khác".
- **Thiết kế đồ hoạ map cứng sang `ky_thuat`**: nếu đội toàn designer mà ý tưởng là web thì vẫn bị báo thiếu vai làm sản phẩm — cùng câu hỏi mở với `CORE_ROLES`, xem `docs/research/brainstorm-2026-11-08-pre-cp1-team-idea-flow.md` §7.

## Security Considerations
Hàm thuần ở package dùng chung; không gửi thêm dữ liệu nào ngoài thứ người dùng đã nhập; server vẫn validate payload bằng `TeamFitInputSchema` trước khi gọi AI.

## Next Steps
Nếu chất lượng AI kém vì thiếu "sở trường tự do", cân nhắc thêm 1 ô tuỳ chọn "điều bạn làm tốt nhất" (chỉ 1 dòng/người) — chưa làm bây giờ.
