# Phase 1 — Cập nhật rubric CP2

Mục tiêu: CP2 chấm theo chuẩn cô Hanhlh5; không đụng engine (schema, scorer, validator đã chấp nhận `not_applicable`; prompt lõi chỉ dặn "dùng khi tệp hướng dẫn riêng cho phép").

## File

- `packages/validation/src/catalogs/cp2-audit-checks.ts` (bảng id, nhóm, trọng số, `CP2_SCHEMAS`)
- `packages/validation/src/catalogs/cp2-report-display.ts`
- `packages/validation/src/catalogs/` readiness/self-check (tìm `CP2_SELF_CHECKS`, `CP2_INTERVIEW_AUDIT_REQUIRED`, `cp2-readiness`), `cp2.ts`, `questions-cp2.ts` (hint)
- `data/system-prompts/cp2_audit_core_v1.md`, `cp2_full_review_v1.md`, `cp2_questionnaire_review_v1.md`, `cp2_full_resubmit_v1.md`
- Tests: `packages/validation/src/__tests__/cp2-audit.test.ts`, `cp2-readiness.test.ts`; `apps/api/src/shared/infrastructure/tests/cp2-audit-quotes.test.ts`, `cp2-agents-md.test.ts`, `cp2-answer-quality.test.ts`
- Web (chữ và tự kiểm): `Cp2SelfCheck.tsx`, nơi dựng `CP2_SELF_CHECKS`, `AuditStepOptions.tsx`, `AuditStepSources.tsx` (chỉ chỉnh chữ liên quan khảo sát tối thiểu / công bố AI)

## Thay đổi catalog

| Hiện tại | Mới |
|---|---|
| `fr_ai_disclosure` (gate), `fr_harvard`, `fr_appendix`, `fr_mvp_evidence`, `fr_five_forces` | **Xóa** (full: 30 → 25 id) |
| `fr_expert_gate` (gate) | `fr_interview_gate` (gate): từ 2 cuộc phỏng vấn trực tiếp, chuyên gia hoặc khách hàng mục tiêu; mỗi cuộc có người được hỏi (chức danh/đơn vị hoặc đúng Persona) và lý do phù hợp. Nguồn: `cp2_expert_interviews` + `cp2_customer_discovery_process` |
| `fr_expert_learning` | `fr_interview_learning` (**core**, user chốt phỏng vấn trực tiếp là syllabus của môn và được nhấn mạnh ở tài liệu market research): mỗi cuộc có điều học được cụ thể và nhóm đã đổi gì nhờ đó |
| `fr_interview_scale_method` (core, ≥ 10 người/nhóm) | đổi id thành `fr_interview_method`, **giữ `core`**, **bỏ ngưỡng số người** (đã có ở cổng): chấm có mô tả phương pháp (chọn người, thời lượng, cách tổng hợp, giới hạn mẫu) cho từng loại đã phỏng vấn |
| `fr_interview_quality` (core) | giữ `core`, điều kiện theo loại: khách hàng → hỏi hành vi đã xảy ra, không dẫn dắt; chuyên gia → hỏi góc nhìn thị trường, điều cần tránh, kinh nghiệm với khách hàng mục tiêu, không chào hàng. Chấm loại nhóm thực sự có |
| `fr_survey_gate` (gate) | `fr_survey_minimum` (normal, `not_applicable` được phép khi nhóm không làm khảo sát; có thì ≥ 100 phản hồi, dưới mức = `partial` kèm giới hạn kết luận) |
| `fr_survey_design`, `fr_survey_sampling` | giữ normal, thêm quyền `not_applicable` khi không có khảo sát |
| `qr_survey_minimum` (gate) | normal, `not_applicable` được phép nếu nhóm không lên kế hoạch khảo sát |
| `qr_expert_plan` | `qr_interview_plan` (**core**, cùng lý do): kế hoạch ≥ 2 cuộc phỏng vấn trực tiếp, nêu ai, tìm ở đâu, bộ câu hỏi đúng loại người được hỏi |
| `qr_target_screening` (core) | giữ; chỉ xét phần khách hàng khi có phỏng vấn khách hàng; phần chuyên gia xét "đúng lĩnh vực" |
| `qr_commitment_probe`, `qr_past_behavior` | chỉ áp dụng cho phỏng vấn khách hàng; `not_applicable` được phép nếu không có |
| `CP2_FULL_GROUP_WEIGHTS` | evidence 30, market 30, customer 10, product 15, competition 15; bỏ `compliance` khỏi kiểu `Cp2FullGroup` |

