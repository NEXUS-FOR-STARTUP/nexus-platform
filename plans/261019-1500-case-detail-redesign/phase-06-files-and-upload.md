# Phase 6: Tài liệu + hộp thoại tải lên

Priority: P2 · Status: Pending · Effort: 6h · blockedBy: Phase 4 · Có thể hỏi Q10 (phản hồi ngoài)

CW = `apps/web-1/app/dashboard/case/[id]/_components`

## Context Links
- Mockup: `js/views/stage-files.js` (13), `upload.js` (50), `REPORT.md` §7 "Tab Tài liệu"
- `research/scout-02` §2 "StageDocumentUploadModal", "Files"; `reports/gap-register.md` C-06, C-15, C-22, C-26
- Code: `CW/workspace/stage/StageFilesView.tsx` (195), `StageDocumentUploadModal.tsx` (224), hook `useStageDocumentUpload`, `useStageDocumentDelete`, `components/ui/FileTypeIcon.tsx`, `documents/*` (bảng 7 cột + `DocumentWorkspaceHeader`)

## Key insights
- Modal hiện có vi phạm quy tắc repo: gọi `apiClient` trực tiếp (`:11,:109`) và `try/catch` trong component (`:104-138`), trong khi hook `useStageDocumentUpload` **đã tồn tại** → chuyển sang hook khi chạm file (C-22). Giữ nguyên chuỗi lỗi (REPORT §7: "đúng câu chữ UI cũ").
- Luật upload (giữ): tối đa 5 tệp, 25 MB, `pdf/docx/xlsx/pptx/txt`, chọn loại cho từng tệp, Lưu bật khi mọi tệp có loại. Mockup tự nhận giới hạn 5 chỉ tính tệp trong hộp thoại, không tính tệp đã nộp: **không sao chép lỗi này**; xem code thật tính thế nào và giữ.
- Mockup nhóm tài liệu theo phân loại (thay bảng 7 cột) và hiện chip "Bản N" + "Có thể thêm: ...". Chip phiên bản cần trường dữ liệu chưa xác nhận (C-06).
- Mockup bỏ tab "Phản hồi ngoài" + lọc vai trò student/supporter (C-15). Supporter đóng băng từ 2026-10-11: xác minh trong `StageFilesView`.
- Icon tệp chỉ dùng `FileTypeIcon` (PNG).
- Xóa tài liệu có hộp thoại xác nhận trong code; mockup thiếu: **giữ**.
- `Dropzone` đã dùng: giữ.
- Có `Alert` quyền riêng tư chỉ CP2: giữ ("Lưu ý quyền riêng tư").

## Requirements
- Tab "Tài liệu (N)": tiêu đề "Tài liệu đã nộp (N)", ghi chú định dạng/giới hạn, nút phụ "Tải tài liệu lên"; trạng thái trống có CTA.
- Nhóm theo phân loại; mỗi hàng: `FileTypeIcon`, tên, (chip "Bản N" nếu có dữ liệu), `LOẠI · dung lượng · người nộp · ngày` viết thường theo wording, nút icon Tải xuống/Xóa có `aria-label` "Tải xuống <tên>" / "Xoá <tên>".
- Cuối danh sách "Có thể thêm: <loại còn thiếu>".
- Modal: `Modal` Mantine, danh sách tệp đã chọn (icon, tên, MB, nút bỏ), `Select` loại bắt buộc, `Alert color="red"` lỗi, nút "Hủy"/"Lưu".
- Hộp thoại xóa giữ nguyên.

## Architecture
```
StageFilesView.tsx (≤150)    Alert riêng tư + header + DocumentGroupList
 ├─ DocumentGroupList.tsx     group-by-category (dùng hàm thuần groupDocumentsByCategory)
 ├─ DocumentRow.tsx           1 tệp
 └─ document-groups.ts        groupDocumentsByCategory, missingCategories + test
StageDocumentUploadModal.tsx  Modal + Dropzone; logic gửi trong useStageDocumentUpload
 └─ UploadFileRow.tsx         1 tệp đã chọn
```

