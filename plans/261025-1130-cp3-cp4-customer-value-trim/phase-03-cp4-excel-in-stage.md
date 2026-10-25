# Phase 3: Stage Tài chính hiện thẻ tải Excel

## Mục tiêu
Ở `?tab=journey&stage=tai-chinh&view=draft`, trên khung câu hỏi có nút tải `FINANCE TEMPLATE.xlsx` và quote hướng dẫn (đang chỉ có ở gallery).

## Hiện trạng (đã đọc)
- `StageDraftOnly.tsx` (`.../workspace/stage/`): render `StageHeader` + `StageDraftView` cho cả CP4 và PITCH.
- Dữ liệu: `financeTemplate` trong `packages/validation/src/catalogs/file-templates.ts` (`file_url`, `file_name`, `instructions`), export qua `@repo/validation`.
- Nút tải + quote hiện nằm trong `GuidedFileTemplateView.tsx` (kèm nút "Tất cả biểu mẫu" và tiêu đề, không dùng lại nguyên được).

## Bước
1. Tách khối "nút tải + Blockquote" khỏi `GuidedFileTemplateView.tsx` thành `FileTemplateDownload.tsx` (cùng thư mục `guided-documents/`, props `{ template: FileTemplate }`). `GuidedFileTemplateView` dùng lại nó; hành vi gallery không đổi.
2. `StageDraftOnly.tsx`: nếu `stage.templateKey === FINANCE_STAGE_TEMPLATE_KEY` (hằng `"cp4"`), render `FileTemplateDownload template={financeTemplate}` giữa `StageHeader` và `StageDraftView`. PITCH không có file mẫu nên không đổi.
3. Blockquote dài (≈25 dòng): bọc bằng `Collapse`/accordion mặc định gập? Quyết khi smoke: nếu đẩy khung câu hỏi quá xa thì gập, ngược lại để nguyên. Không làm trước khi nhìn thật.
4. Không hiện chữ "CP4"/"Checkpoint" trong UI; không thêm class Tailwind định vị lên component Mantine.

## Test
- `npx tsc --noEmit` ở `apps/web-1`.
- Không thêm test mới (UI trình bày; smoke ở phase kiểm cuối).
- Smoke: mở stage `tai-chinh`, bấm tải, kiểm tên file; mở gallery, thẻ Excel vẫn hoạt động.

## Tiêu chí xong
- Stage tài chính có thẻ Excel; gallery không đổi hành vi; tsc xanh.