Kết quả cổng/core mới của full: gate = {`fr_interview_gate`}; core = {`fr_segment_narrow`, `fr_interview_method`, `fr_interview_quality`, `fr_interview_learning`, `fr_hypothesis_validation`, `fr_som_bottom_up`, `fr_som_rates`, `fr_calc_consistency`} (8). Questionnaire: 12 id không đổi số lượng, không còn gate; core = {`qr_target_screening`, `qr_past_behavior`, `qr_no_pitch_no_lead`, `qr_interview_plan`} (4). Cả ba tiêu chí phỏng vấn không phụ thuộc loại người được hỏi (xem quy tắc dưới).

`FULL_GROUP_LABELS` **giữ** `["compliance", "Yêu cầu bắt buộc"]` kèm một dòng comment lý do (báo cáo cũ đã lưu còn `categoryScores.compliance`).

## Quy tắc viết prompt (đã chốt)

- "Khách hàng mục tiêu" = nhóm người đúng Persona do **chính dự án** nêu; "chuyên gia" = người có kinh nghiệm trong lĩnh vực **của chính dự án**. Prompt **không** ghi cứng ví dụ Nexus (mentor, giảng viên khởi nghiệp, sinh viên học khởi nghiệp). Nếu cần ví dụ, dùng hai dự án khác ngành, trung lập.
- AI lấy Persona và lĩnh vực từ tài liệu của nhóm rồi đối chiếu người được phỏng vấn; cờ riêng: phỏng vấn bạn cùng lớp cho dự án không dành cho họ.
- Dòng tiêu chí nào cho phép `not_applicable` thì ghi rõ ngay trong bảng của file review.
- `cp2_full_resubmit_v1.md`: dặn model ghép id cũ sang id mới (`fr_expert_gate`→`fr_interview_gate`, `fr_expert_learning`→`fr_interview_learning`, `fr_interview_scale_method`→`fr_interview_method`, `fr_survey_gate`→`fr_survey_minimum`; id đã xóa thì bỏ khỏi `reaudit`, không coi là "còn tồn tại").
- Rà `cp2_audit_core_v1.md` và bảng nhóm cổng/core ở đầu `cp2_full_review_v1.md` (dòng nêu gate/core/id còn lại, "20 id còn lại") để khớp số lượng mới.
- Rà hint trong template (`cp2_ai_disclosure`, `cp2_harvard_referencing`, `cp2_appendix`, `cp2_mvp_demo`, `cp2_porters_five_forces`): **không xóa câu hỏi**; sửa hint nào ghi "bắt buộc" hoặc "thiếu sẽ rớt" thành tùy chọn/tham khảo.

## Tự kiểm và sẵn sàng

- `CP2_SELF_CHECKS`: bỏ mục công bố AI; mục khảo sát thành tùy chọn; mục phỏng vấn nói "ít nhất 2 cuộc (chuyên gia hoặc khách hàng)". Cập nhật `Cp2SelfCheck.tsx` (hiện hardcode `cp2_expert_interviews`, `cp2_survey`, `cp2_ai_disclosure`) và `cp2-readiness.test.ts`.
- `CP2_INTERVIEW_AUDIT_REQUIRED` và bank (`evaluateCp2QuestionnaireAnswers`): đọc code rồi chỉnh nếu còn bắt buộc khảo sát; không tự đoán.

## Test

1. `cp2-audit.test.ts`: gate = [`fr_interview_gate`]; 8 core (full) và 4 core (questionnaire); 25 full + 12 questionnaire; tổng trọng số nhóm = 100 cho mỗi bảng; test prompt↔catalog đồng bộ vẫn xanh (bảng prompt phải khớp id).
2. Ba phép thử ở mức chấm điểm (mảng `checks` giả): (a) chỉ 2 chuyên gia, khảo sát `not_applicable` → không bị trần vì thiếu loại kia; (b) chỉ 3 khách hàng đúng Persona, không chuyên gia → không bị trần; (c) 1 cuộc → `fr_interview_gate` fail → trần 49. Chạy trên **hai dự án khác nhau** (id khác nhau không quan trọng ở mức điểm, nhưng fixture prompt/test chạy thật ở phase 7).
3. `not_applicable` trên bộ ba khảo sát: nhóm điểm vẫn tính, không chia cho 0 (test "group with no scored criterion is omitted" đã có).
4. `cp2-audit-quotes.test.ts` dùng `fr_survey_gate`/`fr_expert_gate`: đổi sang id mới; `cp2-agents-md.test.ts`: danh sách id.

## Acceptance

- `tsc` validation + API sạch; test validation và API liên quan xanh.
- Một job CP2 thật với bài `13_Nexus_CP2.pdf` (nhánh `files`) và với câu trả lời (nhánh `answers`) cho `report.json` hợp lệ, không còn id đã xóa; báo cáo CP2 cũ vẫn hiển thị đủ nhóm.
- Chấm lại (`resubmit`) từ báo cáo cũ có id cũ: không lỗi, `reaudit` ghép đúng id mới.
