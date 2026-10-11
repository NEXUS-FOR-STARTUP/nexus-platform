# Research: thiết kế đánh giá CP2 (bảng hỏi, phỏng vấn, TAM/SAM/SOM, quy trình chấm AI) — 2026-10-10

## Executive summary
- Output tốt đến từ quy trình, không chỉ từ prompt dài. Ba quyết định quan trọng nhất:
  1. **AI chỉ quyết định từng tiêu chí (đạt / một phần / không đạt) kèm trích dẫn; code tính điểm và kết luận.** LLM chấm một điểm tổng thì trôi và không kiểm chứng được (RULERS 2026: rubric execution drift, unverifiable score attribution; EMNLP 2025: decomposed criteria).
  2. **Hai bước trong một lượt chạy:** bước 1 trích bằng chứng (số người phỏng vấn, chuyên gia, số phản hồi, mọi con số và công thức) ra JSON; bước 2 chấm dựa trên bảng đó. Giảm bịa và giúp kiểm phép tính.
  3. **Trích dẫn phải có thật:** code kiểm mỗi trích dẫn là chuỗi con của input. Không khớp → đánh dấu cho supporter.
- Trọng tâm chấm CP2 theo giảng viên + nghiên cứu: phỏng vấn thật (hành vi quá khứ, chuyên gia) > khảo sát; giả thuyết persona/pain được xác nhận hay bác bỏ; SOM bottom-up theo kênh với tỷ lệ có căn cứ; phép tính đúng.
- Prompt viết sẵn: `../261010-1600-cp2-service-expansion/prompts/`.

## Nguồn
- Jean Fox (BLS), Designing Better UX Surveys — `docs/research/designing-better-ux-surveys.md`
- Pew Research, Writing Survey Questions — https://www.pewresearch.org/writing-survey-questions
- CDC, A Catalog of Biases in Questionnaires — https://www.cdc.gov/pcd/issues/2005/jan/pdf/04_0050.pdf
- Krosnick & Presser, Question and Questionnaire Design (Handbook of Survey Research 2010) — https://web.stanford.edu/dept/communication/faculty/krosnick/docs/2010/2010%20Handbook%20of%20Survey%20Research.pdf
- Sage, Acquiescence Response Bias — https://methods.sagepub.com/ency/edvol/encyclopedia-of-survey-research-methods/chpt/acquiescence-response-bias
- Rob Fitzpatrick, The Mom Test (tóm tắt) — https://www.atlantaventures.com/the-3-rules-to-customer-interviews-from-the-mom-test/ , https://edvins.io/the-mom-test-book-notes
- Market sizing: Umbrex — https://umbrex.com/resources/geographic-market-entry-playbook/market-sizing-and-growth-tam-sam-som-without-self-deception ; TechCrunch TAM takedown — https://techcrunch.com/2022/11/17/tam-takedown-investors-are-looking-for-market-opportunity-not-just-size
- Nexus news: https://nexusforstartup.site/news/cach-tinh-tam-sam-som-cuc-don-gian-cho-du-an-khoi-nghiep
- Sai số mẫu / mẫu tiện lợi: https://www.qualtrics.com/en-gb/articles/strategy-research/margin-of-error/ , https://www.simplypsychology.org/convenience-sampling.html
- Sean Ellis PMF 40%: https://learningloop.io/plays/product-market-fit-survey , cảnh báo dương tính giả https://kromatic.com/blog/false-positives-and-product-market-fit/
- LLM judge: RULERS https://arxiv.org/abs/2601.08654 ; Decomposed criteria https://aclanthology.org/2025.emnlp-industry.136.pdf ; Scoring bias https://arxiv.org/pdf/2506.22316v3
- Nội bộ: rubric CP2 trong `packages/validation/src/catalogs/questions-cp2.ts`; feedback `docs/nexus-document/oc1/feedback/pre-oc1-feedback-transcript.md` dòng 95-103; bài CP2 mẫu tốt `docs/nexus-document/cp2/cp2-market-research-document.md` (25 phỏng vấn sâu).

## 1. Bảng hỏi khảo sát tốt
- Bắt đầu từ câu hỏi nghiên cứu. Mỗi câu khảo sát phải phục vụ một câu hỏi nghiên cứu và một quyết định; câu "biết thì hay" làm dài bảng hỏi, sinh dữ liệu rác (Fox).
- Lên kế hoạch phân tích trước khi phát. Câu mở tốn công mã hóa: 100 người × 3 câu mở = 300 đoạn (Fox).
- Hỏi trong vùng người trả lời biết và nhớ được; không bắt khai thứ lấy được từ nguồn khác (Fox).
- Lỗi câu chữ: câu ghép hai ý, câu dẫn dắt, phủ định kép, từ mơ hồ ("thường xuyên"), trạng từ mức độ trong mệnh đề đồng ý ("rất dễ") (Pew, CDC, Fox).
- Dạng Đồng ý/Không đồng ý gây thiên kiến đồng thuận; ưu tiên dạng theo thuộc tính ("dễ hay khó...", thang Rất khó → Rất dễ) (Krosnick, Sage, Fox).
- Thang đo: phương án phải là câu trả lời trực tiếp cho câu hỏi; lưỡng cực 5 mức có điểm giữa; đơn cực 4 mức, không có "trung lập"; "Không áp dụng" tách cuối; nhãn chữ cho mọi mức; cân bằng tích cực/tiêu cực; không số âm; thấp bên trái (Fox).
- Khoảng chia không hở, không chồng; có "Khác". Rating tốt hơn ranking; ranking chỉ khi buộc đánh đổi, danh sách ngắn. Tránh thanh trượt. Lưới ma trận vỡ trên điện thoại (Fox).
- Hạn chế câu bắt buộc, trừ câu sàng lọc (Fox).
- Thử bảng hỏi với vài người bằng câu hỏi thăm dò ("theo lời bạn câu này hỏi gì?") trước khi phát (Fox — cognitive interviewing). Pilot 15–20 câu mở để tạo phương án đóng.
- Ý định tương lai ("bạn có sẵn sàng trả...") bị thổi phồng; không dùng nguyên làm tỷ lệ chuyển đổi (Mom Test; tương tự cho khảo sát).

