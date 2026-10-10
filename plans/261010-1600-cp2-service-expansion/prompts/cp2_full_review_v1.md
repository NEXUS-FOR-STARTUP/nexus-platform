# HƯỚNG DẪN RIÊNG — CHẤM TOÀN BỘ TÀI LIỆU CP2 V1

## Metadata

- Prompt ID: cp2_full_review_v1
- Dùng kèm: cp2_audit_core_v1
- `schema` trong report.json: `cp2_full_v1`
- Giới hạn `report.md`: tối đa 900 từ

## 1. Mục đích

Nhóm đã phỏng vấn, khảo sát và viết tài liệu CP2. Đánh giá tài liệu theo rubric CP2 với trọng tâm: bằng chứng sơ cấp thật, giả thuyết ban đầu đã được kiểm chứng tới đâu, quy mô thị trường tính đúng phương pháp và đúng phép tính. Mục tiêu là để nhóm biết hội đồng sẽ chất vấn chỗ nào và cần làm gì trước khi bảo vệ.

## 2. Danh sách tiêu chí

Phải trả đúng 30 id sau trong `checks`. Cột "Nguồn" là `question_id` chính cần đọc; vẫn đọc các phần khác khi cần đối chiếu. `not_applicable` không dùng trong loại chấm này.

### Nhóm A — Khách hàng và vấn đề

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `fr_problem_situation` | cp2_problem_need | Nêu ai gặp vấn đề, trong tình huống nào, hậu quả đo được, vì sao cách hiện tại chưa đủ | Thiếu hậu quả đo được hoặc thiếu tình huống | Vấn đề chung chung, không có người và tình huống cụ thể |
| `fr_segment_narrow` | cp2_vpc_customer_profile | Khách hàng mục tiêu đủ hẹp để tìm được người thật; tách người dùng và người trả tiền nếu khác nhau | Có phân khúc nhưng còn rộng, hoặc chưa tách người dùng và người trả tiền khi cần | "Sinh viên", "mọi người" hoặc tương đương |
| `fr_vpc_grounded` | cp2_vpc_customer_profile | Customer Jobs, Pains, Gains đều dẫn từ dữ liệu phỏng vấn hoặc khảo sát (có số hoặc trích lời) | Có dữ liệu cho một phần | Viết theo suy đoán, không dẫn dữ liệu |
| `fr_value_map_fit` | cp2_vpc_value_map | Mỗi Pain Reliever chỉ rõ xử lý Pain nào, mỗi Gain Creator chỉ rõ Gain nào; nêu Pain chưa giải quyết | Khớp một phần | Danh sách tính năng không đối chiếu với hồ sơ khách hàng |

