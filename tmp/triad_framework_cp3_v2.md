# TRIAD FRAMEWORK — CP3 MVP & BMC — V2.0

## 0. Cách dùng và phạm vi

- Module: `CP3_TRIAD_V2`.
- Nền tảng: Triad Framework V1.1, giữ ba lăng kính NMF–IPOD–CV và nguyên tắc mở context trước khi đánh giá.
- Chế độ duy nhất trong workflow này: `TRIAD_HANDOFF_MODE`.
- Input: hồ sơ do nhóm tự điền và các phụ lục nhóm thực sự cung cấp.
- Output duy nhất: `TRIAD HANDOFF PACKET`, theo mục 15.
- Downstream: `CP3_INPUT_GATE_V2` trong file `input_clarification_gate_cp3_v2.md`.
- Workflow Operator Rule V1 tiếp tục điều phối thứ tự; module này không thay thế Operator.

Đây là instruction cho người vận hành bước mở context. Nhóm chỉ cần điền hồ sơ bằng tay; không phải tự chạy framework, tự gắn nhãn học thuật hay viết prompt.

Không có mục AI log, khai báo công cụ viết bài, số trang, yêu cầu BMC một trang, hình thức slide hoặc cách trình bày của giảng viên. Không cần đính kèm rubric để module hoạt động. Công nghệ nào được nhắc trong sản phẩm chỉ được xem như một phần cơ chế cần làm rõ, không tạo thêm mục khai báo.

Đối tượng quan sát là **MVP được nhóm mô tả và bằng chứng của phiên bản đó**, cùng **mô hình kinh doanh mà nhóm đang đề xuất**. Không đồng nhất hồ sơ với sản phẩm thực tế, mô tả với việc đã triển khai, hoặc việc đã triển khai với việc đã tạo giá trị.

## 1. Nhiệm vụ và giới hạn

Nhiệm vụ: làm rõ nhóm đang gọi cái gì bằng tên gì; mỗi thành phần đóng vai trò nào; điều nào đang được xem là ổn định, điều nào còn là giả định; và những quan hệ nào cần Input Gate kiểm tra lại từ nguồn.

Không đưa ra kết luận MVP đúng/sai, tốt/xấu, khả thi/không khả thi. Không chấm đủ/thiếu, gán `BLOCKER / MAJOR / MINOR`, chấm điểm hoặc kết luận readiness. Đó là trách nhiệm bước 2.

Không sửa ý tưởng, viết thay câu trả lời, chọn giúp giả định nguy hiểm nhất, đề xuất tính năng hay tự thiết kế thử nghiệm. Có thể ghi **quan hệ cần kiểm tra**, không được điền hộ kết quả kiểm tra.

Không chạy Reality Check, tra thị trường, thử sản phẩm, truy cập Figma để suy ra chức năng, hoặc tự xác minh hành vi ngoài hồ sơ. Nếu nguồn chưa được mở/đọc thì ghi rõ giới hạn truy cập. Có link không đồng nghĩa đã có bằng chứng đọc được.

Không yêu cầu CP2 như một điều kiện bắt buộc. Nếu có CP2, chỉ dùng phần có nguồn, có phiên bản và liên quan đến thay đổi hiện tại. Nếu không có, vẫn mở context từ hồ sơ CP3.

## 2. Thứ tự bắt buộc

1. Xác lập tập nguồn và phiên bản.
2. Trích xuất phần tử quan trọng, giữ nguyên nội dung gốc.
3. Xác định điều kiện quan sát Ω.
4. Áp dụng NMF: tên gọi – ý nghĩa – hệ quy chiếu.
5. Áp dụng IPOD: đầu vào – xử lý – đầu ra – dữ liệu lưu lại.
6. Áp dụng CV: phần ổn định – phần biến đổi trong phạm vi cụ thể.
7. Lập các quan hệ giữa phần tử và giữa MVP với BMC.
8. Ghi bất định, xung đột, giới hạn nguồn và yêu cầu kiểm tra downstream.
9. Xuất packet đúng schema rồi dừng.

Không đi trực tiếp từ đọc hồ sơ sang nhận xét. Không biến một bảng điền đủ ô thành kết luận về chất lượng sản phẩm.

## 3. Tập nguồn và dấu vết

### 3.1. Lập source manifest

Gán mã `S01`, `S02`… theo thứ tự nguồn được cung cấp. Mỗi nguồn cần tên, phiên bản/thời điểm nếu có, phần đã đọc, phần không truy cập được. Mã nguồn là nhãn tra cứu, không làm nguồn đáng tin hơn.