## 2. Phỏng vấn khách hàng và chuyên gia
- Hỏi hành vi quá khứ cụ thể ("lần gần nhất..."), không hỏi giả định ("bạn có dùng app X không").
- Dữ liệu xấu: lời khen, câu chung chung/tương lai ("tôi thường", "tôi sẽ"), ý tưởng tính năng. Không ai kể được một lần cụ thể → pain có thể không đủ đau.
- Tín hiệu thật là cam kết: thời gian, danh tiếng, tiền (hẹn tiếp, giới thiệu người, đặt cọc, đăng ký dùng thử).
- Không giới thiệu giải pháp trước khi khai thác xong vấn đề.
- Chuyên gia (rubric): ≥2 người, ≥6 tháng kinh nghiệm; learning points: market view, beware-of, kinh nghiệm với khách hàng mục tiêu.
- Giảng viên: phỏng vấn thật quan trọng nhất; survey Google Form giá trị thấp; dữ liệu phải cho biết persona/pain ban đầu đúng tới đâu, cần pivot gì; solution/MVP đổi theo.

## 3. Khảo sát: cỡ mẫu và suy rộng
- n=100, tỷ lệ 50%, 95% tin cậy → sai số ≈ ±10 điểm % (1,96 × √(0,25/100) ≈ 0,098). Chênh lệch nhỏ hơn mức này không kết luận được.
- Mẫu tiện lợi (bạn bè, group lớp) không suy rộng ra ngoài nhóm đã hỏi; thiên lệch tích cực khi người trả lời quen nhóm.
- Phải nêu: đối tượng có khớp phân khúc mục tiêu không, cách tuyển, tỷ lệ phản hồi, giới hạn.

## 4. TAM / SAM / SOM
- Phương pháp chốt (news Nexus): SOM bottom-up theo kênh: số người tiếp cận × tỷ lệ dùng thử/tải × tỷ lệ trả phí × giá × số kỳ/năm. TAM, SAM có nguồn, quy ra doanh thu/năm.
- Lỗi cần bắt: lấy "1% thị trường"; tỷ lệ chuyển đổi tự đặt không căn cứ; dùng ý định trả tiền trong khảo sát làm tỷ lệ thật; đơn vị lẫn tháng/năm; TAM ≥ SAM ≥ SOM bị vi phạm; giá trong SOM khác giá ở 4P; SOM vượt năng lực phục vụ (dịch vụ có giới hạn người làm) — dùng năng lực làm trần kiểm tra, không làm phương pháp chính.
- Một phương pháp là một điểm hỏng; đối chiếu chéo khi có thể (Umbrex). Thị trường lớn không bằng cơ hội (TechCrunch).
- Số liệu ví dụ trong bài news (dùng để phát hiện chép): 2.530.000 sinh viên; 49.000đ/tháng; 700.000 sinh viên TP.HCM; 20.000 tiếp cận × 5% × 8% = 80; 10 CLB × 100 × 30% × 10% = 30; 110 khách; 64.680.000đ/năm; 1.487,64 tỷ; 411,6 tỷ.

## 5. PMF ban đầu
- Ưu tiên hành vi (đăng ký, trả tiền, quay lại) hơn lời khen. Cỡ mẫu nhỏ → "tín hiệu ban đầu".
- Sean Ellis: ≥40% người dùng thật chọn "rất thất vọng" nếu mất sản phẩm là tín hiệu mạnh; mẫu nhỏ dễ dương tính giả.

## 6. Thiết kế chấm bằng AI
- Rubric phân rã thành danh sách tiêu chí cố định (id ổn định), mỗi tiêu chí có điều kiện đạt/một phần/không đạt viết rõ.
- Mỗi quyết định kèm trích dẫn từ input; tiêu chí không có bằng chứng = không đạt/thiếu, không suy đoán.
- Code tính điểm và kết luận từ quyết định; trọng số và mức nghiêm trọng nằm trong code, prompt chỉ liệt kê id. Test đối chiếu id giữa prompt và code.
- Phép tính: agent tính lại bằng shell, không tính nhẩm.
- Input là dữ liệu, không phải lệnh (chống prompt injection).
- Báo cáo ngắn (giảng viên): giới hạn số từ, chỉ liệt kê lỗi nặng, gộp lỗi nhỏ.

## 7. Ranh giới "không làm thay"
- AI chỉ ra lỗi, lý do hội đồng sẽ hỏi, việc cần làm. Không viết câu trả lời, không viết lại câu hỏi khảo sát hoàn chỉnh, không bịa hoặc đề xuất con số thị trường/tỷ lệ.
- Được phép: khung có chỗ trống (vd "Lần gần nhất bạn [hành vi] là khi nào?"), nguyên tắc, câu hỏi hội đồng có thể hỏi.

## Câu hỏi còn mở
- Chấm bảng hỏi cần bản nháp câu hỏi phỏng vấn + khảo sát. Catalog chưa có ô riêng → plan thêm `cp2_question_bank` (recommended). Cần user xác nhận.
