# Brainstorm report: lỗi CP2 + kiến trúc dịch vụ chấm (CP1–CP4) — 2026-10-20

File duy nhất cho chủ đề này. Trạng thái: sửa lỗi CP2 xong (`fix/cp2-sandbox-schema-guard`) và kiến trúc dịch vụ chấm đã triển khai phía API (`feat/attachment-manifest`, xếp chồng, chưa push/merge): registry hook, `_library` + `context/` + manifest `stage`/`role`, lưu báo cáo không mặc định CP1, D9. Prompt CP2 đã lên VPS và 1 job CP2 chạy đúng schema (mục 1.2b). Chưa chạy job `omp` thật trên code mới; guard (`AGENTS.md`, validator) chưa quan sát được trên prod; web CP3/CP4 chưa làm (D20).

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

### 3.7 Thiết kế chốt: thư viện tài liệu theo case (bạn chọn; đã code: `case-library.ts`)
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

### 4.1 Thứ tự triển khai (đã triển khai phía API trên `feat/attachment-manifest`, chưa push; xem "Trạng thái triển khai" ở cuối mục 6)
1. Test đặc tả CP1/CP2 (plan, nội dung sandbox, đường lỗi); chụp danh sách file sandbox CP1 hiện tại.
2. Registry không mặc định + hook `sandbox`, `instruction` (CP1 `promptFiles` rõ ràng, thêm `workflow_operator_rule` đứng đầu theo D9).
3. Hook finalizer.
4. Hook `preflight`, `optsSchema`, `jobInputExtras`.
5. `rerunInput`, dọn `?? "CP1"` còn lại.
6. Kiểm prompt lúc khởi động + slot CP3/CP4 (400 "chưa mở").

Mỗi bước một commit, chạy test API trước khi sang bước sau.

### 4.2 Rủi ro
- CP1 đang chạy mượt. Đổi sandbox/instruction CP1 là thay đổi hành vi thật (model được bảo đọc thêm `workflow_operator_rule_v1.md`). Cần so sánh trước/sau + smoke một job CP1 thật.
- (Đã xử lý) Chuyển CP1 sang `promptFiles` rõ ràng: đã mở `data/knowledge/AGENTS.md`, chỉ tham chiếu `triad_framework_v1_1.md` và prompt được giao; không còn file ngầm khác (xem "D9 đã làm"). Còn lại: chưa biết model CP1 đổi hành vi thế nào (cần job thật).
- (Đã xử lý) D3: job cũ thiếu `checkpoint` trong `input_json` không còn lỗi mà được coi là CP1 qua một hàm duy nhất `runningCheckpointCode` (D17), dùng ở finalizer, `derive-stage-summaries`, `admin-workers`. Chưa kiểm dữ liệu `ai_jobs` cũ và job đang chờ trong queue trên prod.
- Hook finalizer động đến lưu báo cáo + PDF; sai ở đây ảnh hưởng dữ liệu đã lưu.
- Model có thể bỏ qua lệnh validator (cách B) → finalizer vẫn 422 + hoàn credit.

---

## 5. Success metrics & validation criteria (trạng thái đo 2026-10-20)

