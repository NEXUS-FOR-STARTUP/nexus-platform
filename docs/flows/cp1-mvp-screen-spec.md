# Screen-by-screen UX spec cho MVP audit CP1

- PRD reference: [`../prd/core-product-prd.md`](../prd/core-product-prd.md)
- Flow references:
  - [`./cp1-audit-end-to-end-flow.md`](./cp1-audit-end-to-end-flow.md)
  - [`./intake-flow.md`](./intake-flow.md)
  - [`./admin-triage-and-assignment-flow.md`](./admin-triage-and-assignment-flow.md)
  - [`./case-lifecycle-flow.md`](./case-lifecycle-flow.md)
- Related requirements:
  - [`../requirements/structured-intake.md`](../requirements/structured-intake.md)
  - [`../requirements/case-workspace-and-status.md`](../requirements/case-workspace-and-status.md)
  - [`../requirements/admin-triage-and-assignment.md`](../requirements/admin-triage-and-assignment.md)
  - [`../requirements/supporter-review-and-report.md`](../requirements/supporter-review-and-report.md)
  - [`../requirements/revision-rounds-and-history.md`](../requirements/revision-rounds-and-history.md)
- Trạng thái: đang làm việc

## 1. Mục tiêu

Biến business flow đã chốt thành một bộ màn hình đủ rõ để implement MVP demo mà không làm Nexus trôi thành portal quản lý hồ sơ.

## 2. Quy tắc UX gốc

- Màn hình khách hàng phải xoay quanh `vấn đề -> hướng sửa -> next action`.
- Màn hình nội bộ mới được ưu tiên `queue -> quyết định -> xử lý`.
- Không làm chat tự do ở phase 1.
- Intake có cảm giác được dẫn từng bước, nhưng dữ liệu vẫn có cấu trúc.
- Report phải đọc được trực tiếp trong case workspace.
- Timeline và file list chỉ là lớp hỗ trợ cho report và hành động tiếp theo.

## 3. Ba lớp màn hình

### Lớp A. Core value flow cho khách hàng

- `A01` Landing
- `A02` Register / Login
- `A03` Empty dashboard
- `A04-A11` Create case wizard
- `A12` Review before submit
- `A13` Case submitted success
- `A14` User case workspace
- `A15` Submit revision

### Lớp B. Ops flow nội bộ

- `B01` Admin triage queue
- `B02` Admin case detail
- `B03` Supporter queue
- `B04` Supporter audit workspace

### Lớp C. Shared surfaces

- status badge
- next action card
- document board
- report block
- timeline
- request-more-info notice
- empty/loading/error states

## 4. Quyết định khóa cho spec này

- Admin reject với lý do rõ (≥ 10 ký tự — reject reason là kênh trao đổi triage); yêu cầu bổ sung do supporter thực hiện sau khi được assign (machine T8).
- Report phase 1 là rich text trong hệ thống, có thể kèm file tải xuống.
- Không có tab chat tự do.
- Payment không nằm trong luồng chính.
- Case workspace là source of truth để user xem report và lịch sử vòng.

## 5. Lớp A: Core value flow cho khách hàng

### A01. Landing

**Mục tiêu**
- Làm rõ Nexus giúp gì.
- Đưa user vào CTA mà không cần hiểu vận hành nội bộ.

**Người dùng**
- khách mới

**Layout**
- hero rõ value
- section `Bạn đang kẹt ở đâu?`
- section `Nexus sẽ giúp thế nào`
- section boundary
- CTA cuối trang

**Khối nội dung**
- headline về `biết yếu ở đâu, sửa gì trước`
- 4-6 tình huống phổ biến
- flow 3 bước ngắn: `Gửi case -> Nhận report -> Gửi bản sửa`
- nhắc ranh giới: không làm thay, không cam kết điểm

**Nút**
- `Bắt đầu gửi case`
- `Đăng nhập`

**Yêu cầu copy**
- không nhấn vào từ `quản lý case`
- không lộ trực diện syllabus nội bộ

### A02. Register / Login

**Mục tiêu**
- cho user vào hệ thống với friction thấp

**Layout**
- form card giữa màn hình
- panel phụ giải thích ngắn user sắp làm gì sau khi đăng nhập

