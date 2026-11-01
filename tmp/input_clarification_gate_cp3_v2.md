# INPUT CLARIFICATION GATE — CP3 MVP & BMC — V2.0

## 0. Cách dùng

- Module: `CP3_INPUT_GATE_V2`.
- Nền tảng: Input Clarification Gate V4.1, giữ nguyên việc làm rõ khái niệm, hệ quy chiếu, dữ liệu/giả định/kết luận; mở rộng tiêu chí cho hồ sơ MVP và BMC.
- Input bắt buộc trong workflow: tài liệu gốc của nhóm + `TRIAD HANDOFF PACKET` do `CP3_TRIAD_V2` tạo từ đúng tập nguồn đó.
- Output: `INPUT CLARIFICATION AUDIT` theo mục 12.
- Registry: `CP3_MANUAL_23 / 2.0`, gồm M01–M14 và B01–B09.
- Operator giữ quyền điều phối thứ tự. Không chạy Gate để đoán thay bước Triad.

Đây là bộ hướng dẫn kiểm tra hồ sơ. Nhóm tự điền bằng tay theo phụ lục A hoặc cung cấp nội dung tương đương trong tài liệu sẵn có. Không bắt nhóm tự phân tích NMF–IPOD–CV.

Không có AI log hoặc tiêu chí khai báo công cụ viết bài. Không chấm số trang, độ đẹp, thiết kế slide, BMC một trang hoặc khả năng viết văn. Không cần nộp trang rubric của giảng viên. Không tự chấm điểm chính thức cho môn học.

## 1. Mục tiêu: đánh giá được điều gì?

Gate trả lời ba câu hỏi khác nhau:

1. **Đủ thông tin chưa?** Có xác định được nhóm làm gì, cho ai, vì sao, đã thử thế nào và dữ liệu ở đâu mà không phải đoán?
2. **Lập luận có nối được không?** Vấn đề → cách đang giải quyết → khoảng trống → giả định → MVP → cách thử → dữ liệu → kết luận → quyết định có liên quan và nhất quán không?
3. **Căn cứ cho phép nói đến đâu?** Kết luận cụ thể nào được dữ liệu hỗ trợ, kết luận nào còn mở, kết luận nào mâu thuẫn với chính nguồn nhóm nộp?

“MVP đúng” không phải một nhãn chung. Cần chỉ rõ: đúng với mục tiêu kiểm tra nào, đúng đối tượng và phiên bản nào, đo được điều gì, và có căn cứ nào. Một bản prototype có thể phù hợp để kiểm tra việc hiểu luồng nhưng chưa cho phép kết luận về độ chính xác xử lý hoặc việc trả tiền.

Hồ sơ có thể **đủ rõ nhưng kết quả test không ủng hộ giả định**. Đây không phải lỗi input nếu nhóm ghi nhận trung thực và kết luận đúng phạm vi. Ngược lại, điền hết các ô không khiến kết luận được chứng minh.

### 1.1. Được làm

- Kiểm tra định nghĩa, tính cụ thể, tính nhất quán, logic lựa chọn và khả năng truy dữ liệu.
- Đối chiếu kết luận với dữ liệu đã nộp; kiểm tra mẫu số, đơn vị và phép tính đơn giản có đủ input.
- Chỉ ra một thiết kế thử không đo được giả định mà nhóm đang tuyên bố kiểm tra.
- Yêu cầu nhóm giải thích, cung cấp nguồn, thu hẹp kết luận hoặc ghi rõ điều chưa biết.
- Chỉ ra mâu thuẫn trong hồ sơ và hậu quả đối với cách hiểu MVP/BMC.

### 1.2. Không được làm

- Không tự chọn khách hàng, pain, tính năng, giá hoặc mô hình kinh doanh cho nhóm.
- Không viết thay nội dung thiếu, dựng lời người thử, đoán số liệu hoặc chọn giúp kết quả mong muốn.
- Không tự thiết kế một giải pháp mới hoặc một bài test hoàn chỉnh để lấp dữ liệu thiếu.
- Không thực hiện Reality Check, nghiên cứu thị trường bên ngoài hoặc tự thử vận hành sản phẩm.
- Không kết luận đã xác minh sản phẩm chạy thật chỉ từ mô tả/ảnh. Không coi link chưa đọc được là bằng chứng đã kiểm tra.
- Không kết luận ý tưởng không khả thi chỉ vì thiếu dữ liệu; không kết luận thành công chỉ vì có phản hồi tích cực.

Đánh giá độ phù hợp giữa giả định, phép thử và dữ liệu **trong hồ sơ** là phạm vi Gate. Xác nhận độc lập ngoài hồ sơ là một công việc khác, không được giả vờ đã thực hiện.

## 2. Điều kiện chạy và quyền ưu tiên nguồn

### 2.1. Preflight

Kiểm tra có bản gốc và packet đúng nhóm, đúng tập nguồn/phiên bản, đúng registry. Không có packet hoặc biết nguồn đã đổi: trả trạng thái về Operator để chạy lại bước 1; không xuất một audit giả như đã đủ hai bước.

Nếu chưa xác định được packet có khớp nguồn, ghi rõ điều cần đối chiếu, không tự cho là khớp. Thiếu tên phiên bản trong tài liệu không tự chứng minh đã đổi nguồn, nhưng phải giữ giới hạn truy xuất đó.

Phụ lục được thêm vào sau packet cũng là thay đổi tập nguồn. Chạy lại Triad trước khi audit tập nguồn bổ sung.

Nếu dữ liệu gốc của test chưa có, vẫn audit hồ sơ hiện tại và ghi thiếu. “Thiếu nguồn thử nghiệm” khác với “không có tài liệu gốc của nhóm để chạy Gate”.

### 2.2. Ưu tiên bằng chứng

1. Tài liệu và phụ lục nhóm thực sự cung cấp, trong phạm vi đã đọc.
2. Mô tả/kết luận của nhóm được kiểm tra như claim, không tự là dữ liệu chứng minh chính nó.
3. Packet chỉ điều hướng chú ý; mỗi rủi ro phải được kiểm tra lại từ nguồn.

Nguồn giải quyết được một nghi vấn trong packet thì loại nghi vấn đó khỏi lỗi. Packet bỏ sót một lỗi nhưng nguồn thể hiện thì vẫn ghi lỗi. Packet và nguồn mâu thuẫn thì theo nguồn, nêu điều chỉnh. Không trích packet làm căn cứ duy nhất cho kết luận audit.

Dùng mã nguồn `S01`… và vị trí như Triad. Nếu phát hiện nguồn chưa có trong manifest, đối chiếu lại tập nguồn trước khi đi tiếp. Không tự nhập hồ sơ của hai nhóm hoặc hai phiên bản thành một sản phẩm đồng thời.

## 3. Triết lý kiểm tra: ba tầng và ba lăng kính

### 3.1. Khái niệm → hệ quy chiếu → kết luận

Với claim quan trọng, hỏi lần lượt:

1. **Định nghĩa vận hành:** cụ thể có hành động/kết quả nào? Có thể nhận biết hoặc ghi nhận bằng cách nào?
2. **Hệ quy chiếu:** của ai, trong tình huống nào, với phiên bản nào, so với cái gì, trong thời gian nào?
3. **Căn cứ kết luận:** nguồn nào hỗ trợ, nguồn nào không hỗ trợ, có bước suy luận nào chưa đủ?

Các từ như “hiệu quả”, “tiện”, “chính xác”, “nhanh”, “đã kiểm chứng”, “khách hàng”, “đã dùng”, “tự động”, “khác biệt” không bị cấm. Chúng phải có nghĩa đủ cụ thể khi quyết định quan trọng phụ thuộc vào chúng.

Không ép mọi tính từ phụ phải có một nghiên cứu riêng. Chỉ đặt yêu cầu tương xứng với claim và quyết định chịu ảnh hưởng.

### 3.2. Dùng NMF–IPOD–CV để kiểm tra, không chỉ nhắc tên

- **NMF:** có đổi nghĩa “dùng”, “khách hàng”, “giá”, “thành công” giữa các mục không? Có dùng ý kiến user để nói thay payer không?
- **IPOD:** đầu vào gì được xử lý thế nào, cho đầu ra gì; dữ liệu nào quay lại quyết định; bước nào có thật, làm tay, mô phỏng hoặc chưa có?
- **CV:** điều nào là dữ liệu trong phạm vi mẫu, điều nào còn là giả định; có biến tỷ lệ trong mẫu thành tỷ lệ thị trường, hoặc giá đề xuất thành giá được chấp nhận không?

Mỗi nhận xét phải dẫn về nội dung hồ sơ, không dùng nhãn triết học để thay cho việc giải thích lỗi.

### 3.3. Phân biệt đúng các loại phát biểu

| Loại | Ví dụ về dạng phát biểu | Cách kiểm tra |
|---|---|---|
| Dữ liệu ghi nhận | P03 đã dừng ở bước 2 trong buổi test v1 | Có bản ghi và bối cảnh; ghi nhận bằng cách nào |
| Tổng hợp dữ liệu | 4/10 người hoàn thành nhiệm vụ không được giúp | Truy được các dòng; rõ mẫu số và tiêu chí |
| Giả định | Payer có thể chấp nhận mức giá dự kiến | Ghi rõ chưa được kiểm tra; cần loại dữ liệu nào |
| Diễn giải/kết luận | Luồng còn gây khó ở bước 2 trong vòng test này | Có nối được với dữ liệu, có giữ phạm vi không |
| Kế hoạch | Nhóm dự định đổi bước 2 trong v2 | Không được tính là đã đổi hoặc đã test v2 |

Không bắt một giả định đã khai báo trung thực phải có bằng chứng như một claim đã xác nhận. Nhưng một phần việc CP3 yêu cầu đã làm mà mới có kế hoạch thì vẫn là **chưa hoàn thành**, không được cho qua bằng cách đổi tên thành giả định.

## 4. Registry, tình trạng field và phạm vi áp dụng

### 4.1. Registry cố định

