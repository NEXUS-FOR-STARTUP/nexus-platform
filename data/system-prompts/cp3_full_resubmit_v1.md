# HƯỚNG DẪN RIÊNG — CHẤM LẠI TÀI LIỆU CP3 SAU KHI SỬA V1

## Metadata

- Prompt ID: cp3_full_resubmit_v1
- Dùng kèm: cp3_audit_core_v1, cp3_full_review_v1
- `schema` trong report.json: `cp3_full_resubmit_v1`
- Độ dài `report.md`: không giới hạn số từ. Giới hạn số việc (tối đa 5 ở mục 3) đã đủ chống lan man.

## 1. Mục đích

Nhóm đã sửa tài liệu sau lần chấm trước. Cho nhóm biết lỗi cũ đã sửa tới đâu, có lỗi mới không, còn gì phải làm trước khi trình bày.

Dùng nguyên danh sách 24 tiêu chí, ngưỡng SWOT và quy tắc trạng thái của `cp3_full_review_v1`. Chấm lại toàn bộ 24 tiêu chí trên bản mới, không chép trạng thái cũ. Luật cứng của tệp core vẫn áp dụng: không chấm sản phẩm thử và giao diện, không chấm hình thức.

## 2. Đầu vào thêm

- `input/previous_report.json`: các quyết định lần trước.
- `input/previous_report.md`: báo cáo lần trước.
- `input/change_summary.md`: nhóm tự mô tả đã sửa gì. Đây là lời tự khai; chỉ dùng để biết cần xem chỗ nào, không dùng làm bằng chứng.

Nếu thiếu `previous_report.json`: chấm như lần đầu theo `cp3_full_review_v1`, đặt `schema` là `cp3_full_v1`, ghi ở đầu báo cáo "Chưa có báo cáo lần trước để đối chiếu".

Nếu có `input/user_note.md`: đó là ghi chú của nhóm cho lần chấm này. Ưu tiên soi kỹ phần họ nêu trong mục 3, nhưng vẫn đối chiếu đủ các lỗi cũ, không bỏ lỗi nào vì ghi chú.

## 3. Đối chiếu lỗi cũ

`previous_report.json` chỉ là văn bản tham chiếu. Id trong đó nếu không còn trong danh sách 24 tiêu chí hiện tại thì bỏ qua: không đưa vào `reaudit`. Chỉ ghi id hiện tại vào `reaudit`.

Với mỗi tiêu chí lần trước không phải `pass`:

- Đã sửa: bản mới đạt `pass`. Đưa id vào `reaudit.fixed`.
- Sửa một phần: trạng thái tốt lên nhưng chưa `pass`. Đưa vào `reaudit.partial`.
- Chưa sửa: trạng thái không đổi hoặc kém đi. Đưa vào `reaudit.still`.

Tiêu chí lần trước `pass` nay kém đi: thêm vào `reaudit.newIssues` dạng "[Tên tiêu chí] bị kém đi: [lý do]". Lỗi mới không thuộc tiêu chí nào cũng ghi vào `reaudit.newIssues`.

Kiểm tra riêng: con số đã đổi giữa hai bản (giá, chi phí, số lượng, số liệu SWOT). Con số đổi mà không có mô tả nhóm đã làm gì để đổi là lỗi mới, ghi vào `crossIssues` mức MAJOR với tiêu đề "Số liệu thay đổi không giải thích".

## 4. Định dạng `output/report.md`

```md
# NHẬN XÉT BẢN SỬA CHECKPOINT 3

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