**Register fields**
- họ tên
- email
- mật khẩu
- xác nhận mật khẩu
- checkbox đồng ý điều khoản

**Login fields**
- email
- mật khẩu

**Nút**
- `Tạo tài khoản`
- `Đăng nhập`
- `Đã có tài khoản? Đăng nhập`
- `Chưa có tài khoản? Tạo tài khoản`

**Validation**
- email hợp lệ
- mật khẩu đủ rule tối thiểu
- submit loading rõ

### A03. Empty dashboard

**Mục tiêu**
- không để user rơi vào cảm giác dashboard trống vô nghĩa
- kéo user bắt đầu create case ngay

**Layout**
- header chào mừng ngắn
- empty illustration hoặc empty block
- card giải thích case là gì

**Nội dung chính**
- `Bạn chưa có case nào`
- `Tạo case để nhận phản hồi có cấu trúc cho tài liệu hoặc ý tưởng của nhóm`

**Nút**
- `Tạo case mới`

### A04. Wizard step 1: Tình huống hiện tại

**Mục tiêu**
- hiểu user đang kẹt kiểu gì

**Layout**
- sidebar bước bên trái
- panel chính giữa
- footer sticky

**Nội dung**
- 6 lựa chọn dạng card
- ô `Mô tả ngắn case của bạn`

**Nút**
- `Tiếp tục`
- `Lưu nháp`

**Rule**
- phải chọn ít nhất một tình huống hoặc mô tả đủ rõ

### A05. Wizard step 2: Người liên hệ

**Mục tiêu**
- xác định đại diện case

**Field**
- họ tên
- MSSV
- vai trò trong nhóm
- Zalo
- email
- Telegram nếu có

**Nút**
- `Quay lại`
- `Tiếp tục`
- `Lưu nháp`

### A06. Wizard step 3: Nhóm và dự án

**Mục tiêu**
- lấy bối cảnh team

**Field**
- số thứ tự nhóm
- tên dự án hiện tại nếu có
- mô tả ngắn về trạng thái nhóm

**Helper copy**
- gợi ý viết ngắn: nhóm đã có idea chưa, đã phân vai chưa, đang vướng ở đâu

### A07. Wizard step 4: Cần Nexus hỗ trợ gì ngay bây giờ

**Mục tiêu**
- buộc user chọn outcome gần nhất cần đạt

**Field**
- nhu cầu hỗ trợ chính
- mô tả thêm nếu case đặc biệt

**Nút**
- `Quay lại`
- `Tiếp tục`
- `Lưu nháp`

### A08. Wizard step 5: Tài liệu đầu vào

**Mục tiêu**
- gom đủ đầu vào để audit được

**Khối UI**
- vùng upload file
- ô dán link Drive
- bảng liệt kê tài liệu đã thêm

**Mỗi tài liệu cần có**
- loại tài liệu
- mô tả vai trò
- nguồn: upload hay Drive

**Nút**
- `Thêm tài liệu`
- `Xóa`
- `Quay lại`
- `Tiếp tục`

**Rule**
- phase 1 cho phép chỉ có Drive link nếu link đủ rõ

### A09. Wizard step 6: Feedback và deadline

**Mục tiêu**
- hiểu áp lực thật của case

**Field**
- feedback giảng viên nếu có
- deadline gần nhất
- mức độ gấp

**UX note**
- deadline nên có helper text giải thích để supporter ưu tiên đúng

### A10. Wizard step 7: Kỳ vọng đầu ra

**Mục tiêu**
- khóa kỳ vọng đúng ngay từ đầu

**Field**
- team mong nhận được gì
- có cần review lại sau khi sửa không

**Copy cần có**
- nhắc Nexus sẽ chỉ ra hướng sửa, không làm bài thay

### A11. Wizard step 8: Xác nhận ranh giới

**Mục tiêu**
- chặn kỳ vọng sai

**Nội dung**
- 3-4 checkbox xác nhận boundary

**Nút**
- `Quay lại`
- `Tiếp tục`

**Rule**
- chưa tick đủ thì không qua bước sau

### A12. Review before submit

**Mục tiêu**
- cho user kiểm tra lại toàn bộ trước khi gửi