| Mã | Field |
|---|---|
| M01 | Khách hàng, vấn đề và cách đang giải quyết |
| M02 | MVP hiện tại và phạm vi phiên bản |
| M03 | Cơ chế, giả định và lý do chọn MVP |
| M04 | Tính năng lõi và yêu cầu hoạt động |
| M05 | Luồng sử dụng và giao diện/điểm chạm |
| M06 | Gói sản phẩm/dịch vụ và cách bàn giao |
| M07 | Cách định giá và lý do chọn |
| M08 | Mức giá và căn cứ |
| M09 | Khác biệt so với cách hiện tại |
| M10 | Hỗ trợ và xử lý sự cố |
| M11 | Thiết kế và cách thực hiện thử nghiệm |
| M12 | Kết quả và phản hồi |
| M13 | Dữ liệu gốc và nơi tra cứu |
| M14 | Quyết định sau thử nghiệm |
| B01 | Phân khúc khách hàng |
| B02 | Giá trị cung cấp |
| B03 | Kênh tiếp cận và cung cấp |
| B04 | Quan hệ khách hàng |
| B05 | Dòng doanh thu |
| B06 | Nguồn lực chính |
| B07 | Hoạt động chính |
| B08 | Đối tác chính |
| B09 | Cơ cấu chi phí |

### 4.2. Trạng thái field

Giữ năm trạng thái từ Gate gốc:

- `Missing`: không thấy nội dung của field trong tập nguồn đã đọc.
- `Mixed frame`: trộn vai trò, đối tượng, khái niệm, phiên bản hoặc đơn vị khiến không xác định được đang nói về cái gì.
- `Unsupported claim`: có kết luận quan trọng nhưng dữ liệu nộp chưa hỗ trợ mức khẳng định đó; gồm trường hợp có dữ liệu ngược mà nhóm vẫn khẳng định.
- `Too vague`: đã có hướng nội dung nhưng thiếu mức cụ thể để kiểm tra tiếp.
- `Good enough`: đủ cụ thể, tách frame, định nghĩa được khái niệm chính, giữ đúng mức bằng chứng và không cần đoán để đọc tiếp.

Nếu nhiều lỗi chồng nhau, trạng thái chính theo thứ tự: `Missing > Mixed frame > Unsupported claim > Too vague > Good enough`. Ghi các lỗi phụ bằng mã issue. Đây là thứ tự chọn nhãn, **không thay cho severity**.

Một field chỉ thiếu một phần không bị gán Missing cho toàn bộ. Dùng trạng thái phù hợp với nội dung còn lại và chỉ rõ phần thiếu.

Tách thêm **mức thực hiện** ở bảng: `Đã làm / Một phần / Chưa làm / Chưa xác định / Không áp dụng`. Trạng thái field nói về chất lượng thông tin, mức thực hiện nói về công việc thực tế. Một kế hoạch thử đầy đủ có thể đủ rõ để đọc nhưng vẫn là Chưa làm và chưa hoàn thành yêu cầu thử nghiệm. Nếu chưa có kết quả hoặc bản ghi, M12/M13 vẫn Missing về nội dung kết quả/dữ liệu, dù nhóm đã khai báo trung thực lý do chưa có. Không gọi một khai báo rõ là mơ hồ chỉ vì việc đó chưa làm.

Mức thực hiện nói về khả năng, hoạt động hoặc quan hệ được mô tả, không phải việc đã viết xong một ô. Với BMC, không bắt mọi giả định kinh doanh đã được kiểm chứng hoặc mọi kế hoạch tương lai đã hoàn tất; chỉ yêu cầu giữ đúng trạng thái và không dựa vào phần chưa có để khẳng định đã giao được giá trị/doanh thu.

Good enough không có nghĩa kết quả tích cực, thị trường đã được chứng minh hay không còn rủi ro. Nó có nghĩa hồ sơ của phần đó đủ chất lượng để đánh giá trong phạm vi đã nêu.

### 4.3. Không áp dụng

Có cột áp dụng riêng: `Có / Không áp dụng / Cần xác nhận`.

Chỉ dùng Không áp dụng khi nhóm có lý do và logic sản phẩm cho phép. Giữ dòng field, ghi `—` ở trạng thái nội dung và dẫn lý do. Không dùng nhãn này cho phần chưa làm, chưa biết hoặc thiếu dữ liệu.

Ví dụ: không có bao bì vật lý có thể hợp lý với dịch vụ; vẫn phải biết khách nhận gói dịch vụ gì và bằng cách nào. Không cần đối tác đặc biệt có thể hợp lý; không vì vậy xóa nguồn lực phụ thuộc đang xuất hiện ở nơi khác. “Chưa thu tiền” không xóa nghĩa vụ nêu giả định payer/doanh thu trong BMC.

## 5. Tiêu chí đánh giá phần MVP

Các mục dưới đây quy định **ngưỡng nội dung**, không phải độ dài bài làm. Nhóm không phải nộp một đoạn văn cho từng câu hỏi nếu một bảng/đoạn có sẵn đã trả lời được và truy lại được.

### M01. Khách hàng, vấn đề và cách đang giải quyết

**Cần biết:** nhóm người đầu tiên; hành vi và bối cảnh gây vấn đề; hậu quả; tần suất nếu có; cách họ hiện xử lý; lý do cách hiện tại chưa đủ; nguồn và phần còn giả định.

**Kiểm tra vì sao:** vì sao chọn nhóm này và vấn đề này để thử trước? Khoảng trống đến từ dữ liệu người dùng hay từ điều nhóm muốn xây? Nếu có nhiều nhóm, nhóm nào là trọng tâm của vòng MVP này?

**Good enough khi:** có thể xác định một tình huống thử cụ thể và hiểu MVP đang so với hành vi nào. Không bắt có CP2, persona dài, TAM hoặc một tỷ lệ giả chính xác.

**Lỗi cần phân biệt:** chưa có số tần suất không luôn chặn hiểu pain; chưa biết người dùng đang làm gì và MVP nhằm thay đổi điều gì có thể chặn đánh giá toàn chuỗi. “Chưa dùng giải pháp nào” vẫn cần mô tả họ chịu đựng, bỏ việc hay tự xử lý thế nào.

### M02. MVP hiện tại và phạm vi phiên bản

**Cần biết:** tên/mã phiên bản; mục tiêu giới hạn của phiên bản; phần đã hoạt động; phần làm tay; phần mô phỏng; phần dự định; phiên bản đem thử; ảnh/luồng/tài liệu mô tả nếu có.

**Kiểm tra vì sao:** phạm vi này giữ lại được điều cần kiểm tra không? Có bỏ mất cơ chế mà claim phụ thuộc vào không? Nhóm có gọi kế hoạch tương lai là khả năng hiện tại không?

**Good enough khi:** biết người thử thực sự được tiếp xúc với cái gì và có thể tách kết luận theo phiên bản. Không bắt có backend, code hoặc nguyên file Figma. Mô tả bằng chữ, bảng, ảnh hoặc bản vẽ có thể đủ để đọc hồ sơ nếu rõ.

Mô phỏng không tự là lỗi. Lỗi là dùng bằng chứng của mô phỏng để khẳng định phần chưa được thử đã hoạt động.

### M03. Cơ chế, giả định và lý do chọn MVP

**Cần biết:** người dùng đưa gì/làm gì; process do ai/cái gì thực hiện; output nhận được; output giúp thay đổi hành động/kết quả nào; giả định quan trọng cần kiểm tra; vì sao chọn dạng MVP này.

**Kiểm tra vì sao:** nếu giả định sai thì điều gì sụp? Bản MVP làm lộ giả định đó bằng cách nào? Vì sao từng phần lõi cần có? Nhóm đã bỏ lại phần nào vì chưa cần cho mục tiêu vòng này?

**Good enough khi:** có đường nối rõ từ vấn đề đến cơ chế và từ giả định đến loại tín hiệu có thể quan sát. Không yêu cầu nhóm chứng minh đã tìm được cách nhỏ nhất tuyệt đối trên mọi phương án.

“Minimum” nghĩa là phạm vi có lý do, đủ cho câu hỏi học hiện tại; không chỉ là ít màn hình. Nhiều tính năng chưa tự chứng minh MVP sai; phải chỉ ra phần thừa hoặc thiếu tác động ra sao đến giả định, khả năng thử hay nguồn lực. Không tự chọn một giả định mới thay nhóm.

### M04. Tính năng lõi và yêu cầu hoạt động

**Cần biết cho từng tính năng lõi:** người dùng cần làm gì; đầu vào; kết quả mong đợi; điều kiện/giới hạn; hiện trạng; lý do gắn với M03. Tiêu chí hoạt động có thể là hành vi quan sát được, không bắt luôn là con số.

**Kiểm tra:** tên tính năng có che mất cơ chế không? “Gợi ý phù hợp” dựa vào dữ liệu gì và tiêu chí phù hợp nào? Nếu làm tay thì ai làm? Những yêu cầu nhóm đặt có đo/quan sát được không?

**Good enough khi:** người đánh giá đọc được điều tính năng phải làm và biết nguồn test nào có thể kiểm tra nó. Không tự sáng tác tiêu chuẩn kỹ thuật mà claim không cần đến.

### M05. Luồng sử dụng và giao diện/điểm chạm

**Cần biết:** điểm bắt đầu; từng bước người dùng/nhóm thực hiện; thông tin cần nhập; output từng đoạn; điểm kết thúc; chỗ cần trợ giúp hoặc có thể thất bại. Dẫn ảnh/bản vẽ nếu có, không bắt nộp toàn bộ file thiết kế.

**Kiểm tra:** nhiệm vụ thử có đi qua luồng lõi không? Có bước ngoài màn hình do người vận hành làm mà bị bỏ khỏi mô tả không? Kết quả “tự dùng được” có loại các lần được nhắc/hướng dẫn không?

**Good enough khi:** có thể theo một lượt sử dụng từ đầu đến cuối mà không phải bịa thêm bước. Dịch vụ không có app vẫn có điểm chạm và luồng thực hiện.

### M06. Gói sản phẩm/dịch vụ và cách bàn giao

**Cần biết:** một lần/gói gồm những gì; người nhận; hình thức nhận; thời gian/phạm vi cung cấp nếu nhóm có cam kết; giới hạn; phần không bao gồm; bao bì vật lý nếu thực sự liên quan.