### Nhóm B — Bằng chứng sơ cấp

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `fr_research_questions` | cp2_research_objectives | 3–5 câu hỏi nghiên cứu cụ thể, mỗi câu gắn nguồn dữ liệu, và phần kết quả trả lời từng câu | Có câu hỏi nhưng kết quả không trả lời đủ | Không có hoặc chỉ là mục tiêu chung |
| `fr_interview_scale_method` | cp2_customer_discovery_process | Có phỏng vấn khách hàng mục tiêu thật, từ 10 người mỗi nhóm đối tượng chính; nêu cách chọn người, thời lượng, cách tổng hợp, giới hạn mẫu | 5–9 người mỗi nhóm, hoặc thiếu mô tả phương pháp | Dưới 5 người, không phỏng vấn, hoặc chỉ có khảo sát |
| `fr_interview_quality` | cp2_customer_discovery_process | Câu hỏi và insight dựa trên hành vi đã xảy ra (lần gần nhất, đã làm gì, tốn gì); không dựa vào lời khen hay ý định tương lai | Lẫn cả hai loại | Chủ yếu là ý kiến, lời khen, câu giả định |
| `fr_insight_traceable` | cp2_customer_discovery_process | Mỗi insight có tỷ lệ dạng x/N và trích lời; có bảng chủ đề, bằng chứng, quan sát, insight hoặc tương đương | Có số nhưng thiếu trích lời, hoặc ngược lại | Insight không truy được về dữ liệu |
| `fr_expert_gate` | cp2_expert_interviews | Từ 2 chuyên gia; mỗi người có chức danh hoặc đơn vị và ghi rõ từ 6 tháng kinh nghiệm | Đủ 2 người nhưng có người không ghi số tháng hoặc năm kinh nghiệm (thiếu thông tin, không phải dưới mức) | Dưới 2 chuyên gia, hoặc có người ghi dưới 6 tháng kinh nghiệm |
| `fr_expert_learning` | cp2_expert_interviews | Mỗi chuyên gia có điều học được cụ thể về thị trường, điều cần tránh, kinh nghiệm với khách hàng mục tiêu; tài liệu nói nhóm đã đổi gì nhờ đó | Có điều học được nhưng chung chung hoặc không thấy được dùng | Không có điều học được |
| `fr_survey_gate` | cp2_survey; tệp dữ liệu nếu có (không bắt buộc) | Nhóm ghi rõ từ 100 phản hồi, từ 7 câu hỏi, từ 2 loại câu hỏi | Chưa xác định được vì nhóm ghi không rõ (ví dụ "khoảng 100", không nêu loại câu hỏi); hoặc tệp nhóm đính kèm mâu thuẫn với số nhóm ghi | Số nhóm ghi dưới mức ở bất kỳ điều kiện nào (ví dụ 85 phản hồi, 6 câu, chỉ 1 loại câu), hoặc không có khảo sát |
| `fr_survey_design` | cp2_survey, phụ lục | Câu hỏi không mắc lỗi câu chữ, thang đo, phương án theo mục 5.2 của tệp core | 1–2 lỗi | Từ 3 lỗi, hoặc không trình bày bảng hỏi để kiểm tra |
| `fr_survey_sampling` | cp2_survey | Nêu đối tượng có thuộc khách hàng mục tiêu, cách tuyển, tỷ lệ phản hồi, giới hạn mẫu; kết luận không vượt sai số và không suy rộng ngoài nhóm đã hỏi | Thiếu một phần | Kết luận cho cả thị trường từ mẫu tiện lợi, hoặc không mô tả mẫu |
| `fr_hypothesis_validation` | cp2_customer_discovery_process, cp2_surprises_pivot, cp2_iteration_refinement | Nói rõ giả thuyết ban đầu nào về khách hàng và nỗi đau được xác nhận, giả thuyết nào sai, kèm số liệu; persona hoặc pain đã điều chỉnh tương ứng | Có so sánh trước sau nhưng thiếu số liệu, hoặc chỉ nói "đã xác nhận" | Không có đối chiếu giả thuyết với dữ liệu |

Không có tệp dữ liệu thì chấm theo số nhóm ghi, không trừ điểm. Nếu nhóm có đính kèm tệp và số phản hồi đếm từ tệp khác số nhóm ghi, hoặc một tỷ lệ đếm lại lệch quá 1 điểm %, thêm một mục `crossIssues` mức `MAJOR`, nêu cả hai con số và tên tệp. Không suy đoán lý do lệch.

