# Brainstorm report: lỗi CP2 + kiến trúc dịch vụ chấm (CP1–CP4) — 2026-10-20

File duy nhất cho chủ đề này. Trạng thái: sửa lỗi CP2 xong, commit trên `fix/cp2-sandbox-schema-guard` (chưa push/merge). Prompt CP2 đã lên VPS và 1 job CP2 chạy đúng schema (mục 1.2b), nhưng guard (`AGENTS.md`, validator) chưa quan sát được trên prod. Kiến trúc dịch vụ chấm: **brainstorm xong, chưa triển khai, chưa đổi code**.

---

## 1. Problem statement & requirements

### 1.1 Triệu chứng
Job CP2 `3cf8c8f1` fail `CP2_REPORT_INVALID` (422): `report.json` có `schema_version: cp2_full_review_v1` + `automatic_failure_checks.checks`, schema đúng là `cp2_full_v1` + `checks` ở gốc. Hệ thống hoàn 1 credit, job `failed`, không có báo cáo điểm hợp lệ.

### 1.2 Nguyên nhân gốc 1 (người dùng xác nhận bằng chạy prod): prompt CP2 không có trên VPS
- `report.json` tự khai `guidance_warning`: thiếu `system_prompt/cp2_audit_core_v1.md`, `cp2_full_review_v1.md`.
- Dump VPS `data/system-prompts/` chỉ 7 file CP1, không có `cp2_*.md`.
- Compose prod: `./data:/app/data:ro` cho API + worker; image API không `COPY data` → deploy API không đưa prompt lên.
- `prepareSandbox` cũ chỉ `warn` khi thiếu prompt, vẫn chạy, đã trừ credit.
- Phạm vi: chỉ `3cf8c8f1` xác nhận chạy thiếu prompt. `9313b3dc`: `report.json` khác cấu trúc, không có lời khai prompt, chưa kết luận. `cd3048d4`, `fb640695`: không có `output/`.

### 1.2b Quan sát sau khi prompt lên VPS (dump lúc 19:46, 2026-10-20)
Job `5196feab` (case `c4ce59f1`, TEDI, tạo 19:42):
- 4 file `cp2_*.md` trên VPS khớp SHA-256 với repo; sandbox có `cp2_audit_core_v1.md`, `cp2_full_review_v1.md`.
- `report.json`: `schema: "cp2_full_v1"`, `checks` mảng ở gốc, 30 tiêu chí không trùng id (14 partial, 4 pass, 6 fail, 6 missing), 43 evidence; không có `guidance_warning`. Điểm 38, "CHƯA ĐỦ YÊU CẦU BẮT BUỘC". Có 5 bản PDF trong `reports/`.
- **Xác nhận:** người dùng đưa 4 file `cp2_*.md` lên prod và chạy lại, lỗi ban đầu hết (job `5196feab` đúng schema). Phần "lỗi ban đầu do thiếu prompt" coi là đã giải quyết. Chưa đo tỷ lệ đúng schema qua nhiều job, nên lưới an toàn (validator, `AGENTS.md`) vẫn là phòng thủ chưa kiểm chứng, không phải thứ đã chứng minh cần hoặc không cần.
- **Guard chưa quan sát được:** sandbox không có `AGENTS.md` và `tools/`. Có thể API trên VPS chưa chạy nhánh fix, nhưng dump không có digest/log nên chưa khẳng định.

### 1.3 Nguyên nhân gốc 2 (kiến trúc): dịch vụ chấm không có định nghĩa duy nhất
CP1 + CP2 chung một luồng có ~20 nhánh `=== "CP1"/"CP2"`. CP1 = nền mặc định ngầm; CP2 = định nghĩa bằng phép trừ (`includeKnowledge:false`).

| Loại nhánh | Vị trí | Hệ quả đã thấy |
|---|---|---|
| Mặc định ngầm về CP1 (`?? "CP1"`) | `finalizer:72,145`, `ai-job.repository:158`, `derive-stage-summaries:32`, `trigger-opts:12` | Mã lạ/thiếu rơi về CP1, không báo lỗi |
| Hành vi trước khi trừ credit | `coordinator:290,374,393-416` | Mỗi dịch vụ rải điều kiện riêng |
| Lắp gói job | `coordinator:440-446`, `job-spec-builder:75-77`, `omp-queue:84` | Sandbox CP1 = `{}` copy mọi prompt (cả `cp2_*.md`); CP2 quên `AGENTS.md` lần đầu |
| Hậu xử lý + lưu | `finalizer:76,167-174,216,245,297,316` | Tên file md, lifecycle unit, chống trùng, `reportType` |
| Khác | `admin-workers:533`, `trigger-opts:29,37` | Chạy lại CP2 chép tay trường |

Hiện trạng CP3/CP4: chỉ có catalog câu hỏi sinh viên (`packages/validation/src/catalogs/cp3.ts`, `cp4.ts`, `questions-cp3.ts`, `questions-cp4.ts`); `stages.ts`: `serviceType:null, available:false`. Chưa có prompt, tiêu chí, schema báo cáo, assembler, postprocessor.

### 1.4 Ràng buộc kiến trúc đã xác nhận
- Worker = engine. API gửi JobSpec (`instruction`, `requiredOutputs`, `optionalOutputs`, `milestones`); worker không chứa nghiệp vụ. Sửa dịch vụ = deploy API, không build lại image (`apps/worker-omp/AGENTS.md:37-52`).
- Request = payload BullMQ nhỏ + thư mục sandbox trên volume `./storage` (`input/`, `system_prompt/`, `knowledge/`, `tools/`, `AGENTS.md`, `output/`).
- Nhánh legacy worker còn (Phase 3 cutover Pending).
- Chỉ đổi OMP worker khi thật sự quan trọng.

### 1.5 Yêu cầu (từ bạn)
1. CP1 làm chuẩn: cơ chế CP1 (AGENTS.md khoá cấu trúc) áp cho mọi dịch vụ chấm về sau.
2. CP1/CP2 độc lập: mỗi dịch vụ chỉ nhận đúng prompt/input/knowledge của nó.
3. Giải quyết một lần, chạy được cho CP2, CP3, CP4.
4. Kiểm cấu trúc (schema) bằng script chạy, không bằng lời dặn.
5. Không đụng worker.