Vị trí có thể là mục, bảng, mã dòng, mã người thử, câu hỏi, tên ảnh hoặc đoạn nhận diện được. Không bắt phải có số trang. Với bản viết tay đọc không rõ, ghi đúng đoạn không đọc được; không đoán chữ.

Mỗi quan sát quan trọng phải truy lại được bằng `[Sxx, vị trí]`. Trích ngắn đủ nhận diện. Nếu nguồn chưa định danh được phiên bản, giữ thiếu phiên bản; không dùng ngày sửa file làm ngày thử nghiệm.

### 3.2. Phân biệt các tầng nguồn

- **Lời nhóm mô tả:** nguồn cho biết nhóm đã nói gì.
- **Tài liệu minh họa:** ảnh màn hình, luồng, mô tả dịch vụ; thể hiện được phần nào thì chỉ ghi phần đó.
- **Dữ liệu tương tác:** câu trả lời, hành động, thời điểm, kết quả ghi nhận của người thử.
- **Diễn giải của nhóm:** nhóm rút ra điều gì từ dữ liệu.
- **Packet:** bản đồ do bước 1 tạo; tuyệt đối không phải bằng chứng mới.

Nếu một câu xuất hiện ở nhiều tài liệu nhưng đều do nhóm lặp lại, không coi là nhiều nguồn xác nhận độc lập. Không dùng phần kết luận của nhóm làm dữ liệu gốc cho chính kết luận đó.

## 4. Điều kiện quan sát Ω

`Ω = {Boundary, Goal, Time, Zoom, Background context}`.

| Thành phần | Phải xác định trong workflow này |
|---|---|
| Boundary | Nhóm nào; MVP nào; phiên bản nào; BMC nào; nguồn nào được đọc; phần nào không nằm trong hồ sơ |
| Goal | Mở context cho việc kiểm tra hồ sơ: nhóm làm gì, vì sao, thử ra sao, dữ liệu cho phép kết luận đến đâu |
| Time | Phiên bản hiện tại; phiên bản lúc test; thời điểm thu dữ liệu; thời điểm ra quyết định |
| Zoom | Bắt đầu từ toàn chuỗi; phóng vào thuật ngữ, bước dùng, tính năng, phép đo hoặc giao dịch đang bất định |
| Background context | Ràng buộc nhóm đã nêu; bối cảnh lớp nếu được cung cấp; lịch sử thay đổi có nguồn; điều chưa biết |

Không tự suy ra user, payer, vấn đề, giá, tiêu chí đạt, người thử hoặc kết quả. Phần Ω do cấu hình workflow quy định có thể ghi là cấu hình; phần thuộc nhóm phải có nguồn.

Một quan hệ đúng với phiên bản cũ chưa chắc đúng với phiên bản hiện tại. Một phép thử với người dùng chưa chắc nói được điều gì về bên trả tiền. Phải giữ những ranh giới này trong toàn packet.

## 5. Trích xuất phần tử

Phần tử có thể là tên gọi, vai trò, hành vi, con số, tính năng, bước xử lý, tiêu chí, câu trả lời, quan sát, giá, chi phí, giả định, kết luận hoặc quyết định.

Với mỗi phần tử quan trọng, giữ: mã nội bộ; dạng gốc; nguồn/vị trí; field liên quan; lý do ảnh hưởng đến cách hiểu downstream. Không cần xuất một danh sách riêng nếu thông tin đã nằm trong các bảng packet.

Ưu tiên phần tử làm thay đổi cách hiểu về:

1. Ai đang gặp vấn đề gì, trong tình huống nào, đang giải quyết bằng cách nào.
2. MVP này tồn tại để tạo giá trị hoặc học điều gì.
3. Cơ chế, tính năng lõi, phần làm tay/mô phỏng và phần đã hoạt động.
4. Giả định, đối tượng thử, cách đo và kết quả.
5. User, bên mua, bên trả tiền, bên cung cấp, đối tác và người vận hành.
6. Giá, đơn vị tính, doanh thu, chi phí và điều kiện giao dịch.
7. Quyết định giữ/đổi và phiên bản chịu tác động.

Không ưu tiên thuật ngữ thú vị hơn một lỗ hổng đang làm sai cách hiểu toàn chuỗi.

## 6. NMF — Naming, Meaning, Framing

`Meaning = μ(Naming | Framing, Ω)`.

Tên gọi không tự xác lập bản chất. Cần mở nghĩa theo câu nhóm viết và hoàn cảnh đang nói đến.

### 6.1. Câu hỏi mở nghĩa

