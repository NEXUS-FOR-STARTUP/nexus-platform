# HƯỚNG DẪN RIÊNG — CHẤM MÔ HÌNH KINH DOANH VÀ SWOT V1

## Metadata

- Prompt ID: cp3_full_review_v1
- Dùng kèm: cp3_audit_core_v1
- `schema` trong report.json: `cp3_full_v1`
- Độ dài `report.md`: tối đa 900 từ

## 1. Mục đích

Nhóm đã viết phần Business Model Canvas, SWOT, chiến lược và kết luận của Checkpoint 3. Đánh giá nội dung theo rubric dưới đây để nhóm biết hội đồng sẽ chất vấn chỗ nào và cần sửa gì trước khi trình bày. Phần sản phẩm thử và giao diện không thuộc phạm vi chấm (luật 3.1 của tệp core).

Nếu có `input/user_note.md`: đó là ghi chú của nhóm cho lần chấm này (ví dụ muốn chú tâm vào phần nào). Ưu tiên soi kỹ phần họ nêu nhưng vẫn chấm đủ 24 tiêu chí, không bỏ tiêu chí nào vì ghi chú.

## 2. Hằng số

Ghi nhớ các hằng số sau, không tự thay đổi:

- `SWOT_QUANT_PASS_RATIO` = 0,7
- `SWOT_QUANT_PARTIAL_RATIO` = 0,4

*Mục SWOT có số liệu* là mục có con số, hoặc ví dụ kiểm chứng được có nguồn, ngày hoặc quy mô. Đếm theo **mục**, không theo từ.

## 3. Danh sách tiêu chí

Phải trả đúng 24 id sau trong `checks`. Cột "Nguồn" là `question_id` chính cần đọc; vẫn đọc các phần khác và tệp đính kèm khi cần. Không dùng `not_applicable`. Cột "Mức" cố định theo bảng, không tự đặt:

| Mức | id |
| --- | --- |
| Bắt buộc (gate không đạt → điểm tổng trần 49; một phần → trần 74) | `c3_bmc_complete`, `c3_swot_complete`, `c3_swot_quantified` |
| Cốt lõi (core fail/missing → điểm tổng trần 74) | `c3_segment_narrow`, `c3_usp_differentiated`, `c3_bmc_no_contradiction`, `c3_strategies_complete`, `c3_strategy_pairing` |
| Hoàn thiện (còn lại) | 16 id còn lại |

Nội dung nhóm viết ở đâu cũng được tính (trong câu trả lời hay tệp đính kèm, theo mã hay theo mô tả). Không chấm hình thức.

### Nhóm A — Khách hàng và giá trị

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `c3_segment_narrow` | cp3_bmc_customer_segments | Nêu rõ phân khúc theo ít nhất hai trong ba yếu tố: ai (đặc điểm cụ thể), ở đâu, quy mô tiêu thụ; không phải "mọi người" hay "sinh viên" nói chung | Có phân khúc nhưng chỉ nêu một yếu tố, hoặc quy mô không rõ | Phân khúc quá rộng hoặc không nêu |
| `c3_usp_differentiated` | cp3_bmc_value_proposition | Nêu điều khiến sản phẩm khác biệt và vì sao khó bắt chước hoặc có tính mới; nêu ít nhất một đối tượng để so sánh | Có nêu điểm khác nhưng không giải thích vì sao khó bắt chước, hoặc không có đối tượng so sánh | Chỉ liệt kê tính năng hoặc lợi ích chung, không có điểm khác biệt |
| `c3_value_fits_pain` | cp3_bmc_value_proposition; cp3_bmc_customer_segments | Giá trị nêu đúng nỗi đau hoặc nhu cầu của chính phân khúc ở ô khách hàng | Giá trị nói chung chung, chạm nỗi đau nhưng không rõ của phân khúc nào | Giá trị không liên quan phân khúc đã chọn |
| `c3_channels_fit_segment` | cp3_bmc_channels; cp3_bmc_customer_segments | Có kênh truyền thông và kênh bán; mỗi kênh có lý do khách hàng của phân khúc ở đó | Chỉ một loại kênh, hoặc kênh nêu tên mà không có lý do | Kênh không chạm tới phân khúc, hoặc không có kênh |
| `c3_retention_mechanism` | cp3_bmc_customer_relationships | Nêu cách thu hút khách mới và một cơ chế khiến khách quay lại hoặc ở lại | Chỉ một trong hai, hoặc cơ chế chung chung | Không nêu cách giữ chân |