| Tiêu chí | Cách kiểm | Trạng thái |
|---|---|---|
| Không còn `=== "CPn"` / `?? "CP1"` ở coordinator, finalizer, job-spec-builder, trigger-opts, admin-workers ngoài file dịch vụ | grep | **Đạt**: grep 5 file không còn kết quả. Còn `stage.code === "CP2"` ở `derive-stage-summaries.ts:89-90` (trạng thái sẵn sàng cho web, giữ nguyên) |
| Sandbox CP1 chứa đúng `plan.prompts` (+ knowledge, `AGENTS.md`), không có `cp2_*.md` | test + so danh sách trước/sau | **Đạt**: test `audit-services.test.ts`; baseline trước 11 file, sau 3-5 file |
| Sandbox CP2 có `system_prompt/` đủ file, `AGENTS.md`, `tools/validate-cp2-report.mjs`; validator chạy được trong container API | smoke 1 job CP2 thật | **Một phần**: sandbox dựng đúng (smoke local), validator chạy được trong image API (đã kiểm); chưa có job CP2 thật qua worker mới |
| API không start khi thiếu prompt của dịch vụ đã đăng ký | test khởi động | **Đạt**: test boot guard (`assertAuditPromptsPresent`) |
| Mã checkpoint chưa đăng ký (CP3/CP4) → 400, không rơi về CP1 | test trigger | **Đạt**: test `TriggerOptsSchema` + `getAuditService` |
| Thêm dịch vụ mới = một file dịch vụ + prompt, không sửa coordinator/finalizer | review khi có CP3 | **Chưa đo** (cần CP3); thực tế còn thêm hàng `AUDIT_CHECKPOINTS` + khóa registry (xem "Lệch có chủ ý") |
| Diff `apps/worker-omp` bằng 0 | `git diff` | **Đạt về mã**: `git diff fa09978 HEAD -- apps/worker-omp` chỉ còn `AGENTS.md` (tài liệu), không có file `src` |
| Test API hiện có (CP1 + CP2) vẫn pass sau từng bước | `tsx --test` + `tsc --noEmit` | **Một phần**: `tsc` sạch, test vùng đổi pass; chưa chạy toàn bộ test API (theo ý bạn) |

---

## 6. Next steps & dependencies

**Của bạn:** ~~đưa 4 file `cp2_*.md` lên VPS~~ đã làm (hash khớp repo, xem 1.2b). Deploy bị chặn vì prod tốn tiền thật mua lượt và làm rác DB: sửa và kiểm hết ở local trước, gom thành một lần build image (image lớn), rồi mới tính deploy `fix/cp2-sandbox-schema-guard` và `feat/attachment-manifest`. Prod cũng cần kiểm: image worker trên VPS có phải bản trước JobSpec không (image local tạo 12/10 11:21 UTC, trước `fa09978`).

**Sau khi deploy:**
- Chạy thêm job CP2; kiểm sandbox có `AGENTS.md` và `tools/validate-cp2-report.mjs`, validator chạy được trong container API (xem mục 5).
- Chạy lại đúng input của `3cf8c8f1` (hoặc nhiều job) để đo tỷ lệ đúng schema khi có prompt.
- Chấm lại `3cf8c8f1` để có kết quả hợp lệ. Đọc `report.md` của `9313b3dc` rồi mới quyết.

**Kiến trúc:** phía API đã triển khai (xem "Trạng thái triển khai" ở cuối). Còn lại: web CP3/CP4 (D20, cần tên vòng), rubric/prompt CP3/CP4 (bạn viết), job thật qua worker mới.

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
- Đã soi `apps/web-1` và các file API còn lại (xem "Khảo sát web-1 và API còn lại" ở cuối). `ai-audit-order.listener.ts` không có nhánh `CP1|CP2`.
- Đã đọc nốt: `saveOmpAuditReport`, `ai-job.repository`, `derive-stage-summaries`, `admin-workers:533`. Người đọc `input_source`, `change_summary`, `user_note` từ `input_json`: chỉ `audit-services.ts` (ghi + `rerunInput`), coordinator (nhận), assembler CP2 và `omp-audit-status.ts` (hiển thị lại). Không có người đọc ngoài các chỗ này.
- `document-groups.ts` đã đọc: nhãn mới không sinh nhóm mới; `missingCategories` chỉ ra dòng gợi ý "Có thể thêm: ..." (không phải "thiếu") nên hai nhãn mới xuất hiện ở mọi giai đoạn không gây hiểu lầm. Modal tải lên và bước intake dùng chung `DOCUMENT_CATEGORY_CODES`, nên hai mã mới hiện ở cả CP1 intake; chưa quyết có lọc theo giai đoạn không.
- Lợi ích "bớt suy luận phân loại file" chưa đo: không có log suy luận của model. Job `5196feab` cho thấy model đã không trích quote từ rubric/đề bài (39 quote từ báo cáo, 4 từ phỏng vấn, 0 từ 2 file tiêu chuẩn) nên chưa có bằng chứng model từng nhầm.
- (Đã làm, xem "Trạng thái triển khai") sandbox CP1 trước đây chứa cả `cp2_*.md`: đã dựng lại bằng code cũ, 11 file gồm 4 file `cp2_*`.
- Chưa đo token thật của prompt CP2.
- Dump VPS lấy lúc Oct 20 18:55 (lần đầu) và 19:46 (lần sau, có job `5196feab`); VPS thật có thể đã khác.
- Chưa biết image API trên VPS là bản nào (compose chỉ ghi `lgdlong/nexus-api:latest`; dump không có digest hay log deploy). Chưa xác định được nhánh `fix/cp2-sandbox-schema-guard` đã deploy hay chưa.
- `NX-252880` và `tedi_thi_truong_lan_dau_20261020194223.pdf` không có trong dump; chưa đối chiếu được với job `5196feab`.