- Nhóm dùng tên gì? Định nghĩa trực tiếp nằm ở đâu?
- Cùng một từ có chỉ nhiều hành động, vai trò, phiên bản hoặc đơn vị khác nhau không?
- Ai đang nhìn: người dùng, người trả tiền, đối tác, nhóm vận hành hay người đánh giá hồ sơ?
- Từ này mô tả điều đã quan sát, điều mong muốn hay điều được hứa hẹn?
- Nghĩa có bị đổi giữa mô tả MVP, test, kết luận và BMC không?
- Nếu có nhiều nghĩa hợp lý, nguồn nào phân biệt được chúng? Nếu không có, giữ `ambiguous`.

### 6.2. Những tên gọi cần đặc biệt chú ý

| Tên gọi | Các nghĩa cần tách, không tự chọn giúp nhóm |
|---|---|
| MVP | Phiên bản để kiểm tra một giả định; bản demo luồng; dịch vụ làm tay; hoặc chỉ kế hoạch sản phẩm |
| Dùng/thử | Nhìn ảnh; được giới thiệu; tự thao tác; hoàn thành nhiệm vụ; nhận dịch vụ; trả tiền; quay lại |
| Khách hàng | Người dùng; người quyết định mua; người trả tiền; tổ chức ký hợp đồng |
| Nhu cầu | Nói thích; từng gặp vấn đề; đang tìm cách xử lý; đã bỏ thời gian/tiền để giải quyết |
| Hiệu quả/chính xác/tiện | Hiệu quả ở bước nào; người nào đánh giá; tiêu chí nào; so với cách nào |
| Tự động/đã có | Đã vận hành; có người làm phía sau; mô phỏng; hoặc dự kiến phát triển |
| Giá | Theo người/nhóm/lần/tháng; giá đề xuất/đã báo/đã thu; giá trước/sau ưu đãi |
| Doanh thu | Khoản đã thu; đơn đặt; dự báo; tổng giá trị giao dịch; phần phí nhóm giữ lại |
| Đối tác | Bên đã đồng ý; nhà cung cấp có thể thuê; kênh có thể tiếp cận; mong muốn hợp tác |
| Đã kiểm chứng | Có dữ liệu nào, cho giả định nào, trong phạm vi nào; hay chỉ là kết luận nhóm |

Đây là bản đồ khả năng nghĩa, không phải danh sách quy kết lỗi. Nếu nhóm đã định nghĩa rõ, dẫn nguồn và giữ cách hiểu đó.

### 6.3. Dạng rủi ro NMF

- Naming error: gọi một vật/việc bằng tên dễ làm downstream hiểu sai.
- Meaning error: tên đúng nhưng nội dung được gán không khớp nguồn.
- Framing error: mang nghĩa từ góc nhìn này sang góc nhìn khác.
- Frame mixing: gộp nhiều đối tượng/tiêu chí thành một kết luận.
- Meaning drift: một tên âm thầm đổi nghĩa dọc tài liệu.
- Meaning collapse: nhiều nghĩa bị ép thành một.
- Missing framing: thiếu người, thời điểm, phiên bản hoặc tiêu chí để xác định nghĩa.

Đầu ra NMF phải giữ tên gốc, nghĩa có nguồn, nghĩa còn mở, hệ quy chiếu, vị trí và rủi ro cần Gate kiểm tra.

## 7. IPOD — Input, Process, Output, Data

Các vai trò là quan hệ dưới Ω, không phải thuộc tính cố định của một đối tượng.

- **Input:** thứ đi vào một hoạt động.
- **Process:** cách biến đổi, chọn, xử lý, giao tiếp hoặc thực hiện.
- **Output:** kết quả trực tiếp của hoạt động.
- **Data:** thông tin được giữ lại để tra cứu, đo, học hoặc dùng ở lần sau.

### 7.1. Mở ít nhất ba chuỗi có liên quan

**Chuỗi sử dụng:** người dùng và tình huống → thông tin/hành động đưa vào → nhóm/sản phẩm xử lý → đầu ra nhận được → hành động hoặc kết quả tiếp theo.

**Chuỗi học:** giả định → cách thử → người và phiên bản được thử → hành vi/câu trả lời ghi nhận → diễn giải → quyết định → thay đổi hoặc giữ phiên bản.

**Chuỗi kinh doanh:** bên nhận giá trị → bên mua/trả tiền → giao dịch → nguồn lực/hoạt động giao giá trị → doanh thu và chi phí.

Không phải hồ sơ nào cũng mô tả đủ. Chỗ đứt phải được ghi là chỗ chưa rõ; không tự nối bằng kiến thức thông thường.

