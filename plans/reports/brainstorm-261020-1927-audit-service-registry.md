# CP2 checkpoint — 2026-10-20

Trạng thái: phân tích xong, 3 việc nhỏ đã sửa và commit trên nhánh `fix/cp2-sandbox-schema-guard` (mục 9), lỗ hổng thư mục prompt đã vá, chưa chạy job CP2 thật. Chưa push.

## 1. Lỗi gốc (đã xác nhận bằng dữ liệu prod)

Job `3cf8c8f1` lỗi `CP2_REPORT_INVALID` vì AI viết `schema_version: cp2_full_review_v1` + `automatic_failure_checks.checks`.

**Nguyên nhân thật: prompt CP2 không có trên VPS.**
- `report.json` của job tự khai `guidance_warning`: thiếu `system_prompt/cp2_audit_core_v1.md` và `cp2_full_review_v1.md`.
- Dump VPS `data/system-prompts/` chỉ có 7 file CP1, không có `cp2_*.md`.
- Compose prod gắn `./data:/app/data:ro` cho API và worker. Image API không `COPY data`. Deploy API không đưa prompt lên.
- `prepareSandbox` chỉ `logger.warn` khi thiếu prompt, vẫn chạy và đã trừ credit.
- Đã copy 4 file `cp2_*.md` vào dump local `nexus-platform-prod-vps/data/system-prompts/` (hash khớp repo). **Chưa lên VPS thật.**

Phạm vi ảnh hưởng: chỉ job `3cf8c8f1` xác nhận chấm khi thiếu prompt. Job `9313b3dc` có `report.json` khác cấu trúc, không có lời khai prompt: chưa kết luận. Job `cd3048d4`, `fb640695` không có `output/`.

## 2. Kiến trúc đã xác nhận

- Worker = engine. API gửi JobSpec (`instruction`, `requiredOutputs`, `optionalOutputs`, `milestones`), worker không chứa nghiệp vụ. Sửa dịch vụ = deploy API, không build lại image worker (`apps/worker-omp/AGENTS.md:37-52`).
- Một request = payload BullMQ nhỏ + thư mục sandbox trên volume `./storage` (input, system_prompt, knowledge, tools, AGENTS.md, output).
- Nhánh legacy trong worker còn (Phase 3 cutover Pending). API vẫn gửi cả trường legacy.

## 3. Sai lầm đã sửa trong phiên