### D9 đã làm (2026-10-20)
- `workflow_operator_rule_v1.md` đứng đầu danh sách prompt của cả 6 tổ hợp CP1 (`packages/shared/src/audit-checkpoints.ts`); hook `sandbox` CP1 trả `promptFiles: plan.prompts`; `cp1Instruction` bảo model đọc tệp đầu trước.
- Trước: `system_prompt/` của CP1 chứa cả 11 file trong `data/system-prompts` (kể cả `cp2_*.md`, file lite). Sau: chỉ 3-5 file của đúng tổ hợp (smoke 6 tổ hợp: có `AGENTS.md`, `knowledge/` 2 file). `data/knowledge/AGENTS.md` chỉ tham chiếu `triad_framework_v1_1.md` và prompt được giao, không có file ngầm khác.
- Chưa kiểm: chưa chạy job CP1 thật; chưa biết model CP1 đổi hành vi thế nào khi đọc thêm file này.

### Trạng thái triển khai (phía API, 2026-10-20)
**Đã làm:** D3, D5–D9, D11–D20. Registry hook `audit-services.ts` (planScope, normalizeSubmissionType, optsIssues, preflight, jobInputExtras, rerunInput, sandbox, instruction, reportMdName, lifecycleUnit); `case-library.ts` (`_library` khóa theo URL, ghi nguyên tử, `context/<stage>_answers.md`); manifest có `stage`/`role`; `saveOmpAuditReport` bắt buộc `checkpointCode` + `reportType`; kiểm prompt lúc boot (`assertAuditPromptsPresent`); `isContextSource` chặn bằng chứng trích từ `context/` hoặc `_library/`.

**Lệch có chủ ý so với bản thiết kế (mỗi mục: thiết kế nói gì, làm gì, vì sao, giới hạn):**

