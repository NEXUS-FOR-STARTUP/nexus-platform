# Chính sách Quản lý Ví, Vòng đời Điểm tín dụng (Credit) & Hoàn tiền

- **Mã chính sách:** POL-BUS-01 (Tương ứng nhiệm vụ GA-15)
- **Cơ quan ban hành:** Ban Quản trị & Tài chính Nexus Platform
- **Ngày ban hành & Có hiệu lực:** 30/08/2026
- **Phiên bản:** 1.0
- **Phân loại:** Chính sách Kinh doanh & Tài chính (Business & Finance Policy)

---

## 1. Mục đích & Phạm vi áp dụng

Văn bản này quy định chi tiết về cơ chế nạp tiền, bảo toàn số dư ví tài khoản, vòng đời sử dụng của điểm tín dụng dịch vụ (Credit), điều kiện hoàn trả tiền/credit và quy trình rút tiền về tài khoản ngân hàng đối với toàn bộ người dùng (sinh viên, đại diện nhóm dự án) trên nền tảng Nexus Platform.

Mọi giao dịch tài chính trên Nexus Platform đều được đối soát minh bạch, tuân thủ pháp luật kế toán, thuế và quy định bảo vệ quyền lợi người tiêu dùng của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.

---

## 2. Quy chế Ví tài khoản (User Wallet - VND)

### 2.1. Bản chất & Nguồn gốc số dư ví
- Mỗi tài khoản người dùng đăng ký thành công trên Nexus Platform được tự động khởi tạo duy nhất một Ví cá nhân (`UserWallet`) định danh bằng đồng Việt Nam (VND).
- Số dư trong Ví được nạp thông qua cổng thanh toán tự động (SePay / VietQR) hoặc qua hình thức nạp tiền thủ công có bằng chứng chuyển khoản hợp lệ đã được Admin phê duyệt.

### 2.2. Thời hạn sử dụng & Bảo toàn số dư
- **Số dư tiền thật trong Ví VND KHÔNG CÓ THỜI HẠN HẾT HẠN.**
- Số dư được bảo toàn nguyên vẹn trong suốt thời gian tài khoản người dùng tồn tại trên hệ thống.
- Nexus không thu bất kỳ khoản phí duy trì tài khoản, phí quản lý ví định kỳ hay phí phạt không hoạt động nào đối với số dư trong ví của người dùng.

---

## 3. Quy chế Vòng đời Điểm tín dụng (Credit Lifecycle)

### 3.1. Phân loại Credit
Credit là đơn vị điểm dịch vụ được sử dụng để thanh toán các gói phân tích, phản biện và xuất bản Báo cáo đánh giá chuyên môn (Report) trên hệ thống. Credit bao gồm 2 loại:
1. **Credit Trả phí (Paid Credit):** Người dùng dùng số dư Ví VND để mua gói Credit hoặc thanh toán trực tiếp cho một Case cụ thể.
2. **Credit Khuyến mãi / Thưởng (Promotional / Bonus Credit):** Được hệ thống hoặc Admin cấp tặng thông qua các sự kiện học thuật, đối tác vườn ươm hoặc chương trình trải nghiệm.

### 3.2. Thời hạn hiệu lực của Credit (Expiration Policy)
- **Credit Trả phí:** Có thời hạn hiệu lực là **mười hai (12) tháng (365 ngày)** kể từ thời điểm giao dịch mua gói thành công.
- **Credit Khuyến mãi:** Có thời hạn hiệu lực theo từng chương trình cụ thể, mặc định tối đa là **chín mươi (90) ngày** kể từ ngày cấp.
- **Cơ chế cảnh báo hết hạn:** Hệ thống tự động gửi thông báo qua Email và Thông báo trong ứng dụng (In-app Notification) cho người dùng trước khi Credit hết hạn tại các mốc:
  - Trước 30 ngày.
  - Trước 7 ngày.
  - Ngày cuối cùng trước khi điểm hết hạn.
- Khi hết hạn, điểm Credit chưa sử dụng sẽ tự động hết hiệu lực và không còn khả năng kích hoạt dịch vụ.

### 3.3. Quy tắc Khấu trừ Credit
- Credit chỉ được chính thức khấu trừ khỏi tài khoản khi Supporter đã hoàn thành việc phân tích tài liệu và chính thức xuất bản **Báo cáo đánh giá chuyên môn (Report Ready)** trong Case.
- Trong suốt các giai đoạn nộp hồ sơ (Intake), thẩm định ban đầu (Triage), trao đổi tin nhắn làm rõ thông tin và các vòng nộp bản sửa đổi (Revision Rounds) theo quy định của gói, hệ thống **tuyệt đối không khấu trừ thêm bất kỳ khoản phí hoặc Credit nào khác**.

---

## 4. Chính sách Hoàn tiền (Refund Policy)