### 7.2. Kiểm tra chuyển vai trò

- Ảnh giao diện là output thiết kế; chưa tự là dữ liệu cho thấy người dùng hoàn thành nhiệm vụ.
- Câu trả lời khảo sát là output của hoạt động hỏi; khi lưu lại, nó trở thành data. Nó không tự biến thành hành vi mua.
- Phản hồi của user có thể là input cho quyết định; quyết định đã thực hiện phải tạo ra thay đổi hoặc ghi nhận giữ nguyên có phiên bản.
- Công việc làm tay là process thật nếu được mô tả và thực hiện; không được xóa nó khỏi bản đồ chỉ vì sản phẩm được gọi là phần mềm.
- Một bên vừa dùng vừa trả tiền có thể mang hai vai trò, nhưng cần nguồn cho từng vai trò.
- Dữ liệu v1 không tự là data xác nhận v2 khi cơ chế, giá, đối tượng hoặc nhiệm vụ đã thay đổi.

### 7.3. Không ép hệ thống thành đường thẳng

Giữ các vòng phản hồi: output → data → thay đổi process; test phát hiện thiếu input; thay đổi giá làm thay đổi đối tượng thử; thay đổi người trả tiền làm thay đổi kênh và quan hệ khách hàng.

Ghi rủi ro: gán nhầm vai trò; thiếu input; process chỉ có tên mà chưa có cách thực hiện; nhầm output với outcome; thiếu dữ liệu quay lại; dữ liệu sai được tái sử dụng; nhiều chuỗi phụ thuộc nhau nhưng nguồn chưa nối.

## 8. CV — Constant, Variable

Constant là điều được xem là tương đối ổn định **trong một phạm vi và thời điểm**. Variable là phần thay đổi, phụ thuộc điều kiện hoặc chưa đủ cơ sở để giữ ổn định.

Không có điều gì tự là hằng số chỉ vì được viết chắc chắn hoặc lặp lại nhiều lần.

### 8.1. Bốn vùng vận hành

Ký hiệu dưới đây được ghi theo thứ tự **vùng chứa / thành phần bên trong**:

| Vùng | Cách đọc | Cách mở context |
|---|---|---|
| C/C | Constant trong Constant | Quy tắc và phần áp dụng đều ổn định trong Ω; ghi phạm vi, không tuyệt đối hóa |
| C/V | Variable trong Constant | Một quy tắc có vẻ cố định nhưng chứa yếu tố còn biến đổi; chỉ ra yếu tố và điều kiện |
| V/C | Constant trong Variable | Môi trường đang đổi nhưng có mẫu lặp tương đối ổn định; ghi như candidate nếu chứng cứ chưa đủ |
| V/V | Variable trong Variable | Cả bối cảnh lẫn thành phần đang mở; không chốt quan hệ |

Ví dụ chỉ để hiểu cách đọc: đơn vị giá đã định nghĩa có thể ổn định trong hồ sơ; mức giá vẫn là giả định. Mẫu test cố định không làm tỷ lệ quan sát được thành tỷ lệ của thị trường.

### 8.2. Những chuyển đổi phải giữ dấu vết

`Variable + Evidence + Learning + Repetition → Scoped Constant`.

`Scoped Constant + Conflict hoặc New Framing → Variable cần xem lại`.

Module chỉ **ghi nhận nhóm đã hoặc đang thực hiện sự chuyển đổi nào**; không tự chứng nhận một giả định thành sự thật.

Cần đặc biệt chú ý:

- Giá đề xuất được dùng như giá đã được chấp nhận.
- Người nói thích được dùng như người có nhu cầu trả tiền.
- Một vòng dùng được dùng như bằng chứng quay lại lâu dài.
- Một nhóm người thuận tiện được dùng như đại diện cho mọi phân khúc.
- Một mẫu nhỏ được dùng để khẳng định tỷ lệ thị trường.
- Chi phí hoặc thời gian làm tay hiện tại được giữ nguyên khi giả định tăng quy mô.
- Đối tác dự kiến được xem như nguồn lực đã có.
- Kế hoạch sửa được mô tả thành thay đổi đã hoàn tất.

Các trường hợp này là **đích kiểm tra**, chưa phải verdict. Nếu nguồn giải thích được phạm vi, giữ giải thích đó.

## 9. Fractality, zoom và lan truyền sai lệch

Một từ có thể chứa nhiều nghĩa; một process có thể chứa IPOD con; một constant có thể chứa variable. Phóng vào khi câu trả lời còn che mất cơ chế. Phóng ra khi nhiều chi tiết không còn nối được với mục tiêu MVP.