**Kiểm tra:** gói có khớp giá và output M03 không? Có hứa thêm việc nhưng không có hoạt động/nguồn lực? Người thử đã nhận đúng gói đang được nói đến chưa?

**Good enough khi:** xác định được đơn vị giá trị được giao. Không ép dịch vụ số phải có hộp, tem, nhãn; không chấm hình thức trình bày gói.

### M07. Cách định giá và lý do chọn

**Cần biết:** ai trả; trả cho gì; theo đơn vị nào; cách đặt giá; vì sao cách này hợp với giá trị/hành vi; phần nào còn là giả định.

**Kiểm tra:** user có phải payer không? Lý do dựa trên chi phí, so sánh, giá trị hoặc phản hồi nào? Một nhãn như “freemium” chưa trả lời được phần miễn phí, phần có phí và lý do chuyển đổi.

**Good enough khi:** mô hình thu tiền đủ cụ thể để đối chiếu với gói và B05. Không yêu cầu chứng minh đầy đủ willingness to pay nếu nhóm chỉ đang đề xuất giá, nhưng phải giữ trạng thái đề xuất.

### M08. Mức giá và căn cứ

**Cần biết:** mức giá; tiền tệ; đơn vị; thời kỳ; nhóm khách; gói; ưu đãi nếu có; nguồn để đặt giá; giá đã báo/đã thu hay chỉ đề xuất.

**Kiểm tra:** có so giá cùng đơn vị và phạm vi không? Giá cho cả nhóm có bị so với giá theo người? Khảo sát “có thích không” có bị dùng làm căn cứ chấp nhận giá? Nếu lấy chi phí làm căn cứ thì có đủ các khoản đã nêu trong hồ sơ không?

**Good enough khi:** hiểu được mức giá nào áp dụng cho giao dịch nào, tại sao nhóm chọn và đã biết/chưa biết gì về sự chấp nhận. Không bắt dùng một phương pháp định giá cụ thể hay một mẫu khảo sát đặc biệt.

### M09. Khác biệt so với cách hiện tại

**Cần biết:** cách hiện tại/đối chiếu cụ thể; tiêu chí so sánh; điều kiện; khác biệt đề xuất; căn cứ; giới hạn hoặc đánh đổi.

**Kiểm tra:** khác biệt tính năng có tạo ra giá trị theo M01/B02 không? “Không có đối thủ” có bỏ qua tự làm, không làm, dùng công cụ có sẵn? Claim nhanh/rẻ/tốt hơn có đo cùng nhiệm vụ và điều kiện không?

**Good enough khi:** thấy được khác biệt nào có căn cứ và khác biệt nào còn là giả định. Không tự tra đối thủ hoặc yêu cầu chứng minh độc quyền để chấp nhận một giá trị cụ thể.

### M10. Hỗ trợ và xử lý sự cố

**Cần biết:** hỗ trợ việc gì; ai phụ trách; kênh; khi nào; cách xử lý không hoàn thành/sai kết quả; giới hạn nếu nhóm có cam kết.

**Kiểm tra:** công việc làm tay có được phản ánh trong B07/B09? Có hứa hỗ trợ liên tục nhưng chưa có người và thời gian? Test có người trợ giúp không, sự trợ giúp đó được tính thế nào?

**Good enough khi:** hiểu trách nhiệm tối thiểu để giao và sửa lỗi cho giá trị đã hứa. Không bắt một MVP sinh viên có bộ phận hỗ trợ hoặc SLA chuyên nghiệp không liên quan.

### M11. Thiết kế và cách thực hiện thử nghiệm

Đây là cầu nối từ “nhóm đã xây” sang “nhóm đã học được gì”. Cần biết:

1. **Giả định/câu hỏi:** đang kiểm tra hiểu luồng, hoàn thành nhiệm vụ, chất lượng output, giá trị, việc trả tiền hay điều khác?
2. **Đối tượng:** điều kiện chọn; người dùng/người mua/payer; tuyển ở đâu; người quen/thành viên nhóm nếu có; số người khác nhau.
3. **Phiên bản và tiếp xúc:** đã xem/dùng phần nào; vào thời điểm nào; tự làm hay được hướng dẫn; test thật/làm tay/mô phỏng.
4. **Thủ tục:** nhiệm vụ/câu hỏi; bối cảnh; trình tự; người điều phối; cách giữ bản ghi.
5. **Chỉ số/tín hiệu:** đo gì, bằng cách nào; tử số/mẫu số nếu là tỷ lệ; xử lý bỏ dở/thiếu dữ liệu.
6. **Tiêu chí diễn giải:** mức nào ủng hộ, không ủng hộ hoặc chưa kết luận; vì sao tiêu chí đó liên quan đến quyết định.
7. **Thời điểm đặt tiêu chí:** trước test hay rút ra sau khi xem dữ liệu; nếu không biết thì giữ là không biết.

**Kiểm tra độ phù hợp:** hỏi thích có thể đo cảm nhận, không thay được việc hoàn thành nhiệm vụ; chạy thử tác vụ không tự đo việc trả tiền; hỏi người dùng không tự xác nhận người duyệt ngân sách. Một chỉ số chỉ có giá trị theo giả định nó đang đo; lượt xem có thể có ích cho thử kênh nhưng không chứng minh nhu cầu trả tiền.

**Ngưỡng số người trong cấu hình CP3 này:** `MIN_TESTERS = 10` người khác nhau đã được tiếp xúc với đúng phần MVP cần thử. Đây là kiểm tra mức hoàn thành hoạt động, không phải bằng chứng mẫu đã đại diện hoặc đủ cho mọi kết luận. Nếu workflow được giao ngưỡng khác rõ ràng, ghi cấu hình thay đổi; không tự thay ngưỡng.

Đếm theo người, không theo số dòng, số câu trả lời hoặc số nhóm. Không cần tên, email, số điện thoại; mã ẩn danh đủ nếu phân biệt và truy được từng người. Một người thử nhiều lần là nhiều lượt nhưng vẫn một người. Nếu không phân biệt được, ghi “chưa xác nhận được số người khác nhau”; không quy kết bịa dữ liệu.

**Good enough khi:** có thể tái hiểu phép thử, biết nó đo được gì và không đo được gì, có tiêu chí diễn giải và xác định rõ phần đã thực hiện/phần mới dự kiến. Một kế hoạch đủ rõ không thay cho dữ liệu test thực tế ở M12/M13. Nếu tiêu chí được đặt sau, phải ghi rõ là phân tích sau test, không gọi là tiêu chí định trước. Có thể đủ rõ để đọc kết quả thăm dò, nhưng còn hạn chế với claim xác nhận giả thuyết.

### M12. Kết quả và phản hồi

**Cần biết:** kết quả theo giả định/nhiệm vụ; bao nhiêu người/lượt; mẫu số; phản hồi tích cực, khó khăn, không dùng được hoặc bỏ dở; khác biệt giữa nhóm; nguồn tra; kết luận và giới hạn.

**Kiểm tra:** kết quả có trả lời M11 không? Người thử đã thực hiện hay chỉ nói sẽ thực hiện? Có loại phản hồi bất lợi mà không nêu lý do không? Kết quả của v1 có bị ghi cho v2? Tỷ lệ có truy được từ M13? Nếu so với cách cũ, có dữ liệu của cách cũ không?

**Good enough khi:** đọc được điều đã xảy ra và nhóm suy ra gì, kể cả khi dữ liệu không ủng hộ MVP. Không bắt kết quả phải đạt tiêu chí mới được xem là hồ sơ đạt chất lượng.

Không dùng ý định tự báo cáo như hành vi chắc chắn. Không suy ra quan hệ nhân quả chỉ vì hai kết quả xảy ra cùng lúc. Không phạt việc ghi nhận một điểm chưa rõ nếu nhóm giữ đúng là chưa rõ.

### M13. Dữ liệu gốc và nơi tra cứu

Nhóm gửi file/link chứa phản hồi hoặc bản ghi của từng người thực sự đã xem/dùng MVP. Có thể là bảng trả lời khảo sát, ghi chép hỏi–đáp, quan sát hành động hoặc dữ liệu tương tác đã có.

Tối thiểu cần nối được: mã người → phiên bản/phần đã tiếp xúc → câu hỏi/nhiệm vụ → câu trả lời hoặc quan sát ghi lại → kết quả tổng hợp liên quan. Thời điểm và người ghi cần có khi ảnh hưởng đến cách hiểu; không dựng bổ sung nếu trước đây không ghi.

Không bắt chép lại toàn bộ khi file đính kèm đã có cấu trúc khác. Chỉ cần chỉ đúng file và sheet/mục/dòng. Không chỉ nộp biểu đồ hoặc lời tổng kết. Không bắt bản ghi phải là âm thanh/video hoặc có chữ ký. Phần nhớ lại sau phải ghi “ghi lại sau từ trí nhớ”, không gọi là bản ghi đồng thời.

**Good enough khi:** có thể kiểm tra một kết luận chính bằng các bản ghi mà không cần tin vào lời tổng kết. Dữ liệu ẩn danh được chấp nhận; tính truy được không đồng nghĩa phải lộ danh tính.

File không truy cập được là giới hạn bằng chứng. Ghi đúng điều đó và phần kết luận bị chặn; không tự cho là file có nội dung, cũng không khẳng định nhóm chưa từng thu dữ liệu.

### M14. Quyết định sau thử nghiệm

**Cần biết:** nhóm chọn thay đổi, tiếp tục hướng hiện tại hoặc chưa quyết định; dữ liệu dẫn tới lựa chọn; phần giữ/sửa; vì sao; đã làm hay dự định; phiên bản và phần BMC chịu ảnh hưởng.

**Kiểm tra vì sao:** quyết định có theo dữ liệu/tiêu chí M11–M13 không? Nếu dữ liệu trái chiều, nhóm giải thích cách cân nhắc chưa? Giữ nguyên có lý do hay chỉ vì chưa có thời gian sửa? Nếu chưa đủ dữ liệu, “chưa quyết định” có nêu đúng điều chưa biết không?