### 1.6 Vấn đề: thông tin phân loại file của người dùng không vào job
- Người dùng chọn loại cho từng file khi tải lên (modal giai đoạn gửi `category` mỗi file); server lưu ở `document_records.metadata_json.category` (`document.repository.ts:74-76`). `doc_type` luôn là `revision_document` cho mọi file qua modal, không dùng được để phân loại.
- Danh mục hiện có (`DOCUMENT_CATEGORY_CODES`, `packages/validation/src/index.ts:597`): `idea_report`, `pitch_deck`, `market_research`, `financial_plan`, `other`. Modal giai đoạn và bước intake dùng chung danh sách này.
- Assembler CP2 (`loadAttachments`, `cp2-audit-input.ts:154`) và CP1 (`cp1-audit-input.ts:68-83`, `109-122`) đã load sẵn từng `doc` row nhưng chỉ lấy `download_url` và tên file; `category` bị bỏ. Model phải đoán loại file từ tên và nội dung (job `5196feab`: rubric, đề bài, phỏng vấn, báo cáo nhóm).
- Danh mục hiện không có loại rubric/đề bài/phỏng vấn: 4 file trên chỉ chọn được `idea_report` hoặc `other`.
- Ghi chú (đã xử lý): hai vòng lặp CP1 không dedupe tên file, hai file cùng tên ghi đè nhau, tên không làm sạch. Đã sửa bằng `uniqueSandboxName`, xem mục 6.

---

## 2. Evaluated approaches

### 2.1 Cách làm model tự sửa báo cáo sai schema

| | Cách | Ưu | Nhược | Kết luận |
|---|---|---|---|---|
| W | Zod + vòng viết lại trong worker | Sửa trong cùng job | Worker nắm nghiệp vụ CP2, build lại image (Dockerfile, deps) | **Loại, đã gỡ** |
| A | Chỉ `AGENTS.md` (như CP1) | Đơn giản nhất | Sai thì 422 + hoàn credit, không có lưới | Thiếu |
| **B** | **API ship validator zod đóng gói (`tools/validate-cp2-report.mjs`) vào sandbox, instruction bắt model chạy tới OK** | Zod ở API, worker không đổi, chạy bằng `bun` có sẵn | Model có thể bỏ qua → finalizer vẫn chặn | **Chọn** |
| C | Finalizer 422 → API enqueue job sửa | Tách hẳn | Nặng: trạng thái job, credit, sandbox | Để sau nếu đo thấy model hay bỏ qua B |

### 2.2 Cách giải quyết gốc kiến trúc

| | Cách | Ưu | Nhược | Kết luận |
|---|---|---|---|---|
| X | Vá từng lỗi riêng lẻ | Nhanh | Mỗi dịch vụ mới lặp lại lỗi; CP3/CP4 = ~10 chỗ sửa | Loại |
| **Y** | **Registry dịch vụ chấm + hook hành vi; mỗi dịch vụ một file; không có mặc định** | Mỗi dịch vụ độc lập, thêm CP3/CP4 = một file, hạ tầng chung giữ | Refactor đụng CP1 đang chạy mượt | **Chọn** |
| Z | Chép CP1 và CP2 thành hai pipeline riêng | Độc lập tuyệt đối | Trùng queue/credit/PDF/lưu, drift | Loại |

### 2.3 Prompt vào prod

| Cách | Ưu | Nhược | Kết luận |
|---|---|---|---|
| Nhúng vào image API | Deploy API là đủ, hết lệch repo/VPS | Đổi prompt = build lại API | Không chọn |
| **Giữ mount host + kiểm khi API khởi động** | Đổi prompt không cần build | Vẫn cần đưa file lên host | **Chọn (bạn chọn)** |

### 2.4 CP1 sandbox
`{}` (copy hết thư mục prompt) vs `promptFiles: plan.prompts` rõ ràng. **Chọn rõ ràng** (bạn chọn "chuyển CP1 sang khung mới").

---

## 3. Final recommended solution