## Related code files
**Modify:** `StageFilesView.tsx`, `StageDocumentUploadModal.tsx`, `hooks/useStageDocumentUpload.ts` (nhận thêm logic lỗi nếu còn ở component), `FileTypeIcon` (không đổi).
**Create:** `stage/DocumentGroupList.tsx`, `stage/DocumentRow.tsx`, `stage/document-groups.ts`, `stage/document-groups.test.ts`, `stage/UploadFileRow.tsx`.
**Delete:** các file `documents/*` chỉ còn phục vụ bảng 7 cột **nếu** LSP references chứng minh `StageFilesView` là nơi duy nhất dùng; nếu không, để lại (dọn ở Q6).

## Implementation steps
1. `codegraph_explore StageFilesView StageDocumentUploadModal useStageDocumentUpload`. Ghi: các tab/bộ lọc trong `StageFilesView`, chữ lỗi chính xác, cách đếm giới hạn 5.
2. Kiểm type `Document`/`StageDocument`: có `version`/`revision`? Có `uploaded_by_role`? Ghi vào cuối file phase. Không có version → bỏ chip "Bản N" (C-06), báo bạn.
3. **Q10 (chỉ khi cần):** nếu tab "Phản hồi ngoài"/lọc vai trò còn hiển thị cho sinh viên → hỏi giữ hay bỏ; mặc định giữ nếu còn hiển thị.
4. `document-groups.ts`: `groupDocumentsByCategory(docs, categoryOrder)` giữ thứ tự loại cố định (5 loại của modal), nhóm rỗng bỏ; `missingCategories`. Test: 0 tài liệu, 1 loại, nhiều loại, loại lạ → nhóm "Khác".
5. `DocumentRow`: nút tải dùng handler/hook cũ; nút xóa mở modal xác nhận cũ.
6. Chuyển logic gửi của modal vào `useStageDocumentUpload` (hook trả `{ upload, isUploading, error }`); component chỉ gọi `upload(files)`, không try/catch. Lỗi hiển thị giữ nguyên chuỗi; 403/message extraction cũ (`onError`) di chuyển cùng.
7. Chữ `Dropzone` + giới hạn + lỗi: tái dùng hằng đang có (`MAX_FILES=5`, `MAX_FILE_MB=25`...); nếu đang gõ cứng thì đặt vào `stage/upload-limits.ts` (hằng, không rải).
8. Mobile: hàng 2 dòng, nút icon cỡ ≥36px (touch).
9. Smoke: trống, 1 nhóm, 3 nhóm; upload hợp lệ; >5 tệp; >25MB; đuôi sai; thiếu loại; xóa có xác nhận; CP2 có Alert, CP1 không. 1440/390.

## Todo
- [ ] Đọc `StageFilesView` + type Document
- [ ] Hỏi Q10 nếu cần
- [ ] `groupDocumentsByCategory` + test
- [ ] DocumentGroupList/Row
- [ ] Chuyển logic modal vào hook, bỏ try/catch + apiClient
- [ ] Smoke 8 ca

## Success criteria
- Chuỗi lỗi upload giống hệt UI cũ (so sánh text).
- Không còn `apiClient` hay `try/catch` trong `StageDocumentUploadModal`; mọi file ≤200 dòng.
- Không icon tệp vector mới; `aria-label` đủ trên nút icon.
- Hành vi xóa/tải không đổi.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Hook upload thiếu trạng thái modal cần | Chỉnh hook trong phase, không nhân đôi logic |
| Mất tab phản hồi ngoài còn người dùng cần | Q10 trước khi xóa |
| Nhóm theo phân loại làm mất sắp xếp theo thời gian | Trong nhóm sắp theo ngày giảm dần |

## Security
Giữ kiểm đuôi/kích thước phía client **và** server (server là chuẩn). Tên tệp hiển thị bằng text, không HTML. Link tải lấy từ hook hiện có (không tự ghép URL).

## Next steps
P7.
