# HƯỚNG DẪN RIÊNG — CHẤM BẢNG HỎI TRƯỚC KHI ĐI KHẢO SÁT V1

## Metadata

- Prompt ID: cp2_questionnaire_review_v1
- Dùng kèm: cp2_audit_core_v1
- `schema` trong report.json: `cp2_questionnaire_v1`
- Giới hạn `report.md`: tối đa 700 từ

## 1. Mục đích

Nhóm chưa đi phỏng vấn và khảo sát. Mục tiêu là chặn lỗi trước khi nhóm tốn công hỏi sai người, hỏi sai câu. Đánh giá bộ câu hỏi phỏng vấn khách hàng, câu hỏi chuyên gia và bảng hỏi khảo sát, đối chiếu với câu hỏi nghiên cứu và giả thuyết của nhóm.

Đầu vào chính trong `input/cp2_answers.md`:

- `cp2_research_objectives`: câu hỏi nghiên cứu.
- `cp2_vpc_customer_profile`, `cp2_problem_need`: giả thuyết về khách hàng và nỗi đau.
- `cp2_question_bank`: bản nháp câu hỏi phỏng vấn khách hàng, câu hỏi chuyên gia, bảng hỏi khảo sát.
- `cp2_customer_discovery_process`, `cp2_expert_interviews`, `cp2_survey`: kế hoạch tuyển người, nếu nhóm đã viết.
- Tệp trong `input/attachments/` (thường là PDF in từ Google Form hoặc `.docx`). Nếu `cp2_question_bank` trống hoặc ghi "(Nhóm chưa trả lời)", lấy bảng hỏi từ các tệp này. Nếu cả hai đều có, dùng tệp làm bản chính và ghi ở `crossIssues` mức `MINOR` nếu hai bản khác nhau.
- Nếu nhóm chỉ dán link Google Form mà không có nội dung câu hỏi, không mở link; đánh `qr_wording`, `qr_scales`, `qr_options` là `missing` với ghi chú "Chưa có nội dung bảng hỏi. Tải bảng hỏi lên dưới dạng tệp hoặc dán câu hỏi vào ô".

Không chấm kết quả khảo sát vì chưa có. Nếu tài liệu đã có kết quả, vẫn chỉ chấm bảng hỏi và kế hoạch.

## 2. Danh sách tiêu chí

Phải trả đúng 12 id sau trong `checks`.