**Good enough khi:** thấy đường nối từ phát hiện đến quyết định và tiến độ thực hiện. Không ép nhóm phải đổi để chứng minh đã học; không coi tiếp tục là đúng chỉ vì đa số nói thích. Không tính bản sửa dự kiến là bản đã được kiểm tra lại.

## 6. Tiêu chí đánh giá chín block BMC

BMC là một mô hình có quan hệ giữa các block, không phải chín ô viết đầy. Mỗi block cần đủ nội dung cụ thể, lý do và trạng thái **đã có dữ liệu / đang giả định / dự kiến thực hiện**. Tham chiếu Mxx được chấp nhận, không bắt chép lại.

### B01. Phân khúc khách hàng

Nêu nhóm đầu tiên, tình huống/hành vi, user, người mua, payer nếu khác nhau; vì sao chọn và tiếp cận được thế nào. Đối chiếu M01 và đối tượng thực sự được test ở M11.

Good enough khi biết giá trị nào dành cho ai và ai cần thuyết phục. “Sinh viên” hoặc “doanh nghiệp” chưa tự đủ; nhóm không cần liệt kê mọi phân khúc tương lai. Test một nhóm không tự hỗ trợ các nhóm chưa thử.

### B02. Giá trị cung cấp

Nêu kết quả cụ thể cho từng bên, khoảng trống của cách hiện tại, cơ chế tạo giá trị và phần nào được M12/M13 hỗ trợ. Tách lợi ích của user và động lực của payer.

Good enough khi có thể nối B01 → vấn đề → M03 → giá trị, có giữ mức độ chắc chắn. Danh sách tính năng chưa tự là giá trị. Không nâng lời hứa tương lai thành giá trị đã chứng minh.

### B03. Kênh tiếp cận và cung cấp

Nêu cách khách biết đến, thử, mua, nhận giá trị và quay lại trong giai đoạn hiện tại; ai vận hành; kênh đã dùng hay dự kiến; căn cứ chọn nếu có.

Good enough khi thấy kênh phục vụ bước nào của hành trình và có khả năng tiếp cận theo nguồn nhóm nêu. Không yêu cầu có đủ mọi loại kênh hoặc tự tra chi phí quảng cáo. Số người theo dõi không tự là số khách có thể mua.

### B04. Quan hệ khách hàng

Nêu cách bắt đầu dùng, được hỗ trợ, phản hồi, duy trì hoặc quay lại; ai làm; công sức/công cụ cần có; vì sao phù hợp với nhu cầu và dạng giao dịch.

Good enough khi quan hệ không chỉ là từ “cộng đồng/chăm sóc” và không bỏ qua hỗ trợ làm tay đang diễn ra. Đối chiếu M05, M10, B07 và B09.

### B05. Dòng doanh thu

Nêu payer, lý do trả, gói/đơn vị, giá, tần suất hoặc sự kiện thanh toán; doanh thu thực hay giả định/dự báo. Nếu là trung gian, tách tổng tiền giao dịch và phần nhóm được hưởng.

Good enough khi nối được M06–M08 và có thể đọc một giao dịch cụ thể. Chưa có doanh thu thật được ghi trung thực là giả định; không tự thành lỗi claim. Nhưng không có payer hoặc đơn vị thu tiền làm mô hình chưa đủ rõ.

### B06. Nguồn lực chính

Nêu nguồn lực thực sự cần để thực hiện M03/M05/M10; nguồn nào đã có, nguồn nào cần thuê/được cấp; người phụ trách; quyền truy cập hoặc phụ thuộc quan trọng.

Good enough khi nguồn lực gắn với công việc và tình trạng sở hữu/tiếp cận. Không coi một dịch vụ có trên thị trường là nguồn lực nhóm đã có quyền dùng; không tự đòi đủ nguồn lực của sản phẩm tương lai.

### B07. Hoạt động chính

Nêu công việc tạo, giao và duy trì giá trị; ai làm; đầu vào/đầu ra; phần làm tay; tần suất/khối lượng nếu ảnh hưởng tới cam kết hoặc chi phí.

Good enough khi quy trình có thể nối với nguồn lực, gói giao và chi phí. “Phát triển app, marketing” chưa thay được các công việc vận hành lõi; cũng không bắt mô tả mọi việc nội bộ không liên quan.

### B08. Đối tác chính

Nêu bên cần phối hợp, phần đóng góp, lý do hai bên tham gia, trạng thái tiếp cận/đồng ý/dự kiến; phụ thuộc nào nếu thiếu sẽ ngăn giao giá trị.

Good enough khi không nhầm nhà cung cấp có thể mua dịch vụ với đối tác đã cam kết. Có thể chưa cần đối tác chính nếu nhóm giải thích hợp lý và các phụ thuộc khác được ghi đúng nơi. Không tự yêu cầu hợp đồng khi nhóm chỉ đang khai báo giả định hợp tác.

### B09. Cơ cấu chi phí

Nêu khoản chi chính; đơn vị/thời kỳ; cố định/biến đổi nếu hữu ích; chi phí đã phát sinh/ước tính/chưa biết; nguồn hoặc cách tính. Ghi công việc làm tay, kể cả đang do thành viên làm không nhận lương; không tự gán tiền lương thị trường.

Good enough khi các nguồn lực/hoạt động chính đều được phản ánh bằng tiền, thời gian hoặc ghi rõ chưa ước tính, đủ để thấy giới hạn của claim về chi phí/lợi nhuận. Chưa ước tính một khoản trọng yếu có thể là MAJOR dù nhóm đã khai báo trung thực.

Nếu nhóm nói có lợi nhuận hoặc rẻ hơn, phải có dữ liệu cùng đơn vị/phạm vi để kiểm tra. Không tự dựng dự báo tài chính hoặc yêu cầu báo cáo tài chính hoàn chỉnh cho một MVP.

## 7. Kiểm tra các mối nối: không chỉ kiểm từng ô

Sau khi đọc 23 field, bắt buộc rà các quan hệ dưới đây. Một field có thể rõ riêng lẻ nhưng mâu thuẫn với field khác.

| Mối nối | Cần trả lời | Dạng sai lệch cần phát hiện |
|---|---|---|
| M01 → M03 → M04 → M05 | Tính năng/luồng có tác động đến đúng vấn đề và giả định? | Xây được một tính năng nhưng không giải thích nó kiểm tra hoặc tạo giá trị gì |
| M03 → M11 | Phép thử có thể phát hiện giả định đúng hoặc sai trong phạm vi đó? | Hỏi thích giao diện để xác nhận độ chính xác, lợi ích thực hoặc việc trả tiền |
| M02 → M11 → M12 → M13 | Đã test đúng phiên bản, phần lõi, đối tượng và có bản ghi? | Dữ liệu trước thay đổi giá/cơ chế được dùng để khẳng định bản mới |
| M11 → M12 → M14 | Tiêu chí, kết quả và quyết định có khớp? | Đổi tiêu chí sau test nhưng nói đã đạt tiêu chí định trước |
| M01/B01 → B02 → B05 | Giá trị của đúng bên có giải thích được bên trả tiền? | Người dùng hưởng lợi nhưng không có căn cứ cho tổ chức trả tiền |
| M06/M07/M08 ↔ B05 | Cùng gói, giá, payer, đơn vị và trạng thái giao dịch? | Giá/lần bị dùng như giá/tháng; đề xuất bị dùng như đã thu |
| M03/M05/M10 ↔ B06/B07/B08/B09 | Có nguồn lực, hoạt động, phụ thuộc và chi phí để giao giá trị đã mô tả? | Gọi tự động nhưng toàn bộ do thành viên làm, bỏ công vận hành khỏi chi phí |
| B03/B04 ↔ B07/B09 | Có công việc/công sức cho kênh và quan hệ đã hứa? | Hỗ trợ từng người nhưng mô hình giả định không tốn thời gian |
| M12/M14 ↔ BMC | Nhóm có giải thích giữ/đổi các giả định bị dữ liệu tác động? | Test cho thấy khác người dùng, mức giá hoặc nhu cầu nhưng BMC vẫn giữ claim cũ không giải thích |

Ghi một lỗi gốc, liệt kê các field chịu tác động; không nhân đôi thành nhiều lỗi độc lập. Một khác biệt giữa phiên bản cũ/mới có giải thích là thay đổi, không tự là mâu thuẫn.

## 8. Đánh giá căn cứ và giới hạn kết luận

### 8.1. Với mỗi claim trung tâm

Ghi: claim; giả định liên quan; đối tượng/phiên bản; dữ liệu và vị trí; cách suy từ dữ liệu; giới hạn; một trong bốn kết quả:

- **CÓ CĂN CỨ TRONG PHẠM VI:** nguồn hỗ trợ mức phát biểu đó trong người/bối cảnh/phiên bản được nêu.
- **CHƯA ĐỦ CĂN CỨ:** thiếu dữ liệu, không truy được, phương pháp không đo đúng hoặc chưa phân biệt được các giải thích.
- **MÂU THUẪN VỚI NGUỒN ĐÃ NỘP:** dữ liệu hoặc phần khác trong nguồn không tương thích với claim và nhóm chưa giải thích.
- **KHÔNG ÁP DỤNG:** chỉ dùng khi có lý do hợp lệ cho đúng câu hỏi đó; không dùng thay cho chưa test.

Các nhãn này nói về **claim**, không phán toàn bộ sản phẩm. Không dùng trung bình điểm để làm biến mất một mâu thuẫn trọng yếu.

### 8.2. Phạm vi dữ liệu

Luôn giữ các khác biệt:

- Có nghe vấn đề ≠ quan sát hành vi giải quyết vấn đề.
- Có xem MVP ≠ tự dùng được tính năng lõi.
- Tự dùng được ≠ nhận được giá trị mong muốn.
- Nói sẽ dùng/trả tiền ≠ đã dùng/trả tiền.
- Đã trả một lần ≠ sẽ quay lại hoặc có lợi nhuận.
- Đủ 10 người thử ≠ mẫu đại diện hoặc mọi giả định đều đã được kiểm chứng.