### Nhóm B — Mô hình tiền

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `c3_revenue_concrete` | cp3_bmc_revenue_streams | Nêu nguồn thu chính, đơn vị tính (theo lần, tháng, gói), và ghi rõ giá hoặc cách tính tiền; có căn cứ cho mức giá thì tốt hơn nhưng không bắt buộc | Có nguồn thu nhưng thiếu cách tính tiền hoặc đơn vị | Không nêu nguồn thu |
| `c3_cost_quantified` | cp3_bmc_cost_structure | Chia khoản chi đầu tư ban đầu và chi vận hành, gọi tên các khoản chính; số ước tính là điểm cộng, không bắt buộc | Có liệt kê khoản chi nhưng không chia hai loại, hoặc bỏ sót khoản chính | Không nêu cấu trúc chi phí |
| `c3_revenue_vs_cost` | cp3_bmc_revenue_streams; cp3_bmc_cost_structure | Hai phần không tự mâu thuẫn (giá theo lần khớp giá theo tháng; nguồn thu có khoản chi tương ứng); phép tính doanh thu và chi phí (nếu có) đúng khi tính lại | Có chỗ lệch nhỏ cần nhóm giải thích | Mâu thuẫn rõ (cùng giá khác con số; chi phí cho hoạt động không tạo ra nguồn thu nào) |

### Nhóm C — Vận hành

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `c3_resources_to_activities` | cp3_bmc_key_resources; cp3_bmc_key_activities | Mỗi hoạt động chính có nguồn lực tương ứng; nguồn lực thuộc các loại phù hợp (nhân lực, tài lực, máy móc, công nghệ, mặt bằng, vốn) | Có nguồn lực nhưng một hoạt động chính không có nguồn lực | Hai ô không liên hệ nhau, hoặc thiếu một ô |
| `c3_activities_create_value` | cp3_bmc_key_activities; cp3_bmc_value_proposition | Hoạt động chính nêu cụ thể và tạo ra giá trị hoặc doanh thu đã nêu | Hoạt động nêu chung chung ("phát triển sản phẩm") | Hoạt động không liên quan giá trị đã nêu, hoặc không có |
| `c3_partners_dependency` | cp3_bmc_key_partners | Nêu đối tác (nhà cung cấp, cố vấn) và mức phụ thuộc vào họ | Nêu đối tác nhưng không nói mức phụ thuộc | Không nêu đối tác |

### Nhóm D — Nhất quán BMC

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `c3_bmc_complete` | cả chín câu cp3_bmc_* | Cả chín ô đều có nội dung thật (không để trống, không chỉ ghi "chưa có") | Một hoặc hai ô trống hoặc chỉ có một dòng không có nội dung | Từ ba ô trống hoặc nội dung vô nghĩa; hoặc không có BMC (khi đó dùng `missing`) |
| `c3_bmc_no_contradiction` | cả chín câu cp3_bmc_* | Không có mâu thuẫn giữa các ô theo danh sách ở mục 4 của tệp core | Một mâu thuẫn cần nhóm giải thích | Từ hai mâu thuẫn, hoặc một mâu thuẫn làm sụp đổ mô hình (ví dụ nguồn thu không có hoạt động nào tạo ra) |

### Nhóm E — SWOT

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `c3_swot_complete` | cp3_swot_strengths; cp3_swot_weaknesses; cp3_swot_opportunities; cp3_swot_threats | Đủ S, W, O, T, mỗi nhóm có ít nhất một mục có nội dung thật | Có đủ bốn nhóm nhưng một nhóm chỉ có một mục sơ sài | Thiếu một nhóm trở lên (khi đó dùng `missing` nếu không có SWOT) |
| `c3_swot_quantified` | cả bốn câu cp3_swot_* | `pass` khi tỷ lệ mục có số liệu ≥ `SWOT_QUANT_PASS_RATIO` **và** mỗi nhóm S, W, O, T có ít nhất một mục có số liệu | Tỷ lệ từ `SWOT_QUANT_PARTIAL_RATIO` đến dưới `SWOT_QUANT_PASS_RATIO`; hoặc ≥ `SWOT_QUANT_PASS_RATIO` nhưng một nhóm không có mục nào có số liệu | Tỷ lệ dưới `SWOT_QUANT_PARTIAL_RATIO` (không có SWOT: `missing`) |
| `c3_weakness_honest` | cp3_swot_weaknesses | Điểm yếu là điểm yếu thật của dự án (thiếu nguồn lực, phụ thuộc, rủi ro) | Một phần là điểm mạnh được viết lại thành điểm yếu | Phần lớn là điểm mạnh trá hình ("làm việc quá chăm chỉ") |
| `c3_opportunity_sourced` | cp3_swot_opportunities | Mỗi cơ hội chính có nguồn kiểm chứng được (báo cáo, số liệu công khai, khảo sát có tên) | Một số cơ hội có nguồn, số khác chỉ là nhận định | Cơ hội không có nguồn nào |
| `c3_threat_competition` | cp3_swot_threats | Trong tài liệu CP3 có ít nhất một thách thức từ đối thủ hoặc giải pháp thay thế | Thách thức chỉ từ bên ngoài chung (kinh tế, quy định) | Không có thách thức nào |

