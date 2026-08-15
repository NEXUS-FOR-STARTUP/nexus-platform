# Phase 01 — Intake Limits (#13 + #14)

- Priority: P0 | Status: Done | Effort: 4h
- Depends: — | Blocks: Phase 02

## Overview

Chặn giới hạn intake: tối đa **10 tài liệu** (#13) + cap ký tự text field (#14). Thực thi ở **1 schema shared** (`Cp1IntakeSchema`) + FE validation — không đụng `validateDocumentWriteInputs` (revision/supporter output giữ nguyên hành vi).

## Requirements

- #13: nộp intake >10 doc → chặn (FE lẫn BE), báo lỗi rõ.
- #14: text field vượt max → chặn (FE lẫn BE), báo lỗi rõ.
- Bucket cap: short 100 (full_name/student_code/team_role/primary_need), email 254, long 20000 (current_blocker/case_summary/current_situations[]).
- Miễn cap: `zalo` (regex 10 số), `file_url`/`drive_url` (URL Cloudinary), `original_name`, `boundary_confirmations`.
- Giữ `.passthrough()` (không đóng schema — tránh vỡ field mới).

## Architecture

- **Schema shared** = điểm thực thi chính (dùng chung FE↔BE). `packages/validation/src/index.ts:204-284` `Cp1IntakeSchema` superRefine thêm:
  - `documents.length > 10` → issue (path `documents`)
  - mỗi field string theo bucket → issue nếu `length > max`
- **BE caller:** `create-case.usecase.ts:55` dùng `validateCp1Intake` (qua `cases.schema.ts:3-8`) → tự bảo vệ. **`submit-intake.usecase.ts` KHÔNG validate** → thêm cap vào `updateIntakeDataOnly` (`submit-intake.usecase.ts:14-110`) để resubmit (T3/T4) cũng bị cap.
  - > **Red-team fix M2:** `Cp1IntakeSchema` đang mang cả MIN constraints (boundary_confirmations ≥3, full_name ≥2, student_code ≥5, zalo 10 số, documents[0].document_type non-empty) mà luồng resubmit trước nay KHÔNG enforce. Gọi full schema ở resubmit có thể chặn payload resubmit hợp lệ trước đây. **Giải pháp: tách `Cp1IntakeCaps` (schema lean CHỈ có max + doc count, không có min) — create-case dùng full `Cp1IntakeSchema`; `updateIntakeDataOnly` dùng `Cp1IntakeCaps`.**
- **FE:** `DocumentInputStep.tsx` chặn append khi `>=10` + counter + disable button; text inputs thêm `maxLength` + counter (TanStack Form `validators.onChange`).
- 20000 ký tự nằm trong JSON metadata intake — Postgres TEXT chứa vô tư, **không cần migration**.

## Related Code Files

| File | Action |
|---|---|
| `packages/validation/src/index.ts` (204-284) | SỬA: `Cp1IntakeSchema` superRefine cap doc count + string buckets; TẠO `Cp1IntakeCaps` lean |
| `apps/api/src/modules/cases/application/submit-intake.usecase.ts` (14-110) | SỬA: gọi `Cp1IntakeCaps` trong `updateIntakeDataOnly` (chỉ max — không min) |
| `apps/api/src/modules/cases/http/cases.schema.ts` (3-8) | VERIFY: `validateCp1Intake` wrapper đã dùng schema mới (không đổi) |
| `apps/web-1/app/intake/_components/DocumentInputStep.tsx` (24-43, 87-135, 260-287) | SỬA: `MAX_DOCUMENT_COUNT=10` guard + counter + disable button + Alert (reuse `uploadError`) |
| `apps/web-1/app/intake/_components/ContactStep.tsx` (29-218) | SỬA: `maxLength` + counter (full_name/student_code/team_role/email) |
| `apps/web-1/app/intake/_components/SituationStep.tsx` (38) | SỬA: `maxLength` 20000 `current_blocker` |
| `apps/web-1/app/intake/_components/ProjectContextStep.tsx` (113-206) | SỬA: `maxLength` 20000 `current_situations[]` |
| `apps/web-1/app/intake/_components/SupportNeedsStep.tsx` (66-122) | SỬA: `maxLength` 100 `primary_need` |
| `apps/api/src/shared/infrastructure/tests/cp1-intake-validation.test.ts` | TẠO: unit test schema cap (mới — schema chưa có test) |

## Implementation Steps

1. Sửa `Cp1IntakeSchema` superRefine: thêm cap documents.length > 10 + string bucket (short/email/long).
2. **Tạo `Cp1IntakeCaps` (lean: chỉ max + doc count, không min)** trong `packages/validation`; `updateIntakeDataOnly` (submit-intake) gọi `Cp1IntakeCaps` — bọc try/catch → AppError 400 INVALID_INTAKE. Create-case giữ full `Cp1IntakeSchema`.
3. `DocumentInputStep.tsx`: const `MAX_DOCUMENT_COUNT=10`; trong `handleFileSelect` append guard `if (docs.length >= 10) → setUploadError(...)`; hiển thị counter `x/10`; disable button khi đạt trần.
4. 4 step files: thêm `maxLength` attr + counter hiển thị cho các field theo bucket.
5. Viết `cp1-intake-validation.test.ts` (node:test): >10 doc → invalid; text vượt max từng bucket → invalid; email 254 hợp lệ; URL/zalo miễn cap.
6. `npm run check-types` + `npm test`.

## Todo List

- [x] Schema: cap documents ≤10 + string buckets (B1-B6)
- [x] submit-intake: validateCp1Intake trong updateIntakeDataOnly
- [x] FE DocumentInputStep: MAX_DOCUMENT_COUNT guard + counter + disable + Alert
- [x] FE 4 step: maxLength + counter theo bucket
- [x] Test cp1-intake-validation.test.ts
- [x] `npm run check-types` PASS
- [x] `npm test` (apps/api) PASS
- [ ] Manual: upload 11 doc → bị chặn FE + BE; text > max → bị chặn; revision/supporter output không đổi

## Success Criteria

- Nộp intake >10 doc → chặn + lỗi rõ (FE + BE, kể cả resubmit T3/T4).
- Text field vượt max → chặn + lỗi rõ.
- `Cp1IntakeSchema` có test (trước đây 0 test).
- Luồng revision/supporter output không đổi hành vi (không đụng `validateDocumentWriteInputs`).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `.max()` vỡ field hợp lệ (URL Cloudinary ~200+, email chuẩn) | Trung bình | Trung bình | Bucket riêng email 254, URL/zalo miễn cap — test regression |
| Thêm validate vào submit-intake gây 400 cho case đang nộp hợp lệ | Trung bình | Trung bình | **Dùng `Cp1IntakeCaps` lean (chỉ max) cho resubmit — không enforce min mới**; superRefine additive |
| FE counter + BE cap không khớp (lệch UX) | Thấp | Thấp | Dùng cùng bucket số trong 1 const shared (FE copy literal, comment dẫn schema) |
| Schema test thiếu trường mới sau này | Thấp | Thấp | `.passthrough()` giữ nguyên — chỉ cap field đã biết |

## Next Steps

→ Phase 02: Document model (migration superseded_at + category + soft-supersede).
