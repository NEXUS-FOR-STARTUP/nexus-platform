# Phase 4 — API: dịch vụ CP3

Cách làm: thêm CP3 bằng cách nhân bản khung CP2 và mở rộng chỗ hằng/kiểu CP2 chặn đường dùng chung thành danh sách; **không** viết lại ruột CP2, **không** nhân đôi nhánh `isCp2`. `AuditCheckpointCode` thêm `CP3` sẽ làm `Record<AuditCheckpointCode, …>` (service, worker `INSTRUCTIONS`) fail compile cho tới khi đủ: dùng đó làm danh sách việc.

## Việc làm (theo thứ tự)

1. **Bảng chung** `packages/shared/src/audit-checkpoints.ts`: thêm `CP3`: `serviceType: "cp3_audit"`, `input: "cp3_answers"`, `postProcess: "cp3_scored"`, một scope `full` (`initial: [core, review]`, `resubmit: [core, review, resubmit]`, report type `cp3_full` / `cp3_full_resubmit`), `progressSteps` như CP2 nhưng tệp `cp3_evidence.json`, `outputs.required: ["report.json","report.md","cp3_evidence.json"]`. Comment ở `CP2_INPUT_SOURCES` nói kiểu này dùng cho CP2 và CP3. **Không sửa `packages/shared/src/stages.ts` ở phase này**: `STAGES[].available`/`serviceType` được cả API (`upload-stage-documents.usecase.ts:25`) lẫn web (`JourneyTab`, `StageBalanceCards`, `useNextActions`, `OverviewJourneyList`, `stage-state`) đọc, nên bật sớm sẽ lộ vòng CP3 khi web chưa xong hoặc dòng `service_types` chưa có. Việc bật (`serviceType: "cp3_audit"`, `available: true`, tên vòng "Sản phẩm & mô hình") là **bước cuối cùng** ở phase 6.
2. **Dịch vụ** `audit-services.ts`: `cp3: AuditService` = `planScope: () => "full"`; `optsIssues`: `scope` nếu có phải là `full`, cấm `logic_check`; `normalizeSubmissionType` như CP2 nhưng tra `findLatestCp3FullReport(caseId)` (bản sao của `findLatestCp2FullReport` với loại `cp3_full`, `cp3_full_resubmit`; không sửa hàm CP2); `preflight`: `ensureCheckpoint(prisma, caseId, "CP3", "draft")` + `assertCp3InputSource` (bước 4); `jobInputExtras`/`rerunInput` như CP2 (checkpoint `"CP3"`, không có scope questionnaire); `sandbox` kèm `agentsMd`, `tools: [cp2ValidatorSource()]` (cùng bundle validator, khác danh sách schema id); `reportMdName: "report.md"`; `lifecycleUnit: false` (A10). Đăng ký trong `AUDIT_SERVICES`.
3. **Tùy chọn trigger** `trigger-opts.ts` (`TriggerOptsSchema`): cho phép `checkpoint: "CP3"`, `input_source`; cập nhật comment đang nói CP2-only. Đảm bảo `scope: "questionnaire"` bị từ chối cho CP3 (qua `optsIssues`).
4. **Đầu vào** `cp3-audit-input.ts` (mới):
   - `CP3_CHECKPOINT_CODE`, `CP3_ANSWERS_FILE = "cp3_answers.md"`.
   - `renderCp3Answers(answers)`: chỉ câu hỏi **được chấm** (phase 2; bỏ nhóm MVP/UX), cùng cách `renderCp2Answers` (giữ nguyên văn để trích dẫn là chuỗi con). Không dùng `renderStageAnswers("CP3")` vì nó gộp các giai đoạn trước và đưa câu trả lời CP1/CP2 vào thành "bằng chứng".
   - Ngưỡng tối thiểu trước khi trừ credit: `CP3_MIN_ANSWERED`, `CP3_MIN_AVG_WORDS` đọc từ env, mặc định có tài liệu (README), đếm trên **câu được chấm**; mã lỗi `CP3_ANSWERS_TOO_THIN`, thông báo tiếng Việt giống CP2. Viết `assertCp3InputSource` bằng cách **sao chép** logic `assertCp2InputSource` (`answers`: chỉ ngưỡng; `files`: cần ≥ 1 tệp hợp lệ; `both`: cả hai); **không sửa** hàm CP2 (đường đang thu tiền).
   - `loadCp3Attachments(caseId)`: bản sao của `loadAttachments` CP2 với `findStageDocs(caseId, "CP3")`; giữ hành vi lỗi: tải hỏng tệp nộp = `AppError(502, "ATTACHMENT_FETCH_FAILED")` đi đường hoàn credit.
   - Bối cảnh: `loadStageContext(caseId, "CP1", libraryDir, { ownAnswersOnly: true })` và `"CP2"`. Thêm cờ `ownAnswersOnly` cho `case-library.ts` để `renderStageAnswers` chỉ render đúng giai đoạn đó (tránh lặp câu trả lời CP1; test `stage-audit-input.test.ts` khóa hành vi "CP2 gồm CP1" của file câu trả lời CP2 nên không đổi hàm đó). Tải hỏng tài liệu bối cảnh: bỏ qua + cảnh báo (đã chốt ở registry).
   - Manifest: `buildAttachmentManifest` với `role=submission` cho tệp CP3, `role=context` cho CP1/CP2.
   - `resubmit`: nối `previous_report.md/json` (bỏ khóa provenance, như CP2), `change_summary.md`, `user_note.md`; không có báo cáo trước → chấm như `initial` kèm cảnh báo (đua tranh sau khi trừ credit).
