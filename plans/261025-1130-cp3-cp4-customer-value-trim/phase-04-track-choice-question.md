# Phase 4: Câu chọn track Scalable/Traditional (radio + Khác)

## Mục tiêu
Thêm `cp4_fund_track`, loại câu chọn đầu tiên của catalog. Tùy chọn, không ẩn câu nào, không sync sang đâu.

## Chữ câu hỏi (user đã duyệt)
- Câu: "Dự án của nhóm thuộc nhóm nào về cách phát triển?"
- ( ) **Phát triển nhanh (Scalable)**: sản phẩm công nghệ hoặc nền tảng, cần đầu tư để chiếm thị phần nhanh, có thể gọi vốn từ nhà đầu tư.
- ( ) **Phát triển vừa phải (Traditional)**: quán ăn, bán lẻ, dịch vụ nhỏ, chủ yếu dùng vốn tự có.
- ( ) **Khác**: hiện ô nhập để nhóm mô tả.
- Giải thích (`explanation`): nhóm Traditional được bỏ qua phần gọi vốn; không chọn cũng không sao. Theo đề, gọi vốn không bắt buộc kể cả với Scalable.

## Thiết kế lưu (đã chốt)
Không lưu nhãn. Lưu JSON trong `answer_text` (cột `Text`, không migration): `{"value":"scalable"|"traditional"|"other","otherText":string|null}`. Lý do: sửa nhãn không làm lựa chọn cũ thành "Khác"; nhập ở Khác đúng bằng nhãn có sẵn không bị đổi lựa chọn khi tải lại.

## Điểm chạm
| File | Việc |
|---|---|
| `packages/validation/src/catalogs/types.ts` | `Question` thêm `options?: { value: string; label: string; description: string }[]` và `allow_other?: boolean`; mở rộng `QuestionSchema` |
| `packages/validation/src/catalogs/answer-choice.ts` (mới) | `OTHER_VALUE = "other"`, `serializeChoice`, `parseChoice(raw, question)` (trả `null` nếu JSON hỏng hoặc `value` không thuộc options), `formatChoice(raw, question)` (nhãn hoặc `otherText`) |
| `packages/validation/src/catalogs/validate-catalog.ts` | câu có `options` phải ≥ 2 lựa chọn, `value` không trùng, không dùng `other` làm value của option (dành riêng) |
| `packages/validation/src/catalogs/questions-cp4.ts` | thêm `cp4_fund_track` |
| `packages/validation/src/catalogs/cp4.ts` | đặt `cp4_fund_track` đầu phase "Nguồn vốn (tuỳ chọn)", `supplemental` |
| `apps/web-1/app/dashboard/case/[id]/_components/guided-documents/GuidedQuestionCard.tsx` | nhánh radio khi `question.options`: Mantine `Radio.Group` + `TextInput` cho "Khác"; `onChange` phát chuỗi đã `serializeChoice` |
| `apps/api/src/modules/guided-documents/infrastructure/docx-generator.ts` | câu có `options`: in `formatChoice(...)` thay vì JSON; `parseChoice` null → coi như trống |
| `packages/validation/src/index.ts` | export `answer-choice` nếu chưa qua barrel `catalogs` |
| `apps/api/src/modules/guided-documents/infrastructure/document-parser.ts:94-96` | `parseAndMatchDocument` đang đề xuất đoạn văn cho mọi câu của template kể cả câu radio; bỏ qua câu có `options` (đề xuất sẽ là chữ thường, không phải JSON, và đọc lại thành "chưa chọn") |
| `apps/api/src/modules/guided-documents/application/save-answers.usecase.ts` | validate tại biên API (Production Standards §4) trước `prisma.$transaction`: với mỗi answer có `question_id` thuộc câu có `options`, `answer_text === ""` được chấp nhận (xóa câu tùy chọn); còn lại gọi `checkChoiceAnswer`, sai thì `throw new AppError(400, "INVALID_CHOICE_ANSWER", <lý do tiếng Việt>)` và KHÔNG lưu answer nào của lô (cả lô bị từ chối, vì lưu trong một transaction). `question_id` lạ vẫn đi qua như hiện tại |