| Việc | Kết quả |
|---|---|
| Thêm zod + vòng viết lại vào worker | **Sai kiến trúc, đã gỡ hết** (Dockerfile, package.json, omp-runner, output-validation) |
| Nói "hai nguồn cấu hình checkpoint" (#3) | **Sai**, cả hai đọc cùng `AUDIT_CHECKPOINTS`. Đã rút |
| Nói "mọi job CP2 cũ chấm thiếu prompt" | **Chưa có căn cứ**, đã giới hạn về job xác nhận |
| Đoán lỗi do model sai schema | Triệu chứng. Gốc là thiếu prompt |

## 4. Code đã đổi (API + packages, không đụng worker)

- `cp2-agents-md.ts` (mới): sinh `AGENTS.md` CP2 từ `CP2_SCHEMAS` (schema, khung JSON, danh sách id, lệnh kiểm). Cùng kênh CP1 dùng.
- `omp-audit.service.ts`: `SandboxOptions.agentsMd`, `SandboxOptions.tools` (copy vào `jobDir/tools/`, thiếu thì throw).
- `omp-audit-coordinator.ts`: CP2 truyền `agentsMd` + `tools: [cp2ValidatorSource()]`.
- `packages/validation`: CLI `validate-cp2-report` bundle zod (`tsup.cli.config.ts`, script `build` build thêm `.mjs`); lỗi zod có thêm `message`.
- `job-spec-builder.ts`: instruction CP2 bảo đọc `AGENTS.md`, chạy lệnh kiểm tới khi OK.
- `cp2-audit-postprocess.ts`: export `cp2AllowedSchemas`.
- Test: `cp2-agents-md.test.ts` (3 ca schema/id + CLI hợp lệ/không hợp lệ). 18/18 pass, `tsc` API sạch.

## 5. Vấn đề còn lại

### Sửa nhỏ, độc lập
1. Thiếu prompt đã khai báo → fail **trước khi trừ credit** (hiện chỉ warn).
2. Core prompt dòng 245 còn bảo kiểm bằng `JSON.parse`, mâu thuẫn `AGENTS.md`.
3. Finalizer `JSON.parse` không bảo vệ (`omp-audit-finalizer.ts:117`).
4. Lưu báo cáo lỗi + danh sách lỗi vào kết quả job; hiện chỉ log `path/code`.
5. Zod lỏng ở `calcChecks`, `itemReviews`, `reaudit` (passthrough).
6. Cutover worker (xoá nhánh legacy) khi queue prod drain. Đã có plan `plans/261012-worker-jobspec/phase-03-cutover.md`.
7. `apps/worker-omp/AGENTS.md` mô tả cấu trúc cũ.

### Thuộc gốc kiến trúc: "dịch vụ chấm không có định nghĩa duy nhất"
- Bảng `AUDIT_CHECKPOINTS` chỉ chứa một phần chỗ khác nhau; phần còn lại là ~20 nhánh `=== "CP1"/"CP2"` ở coordinator, finalizer, job-spec-builder, trigger-opts, admin-workers, derive-stage-summaries.
- CP1 là nền mặc định ngầm (`?? "CP1"`), CP2 định nghĩa bằng phép trừ (`includeKnowledge: false`).
- Hệ quả đã thấy: sandbox CP1 copy cả `cp2_*.md` (`promptFiles ?? readdirSync`), CP2 quên `AGENTS.md`, prompt nằm ngoài gói deploy API.
- Hướng: `AuditServiceDef` trong API, mỗi dịch vụ tự khai: prompts, `buildSandbox`, `buildInstruction`, `validateReport`, `onInvalidReport`, `postProcess`, kiểu lưu. Hạ tầng chung (queue, sandbox mechanics, credit, PDF, persistence) giữ làm hàm dùng chung. Làm từng bước, giữ test CP1.
- Bước đầu nhỏ: CP1 khai báo tường minh prompt/knowledge/AGENTS.md của mình.
- Chưa chốt: prompt vào image API hay nhúng nội dung vào gói gửi sang.

### Không thuộc gốc này, kiểm riêng
- Quote không khớp chỉ gắn cờ `evidenceUnverified`, không ảnh hưởng điểm. Cần quyết định chính sách.
- Code render PDF/UI CP2 với dữ liệu thiếu trường: chưa đọc.
- Cách `data/` trên VPS được cập nhật khi deploy: chưa thấy bước nào trong Makefile.

## 6. Quyết định về nén prompt

Không dùng `caveman-compress` lên `cp2_*.md`: prompt tiếng Việt, đầy điều kiện/ngưỡng chính xác, bảng tiêu chí; skill nén theo luật tiếng Anh, ghi đè file gốc. Cách an toàn: bỏ trùng lặp core ↔ review/resubmit, đo A/B bằng input job `3cf8c8f1` (so trạng thái 30 tiêu chí). Chưa đo token thật.

## 7. Việc kế tiếp (đề xuất)

1. Đưa 4 file `cp2_*.md` lên VPS thật (commit+push repo `data` rồi pull, hoặc `scp`).
2. Smoke 1 job CP2 thật: kiểm `system_prompt/`, `AGENTS.md`, `tools/validate-cp2-report.mjs` có trong sandbox, và validator chạy.
3. Fail-trước-khi-trừ-credit khi thiếu prompt/tool.
4. Chấm lại job `3cf8c8f1`. Đọc `report.md` của `9313b3dc` rồi mới quyết.
5. Chốt hình dạng `AuditServiceDef` (đối chiếu CP3/CP4) rồi lập plan từng bước.

## 8. Chưa kiểm

- Chưa chạy job CP2 thật sau các thay đổi; chưa xác nhận file `.mjs` tới được sandbox trong container API.
- Chưa mở code CP3/CP4. Số nhánh `CP1/CP2` là kết quả một lần grep, có thể còn sót ngoài `apps/api/src`.
- Chưa chạy sandbox CP1 để xác nhận có chứa `cp2_*.md`.
- Dump VPS lấy lúc Oct 20 18:55; VPS thật có thể đã khác.
- Thay đổi code đã commit trên nhánh `fix/cp2-sandbox-schema-guard` (5 commit, xem mục 9). Chưa push, chưa merge.
- Fix "thiếu prompt" đã vá lỗ hổng thiếu thư mục và có test (mục 9).

## 9. Cập nhật sau checkpoint

### Việc nhỏ đã sửa (mục 5 "Sửa nhỏ" #1, #2, #3)
- `omp-audit.service.ts:133`: thiếu file prompt đã khai báo thì `throw` thay vì `warn`. Lỗi đi qua nhánh `dispatch-failure` của `triggerOmpAuditForCase`: job `failed`, hoàn 1 credit. Lưu ý credit bị trừ trước rồi mới hoàn, **không** phải chặn trước khi trừ. Các lần mirror sandbox phụ vẫn chỉ `warn`.
- `omp-audit-finalizer.ts:117`: bọc `JSON.parse`, lỗi có ngữ cảnh `report.json is not valid JSON: …`. Vẫn đi nhánh `finalize-error` + hoàn credit.
- `cp2_audit_core_v1.md:245`: bảo chạy lệnh kiểm tra trong `AGENTS.md`, bỏ `JSON.parse`. Bản mới đã copy vào dump VPS local, **chưa lên VPS thật**.
- Kiểm: `tsc` API sạch, 11 test liên quan qua (`cp2-agents-md`, `cp2-audit-trigger`). Chưa có test mới cho hai nhánh lỗi; chưa chạy job thật.

### Nhánh và commit
Nhánh `fix/cp2-sandbox-schema-guard` (từ `dev`):

| Commit | Nội dung |
|---|---|
| `c4f2968` | feat(validation): CLI kiểm báo cáo CP2 bundle zod, lỗi zod có `message` |
| `bb8517a` | feat(ai-engine): sandbox CP2 có `AGENTS.md` + validator; thiếu file prompt thì job fail |
| `c9c7b2d` | fix(ai-engine): finalizer báo `report.json` hỏng có ngữ cảnh |
| `58be539` | docs(prompts): core CP2 dùng validator trong `AGENTS.md` |
| `658f9f4` | docs(plans): báo cáo checkpoint này (bản đầu) |

Commit `bb8517a` gộp cả hunk `throw` thiếu prompt cùng thay đổi sandbox vì chung file `omp-audit.service.ts`.

### Lỗ hổng thư mục prompt (đã vá)
`prepareSandbox` giờ `throw` khi có `promptFiles` rõ ràng mà thiếu thư mục `data/system-prompts` hoặc thiếu file liệt kê; CP1 (không giới hạn) giữ hành vi cũ. Test `prepare-sandbox-prompts.test.ts` (4 ca) dùng `APP_ROOT` thư mục tạm; 8/8 pass cùng `cp2-agents-md`, `tsc` API sạch.

`apps/worker-omp/AGENTS.md`: cập nhật cây sandbox (thêm `AGENTS.md`, `knowledge/`, `tools/`) và ghi rõ worker không validate/sửa báo cáo.

### Còn lại từ mục 5
Đã xong: "Sửa nhỏ" #1, #2, #3, #7. Chưa làm: #4 lưu báo cáo lỗi, #5 siết zod (cần đọc code render trước), #6 cutover worker (chờ queue prod drain), toàn bộ nhóm kiến trúc.