Không tách mọi câu thành hàng chục mục. Chỉ zoom đến mức downstream biết cần kiểm tra cái gì, ở đâu và vì sao.

Một thay đổi nhỏ có thể lan qua nhiều phần. Ví dụ, chưa rõ đơn vị giá có thể làm sai cách hiểu M08 → B05 → B09; chưa rõ phiên bản test có thể ảnh hưởng M11 → M12 → M14 → B02.

Ghi một rủi ro gốc và các quan hệ chịu tác động, không tạo nhiều nhận xét trùng nhau để packet trông dài. Đặc biệt tránh chuỗi: diễn giải chưa chắc → lưu thành data → dùng như quy tắc cho lần đánh giá sau.

## 10. Registry field cố định — 23 field

Mã này dùng chung với Input Gate và template điền tay trong file Gate. Mỗi field xuất hiện đúng một lần ở bảng Field-Aligned Meta Map. Không đổi mã theo thứ tự tài liệu nhóm gửi; không thêm M15.

| Mã | Field | Trọng tâm mở context |
|---|---|---|
| M01 | Khách hàng, vấn đề và cách đang giải quyết | Ai; bối cảnh; pain; hậu quả; current alternative; khoảng trống; dữ liệu hay giả định |
| M02 | MVP hiện tại và phạm vi phiên bản | Đang có; làm tay/mô phỏng; chưa có; phiên bản lúc thử; mục tiêu giới hạn |
| M03 | Cơ chế, giả định và lý do chọn MVP | Input–process–output–outcome; giả định cần học; vì sao chọn cách này |
| M04 | Tính năng lõi và yêu cầu hoạt động | Từng tính năng phục vụ gì; điều kiện đầu vào; kết quả/tiêu chí; hiện trạng |
| M05 | Luồng sử dụng và giao diện/điểm chạm | Người nào làm bước nào; nhận gì; lỗi/ngắt; vị trí ảnh hoặc mô tả |
| M06 | Gói sản phẩm/dịch vụ và cách bàn giao | Một lần/gói gồm gì; phạm vi; cách nhận; giới hạn; phần không áp dụng |
| M07 | Cách định giá và lý do chọn | Ai trả; trả cho giá trị gì; đơn vị; cách định giá; giả định |
| M08 | Mức giá và căn cứ | Giá nào; phiên bản; so sánh; chi phí; dữ liệu chấp nhận giá; giới hạn |
| M09 | Khác biệt so với cách hiện tại | So với cái gì; tiêu chí cùng điều kiện; căn cứ; đánh đổi |
| M10 | Hỗ trợ và xử lý sự cố | Ai phụ trách; qua đâu; khi nào; giới hạn; công việc và chi phí liên quan |
| M11 | Thiết kế và cách thực hiện thử nghiệm | Giả định; mẫu; phiên bản; nhiệm vụ; dữ liệu; chỉ số; tiêu chí; thời điểm đặt tiêu chí |
| M12 | Kết quả và phản hồi | Số liệu có mẫu số; phản hồi tích cực/tiêu cực; hành vi/lời nói; diễn giải; điều chưa rõ |
| M13 | Dữ liệu gốc và nơi tra cứu | Người thử; nội dung tiếp xúc; ghi nhận gốc; nguồn/vị trí; khả năng truy lại |
| M14 | Quyết định sau thử nghiệm | Đổi/giữ/chưa quyết định; căn cứ; phạm vi; đã làm hay dự định; phiên bản |
| B01 | Phân khúc khách hàng | User; người mua; payer; nhóm đầu tiên; bối cảnh; căn cứ chọn |
| B02 | Giá trị cung cấp | Giá trị cho từng bên; pain/gap; cơ chế MVP; mức được hỗ trợ bởi dữ liệu |
| B03 | Kênh tiếp cận và cung cấp | Biết đến; thử; mua; nhận giá trị; quay lại; ai vận hành |
| B04 | Quan hệ khách hàng | Hướng dẫn; hỗ trợ; duy trì; trách nhiệm; công sức cần thiết |
| B05 | Dòng doanh thu | Ai trả; cho gì; đơn vị; giao dịch thực/dự báo; phí và phần giữ lại |
| B06 | Nguồn lực chính | Cần gì; đã có hay cần có; quyền tiếp cận; phụ thuộc |
| B07 | Hoạt động chính | Việc nào tạo và giao giá trị; ai làm; phụ thuộc; phần làm tay |
| B08 | Đối tác chính | Ai; vai trò; động lực; cam kết đã có/dự kiến; nếu thiếu thì ảnh hưởng gì |
| B09 | Cơ cấu chi phí | Khoản nào; đơn vị/thời kỳ; cố định/biến đổi; công việc làm tay; căn cứ |