### 3.1 Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Mỗi dịch vụ độc lập **về định nghĩa** (prompt, schema, sandbox, instruction), tự khai báo thứ nó cần; không "mặc định rồi trừ bớt". Dữ liệu dự án vẫn kế thừa giữa các CP (D15) | Gốc: kế thừa ngầm. Độc lập định nghĩa không có nghĩa tách dữ liệu |
| D2 | Hạ tầng chung (queue, tạo sandbox, credit/refund, PDF, lưu, tiến trình) giữ làm hàm dùng chung; chỉ quyết định nghiệp vụ tách theo dịch vụ | Tránh chép hai bản |
| D3 | `getAuditService(code)` throw 400 khi mã chưa đăng ký; bỏ mọi `?? "CP1"` | Bỏ mặc định ngầm |
| D4 | CP1 chuyển sang khung mới, `promptFiles` rõ ràng; từng bước, giữ test CP1, chụp so sánh file sandbox trước/sau | Bạn chọn |
| D5 | Giữ mount host `./data` + kiểm khi API khởi động: mọi prompt của mọi dịch vụ đã đăng ký phải có, thiếu thì API không start | Bạn chọn |
| D6 | CP3/CP4 chưa có nội dung chấm: không có entry registry, trigger trả 400 "chưa mở"; có rubric thì thêm một file | Bạn chọn; không bịa rubric |
| D7 | Bảng `AUDIT_CHECKPOINTS` (`@app/shared`) giữ nguyên; registry chỉ thêm hook hành vi trong API | Worker legacy còn đọc |
| D8 | Worker không đổi | Ràng buộc 1.4 |
| D9 | `workflow_operator_rule_v1.md` thuộc CP1 cùng `triad_framework_v1_1.md`: thêm vào danh sách prompt mọi phạm vi CP1, **đứng đầu**, instruction CP1 bảo model đọc | Bạn xác nhận; trước chỉ có do copy hết, không ai tham chiếu |
| D10 | Không nén `cp2_*.md` bằng `caveman-compress` (prompt tiếng Việt đầy ngưỡng/điều kiện; skill viết cho tiếng Anh, ghi đè gốc). Tối ưu = bỏ trùng lặp có chủ đích + đo A/B bằng input job `3cf8c8f1` | |
| D11 | `AGENTS.md` CP2 (sinh từ `CP2_SCHEMAS`) + validator `.mjs` giữ, thành phần của hook `sandbox` CP2 | Nằm trong API |
| D12 | Phân loại file người dùng chọn (lưu ở `document_records.metadata_json.category`, không phải `doc_type`) được đưa vào job qua manifest **JSON** `input/attachments_manifest.json` (tên trong sandbox đã dedupe, `category`, nhãn tiếng Việt, tên gốc, định dạng). Không đổi tên file theo loại | Bạn chọn JSON; đổi tên làm hỏng đối chiếu quote trong `evidence.source` |
| D13 | Thêm hai danh mục: `lecturer_guidance` ("Hướng dẫn / yêu cầu từ giảng viên", gộp rubric + đề bài) và `interview_survey` ("Phỏng vấn / khảo sát khách hàng"). `business_model_canvas` chờ rubric CP3 | Bạn chọn; CP2 có nhóm bằng chứng riêng cho phỏng vấn/khảo sát |
| D14 | Nhãn là người dùng tự khai: instruction ghi rõ file `lecturer_guidance` chỉ là tài liệu tham chiếu, không ghi đè prompt chấm | Chống gài nhãn để lái điểm |
| D15 | CP sau nhận dữ liệu CP trước: câu trả lời copy vào `input/context/`; tài liệu nằm trong `storage/jobs/<caseId>/_library/` khóa theo `download_url`, manifest JSON (`stage`, `role`, `path`) dẫn agent tới; context không phải bằng chứng, ép bằng postprocess (xem 3.5, 3.7) | Bạn chỉ ra CP2 cần ý tưởng CP1; chọn thư viện chung thay vì copy để không nhân đôi đĩa và thời gian tải theo CP |
| D16 | Registry đầy đủ kiểu hook (prompt, sandbox, instruction, preflight, optsSchema, jobInputExtras, tên file báo cáo, persistence); bỏ mọi `if CP1/CP2` và `?? "CP1"` | Bạn chọn; **phía API** CP3/CP4 chỉ thêm một file. Phía web không đúng như vậy, xem 3.8 |
| D17 | Job cũ không có `checkpoint` trong `input_json`: một hàm tương thích dùng chung, ghi rõ lý do. Hiện có ba bản chép tay (`finalizer:72,145`, `derive-stage-summaries:29`, `admin-workers:531`) gom về một | Bạn chọn; giữ job cũ chạy lại và finalize được |
| D18 | Câu trả lời CP1 copy vào `context/` độc lập với `AUDIT_STAGE_INPUT_RULES` | Bạn chọn; khỏi phụ thuộc cờ chưa biết giá trị trên prod |
| D19 | `_library` giữ cùng vòng đời case, không dọn | Bạn chọn; đơn giản |
| D20 | Lượt implement này chỉ làm phía API (registry, thư viện tài liệu, manifest, lưu báo cáo); giữ nguyên hợp đồng API với web cho CP1/CP2. Web cho CP3/CP4 (kiểu `"CP1" \| "CP2"`, payload, tên vòng) làm lượt sau, khi có rubric và tên vòng | Bạn chọn |

### 3.2 Thiết kế: hook rút từ các nhánh `if` thật

> **Cần sửa (phát hiện khi đọc nguyên văn coordinator/finalizer):** bảng dưới viết trước khi đọc đủ nguồn và có hai chỗ sai. (1) `preflight` không phải một hook: chuẩn hóa `submissionType` chạy **trước** `resolveAuditPlan` (`coordinator:289-295`), còn guard CP1 (dòng 374) và CP2 (dòng 393, có ghi DB `ensureCheckpoint`) chạy **sau** plan, trước khi trừ credit → cần hai điểm móc. (2) `persistence: unit|per-trigger` không đủ: finalizer có nhánh trả về sớm kèm cập nhật trạng thái (dòng 184-196), xác định lifecycle unit (171-199), dedupe hai chiến lược trong transaction (245-287) → cần hàm danh tính báo cáo, không phải cờ. Ngoài ra `AUDIT_CHECKPOINTS` đã chứa `serviceType`, `input`, `postProcess`, `prompts`, `reportType`, `outputs`, `progressSteps`; `INPUT_ASSEMBLERS`/`POST_PROCESSORS` đã là registry theo mã. Hướng điều chỉnh: thêm `reportMd` vào bảng + một bảng hành vi `AUDIT_BEHAVIORS` kiểu `INPUT_ASSEMBLERS`; `jobInputExtras` chỉ gom 3 trường người dùng nhập, có thể bỏ. Chưa chốt, chờ bạn.

| Hook | Thay cho |
|---|---|
| `optsSchema` | nhánh CP2 trong `trigger-opts` |
| `preflight(ctx)` (trước khi trừ credit) | `coordinator:290,374,393-416` |
| `assembleInput` | đã có (`INPUT_ASSEMBLERS`) |
| `jobInputExtras(ctx)` | `coordinator:440-442` |
| `sandbox(plan, ctx)` → prompt, knowledge, `AGENTS.md`, tools | `coordinator:446` |
| `instruction(plan, ctx)` | `job-spec-builder:75-77` |
| `reportMdFile`, `persistence` (`unit`/`per-trigger`), `reportType` | `finalizer:76,167-174,216,245,297` |
| `rerunInput(lastInput)` | `admin-workers:533` |

YAGNI: chỉ hook đang có `if` thật; hai dịch vụ chạy thật mới đủ để chốt hình dạng, không đoán nhu cầu CP3/CP4.