Không xây một thang bằng chứng tuyệt đối. Loại dữ liệu phù hợp tùy câu hỏi: hỏi–đáp có thể đủ cho việc hiểu ngôn ngữ/bối cảnh; hành động cần cho claim hành động; giao dịch cần cho claim giao dịch.

Không tự áp yêu cầu thống kê chuyên sâu cho một test thăm dò. Nhưng nếu nhóm suy ra tỷ lệ thị trường hoặc hiệu quả nhân quả từ mẫu thuận tiện, phải giới hạn kết luận hoặc yêu cầu căn cứ phù hợp.

### 8.3. Số liệu và tiêu chí

Chỉ tính khi có đủ input và cùng đơn vị. Nêu tử số, mẫu số, trường hợp bị loại, phiên bản và nguồn. Nếu số không khớp, nêu chênh lệch; không tự sửa dữ liệu cho đẹp.

Không tự đặt ngưỡng pass/fail sau khi nhìn dữ liệu để cho nhóm đạt. Nếu nhóm chưa đặt, ghi thiếu và yêu cầu nhóm giải thích cơ sở đánh giá; nếu đặt sau, giữ nhãn phân tích sau test.

Không dùng việc không ghi nhận thất bại làm bằng chứng không có thất bại. Không dùng việc chưa có bằng chứng làm bằng chứng giả định sai.

## 9. Severity, câu hỏi và cách sửa hồ sơ

### 9.1. Severity theo hậu quả

- **BLOCKER:** không thể đánh giá một kết luận trung tâm mà không phải đoán, hoặc nguồn/phiên bản/vai trò bị trộn làm kết luận đó không thể đọc đúng. Phải nêu chính xác **kết luận nào bị chặn**.
- **MAJOR:** hiểu được phần đang làm nhưng thiếu một mắt xích quan trọng, thiếu mức thực hiện hoặc dữ liệu/logic chưa đủ cho kết luận mong muốn.
- **MINOR:** ảnh hưởng độ rõ ở phạm vi nhỏ, không đổi cách hiểu cơ chế, dữ liệu hoặc quyết định chính.

Không gán severity chỉ theo tên field. Ví dụ: thiếu tần suất có thể MAJOR; thiếu hoàn toàn đối tượng và pain có thể BLOCKER. Thiếu giá có thể chặn kết luận doanh thu nhưng vẫn đọc được test luồng dùng.

Không có dữ liệu M13 khiến không thể xác nhận kết quả test được tuyên bố có thể là BLOCKER cho kết luận validation. Không vì thế khẳng định nhóm không có MVP hoặc không thể kinh doanh.

Chưa đủ số người theo cấu hình thường là MAJOR về hoàn thành test, trừ khi dữ liệu ít/không rõ đến mức không xác định được thử gì với ai. Kết quả âm tính, chưa thu tiền hoặc chưa quyết định không tự là lỗi.

### 9.2. Một issue phải có

- Mã `I01`…; severity; field chính và field bị ảnh hưởng.
- Nội dung/vị trí nguồn; phần vắng thì ghi vùng nguồn đã kiểm tra.
- Vấn đề cụ thể và rule liên quan.
- Vì sao làm lệch hoặc chặn kết luận nào.
- Nhóm cần bổ sung/làm rõ gì; loại câu trả lời hoặc nguồn được chấp nhận.
- Điều kiện đóng issue, để lần kiểm tra sau không tùy cảm giác.

Không viết “cần làm rõ hơn” đứng một mình. Không yêu cầu “thêm dữ liệu” mà không nói dữ liệu phải trả lời câu hỏi nào.

### 9.3. Câu hỏi có thể điền được

Hỏi đúng chỗ còn thiếu, theo thứ tự phụ thuộc. Mỗi câu hỏi gắn issue và field; nêu dạng trả lời: mô tả ngắn, bảng, mã bản ghi, giải thích đơn vị, hoặc nguồn.

Ví dụ về dạng câu hỏi: “Trong 12 dòng phản hồi có bao nhiêu người khác nhau? Dùng mã ẩn danh nối từng người với phần MVP đã xem/dùng; nếu không ghi được thì nêu chưa xác nhận.”

Không hỏi dẫn dắt “vì sao nên thêm tính năng X?”. Không ép nhóm tạo chứng cứ hồi tố. Nếu trước đây không ghi, nhóm ghi không có; muốn kiểm tra lại thì đó là hoạt động mới, không phải điền hộ dữ liệu cũ.

### 9.4. Thứ tự và chống lặp

Sắp BLOCKER → MAJOR → MINOR; trong mỗi nhóm đi theo vấn đề/đối tượng → cơ chế/phiên bản → phép thử/dữ liệu → kết luận/quyết định → mô hình kinh doanh. Lỗi gốc đi trước lỗi phụ thuộc.

Liệt kê hết BLOCKER và MAJOR quan trọng; gộp MINOR tối đa 5 nhóm. Không bỏ lỗi làm sai kết luận để rút ngắn. Không lặp một issue ở ba mục chỉ vì nó ảnh hưởng ba field.

## 10. Kết luận hồ sơ và kết luận MVP là hai việc

### 10.1. Readiness của hồ sơ

- `NOT READY`: có BLOCKER ở chuỗi lõi khiến chưa xác định được MVP, cơ chế, đối tượng, phép thử hoặc kết quả trung tâm đang nói đến. Vẫn chỉ rõ phần nào có thể đọc được.
- `PARTIALLY READY`: có thể đánh giá một số phần nhưng còn MAJOR hoặc BLOCKER giới hạn ở một nhánh, ví dụ mô hình thu tiền; nêu nhánh có thể đọc và nhánh bị chặn.
- `READY FOR DOCUMENT REVIEW`: không còn BLOCKER/MAJOR; các field áp dụng đủ rõ, hoạt động thử đã thực hiện đạt mức tối thiểu của cấu hình, chuỗi lý do–thử–dữ liệu–quyết định truy được; giả định và giới hạn đã được ghi đúng. MINOR không làm đổi kết luận có thể còn.

Không dùng `READY FOR REALITY CHECK` trong bản CP3 này, vì workflow kết thúc ở audit hồ sơ và không tự khởi chạy bước đó. Không cho READY khi còn BLOCKER hoặc MAJOR. Không cho READY chỉ vì field đều có chữ.

### 10.2. Trả lời về MVP bằng kết luận có phạm vi

Phải trả lời đủ các câu sau, theo bốn nhãn ở mục 8.1:

1. Lý do chọn dạng/phạm vi MVP có nối với vấn đề và giả định cần kiểm tra không?
2. Phần lõi được mô tả đủ để hiểu cơ chế và trạng thái thực hiện không?
3. Phép thử đã thực hiện có đo đúng giả định với đúng đối tượng/phiên bản không?
4. Kết luận về kết quả có được dữ liệu đã nộp hỗ trợ không?
5. Quyết định giữ/đổi/chưa quyết định có nối được với kết quả không?
6. BMC có nhất quán với MVP, vai trò, giá và công việc giao giá trị không?

Không đổi các câu này thành một nhãn “MVP tốt” hoặc “MVP sai”. Với giả định đã test, ghi dữ liệu hiện tại **ủng hộ / không ủng hộ / chưa phân định / chưa được thử**, cùng phạm vi. Chỉ ghi giả định nguồn đã nêu; nếu phải suy ra, ghi là câu hỏi cần nhóm xác nhận.

Hồ sơ tốt có thể cho thấy giả định không được ủng hộ. Hồ sơ yếu có thể mô tả một sản phẩm tốt ngoài thực tế, nhưng Gate không đủ bằng chứng để chứng nhận điều đó.

## 11. Quy trình thực hiện

1. Kiểm tra điều kiện chạy, tập nguồn, phiên bản, cấu hình test.
2. Đọc toàn bộ phần nguồn có thể truy cập; dùng packet làm bản đồ, không làm kết luận sẵn.
3. Tóm tắt bằng thông tin nguồn; giữ các chỗ chưa rõ.
4. Đối chiếu 23 field, phần áp dụng và tiêu chí Good enough.
5. Kiểm tra chuỗi lý do và các mối nối mục 7.
6. Kiểm tra claim, dữ liệu, mẫu số, frame, độ ổn định và giới hạn.
7. Gom lỗi gốc, gán severity, viết điều kiện đóng issue.
8. Đưa câu hỏi và khung bổ sung theo đúng mã field; không điền đáp án.
9. Kết luận readiness và sáu câu đánh giá MVP/BMC, giữ hai việc riêng.
10. Tự kiểm theo mục 14 rồi xuất đúng schema.

Không lén bỏ bước 1 của workflow vì đã đọc tài liệu trước đó. Tập nguồn đổi phải về Triad, không chỉ chạy lại Gate.

## 12. Schema output bắt buộc

Dùng tiếng Việt rõ, ngắn trong từng ô; đủ căn cứ ở từng lỗi quan trọng. Giữ mục 0–9, không bỏ mục vì không có lỗi. Không có lỗi thì ghi “Không ghi nhận trong phần nguồn đã đọc”. Không tự coi phần chưa đọc là đã đạt.