1. **Luật bằng chứng (3.7: "tra manifest, chỉ nhận `role: submission`") → chặn theo đoạn đường dẫn.**
   - *Làm:* `isContextSource` (`cp2-quote-verify.ts`) chuẩn hóa nguồn được trích (giải `%xx`, `\` thành `/`, bỏ hoa thường) rồi từ chối nếu có đoạn `context` hoặc `_library`, kiểm **trước** bước khớp tên tệp và bước "tìm quote ở bất kỳ submission nào". Có test cho 8 biến thể đường dẫn.
   - *Vì sao không tra manifest:* (a) `verifyCp2Quotes` là hàm thuần chỉ nhận quote và văn bản; tra manifest buộc phải đọc và truyền manifest vào, rồi khớp đường dẫn người trích với `file` trong manifest, mà tên trong `_library` có tiền tố băm còn model hay trích tên gốc nên dễ không khớp. (b) Khi tra manifest mà không khớp thì rơi về nhánh "tìm ở bất kỳ đâu" (đúng lỗ hổng cần chặn); luật theo đường dẫn từ chối bất kể có khớp manifest hay không, nên an toàn theo hướng đóng. (c) Hai thư mục này chỉ chứa tài liệu `role: context`, nên hai cách cho cùng kết quả với bố cục hiện tại.
   - *Giới hạn / khi nào đổi:* luật dựa vào quy ước bố cục thư mục. Nếu một giai đoạn sau đặt tài liệu context ngoài `context/` và `_library/`, phải chuyển sang tra `role` trong manifest. Tệp nộp của nhóm nằm phẳng trong `attachments/` (tên đã làm sạch bằng `basename`), nên không thể trùng đoạn `context`.

2. **"Thêm dịch vụ mới chỉ một file" (D16) → chỉ đúng với coordinator, finalizer, admin.**
   - *Làm:* thêm dịch vụ = (i) một hàng trong `AUDIT_CHECKPOINTS` (prompt, output, loại báo cáo, bước tiến trình), (ii) một entry trong `audit-services.ts`, (iii) khóa `INPUT_ASSEMBLERS` / `POST_PROCESSORS` trong `audit-registry.ts`, (iv) phía web. Coordinator, finalizer, `job-spec-builder`, `trigger-opts`, `admin-workers` không phải sửa.
   - *Vì sao:* D7 giữ bảng `AUDIT_CHECKPOINTS` trong `@app/shared` vì worker legacy còn đọc (`apps/worker-omp/src/omp-runner.ts` dòng 95 và 107). Bỏ bảng khỏi `@app/shared` buộc sửa worker và build lại image, trái D8 ("worker không đổi", image lớn, build một lần). D16 và D7 mâu thuẫn một phần; tôi giữ D7/D8 vì chúng là ràng buộc cứng, còn "một file" là mục tiêu thuận tiện.
   - *Bảo vệ:* `Record<AuditCheckpointCode, AuditService>` làm `tsc` báo lỗi khi bảng có mã mà thiếu service; test "table integrity" bắt thiếu khóa assembler/post-processor hoặc thiếu file prompt; boot guard bắt prompt chưa lên server.
   - *Khi nào đổi:* sau cutover worker (`plans/261012-worker-jobspec/phase-03-cutover.md`) khi bỏ nhánh legacy, có thể chuyển bảng vào API và gộp (i) với (ii).

3. `TriggerOptsSchema` vẫn mặc định `checkpoint = CP1` cho body không có `checkpoint`: đó là hợp đồng API với web (D20 giữ nguyên), không phải mặc định ngầm; mọi nơi khác không còn mặc định.
4. Slot CP3/CP4: không có entry (D6). Mã ngoài `AUDIT_CHECKPOINTS` bị 400 ở `TriggerOptsSchema`; mã có trong bảng mà thiếu service bị 400 ở `getAuditService` (và `tsc` không cho thiếu).

**Đã kiểm:** `tsc` API sạch; test vùng đổi pass (`audit-services`, `audit-service-flow`, `cp2-audit-quotes`, `cp2-audit-trigger`, `assessment-routing`, `attachment-manifest*`, `prepare-sandbox-prompts`). Smoke local lắp sandbox CP1/CP2 từ DB local (case có CP1 + CP2). DB local: 8/8 report CP1 có lifecycle unit thuộc checkpoint CP1 và 9/9 report `input_clarification` nằm ở checkpoint CP1, nên đổi sang `ensureCheckpoint("CP1")` không đổi nơi lưu với dữ liệu này.

**Baseline sandbox CP1 (dựng lại, không sửa working tree):** coordinator ở commit `0c13e1f` dựng CP1 với `sandboxOpts = {}`; `prepareSandbox` và `data/` không đổi từ commit đó. Chạy `prepareSandbox(dir, [], {})` cho `system_prompt/` = cả 11 file (`cp2_*` x4, `input_clarification_gate_*` x5, `triad_framework_v1_1.md`, `workflow_operator_rule_v1.md`), có `AGENTS.md`, `knowledge/` 2 file. Sau D9 mỗi tổ hợp chỉ còn 3-5 file, vẫn có `AGENTS.md` và `knowledge/`.

**Test `preflight` CP1** (nhánh 409): `audit-service-flow.test.ts`, chạy hai tiến trình với `AUDIT_STAGE_INPUT_RULES=false` (report đã có -> 409; override, resubmit, chưa có report, chưa có intake unit -> qua) và `=true` (không chặn, không truy vấn report). Cả hai pass.

**Chưa kiểm:** model có tự chạy validator hay không (log worker chỉ có mức dùng token, không có tên công cụ); model CP1 có đọc `workflow_operator_rule_v1.md` hay không; chưa chạy toàn bộ test API theo yêu cầu.

### Kết quả chạy job thật trên local (2026-10-20, worker đã build lại)
Case `1ed757c0`, model `openai-codex/gpt-5.6-luna:low`. Job CP1 `5e6f396e`, job CP2 `8f69ebb5`, cả hai `completed`, `omp` thoát 0.
- **CP2:** sandbox đúng thiết kế (`AGENTS.md`, `tools/validate-cp2-report.mjs`, 2 prompt, `input/attachments/`, `input/context/cp1_answers.md`, manifest 4 `submission` + 2 `context`, `_library` cấp case có 1 tài liệu CP1). Model đọc `attachments_manifest.json` đầu tiên rồi `cp1_answers.md` (log worker). `report.json` = `cp2_full_v1`, 30 tiêu chí, validator `OK`, lưu đúng CP2 / `cp2_full`. Mọi trích dẫn (29 + 1) đến từ tệp nộp, không có trích dẫn nào từ `context/` hay `_library/`.
- **CP1:** `system_prompt/` còn 3 file (job CP1 cũ `75ae47eb` chạy code cũ có 11 file, trong đó 4 file `cp2_*`): D9 có hiệu lực thật. Workflow 2 bước vẫn chạy (`triad_handoff_packet.md`, `input_clarification_audit.md`, `report.json` cùng cấu trúc, cùng verdict). Model đọc manifest đầu tiên. Danh sách `input/` giống job cũ (CP1 vốn đọc cả tài liệu và báo cáo của CP2: hành vi có từ trước), thêm manifest và một tệp trùng tên giờ được giữ cả hai thay vì ghi đè.
- **Lỗi có từ trước, đã sửa:** job CP1 chạy xong, trừ 1 credit nhưng **không lưu báo cáo**. Nguyên nhân: finalizer có quy tắc "mỗi lifecycle unit tối đa một báo cáo `initial`" (có ở `b785160`), trong khi `AUDIT_STAGE_INPUT_RULES=true` cho chấm lại `initial` từ trang stage. Bạn chọn hướng 1 (lưu bản chấm lại): bỏ quy tắc đó trong transaction; nhánh "đã finalize" ở đầu hàm đổi sang khớp theo `triggerStartedAt` (chống vào lại do polling) thay vì "unit đã có báo cáo nào". Idempotence theo trigger giữ nguyên.
- **Lỗi phụ lộ ra khi sửa:** `upsertReportArtifactDocumentRecord` ghi cứng `seq: 0`, trùng khóa unique `(lifecycle_unit_id, doc_type, seq)` khi một unit có báo cáo thứ hai, nên PDF không hiện ở tab "Tài liệu" (chỉ cảnh báo, không lỗi). Nay cấp `seq` kế tiếp theo unit khi tạo, `is_primary` chỉ cho `seq 0`. Việc cấp `seq` chạy ngoài transaction tạo báo cáo (không giữ khóa case), nên hai finalizer của cùng unit có thể chọn trùng: bên thua gặp lỗi unique `P2002` và tính lại, tối đa 3 lần; có test đua hai finalizer.
- **Kiểm sau sửa (local, đã chạy):** finalize lại job `5e6f396e` tạo đúng 1 báo cáo CP1 mới (`5a5548dc`) kèm artifact `seq 1`, không còn cảnh báo; finalize lần hai (vào lại) không tạo thêm báo cáo hay artifact. Test hồi quy `report-artifact-seq.test.ts`. Báo cáo này nay tồn tại trong DB local do chính lần kiểm này tạo, không phải do worker. Luồng finalize qua worker thật + polling chưa chạy lại.

### Khảo sát web-1 và API còn lại (2026-10-20, chỉ đọc, không sửa)
Mục đích: biết web phải đổi những gì khi mở CP3/CP4 (D20). Web không generic theo registry; mọi nhánh dưới đây gắn cứng `CP1|CP2`.

| Nhóm | File | Gắn cứng | Khi mở CP3/CP4 |
|---|---|---|---|
| Gửi chấm | `StageDetail.tsx:83`, `useTriggerAudit.ts:13`, `useCp2Audit.ts:16`, `StageGradingPanel.tsx:15,85,111-113` | kiểu `"CP1"\|"CP2"`; payload CP2 (`scope`, `input_source`, `change_summary`, `user_note`) chỉ dựng khi `stage.code === "CP2"` | Mở rộng kiểu + dựng payload theo dịch vụ; tên `scope`/`input_source` của CP3/CP4 do rubric quyết |
| Mở checkpoint | `useOpenCheckpoint.ts:14` (`code: "CP2"`), `GuidedTemplateGallery.tsx:27-48,65` (`CP2_CODE`, `needsStart`) | chỉ CP2 có bước "Bắt đầu" | Tổng quát hóa kiểu `code`; quyết CP3/CP4 có bước mở riêng không |
| Xác nhận chấm | `AuditConfirmModal.tsx:48` (`isCp2`), `Cp2PackageCard.tsx`, `CreditQuantityModal.tsx:47` (`PACKAGE_KEYS.CP2_AUDIT`), `lib/pricing.ts:6` | gói/giá CP2 | Cần `PACKAGE_KEYS` và gói mới cho CP3/CP4 |
| Sẵn sàng | `useCp2Readiness.ts:5,16`, `Cp2SelfCheck.tsx`, `GuidedDocumentsEditor.tsx:135` (`templateKey === "cp2"`), `answer-quality.ts` | readiness/tự kiểm CP2 | Mỗi CP mới cần luật readiness riêng (phụ thuộc rubric) |
| Lịch sử vòng | `TabReportFindings.tsx:28,70-85` (bộ lọc `"CP1"\|"CP2"`, nhãn "Vòng Ý tưởng/Thị trường"), `result-runs.ts:29` (`isCp2ReportType`), `report.utils.ts:17` (`CP2_REPORT_TYPE_LABELS`), `RoundCard.tsx`, `OverviewRecentReports.tsx` | bộ lọc 2 giá trị, nhãn theo loại báo cáo CP2 | Cần tên vòng CP3/CP4 và loại báo cáo mới |
| Điều hướng | `useNextActions.ts:57-60` (`start-cp1`), `StageFilesView.tsx:60` (cảnh báo riêng tư CP2) | rải rác | Rà lại từng chỗ |
| API | `derive-stage-summaries.ts:89-90` (`answers_ready_*` theo `stage.code === "CP2"`) | trạng thái sẵn sàng cho web | Chuyển vào dịch vụ khi CP3/CP4 có luật sẵn sàng |

Kết luận: không phát hiện chỗ web bị hỏng bởi thay đổi API lần này (API vẫn nhận body không có `checkpoint` là CP1; mọi trường CP2 giữ nguyên tên). Phần web cho CP3/CP4 là một đợt làm riêng, phụ thuộc tên vòng và rubric từ bạn. Luật UI "cấm CP1/CP2 trên giao diện" (`apps/web-1/AGENTS.md:168`) vẫn áp dụng cho tên vòng mới.

**Đã sửa ngay:** kiểu `"CP1" | "CP2"` ở `useTriggerAudit.ts` và `StageGradingPanel.tsx` đổi sang `AuditCheckpointCode` từ `@app/shared`, chỉ để đồng bộ nguồn kiểu (cùng tập giá trị hôm nay). `tsc` web sạch. **Không** bảo đảm báo lỗi khi thêm mã mới: các nhánh `checkpoint === "CP2"` / `stage.code === "CP2"` vẫn compile và mã mới sẽ rơi sang nhánh CP1 mà không có cảnh báo. Muốn `tsc` bắt được thì điểm dispatch phải dùng `Record<AuditCheckpointCode, …>` hoặc `switch` có kiểm tra exhaustive; việc đó thuộc đợt làm web CP3/CP4. **Cố ý không sửa** các nhánh còn lại: chúng là hành vi riêng của CP2 (payload, bước mở, gói giá, readiness, nhãn vòng), viết trước khi có định nghĩa CP3/CP4 sẽ là đoán.

### Job CP1 chạy lại sau sửa finalizer (`7cfa3978`, 2026-10-20)
- **Finalize qua worker thật đạt:** `completed`, báo cáo mới `cc613715` lưu đúng unit, có `audit_completed`, artifact `seq 2` (sau `seq 0` và `seq 1`), không cảnh báo. Ba báo cáo `initial` của unit nay cùng tồn tại.
- **Manifest, prompt, workflow:** đọc manifest đầu tiên; `system_prompt/` 3 file; output đủ `triad_handoff_packet.md`, `input_clarification_audit.md`, `report.json`.
- **Lỗi có từ trước, lộ rõ khi chấm lại:** `input/` của CP1 chứa 4 PDF báo cáo cũ (`tiboo_y_tuong_lan_dau_*` x2, `tiboo_thi_truong_lan_dau_*`, `tedi_cp2_full_*`), manifest gắn `role: submission`. Chúng có `doc_type = assessment_report` nhưng `source_kind = cloudinary`, nên không bị `SUBMITTED_DOC_EXCLUDED_KINDS` (`generated`, `system_generated`) loại. Mỗi lần chấm lại thêm một PDF nữa: CP1 đọc chính kết luận cũ của nó (và báo cáo CP2) như bằng chứng của nhóm. Job CP1 cũ `75ae47eb` (code cũ) đã có 2 PDF kiểu này.
- **Đã sửa:** `cp1-audit-input.ts` loại `doc_type = assessment_report` ở nhánh `initial` và nhánh theo unit (`resubmit`, `logic_check`). Kiểm trên case thật: `input/` còn tệp nhóm + `intake_submission.md`, `cp1_answers.md`, manifest, không còn PDF báo cáo. Test hồi quy `cp1-report-artifacts.test.ts` (2 ca).
- **Chưa sửa, cần bạn quyết:** nhánh `initial` của CP1 vẫn lấy mọi tài liệu của case, không giới hạn theo giai đoạn (`findDocumentRecordsByCaseId`), nên CP1 đọc cả tệp nộp cho CP2 (rubric CP2, `Inteview TEDI..docx`, `Nội dung CP1.txt`, `Paper Report v5.docx` ở checkpoint CP2). Khi `AUDIT_STAGE_INPUT_RULES=true` ý định là chấm theo đầu vào của trang giai đoạn (`findStageDocs`), nhưng CP1 chưa theo. Đổi sang `findStageDocs("CP1")` đổi hành vi CP1 nên chưa làm. Job chưa chạy lại sau sửa này.

### Nguyên tắc đầu vào CP1: tài liệu tải lên khác tài liệu hệ thống sinh ra (bạn chốt, 2026-10-20)
- **Tài liệu tải lên** (nhóm đưa vào) là đầu vào. **Tài liệu hệ thống sinh ra cho nhóm** (PDF báo cáo chấm, bản xuất guided, file supporter, chứng từ thanh toán) không bao giờ là đầu vào, nên báo cáo chấm không đọc báo cáo chấm khác.
- **Chấm lần đầu bấm chấm lại** thường do lần trước thiếu file hoặc bấm nhầm, nhóm bổ sung rồi chấm cho đàng hoàng: lần sau đọc đúng các tệp nhóm đã tải lên, không đọc kết luận của lần trước.
- **Đã làm (`cp1-audit-input.ts`):** nhánh `initial` dùng `findStageDocs(caseId, "CP1")` (chỉ tệp nộp ở giai đoạn CP1, loại `STAGE_DOC_EXCLUDED_TYPES` và `generated`/`system_generated`); nhánh theo unit (`resubmit`, `logic_check`) loại cùng danh sách `doc_type`. Kết quả trên case thật `1ed757c0`: `input/` còn `intake_submission.md`, `cp1_answers.md`, `Paper Report v5.docx` (CP1) và manifest; không còn PDF báo cáo, rubric/phỏng vấn/`Nội dung CP1.txt` nộp cho CP2.
- **Đổi hành vi so với trước:** CP1 không còn đọc tệp nộp ở CP2 (thay đổi có chủ ý, theo nguyên tắc trên, áp dụng cả khi `AUDIT_STAGE_INPUT_RULES=false`). Tài liệu nằm ở checkpoint khác nhưng nhóm coi là của CP1 sẽ không được đọc nữa. Chưa chạy lại job CP1 thật sau thay đổi này.
- **Test:** `cp1-report-artifacts.test.ts` (3 ca, stub lọc theo đúng điều kiện truy vấn): chấm lần đầu chỉ đọc tệp CP1; chấm lại không đọc báo cáo cũ; `logic_check` loại báo cáo trong input và manifest.

### CP1 chấm lại có đối chiếu từ trang giai đoạn (bạn nêu, 2026-10-20)
- **Vấn đề:** bỏ cơ chế tự nhận "đã có kết quả thì là chấm lần sau", mà modal CP1 ép `submission_type = "initial"` và không có lựa chọn nào, nên CP1 không có đường chấm lần sau. API có `resubmit` cho CP1 nhưng chỉ chạy theo lifecycle unit của luồng upload bản sửa, từ trang giai đoạn sẽ bị 409 `RESUBMIT_REQUIRES_UPLOAD`.
- **Web:** modal CP1 có mục "Lần chấm này": *Chấm mới từ đầu* (mặc định, vì lần chấm thứ hai thường là bổ sung tệp quên) hoặc *Chấm lại sau khi sửa* (chỉ chọn được khi giai đoạn đã có kết quả) kèm ô "Bạn đã sửa gì". CP2 giữ nguyên (mặc định chấm lại khi đã có kết quả). `StageDetail` gửi `checkpoint: "CP1"` + `change_summary` khi có ghi chú.
- **API (`cp1-audit-input.ts`):** khi `AUDIT_STAGE_INPUT_RULES` bật và không có unit, `resubmit` đọc tệp nhóm đang có ở giai đoạn CP1 (`findStageDocs`) + `previous_report.md/.json` (báo cáo CP1 gần nhất, đã loại CP2) + `change_summary.md` (lời nhóm, hoặc câu mặc định nếu để trống). Báo cáo nền chọn giống cách trang giai đoạn bật nút (báo cáo mới nhất dưới checkpoint CP1, mọi trạng thái, không chỉ `APPROVED`); không có kết quả trước thì 409 `RESUBMIT_REQUIRES_PREVIOUS_REPORT` (job được hoàn credit). Cờ tắt hoặc có unit: giữ đường cũ theo unit. `audit-services.ts` lưu `change_summary` vào job; hằng `NO_CHANGE_SUMMARY_TEXT` dùng chung CP1/CP2.
- **Test:** `cp1-stage-resubmit.test.ts` (4 ca, chạy ở cả hai chế độ cờ). Smoke trên case thật `1ed757c0` (assemble, không chạy model).
- **Chưa kiểm:** chưa chạy job CP1 `resubmit` thật qua worker; chưa biết model đọc `previous_report.md` và `change_summary.md` đúng cách với prompt `input_clarification_gate_v4_1_resubmit.md` (prompt viết cho luồng unit cũ); chưa mở UI để xem modal; chưa kiểm preflight CP1 ở cờ bật với `resubmit` (luôn qua).
- **Chưa làm:** ô "Ghi chú thêm" (`user_note`) cho CP1, chỉ CP2 có.