**Layout**
- từng section tóm tắt
- nút `Sửa` trên từng section

**Khối nội dung**
- tình huống hiện tại
- thông tin liên hệ
- nhóm / dự án
- nhu cầu hỗ trợ
- tài liệu đầu vào
- feedback / deadline
- kỳ vọng đầu ra

**Nút**
- `Quay lại`
- `Lưu nháp`
- `Gửi case`

**Validation**
- highlight rõ phần thiếu trước khi submit

### A13. Case submitted success

**Mục tiêu**
- xác nhận hoàn tất và dẫn user sang workspace

**Nội dung**
- thông báo đã nhận case
- case id
- stage hiện tại
- hệ thống sẽ làm gì tiếp theo

**Nút**
- `Vào workspace của case`
- `Tạo case khác`

### A14. User case workspace

**Mục tiêu**
- trở thành màn hình chính user quay lại nhiều lần
- làm rõ report hiện tại và next action

**Layout đề xuất**
- header case summary
- cột chính:
  - next action card
  - latest report block
  - document board
- cột phụ:
  - stage / timeline
  - thông tin deadline
  - round history

**Header**
- tên case hoặc mô tả ngắn
- stage badge dễ hiểu
- round hiện tại
- thời gian cập nhật gần nhất

**Khối 1. Next action card**
- một câu rõ `Bạn cần làm gì tiếp theo`
- ví dụ:
  - `Chờ Nexus xem xét case`
  - `Bổ sung feedback giảng viên`
  - `Đọc report mới và cập nhật tài liệu`
  - `Gửi bản sửa mới`

**Khối 2. Latest report block**
- tiêu đề report mới nhất
- tóm tắt 3 phần:
  - lỗi chính
  - ưu tiên sửa trước
  - câu hỏi cần làm rõ
- nút:
  - `Xem full report`
  - `Tải file report` nếu có file đính kèm

**Khối 3. Document board**
- nhóm 1: `Tài liệu nhóm đã gửi`
- nhóm 2: `Report / phản hồi từ Nexus`
- nhóm 3: `Bản sửa của nhóm`
- nhóm 4: `Lịch sử các vòng`

**Hành động chính**
- khi stage là `Da co report moi` hoặc `Cho nhom cap nhat`: hiện `Gửi bản sửa mới`
- khi stage là `Can bo sung thong tin`: hiện `Bổ sung thông tin`

**State variants cần có**
- `Nexus da nhan case`
  - không có report
  - next action là chờ xem xét
- `Can bo sung thong tin`
  - hiện notice đỏ/cam với danh sách cần bổ sung
- `Dang duoc xem xet`
  - report block ở trạng thái placeholder
- `Da co report moi`
  - latest report block nổi bật nhất trang
- `Cho nhom cap nhat`
  - CTA `Gửi bản sửa mới` nổi bật
- `Nexus da nhan ban sua`
  - timeline phải cho thấy round mới đã được tạo
- `Da hoan tat` hoặc `Da dong`
  - khóa CTA chỉnh sửa, chỉ còn xem lịch sử

### A15. Submit revision

**Mục tiêu**
- giúp user nộp bản sửa trong cùng case, không mở case mới

**Layout**
- modal lớn hoặc page riêng
- tóm tắt report gần nhất ở đầu

**Field**
- upload bản sửa
- link Drive nếu có
- note `Nhóm đã sửa những gì`
- note `Còn phần nào chưa xử lý được`

**Nút**
- `Gửi bản sửa`
- `Hủy`

**Validation**
- phải có ít nhất file hoặc Drive link
- phải có note mô tả thay đổi tối thiểu

## 6. Lớp B: Ops flow nội bộ

### B01. Admin triage queue

**Mục tiêu**
- scan nhanh case mới và quyết định có đưa vào flow hay không

**Layout**
- bảng hoặc list
- filter theo `mới`, `gấp`, `thiếu dữ liệu`, `đã accept chưa assign`

**Mỗi item hiển thị**
- case id
- người gửi
- tình huống chính
- deadline
- mức độ gấp
- độ đủ của tài liệu
- trạng thái hiện tại

**Nút**
- `Xem chi tiết`