Với `c3_swot_quantified`: ghi từng mục SWOT vào `cp3_evidence.json` (`swotItems`), đếm bằng shell, ghi vào `calcChecks`, rồi quyết định theo ngưỡng. Không tự cảm nhận.

### Nhóm F — Chiến lược

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `c3_strategies_complete` | cp3_strategy_so; cp3_strategy_st; cp3_strategy_wo; cp3_strategy_wt | Có đủ bốn loại chiến lược (mạnh + cơ hội, mạnh + thách thức, yếu + cơ hội, yếu + thách thức), mỗi loại ít nhất một | Có ba loại | Có từ hai loại trở xuống |
| `c3_strategy_pairing` | cp3_strategy_so; cp3_strategy_st; cp3_strategy_wo; cp3_strategy_wt | Mỗi chiến lược truy được về yếu tố SWOT nó dựa vào (bằng mã, tên hay mô tả) và ghép đúng loại | Một chiến lược không truy được hoặc ghép sai loại | Từ hai chiến lược không truy được, hoặc chiến lược nêu yếu tố không có trong SWOT |
| `c3_strategy_actionable` | cp3_strategy_so; cp3_strategy_st; cp3_strategy_wo; cp3_strategy_wt | Hành động cụ thể, dựa trên số liệu hoặc xu hướng trong SWOT, làm được trong thời gian dự án | Hành động cụ thể nhưng không dựa trên số liệu, hoặc vượt khả năng thời gian dự án | Hành động chung chung ("đẩy mạnh quảng bá") |

### Nhóm G — Kết luận

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `c3_findings_grounded` | cp3_key_findings | Phát hiện chính cụ thể, có số, khớp các phần trên. Không bình luận sản phẩm thử tốt hay xấu | Phát hiện cụ thể nhưng không có số hoặc khớp một phần | Phát hiện chung chung hoặc mâu thuẫn phần trên |
| `c3_feasibility_evidence` | cp3_business_feasibility | Nêu lý do khả thi có bằng chứng đỡ và nêu điều chưa chắc chắn | Có lý do nhưng không có bằng chứng, hoặc không nêu điều chưa chắc | Chỉ khẳng định khả thi, không có lý do |
| `c3_next_steps_actionable` | cp3_future_development | Bước tiếp theo cụ thể, gắn với kết quả mong đợi | Bước tiếp theo cụ thể nhưng không gắn kết quả | Hướng chung chung ("mở rộng thị trường") |

## 4. Nếu thiếu dữ liệu

- Câu hỏi vắng mặt khi chấm bằng tệp không phải là "chưa trả lời" (luật 3.5 của tệp core).
- Không có BMC hoặc SWOT: các tiêu chí liên quan là `missing`, đưa việc bổ sung vào `actionPlan`.

## 5. Định dạng `output/report.md`

```md
# NHẬN XÉT TÀI LIỆU CHECKPOINT 3

## 1. Tóm tắt
[2–3 câu: điểm mạnh nhất của tài liệu và lỗi quan trọng nhất.]

## 2. Yêu cầu bắt buộc
| Yêu cầu | Tình trạng | Căn cứ |
| --- | --- | --- |
| Điền đủ và hợp lý chín ô BMC | | |
| SWOT đủ bốn nhóm có nội dung thật | | |
| Yếu tố SWOT có dữ liệu định lượng | | |

## 3. Lỗi quan trọng nhất
1. **[Tên tiêu chí]**: [trích dẫn ngắn]. [Vì sao hội đồng sẽ hỏi]. [Việc cần làm]

## 4. Việc cần làm trước khi trình bày
1. ...

## 5. Khác biệt so với giai đoạn trước
[Chỉ ghi nếu có mục `crossIssues` loại này; bằng lời, dưới dạng câu hỏi nhóm giải thích. Không có thì bỏ mục.]
```

- Mục 3: tối đa 7 lỗi, xếp theo Mức: Bắt buộc, rồi Cốt lõi, rồi Hoàn thiện.
- Mục 4: tối đa 5 việc, mỗi việc bắt đầu bằng động từ.
- Không viết đoạn văn mẫu, không viết ô BMC hay mục SWOT thay nhóm. Không ghi điểm. Không nhắc sản phẩm thử hay giao diện.
