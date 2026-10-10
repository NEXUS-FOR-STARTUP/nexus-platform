# Phase 5 — CP2 readiness check

## Context
- Catalog CP2: `packages/validation/src/catalogs/cp2.ts:11-93` (7 phase, 26 id; required trừ `cp2_pain_point_interviews`, `cp2_competitor_criteria_table` supplemental; `cp2_debate_*` recommended)
- `ProjectAnswer` unique `(case_id, question_id)`, PUT không check catalog (`packages/validation/src/index.ts:1496-1505`)
- Docx: `guided-documents/.../docx-generator.ts:106-167` (đi theo phase template, chỉ id trong template)
- Hooks: `useGuidedAnswers`, `useGuidedDocuments`; editor `GuidedDocumentsEditor.tsx`

## Overview
Priority P1. Miễn phí, không AI. Phụ thuộc phase 4 (chỉ cho UI vào CP2).

## Requirements
- Hàm thuần trong `packages/validation`: `computeReadiness(template, answers, selfChecks, hasCp2Attachment) -> { requiredDone, requiredTotal, missing: QuestionId[], autoFail: { id, label, checked }[], ready: boolean }`. Chỉ đếm câu trả lời đã lưu server, `answer_text.trim()` khác rỗng. `hasCp2Attachment`: case có ≥1 tài liệu chưa bị thay thế gắn checkpoint CP2 (lấy từ dữ liệu documents web đã tải).
- 3 mục tự xác nhận (rubric auto-fail), id dành riêng trong catalog: `cp2_selfcheck_experts` (≥2 chuyên gia, ≥6 tháng kinh nghiệm), `cp2_selfcheck_survey` (≥100 phản hồi, ≥7 câu, ≥2 loại câu hỏi), `cp2_selfcheck_ai_disclosure`. Lưu là `ProjectAnswer` với `answer_text` `"true"`/`"false"`.
- Id selfcheck khai báo trong catalog (hằng `CP2_SELF_CHECKS`), không nằm trong phase template -> docx tự không xuất; `sync-rules` không chạm.
- UI: panel "Mức sẵn sàng nộp" trong editor CP2: thanh tiến độ, danh sách câu thiếu (bấm nhảy tới câu), 3 checkbox, dòng nhắc "Phỏng vấn thật có giá trị hơn survey Google Form".
- Hai mức sẵn sàng (cùng hàm, khác tập câu):
  - Chấm bảng hỏi: `cp2_research_objectives`, `cp2_vpc_customer_profile`, `cp2_problem_need` đã trả lời, và (`cp2_question_bank` đã trả lời HOẶC `hasCp2Attachment`) -> CTA "Chấm bảng hỏi" (phase 6). Nhóm có thể dán bảng hỏi vào ô hoặc upload file; không nhận link Google Form (sandbox không đăng nhập Google).
  - Chấm toàn bộ: mọi câu `required` -> CTA "Chấm toàn bộ" (phase 6). Thiếu vẫn cho bấm nhưng hiện cảnh báo danh sách thiếu (tránh chặn cứng).
- Tính ở client (dữ liệu đã có từ `useGuidedAnswers`), không thêm endpoint.

## Steps
1. `computeReadiness` + `CP2_SELF_CHECKS` + test thuần (bun test hoặc test catalog hiện có).
2. Panel Mantine (`Progress`, `List`, `Checkbox`), lưu checkbox qua hook save answer sẵn có.
3. Copy theo `design-system/wording/`.

## Todo
- [ ] Hàm + test
- [ ] Panel
- [ ] Wording

## Success criteria
Test: answers rỗng -> missing = toàn bộ required; trả lời khoảng trắng không tính; selfcheck không làm tăng requiredDone; `cp2_question_bank` trống + có file CP2 -> sẵn sàng chấm bảng hỏi; trống + không file -> chưa sẵn sàng. Smoke: tick checkbox, reload, còn tick.

## Risks
Selfcheck chỉ là tự khai, không kiểm chứng: ghi rõ trong UI; audit (phase 6) mới đánh giá.