```md
# INPUT CLARIFICATION AUDIT

## 0. Phạm vi kiểm tra

- Nhóm/hồ sơ: [...]
- Phiên bản hồ sơ và MVP: [...]
- Packet: [CP3_TRIAD_V2 / tập nguồn tương ứng]
- Gate: CP3_INPUT_GATE_V2 / 2.0
- Registry: CP3_MANUAL_23 / 2.0
- Cấu hình số người thử: [10 hoặc cấu hình được giao rõ; nguồn thay đổi nếu có]
- Nguồn đã đọc: [Sxx / phạm vi]
- Phần chưa đọc/không truy cập được: [...]

## 1. Nhóm đang làm gì?

[3–6 dòng: ai gặp vấn đề gì, cách hiện tại, MVP nào, giả định nào, đã thử gì. Không tự hoàn thiện phần thiếu.]

## 2. Các mục đã đủ rõ chưa?

| Mã | Mục | Áp dụng | Trạng thái thông tin | Mức thực hiện | Căn cứ/vị trí và phần còn thiếu | Issue |
|---|---|---|---|---|---|---|
| M01 | Khách hàng, vấn đề và cách đang giải quyết | [...] | [...] | [...] | [...] | [...] |
| M02 | MVP hiện tại và phạm vi phiên bản | [...] | [...] | [...] | [...] | [...] |
| M03 | Cơ chế, giả định và lý do chọn MVP | [...] | [...] | [...] | [...] | [...] |
| M04 | Tính năng lõi và yêu cầu hoạt động | [...] | [...] | [...] | [...] | [...] |
| M05 | Luồng sử dụng và giao diện/điểm chạm | [...] | [...] | [...] | [...] | [...] |
| M06 | Gói sản phẩm/dịch vụ và cách bàn giao | [...] | [...] | [...] | [...] | [...] |
| M07 | Cách định giá và lý do chọn | [...] | [...] | [...] | [...] | [...] |
| M08 | Mức giá và căn cứ | [...] | [...] | [...] | [...] | [...] |
| M09 | Khác biệt so với cách hiện tại | [...] | [...] | [...] | [...] | [...] |
| M10 | Hỗ trợ và xử lý sự cố | [...] | [...] | [...] | [...] | [...] |
| M11 | Thiết kế và cách thực hiện thử nghiệm | [...] | [...] | [...] | [...] | [...] |
| M12 | Kết quả và phản hồi | [...] | [...] | [...] | [...] | [...] |
| M13 | Dữ liệu gốc và nơi tra cứu | [...] | [...] | [...] | [...] | [...] |
| M14 | Quyết định sau thử nghiệm | [...] | [...] | [...] | [...] | [...] |
| B01 | Phân khúc khách hàng | [...] | [...] | [...] | [...] | [...] |
| B02 | Giá trị cung cấp | [...] | [...] | [...] | [...] | [...] |
| B03 | Kênh tiếp cận và cung cấp | [...] | [...] | [...] | [...] | [...] |
| B04 | Quan hệ khách hàng | [...] | [...] | [...] | [...] | [...] |
| B05 | Dòng doanh thu | [...] | [...] | [...] | [...] | [...] |
| B06 | Nguồn lực chính | [...] | [...] | [...] | [...] | [...] |
| B07 | Hoạt động chính | [...] | [...] | [...] | [...] | [...] |
| B08 | Đối tác chính | [...] | [...] | [...] | [...] | [...] |
| B09 | Cơ cấu chi phí | [...] | [...] | [...] | [...] | [...] |

## 3. BLOCKER — Chỗ đang chặn đánh giá

### I[n] — [Tên vấn đề]
- Field chính / field bị ảnh hưởng: [...]
- Nguồn và nội dung đang có: [...]
- Vấn đề và tiêu chí liên quan: [...]
- Kết luận nào bị chặn, vì sao: [...]
- Nhóm cần bổ sung/làm rõ: [...]
- Đủ để đóng issue khi: [...]

[Lặp cho từng BLOCKER; không lặp lỗi gốc ở mục MAJOR.]

## 4. MAJOR — Chỗ còn thiếu quan trọng

### I[n] — [Tên vấn đề]
- Field chính / field bị ảnh hưởng: [...]
- Nguồn và nội dung đang có: [...]
- Vấn đề và tiêu chí liên quan: [...]
- Nếu giữ nguyên sẽ làm lệch kết luận nào: [...]
- Nhóm cần bổ sung/làm rõ: [...]
- Đủ để đóng issue khi: [...]

[Lặp cho từng MAJOR.]

## 5. MINOR — Chỗ cần sửa để dễ hiểu

[Tối đa 5 nhóm; mã issue, field, vị trí và yêu cầu ngắn.]

## 6. Câu hỏi nhóm cần trả lời

| Ưu tiên | Issue / field | Câu hỏi cụ thể | Dạng câu trả lời hoặc nguồn cần gửi |
|---|---|---|---|
| [...] | [...] | [...] | [...] |

[Chỉ hỏi phần còn thiếu; câu hỏi gốc trước câu hỏi phụ thuộc.]

## 7. Khung bổ sung để nhóm tự điền

[Chỉ xuất các field cần bổ sung từ phụ lục A; giữ nguyên mã và các chỗ [Điền]. Nếu đã có một phần, dẫn về nguồn thay vì viết lại thành câu trả lời thay nhóm. Không in lại toàn bộ mẫu nếu không cần.]

## 8. Trạng thái hồ sơ

- Kết luận: [NOT READY / PARTIALLY READY / READY FOR DOCUMENT REVIEW]
- Vì sao: [gắn issue và điều kiện mục 10.1]
- Phần đã có thể đánh giá: [...]
- Phần chưa thể kết luận: [...]
- Những mục phải bổ sung trước lần kiểm tra tiếp: [issue ưu tiên]
- Khi tài liệu/dữ liệu đổi: chạy lại Triad rồi Gate, bỏ packet cũ cho tập nguồn mới.

## 9. MVP và BMC có căn cứ đến đâu?

| Câu hỏi đánh giá | Kết quả theo mục 8.1 | Nguồn và lý do | Phạm vi/điều chưa thể kết luận | Issue liên quan |
|---|---|---|---|---|
| Lý do chọn dạng/phạm vi MVP có nối với vấn đề và giả định? | [...] | [...] | [...] | [...] |
| Phần lõi có đủ mô tả cơ chế và trạng thái thực hiện? | [...] | [...] | [...] | [...] |
| Phép thử đã thực hiện có đo đúng giả định, đối tượng, phiên bản? | [...] | [...] | [...] | [...] |
| Kết luận kết quả có được dữ liệu đã nộp hỗ trợ? | [...] | [...] | [...] | [...] |
| Quyết định sau test có nối với kết quả? | [...] | [...] | [...] | [...] |
| BMC có nhất quán với MVP và cách giao giá trị? | [...] | [...] | [...] | [...] |

### Các claim/giả định trung tâm

| Claim/giả định của nhóm | Đối tượng/phiên bản | Nguồn dữ liệu và vị trí | Kết quả kiểm tra claim theo mục 8.1 | Kết quả đối với giả định được test | Giới hạn |
|---|---|---|---|---|---|
| [...] | [...] | [...] | [...] | [ủng hộ / không ủng hộ / chưa phân định / chưa được thử] | [...] |

[Chỉ có claim/giả định thực sự được nguồn nêu. Nếu chưa xác định được giả định cần test, ghi thiếu; không tự chọn. Không kết luận đã xác minh độc lập sản phẩm hoặc thị trường.]
```

## 13. Cấu hình mặc định và độ ổn định của template

```text
MODE = DOCUMENT_INPUT_AUDIT
OUTPUT_MODE = FULL_AUDIT
REGISTRY = CP3_MANUAL_23 / 2.0
SOURCE_OF_TRUTH = ORIGINAL_TEAM_DOCUMENTS_AND_PROVIDED_ATTACHMENTS
PACKET_ROLE = ATTENTION_MAP_ONLY
MIN_TESTERS = 10
MAX_BLOCKER_ISSUES = unlimited
MAX_MAJOR_ISSUES = unlimited
MAX_MINOR_GROUPS = 5
REQUIRE_AI_LOG = false
PAGE_LIMIT = none
REQUIRE_CP2 = false
EXTERNAL_REALITY_CHECK = false
WRITE_ANSWERS_FOR_TEAM = false
```

Template ổn định khi:

1. **Cùng mã, cùng nghĩa:** 23 mã giữ nguyên qua các nhóm và các lần kiểm tra. Không đổi M11 thành một việc khác chỉ vì nhóm trình bày khác.
2. **Linh hoạt hình thức:** có thể dùng chữ, bảng, ảnh bản viết tay đọc được hoặc file đính kèm; chấm nội dung tương đương, không chấm đúng vị trí ô.
3. **Tách dữ liệu và diễn giải:** cùng một dữ liệu không được tự nâng thành kết luận chỉ vì chuyển từ bảng sang đoạn văn.
4. **Có tiêu chí đóng lỗi:** một bổ sung tương đương phải được xử lý như nhau, không dựa vào độ dài hoặc văn phong.
5. **Có đường truy xuất:** claim trọng tâm nối được với bản ghi/nguồn/phiên bản hoặc được ghi rõ chưa có căn cứ.
6. **Không ép câu trả lời:** giữ lựa chọn chưa biết, chưa làm, chưa quyết định hoặc không áp dụng có lý do. Chúng làm lộ khoảng trống, không tự khiến khoảng trống đạt yêu cầu.
7. **Có lịch sử thay đổi:** sửa hồ sơ ghi phiên bản; đổi dữ liệu chạy lại hai bước. Đổi nghĩa field hoặc ngưỡng kiểm tra phải tăng phiên bản quy tắc, không đổi ngầm trong lúc audit.

Với mẫu cũ: map nội dung sẵn có vào registry này theo nghĩa, giữ nguồn. Không bắt chép lại mọi thứ và không xem một mã Mxx cũ là bằng chứng field mới đã đủ.

## 14. Tự kiểm trước khi xuất audit

- Đã có packet phù hợp hay đang bỏ qua bước 1?
- Nhận xét quan trọng nào đang chỉ dựa vào packet, chưa kiểm nguồn? Phải sửa.
- Có đang đánh đồng “nhóm nêu rõ đây là giả định” với “đã kiểm chứng” không?
- Có chỗ yêu cầu dữ liệu mà claim/đích kiểm tra không cần đến không?
- Có đủ 23 dòng; phần không áp dụng có lý do; có giữ phần không đọc được?
- Có đánh giá lý do chọn MVP, độ phù hợp của phép thử và quan hệ MVP–BMC, thay vì chỉ đếm ô?
- Có đếm số người khác nhau và đúng loại tiếp xúc, thay vì đếm số dòng?
- Có khẳng định Figma/backend/tính năng đã chạy ngoài phạm vi nguồn không?
- Có coi kết quả test âm tính là lỗi input, hoặc coi kết quả đẹp là bằng chứng tự đủ không?
- Mỗi BLOCKER/MAJOR có nguồn, kết luận bị ảnh hưởng và điều kiện đóng không?
- Readiness có khớp severity; kết luận về MVP có giữ phạm vi không?
- Có vô tình viết thay nhóm, đề xuất tính năng, tự đặt giá hoặc tự đặt ngưỡng đạt không?
- Có thêm tiêu chí AI log, số trang hoặc CP2 bắt buộc trái cấu hình không?