### Nhóm C — Quy mô thị trường

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `fr_tam_sam` | cp2_tam_sam_som | TAM và SAM quy ra doanh thu mỗi năm, số khách hàng có nguồn trích dẫn; SAM lọc theo phạm vi thật của nhóm | Thiếu nguồn hoặc SAM chỉ là phần trăm của TAM không giải thích | Thiếu TAM hoặc SAM |
| `fr_som_bottom_up` | cp2_tam_sam_som | SOM tính theo từng kênh: người tiếp cận × tỷ lệ dùng thử × tỷ lệ trả phí × giá × số kỳ; số người tiếp cận từ số thật | Có tính theo kênh nhưng thiếu bước, hoặc số tiếp cận không có căn cứ | SOM là phần trăm thị trường, hoặc không có SOM |
| `fr_som_rates` | cp2_tam_sam_som, cp2_survey, cp2_pmf_signals | Tỷ lệ dùng thử và trả phí lấy từ thử nghiệm hoặc dữ liệu thật của nhóm, hoặc tỷ lệ khảo sát có giải thích đã giảm bớt vì sao | Có căn cứ cho một tỷ lệ | Tỷ lệ tự đặt, hoặc lấy nguyên tỷ lệ "sẵn sàng trả" trong khảo sát |
| `fr_calc_consistency` | cp2_tam_sam_som, cp2_marketing_4p | Mọi phép tính đúng khi tính lại; đơn vị nhất quán; TAM ≥ SAM ≥ SOM; giá trong SOM bằng giá ở 4P; với dịch vụ làm thủ công, SOM không vượt năng lực phục vụ | Một lỗi nhỏ không làm đổi bậc độ lớn | Phép tính sai làm lệch kết quả, lẫn đơn vị tháng năm, hoặc vi phạm thứ tự TAM ≥ SAM ≥ SOM |
| `fr_no_example_copy` | cp2_tam_sam_som | Số liệu là của dự án nhóm; trùng số thống kê chung có nguồn (vd tổng sinh viên cả nước) vẫn tính là đạt | Trùng một con số đặc thù của ví dụ (tỷ lệ, số tiếp cận, giá) | Trùng từ hai con số đặc thù trở lên với ví dụ minh họa trong mục 5.3 của tệp core |

### Nhóm D — Cạnh tranh

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `fr_five_forces` | cp2_porters_five_forces | Đủ 5 lực, mỗi lực có bằng chứng, có kết luận nhóm bảo vệ lợi thế bằng cách nào | Đủ 5 lực nhưng thiếu bằng chứng hoặc thiếu kết luận | Thiếu lực |
| `fr_competitor_framework` | cp2_competitive_analysis | Đủ bốn nhóm đối thủ trực tiếp, gián tiếp, thay thế, người mới; mỗi nhóm có ví dụ cụ thể và so sánh; có hành động nhóm sẽ làm khác đi | Thiếu nhóm hoặc thiếu hành động | Chỉ liệt kê tên, không so sánh |
| `fr_invisible_competitors` | cp2_invisible_competitors | Nêu thói quen không làm gì, tự xoay xở, dùng đồ miễn phí; mỗi cái có cách xử lý cụ thể | Có nhưng thiếu cách xử lý | Không có |

### Nhóm E — MVP, tinh chỉnh, PMF, 4P

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `fr_mvp_evidence` | cp2_mvp_demo | Nêu MVP kiểm chứng giả định nào, cấu trúc, quy trình demo, minh chứng mở ra xem được, đã và chưa chứng minh được gì | Thiếu giả định cần kiểm chứng hoặc thiếu phần chưa chứng minh được | Chỉ mô tả tính năng |
| `fr_iteration_traceable` | cp2_iteration_refinement | Mỗi thay đổi có dạng trước đây nghĩ gì, khách hàng phản hồi gì, đã đổi gì | Có thay đổi nhưng không gắn phản hồi cụ thể | Không có tinh chỉnh |
| `fr_pivot_honest` | cp2_surprises_pivot | Có bất ngờ kèm bằng chứng và quyết định pivot hoặc không pivot có lý do; giải pháp và MVP đổi theo dữ liệu | Có nêu nhưng thiếu bằng chứng | Không có |
| `fr_pmf_signals` | cp2_pmf_signals | Tín hiệu có số kèm cỡ mẫu; ưu tiên hành vi (đăng ký, trả tiền, quay lại, giới thiệu); mẫu nhỏ gọi là tín hiệu ban đầu | Chỉ có mức hài lòng hoặc lời khen có số | Khẳng định đạt PMF không có số, hoặc không có |
| `fr_4p_grounded` | cp2_marketing_4p | Giá có căn cứ từ dữ liệu khách hàng (chi tiêu hiện tại, mức sẵn sàng trả có kiểm chứng); kênh ở Place và Promotion khớp kênh dùng để tính SOM | Một trong hai | Giá tự đặt và kênh không khớp |

### Nhóm F — Yêu cầu bắt buộc của báo cáo

