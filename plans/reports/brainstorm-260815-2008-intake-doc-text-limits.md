# Brainstorm — Giới hạn intake: tối đa 10 tài liệu + giới hạn ký tự text field

> Báo cáo brainstorm 2026-08-15. Chốt giới hạn cho bug #13 (spam tài liệu) + #14 (không giới hạn chữ) trong luồng intake.
> Không implement — chỉ chốt quyết định. Nghiên cứu nền: `tasks/bugs/bug-13-intake-unlimited-docs.md`, `tasks/bugs/bug-14-intake-unlimited-text.md`, RCA debugger 2026-08-15.

## Vấn đề

1. **#13**: Trang intake cho user upload tài liệu không giới hạn số lượng — chỉ chặn 15MB/file.
   `[đã kiểm chứng]` FE `DocumentInputStep.tsx:114-124` append không đếm; BE `validate-document-write.ts:49-93` chỉ validate URL; schema `Cp1IntakeSchema` chỉ kiểm `documents[0]`.
2. **#14**: Mọi text field intake lưu độ dài tùy ý. `[đã kiểm chứng]` `packages/validation/src/index.ts:204-284` chỉ có min (`full_name ≥2`, `student_code ≥5`, `blocker ≥10`, `summary ≥20`...), không có `.max()` nào; `.passthrough()` cho field lạ lọt qua.

## Phương án đã đánh giá

| Phương án | Pros | Cons | Kết luận |
|-----------|------|------|----------|
| A. Max 10 file toàn bộ luồng upload (validator chung) | Nhất quán mọi nơi | Thay đổi hành vi revision + supporter output ngoài phạm vi bug; blast radius 5 caller của `validateDocumentWriteInputs` | ❌ Loại — quá phạm vi |
| B. Max 10 file intake-only (schema + FE) | Đúng phạm vi bug gốc, rủi ro thấp, 1 file schema + 1 file FE | Giới hạn không đồng nhất giữa các luồng | ✅ **Chọn** |
| C. Cap chữ 100 cho mọi field ngắn | Đơn giản 1 quy tắc | Chặn email hợp lệ (chuẩn 254) + URL Cloudinary ~200+ ký tự | ❌ Loại — cần ngoại lệ |
| D. Cap phân bucket: short 100 / email 254 / long 20000 / URL miễn cap | Đúng thực tế dữ liệu | 4 bucket thay vì 2 | ✅ **Chọn** |

## Quyết định đã chốt

| # | Chủ đề | Quyết định |
|---|--------|-----------|
| B1 | #13 số lượng | **Tối đa 10 tài liệu** (DOCUMENT_TYPE_OPTIONS chỉ có 6 loại → 10 dư chỗ, không xung đột) |
| B2 | #13 phạm vi | **Chỉ intake.** Đặt ở `Cp1IntakeSchema` + FE `DocumentInputStep`. KHÔNG đụng `validateDocumentWriteInputs` (revision/supporter output giữ nguyên) |
| B3 | #14 short | **100 ký tự**: `contact.full_name`, `contact.student_code`, `contact.team_role`, `support_needs.primary_need` |
| B4 | #14 email | **254 ký tự** (RFC 5321) — riêng biệt, không theo bucket short |
| B5 | #14 long | **20000 ký tự**: `current_blocker`, `case_summary`, mỗi item `current_situations[]` |
| B6 | #14 miễn cap | `contact.zalo` (đã regex 10 số), `file_url`/`drive_url` (URL Cloudinary), `original_name`, `boundary_confirmations` (checkbox array) |

## Thiết kế triển khai (tham khảo, chưa làm)

1. **Schema shared** (`packages/validation/src/index.ts:204-284`) — điểm thực thi chính, dùng chung FE↔BE:
   - superRefine thêm: `documents.length > 10` → issue; `string.length > max` → issue theo bucket
   - Caller BE duy nhất: `apps/api/src/modules/cases/http/cases.schema.ts` → BE tự được bảo vệ qua schema
2. **FE** (`DocumentInputStep.tsx`):
   - Chặn append khi `currentDocs.length >= 10` + Alert đỏ (tái dùng `uploadError` state sẵn có)
   - Text inputs: thêm `maxLength` + counter hiển thị
3. **Test**: ⚠️ `Cp1IntakeSchema` hiện **không có test** — phải thêm (nơi đặt: `apps/api/src/shared/infrastructure/tests/`)

## Rủi ro & lưu ý

- 20000 ký tự nằm trong JSON metadata intake — Postgres TEXT chứa vô tư, không cần migration.
- `.passthrough()` giữ nguyên — chỉ cap các field đã biết, không đóng schema (tránh vỡ field mới sau này).
- Không đụng `validatePostIntakeDocumentInputs` (validate URL) — 2 validator chạy song song, không xung đột.
- Effort: #13 M, #14 M — cùng 1 file schema, tự chứa, không dependency.

## Tiêu chí thành công

- Nộp intake > 10 doc → bị chặn + báo lỗi rõ (FE lẫn BE)
- Text field vượt max → bị chặn + báo lỗi rõ
- Luồng revision/supporter output không đổi hành vi

## Bước tiếp theo

1. Cập nhật `tasks/bugs/bug-13-*.md` + `bug-14-*.md`: Tracking (quyết định đã chốt) + AC cụ thể
2. Cập nhật `tasks/README.md`: xóa "quyết định cần" của #13/#14
3. Tạo plan implementation khi bắt đầu code

## Vấn đề mở (sau #13/#14)

- `unit_code: "intake"` hardcode (`submit-intake.usecase.ts:81`) vs `"v00"` — bug hay cố ý? Liên quan #12
- Cap chữ có cần áp dụng cả cho intake edit ở vòng sau (resubmit qua T3/T4)? Giả định: có — vì cùng schema `Cp1IntakeSchema`