### 3.3 Đã làm (phần sửa lỗi CP2, API + packages, không đụng worker)
- `cp2-agents-md.ts` (mới): `AGENTS.md` CP2 sinh từ `CP2_SCHEMAS` (schema, khung JSON, id, lệnh kiểm).
- `omp-audit.service.ts`: `SandboxOptions.agentsMd`, `tools`; `promptFiles` rõ ràng mà thiếu file hoặc thiếu thư mục `data/system-prompts` → `throw` (không danh sách = CP1 giữ hành vi cũ).
- `omp-audit-coordinator.ts`: CP2 truyền `agentsMd` + `tools:[cp2ValidatorSource()]`.
- `packages/validation`: CLI `validate-cp2-report` (zod bundle, `tsup.cli.config.ts`); lỗi zod có `message`.
- `job-spec-builder.ts`: instruction CP2 bảo đọc `AGENTS.md`, chạy lệnh kiểm tới OK.
- `omp-audit-finalizer.ts`: bọc `JSON.parse`, lỗi `report.json is not valid JSON: …`.
- `cp2_audit_core_v1.md:245`: dùng validator trong `AGENTS.md`, bỏ `JSON.parse`.
- `apps/worker-omp/AGENTS.md`: cây sandbox mới, worker không validate/sửa báo cáo.
- Test: `cp2-agents-md.test.ts` (3 ca schema/id + CLI hợp lệ/không), `prepare-sandbox-prompts.test.ts` (4 ca). 8/8 pass, `tsc` API sạch.
- Đã copy 4 file `cp2_*.md` (core bản mới) vào dump local `nexus-platform-prod-vps/data/system-prompts/`, hash khớp repo. **Chưa lên VPS thật.**

Commit trên `fix/cp2-sandbox-schema-guard` (từ `dev`, chưa push): `c4f2968` validator CLI; `bb8517a` sandbox CP2 + fail khi thiếu file prompt; `c9c7b2d` finalizer JSON hỏng; `58be539` core prompt; `658f9f4`, `35d6a13` báo cáo; `ee345d8` fail khi thiếu thư mục prompt + test; `38623de` worker AGENTS.md.

### 3.4 Sai lầm trong phiên (đã sửa)

| Việc | Kết quả |
|---|---|
| Zod + vòng viết lại trong worker | Sai kiến trúc, đã gỡ hết |
| "Hai nguồn cấu hình checkpoint" | Sai, cả hai đọc cùng `AUDIT_CHECKPOINTS`; đã rút |
| "Mọi job CP2 cũ chấm thiếu prompt" | Không có căn cứ; giới hạn về job xác nhận |
| Gọi `3cf8c8f1` là "điểm vẫn là điểm chấm khi thiếu prompt" | Sai: job đã failed, không có điểm; chỉ cần chấm lại để có kết quả hợp lệ |
| "Fix thiếu prompt chặn trước khi trừ credit" | Sai: credit trừ trước, hoàn qua `dispatch-failure` |
| Đoán lỗi do model sai schema | Triệu chứng; gốc là thiếu prompt |

### 3.5 Sửa lại D1: độc lập về *định nghĩa*, không độc lập về *dữ liệu* (bạn chỉ ra)
Sai sót của tôi: gộp hai việc khác nhau. CP1 đến CP4 thuộc cùng một dự án, mỗi CP sau cần dữ liệu CP trước (CP2 tính TAM/SAM/SOM phải biết dự án bán gì, tức là ý tưởng ở CP1).

**Hiện trạng trong code (đã đọc, `cp2-audit-input.ts`):** `assembleCp2InputFiles` chỉ đưa vào `cp2_answers.md`, tự kiểm, tệp đính kèm của chính checkpoint CP2, và báo cáo CP2 trước đó khi nộp lại. **Không có dữ liệu CP1 nào** (không intake, không báo cáo CP1). Prompt CP2 cũng không tham chiếu CP1. Job `5196feab` xác nhận: 4 tệp đính kèm + `cp2_answers.md` + `user_note.md`. Đây là thiếu sót hiện tại, không chỉ là rủi ro thiết kế.

**Ba lớp, tách rõ:**
| Lớp | Nội dung | Độc lập? |
|---|---|---|
| 1. Định nghĩa dịch vụ | prompt, schema, `AGENTS.md`, validator, instruction, cách lưu | Có: mỗi CP một file khai báo |
| 2. Dữ liệu dự án (kế thừa) | thứ CP trước đã tạo ra cho cùng `case` | Không: CP sau đọc CP trước |
| 3. Đầu vào của lần chạy | bài nộp riêng của CP này | Có |

**Thiết kế tối giản (thay đề xuất trước, theo yêu cầu "cắt cái không cần"):**
- **Không phân cấp thư mục theo CP.** Vị trí job giữ `storage/jobs/<caseId>/<jobId>/`; không sửa worker (đường dẫn cứng ở `omp-runner.ts:67-69`), không compose, không liên kết, không thư mục dùng chung.
- **Giai đoạn của từng tệp nói bằng manifest JSON:** thêm `stage` (`CP1`/`CP2`) và `role` (`submission`/`context`) vào mỗi mục của `input/attachments_manifest.json`.
- **Một tín hiệu cấu trúc rẻ:** tệp giai đoạn trước nằm ở `input/context/`, bài nộp lần này ở chỗ cũ. Giữ vì chưa chứng minh được model luôn đọc manifest (mục "Chưa kiểm"); đường dẫn là tín hiệu dự phòng.
- **Nguồn:** DB + Cloudinary, dựng lúc tạo job. Không lưu thư mục dự án dùng chung (sẽ thành nguồn sự thật thứ hai).
- **CP2 `context/` gồm (đề xuất, chưa chốt):** `cp1_answers.md` (render `renderStageAnswers("CP1")`) và tài liệu CP1 được chọn theo luật. **Không gồm** `intake_submission.md` (xem Đính chính) **và không gồm báo cáo CP1** (đầu ra AI, dễ sai, dễ bị chép làm bằng chứng); thêm khi rubric CP2 cần đối chiếu.
- **Ép bằng code, không bằng lời dặn:** `evidence.source` bắt đầu bằng `context/` thì postprocess gắn cờ không hợp lệ (cần xác minh chỗ kiểm quote hiện tại khi cài).
- **Cắt:** bản ghi phiên bản CP1 trong `input_json` (thư mục job đã lưu đúng thứ model thấy, miễn không xóa), dedupe/cache tải tệp, cây `cp1/ cp2/`, `sandboxPath` trong JobSpec.
- **Làm được ngay, không chờ registry:** một hàm dựng context + một lời gọi trong `assembleCp2InputFiles`. Khi có registry thì chuyển thành khai báo `upstream`.

