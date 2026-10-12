# Phase 2 — Audit input rules

## Context Links
- [plan.md](./plan.md), [phase-01](./phase-01-stage-api-foundation.md)
- `apps/api/src/modules/ai-engine/application/cp1-audit-input.ts`, `cp2-audit-input.ts`, `audit-registry.ts`
- `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts:222-345`
- `apps/api/src/modules/ai-engine/application/ai-audit-order.listener.ts:40-61`
- `apps/api/src/modules/cases/application/submit-intake.usecase.ts:210-259`
- `data/system-prompts/cp2_audit_core_v1.md:37-43`, `input_clarification_gate_v4_1_resubmit.md:9-11`

## Overview
- Priority: P1.
- Status: Pending.
- Thống nhất đầu vào chấm cho mọi giai đoạn. Bỏ tự chấm. Thêm luật "phải có template hoặc file".

## Key Insights
- `ProjectAnswer` có `@@unique([case_id, question_id])`, mã câu hỏi có tiền tố `cpN_` và không trùng nhau → khử trùng qua `question_id` là có sẵn. Câu trùng ý nghĩa giữa các template vẫn gửi; chấp nhận vài token thừa.
- `renderCp2Answers` đã chạy chung được (đọc theo thứ tự phase, in câu hỏi + trả lời).
- Bộ chấm CP1 hiện bỏ qua template CP1, chỉ đọc intake + mọi tài liệu của case.
- CP1 chấm lại không ghi `previous_report.json`, trong khi prompt có đòi file này.
- Tự chấm đang chạy ở 2 nơi: sau `ORDER_PAID` (CP1, không phải manual) và sau khi nộp intake.

## Requirements
1. `renderStageAnswers(templateKeys, answers)`: gộp câu hỏi theo thứ tự template (giai đoạn hiện tại + các giai đoạn trước), **bỏ câu trống**, bỏ `cp2_selfcheck_*`. Không còn `(Nhóm chưa trả lời)`.
2. CP1 input: `intake_submission.md` (hồ sơ dự án) + `cp1_answers.md` (template Ý tưởng, nếu có) + `team_fit_report.md` + file giai đoạn CP1 trong `attachments/`. Không gom mọi file của case nữa.
3. CP2 input: **giữ tên `cp2_answers.md`**, nội dung thêm phần Ý tưởng phía trước + `self_checks.md` + `attachments/` của CP2. Không đổi tên file để khỏi phải sửa prompt, postprocess, quote-verify cùng lúc.
4. Luật đầu vào, kiểm trong coordinator §4c, **trước khi trừ lượt**: đếm câu trả lời không rỗng (sau `trim`) của template giai đoạn đó và file của giai đoạn đó; cả hai bằng 0 → `409 STAGE_INPUT_REQUIRED` "Trả lời ít nhất một câu trong mẫu hoặc tải tài liệu của giai đoạn này lên trước khi chấm." Đối với CP1, hồ sơ dự án có file cũng tính.
5. Bỏ tự chấm: listener `ORDER_PAID` không gọi chấm nữa; `submit-intake` không gọi chấm nữa. Chấm chỉ do sinh viên bấm (hoặc admin).
6. Mục 2, 4, 5 chỉ chạy khi `AUDIT_STAGE_INPUT_RULES=true` (đọc qua `apps/api/src/env.ts`, mặc định `false`, ghi vào `.env.example`). Flag tắt → giữ nguyên hành vi cũ.
7. CP1 chấm lại ghi thêm `previous_report.json`.
8. Prompt: `cp2_audit_core_v1.md` thêm câu "câu không có trong file nghĩa là nhóm chưa trả lời" và mô tả phần Ý tưởng đứng đầu `cp2_answers.md`. Prompt CP1 thêm mô tả `cp1_answers.md`.

## Architecture
- Tạo `stage-audit-input.ts` chứa `renderStageAnswers`, `loadStageAttachments(checkpointCode)`, `countStageInputs(caseId, checkpointCode)`. Hai assembler CP1/CP2 gọi vào đây. Xóa `renderCp2Answers` sau khi đã chuyển hết người gọi (không giữ alias).
- Danh sách template "giai đoạn hiện tại + trước đó" lấy từ thứ tự trong `STAGES` (phase 1).
- `countStageInputs` dùng chung bộ lọc file với `deriveStageSummaries` (một hằng số `STAGE_DOC_EXCLUDED_TYPES`).

## Related Code Files
Sửa: `cp1-audit-input.ts`, `cp2-audit-input.ts`, `omp-audit-coordinator.ts`, `ai-audit-order.listener.ts`, `submit-intake.usecase.ts`, `cp2-audit-postprocess.ts` (nếu đọc tên file), `data/system-prompts/cp2_audit_core_v1.md`, `cp2_questionnaire_review*.md`, prompt CP1 initial/resubmit.
Tạo: `apps/api/src/modules/ai-engine/application/stage-audit-input.ts`, test `stage-audit-input.test.ts`.
Sửa test: `cp2-audit-quotes.test.ts` và các test đang dựa vào tự chấm sau mua / sau intake.

## Implementation Steps
1. Viết `stage-audit-input.ts` + test: thứ tự câu hỏi, bỏ câu trống, bỏ self-check, gộp nhiều template.
2. Chuyển CP2 assembler sang dùng helper, giữ tên `cp2_answers.md`; sửa prompt CP2 (chỉ thêm câu mô tả).
3. Chuyển CP1 assembler: thêm `cp1_answers.md`; file lấy theo checkpoint CP1 thay vì mọi file của case; ghi `previous_report.json`.
4. Thêm guard `STAGE_INPUT_REQUIRED` vào coordinator §4c, trước bước trừ lượt.
5. Gỡ tự chấm trong listener và `submit-intake`; cập nhật test liên quan.
6. Chạy `bun run --filter nexus-platform-api test`.

## Todo List
- [ ] `stage-audit-input.ts` + test
- [ ] CP2 assembler + prompt
- [ ] CP1 assembler + `previous_report.json`
- [ ] Guard `STAGE_INPUT_REQUIRED`
- [ ] Gỡ tự chấm
- [ ] Test API xanh

## Success Criteria
- Chấm giai đoạn không có câu trả lời và không có file → 409, lượt không bị trừ.
- Chấm Thị trường chỉ có file (không template) → chạy được, `cp2_answers.md` chỉ chứa phần Ý tưởng nếu có.
- `AUDIT_STAGE_INPUT_RULES=false` → test cũ về tự chấm sau mua / sau intake vẫn xanh.
- Mua lượt hoặc nộp hồ sơ không tự sinh job chấm.

## Risks
- Đổi tên file đầu vào phải đổi prompt cùng commit, nếu không AI không thấy câu trả lời. Test kiểm danh sách file assembler ghi ra.
- CP1 không còn gom mọi file của case: file cũ tải trước phase 1 nằm ở CP1 nên vẫn được đọc.