5. **Hậu xử lý**: `postProcessCp3Scored` là bản **sao chép** của `postProcessCp2Scored` (khoảng 60 dòng), đổi `cp3_answers.md`, schema `["cp3_full_v1"]` (+ `cp3_full_resubmit_v1` khi resubmit), mã `CP3_REPORT_INVALID`, bỏ `self_checks`. Giữ nguyên thứ tự: validate zod → kiểm trích dẫn → chấm điểm; lỗi 422 → hoàn credit. **Không refactor** hàm CP2: sau khi CP3 chạy ổn mới cân nhắc gộp phần lặp, và làm ở một PR riêng.
6. **Kiểm trích dẫn** `cp2-quote-verify.ts`: thêm tham số tùy chọn `questionSource: RegExp` cho `verifyCp2Quotes`, mặc định là regex CP2 hiện có (`:20`), nên CP2 không đổi hành vi; CP3 truyền `/^(cp3_[a-z0-9_]+|cp3_answers\.md)$/i`. Giữ luật `isContextSource` → `unverified`.
7. **AGENTS.md + instruction**: thêm `buildCp3AgentsMd` (sao chép khung `buildCp2AgentsMd`: đổi tiêu đề, tên tệp prompt, `cp3_evidence.json`, danh sách schema id CP3, cùng `validate-cp2-report.mjs`); không sửa `buildCp2AgentsMd`. `audit-instructions.ts`: thêm `cp3Instruction` (thay `cp2_evidence.json` bằng `cp3_evidence.json`, dùng lại `MANIFEST_HINT`, `CONTEXT_HINT`, `USER_NOTE_HINT`).
8. **Registry** `audit-registry.ts`: `INPUT_ASSEMBLERS.cp3_answers`, `POST_PROCESSORS.cp3_scored` (test hiện có khóa "đồng bộ khóa với bảng" sẽ bắt thiếu).
9. **Báo cáo**:
   - `report.repository.ts`: `findApprovedReports` loại **mọi** loại báo cáo có điểm (CP2 + CP3) khỏi mốc chấm lại CP1 (đây là sửa bắt buộc, chống rò); thêm `findLatestCp3FullReport` bên cạnh `findLatestCp2FullReport` (không đổi hàm CP2).
   - `reports.controller.ts` (hai handler PDF), `pdfService.ts`: `isCp2ReportType`/`getCp2ScoreRows` → hàm hợp nhất ở phase 2; PDF CP3 dùng cùng mẫu `report.typ` (generic).
   - `derive-stage-summaries.ts`: cờ `answers_ready_full` của CP3 tính bằng `evaluateCp3Answers` (cùng ngưỡng env); không để CP3 rơi vào nhánh "mọi giai đoạn khác = true". `answers_ready_questionnaire` chỉ CP2 (giữ).