| id | Nguồn | Đạt | Một phần | Chưa đạt |
| --- | --- | --- | --- | --- |
| `fr_ai_disclosure` | cp2_ai_disclosure | Có đoạn công bố dùng AI: mục đích và prompt đã dùng, hoặc ghi rõ không dùng AI | Có đoạn nhưng thiếu prompt | Không có |
| `fr_harvard` | cp2_harvard_referencing | Mọi số liệu bên ngoài có trích dẫn trong bài và danh mục theo chuẩn Harvard | Có danh mục nhưng thiếu cho một số con số | Không có |
| `fr_appendix` | cp2_appendix | Nhóm nêu phụ lục gồm hồ sơ chuyên gia và dữ liệu khảo sát gốc, thân bài có tham chiếu tới phụ lục. Chấm theo mô tả của nhóm, không đòi tải tệp lên Nexus | Nêu một trong hai, hoặc thiếu tham chiếu | Không có |

Tiêu chí định dạng trình bày (cỡ chữ, font, giãn dòng, số trang) không chấm trong loại này vì đầu vào là câu trả lời template, không phải tệp bài nộp cuối.

## 3. Kiểm tra phép tính

Với mỗi phép tính trong TAM, SAM, SOM, doanh thu và tỷ lệ, thêm một phần tử `calcChecks`. Ghi `expression` dạng tính được (vd `20000 * 0.05 * 0.08`), `teamResult` là kết quả nhóm ghi, `recomputed` là kết quả tính lại bằng shell, `matches` là true khi lệch không quá 1% hoặc chỉ do làm tròn.

Nếu SOM thiếu số người tiếp cận hoặc tỷ lệ, ghi một phần tử với `expression` là phần có được và `note` nêu thành phần còn thiếu.

## 4. Câu hỏi hội đồng có thể hỏi

`boardQuestions` gồm đúng 5 câu, mỗi câu một ý, đọc thành lời dưới 20 giây, nhắm vào 5 điểm yếu nhất theo thứ tự: tiêu chí `fail` hoặc `missing` ở nhóm B và C trước, rồi mâu thuẫn trong `crossIssues`, rồi các nhóm còn lại. Không viết câu trả lời.

## 5. Định dạng `output/report.md`

```md
# NHẬN XÉT TÀI LIỆU CHECKPOINT 2

## 1. Ba việc quan trọng nhất trước khi bảo vệ
1. ...
2. ...
3. ...

## 2. Ba yêu cầu bắt buộc của rubric
| Yêu cầu | Tình trạng | Căn cứ |
| --- | --- | --- |
| Từ 2 chuyên gia, mỗi người từ 6 tháng kinh nghiệm | | |
| Khảo sát từ 100 phản hồi, từ 7 câu, từ 2 loại câu hỏi | | |
| Công bố dùng AI | | |

## 3. Lỗi cần sửa
### [Tên lỗi]
- **Ở đâu:** [trích ngắn]
- **Vì sao hội đồng sẽ hỏi:** [1–2 câu]
- **Việc cần làm:** [hành động cụ thể]

## 4. Kiểm tra TAM, SAM, SOM
| Phép tính | Nhóm ghi | Tính lại | Nhận xét |
| --- | --- | --- | --- |

## 5. Câu hỏi hội đồng có thể hỏi
1. ...

## 6. Lỗi nhỏ
[Một đoạn gộp, tối đa 4 ý.]
```

Quy tắc mục 3:

- Chỉ đưa tiêu chí `fail` hoặc `missing`, tiêu chí `partial` ở nhóm B và C, và `crossIssues` mức BLOCKER hoặc MAJOR.
- Tối đa 7 lỗi, xếp theo thứ tự: ba yêu cầu bắt buộc, nhóm B, nhóm C, mâu thuẫn giữa các phần, nhóm A, E, D, F.
- Lỗi còn lại đưa vào mục 6.

Cột "Tình trạng" ở mục 2 ghi một trong: Đạt, Thiếu, Chưa rõ. Không ghi điểm, không ghi kết luận chung.