| id | Tên tiêu chí | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `qr_research_link` | Câu hỏi bám câu hỏi nghiên cứu | Có 3–5 câu hỏi nghiên cứu cụ thể; mỗi câu nghiên cứu có ít nhất một câu phỏng vấn hoặc khảo sát phục vụ; không có câu khảo sát nào thừa | Có câu nghiên cứu nhưng còn câu nghiên cứu không có câu hỏi phục vụ, hoặc có 1–2 câu khảo sát thừa | Không có câu hỏi nghiên cứu, hoặc bảng hỏi không liên hệ được với câu nghiên cứu |
| `qr_target_screening` | Đúng người, tìm được người | Mô tả người cần hỏi đủ hẹp; có câu sàng lọc loại người ngoài phân khúc; có kênh tuyển cụ thể và số lượng dự kiến cho từng nhóm | Có phân khúc và kênh nhưng thiếu câu sàng lọc hoặc thiếu số lượng | Đối tượng quá rộng ("sinh viên", "mọi người") hoặc không nói tìm người ở đâu |
| `qr_past_behavior` | Phỏng vấn hỏi hành vi đã xảy ra | Phần lớn câu phỏng vấn khách hàng hỏi lần gần nhất gặp vấn đề, đã làm gì, tốn bao nhiêu thời gian hoặc tiền, đang dùng cách nào | Có câu về hành vi nhưng vẫn còn câu giả định quan trọng | Chủ yếu là câu giả định hoặc ý kiến ("bạn có dùng không", "bạn thấy ý tưởng thế nào") |
| `qr_no_pitch_no_lead` | Không dẫn dắt, không chào hàng | Câu mở, trung tính; khai thác vấn đề trước, chỉ nói về giải pháp ở cuối nếu có | Có vài câu dẫn dắt hoặc nhắc giải pháp sớm | Mở đầu bằng giới thiệu sản phẩm, hoặc nhiều câu gợi sẵn câu trả lời |
| `qr_commitment_probe` | Có bước kiểm tra cam kết | Kế hoạch có bước yêu cầu người được hỏi cam kết thật (để lại liên hệ dùng thử, hẹn buổi sau, giới thiệu người khác, đặt cọc) | Chỉ hỏi ý định trả tiền | Không có |
| `qr_expert_plan` | Kế hoạch phỏng vấn chuyên gia | Ít nhất 2 chuyên gia dự kiến, đúng lĩnh vực, ghi rõ từ 6 tháng kinh nghiệm; câu hỏi chuyên gia khác câu hỏi khách hàng và hỏi về góc nhìn thị trường, điều cần tránh, kinh nghiệm với khách hàng mục tiêu | Có chuyên gia nhưng thiếu số tháng kinh nghiệm, hoặc dùng chung câu hỏi khách hàng | Chưa có kế hoạch chuyên gia |
| `qr_survey_minimum` | Mức tối thiểu của rubric | Bảng hỏi có từ 7 câu, từ 2 loại câu hỏi trở lên, kế hoạch thu từ 100 phản hồi | Thiếu một trong ba | Thiếu từ hai trong ba, hoặc chưa có bảng hỏi |
| `qr_wording` | Câu chữ khảo sát | Không câu nào hỏi hai ý, dẫn dắt, phủ định kép, dùng từ mơ hồ không định nghĩa, đặt trạng từ mức độ trong mệnh đề cần đồng ý, hoặc hỏi điều người trả lời không biết | 1–2 câu mắc lỗi | Từ 3 câu mắc lỗi |
| `qr_scales` | Thang đo | Phương án trả lời đúng câu hỏi; thang hai chiều 5 mức có mức giữa; thang một chiều 4 mức không có "trung lập"; "Không áp dụng" để cuối; mọi mức có nhãn chữ; cân bằng hai phía; ưu tiên hỏi thẳng thuộc tính thay vì Đồng ý/Không đồng ý | 1–2 thang mắc lỗi | Từ 3 thang mắc lỗi, hoặc phần lớn dùng Đồng ý/Không đồng ý cho nhận định có trạng từ mức độ |
| `qr_options` | Phương án lựa chọn | Khoảng không hở, không chồng; có "Khác" khi cần; không xếp hạng danh sách trên 5 mục; tránh thanh trượt; lưới nhiều hàng đã cân nhắc hiển thị trên điện thoại | 1–2 câu mắc lỗi | Từ 3 câu mắc lỗi |
| `qr_analysis_plan` | Kế hoạch dùng dữ liệu | Nói được mỗi nhóm câu sẽ phân tích ra sao (tỷ lệ, so theo nhóm); câu mở ít và có cách tổng hợp; dữ liệu cho TAM/SAM/SOM và giá được hỏi theo hành vi chi tiêu hiện tại, không chỉ hỏi ý định trả tiền | Có kế hoạch một phần, hoặc dữ liệu tỷ lệ trả phí chỉ dựa vào câu ý định | Không có kế hoạch; nhiều câu mở không có cách tổng hợp |
| `qr_ethics_pilot` | Đồng thuận và thử trước | Có lời giới thiệu mục đích, đồng thuận, ẩn danh, cách lưu dữ liệu; có kế hoạch thử bảng hỏi với 3–5 người rồi sửa trước khi phát | Có một trong hai phần | Không có cả hai |

`not_applicable` không dùng trong loại chấm này.

## 3. Nhận xét từng câu hỏi

Với mỗi câu hỏi phỏng vấn hoặc khảo sát có lỗi, thêm một phần tử vào `itemReviews`:

- `source`, `no`: vị trí câu trong `questionnaireItems`.
- `problems`: tên lỗi ngắn, ví dụ "hỏi hai ý", "câu giả định", "thang thiếu mức giữa", "khoảng chồng nhau".
- `direction`: hướng sửa bằng nguyên tắc hoặc khung có chỗ trống. Không viết lại câu hoàn chỉnh cho nhóm.

Không liệt kê câu không có lỗi. Tối đa 15 câu; nếu nhiều hơn, chọn câu ảnh hưởng nhiều nhất và ghi trong báo cáo "Các câu còn lại có lỗi tương tự".

## 4. Định dạng `output/report.md`

```md
# NHẬN XÉT BẢNG HỎI TRƯỚC KHI ĐI KHẢO SÁT

## 1. Ba việc cần sửa trước khi phát
1. ...
2. ...
3. ...

## 2. Đối chiếu với câu hỏi nghiên cứu
[2–4 câu: câu nghiên cứu nào chưa có câu hỏi phục vụ; câu hỏi nào thừa.]

## 3. Phỏng vấn khách hàng và chuyên gia
[Lỗi chính, trích câu hỏi cụ thể, vì sao sẽ cho dữ liệu sai. Tối đa 5 ý.]

## 4. Bảng hỏi khảo sát
| Câu | Lỗi | Hướng sửa |
| --- | --- | --- |

## 5. Lưu ý khi đi khảo sát
[Tối đa 4 ý: tìm đúng người, thử trước với vài người, ghi lại lời nguyên văn, xin cam kết.]
```

Không ghi điểm, không ghi kết luận đạt hay chưa đạt.
