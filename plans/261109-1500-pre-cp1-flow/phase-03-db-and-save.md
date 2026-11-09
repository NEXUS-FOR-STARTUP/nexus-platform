# Phase 03 — Lưu kết quả vào dự án (DB + API)

## Context Links
- Mẫu usecase có DI: `apps/api/src/modules/ai-engine/application/save-team-fit.usecase.ts`
- Mẫu bảng: `prisma/schema.prisma` → `TeamFitReport` (dòng 655)
- Tạo dự án sẵn có: `apps/web-1/app/dashboard/_components/CreateProjectModal.tsx` (tên dự án, trường, mã môn, số nhóm, liên hệ)
- Migration an toàn: `.agents/rules/prisma-migration-safety.md`, `docs/db-migration-guide.md`

## Overview
- **Ưu tiên:** P0
- **Trạng thái:** pending
- Thêm 1 bảng, 1 endpoint (`POST /save`). **Chỉ lưu khi đã có dự án**: mỗi bản ghi bắt buộc thuộc một Case, nên pre-CP1 · team-fit · dịch vụ trả phí cùng nằm trong một chỗ.

## Key Insights
- **Không lưu vô tội vạ**: `case_id` là `NOT NULL`. Người đi hết luồng rồi bỏ đi thì không có bản ghi nào — đổi lại dữ liệu lưu được đều gắn với dự án thật, dùng được cho training + supporter.
- Việc tạo Case **không viết lại**: dùng lại `CreateProjectModal` (đã có sẵn ở dashboard, cũng là cửa của `?create=1`). pre-CP1 chỉ truyền giá trị điền sẵn (`project_name`, `school`, `course_context`) rồi để modal tạo case như mọi cửa khác.
- Client **không bao giờ** gửi report: server nhận `PreCp1Input` (đã gồm `assetTags`/`ideaTags`) và tự chạy Phase 01 rules. `aiLabels` là field **riêng của body**, ghi vào cột `ai_labels` để hiển thị lại câu trích — không nằm trong `input`, không vào `input_hash`, không tham gia luật.
- Nhiều lần chạy trong cùng một dự án là dữ liệu tốt (người dùng sửa câu trả lời); chống trùng bằng `(case_id, input_hash)`, không chặn lần chạy khác nội dung.

## Requirements
- **Chức năng:** lưu 1 lần chạy = 1 row thuộc 1 case; lưu lại y nguyên input trong cùng case → trả row cũ (`isNew:false`); đọc bản mới nhất của case.
- **Phi chức năng:** 1 transaction; kiểm quyền case 1 query; không log nội dung người dùng.

## Architecture
```prisma
model PreCp1Report {
  id              String   @id @default(cuid())
  case_id         String
  auth_user_id    String
  input_hash      String
  input_snapshot  Json
  ai_labels       Json?
  report_snapshot Json
  created_at      DateTime @default(now())

  case Case @relation(fields: [case_id], references: [id], onDelete: Cascade)
  user User @relation("UserPreCp1Reports", fields: [auth_user_id], references: [id], onDelete: Cascade)

  @@unique([case_id, input_hash])
  @@index([case_id, created_at(sort: Desc)])
  @@index([auth_user_id, created_at(sort: Desc)])
  @@map("pre_cp1_reports")
}
```
Sửa thêm: `User { pre_cp1_reports PreCp1Report[] @relation("UserPreCp1Reports") }`, `Case { pre_cp1_reports PreCp1Report[] }`.

```
apps/api/src/modules/pre-cp1/
  application/save-pre-cp1.usecase.ts       # DI: findCaseOwnedBy, findReportByHash, createReport
  infrastructure/persistence/pre-cp1.repository.ts
  http/pre-cp1.routes.ts                    # + POST /save
```

## Related Code Files
**Tạo:** model + 2 quan hệ trong `prisma/schema.prisma`; 2 file (`save-pre-cp1.usecase.ts`, `pre-cp1.repository.ts`); `apps/api/src/shared/infrastructure/tests/pre-cp1-save.test.ts`
**Sửa:** `prisma/schema.prisma`, `pre-cp1.routes.ts`, `apps/api/src/index.ts` (chỉ nếu Phase 02 chưa mount)
**Xoá:** không

