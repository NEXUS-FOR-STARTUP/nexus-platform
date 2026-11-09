# Phase 06 — Điền sẵn phần trùng lặp (dùng lại cơ chế sync sẵn có)

## Context Links
- Cơ chế đã có: `packages/validation/src/catalogs/sync-rules.ts` (`SYNC_RULES`, `SyncSource`, `buildSyncProposals`)
- Nơi dựng nguồn dữ liệu: `apps/api/src/modules/guided-documents/application/get-sync-proposals.usecase.ts`
- Test sẵn có: `packages/validation/src/__tests__/sync-rules.test.ts`
- Dữ liệu nguồn: `pre_cp1_reports.input_snapshot` (Phase 03)

## Overview
- **Ưu tiên:** P1
- **Trạng thái:** pending
- Không viết cơ chế điền mới. Thêm **một loại nguồn** vào `SYNC_RULES` để kết quả sơ bộ pre-CP1 điền sẵn câu trả lời CP1 — cùng đường mà `Case.team_name` và báo cáo team-fit đang đi.

## Key Insights
- Sync hiện đọc 3 nguồn: `Case.team_name`, `team_fit_reports` (idea + team), `project_answers` đã lưu. Nguyên tắc ghi trong file: **chỉ dữ liệu đã lưu trên server**, không đọc nháp trình duyệt. Bản đồ pre-CP1 lưu trên server (Phase 03) nên đủ điều kiện làm nguồn thứ 4.
- Không đẩy dữ liệu sang team-fit được, vì `TeamMemberInputSchema` (`packages/validation/src/index.ts:38-52`) **không có trường tên**, `strengths` bắt buộc ≥1, và trần `MAX_TEAM_MEMBERS = 6` trong khi pre-CP1 cho tới 8. Tên/ngành/mức năng lực chỉ nằm trong `input_snapshot` của report; muốn dùng cho team-fit thì phải có chế độ chạy trên case đã có (follow-up) và đọc từ report, không ghi vào `CaseMember` (bảng đó cần `auth_user_id` thật).
- Sync chỉ **đề xuất** (`SyncProposal`), không ghi đè; câu nào đã có trả lời thì bỏ qua và đếm vào `skipped_filled`. Nên điền sẵn không phá dữ liệu người đã viết.
- **Cái gì điền được, cái gì không** (đọc đúng shape `TeamMemberInputSchema`):

| Dữ liệu pre-CP1 | Đích | Điền được? |
|---|---|---|
| Tên từng người + mức năng lực | `cp1_team_members` (text) | Có — nối chuỗi giống `kind: 'team'` đang làm |
| Số người / số ngành | `cp1_team_members` | Có (nằm trong cùng chuỗi) |
| Pain ("điều làm bạn bực mình") | `cp1_main_problem` | Có |
| Ý tưởng 1-2 câu | `cp1_solution_description` | Có (là bản nháp, đội tự viết lại) |
| Trường / mã môn | `CreateProjectModal` lúc tạo dự án | Có (điền sẵn ô, Phase 04) |
| 9 trục năng lực | `TeamMemberInputSchema.strengths/experience` | **Không** — thiếu `roleTrack`, `strengths` khác dạng; nhét vào là bịa |
| Ngân sách, người quen, tài sản | — | Không có nơi nhận; nằm trong `input_snapshot` cho training |

## Requirements
- **Chức năng:** mở template CP1 trong một case có kết quả sơ bộ → các câu trùng được đề xuất điền; câu đã trả lời vẫn giữ.
- **Phi chức năng:** thêm 1 query trong `Promise.all` sẵn có; không thêm endpoint; không thêm migration.

