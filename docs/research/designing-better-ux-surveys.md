Nguồn video: [UXRS January 2022 - Designing Better UX Surveys](http://www.youtube.com/watch?v=6_A_77flKGM)

Diễn giả: Jean Fox (Chuyên gia Human Factors / UX tại Cục Thống kê Lao động Hoa Kỳ - BLS).

Dưới đây là toàn bộ hệ thống luận điểm và chi tiết kỹ thuật từ video, được cấu trúc theo dạng bullet points phục vụ trực tiếp cho việc làm tư liệu nghiên cứu.

---

### 1. Bản chất & Phạm vi của Khảo sát trong UX

- **Định nghĩa cốt lõi:** Khảo sát (survey) là phương pháp thu thập thông tin có hệ thống từ một nhóm mẫu nhỏ nhằm ước lượng/suy rộng (generalize) cho toàn bộ tập khách thể (population) [[04:37](https://www.youtube.com/watch?v=6_A_77flKGM&t=277)].
- **Bối cảnh ứng dụng trong UX:**
- Kiểm thử khả năng sử dụng (Usability testing): Câu hỏi trước/sau phiên test (pre/post-test) [[05:52](https://www.youtube.com/watch?v=6_A_77flKGM&t=352)].
- Dân tộc học số (Ethnography): Sàng lọc người dùng hoặc thu thập bối cảnh trước/sau phỏng vấn sâu [[06:05](https://www.youtube.com/watch?v=6_A_77flKGM&t=365)].
- Thu thập phản hồi từ các bên liên quan (stakeholders) và người dùng dữ liệu định kỳ [[06:16](https://www.youtube.com/watch?v=6_A_77flKGM&t=376)].
- Nghiên cứu thị trường: Khảo sát thói quen sử dụng sản phẩm hiện tại và sản phẩm đối thủ [[06:22](https://www.youtube.com/watch?v=6_A_77flKGM&t=382)].

- **Các giới hạn cần lưu ý:**
- _Lệch do không phản hồi (Non-response bias):_ Xảy ra khi một nhóm người dùng cụ thể từ chối tham gia, làm sai lệch dữ liệu toàn cục [[07:29](https://www.youtube.com/watch?v=6_A_77flKGM&t=449)].
- _Làm sạch dữ liệu (Data cleaning):_ Cực kỳ quan trọng khi dùng nguồn mẫu mở (như MTurk), cần lọc các phản hồi chọn nhanh đáp án đầu tiên hoặc điểm ngoại lai (outliers) [[08:28](https://www.youtube.com/watch?v=6_A_77flKGM&t=508)].
- Không có giải pháp tuyệt đối (silver bullet) nào đảm bảo 100% tỷ lệ phản hồi; phần thưởng (incentives) hỗ trợ một phần nhưng không giải quyết được căn bản cấu trúc khảo sát kém [[07:57](https://www.youtube.com/watch?v=6_A_77flKGM&t=477)].

---

### 2. Chiến lược Xác định Nội dung & Câu hỏi Nghiên cứu

- **Bẫy câu hỏi "thú vị" (Interesting-to-know trap):** Thêm vào các câu hỏi "biết thì hay" nhưng không gắn với quyết định cụ thể khiến bảng hỏi quá dài, gây mỏi mệt nhận thức và tạo ra dữ liệu rác không thể hành động [[18:35](https://www.youtube.com/watch?v=6_A_77flKGM&t=1115)].
- **Xác định mục tiêu trước:** Luôn xây dựng danh sách câu hỏi nghiên cứu (research questions) cụ thể trước khi soạn câu hỏi khảo sát [[19:25](https://www.youtube.com/watch?v=6_A_77flKGM&t=1165)].
- **Nguyên tắc không chuyển việc của hệ thống sang người dùng:** Nếu dữ liệu có thể trích xuất từ nguồn khác (ví dụ: Google Analytics cho hành vi truy cập trang), nhà nghiên cứu phải tự truy xuất thay vì bắt người dùng khai báo [[19:46](https://www.youtube.com/watch?v=6_A_77flKGM&t=1186)].
- **Khả năng tiếp cận thông tin của đối tượng:** Câu hỏi phải nằm trong vùng kiến thức, khả năng ghi nhớ và phạm vi người trả lời thực sự nắm quyền truy cập [[20:06](https://www.youtube.com/watch?v=6_A_77flKGM&t=1206)].
- **Quy hoạch phân tích trước khi thu thập:**
- Lên phương án xử lý số liệu trước khi phát tán biểu mẫu [[20:34](https://www.youtube.com/watch?v=6_A_77flKGM&t=1234)].
- Cắt giảm câu hỏi mở (open-ended): 100 người trả lời 3 câu hỏi mở tương đương 300 đoạn dữ liệu định tính cần mã hóa thủ công; chỉ dùng khi thực sự có kế hoạch phân tích chuyên sâu [[20:50](https://www.youtube.com/watch?v=6_A_77flKGM&t=1250)].

---

### 3. Mô hình Phản hồi Nhận thức (Survey Response Model)

Mọi câu hỏi đều kích hoạt chu trình 4 bước nhận thức của người điền; thiết kế khảo sát kém sẽ làm gãy chu trình này ở một hoặc nhiều khâu [[21:37](https://www.youtube.com/watch?v=6_A_77flKGM&t=1297)]:

1. **Thấu hiểu (Comprehension):** Đọc, giải mã ngôn ngữ và hiểu đúng mục đích câu hỏi [[21:47](https://www.youtube.com/watch?v=6_A_77flKGM&t=1307)].
2. **Truy xuất (Retrieval):** Tìm kiếm thông tin từ trí nhớ dài hạn hoặc tài liệu liên quan [[21:56](https://www.youtube.com/watch?v=6_A_77flKGM&t=1316)].
3. **Phán đoán (Judgment):** Xử lý, so sánh và hình thành câu trả lời nội tâm dựa trên dữ liệu vừa truy xuất [[22:02](https://www.youtube.com/watch?v=6_A_77flKGM&t=1322)].
4. **Ánh xạ phản hồi (Response):** Chuyển phán đoán nội tâm sang định dạng có sẵn của câu hỏi (chọn mức thang đo hoặc viết thành văn bản) [[22:10](https://www.youtube.com/watch?v=6_A_77flKGM&t=1330)].

---

### 4. Kỹ thuật Thiết kế Câu hỏi & Thang đo (Scales)

- **Khảo sát là một cuộc hội thoại:** Các phương án trả lời bắt buộc phải là câu trả lời trực tiếp, logic cho câu hỏi được đặt ra [[11:34](https://www.youtube.com/watch?v=6_A_77flKGM&t=694)].
- _Lỗi phổ biến:_ Hỏi "Trải nghiệm thế nào?" nhưng thang đo lại là "Thỏa mãn / Kém" (không cùng một hệ quy chiếu) [[11:19](https://www.youtube.com/watch?v=6_A_77flKGM&t=679)], hoặc hỏi mức độ thỏa mãn nhưng các mức chọn lại là "Đồng ý / Không đồng ý" [[12:07](https://www.youtube.com/watch?v=6_A_77flKGM&t=727)].

- **Phân biệt Thang Lưỡng cực (Bipolar) và Thang Đơn cực (Unipolar):**
- _Thang Lưỡng cực (Bipolar):_ Đo giữa hai thái cực đối lập nhau (ví dụ: Rất không đồng ý → Rất đồng ý; Rất khó → Rất dễ) [[24:58](https://www.youtube.com/watch?v=6_A_77flKGM&t=1498)].
- _Thang Đơn cực (Unipolar):_ Đo cường độ từ mức 0 đến tối đa của một thuộc tính đơn nhất (ví dụ: Không hữu ích chút nào → Cực kỳ hữu ích) [[25:45](https://www.youtube.com/watch?v=6_A_77flKGM&t=1545)].
- _Quy tắc:_ Tuyệt đối không đặt lựa chọn "Trung lập" (Neutral) vào giữa thang đơn cực, vì về mặt logic không tồn tại trạng thái trung lập giữa "không có gì" và "rất nhiều" [[26:59](https://www.youtube.com/watch?v=6_A_77flKGM&t=1619)]. Các mục như "Không áp dụng" (N/A) hoặc "Không ý kiến" phải tách riêng ở cuối thang [[27:14](https://www.youtube.com/watch?v=6_A_77flKGM&t=1634)].

- **Kích thước thang đo (Scale size) & Điểm trung hòa (Midpoint):**
- Thang 3 điểm: Kém độ tin cậy do triệt tiêu sắc thái cường độ cảm xúc của người trả lời [[27:30](https://www.youtube.com/watch?v=6_A_77flKGM&t=1650)].
- Thang 5 điểm: Lựa chọn tối ưu cho thang lưỡng cực trong phần lớn bối cảnh UX [[28:10](https://www.youtube.com/watch?v=6_A_77flKGM&t=1690)]. Thang 7 điểm chỉ nên dùng cho nhóm đối tượng chuyên gia có khả năng phân biệt chi tiết cao [[28:34](https://www.youtube.com/watch?v=6_A_77flKGM&t=1714)].
- Thang 4 điểm: Phù hợp cho thang đơn cực [[28:51](https://www.youtube.com/watch?v=6_A_77flKGM&t=1731)].
- Điểm trung hòa: Khuyến nghị giữ điểm trung hòa (số lẻ) trong UX vì thái độ trung gian là phản hồi hợp lệ; chỉ loại bỏ khi bài toán bắt buộc phải ép người dùng ngả về một phía [[29:22](https://www.youtube.com/watch?v=6_A_77flKGM&t=1762)].

- **Gán nhãn chữ (Text labels) thay vì số:**
- Ưu tiên dùng từ ngữ chỉ mức độ rõ ràng thay vì chỉ dùng số đơn thuần [[30:44](https://www.youtube.com/watch?v=6_A_77flKGM&t=1844)].
- Với các thang đo tần suất không cách đều (hiếm khi, hàng tuần, hàng tháng), phải gán nhãn cho từng bậc lựa chọn [[30:11](https://www.youtube.com/watch?v=6_A_77flKGM&t=1811)].
- Tránh dùng số âm vì hiệu ứng tâm lý khiến người trả lời e ngại chọn số âm [[31:07](https://www.youtube.com/watch?v=6_A_77flKGM&t=1867)].
- Đảm bảo tính cân bằng: Số lượng lựa chọn tích cực và tiêu cực phải bằng nhau và cùng cấp độ biểu cảm [[31:20](https://www.youtube.com/watch?v=6_A_77flKGM&t=1880)].

- **Đánh giá (Rating) đối đầu Xếp hạng (Ranking):**
- _Rating:_ Gán giá trị độc lập cho từng hạng mục [[32:15](https://www.youtube.com/watch?v=6_A_77flKGM&t=1935)].
- _Ranking:_ So sánh tương quan tất cả các mục với nhau để lập trật tự thứ bậc [[32:22](https://www.youtube.com/watch?v=6_A_77flKGM&t=1942)].
- _Vấn đề của Ranking:_ Tải nhận thức rất nặng khi danh sách dài; không phản ánh được khoảng cách thực tế giữa hạng 1 và hạng 2; dễ gây nhầm lẫn nếu đề bài ghi mơ hồ (trong một case study thực tế, 57% người tham gia xếp hạng nhưng 37% lại chấm điểm độc lập, làm hỏng dữ liệu tổng hợp) [[33:20](https://www.youtube.com/watch?v=6_A_77flKGM&t=2000)].
- _Khuyến nghị:_ Ưu tiên dùng Rating rồi tính điểm trung bình để xếp hạng; chỉ dùng Ranking khi bắt buộc phải đưa ra quyết định đánh đổi tuyệt đối (như chọn tính năng duy nhất cần ưu tiên phát triển) [[34:45](https://www.youtube.com/watch?v=6_A_77flKGM&t=2085)].

- **Câu hỏi ghép (Double-barreled questions):**
- Ghép nhiều thuộc tính/hành động vào cùng một câu hỏi nhưng chỉ cho người dùng một lựa chọn duy nhất [[35:24](https://www.youtube.com/watch?v=6_A_77flKGM&t=2124)].
- Cách khắc phục: Rà soát từ nối "và" ("and"); tách thành các câu riêng biệt hoặc chỉ chọn ra 1 thuộc tính quan trọng nhất [[36:22](https://www.youtube.com/watch?v=6_A_77flKGM&t=2182)].

- **Nhược điểm của dạng câu hỏi Đồng ý / Không đồng ý (Agree/Disagree):**
- Gây ra thiên kiến đồng thuận (Acquiescence bias - người tham gia có xu hướng chọn đồng ý để làm hài lòng người hỏi) [[37:33](https://www.youtube.com/watch?v=6_A_77flKGM&t=2253)].
- Tăng tải nhận thức vì người trả lời phải tự dịch nhận định cá nhân sang thang đo đồng ý [[37:48](https://www.youtube.com/watch?v=6_A_77flKGM&t=2268)].
- Tuyệt đối không chứa các trạng từ chỉ mức độ (như "rất", "cực kỳ") bên trong mệnh đề câu hỏi (ví dụ: "Nhiệm vụ này rất dễ" khiến người thấy "hơi dễ" không biết chọn gì) [[38:12](https://www.youtube.com/watch?v=6_A_77flKGM&t=2292)].
- Giải pháp thay thế: Dùng định dạng đặc thù theo thuộc tính (Construct-specific format, ví dụ: "Sản phẩm này dễ hay khó sử dụng?" đi kèm thang từ "Rất khó" đến "Rất dễ") [[38:59](https://www.youtube.com/watch?v=6_A_77flKGM&t=2339)].

- **Lỗi giao diện thường gặp:**
- _Thanh trượt (Sliders):_ Rất khó phân biệt giữa việc người dùng chủ động chọn mức 5 hay họ bỏ qua câu hỏi (giá trị mặc định); người dùng dễ nhầm mức 5 là điểm chính giữa của thang từ 1 đến 10 [[13:53](https://www.youtube.com/watch?v=6_A_77flKGM&t=833)].
- _Khoảng phân loại (Buckets):_ Các mốc nhóm tuổi/thu nhập phải bao trùm toàn bộ các khoảng, không được để sót khoảng trống (ví dụ: mốc 0-3 tháng rồi nhảy sang 4-6 tháng sẽ bỏ sót trẻ 3.5 tháng) [[16:45](https://www.youtube.com/watch?v=6_A_77flKGM&t=1005)].
- _Câu hỏi bắt buộc (Required):_ Hạn chế tối đa; chỉ bắt buộc đối với câu hỏi phân nhánh logic (screener) hoặc câu mang tính quyết định của toàn bộ nghiên cứu [[58:53](https://www.youtube.com/watch?v=6_A_77flKGM&t=3533)].

---

### 5. Phương pháp Kiểm thử Khảo sát (Survey Testing & Cognitive Interviewing)

- **Quy tắc:** Dù áp dụng chuẩn chỉnh mọi nguyên tắc thiết kế, khảo sát vẫn bắt buộc phải trải qua kiểm thử thực tế tương tự usability testing [[41:07](https://www.youtube.com/watch?v=6_A_77flKGM&t=2467)].
- **Phỏng vấn Nhận thức (Cognitive Interviewing):**
- _Cách thực hiện:_ Người tham gia điền khảo sát, người nghiên cứu quan sát và sử dụng các câu hỏi đào sâu (probes) ngay sau đó [[43:12](https://www.youtube.com/watch?v=6_A_77flKGM&t=2592)].
- _Trọng tâm phân tích:_ Không tập trung vào kết quả đáp án họ chọn hay hành vi click, mà tập trung phân tích câu trả lời của họ đối với các câu hỏi đào sâu để hiểu cách họ diễn giải câu hỏi [[43:26](https://www.youtube.com/watch?v=6_A_77flKGM&t=2606)].
- _Bộ câu hỏi đào sâu (Probes) chuẩn:_
- "Theo lời của bạn, câu hỏi này đang hỏi điều gì?" [[43:47](https://www.youtube.com/watch?v=6_A_77flKGM&t=2627)]
- "Bạn đã cân nhắc những yếu tố nào khi đưa ra lựa chọn này?" [[43:54](https://www.youtube.com/watch?v=6_A_77flKGM&t=2634)]
- "Có yếu tố hoặc dữ liệu nào bạn định tính vào nhưng sau đó quyết định bỏ ra không?" [[44:02](https://www.youtube.com/watch?v=6_A_77flKGM&t=2642)]
- "Có phần nào trong câu hỏi này gây khó khăn hoặc mơ hồ cho bạn không?" [[44:08](https://www.youtube.com/watch?v=6_A_77flKGM&t=2648)]

---

### 6. Các Điểm Kỹ thuật từ Phiên Q&A

- **Chuyển hóa câu hỏi mở thành câu hỏi đóng:** Chạy thử nghiệm pilot với 15–20 người dùng bằng câu hỏi mở; phân tích các nhóm câu trả lời xuất hiện nhiều nhất để lập thành các phương án trắc nghiệm cho bản khảo sát chính thức [[46:19](https://www.youtube.com/watch?v=6_A_77flKGM&t=2779)].
- **Vấn đề của chỉ số NPS (Net Promoter Score):** Khả năng người dùng "giới thiệu sản phẩm cho bạn bè" chịu tác động của rất nhiều yếu tố ngoại cảnh ngoài sản phẩm; chỉ số này không phản ánh trực diện chất lượng trải nghiệm của nhiều loại hệ thống nghiệp vụ/dịch vụ công [[47:08](https://www.youtube.com/watch?v=6_A_77flKGM&t=2828)].
- **Chiều hiển thị của thang đo:** Bố cục phổ biến và tự nhiên nhất là đặt giá trị thấp/tiêu cực ở bên trái và giá trị cao/tích cực ở bên phải [[56:04](https://www.youtube.com/watch?v=6_A_77flKGM&t=3364)].
- **Dropdown vs. Radio Buttons:** Ưu tiên hiển thị toàn bộ các phương án (Radio buttons) để người dùng nắm trọn bối cảnh lựa chọn; chỉ chuyển sang Dropdown khi danh sách vượt quá 4–5 lựa chọn hoặc bị hạn chế diện tích hiển thị [[01:03:07](https://www.youtube.com/watch?v=6_A_77flKGM&t=3787)].
- **Tương thích Mobile vs. Desktop:** Dạng bảng ma trận/lưới (grid/matrix) trên máy tính sẽ bị các công cụ khảo sát tự động xé lẻ thành chuỗi câu hỏi đơn trên điện thoại, làm độ dài biểu mẫu tăng đột biến và tăng tỷ lệ bỏ cuộc; bắt buộc phải duyệt thử nghiệm trên giao diện điện thoại [[51:28](https://www.youtube.com/watch?v=6_A_77flKGM&t=3088)].

---

### 7. Vận hành & Quản trị Khảo sát trong Doanh nghiệp (Networking Session)

- **So sánh công cụ:**
- _Qualtrics:_ Nền tảng chuyên sâu, logic hiển thị/phân nhánh phức tạp, quản lý tệp người dùng (panel) mạnh, chi phí enterprise rất cao [[01:09:41](https://www.youtube.com/watch?v=6_A_77flKGM&t=4181)].
- _Typeform:_ Trải nghiệm giao diện thân thiện, tỷ lệ hoàn thành cao, logic ở mức trung bình [[01:10:42](https://www.youtube.com/watch?v=6_A_77flKGM&t=4242)].
- _Google Forms:_ Tiện dụng, miễn phí, nhưng thiếu yếu tố nhận diện thương hiệu chuyên nghiệp và thiếu logic chuyên sâu [[01:10:07](https://www.youtube.com/watch?v=6_A_77flKGM&t=4207)].

- **Kiểm soát tình trạng Khảo sát Tràn lan (Survey Fatigue):**
- Tình trạng Product Managers hoặc Marketing tự ý phát tán khảo sát không qua kiểm duyệt dẫn đến "kiệt quệ khảo sát", làm giảm chất lượng phản hồi từ khách hàng [[01:31:33](https://www.youtube.com/watch?v=6_A_77flKGM&t=5493)].
- Dẫn đến lỗi thống kê Type VI (Type 6 error): Nhận được câu trả lời rất chuẩn xác cho một câu hỏi đặt ra hoàn toàn sai [[01:29:08](https://www.youtube.com/watch?v=6_A_77flKGM&t=5348)].
- Giải pháp tổ chức: Thiết lập cổng kiểm soát chất lượng (Quality Gate), phân quyền tạo biểu mẫu, tổ chức các buổi đào tạo nội bộ và dùng các case study thành công từ UX Research để chứng minh sự khác biệt của dữ liệu sạch [[01:26:06](https://www.youtube.com/watch?v=6_A_77flKGM&t=5166)], [[01:28:44](https://www.youtube.com/watch?v=6_A_77flKGM&t=5324)].

- **Khảo sát Tiếp cận (Accessibility):** Khi nghiên cứu người dùng khuyết tật (sử dụng screen reader), cần chuẩn bị trước các hướng dẫn kỹ thuật cho công cụ họp trực tuyến và cân nhắc sử dụng các đơn vị tuyển dụng người tham gia chuyên biệt (như Fable) [[01:33:46](https://www.youtube.com/watch?v=6_A_77flKGM&t=5626)].