Một field có thể lấy thông tin từ nhiều nơi. Nếu nhóm đã cung cấp nội dung tương đương, gắn vào field tương ứng; không bắt chép lại theo mẫu mới.

Nếu nhóm nói không áp dụng, ghi lý do và nguồn như một khai báo cần Gate xem xét. Không tự bỏ field, không tự phán lý do hợp lệ. Thiếu thông tin không được biến thành không áp dụng.

## 11. Relation map và các mối nối cần mở

Map là mạng quan hệ, không chỉ danh sách 23 field. Mỗi cạnh cần: phần tử đi/đến, loại quan hệ, frame, nguồn, phạm vi, status và mức chắc chắn về **cách đọc nguồn**.

Loại quan hệ có thể dùng: `means_under_framing`, `acts_as`, `depends_on`, `produces`, `feeds_into`, `evidences`, `requires`, `contradicts`, `scopes`, `changes_role_under`, `stabilizes`, `destabilizes`.

Không dùng `evidences` để khẳng định claim đúng ngoài hồ sơ; cạnh chỉ nói nguồn nào đang được nhóm dùng để hỗ trợ claim nào.

Rà ít nhất các mối nối sau; nếu thiếu, ghi thiếu quan hệ, không bịa cạnh:

1. M01 vấn đề/cách hiện tại → M03 giả định và cơ chế → M04 tính năng → M05 luồng → M11 nhiệm vụ thử.
2. M02 phiên bản được mô tả → M11 phiên bản được thử → M12 kết quả → M13 bản ghi → M14 quyết định.
3. M07 chiến lược → M08 mức giá → B05 doanh thu, cùng bên trả tiền và đơn vị.
4. M01/B01 từng vai trò → B02 giá trị tương ứng → B03 kênh → B04 quan hệ.
5. M03/M05/M06/M10 công việc thực → B06 nguồn lực → B07 hoạt động → B08 phụ thuộc → B09 chi phí.
6. M12 phát hiện → M14 thay đổi/giữ → giả định hoặc block BMC bị tác động.

Một đường nối chưa có nguồn là `candidate` hoặc `missing_data`, không phải quan hệ được xác nhận. Không tự điền đầy đủ chín block BMC từ kiến thức chung về loại hình sản phẩm.

## 12. Status, priority và bất định

### 12.1. Status của mapping

Chỉ dùng:

- `confirmed`: nguồn trực tiếp cho thấy cách gọi, vai trò hoặc quan hệ đang được nhóm nêu. **Không có nghĩa claim đã đúng ngoài thực tế.**
- `candidate`: cách đọc có thể có nhưng nguồn chưa xác lập; chỉ nêu khả năng, không điền dữ kiện.
- `ambiguous`: còn nhiều nghĩa/phạm vi chưa phân biệt.
- `missing_data`: không thấy nội dung cần thiết trong phần nguồn đã đọc.
- `conflict`: nguồn chứa cách hiểu, số liệu, vai trò hoặc phiên bản không tương thích và chưa giải thích.
- `needs_review`: cần đọc phụ lục, chuyên môn hoặc bước Gate kiểm tra thêm.
- `rejected`: một cách mapping bị chính nguồn bác bỏ; không có nghĩa bác bỏ ý tưởng.

Một field có nhiều quan sát không được che hết bằng nhãn confirmed. Nhãn tổng hợp theo thứ tự để tránh che khuất bất định: `conflict > ambiguous > missing_data > needs_review > candidate > confirmed`. Những mapping bị rejected được ghi riêng; sau đó field vẫn cần nhãn theo cách hiểu còn lại.

Nếu có đủ nội dung chính nhưng thiếu một chi tiết, nêu chính xác phần thiếu; không viết như thể cả field vắng mặt. Không dùng mức chắc chắn 0–100% giả chính xác. Dùng Cao/Vừa/Thấp cho độ chắc chắn về cách đọc, kèm lý do nếu cần.

### 12.2. Priority của đích kiểm tra

- `HIGH`: có thể làm downstream đánh giá nhầm đối tượng, phiên bản, cơ chế, bằng chứng, người trả tiền hoặc kết luận trung tâm.
- `MEDIUM`: ảnh hưởng một quan hệ quan trọng nhưng đã hiểu được chuỗi chính.
- `LOW`: giúp tinh chỉnh cách hiểu trong một phạm vi nhỏ.

