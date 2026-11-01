# Research: phân biệt input giữa các lần chấm (CP2/CP3 resubmit)

Date: 2026-10-26. Chưa có code nào bị đổi.

## Problem
- Mỗi lần chấm gom lại mọi `DocumentRecord` live của stage (`findStageDocs`) + `ProjectAnswer` hiện tại. Không có khái niệm "lần chấm".
- Upload luôn thêm mới, không đè. Trùng tên -> `uniqueSandboxName` thêm prefix id (chỉ chống va chạm).
- Manifest không có thời điểm/thay đổi. Answers sửa giữa 2 lần chấm cũng mất dấu (`ProjectAnswer` mutable, chỉ còn `previous_report`).
- AI chỉ biết thay đổi qua `change_summary` do user tự gõ (có thể rỗng).
- Gốc: input không được đóng băng theo lần chấm. Mọi hướng "đoán" (timestamp, tên file) đều là vá.

## Sources (thin, honest)
- Chỉ 1 tham chiếu hữu ích: Flow-Research/workstream `operations_revision_replay.md`: Submission N+1 là bản **immutable**, link predecessor, stamp context đóng băng; không ai sửa bản cũ. Đó là nguyên lý cần mượn. Phần còn lại của tài liệu (lease, checker, policy) quá nặng, bỏ.
- Search chung về "diff submission" chỉ ra rác (prompt-diff tools). Phần còn lại là thiết kế từ code repo.

## Principle
Mỗi lần chấm đóng băng một **input snapshot** bất biến (hash nội dung). Chấm lại = server diff(snapshot lần trước, input live hiện tại). Không dùng timestamp, không dùng tên file, không dựa vào text user.

## Options
| | Cách | Ưu | Nhược |
|---|---|---|---|
| A | Heuristic `created_at` > report trước + trùng tên | 0 migration | Race (upload lúc job chạy), edit-in-place không bắt, answers bỏ sót, không bao giờ chính xác |
| **B** | Snapshot (sha256 file + answers) lưu trong `AiJob.input_json`; diff thuần hàm | **0 migration** (`input_json` đã là Json), chính xác theo nội dung, cover answers, hash miễn phí vì assembly đã fetch bytes | Run cũ chưa có snapshot -> không có mốc (xử lý bên dưới); cần link report->job |
| C | Bảng quan hệ `audit_runs` + `audit_run_documents` + `replaces_id` trên DocumentRecord | Lịch sử/audit/UI timeline đầy đủ | Migration (luật DB safety nghiêm), nặng; chỉ đáng nếu cần UI lịch sử |
| D | Khôi phục modal upload + gắn loại tài liệu | Rõ ý người dùng | Đẩy gánh cho user, vẫn không có snapshot -> không giải quyết gốc |

Khuyến nghị: **B**, C để sau nếu thật sự cần lịch sử.

## Design B
Snapshot (version:1) ghi vào `AiJob.input_json.input_snapshot` lúc assemble:
```json
{ "version": 1,
  "answers": [{ "question_id": "q1", "text": "...", "sha256": "..." }],
  "files":   [{ "document_id": "...", "name": "bmc.pdf", "sha256": "...", "size": 123, "category": "bmc" }] }
```
- sha256 tính ngay tại `loadAttachments` (đã `fetch` bytes).
- Link báo cáo -> job: finalizer đã có `aiJobId`. Thêm `ai_job_id` vào `Report.metadata_json` (và thêm key đó vào `PROVENANCE_KEYS` ở cp2/cp3 để không lọt vào `previous_report.json`).
- Baseline = snapshot của job sinh ra báo cáo mà resubmit đang so (`findLatestCp2FullReport` / `findLatestCp3FullReport`) -> cùng nguồn với `previous_report`, không lệch.

Diff (hàm thuần `diffInputSnapshots(prev, cur)`, dễ unit-test):
- file: cùng `document_id` + cùng sha -> `unchanged`; id mới -> `added`; id cũ không còn -> `removed`.
- id mới nhưng cùng `name` (casefold) với 1 file cũ + sha khác -> `modified`, `replaces: <tên cũ>`.
- id mới nhưng sha trùng file cũ -> `unchanged_duplicate` (tải lại y hệt, không phải sửa).
- answers: theo `question_id` -> `added` / `changed` (kèm text cũ + mới) / `removed`.

Kết quả đưa vào sandbox:
- `input/changes.json` (+ `changes.md` cho người đọc), sinh bởi server.
- manifest entry thêm `change: "added|modified|unchanged"`, `replaces`.
- `change_summary.md` của user giữ nguyên nghĩa "ý định", AI đối chiếu với `changes.json`.
- Vẫn gửi toàn bộ file (grader cần cả tài liệu để chấm), chỉ đánh dấu.
- Sửa prompt `cp2_full_resubmit_v1`, `cp3_full_resubmit_v1`: ưu tiên đọc phần `added/modified/changed`, đối chiếu với `previous_report`, `unchanged` coi là không đổi.

Guard + UI (cùng một hàm, không viết hai lần):
- Preflight trước khi trừ credit: resubmit mà diff rỗng -> trả lỗi 409 "Chưa có thay đổi nào kể từ lần chấm trước" (hoặc cho `force`), tránh mất credit oan.
- Endpoint GET diff (dry-run snapshot live vs baseline) cho modal: hiện "+2 tệp, ~1 tệp sửa, 3 câu trả lời đổi" và nút "Sang tab Tài liệu" luôn hiện khi chấm lại.

## Edge cases
- Run cũ không có snapshot: không có mốc -> hiển thị "Không có mốc so sánh", chạy chấm lại như trước (không đoán). Chỉ run mới có.
- User sửa file nhưng không xóa bản cũ: cả hai ở `findStageDocs`. Diff báo `modified` (cùng tên) -> AI biết, nhưng bản cũ vẫn còn trong sandbox. Cân nhắc loại bản bị `replaces` khỏi input (giữ trong `changes.json`). Phase 2: tab Tài liệu hỏi "Thay bản cũ?" khi trùng tên (set `superseded_at`).
- Đổi tên khi sửa: sẽ là `added` + `removed`, AI suy thêm từ `change_summary`. Chấp nhận.
- Kích thước: text answers nằm trong `input_json` (~ vài chục KB), ổn.
- CP1 đi nhánh khác (`cp1-audit-input.ts`, unit-based); chưa xét.

## Cost
- Nhỏ: snapshot builder + diff + manifest/changes.json + 2 prompt + preflight + GET diff + UI.
- Test: unit cho `diffInputSnapshots` (added/modified/unchanged/duplicate/removed, answers), 1 test preflight diff rỗng.
- Không migration, không phá DB. Rollback: bỏ field `input_snapshot`, diff không có mốc -> hành vi cũ.

## Unresolved
- Upload trùng tên hiện đè hay thêm? (code chỉ thấy tạo `DocumentRecord` mới; chưa đọc hết `useStageDocumentUpload` / endpoint).
- Có muốn gửi lại file `unchanged` hay chỉ gửi file đổi + tham chiếu bản trước?
- Có cần C (lịch sử các lần chấm trên UI)?