**Đính chính (đã đo trên DB local, chưa thấy dữ liệu prod):**
- **Không dùng intake làm nguồn ý tưởng.** `lifecycle_units` `v00.content` hiện là hồ sơ dự án: `team_context` (tên dự án, số nhóm, trường, lớp) và `contact` (họ tên, mã sinh viên, email, Zalo, Telegram); `idea`, `idea_context`, `support_needs`, `case_summary` **rỗng**. Cập nhật bởi `update-case-settings.usecase.ts`, không phải form ý tưởng. Route `/dashboard/intake` còn tồn tại nhưng không chứng minh form ý tưởng còn dùng.
- **Dữ liệu cá nhân:** `assembleCp1InputFiles` vẫn ghi `intake_submission.md` (cả JSON, gồm email/Zalo/mã sinh viên) vào sandbox CP1 khi `intakeUnit.content` có. Chưa kiểm model CP1 có dùng không. Việc riêng với bài toán context.
- **Nguồn ý tưởng hiện hành:** câu trả lời CP1 trong `project_answers` (`cp1_idea_name`, `cp1_main_problem`, `cp1_primary_customer`, `cp1_current_alternatives`, ...) và tài liệu CP1 tải lên (checkpoint CP1, `source_kind=cloudinary`).
- **Chế độ chấm bằng tệp** (`input_source=files`, như job `5196feab`): `cp2_answers.md` chỉ là đoạn cố định; thông tin dự án nằm trong tệp tải lên. Văn bản một mình không thay được tài liệu.
- **Cờ `AUDIT_STAGE_INPUT_RULES`:** local `true`; không thấy trong `.env.prod` và compose của dump VPS nên suy ra `false` trên prod (chưa xác nhận). Khi bật, `renderStageAnswers` cộng dồn câu trả lời mọi stage đến stage hiện tại (cỡ chặn bởi số câu hỏi template, chưa đo); khi tắt, CP2 chỉ nhận câu trả lời CP2.
- **Chọn cách đưa tài liệu vào (chưa chốt, xem phương án 3-4 bàn với bạn):** copy toàn bộ làm đĩa/thời gian tải tăng theo CP; token chỉ giảm khi giảm số tệp model đọc. Hướng nghiêng về: manifest tham chiếu mọi tài liệu giai đoạn trước, API chỉ copy tập con theo luật (stage, loại, bản mới nhất, trần số tệp và byte đặt bằng biến môi trường).
- Cô lập quyền đọc giữa các case là việc riêng (3.6), thiết kế này không dựa vào nó.

**Ràng buộc để không hỏng chấm điểm:**
- Dữ liệu CP trước là **bối cảnh, không phải bằng chứng**. Quote trong `evidence.source` của CP2 chỉ được lấy từ bài nộp CP2. Nếu không, model có thể "điền chỗ trống" bằng CP1 và cho điểm thứ nhóm chưa viết ở CP2.
- Báo cáo CP1 là đầu ra AI, có thể sai: coi như tham khảo, ưu tiên bài nộp gốc.
- Prompt CP2 phải được bạn viết lại để nói rõ cách dùng `context/` (hiện không có chỗ nào nhắc).

**Chưa xác minh:** `triad_handoff_packet.md` của CP1 có được lưu lại sau job không (`saveOmpAuditReport` chưa đọc); CP2 có cần đối chiếu nhất quán với CP1 hay chỉ cần biết dự án bán gì (cần bạn quyết).

### 3.6 Phát hiện: agent không bị cô lập giữa các case (đo bằng file canary, chưa sửa)
Đo trong container `nexus-worker-omp` local (cấu hình mount giống `docker-compose.prod.yml`), bằng lệnh filesystem với file canary, không đọc dữ liệu thật; canary đã xóa:
- Tiến trình chạy `uid=0` (root, `Config.User` rỗng).
- Từ `cwd` của job A: **đọc** file của case B được; **ghi đè** file của case B được; liệt kê toàn bộ `/app/storage/jobs` được; ghi ở gốc `/app/storage` được.
- `/app/data` mount `ro` (đúng thiết kế). `/root/.omp` đọc được, gồm `auth.json` (OAuth omp).
- Worker chạy `omp --cwd <jobDir> --approval-mode yolo`: `--cwd` chỉ đặt thư mục làm việc, không giới hạn quyền.
- **Chưa kiểm trên prod** (không truy cập VPS); suy ra từ compose prod giống nhau (`./storage` rw, `./data:ro`, `/root/.omp`, không có `user:`).
- Hệ quả: cô lập giữa nhóm chỉ là quy ước; tệp người dùng tải lên có thể chứa chỉ dẫn độc hại đọc/ghi case khác hoặc `auth.json`. Cách sửa nằm ở container (user không root, mount chỉ thư mục job, tách `auth.json`), đụng worker/compose, **không nằm trong phạm vi các thiết kế ở trên**. Cần bạn quyết có làm không và có kiểm trên VPS không.

### 3.7 Thiết kế chốt: thư viện tài liệu theo case (bạn chọn; chưa code)
Quyết định của bạn: CP2 cần **cả tài liệu CP1 và câu trả lời CP1** (hệ thống cho chấm khi chỉ có một trong hai, nên phía còn lại có thể trống); **không copy tài liệu**, dùng một chỗ lưu chung để agent tự tìm đọc khi cần; **khóa theo `download_url`**; chức năng trước, bảo mật cô lập tính sau.
```
storage/jobs/<caseId>/
  _library/<băm URL>_<tên>        ← mỗi tài liệu một bản, API tải nếu chưa có
  <jobId>/input/
    attachments/…                  ← bài nộp lần này (copy như cũ)
    context/cp1_answers.md         ← câu trả lời CP trước (copy, vài KB; người dùng sửa được nên cần bản chụp mỗi job)
    attachments_manifest.json      ← mỗi tệp: stage, role, path (tài liệu CP trước: ../_library/…), tên gốc, loại, kích thước
```
- **Khóa = `download_url` (có `/v<phiên bản>/`), dùng làm định danh cache, không phải bản chụp đảm bảo:** đo 47/47 tài liệu `cloudinary` và 29/29 `system_generated` trong DB local đều có phiên bản trong URL. Thay tệp tại chỗ trong DB (`upsertDocumentRecord` update cùng `id`, đặt lại `superseded_at: null`) làm URL đổi, nên ra tệp mới trong thư viện. `docId` **không** bất biến nên không dùng làm khóa.
- **Giới hạn đã biết:**
  - URL có phiên bản **không bảo đảm tải lại đúng bytes cũ**. Theo tài liệu Cloudinary ("Replacing existing assets", tham số upload `backup`), bản bị thay chỉ được giữ khi bật backup; nếu không, URL cũ có thể chỉ trả từ bộ đệm CDN. Khi bản `_library` cục bộ mất, tải lại có thể ra nội dung khác hoặc lỗi.
  - Không phát hiện Cloudinary bị ghi đè mà DB không cập nhật. Không có cột băm nội dung (A bỏ: trình duyệt upload thẳng Cloudinary, API không cầm nội dung lúc upload, và băm lưu sẵn cũng không bắt được ghi đè ngoài DB).
  - Hệ quả: `_library` là **bản duy nhất đáng tin của nội dung lúc API tải về**, không phải thứ dựng lại được từ Cloudinary. Mất `_library` thì không bảo đảm tái hiện đúng những gì model đã đọc.