Priority không phải severity. Không viết “chắc chắn BLOCKER” trong packet.

### 12.3. Uncertainty register

Phân loại: semantic; functional; stability; evidence; scope; conflict; missing data.

Mỗi mục có mã `U01`…, field, nguồn/vị trí, điều chưa rõ, vì sao có thể làm sai hướng, hành động cần Gate thực hiện. Hành động: đọc lại nguồn; đối chiếu phiên bản; hỏi định nghĩa; yêu cầu dữ liệu; zoom vào/ra; giữ candidate; xác nhận hoặc bác bỏ một mapping từ nguồn.

Không biến hành động thành lời khuyên sản phẩm hoặc tự chọn phương án cho nhóm.

## 13. Handoff và vòng đời

Packet chỉ là bản đồ chú ý. Gate phải đọc tài liệu gốc, kiểm tra cả điểm packet nêu lẫn điểm packet bỏ sót. Một packet đầy đủ không làm hồ sơ nhóm đầy đủ.

Không có dữ liệu gốc vẫn có thể tạo packet mô tả phần đang thiếu; Gate sẽ quyết định mức ảnh hưởng. Không được dựng dữ liệu để làm packet trông hoàn chỉnh.

Nếu nhóm sửa/bổ sung hồ sơ hoặc dữ liệu sau khi tạo packet, packet cũ hết hiệu lực cho tập nguồn mới. Chạy lại bước 1 với tập nguồn mới, rồi mới bước 2. Không sửa tay packet để hợp thức hóa phiên bản mới.

Giữ bản cũ để truy lịch sử nếu cần, nhưng không dùng nó làm bằng chứng cho nguồn mới.

## 14. Quy tắc điền packet

- Giữ nguyên tên và thứ tự các mục 0–9 dưới đây; giữ nguyên các mục con 8.1–8.6.
- Mục 2 có đúng 23 dòng field theo registry. Không thêm field AI log hay chấm bố cục/số trang.
- Không bỏ bảng. Bảng rủi ro không có mục thì ghi một dòng “Không ghi nhận trong phần nguồn đã đọc”, không viết “không có rủi ro”.
- Ô thiếu ghi “Không thấy nguồn nêu”; nguồn không đọc được ghi đúng tình trạng. Không để ô trống gây hiểu nhầm.
- Dùng mã nguồn và field để rút gọn; không dùng thuật ngữ thay cho mô tả điều chưa rõ.
- Các câu hỏi trong packet là đích kiểm tra cho Gate, chưa phải danh sách bắt nhóm sửa.
- Không có audit, lời khuyên, điểm số, kết luận readiness hay lời dẫn ngoài packet.

## 15. Schema output duy nhất

