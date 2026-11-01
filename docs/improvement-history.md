# Lịch sử cải tiến sản phẩm

Các lần cải tiến sau phản hồi của giảng viên, mentor và người dùng, từ tháng 8/2026. Mỗi mục nêu rõ trước đây làm thế nào, sau đó đổi thành gì, và vì sao.

#### 08/2026: Ví tiền và thông báo

- **Ví tiền**
  - Trước đây: tiền trả cho từng lần mua nằm rời rạc theo từng đơn, không có số dư chung. Màn hình thanh toán có hai danh sách chồng nhau, khó hiểu.
  - Cải tiến thành: có ví tiền với số dư chung của sinh viên, nạp một lần rồi dùng cho các lần chấm. Lịch sử gom về một danh sách "hoạt động ví" dễ xem.
  - Lý do: mentor hỏi về minh bạch dòng tiền. Danh sách cũ khiến sinh viên không rõ tiền đã vào hay chưa.
- **Thông báo**
  - Trước đây: không có thông báo. Sinh viên phải tự vào xem hồ sơ mới biết có cập nhật.
  - Cải tiến thành: sinh viên nhận thông báo trong app và qua email. Admin được báo thêm qua Telegram.
  - Lý do: sinh viên và admin không biết khi nào có việc mới. `[suy luận]`

#### Cuối 08/2026: Tin cậy và pháp lý

- Trước đây: đăng ký bằng email và mật khẩu, không xác minh email. Chưa có điều khoản, chính sách hoàn tiền.
- Cải tiến thành: xác minh email bằng mã gửi về. Có thể đăng nhập bằng mã hoặc mật khẩu. Thêm điều khoản, chính sách bảo mật, chính sách hoàn tiền. Người dùng tự xóa tài khoản.
- Lý do: mentor cảnh báo về pháp lý. Sản phẩm thu tiền thật thì cần tạo niềm tin và chống tài khoản giả.

#### 09/2026: Mua lượt và sửa lỗi "hết lượt"

- Trước đây: mua lượt chấm phải nạp ví rồi tự quay lại trang cũ. Sinh viên đã trả tiền, nhận xong báo cáo mà bị báo "hết lượt" và không đóng được dự án.
- Cải tiến thành: bảng giá công khai trên trang chủ. Mua lượt bằng mã QR rồi tự quay lại đúng chỗ. Hết lượt vẫn đóng được dự án.
- Lý do: lỗi cũ khiến sinh viên thấy như bị ép trả thêm tiền. Luồng mua còn rối.

#### Giữa 09/2026 đến 11/10: AI chấm bài thay người chấm

- **AI chấm bài**
  - Trước đây: người hỗ trợ (supporter) đọc bài và chấm tay, rồi gửi báo cáo.
  - Cải tiến thành: AI chấm bài, ra báo cáo PDF trong khoảng 10 phút. Tự hoàn lượt nếu hệ thống chấm lỗi. Admin theo dõi tiến độ chấm.
  - Lý do: chấm tay chậm, không mở rộng được khi nhiều nhóm gửi bài. Mentor nhắc vẫn cần người giám sát AI.
- **Bỏ luồng supporter (11/10)**
  - Trước đây: supporter là một phần của luồng, nhận hồ sơ, chấm, gửi báo cáo.
  - Cải tiến thành: bỏ luồng supporter khỏi sản phẩm, AI đảm nhận phần chấm.
  - Lý do: chấm tay không scale. Giá trị cốt lõi là quy trình chuẩn hóa cộng AI.

#### 21/09 và 18–20/10: Làm lại chữ và giao diện

- Trước đây: chữ trên giao diện nhỏ, tiếng Việt như dịch máy, còn tên kỹ thuật nội bộ. Trang chủ và các màn hình dùng giao diện cũ.
- Cải tiến thành: viết lại toàn bộ chữ, chữ lớn hơn, icon rõ nghĩa, nút quan trọng nổi bật. Đổi "hồ sơ" thành "dự án". Landing page mới. Thêm bản dùng trên điện thoại cho sinh viên.
- Lý do: mentor UX nhận xét "nhìn là biết AI làm": chữ nhỏ, khoảng trống vô nghĩa, tiếng Việt không tự nhiên.

#### 06/10: Mục Bài viết

- Trước đây: chưa có nội dung nào ngoài công cụ chấm bài.
- Cải tiến thành: thêm mục Bài viết (chia sẻ, tin tức cho sinh viên) và vai trò người viết riêng.
- Lý do: thu hút người dùng mới bằng nội dung trước khi họ mua. `[suy luận]`

#### 08–12/10: Điền theo câu hỏi dẫn dắt

- Trước đây: sinh viên tự viết tài liệu rồi tải lên. Mọi giai đoạn dùng chung một màn hình tải file.
- Cải tiến thành:
  - Điền theo câu hỏi dẫn dắt, mỗi câu có ví dụ, rồi xuất ra file Word.
  - Mỗi giai đoạn có màn hình riêng (hành trình).
  - Chọn chấm theo câu trả lời, theo file, hoặc cả hai.
  - Chọn nộp mới hay nộp lại và ghi chú cho người chấm.
- Lý do: sinh viên mới không biết viết gì từ đầu. Giảng viên CP3 đề xuất mẫu điền ô trống.

#### 16/10: Dùng trước, trả sau

- Trước đây: phải trả tiền (nạp ví hoặc mua lượt) trước khi được chấm.
- Cải tiến thành: cho dùng trước, trả sau. Admin ghi nhận khoản cần thu và gửi đường dẫn thanh toán cho sinh viên khi nhóm thấy có kết quả.
- Lý do: giảng viên pre-OC1 nói bán trực tiếp rất khó, nên làm trước, hiệu quả thì mới thu tiền.

#### 24–25/10: Mở thêm CP3, CP4, Pitch deck

- Trước đây: chỉ hỗ trợ CP1 và CP2. CP3, CP4, Pitch deck chưa mở. Mẫu CP2 theo tiêu chí kỳ cũ.
- Cải tiến thành: mở thêm Mô hình kinh doanh (CP3), Kế hoạch tài chính (CP4), Pitch deck. Cập nhật tiêu chí Fall 2026, bỏ các phần không còn yêu cầu (MVP demo, phụ lục, AI disclosure). Tự lưu câu trả lời khi gõ.
- Lý do: yêu cầu của trường đổi mỗi kỳ. Sinh viên hay mất bài vì quên lưu. `[suy luận]`

#### 6 mốc lớn cho slide

1. 08/2026: Thêm ví tiền có số dư chung và lịch sử gọn, thêm thông báo.
2. Cuối 08/2026: Thêm xác minh tài khoản và chính sách pháp lý.
3. 09/2026: Mua lượt bằng QR, sửa lỗi "hết lượt".
4. Giữa 09/2026 đến 11/10: Từ chấm tay sang AI chấm, bỏ luồng supporter.
5. 09–10/2026: Viết lại chữ và giao diện, chuyển từ tự viết sang điền theo câu hỏi dẫn dắt.
6. 16/10 đến 25/10: Cho trả sau, mở rộng sang CP3, CP4, Pitch deck.

Ghi chú: các mục `[suy luận]` là lý do mình đoán từ nội dung thay đổi, repo không ghi. Cần xác nhận trước khi trình bày.