## Quy tắc hành vi
1. "Khác" được chọn nhưng ô chữ rỗng: UI phát chuỗi rỗng `""` (không lưu JSON), để không bị đếm là đã trả lời. Hệ quả chấp nhận được: tải lại trước khi gõ chữ thì radio về trạng thái chưa chọn.
2. Chọn lại lựa chọn thường: `otherText` về `null` (không giữ chữ cũ ngầm).
3. Đọc không nghiêm: `parseChoice` lỗi (JSON hỏng, value không còn trong options vì catalog đổi sau này): UI hiện chưa chọn, không ném lỗi; DOCX coi như chưa trả lời. Ghi thì nghiêm (quy tắc 6). Hai chiều khác nhau là chủ ý: dữ liệu cũ không làm sập trang, dữ liệu mới không bao giờ sai.
4. `isThinAnswer`/`countWords` chỉ áp cho `cp2_`/`cp3_`, không đụng câu này (đã đọc `answer-quality.ts`). Câu radio không hiện cảnh báo "còn ngắn" và không hiện bộ đếm từ.
5. Không có rule `sync-rules` nào lấy câu này làm nguồn (sync sao nguyên văn, sẽ rò JSON nếu có).
6. Kiểm ghi tại API: `checkChoiceAnswer(raw, question)` trong `answer-choice.ts` trả `{ ok: true } | { ok: false; reason }`; `parseChoice` dựa trên nó. Từ chối khi: không phải JSON đối tượng; `value` không thuộc options và khác `other` (hoặc là `other` mà câu không có `allow_other`); `value === "other"` mà `otherText` rỗng sau trim; `value` khác `other` mà `otherText` khác `null`; `otherText` dài quá `MAX_OTHER_TEXT_LENGTH` (hằng có tên cạnh codec, 500 ký tự). Trả 400 `INVALID_CHOICE_ANSWER`, không lưu rồi âm thầm coi như chưa trả lời. Phía client đã kiểm: `useGuidedDrafts.isRetryable` không thử lại 4xx và lưu thủ công hiện `message` của server (dòng 42-45, 216-220); UI radio chặn tổ hợp sai từ trước (quy tắc 1, 2) nên 400 chỉ xảy ra khi có lỗi mã. Nhãn trạng thái autosave "đang chờ kết nối để thử lại" sẽ sai nghĩa với 4xx: chấp nhận, không sửa trong đợt này.

## Test (đặt trong `packages/validation/src/__tests__/`)
- `answer-choice.test.ts`: serialize/parse khứ hồi; `other` với `otherText`; nhập đúng bằng nhãn có sẵn vẫn là `other`; value lạ → `null`; JSON hỏng → `null`; `formatChoice` trả nhãn / chữ nhập.
- `validate-catalog`: câu `options` trùng value, `<2` lựa chọn, value `other` bị từ chối.
- Test DOCX (phase 1) thêm một ca: câu `cp4_fund_track` giá trị `scalable` in ra nhãn, `other` in ra chữ nhập.
- Test API (`guided-documents.test.ts` hoặc file mới cùng thư mục): `saveAnswersUseCase` từ chối JSON hỏng, value lạ, `other` rỗng, `otherText` kèm value thường, `otherText` quá dài; chấp nhận `""`, lựa chọn thường, `other` có chữ; mỗi ca bị từ chối xác nhận không có dòng nào được upsert, kể cả answer hợp lệ cùng lô.

## Smoke
Chạy dev; mở stage `tai-chinh`; chọn Scalable, lưu, tải lại, vẫn là Scalable; chọn Khác, nhập đúng chữ "Phát triển nhanh (Scalable)", tải lại, vẫn là Khác; sửa nhãn trong catalog tạm, tải lại, lựa chọn thường vẫn giữ; xuất DOCX, đọc đúng chữ.

## Tiêu chí xong
- `bun run build && bun run test` ở validation xanh; tsc xanh ở validation, api, web-1.
- Smoke qua được cả các ca trên; không có file mới vượt 200 dòng.