- **Chưa xác minh:** Cloudinary của dự án có bật backup không, và cache CDN giữ URL phiên bản cũ bao lâu (chưa gọi thử); có luồng ghi đè ngoài DB hay không.
- **Tài liệu giai đoạn trước:** liệt kê hết trong manifest (chỉ metadata), không có luật chọn tập con; token chỉ tăng khi model mở tệp. CP3, CP4 chỉ thêm dòng manifest.
- **Không dùng intake** (`v00` chỉ là hồ sơ dự án và liên hệ cá nhân, ý tưởng rỗng; xem 3.5).
- **Ép "context không phải bằng chứng" bằng code:** chuẩn hóa đường dẫn nguồn (giải `..`, `input/`, đường dẫn tuyệt đối, `\`, hoa thường, `%xx`), nhận ra cả `context/` lẫn `_library/`, tra theo manifest, chỉ chấp nhận mục `role: submission`; test cho các biến thể này.
- **Giữ nguyên:** không sửa worker, compose, đường dẫn job `jobs/<caseId>/<jobId>`. Ghi tệp thư viện nguyên tử (tệp tạm rồi đổi tên) vì hai job cùng case có thể cùng tải. Tải hỏng một tài liệu context thì bỏ qua và ghi cảnh báo, không làm hỏng lần chấm.
- **Đánh đổi chấp nhận:** job không còn tự đủ để tái hiện (phụ thuộc `_library`, không được xóa cùng sandbox job); agent đang ghi được vào `_library` (xem 3.6, tính sau); `../_library` chỉ đúng với cấu trúc lồng `jobs/<caseId>/<jobId>` (bản phẳng `jobs/<jobId>` dành cho worker cũ không có).

---
### 3.8 Đã đọc nốt code, kết quả (không đổi quyết định nào)
- **Sandbox được ghi tối đa 4 chỗ** (`coordinator:528-595`): nested `jobs/<caseId>/<jobId>`, flat `jobs/<jobId>`, và hai bản trong `OMP_SANDBOX_MIRROR_ROOT` nếu đặt. Worker hiện tại dùng nested khi payload có `caseId` (có), flat chỉ cho worker cũ. Quyết định: `_library` ghi ở `jobs/<caseId>/_library` và bản mirror nested; **không** ghi cho flat (`../_library` không tồn tại ở đó, chấp nhận như đã nêu).
- **`_library` không bị xóa nhầm:** `cleanDirectory` chỉ dọn `input/` và `output/` của từng job, không đụng `jobs/<caseId>/_library`.
- **Lỗi sau dispatch** (`coordinator:665-674`) hoàn credit, đặt job `failed`, rollback stage. Tải thư viện chạy trước `prepareSandbox` trong cùng khối `try`: tải hỏng tài liệu context thì bỏ qua và ghi cảnh báo (đã chốt), lỗi khác vẫn đi đường hoàn credit này.
- **Watchdog** (`coordinator:701`) không phụ thuộc CP, không cần sửa.
- **Bản chép tay "thiếu checkpoint = CP1"** có ba chỗ ngoài finalizer: `derive-stage-summaries:29`, và `admin-workers:531-535` (chạy lại chỉ biết CP2, còn CP khác rơi về mặc định) nên chuyển thành hook `rerunInput` của registry.
- **`derive-stage-summaries`** lặp theo `STAGES` dùng chung, chỉ có nhánh riêng cho CP2 (`answers_ready_*`); không cần đổi cho CP3/CP4 ngoài việc khai báo cờ sẵn sàng.
- **Lưu báo cáo** (`report.repository.ts:151-227`): `saveOmpAuditReport` mặc định kiểu CP1: không truyền `checkpointCode`/`reportType` thì dùng `report_type: "input_clarification"` và `resolveOmpAuditCheckpoint` (tìm theo unit, rồi `current_checkpoint`, rồi checkpoint mới nhất, cuối cùng **tạo CP1**). Chỉ CP2 truyền cả hai. Caller production **chỉ một**: `finalizer:291`; `assessment-routing.test.ts` có 5 chỗ gọi và đang khóa hành vi mặc định cũ. Sửa: registry luôn truyền cả hai, bỏ đường mặc định và `resolveOmpAuditCheckpoint`, cập nhật test routing theo (test hiện khóa hành vi sắp bị bỏ). `findLatestCp2FullReport` cũng riêng CP2, dùng bởi resubmit.
- **Web (`apps/web-1`) không tổng quát cho CP3/CP4.** Đã grep, các chỗ cứng CP1/CP2: kiểu `"CP1" | "CP2"` (`TabReportFindings`, `StageGradingPanel`, `useTriggerAudit`), `useOpenCheckpoint` chỉ nhận `"CP2"`, `StageDetail` dựng payload riêng cho CP2 (`scope`, `input_source`, `change_summary`), `AuditConfirmModal` (`isCp2`), `result-runs` phân vòng chỉ bằng `isCp2ReportType` (nhị phân CP1/CP2), `report.utils` (nhãn theo `report_type`), `useCp2Audit`, `useCp2Readiness`, `useNextActions`, `GuidedTemplateGallery`. Quy tắc giao diện: không hiện "CP1..CP4" cho người dùng, dùng tên vòng (CP1 "Ý tưởng", CP2 "Thị trường"); CP3/CP4 chưa có tên vòng.
- **Kết luận:** "CP3/CP4 chỉ thêm một file" chỉ đúng cho API. Mở CP3/CP4 cho người dùng còn cần một lượt sửa web, chưa thiết kế, và cần tên vòng cho CP3/CP4 từ bạn. Ghi nhận: lượt implement này giữ nguyên hợp đồng API với web cho CP1/CP2 để web không vỡ.

---


## 4. Implementation considerations & risks

### 4.1 Thứ tự triển khai (chưa bắt đầu; chờ lệnh)
1. Test đặc tả CP1/CP2 (plan, nội dung sandbox, đường lỗi); chụp danh sách file sandbox CP1 hiện tại.
2. Registry không mặc định + hook `sandbox`, `instruction` (CP1 `promptFiles` rõ ràng, thêm `workflow_operator_rule` đứng đầu theo D9).
3. Hook finalizer.
4. Hook `preflight`, `optsSchema`, `jobInputExtras`.
5. `rerunInput`, dọn `?? "CP1"` còn lại.
6. Kiểm prompt lúc khởi động + slot CP3/CP4 (400 "chưa mở").

Mỗi bước một commit, chạy test API trước khi sang bước sau.

### 4.2 Rủi ro
- CP1 đang chạy mượt. Đổi sandbox/instruction CP1 là thay đổi hành vi thật (model được bảo đọc thêm `workflow_operator_rule_v1.md`). Cần so sánh trước/sau + smoke một job CP1 thật.
- Chuyển CP1 sang `promptFiles` rõ ràng có thể làm mất file model cần ngầm. Mới xác nhận `workflow_operator_rule_v1.md`; chưa mở `data/knowledge/AGENTS.md` để chắc không còn file khác.
- D3: job cũ thiếu `checkpoint` trong `input_json` lỗi thay vì chạy CP1. Cần kiểm job đang chờ trong queue + dữ liệu `ai_jobs` cũ trước khi bật.
- Hook finalizer động đến lưu báo cáo + PDF; sai ở đây ảnh hưởng dữ liệu đã lưu.
- Model có thể bỏ qua lệnh validator (cách B) → finalizer vẫn 422 + hoàn credit.

---

## 5. Success metrics & validation criteria (đề xuất, chưa đo)

| Tiêu chí | Cách kiểm |
|---|---|
| Không còn `=== "CPn"` / `?? "CP1"` ở coordinator, finalizer, job-spec-builder, trigger-opts, admin-workers ngoài file dịch vụ | grep + review |
| Sandbox CP1 chứa đúng `plan.prompts` (+ knowledge, `AGENTS.md`), không có `cp2_*.md` | test đặc tả so danh sách file trước/sau |
| Sandbox CP2 có `system_prompt/` đủ file, `AGENTS.md`, `tools/validate-cp2-report.mjs`; validator chạy được trong container API | smoke 1 job CP2 thật |
| API không start khi thiếu prompt của dịch vụ đã đăng ký | test khởi động với thư mục prompt thiếu file |
| Mã checkpoint chưa đăng ký (CP3/CP4) → 400, không rơi về CP1 | test trigger |
| Thêm dịch vụ mới = một file dịch vụ + prompt, không sửa coordinator/finalizer | review khi có CP3 |
| Diff `apps/worker-omp` bằng 0 | `git diff` |
| Test API hiện có (CP1 + CP2) vẫn pass sau từng bước | `tsx --test` + `tsc --noEmit` |

---

## 6. Next steps & dependencies

**Của bạn:** ~~đưa 4 file `cp2_*.md` lên VPS~~ đã làm (hash khớp repo, xem 1.2b). Deploy bị chặn vì prod tốn tiền thật mua lượt và làm rác DB: sửa và kiểm hết ở local trước, gom thành một lần build image (image lớn), rồi mới tính deploy `fix/cp2-sandbox-schema-guard` và `feat/attachment-manifest`. Prod cũng cần kiểm: image worker trên VPS có phải bản trước JobSpec không (image local tạo 12/10 11:21 UTC, trước `fa09978`).

**Sau khi deploy:**
- Chạy thêm job CP2; kiểm sandbox có `AGENTS.md` và `tools/validate-cp2-report.mjs`, validator chạy được trong container API (xem mục 5).
- Chạy lại đúng input của `3cf8c8f1` (hoặc nhiều job) để đo tỷ lệ đúng schema khi có prompt.
- Chấm lại `3cf8c8f1` để có kết quả hợp lệ. Đọc `report.md` của `9313b3dc` rồi mới quyết.

**Kiến trúc:** triển khai 6 bước ở 4.1 khi bạn cho phép.

**Việc nhỏ chưa làm:**
- Lưu báo cáo lỗi + danh sách lỗi vào kết quả job (hiện chỉ log `path/code`).
- Siết zod `calcChecks`, `itemReviews`, `reaudit` (hiện passthrough); cần đọc code render PDF/UI trước.
- Cutover worker khi queue prod drain: `plans/261012-worker-jobspec/phase-03-cutover.md`.
- Chính sách quote không khớp (hiện chỉ gắn cờ `evidenceUnverified`, không ảnh hưởng điểm).
- Cách `data/` trên VPS được cập nhật khi deploy: chưa thấy bước nào trong `Makefile`.

**Bạn viết:** rubric, tiêu chí, ngưỡng, schema báo cáo, prompt CP3/CP4. Chưa quyết: `persistence` CP3/CP4 là `unit` hay `per-trigger` (phụ thuộc rubric).

**Phân loại file (mục 1.6): đã triển khai** trên nhánh `feat/attachment-manifest` (xếp trên `fix/cp2-sandbox-schema-guard`, chưa push), cả CP1 và CP2:
- `lecturer_guidance`, `interview_survey` đã thêm vào `DOCUMENT_CATEGORY_CODES`.
- Manifest `input/attachments_manifest.json` do `attachment-manifest.ts` tạo, ghi trong `assembleCp1InputFiles` và `assembleCp2InputFiles`; instruction CP1/CP2 bảo model đọc manifest trước và coi nhãn là tự khai (D14).
- **Va chạm tên file đã sửa** (commit `e065888`): trước đó CP1 ghi upload bằng tên gốc nên upload tên `attachments_manifest.json` hoặc trùng file hệ thống (`intake_submission.md`, `cp1_answers.md`, `previous_report.*`, `change_summary.md`, `team_fit_report.md`) ghi đè nhau, hai upload cùng tên làm hai mục manifest trỏ cùng nội dung, và tên chứa `../` có thể thoát khỏi `input/`. Nay `uniqueSandboxName` làm sạch tên, so sánh không phân biệt hoa thường, thêm tiền tố `<id8>` khi trùng; CP1 giữ trước tên hệ thống + tên manifest (`reservedInputNames`). CP2 dùng cùng hàm (tên trùng nay là `<id8>_<tên>`, bỏ `seq`). Hành vi CP1 đổi: file người dùng trùng tên file hệ thống bị đổi tên thay vì ghi đè.
- Test: `attachment-manifest.test.ts` (3 ca) + `attachment-manifest-sandbox.test.ts` (2 ca, chạy `appendDocFiles` CP1 → `prepareSandbox` thật vào thư mục tạm với `fetch` giả: trùng tên, trùng tên manifest, trùng tên file hệ thống, `../`). Test liên quan pass, `tsc` API và web sạch. Chưa có test cho `assembleCp1InputFiles`/`assembleCp2InputFiles` đầy đủ (gọi DB). **Chưa chạy job thật**: chưa biết model có đọc/dùng manifest không.
- Còn mở: có lọc danh mục theo giai đoạn không (modal dùng chung, mã mới hiện cả ở CP1); `business_model_canvas` chờ rubric CP3; `missingCategories` trên UI sẽ liệt kê hai nhãn mới là "chưa có" ở mọi giai đoạn (chưa xem cách hiển thị).

### Chưa kiểm
- **Kiểm local (không đụng prod, không qua worker/Redis/DB):** sandbox dựng bằng đúng code API (`prepareSandbox`, `buildCp2AgentsMd`, validator, manifest) từ input job `5196feab`, rồi chạy CLI `omp` trực tiếp với `OMP_MODEL` local. 1 job, `omp` thoát 0. **Đã chứng minh:** `report.json` có `schema: cp2_full_v1`, `checks` mảng 30 tiêu chí, không `guidance_warning`, và validator tôi chạy lại bên ngoài trả `OK`. **Chưa chứng minh:** model có đọc manifest và có tự chạy validator hay không. Chỉ có số lần chuỗi `validate-cp2-report`, `attachments_manifest`, `AGENTS.md` xuất hiện trong log JSON (grep), mà chuỗi đó cũng nằm trong instruction, nội dung `AGENTS.md` và output công cụ, nên không phải số lần thực thi; không đếm được lại vì sandbox và log đã xóa. Image API build local: `validate-cp2-report.mjs` có trong `packages/validation/dist` và `createRequire` resolve đúng. Giới hạn: 1 lần chạy, nhãn danh mục trong manifest do tôi gán tay theo tên file (không qua modal/DB); chưa chạy đường trigger → coordinator → worker → finalizer; worker local là image cũ (trước `fa09978`, không có JobSpec), chưa dùng.
- Lỗi tìm được khi smoke: `tsup` chính có `clean: true` nên mọi lần build/watch `@repo/validation` xóa `validate-cp2-report.mjs`, sandbox CP2 `throw` "Sandbox tool missing". Đã sửa: `onSuccess` trong `tsup.config.ts` dựng lại CLI sau mỗi lần build, `build` chỉ còn `tsup`.
- Chưa biết tỷ lệ model đúng schema qua nhiều job (mới 2 job đúng: `5196feab` trên prod, 1 job local).
- Số nhánh `CP1/CP2` từ grep chỉ trong `apps/api/src`; chưa soi `apps/web-1`, phần còn lại của `derive-stage-summaries.ts`, `ai-audit-order.listener.ts`.
- Chưa đọc: coordinator dòng 600-776 (dispatch, nhánh lỗi sau dispatch), nội dung `saveOmpAuditReport`, `renderStageAnswers`, `ai-job.repository:158`, `derive-stage-summaries`, `admin-workers:533`. Chưa xác nhận ai đọc `input_source`, `change_summary`, `user_note` từ `input_json` ngoài assembler.
- Chưa đọc `document-groups.ts` (nhóm tài liệu theo nhãn): chưa biết nhãn mới có sinh nhóm mới trên UI không. Chưa quyết modal giai đoạn có lọc danh mục theo giai đoạn không (hiện dùng chung một danh sách, mã mới sẽ hiện cả ở CP1 intake).
- Lợi ích "bớt suy luận phân loại file" chưa đo: không có log suy luận của model. Job `5196feab` cho thấy model đã không trích quote từ rubric/đề bài (39 quote từ báo cáo, 4 từ phỏng vấn, 0 từ 2 file tiêu chuẩn) nên chưa có bằng chứng model từng nhầm.
- Chưa chạy sandbox CP1 thật để xác nhận hiện chứa `cp2_*.md`.
- Chưa đo token thật của prompt CP2.
- Dump VPS lấy lúc Oct 20 18:55 (lần đầu) và 19:46 (lần sau, có job `5196feab`); VPS thật có thể đã khác.
- Chưa biết image API trên VPS là bản nào (compose chỉ ghi `lgdlong/nexus-api:latest`; dump không có digest hay log deploy). Chưa xác định được nhánh `fix/cp2-sandbox-schema-guard` đã deploy hay chưa.
- `NX-252880` và `tedi_thi_truong_lan_dau_20261020194223.pdf` không có trong dump; chưa đối chiếu được với job `5196feab`.

### D9 đã làm (2026-10-20)
- `workflow_operator_rule_v1.md` đứng đầu danh sách prompt của cả 6 tổ hợp CP1 (`packages/shared/src/audit-checkpoints.ts`); hook `sandbox` CP1 trả `promptFiles: plan.prompts`; `cp1Instruction` bảo model đọc tệp đầu trước.
- Trước: `system_prompt/` của CP1 chứa cả 11 file trong `data/system-prompts` (kể cả `cp2_*.md`, file lite). Sau: chỉ 3-5 file của đúng tổ hợp (smoke 6 tổ hợp: có `AGENTS.md`, `knowledge/` 2 file). `data/knowledge/AGENTS.md` chỉ tham chiếu `triad_framework_v1_1.md` và prompt được giao, không có file ngầm khác.
- Chưa kiểm: chưa chạy job CP1 thật; chưa biết model CP1 đổi hành vi thế nào khi đọc thêm file này.