### 4.1. Các trường hợp Hoàn tiền 100% Tự động về Ví
Người dùng được hoàn lại 100% số tiền hoặc Credit đã thanh toán cho Case trong các trường hợp sau:
1. **Admin / Supporter từ chối tiếp nhận (Veto):** Hồ sơ không thuộc phạm vi cố vấn của nền tảng hoặc nhóm cố vấn không đủ nguồn lực chuyên môn phù hợp.
2. **Vi phạm Cam kết Thời gian Dịch vụ (SLA Breach):** Supporter được giao phụ trách case không phản hồi hoặc quá hạn xuất bản báo cáo quá 48 giờ so với thời hạn cam kết mà không có lý do bất khả kháng được Admin phê duyệt.
3. **Người dùng chủ động hủy Case hợp lệ:** Người dùng gửi yêu cầu hủy Case khi hồ sơ đang ở trạng thái chờ duyệt (`triage_pending`) hoặc đã phân công nhưng Supporter chưa bắt đầu phân tích tài liệu (`assigned`).

### 4.2. Các trường hợp Hoàn tiền Một phần hoặc Xem xét Đặc biệt
- Trường hợp Case đang trong quá trình thực hiện (`in_progress`) mà người dùng yêu cầu dừng dịch vụ vì lý do cá nhân bất khả kháng, Admin sẽ đánh giá khối lượng công việc Supporter đã thực hiện để quyết định tỷ lệ hoàn trả (tối đa 50% giá trị gói) vào Ví cá nhân.

### 4.3. Các trường hợp Không Hoàn tiền
1. Báo cáo đánh giá chuyên môn đã được xuất bản hoàn tất và gửi cho người dùng (`completed`).
2. Người dùng bị phát hiện gian lận nghiêm trọng, cố tình cung cấp tài liệu vi phạm bản quyền hoặc có hành vi lăng mạ, quấy rối Supporter dẫn đến việc Case bị buộc đóng theo quy tắc kỷ luật.
3. Credit khuyến mãi hoặc điểm thưởng được cấp miễn phí không thuộc diện áp dụng hoàn tiền.

---

## 5. Quy chế Rút tiền về Ngân hàng (VND Withdrawal)

### 5.1. Điều kiện rút tiền
- Người dùng có quyền yêu cầu rút số dư tiền thật khả dụng từ Ví VND về tài khoản ngân hàng chính chủ tại các ngân hàng thương mại hoạt động hợp pháp tại Việt Nam.
- Số tiền yêu cầu rút tối thiểu: **50.000 VNĐ / lần giao dịch**.

### 5.2. Quy trình & Thời gian xử lý
1. Người dùng gửi yêu cầu rút tiền tại mục *Quản lý Ví → Rút tiền*, cung cấp chính xác: Tên ngân hàng, Số tài khoản, Tên chủ tài khoản (phải trùng khớp với họ tên định danh tài khoản).
2. Bộ phận Kế toán & Admin Nexus tiến hành đối soát lịch sử nạp tiền và nguồn gốc số dư trong vòng **3 đến 5 ngày làm việc** (không tính Thứ Bảy, Chủ Nhật và ngày Lễ).
3. Sau khi xác nhận tính hợp lệ, lệnh chuyển khoản sẽ được thực hiện trực tiếp vào tài khoản ngân hàng của người dùng.

### 5.3. Phí chuyển khoản
- Nexus không thu phí xử lý rút tiền. Phí giao dịch liên ngân hàng (nếu có) sẽ do phía ngân hàng thụ hưởng khấu trừ theo biểu phí hiện hành của ngân hàng đó.

---

## 6. Chính sách Chuyển nhượng & Quyền lợi Nhóm (Transferability)

### 6.1. Không chuyển nhượng giữa các Tài khoản Cá nhân độc lập
- Nhằm phòng chống các hành vi gian lận tài chính, rửa tiền và ngăn chặn việc hình thành thị trường mua bán tài khoản không chính thống, **Nexus không cho phép chuyển nhượng trực tiếp số dư Ví hoặc Credit giữa 2 tài khoản cá nhân khác nhau**.

### 6.2. Chia sẻ Quyền lợi trong Nhóm Dự án (Case Team Collaboration)
- Trong một dự án khởi nghiệp có nhiều thành viên, Chủ sở hữu Case (Owner - người tạo case) thực hiện chi trả chi phí/Credit từ ví cá nhân của mình.
- Mọi thành viên được mời vào Case (`CaseMember`) đều được hưởng toàn bộ quyền lợi của gói dịch vụ: cùng tham gia khung chat trao đổi với Supporter, xem tiến độ trực tiếp và tải Báo cáo đánh giá chính thức mà không cần phải chi trả thêm bất kỳ khoản phí cá nhân nào.
