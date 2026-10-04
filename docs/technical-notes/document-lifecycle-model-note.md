# Technical Note: Document Lifecycle Model

## 1. Mục tiêu

Ghi lại model nội bộ để migrate từ Google Drive manual structure sang object model trong web mà không làm mất lịch sử version, assessment, và artifact.

## 2. Source of truth tham chiếu

- Manual document system trong `docs/nexus-document/document-system/document-lifecycle-management.md`
- Manual case intake form
- Manual case management sheet
- Manual audit workflow dùng ChatGPT

## 3. Model nội bộ đề xuất

`case -> checkpoint -> version -> assessment -> artifact`

### Case

Hồ sơ hỗ trợ độc lập cho một team.

### Checkpoint

Mốc như `cp1`, `cp2`.

### Version

Bản tài liệu cụ thể do team gửi hoặc bản Nexus đang xử lý gắn với một input version cụ thể.

### Assessment

Vòng phản hồi / review / đánh giá dựa trên một version.

### Artifact

Tài liệu cụ thể thuộc một version hoặc assessment, có direction như `input`, `output`, `evidence`.

## 4. Mapping user-facing vs internal

### Internal naming

- `v01`
- `a01-v01`
- `input`
- `output`
- `evidence`

### User-facing naming

- `Bản nhóm gửi lần 1`
- `Report vòng 1`
- `Feedback giảng viên`
- `Bản nhóm sửa lần 2`

UI không nên bắt user đọc trực tiếp naming nội bộ, nhưng backend nên giữ logic đó.

## 5. Quy tắc migrate quan trọng

- Không ghi đè artifact cũ.
- Bản sửa mới của team tạo version hoặc round mới phù hợp.
- Feedback mới không tự động tạo version mới.
- Report cũ trở thành lịch sử, không biến mất.
- Artifact nội bộ và artifact user-facing phải có visibility rõ ràng.

## 6. Ảnh hưởng tới UI

- User workspace cần document board theo round.
- Supporter workspace cần thấy round hiện tại và round trước.
- Admin không cần thấy mọi naming storage-level, nhưng cần đủ metadata để triage.
- Report artifact phase 1 nên hỗ trợ rich text trong hệ thống và optional file attachment.

## 7. Thiếu / chưa rõ

- Chưa khóa chính xác schema DB cho `version` và `assessment`.
- Chưa khóa artifact type list chi tiết cho phase 1.

## 8. Quyết định chốt 2026-08-15 — Bug #12 (admin nhiều doc / user 1 doc)

### 8.1 Bỏ khái niệm "tài liệu chính"

Không có primary document. Mọi tài liệu intake bình đẳng, mỗi tài liệu gắn 1 category do user chọn khi upload. Hệ quả:

- Không cần lo "đâu là tài liệu chính", không cần show-1-vs-show-nhiều — **show hết toàn bộ**
- "Cùng category + khác version" = bản sửa ở thời điểm sau (versioning đã có sẵn)
- Scale: thêm loại mới = thêm 1 option, không đụng model

### 8.2 Category codes cho tài liệu intake

| Label (user-facing) | Code |
|---|---|
| Báo cáo ý tưởng | `idea_report` |
| Slide thuyết trình | `pitch_deck` |
| Phân tích đối thủ | `competitor_analysis` |
| Khảo sát khách hàng | `customer_research` |
| Đề cương phân công | `task_assignment` |
| Tài liệu bổ sung | `other` |

- Lưu: `doc_type` record giữ `"intake_document"` (ngữ nghĩa hệ thống); category vào `metadata_json.category`; label map từ code
- Map code↔label đặt ở `packages/validation` — single source of truth FE↔BE
- Cho phép nhiều file cùng category (không ràng buộc 1/type) — #13 đã chặn trần 10 file/lần nộp; UI nhóm theo category khi render
- Báo cáo đánh giá (`assessment_report`) của supporter riêng biệt — không đổi

> **Implementation (2026-08-16):** đúng thiết kế — FE gửi code, BE map category vào `metadata_json.category` qua param scoped intake (không sửa luồng revision/supporter output); legacy Vietnamese-label docs giữ nguyên (display-only).

### 8.3 Thay thế ngầm (soft-supersede)

Không xóa, không append, không thay toàn bộ:

- Nộp lại → upsert record mới (dedupe theo identity sẵn có) → mọi record cũ của unit KHÔNG nằm trong bộ mới → set `superseded_at = now`
- User view lọc bỏ record có `superseded_at ≠ null` → chỉ thấy bộ mới nhất
- Hệ thống giữ nguyên mọi record (tối ưu quy trình sau này); admin raw thấy hết kèm badge "đã thay thế"
- Cần migration thêm cột `superseded_at DateTime?` vào `document_records` (nullable, create-only)
- `legacyFilesFromUnit` + `unit.file_url` thành thừa → bỏ dần

> **Implementation (2026-08-16):** migration `20260816170000_add_document_record_superseded_at` (additive + index `[case_id, superseded_at]`) đã tạo --create-only; marking trong `submit-intake.usecase.ts` (`buildSupersedeUpdateArgs` — where: unit v00 + `superseded_at null` + `id notIn` bộ mới); user read filter `superseded_at null` trong `findDocumentRecordsByCaseId`.

### 8.4 Fix kỹ thuật kèm theo

- Sửa doc_type bị label tiếng Việt đè (`document.repository.ts:77` — `doc.doc_type || doc.document_type || defaultDocType`): FE gửi code, không gửi label
- Sửa `unit_code: "intake"` → `"v00"` (`submit-intake.usecase.ts:81`) — record khớp code unit thật
- Admin per-case đọc qua cùng `assembleDocumentWorkspace` (view chuẩn); bảng admin global giữ thô + filter theo case

> **Implementation (2026-08-16):** `unit_code v00` đã fix; admin per-case đọc qua `assembleDocumentWorkspace`; bảng admin global (`list-admin-documents.usecase.ts`) lọc theo case; FE label đổi "Tài liệu chính" → category label, `is_primary` giữ (report artifacts depend).