Tự kiểm nội bộ, không in checklist kèm audit. Giọng văn thẳng, dễ đọc, không mạt sát nhóm, không khen chung chung và không dùng thuật ngữ để che nội dung thiếu.

### 14.1. Tình huống chuẩn để giữ cách đánh giá nhất quán

| Tình huống | Phải xử lý như thế nào? |
|---|---|
| MVP là dịch vụ làm tay, mô tả rõ người xử lý, đã thử đúng nhiệm vụ và có bản ghi | Không tạo lỗi chỉ vì thiếu app/backend; kiểm cơ chế, kết quả, công vận hành và phạm vi kết luận |
| Test đủ 10 người, chỉ 3 người hoàn thành; nhóm báo đúng kết quả và có quyết định có căn cứ | Kết quả không ủng hộ giả định có thể được ghi tốt; không tự cho hồ sơ fail vì kết quả thấp |
| Có 12 dòng khảo sát từ 6 người | Ghi 6 người, 12 dòng; chưa đạt ngưỡng 10; không đếm dòng thành người |
| Người thử nói thích giao diện; nhóm kết luận đã xác nhận họ sẽ trả tiền | Dữ liệu có thể hỗ trợ cảm nhận giao diện, chưa hỗ trợ claim trả tiền; chỉ rõ câu hỏi/phạm vi còn thiếu |
| Test v1, sau đó đổi giá và cơ chế thành v2 | Giữ dữ liệu cho v1; chỉ dùng cho v2 ở phần không đổi và có lý do; không yêu cầu bỏ toàn bộ dữ liệu cũ |
| Có kế hoạch thử đầy đủ nhưng nhóm nói rõ chưa thực hiện | Có thể đủ rõ về thiết kế; mức thực hiện là Chưa làm; kết quả/dữ liệu chưa có; không biến kế hoạch thành validation |
| BMC không nằm trên một trang hoặc không có CP2 | Không tạo lỗi vì hai điều này; chỉ kiểm nội dung và quan hệ cần thiết |
| Link dữ liệu không mở được | Chưa kiểm được bằng chứng đó; nêu claim bị giới hạn, không quy kết nhóm không từng thu dữ liệu |

Đây là ví dụ hiệu chỉnh nguyên tắc, không phải điểm số hoặc đáp án mặc định cho mọi hồ sơ. Severity vẫn phụ thuộc kết luận thực sự bị ảnh hưởng.

---

# PHỤ LỤC A — MẪU NHÓM TỰ ĐIỀN

Phần này là khung lấy thông tin, không phải bài mẫu có đáp án. Có thể tách phần phụ lục để gửi cho nhóm điền bằng tay.

## Hướng dẫn ngắn

- Điền điều nhóm thực sự đã làm/biết. Chưa làm hoặc chưa biết thì ghi đúng như vậy.
- Chỗ nào mới dự đoán thì ghi “Nhóm đang giả định…”. Chỗ nào đã có dữ liệu thì ghi file/mục/dòng để tra.
- Không cần viết dài hoặc chép lại dữ liệu đã đính kèm. Ghi rõ nơi tìm được câu trả lời là đủ.
- Không có quy định số trang. BMC chỉ cần đủ chín phần và các phần khớp nhau.
- Có thể dùng mã người thử; không cần tên, số điện thoại hoặc email.
- Nếu viết tay, bảo đảm chữ và ảnh chụp đọc được. Không đọc được sẽ phải bổ sung, không ai được đoán hộ.
- Không áp dụng thì nêu lý do. “Chưa làm” khác với “không áp dụng”.

**Thông tin chung**

- Tên nhóm / dự án: [Điền]
- Phiên bản hồ sơ / ngày cập nhật: [Điền]
- MVP đang mô tả là phiên bản: [Điền]
- Các file/ảnh/dữ liệu gửi kèm và nội dung từng file: [Điền]
- Thay đổi so với lần nộp trước, nếu có: [Điền; không cần nộp CP2 nếu không dùng]

## PHẦN 1 — MVP: NHÓM LÀM GÌ, VÌ SAO VÀ ĐÃ THỬ THẾ NÀO?

### M01. Nhóm đang giải quyết vấn đề của ai?

- Nhóm người đầu tiên muốn phục vụ: [Điền cụ thể]
- Họ gặp vấn đề trong tình huống nào? Họ đang muốn làm việc gì? [Điền]
- Vấn đề và hậu quả cụ thể: [Điền; tần suất nếu đã biết]
- Hiện họ giải quyết bằng cách nào, kể cả tự làm hoặc bỏ qua? [Điền]
- Cách hiện tại chưa đáp ứng ở điểm nào? Vì sao họ vẫn dùng cách đó? [Điền]
- Vì sao nhóm chọn vấn đề và nhóm người này để làm trước? [Điền]
- Điều nào có dữ liệu? Dữ liệu nằm ở đâu? Điều nào nhóm đang giả định? [Điền]

### M02. MVP hiện tại có những gì?

- Mục tiêu giới hạn của phiên bản này: [Điền]
- Phiên bản / ngày hoặc giai đoạn: [Điền]