## Implementation Steps
1. Prisma model + 2 quan hệ ngược. `case_id` **không** nullable; `onDelete: Cascade` (xoá dự án thì kết quả sơ bộ đi theo, không để rác).
2. `bunx prisma migrate dev --create-only --name add_pre_cp1_reports` → **đọc file SQL**: chỉ được có `CREATE TABLE` / `CREATE INDEX` / `ALTER TABLE ... ADD CONSTRAINT`. Thấy `DROP` / `DELETE` / `TRUNCATE` thì dừng, báo lại. Duyệt xong mới `migrate deploy` (dev) + `bun run prisma:generate`.
3. `save-pre-cp1.usecase.ts`:
   - `PreCp1InputSchema.safeParse` → 400 `PRE_CP1_INVALID_INPUT` kèm `issues`.
   - `findCaseOwnedBy(caseId, userId)` → không có thì 404 `CASE_NOT_FOUND`.
   - `hash = sha256(stableStringify(input))` — `input` **không** chứa `aiLabels`/`aiResult`, nên hai lần bấm "Xem kết quả" với cùng câu trả lời nhưng AI gán nhãn khác nhau vẫn ra cùng hash; `findReportByHash(caseId, hash)` có thì trả `{ id, isNew:false, report }` (nhãn cũ trong `ai_labels` được giữ nguyên).
   - Không có → `buildReport(input)` → **1 transaction** gồm:
     - `createReport` với `input_snapshot: input`, `ai_labels: body.aiLabels ?? null`.
     - Ghi `team_fit_reports` **chỉ khi** `body.aiResult` **và** `input.madlibs` **và** `deriveTeamFitInput(input) !== null` (hai cột `idea_snapshot`/`team_snapshot` là `Json` NOT NULL — không được ghi `undefined`/object rỗng). Case đã có báo cáo AI thì bỏ qua (`@@unique([case_id])`).
     - Có `aiResult` mà thiếu `madlibs` hoặc derive trả `null` → **400 `PRE_CP1_AI_MISMATCH`**, không ghi gì.
     - Báo cáo AI do **server** chấm (gọi `evaluate-team-fit` trước đó); client chỉ chuyển tiếp, nên server vẫn kiểm shape bằng `TeamFitFreeReportSchema` trước khi ghi.
   - Log `{ caseId, duration_ms, emptyRoles, warnFlags, hardFlags, hasAiResult }` (không log nội dung).
   - P2002 (hai tab) → đọc lại theo hash, trả `isNew:false`.
4. Routes: `POST /api/pre-cp1/save` body `{ caseId, input, aiLabels?, aiResult?, report? }` — `aiLabels` và `aiResult` được kiểm shape rồi lưu kèm; `report` (nếu client gửi) bị **bỏ qua hoàn toàn**. **Không có endpoint đọc** trong lượt này: chưa có màn nào cần đọc (màn xem kết quả sơ bộ trong dự án để sau).
5. Test (DI fake, không DB):
   - lưu lần 1 → `isNew:true`; lưu lại y nguyên → `isNew:false` cùng id.
   - cùng `input`, `aiLabels` khác nhau → **cùng hash**, trả `isNew:false`, không sinh row mới.
   - `caseId` của người khác → 404, **không** ghi row.
   - input sai → 400.
   - body có kèm `report` giả → bị bỏ qua, DB chỉ có `buildReport(input)`.
   - `aiResult` nhưng thiếu `madlibs` → 400 `PRE_CP1_AI_MISMATCH`, không ghi row nào.
   - `aiResult` + `madlibs` + 7 người (derive `null`) → 400, không ghi.
   - `aiResult` + `madlibs` + 3 người → ghi 1 `team_fit_reports` với `idea_snapshot` khác null; gọi lần hai không tạo bản ghi thứ hai.
   - cùng case, input khác một chữ → 2 row (lịch sử sửa câu trả lời).

## Todo List
- [ ] model + 2 quan hệ (case_id NOT NULL)
- [ ] migration `--create-only`, đọc SQL, deploy dev, generate
- [ ] repository (3 hàm)
- [ ] 1 usecase + kiểm quyền case
- [ ] 1 route + mount
- [ ] 5 test xanh

## Success Criteria
`POST /save` hai lần cùng body cùng case → 1 row, `isNew` true/false; `caseId` không thuộc mình → 404 và không có row mới; sửa tay `report` trong body không ảnh hưởng DB; xoá case → các report của nó biến mất.

## Risk Assessment
- **Mất kết quả sơ bộ khi chưa tạo dự án**: đúng chủ ý, nhưng phải giữ nháp localStorage để người dùng quay lại lưu tiếp; nếu `POST /save` fail sau khi tạo case → hiện "Chưa lưu được kết quả sơ bộ, thử lại", không giả vờ đã lưu.
- **Lỗ: lưu xong mà không xem lại được.** Lượt này không có endpoint đọc, nên sau khi lưu chỉ còn báo cáo AI trong workspace; kết quả sơ bộ (5 cờ, tuyển ai) không xem lại được. Vì vậy **chỉ xoá nháp khi người dùng tự bấm "Làm lại"**, và nháp phải nhớ `caseId` đã lưu để lần sau mở lại đúng chỗ. Endpoint đọc là việc của phase sau, không được lặng lẽ xoá dữ liệu thay cho nó.
- **`aiResult` do client gửi** (báo cáo AI): server chỉ kiểm shape, không xác minh nội dung — người dùng sửa được báo cáo của chính họ trước khi lưu. Chấp nhận: dữ liệu thuộc case của họ, không ảnh hưởng người khác; ghi lại để không tưởng là đã xác thực.
- **Dữ liệu training lệch**: chỉ có người tạo dự án mới được ghi → mẫu bị chọn lọc (survivorship). Bù bằng log bước (Phase 05), không bù bằng cách lưu trộm.
- **Migration**: chỉ thêm bảng; FK `Cascade` là hành vi xoá dây chuyền — chỉ xảy ra khi xoá case, và hiện chưa có chức năng xoá case cho user.
- **Input lớn**: Zod ≤ 600 ký tự/ô, ≤ 8 người → row < ~20KB.

## Security Considerations
`requireAuth`; kiểm `caseId` thuộc `auth_user_id` trước mọi lần đọc/ghi; không expose endpoint đọc theo report id. Không log nội dung người dùng (chỉ số đếm).

## Next Steps
Phase 04 gọi `POST /save` ngay sau khi modal tạo dự án trả về `caseId`; Phase 06 đọc `input_snapshot` để điền sẵn câu trả lời CP1.