10. **Queue/worker (không đổi image worker, vì image nặng hơn 1 GB sau giải nén)**: `omp-queue.ts` (phía API) đổi kiểu `checkpoint` từ `"CP1" | "CP2"` sang `AuditCheckpointCode`; nhận diện cột mốc bằng danh sách `*_evidence.json` (`cp2_evidence.json`, `cp3_evidence.json`) thay vì một tên cứng; `job-spec-builder.ts`: thêm thông điệp cột mốc cho `cp3_evidence.json`. Phía worker chỉ **một dòng**: `apps/worker-omp/src/runner-instruction.ts` thêm khóa `CP3` cho `INSTRUCTIONS` (kiểu `Record<AuditCheckpointCode, …>`, thiếu thì `check-types` đỏ), ném lỗi "CP3 chỉ chạy qua JobSpec". **Không** sửa `job-sandbox.ts`, `omp-runner.ts` (chỉ nhánh legacy dùng). **Không build, không push** image worker: `.github/workflows/ci.yml` không có bước build image (đã tìm), image chỉ build khi chạy tay `make -f Makefile.prod deploy-worker`. Lý do chạy được: nhánh JobSpec nhận `instruction`, `requiredOutputs`, `milestones` từ API (`omp-runner.ts:78-84`), prompt và validator cũng do API đưa vào sandbox, nên image cũ chạy được CP3 dù chưa biết mã CP3. Chấp nhận mã nguồn worker lệch image. Điều kiện còn lại: image trên VPS phải là bản đọc `specVersion` (sau phase 2 của `plans/261012-worker-jobspec`), chưa kiểm được.
11. **Env + tài liệu**: `CP3_MIN_ANSWERED`, `CP3_MIN_AVG_WORDS` vào `env.ts` hoặc đúng chỗ CP2 đang đọc `process.env`, ghi README cạnh `CP2_*`.

## Test (API)

- `cp3-audit-trigger.test.ts` (nhân bản `cp2-audit-trigger.test.ts`): `scope` bắt buộc/vắng/`questionnaire`, `logic_check` bị cấm, `input_source` hợp lệ, service type `cp3_audit`, loại báo cáo `cp3_full` / `cp3_full_resubmit`, tên prompt.
- `audit-services.test.ts`: cập nhật (CP3 từ "chưa mở" thành khả dụng; mã lạ vẫn 400).
- `cp3-audit-quotes.test.ts`: nguồn `cp3_*`/`cp3_answers.md` hợp lệ, nguồn `context/`/`_library/` luôn `unverified`, tệp `.pptx` là `unchecked`.
- `findApprovedReports` **không** trả báo cáo `cp3_*` (test hồi quy rò).
- `stage-audit-input.test.ts`/`case-library`: `ownAnswersOnly` chỉ render đúng giai đoạn; file câu trả lời CP3 không chứa câu hỏi MVP.
- `grading-progress.test.ts`: tiến độ CP3 theo `cp3_evidence.json`.
- `assessment-routing.test.ts`: lưu báo cáo CP3 với `checkpointCode` và `reportType`.
- `credit-ledger-by-service-type.test.ts`: thêm `CP3_ID` vào fixture (hoàn thành ở phase 5).

## Acceptance

`tsc` API + worker + shared sạch; toàn bộ test API xanh (cả bộ cũ CP1/CP2); trigger CP3 qua HTTP local trả job hợp lệ; luồng hoàn credit khi `report.json` sai schema vẫn chạy.