### B02. Admin case detail

**Mục tiêu**
- ra quyết định triage trong ít thao tác

**Layout**
- summary panel
- preview tài liệu
- timeline
- action panel dính bên phải

**Action panel**
- `Accept case`
- `Reject case`
- `Yêu cầu bổ sung`
- `Assign supporter`

**Modal / panel con**
- Reject cần nhập lý do
- Request more info cần nhập danh sách cần bổ sung
- Assign supporter cần chọn supporter hợp lệ

**Rule**
- `Yêu cầu bổ sung` dùng được trước accept
- case accept nhưng chưa assign phải vào trạng thái `accepted_unassigned`

### B03. Supporter queue

**Mục tiêu**
- cho supporter thấy rõ mình cần xử lý case nào trước

**Layout**
- list theo priority
- filter theo round, deadline, stage

**Mỗi item hiển thị**
- case id
- tên case
- deadline
- round hiện tại
- lần cập nhật cuối
- badge trạng thái

**Nút**
- `Mở case`

### B04. Supporter audit workspace

**Mục tiêu**
- cho supporter đủ ngữ cảnh để audit và publish report

**Layout 3 cột**
- cột trái:
  - case summary
  - deadline
  - checklist audit tối thiểu
- cột giữa:
  - document board
  - preview tài liệu
  - diff giữa bản cũ và bản mới nếu là round sau
- cột phải:
  - internal notes
  - draft report
  - actions

**Actions**
- `Yêu cầu bổ sung`
- `Lưu nháp report`
- `Publish report`
- `Đóng case với lý do`

**Report composer phase 1**
- section `Tóm tắt đánh giá`
- section `Vấn đề chính`
- section `Ưu tiên sửa trước`
- section `Câu hỏi cần làm rõ`
- section `Hướng sửa đề xuất`
- optional file attachment

**Round 2+ behavior**
- phải thấy được:
  - report vòng trước
  - note user mô tả phần đã sửa
  - tài liệu bản cũ và bản mới

## 7. Lớp C: Shared surfaces

### C1. Status badge

User-facing label nên dùng:
- `Nexus da nhan case`
- `Can bo sung thong tin`
- `Dang duoc xem xet`
- `Da co report moi`
- `Cho nhom cap nhat`
- `Nexus da nhan ban sua`
- `Da hoan tat`
- `Case chua duoc nhan`
- `Da dong`

### C2. Next action card

**Luật**
- luôn chỉ có một next action chính
- luôn trả lời câu hỏi `bây giờ user phải làm gì`

### C3. Document board item

**Mỗi card cần có**
- tên tài liệu
- round badge
- mô tả vai trò
- trạng thái
- nút `Xem` hoặc `Tải`

### C4. Timeline item

**Sự kiện tối thiểu**
- case được gửi
- admin yêu cầu bổ sung
- admin accept / reject
- supporter publish report
- user gửi bản sửa
- case hoàn tất / đóng

### C5. Notice yêu cầu bổ sung

**Phải có**
- ai yêu cầu
- yêu cầu phần gì
- khi nào yêu cầu
- CTA đi đến đúng chỗ để bổ sung

## 8. Guardrail cho Wireframe Text Spec

- Chỉ mô tả `layout + logic + state + CTA`.
- Không mô tả chi tiết thẩm mỹ như màu cụ thể, font cụ thể, bo góc theo px, shadow, animation detail, hoặc spacing pixel.
- Nếu cần nhấn mạnh ưu tiên thị giác, chỉ mô tả ở mức vai trò như `khối nổi bật nhất`, `CTA chính`, `panel phụ`, `notice cần thấy ngay`.
- Mantine UI, theme tokens, và global styling layer sẽ quyết định phần thẩm mỹ chi tiết khi implement.

## 9. Anti-pattern cần tránh

- Biến user workspace thành bảng metadata dài hơn report.
- Đưa quá nhiều badge nội bộ như `artifact`, `assessment`, `v01`.
- Bắt user chat tự do để hoàn tất intake.
- Để supporter publish report chỉ dưới dạng file tải về mà không có phần đọc trực tiếp.
- Dùng cùng một layout dashboard cho user, admin, và supporter.

