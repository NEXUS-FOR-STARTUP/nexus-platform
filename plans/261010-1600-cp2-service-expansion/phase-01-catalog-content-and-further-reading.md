# Phase 1 — Catalog content and further reading

## Context
- `packages/validation/src/catalogs/types.ts:14-19` — `Question { id, text, explanation, suggested_actions }`
- `packages/validation/src/catalogs/validate-catalog.ts:17-89`, chạy ở `index.ts:39` + `__tests__/catalog-validation.test.ts`
- `packages/validation/src/catalogs/questions-cp2.ts:154-168` — `cp2_tam_sam_som`
- `apps/web-1/app/dashboard/case/[id]/_components/guided-documents/GuidedQuestionCard.tsx:48-63` — render explanation + suggested_actions
- Bài news: https://nexusforstartup.site/news/cach-tinh-tam-sam-som-cuc-don-gian-cho-du-an-khoi-nghiep

## Overview
Priority P2. Độc lập. Sửa nội dung SOM khớp bài news; thêm link đọc thêm nhiều mục, có tiêu đề.

## Requirements
- `cp2_tam_sam_som.explanation`: SOM bottom-up = kênh -> số người tiếp cận -> tỷ lệ tải/dùng thử -> tỷ lệ trả phí -> × giá. Bỏ cách "năng lực phục vụ × số kỳ × giá". Giữ cảnh báo "không lấy 1% thị trường", mỗi số cần căn cứ.
- `Question.further_reading?: readonly { url: string; title: string }[]`.
- Validate: `url` parse được bằng `new URL`, `protocol === "https:"`; `title` không rỗng; không trùng url trong 1 câu.
- UI: dưới explanation, mục "Đọc thêm" liệt kê `title`, `<Anchor href target="_blank" rel="noopener noreferrer">`. Không có link -> không render mục.
- Gắn bài TAM/SAM/SOM vào `cp2_tam_sam_som`; bài AI slop vào câu AI disclosure của CP2 nếu phù hợp.
- Câu mới `cp2_question_bank` (phase `customer_discovery`, classification `recommended`): "Bộ câu hỏi phỏng vấn khách hàng, câu hỏi chuyên gia và bảng hỏi khảo sát (bản nháp)". Explanation: ghi từng câu theo 3 phần, với khảo sát ghi loại câu và các phương án; chỉ ra mỗi câu phục vụ câu hỏi nghiên cứu nào. `further_reading`: bài news về phỏng vấn/khảo sát khi có. Đầu vào bắt buộc của chấm bảng hỏi (phase 6).
- Sửa `cp2_appendix.explanation`, bỏ chữ "BẮT BUỘC" đối với tệp minh chứng. Wording chính xác:
  ```
  Phụ lục giúp người đọc đối chiếu khi nhóm có tài liệu, có thể gồm:
  - Hồ sơ tóm tắt của chuyên gia đã phỏng vấn
  - Bảng hỏi và dữ liệu khảo sát đã ẩn thông tin cá nhân

  Nếu nhóm trao đổi bằng lời hoặc chưa có tệp, hãy trình bày rõ người đã hỏi, cách thực hiện, điều học được và số liệu trong phần thân bài. Nexus không bắt buộc tải lên ghi âm, thông tin liên hệ hay dữ liệu khảo sát gốc để được chấm.
  ```
  Giữ `cp2_appendix` classification `required`: nhóm vẫn phải trả lời phụ lục của mình gồm gì hoặc ghi rõ chưa có tệp; chỉ bỏ yêu cầu phải tải tài liệu gốc lên Nexus.

## Steps
1. Sửa `types.ts` thêm field optional.
2. Thêm check vào `validate-catalog.ts` (theo pattern lỗi hiện có).
3. Sửa explanation của `cp2_tam_sam_som`, `cp2_appendix`; thêm `further_reading` trong `questions-cp2.ts`.
4. Render trong `GuidedQuestionCard.tsx` (Mantine `Anchor`, `List`; Lucide `ExternalLink`). Copy tiếng Việt theo `design-system/wording/`.
5. Thêm case vào `catalog-validation.test.ts`: url `http://` và `javascript:` bị từ chối.
6. Thêm `cp2_question_bank` vào `questions-cp2.ts` và `cp2.ts`; docx export tự có mục mới.

## Todo
- [ ] Type + validate
- [ ] Nội dung SOM
- [ ] Links CP2
- [ ] UI
- [ ] Test validate

## Success criteria
- `bun run check-types`, test validation pass.
- Mở `?tab=guided&template=cp2`, câu TAM/SAM/SOM hiện 1+ link, mở tab mới.

## Risks
- Link ngoài chết: chấp nhận, sửa file. Slug news đổi tên: dùng URL tuyệt đối, cùng rủi ro.

## Security
Chỉ https; `rel="noopener noreferrer"`.
