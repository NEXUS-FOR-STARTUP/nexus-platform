---
title: "Registry dịch vụ chấm + thư viện tài liệu theo case (API-only, một lượt)"
description: "Gom ~20 nhánh if CP1/CP2 thành registry hook; CP sau đọc dữ liệu CP trước qua _library + manifest + context; lưu báo cáo không còn mặc định CP1."
status: pending
priority: P1
effort: 1-2 ngày
tags: [backend, api, ai-engine, refactor]
blockedBy: []
blocks: []
created: 2026-10-20
branch: feat/attachment-manifest
---

# Registry dịch vụ chấm + thư viện tài liệu

Nguồn quyết định: `plans/reports/brainstorm-261020-1927-audit-service-registry.md` (D1-D20, mục 3.2, 3.5, 3.7, 3.8). Plan này chỉ nói **làm gì, hướng nào, quy trình**; chi tiết do người làm tự quyết theo code.

## Phạm vi

**Làm (API-only):** registry, hàm tương thích job cũ, lưu báo cáo, thư viện `_library` + manifest `stage`/`role` + `context/`, luật "context không phải bằng chứng", kiểm prompt lúc khởi động.
**Không làm:** web (CP3/CP4 UI, kiểu `"CP1" | "CP2"`), worker, compose, cô lập giữa các case, rubric/prompt CP3/CP4, siết zod `calcChecks`, build image, đụng DB/migration.
**Giữ nguyên:** hợp đồng API với web cho CP1/CP2; hành vi CP1 (chạy xuyên suốt, không đổi nội dung sandbox).

## Nền đã có (trên nhánh local, chưa push)

`fix/cp2-sandbox-schema-guard` (AGENTS.md CP2, validator, prompt `throw`) và `feat/attachment-manifest` (manifest JSON, `uniqueSandboxName`, danh mục mới, `tsup onSuccess`). Làm tiếp trên `feat/attachment-manifest`, commit tách nhỏ.

## Quy trình (làm tuần tự, commit sau mỗi bước)

1. **Mốc CP1/CP2.** Viết test đặc tả hành vi hiện tại: `resolveAuditPlan`, nội dung `prepareSandbox` (danh sách file CP1/CP2), instruction, đường lỗi (hoàn credit). Chụp danh sách file sandbox CP1 thật làm mốc so sánh. Mọi bước sau phải giữ test này xanh.
2. **Registry.** Mỗi dịch vụ một file khai báo hook (`prompts`, `outputs`, `reportType`, `sandbox`, `instruction`, `preflight`, `optsSchema`, `jobInputExtras`, `rerunInput`, tên file báo cáo, `persistence`). `getAuditService(code)` ném 400 khi chưa đăng ký, không có mặc định. Chuyển CP1 và CP2 sang; bỏ mọi `=== "CP1"` và `?? "CP1"` ở `coordinator`, `finalizer`, `job-spec-builder`, `trigger-opts`, `admin-workers`. Hạ tầng chung (queue, credit, PDF, lưu) không đổi. Tìm các nhánh còn sót bằng grep trong `apps/api/src`.
3. **Job cũ.** Một hàm tương thích dùng chung ("thiếu `checkpoint` = CP1", ghi lý do), thay ba bản chép tay: `finalizer:72,145`, `derive-stage-summaries:29`, `admin-workers:531` (chạy lại chuyển thành hook `rerunInput`).
4. **Lưu báo cáo.** `saveOmpAuditReport` luôn nhận `checkpointCode` + `reportType`; bỏ đường mặc định và `resolveOmpAuditCheckpoint`. Caller production duy nhất là `finalizer:291`. Cập nhật `assessment-routing.test.ts` (5 chỗ gọi đang khóa hành vi cũ).
5. **Thư viện tài liệu.**
   - `storage/jobs/<caseId>/_library/<băm URL>_<tên>`: API tải tài liệu CP trước nếu chưa có, khóa theo `download_url`; ghi nguyên tử (file tạm rồi đổi tên); ghi cả bản `OMP_SANDBOX_MIRROR_ROOT` nested, không ghi đường phẳng; không dọn.
   - `input/context/cp1_answers.md`: copy câu trả lời CP1 (`renderStageAnswers("CP1")`), độc lập với `AUDIT_STAGE_INPUT_RULES`. Không dùng intake.
   - Manifest: mỗi mục thêm `stage`, `role` (`submission` | `context`), `path` (tài liệu CP trước: `../_library/...`). Tài liệu CP trước liệt kê hết, không có luật chọn tập con.
   - Tải hỏng tài liệu context: bỏ qua + cảnh báo. Lỗi khác đi đường hoàn credit có sẵn.
6. **Luật bằng chứng.** Postprocess chuẩn hóa `evidence.source` (giải `..`, `input/`, đường dẫn tuyệt đối, `\`, hoa thường, `%xx`); nguồn thuộc `context/` hoặc `_library/` chỉ hợp lệ nếu manifest ghi `role: submission`. Instruction và `AGENTS.md` nói rõ context là bối cảnh, không phải bằng chứng.
7. **Khởi động.** Kiểm mọi dịch vụ đã đăng ký có đủ file prompt (`data/system-prompts`), thiếu thì API không khởi động. Slot CP3/CP4 trả 400 "chưa mở".

## Quy tắc khi làm

- Viết hết code rồi mới chạy test (theo yêu cầu); sau đó mới sửa lỗi.
- Không build image, không chạy migration, không động vào DB prod; DB local chỉ dùng để smoke.
- Không thêm tính năng ngoài danh sách; không đoán phần chưa đọc (đọc code trước khi sửa, kể cả `coordinator`).
- Commit tách nhỏ theo bước; cập nhật báo cáo brainstorm ở mục "chưa kiểm" khi có kết quả thật.

## Kiểm sau khi code xong (checklist, không phải vấn đề)

- `tsc` API sạch; test API (kể cả test đặc tả ở bước 1) xanh; test mới cho: registry (mã chưa đăng ký -> 400), hàm job cũ, lưu báo cáo (không còn CP1 mặc định), thư viện (khóa URL, ghi nguyên tử, tải hỏng), luật bằng chứng (các biến thể đường dẫn).
- Smoke local một job CP2 qua `prepareSandbox` và CLI `omp`: sandbox có `_library`/`context`/manifest; `report.json` đúng schema; không có nguồn `context/` trong bằng chứng hợp lệ.
- Smoke CP1: danh sách file sandbox khớp mốc bước 1.
- Chưa chứng minh được bằng smoke: model có dùng validator và manifest không; Cloudinary có bật backup không; guard/`AGENTS.md` trên image prod. Ghi rõ vào báo cáo, không khẳng định.

## Rủi ro chính

- Chuyển CP1 sang registry làm đổi hành vi ngầm (CP1 đang "chạy mượt"). Giảm bằng test mốc bước 1 và commit tách.
- Job đang nằm trong queue/DB kiểu cũ: hàm tương thích (bước 3) phải giữ finalize và chạy lại được.
- Khóa `download_url` chỉ là định danh cache: mất `_library` thì không tái hiện đúng bytes cũ (đã chấp nhận).
