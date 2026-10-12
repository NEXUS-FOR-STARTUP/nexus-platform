# HƯỚNG DẪN RIÊNG — CHẤM LẠI TÀI LIỆU CP2 SAU KHI SỬA V1

## Metadata

- Prompt ID: cp2_full_resubmit_v1
- Dùng kèm: cp2_audit_core_v1, cp2_full_review_v1
- `schema` trong report.json: `cp2_full_resubmit_v1`
- Giới hạn `report.md`: tối đa 600 từ

## 1. Mục đích

Nhóm đã sửa tài liệu sau lần chấm trước. Cho nhóm biết lỗi cũ đã sửa tới đâu, có lỗi mới không, còn gì phải làm trước khi bảo vệ.

Dùng nguyên danh sách 30 tiêu chí, quy tắc trạng thái và mục kiểm tra phép tính của `cp2_full_review_v1`. Chấm lại toàn bộ 30 tiêu chí trên bản mới, không chép trạng thái cũ.

## 2. Đầu vào thêm

- `input/previous_report.json`: các quyết định lần trước.
- `input/previous_report.md`: báo cáo lần trước.
- `input/change_summary.md`: nhóm tự mô tả đã sửa gì. Đây là lời tự khai; chỉ dùng để biết cần xem chỗ nào, không dùng làm bằng chứng.

Nếu thiếu `previous_report.json`: chấm như lần đầu theo `cp2_full_review_v1`, đặt `schema` là `cp2_full_v1`, ghi ở đầu báo cáo "Chưa có báo cáo lần trước để đối chiếu".

## 3. Đối chiếu lỗi cũ

Với mỗi tiêu chí lần trước không phải `pass`:

- Đã sửa: bản mới đạt `pass`. Đưa id vào `reaudit.fixed`.
- Sửa một phần: trạng thái tốt lên nhưng chưa `pass`. Đưa vào `reaudit.partial`.
- Chưa sửa: trạng thái không đổi hoặc kém đi. Đưa vào `reaudit.still`.

Tiêu chí lần trước `pass` nay kém đi: thêm vào `reaudit.newIssues` dạng "[Tên tiêu chí] bị kém đi: [lý do]". Lỗi mới không thuộc tiêu chí nào cũng ghi vào `reaudit.newIssues`.

Kiểm tra riêng: con số đã đổi giữa hai bản (số phỏng vấn, số phản hồi, tỷ lệ, SOM). Con số tăng mà không có mô tả nhóm đã làm thêm gì là lỗi mới, ghi vào `crossIssues` mức MAJOR với tiêu đề "Số liệu thay đổi không giải thích".

## 4. Định dạng `output/report.md`

```md
# NHẬN XÉT BẢN SỬA CHECKPOINT 2

## 1. Tiến độ
[2–3 câu: sửa được gì quan trọng nhất, còn vướng gì lớn nhất.]

## 2. Đối chiếu lỗi cũ
| Lỗi lần trước | Tình trạng | Căn cứ trong bản mới |
| --- | --- | --- |

## 3. Việc còn phải làm
1. ...

## 4. Lỗi mới phát sinh
[Nếu không có, ghi: Không có lỗi mới.]
```

- Mục 2 chỉ liệt kê tiêu chí lần trước không phải `pass`. Cột "Tình trạng" ghi Đã sửa, Sửa một phần hoặc Chưa sửa.
- Mục 3 tối đa 5 việc, mỗi việc bắt đầu bằng động từ.
- Không viết đoạn văn mẫu, không viết câu trả lời thay nhóm. Không ghi điểm.
- `boardQuestions` vẫn gồm 5 câu, nhắm vào lỗi còn lại.
