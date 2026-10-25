# Phase 1: DOCX gắn nhãn TUỲ CHỌN

## Mục tiêu
DOCX hiện đủ mọi câu (đã vậy). Câu `supplemental` có nhãn "TUỲ CHỌN" viết hoa ở tiêu đề (cả mục lục), và nếu để trống thì dòng trả lời ghi rõ là tùy chọn, để người đọc và agent hiểu có thể không có câu trả lời.

## Hiện trạng (đã đọc)
`apps/api/src/modules/guided-documents/infrastructure/docx-generator.ts`:
- Mục lục: vòng `for (const tq of phase.questions)` quanh dòng 106-124, in `${tocPhaseIdx}.${tocQIdx}. ${qText}`.
- Chi tiết: dòng 161-216; heading `${phaseIndex}.${qIndex}. ${qText}`; trống thì in `'[Chưa có nội dung trả lời]'` (dòng 208).
- `tq.classification` có sẵn trên mỗi `TemplateQuestion`.
- Test: `apps/api/src/shared/infrastructure/tests/guided-documents.test.ts` (chưa đọc nội dung; tìm xem có ghim chữ "[Chưa có nội dung trả lời]" hay heading không).

## Bước
1. Đọc `guided-documents.test.ts`, ghi lại test nào phụ thuộc chữ heading hoặc dòng trống.
2. Thêm hằng có tên trong generator: `OPTIONAL_LABEL = 'TUỲ CHỌN'`, `EMPTY_REQUIRED_TEXT = '[Chưa có nội dung trả lời]'`, `EMPTY_OPTIONAL_TEXT = '[TUỲ CHỌN: nhóm không trả lời]'`.
3. Mục lục và heading: nếu `tq.classification === 'supplemental'`, thêm đoạn chữ sau tiêu đề: `TextRun({ text: \` (${OPTIONAL_LABEL})\`, bold: true, color: <màu nhấn cùng bảng màu file> })`. Heading vẫn một Paragraph (không tách đoạn) để cấu trúc heading không đổi.
4. Dòng trống: chọn `EMPTY_OPTIONAL_TEXT` hay `EMPTY_REQUIRED_TEXT` theo classification.
5. `recommended` ("Nên có"): giữ nguyên, không gắn nhãn (user chưa yêu cầu).

## Phạm vi và hệ quả
Generator dùng chung cp1, cp2, cp3, cp4, pitch: mọi câu `supplemental` ở các template đó nhận nhãn mới. Chủ ý.

## Test
- Cập nhật test nào ghim chữ cũ (bước 1).
- Đã kiểm import DOCX (`document-parser.ts:104-137`): khớp theo tỷ lệ từ khóa của câu hỏi trong từng đoạn; thêm chữ "TUỲ CHỌN" vào tiêu đề làm đoạn dài hơn nhưng không giảm điểm khớp, nên không làm hỏng việc nhập lại DOCX đã xuất. Dòng trống "[TUỲ CHỌN: nhóm không trả lời]" cũng là một đoạn có chữ ("nhóm", "trả", "lời"): rủi ro khớp nhầm câu ngắn tương đương dòng cũ, không tăng đáng kể.
- Thêm một test hồi quy: sinh DOCX từ template có cả câu `required` và `supplemental` để trống; giải nén `word/document.xml`, kiểm: câu `supplemental` có "TUỲ CHỌN" ở heading và dòng trống mới; câu `required` trống vẫn "[Chưa có nội dung trả lời]". Phải fail trước khi sửa generator.

## Tiêu chí xong
- Test mới xanh, test cũ liên quan xanh.
- Mở một DOCX thật sinh từ case có câu tùy chọn trống: nhìn thấy nhãn ở mục lục, tiêu đề và dòng trống.
