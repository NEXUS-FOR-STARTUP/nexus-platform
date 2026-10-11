# Brainstorm: mở rộng dịch vụ sang CP2 (2026-10-10)

## Problem
Template CP1-4 xong (`ProjectAnswer` + catalog). Chưa có dịch vụ chấm cho CP2+. Engine audit gắn CP1: prompt `input_clarification_gate_v4_1*`, `checkpoint_code: "CP1"` hardcode ở `submit-intake.usecase.ts`, `case.repository.ts`.

## Inputs
- Pre-OC1 feedback giảng viên: CP2 là hướng mở rộng đúng; bám syllabus, bỏ design thinking/thi cấp Bộ; gói nâng cao CP2; phỏng vấn thật > survey Google Form; TAM bottom-up; Figma outline -> Lovable/Google Sites; không làm thay nhóm; báo cáo rút gọn; khách CP1 hết từ tuần 4.
- News: bài TAM/SAM/SOM (bottom-up theo kênh), bài AI slop (AI chất vấn, không viết hộ).

## Decisions (agreed)
1. SOM dạy theo news: kênh x tiếp cận x tỷ lệ tải x tỷ lệ trả phí. Sửa `explanation` của `cp2_tam_sam_som` cho khớp.
2. Gói CP2 riêng (`ServiceType` mới). Không bắt buộc hoàn tất CP1.
3. Link đọc thêm: mảng `{ url, title }[]` tùy chọn trên `Question`, nằm trong catalog (code), không DB. Chỉ `https://`, validate ở `validate-catalog.ts`; UI mở tab mới `rel="noopener noreferrer"`.
4. Ranh giới: AI chỉ chấm/chất vấn, không soạn đáp án; sync-rules chỉ chép câu trả lời đã lưu.

## Scope order
0. Sửa nội dung SOM (không phụ thuộc gì).
1. Readiness check miễn phí: đếm câu `required` đã lưu / tổng, danh sách câu thiếu, 3 mục auto-fail (>=2 chuyên gia >=6 tháng, survey >=100, AI disclosure) tự tick. Không AI, không credit. Chỉ biết có/không trả lời, không biết chất lượng.
2. CP2 audit: engine cũ + prompt CP2 từ rubric. Trọng số: phỏng vấn thật > survey; TAM bottom-up; xác thực persona/pain; pivot. Báo cáo ngắn. Phát hiện số liệu trùng ví dụ trong bài news.
3. `further_reading` links trên `Question` + UI.
Song song (không code): bài news mới (phỏng vấn, persona/pain, Figma, MVP bằng AI), clip hướng dẫn, kênh CLB Khởi nghiệp.

## Deferred
Debate simulator, CP3 audit, cross-CP consistency (`logic_check`), CP4, DB-backed links.

## Risks / checks
- Chưa xác nhận `DocumentRecord` guided-docx có `checkpoint_id` đúng để worker nhận. Đọc trước khi code bước 2.
- Rubric: survey >=100 là auto-fail nhưng giảng viên coi survey giá trị thấp -> giữ nhắc đủ, chấm nặng phỏng vấn.
- CP1 giờ yêu cầu 2 idea, giá 79k cho 2 idea x 2 lần chấm (feedback). `ProjectAnswer` unique `case_id + question_id` = 1 bộ/case. Chưa kiểm tra; việc riêng ngoài CP2.
- Link ngoài: chỉ https; link chết là rủi ro chấp nhận (sửa file catalog).
- "Trả tiền khi đạt hiệu quả" không làm nghĩa đen (không định nghĩa được, dễ thành cam kết điểm); thay bằng Readiness miễn phí.

## Success metrics
- Số nhóm mở Readiness CP2 / số nhóm trả credit audit CP2.
- Tỷ lệ nhóm sửa bài giữa vòng 1 và 2.
- Báo cáo CP2 đọc xong < vài phút (rút gọn so CP1).

## Next
`/ck:plan` cho bước 0-3.