## Architecture
```ts
// sync-rules.ts
export type SyncSource =
  | { kind: "project_name" } | { kind: "idea"; field: IdeaField }
  | { kind: "team" } | { kind: "answer"; question_id: string }
  | { kind: "pre_cp1_team" } | { kind: "pre_cp1_pain" } | { kind: "pre_cp1_idea" };

// SyncSources thêm
preCp1: { team: string; pain: string; idea: string } | null;

// SYNC_RULES.cp1 — nguồn cũ giữ nguyên thứ tự, pre-CP1 đứng cuối (ưu tiên thấp nhất)
{ target: "cp1_team_members",   from: [{ kind: "team" }, { kind: "pre_cp1_team" }] },
{ target: "cp1_main_problem",   from: [idea("problem"), { kind: "pre_cp1_pain" }] },
{ target: "cp1_solution_description", from: [idea("solution"), { kind: "pre_cp1_idea" }] },
```
`pre_cp1_team` dựng chuỗi kiểu: `Nguyễn A — CNTT — code (Làm chắc), design (Làm được)`, mỗi người một dòng; người "chưa rõ" ghi `Nguyễn B — chưa rõ làm được gì`.

## Related Code Files
**Sửa:** `packages/validation/src/catalogs/sync-rules.ts` (type + `read` + 3 rule), `packages/validation/src/__tests__/sync-rules.test.ts`, `apps/api/src/modules/guided-documents/application/get-sync-proposals.usecase.ts` (1 query + `toPreCp1()`)
**Tạo:** không
**Xoá:** không

## Implementation Steps
1. `sync-rules.ts`: thêm 3 `kind` + field `preCp1` vào `SyncSources`; trong hàm dựng proposal (`read`) xử lý 3 kind mới; thêm 3 rule vào `SYNC_RULES.cp1` ở cuối danh sách nguồn.
2. `get-sync-proposals.usecase.ts`: thêm `prisma.preCp1Report.findFirst({ where: { case_id: caseId }, orderBy: { created_at: 'desc' }, select: { input_snapshot: true } })` vào `Promise.all`; `toPreCp1(snapshot)` đọc `team[]`, `pain`, `idea` từ snapshot, chịu được null/thiếu field (`asText` sẵn có).
3. Test trong `sync-rules.test.ts`: (a) chỉ có pre-CP1 → 3 câu được đề xuất; (b) có cả báo cáo team-fit → team-fit thắng, pre-CP1 không chen vào; (c) `cp1_team_members` đã có trả lời → `skipped_filled` tăng, không ghi đè; (d) snapshot thiếu `team` → không crash, chỉ 2 đề xuất.
4. Kiểm tay: tạo case từ kết quả sơ bộ → mở template CP1 → thấy câu điền sẵn, sửa được, lưu được.

## Todo List
- [ ] 3 kind + `SyncSources.preCp1` + read
- [ ] 3 rule vào `SYNC_RULES.cp1`
- [ ] query + `toPreCp1` trong usecase
- [ ] 4 test xanh (`cd packages/validation && bun run build && bun run test`)
- [ ] `npx tsc --noEmit` ở `packages/validation` + `apps/api`
- [ ] kiểm tay trên 1 case thật ở dev

## Success Criteria
Case tạo từ kết quả sơ bộ → template CP1 có `cp1_team_members`, `cp1_main_problem`, `cp1_solution_description` điền sẵn đúng nội dung trong kết quả sơ bộ; case có báo cáo team-fit thì nội dung team-fit thắng; câu đã trả lời không bị ghi đè.

## Risk Assessment
- **Nội dung rác**: `idea` 1-2 câu đổ vào `cp1_solution_description` (câu hỏi có thể cần chi tiết hơn) → chấp nhận vì sync là *đề xuất* và đội phải sửa; ghi rõ trong UI "điền sẵn từ kết quả sơ bộ, sửa lại cho đúng".
- **Thứ tự ưu tiên sai**: pre-CP1 đứng trước team-fit sẽ đè mất dữ liệu AI đã đọc kỹ hơn → luôn để cuối.
- **Nhiều kết quả sơ bộ trong một case** → chỉ đọc bản mới nhất (`created_at desc`).

## Security Considerations
Không thêm endpoint; dữ liệu chỉ đi từ case của chính người dùng sang template của chính case đó. Không log nội dung.

## Next Steps
Sau khi chạy thật: nếu thấy `cp1_team_members` điền sẵn hay bị xoá sửa, cân nhắc thêm `pre_cp1` cho `cp1_primary_customer` (cần thêm câu hỏi "khách hàng mục tiêu" vào pre-CP1 — đừng thêm bây giờ).