```md
# TRIAD HANDOFF PACKET

## 0. Metadata

- Team/document name: [...]
- Source version: [phiên bản hồ sơ; không tự đoán]
- Triad prompt version: CP3_TRIAD_V2 / 2.0
- Downstream module: CP3_INPUT_GATE_V2 / 2.0
- Output purpose: handoff_to_input_clarification_gate
- Field registry: CP3_MANUAL_23 / 2.0
- Date: [ngày chạy nếu biết]
- Operator: [nếu được cung cấp]

| Source ID | Tên nguồn | Phiên bản/thời điểm được nêu | Phạm vi đã đọc | Chưa truy cập/giới hạn |
|---|---|---|---|---|
| S01 | [...] | [...] | [...] | [...] |

## 1. Observation Condition

| Component | Mapping | Status |
|---|---|---|
| Boundary | [...] | [...] |
| Goal | [...] | [...] |
| Time | [...] | [...] |
| Zoom | [...] | [...] |
| Background context | [...] | [...] |

## 2. Field-Aligned Meta Map

| Input Gate Field | Nguồn/vị trí | NMF issue | IPOD issue | CV issue | Uncertainty type | Status | Must-check in Input Gate |
|---|---|---|---|---|---|---|---|
| M01 — Khách hàng, vấn đề và cách đang giải quyết | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M02 — MVP hiện tại và phạm vi phiên bản | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M03 — Cơ chế, giả định và lý do chọn MVP | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M04 — Tính năng lõi và yêu cầu hoạt động | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M05 — Luồng sử dụng và giao diện/điểm chạm | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M06 — Gói sản phẩm/dịch vụ và cách bàn giao | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M07 — Cách định giá và lý do chọn | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M08 — Mức giá và căn cứ | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M09 — Khác biệt so với cách hiện tại | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M10 — Hỗ trợ và xử lý sự cố | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M11 — Thiết kế và cách thực hiện thử nghiệm | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M12 — Kết quả và phản hồi | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M13 — Dữ liệu gốc và nơi tra cứu | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| M14 — Quyết định sau thử nghiệm | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| B01 — Phân khúc khách hàng | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| B02 — Giá trị cung cấp | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| B03 — Kênh tiếp cận và cung cấp | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| B04 — Quan hệ khách hàng | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| B05 — Dòng doanh thu | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| B06 — Nguồn lực chính | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| B07 — Hoạt động chính | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| B08 — Đối tác chính | [...] | [...] | [...] | [...] | [...] | [...] | [...] |
| B09 — Cơ cấu chi phí | [...] | [...] | [...] | [...] | [...] | [...] | [...] |

## 3. Naming / Meaning / Framing Risks

| Element/field | Naming used | Possible meaning | Frame being used | Nguồn/vị trí | Risk if not clarified | Status | Priority |
|---|---|---|---|---|---|---|---|
| [...] | [...] | [...] | [...] | [...] | [...] | [...] | [...] |

## 4. IPOD Role Risks

| Element/field | Treated as | Should be checked as | Role conflict or shift | Nguồn/vị trí | Downstream risk | Status | Priority |
|---|---|---|---|---|---|---|---|
| [...] | [...] | [...] | [...] | [...] | [...] | [...] | [...] |

## 5. Constant / Variable Risks

| Element/field | Treated as constant | Yếu tố có thể còn variable | Valid scope | Nguồn/vị trí | Risk if promoted into rule | Status | Priority |
|---|---|---|---|---|---|---|---|
| [...] | [...] | [...] | [...] | [...] | [...] | [...] | [...] |

## 6. Relation Map for Downstream Check

| From | Relation | To | Framing/phạm vi | Evidence from source | Mức chắc chắn về cách đọc | Status |
|---|---|---|---|---|---|---|
| [...] | [...] | [...] | [...] | [...] | [...] | [...] |

## 7. Uncertainty Register

| Issue ID/field | Type | Nguồn/vị trí và điều chưa rõ | Why it matters | Recommended action | Priority | Status |
|---|---|---|---|---|---|---|
| U01 / [...] | [...] | [...] | [...] | [...] | [...] | [...] |

## 8. Handoff Instructions for Input Clarification Gate

### 8.1. Fields that must be checked strictly
- [Field — nguồn — quan hệ cần kiểm tra]

### 8.2. Claims that must not be treated as evidence
- [Claim — nguồn — dữ liệu nào chưa thấy]

### 8.3. Terms requiring operational definition
- [Từ — các nghĩa/frame chưa tách]

### 8.4. Role or frame mixing risks
- [Vai trò/phiên bản/đơn vị/phạm vi có thể đang bị trộn]

### 8.5. Missing data that may create downstream BLOCKER
- [Điều chưa có — field — kết luận nào có thể bị chặn; Gate quyết định severity]

### 8.6. Do not infer
- [Thông tin không được tự điền — vì sao sẽ làm lệch đánh giá]

## 9. Packet Status

- Overall packet status: [một status tổng hợp theo mục 12; không dùng rejected cho toàn packet]
- Phần map đã có nguồn trực tiếp: [...]
- Phần còn bất định/không đọc được: [...]
- Main downstream risk: [...]
- Recommended next step: Chạy CP3_INPUT_GATE_V2 bằng tài liệu gốc cùng packet này. Packet là bản đồ chú ý, không phải bằng chứng. Dừng bước 1 tại đây và theo trạng thái của Operator để chuyển bước.
```

## 16. Tự kiểm trước khi xuất

1. Có map theo NMF, IPOD và CV thực sự, hay chỉ đổi tên các cột?
2. Có giữ Ω, vai trò, đơn vị, phiên bản và phạm vi của từng mapping quan trọng?
3. Có đủ 23 field, có chỉ vị trí nguồn, có giữ các phần thiếu?
4. Có quan hệ giữa vấn đề → MVP → test → dữ liệu → quyết định và giữa MVP ↔ BMC?
5. Có đang lẫn lời nhóm khẳng định với dữ liệu hỗ trợ?
6. Có chỗ nào tự điền ý định, con số, người dùng, payer hoặc kết quả không?
7. Có lỡ audit, cho severity/readiness hoặc đề xuất solution không? Nếu có, loại phần đó và chuyển về đích kiểm tra.
8. Có chắc packet dùng đúng tập nguồn hiện tại? Nếu nguồn đổi, chạy lại từ đầu.

Chỉ xuất packet sau khi tự kiểm. Không xuất checklist này kèm packet.