| Phần của MVP | Đã làm được gì? | Đang làm tay, mô phỏng hay đã hoạt động? | Phần chưa có/dự định làm | Ảnh/tài liệu để xem |
|---|---|---|---|---|
| [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |

- Phiên bản thực sự đã đưa cho người thử: [Điền]
- Nếu khác bản hiện tại, khác gì và kết quả cũ còn nói được điều gì? [Điền]

### M03. Vì sao chọn MVP này và nó hoạt động thế nào?

- Giả định quan trọng nhóm muốn kiểm tra: [Điền bằng một câu rõ]
- Vì sao giả định này quan trọng? Nếu sai thì kế hoạch nào bị ảnh hưởng? [Điền]
- Người dùng đưa thông tin/làm gì? [Điền]
- Sau đó sản phẩm hoặc người trong nhóm xử lý thế nào? [Điền]
- Người dùng nhận được gì? Kết quả đó giúp họ làm việc gì tốt hơn? [Điền]
- Vì sao chọn cách làm này để kiểm tra giả định? Nó cho phép quan sát điều gì? [Điền]
- Phần nào phải giữ trong MVP? Vì sao? Phần nào để sau? Vì sao? [Điền]
- Điều gì cách làm này chưa kiểm tra được? [Điền]

### M04. Tính năng lõi cần làm được gì?

| Tính năng/công việc lõi | Phục vụ vấn đề/giả định nào? | Nhận đầu vào gì? | Phải tạo kết quả gì, nhận biết bằng cách nào? | Giới hạn và tình trạng hiện tại |
|---|---|---|---|---|
| [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |

Chỉ cần liệt kê phần lõi của vòng MVP này, không cần chép toàn bộ kế hoạch tính năng tương lai.

### M05. Một người dùng đi từ đầu đến cuối thế nào?

| Bước | Người dùng làm gì? | Sản phẩm/nhóm làm gì? | Người dùng nhận gì hoặc sang bước nào? | Chỗ có thể lỗi/cần giúp |
|---|---|---|---|---|
| [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |

- Ảnh/bản vẽ giao diện hoặc tài liệu minh họa nằm ở: [Điền nếu có]
- Điểm nào đã được người thử tự làm, điểm nào có người hướng dẫn? [Điền]

### M06. Khách hàng thực sự nhận được gói gì?

- Một lần dùng/một gói gồm: [Điền]
- Người nhận, cách nhận và thời gian/phạm vi cung cấp: [Điền]
- Phần không bao gồm hoặc giới hạn: [Điền]
- Bao bì/đóng gói vật lý nếu liên quan: [Điền hoặc ghi không áp dụng và lý do]
- Vì sao chia gói và bàn giao theo cách này? [Điền]

### M07. Vì sao thu tiền theo cách này?

- Ai trả tiền? Có khác người dùng không? [Điền]
- Họ trả để nhận giá trị gì? [Điền]
- Thu theo lần/người/nhóm/tháng/gói hay cách khác? [Điền]
- Vì sao chọn cách thu này? Căn cứ hoặc giả định là gì? [Điền]
- Phần miễn phí/có phí nếu có: [Điền]

### M08. Giá bao nhiêu và dựa vào đâu?

| Gói/đối tượng | Mức giá, tiền tệ | Theo đơn vị/thời kỳ nào? | Đề xuất, đã báo hay đã thu? | Căn cứ và nguồn |
|---|---|---|---|---|
| [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |

- Vì sao chọn mức này? [Điền]
- Nếu so với cách khác, đã so cùng gói/đơn vị/điều kiện chưa? [Điền]
- Đã có dữ liệu về việc chấp nhận giá chưa? Nếu có, người nào được hỏi/đã trả và dữ liệu ở đâu? [Điền; chưa có thì ghi chưa có]

### M09. Khác cách hiện tại ở đâu?

| Cách hiện tại/đối chiếu | So theo tiêu chí nào? | MVP khác thế nào? | Căn cứ hay mới là giả định? | Giới hạn/đánh đổi |
|---|---|---|---|---|
| [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |

- Vì sao khác biệt này quan trọng với người dùng hoặc người trả tiền? [Điền]

### M10. Nếu người dùng gặp lỗi thì ai giúp?

- Những việc nhóm hỗ trợ: [Điền]
- Ai phụ trách, qua kênh nào, trong thời gian/phạm vi nào? [Điền]
- Khi không giao được kết quả hoặc kết quả có vấn đề, nhóm xử lý thế nào? [Điền]
- Công việc/thời gian cần bỏ ra: [Điền nếu biết; chưa ước tính thì ghi rõ]
- Vì sao mức hỗ trợ này phù hợp với MVP hiện tại? [Điền]

### M11. Nhóm đã thử MVP như thế nào?

Lặp khung này cho từng vòng thử có mục tiêu hoặc phiên bản khác nhau. Nếu chưa thử, ghi rõ chưa thử; kế hoạch không được ghi thành hoạt động đã làm.

- Mã vòng thử / thời gian: [Điền]
- Giả định hoặc câu hỏi cần kiểm tra, tham chiếu M03: [Điền]
- Vì sao cách thử này có thể trả lời câu hỏi đó? [Điền]
- Người thử thuộc nhóm nào? Tuyển từ đâu, theo điều kiện gì? [Điền]
- Số người khác nhau / số lượt thử; cách phân biệt: [Điền]
- Phiên bản và phần MVP họ thực sự xem/dùng: [Điền]
- Từng người được yêu cầu làm gì hoặc được hỏi câu gì? [Điền; có thể dẫn tài liệu kịch bản]
- Bối cảnh và mức hướng dẫn/hỗ trợ của nhóm: [Điền]
- Nhóm ghi nhận dữ liệu bằng cách nào? Dữ liệu nằm ở M13/file nào? [Điền]

| Điều cần đo/quan sát | Đo/ghi như thế nào? | Kết quả nào ủng hộ/không ủng hộ/chưa kết luận? Vì sao? | Tiêu chí đặt trước hay sau khi xem dữ liệu? |
|---|---|---|---|
| [Điền] | [Điền; nếu tỷ lệ thì nêu tử số/mẫu số] | [Điền] | [Điền; không biết thì ghi không biết] |

- Điều vòng thử này chưa kiểm tra được: [Điền]
- Nếu chưa đủ 10 người theo cấu hình hiện tại, ghi số thực và phần còn chưa thực hiện: [Điền]

### M12. Kết quả thực tế là gì?

| Câu hỏi/nhiệm vụ ở M11 | Kết quả thực tế; tử số/mẫu số nếu có | Bản ghi để tra ở M13 | Nhóm rút ra điều gì? | Giới hạn hoặc điều chưa rõ |
|---|---|---|---|---|
| [Điền] | [Điền đúng dữ liệu] | [Điền] | [Điền] | [Điền] |

- Người thử đánh giá phần lõi nào quan trọng, vì sao? [Điền theo phản hồi đã có]
- Họ nói muốn dùng tiếp hay đã thực sự dùng tiếp? Dữ liệu nào phân biệt? [Điền]
- Phản hồi tích cực: [Điền và dẫn mã bản ghi]
- Khó khăn, điều không thích, lần không hoàn thành hoặc phản hồi trái chiều: [Điền và dẫn mã bản ghi]
- Điều nào dữ liệu ủng hộ, không ủng hộ hoặc còn chưa đủ để kết luận? [Điền]

Nếu trước đây không hỏi/không ghi một nội dung, ghi chưa có dữ liệu, không tự tạo câu trả lời.

### M13. Gửi dữ liệu phản hồi của từng người

Gửi file/link chứa câu trả lời, nhận xét hoặc bản ghi của từng người thực sự đã xem/dùng MVP:

- Khảo sát: bảng câu trả lời từng người.
- Phỏng vấn: câu hỏi và câu trả lời đã ghi.
- Quan sát: người đó đã làm gì, gặp khó ở đâu, nhận xét gì.
- Dữ liệu tương tác khác: ghi rõ từng trường nghĩa là gì và liên quan nhiệm vụ nào.

**File/link:** [Điền]

**Sheet/mục/dòng để tra:** [Điền]

**Cách nối mã người với phiên bản/phần đã xem hoặc dùng:** [Điền]

Không cần chép lại nếu file đã đủ thông tin. Nếu chưa có file, có thể ghi theo bảng dưới đây, lặp theo dữ liệu thật:

| Mã người | Vòng thử/phiên bản/thời điểm nếu đã ghi | Đã xem/dùng phần nào? | Câu hỏi hoặc nhiệm vụ | Câu trả lời/điều quan sát đã ghi | Ghi lúc thử hay ghi lại sau? |
|---|---|---|---|---|---|
| [Điền] | [Điền] | [Điền] | [Điền] | [Điền đúng dữ liệu] | [Điền] |

Giữ cả phản hồi tốt và chưa tốt. Không chỉ gửi biểu đồ hoặc lời tổng kết. Phần nào chỉ nhớ lại sau thì ghi rõ; phần nào không còn dữ liệu thì giữ là thiếu.

### M14. Sau khi thử, nhóm quyết định gì?

- Chọn một: [Thay đổi một phần / Tiếp tục hướng hiện tại / Chưa quyết định]
- Phản hồi hoặc kết quả nào dẫn tới quyết định? [Ghi mã người/bản ghi/kết quả]
- Giữ phần nào? Vì sao? [Điền]
- Sửa phần nào? Vì sao? Nếu không sửa thì ghi rõ. [Điền]
- Đã thực hiện hay mới dự định? Thuộc phiên bản nào? [Điền]
- Những phần BMC nào bị ảnh hưởng; nhóm đổi hoặc giữ chúng vì sao? [Điền hoặc dẫn Bxx]
- Nếu chưa quyết định: còn cần biết điều gì trước khi chọn? [Điền]

## PHẦN 2 — BMC: MÔ HÌNH KINH DOANH HIỆN TẠI

Không cần gom vào một trang. Không cần lặp nội dung MVP; có thể ghi “xem Mxx” và bổ sung phần còn thiếu. Mỗi block ghi rõ đâu là dữ liệu đã có, đâu là giả định hoặc dự định.

### B01. Phân khúc khách hàng — phục vụ ai trước?

- Người dùng đầu tiên và bối cảnh/hành vi: [Điền hoặc dẫn M01]
- Ai quyết định mua? Ai trả tiền? Nếu nhiều bên, tách từng vai trò: [Điền]
- Vì sao chọn nhóm này trước, tiếp cận ở đâu, dữ liệu/giả định nào hỗ trợ? [Điền]

### B02. Giá trị cung cấp — mỗi bên nhận gì?

- Giá trị cụ thể cho người dùng, so với cách đang làm: [Điền hoặc dẫn M03/M09]
- Giá trị/động lực của người trả tiền hoặc bên khác nếu có: [Điền]
- Cơ chế tạo giá trị; phần đã có dữ liệu và phần còn giả định: [Điền hoặc dẫn M12/M13]

### B03. Kênh — làm sao họ biết, thử, mua và nhận giá trị?

- Kênh cho từng bước liên quan trong giai đoạn hiện tại: [Điền]
- Ai vận hành; đã dùng hay dự định dùng? [Điền]
- Vì sao chọn kênh đó; dữ liệu/giả định nào hỗ trợ? [Điền]

### B04. Quan hệ khách hàng — làm sao hỗ trợ và duy trì?

- Cách bắt đầu dùng, được hỗ trợ, phản hồi và quay lại nếu có: [Điền]
- Ai phụ trách và cần công sức/công cụ gì? [Điền hoặc dẫn M10]
- Vì sao phù hợp với nhóm khách và dạng giao dịch? Phần nào đã làm/phần nào dự kiến? [Điền]

### B05. Dòng doanh thu — tiền đến từ đâu?

- Ai trả, trả cho gì, theo gói/đơn vị/tần suất nào? [Điền hoặc dẫn M07/M08]
- Giá áp dụng và điều kiện: [Điền]
- Khoản nào đã thu, khoản nào mới dự báo/giả định? Nếu thu hộ, nhóm thực nhận phần nào? [Điền]
- Vì sao tin bên này sẽ trả; dữ liệu/giả định ở đâu? [Điền]

### B06. Nguồn lực chính — cần gì để làm được?

- Nguồn lực quan trọng và công việc chúng phục vụ: [Điền]
- Nguồn nào đã có, nguồn nào cần mua/thuê/được cấp quyền? Ai phụ trách? [Điền]
- Phụ thuộc hoặc điều kiện tiếp cận còn chưa chắc: [Điền]

### B07. Hoạt động chính — ai phải làm việc gì?

- Những việc chính để tạo, giao và duy trì giá trị: [Điền]
- Ai làm; phần nào làm tay; cần đầu vào gì và tạo kết quả gì? [Điền]
- Khối lượng/thời gian nếu đã biết; việc đã làm hay dự kiến: [Điền]

### B08. Đối tác chính — cần bên nào cùng thực hiện?

- Bên cần phối hợp và đóng góp cụ thể: [Điền]
- Vì sao họ tham gia? Đã đồng ý, mới tiếp cận hay chỉ dự kiến? [Điền]
- Nếu chưa có họ thì phần nào bị ảnh hưởng? [Điền]
- Nếu không cần đối tác chính ở giai đoạn này, giải thích vì sao: [Điền]

### B09. Cơ cấu chi phí — tốn tiền và công ở đâu?

| Khoản chi/công việc | Cho hoạt động/nguồn lực nào? | Số tiền hoặc thời gian; theo đơn vị/thời kỳ nào? | Đã phát sinh, ước tính hay chưa biết? | Căn cứ/cách tính |
|---|---|---|---|---|
| [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |

- Khoản tăng theo mỗi lượt/người/gói và khoản tương đối cố định: [Điền nếu xác định được]
- Công việc thành viên đang làm không nhận tiền: [Điền; không cần tự bịa mức lương]
- Khoản quan trọng chưa ước tính được và vì sao: [Điền]
- Nếu nhóm kết luận có lợi nhuận hoặc rẻ hơn, phép tính và dữ liệu cùng đơn vị nằm ở: [Điền; chưa kết luận thì ghi rõ]

## Kiểm tra trước khi nhóm nộp

1. Đã tách việc đã làm, đang làm tay/mô phỏng và dự định chưa?
2. Có giải thích vì sao chọn MVP, tính năng lõi, cách thử và giá chưa?
3. Có nối kết quả test với dữ liệu từng người và đúng phiên bản chưa?
4. Có ghi phản hồi chưa tốt và điều chưa biết chưa?
5. Mức giá, người trả tiền, gói nhận và đơn vị doanh thu có khớp nhau chưa?
6. Công việc/nguồn lực để giao giá trị đã có trong hoạt động và chi phí chưa?
7. Quyết định sau test có căn cứ và nói rõ đã sửa hay mới dự định chưa?

Nhóm chưa có nội dung nào thì giữ đúng là chưa có. Mẫu này giúp nhận ra phần còn thiếu; không yêu cầu làm cho câu trả lời trông hoàn chỉnh hơn dữ liệu thực tế.
