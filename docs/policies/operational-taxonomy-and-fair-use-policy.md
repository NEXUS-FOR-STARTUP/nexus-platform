# Quy chế Vận hành: Danh mục Mã đóng Case, Điểm ưu tiên Hàng đợi & Giới hạn Gói Miễn phí

- **Mã chính sách:** POL-OPS-02 (Tương ứng nhiệm vụ GA-16)
- **Cơ quan ban hành:** Ban Điều hành & Vận hành Kỹ thuật Nexus Platform
- **Ngày ban hành & Có hiệu lực:** 30/08/2026
- **Phiên bản:** 1.0
- **Phân loại:** Chính sách Vận hành & Sử dụng Công bằng (Operational & Fair-Use Policy)

---

## 1. Mục đích & Phạm vi áp dụng

Quy chế này được ban hành nhằm thiết lập các tiêu chuẩn vận hành nhất quán và minh bạch cho đội ngũ Quản trị viên (Admin) và Cố vấn chuyên môn (Supporter) trên nền tảng Nexus Platform, bao gồm:
1. Chuẩn hóa bộ danh mục mã lý do (Taxonomy Enum) khi đóng hoặc từ chối xử lý hồ sơ (Case).
2. Quy định công thức tính điểm ưu tiên tự động (Auto-priority Score) để tối ưu hóa hàng đợi xử lý của Supporter theo đúng cam kết thời gian (SLA).
3. Ban hành chính sách sử dụng công bằng (Fair-Use Policy) đối với gói phân tích ý tưởng miễn phí (`pkg_tf_free`) nhằm ngăn chặn nguy cơ lạm dụng tài nguyên AI và bảo vệ hiệu suất hệ thống.

---

## 2. Danh mục Mã lý do Đóng / Từ chối Case (Case Closure Taxonomy)

Khi Admin hoặc Supporter thực hiện thao tác đóng, hủy hoặc từ chối một Case, bắt buộc phải lựa chọn chính xác một trong **7 mã danh mục chuẩn hóa** sau đây kèm theo diễn giải phù hợp:

| Mã định danh (Code) | Tên lý do chuẩn hóa | Định nghĩa & Điều kiện kích hoạt | Xử lý Tài chính / Hoàn tiền |
|---|---|---|---|
| `STUDENT_REQUEST` | Sinh viên yêu cầu dừng | Người dùng chủ động gửi yêu cầu hủy hoặc dừng xử lý hồ sơ do thay đổi kế hoạch nhóm hoặc đề tài. | Hoàn 100% nếu Supporter chưa bắt đầu phân tích (`pending` / `assigned`). Xem xét hoàn tối đa 50% nếu đang xử lý (`in_progress`). |
| `INACTIVE_TIMEOUT` | Quá hạn không phản hồi | Case ở trạng thái yêu cầu sinh viên bổ sung thông tin hoặc phản hồi câu hỏi nhưng không nhận được tương tác sau **mười bốn (14) ngày** liên tục. | Đóng case. Tùy thuộc vào khối lượng công việc đã thẩm định ban đầu, Admin quyết định hoàn từ 50% đến 100% Credit về ví. |
| `DUPLICATE_CASE` | Hồ sơ trùng lặp | Người dùng vô tình hoặc cố ý tạo từ 2 hồ sơ trở lên cho cùng một nội dung đề tài dự án. | Đóng hồ sơ trùng lặp, giữ lại 01 hồ sơ chính thức. Hoàn trả 100% Credit/chi phí của các hồ sơ bị đóng trùng. |
| `INSUFFICIENT_DATA` | Dữ liệu không đủ thẩm định | Tài liệu đính kèm bị lỗi, quá sơ sài, thiếu các phần dữ kiện cốt lõi tối thiểu và sinh viên không bổ sung sau 02 lần nhắc nhở chính thức qua email/chat. | Đóng case, hủy tiến trình. Hoàn trả 100% số tiền/Credit về Ví người dùng để sinh viên có thể tạo lại khi đã chuẩn bị đủ tài liệu. |
| `OUT_OF_SCOPE` | Vượt ngoài phạm vi cố vấn | Đề tài thuộc lĩnh vực chuyên ngành đặc thù ngoài năng lực phản biện khởi nghiệp của hệ sinh thái, hoặc sinh viên yêu cầu các dịch vụ trái quy định (như làm bài hộ, viết code thuê, giải bài tập). | Từ chối tiếp nhận (Veto). Hoàn trả 100% chi phí/Credit về ví của sinh viên ngay lập tức. |
| `VIOLATION_POLICY` | Vi phạm quy chế nền tảng | Phát hiện hành vi đạo văn nghiêm trọng, tải lên mã độc, phát tán nội dung đồi trụy/xúc phạm Supporter, hoặc cố ý gian lận tài khoản. | Đóng Case lập tức, không hoàn tiền. Xem xét khóa quyền truy cập hoặc chấm dứt vĩnh viễn tài khoản vi phạm. |
| `OTHER` | Lý do nghiệp vụ khác | Các trường hợp đặc biệt không thuộc 6 danh mục trên (ví dụ: sự cố kỹ thuật hạ tầng bất khả kháng, thỏa thuận chuyển đổi gói dịch vụ riêng biệt). | **Bắt buộc:** Admin phải nhập ghi chú diễn giải chi tiết tối thiểu 20 ký tự trong hệ thống. Chính sách hoàn tiền theo phê duyệt của Admin. |

---

## 3. Thuật toán Tính điểm Ưu tiên Tự động (Auto-priority Score Algorithm)

### 3.1. Mục tiêu thuật toán
Hệ thống tự động chấm điểm và sắp xếp thứ tự ưu tiên các Case trong danh sách chờ của Admin Triage và Dashboard của Supporter, nhằm bảo đảm:
- Các case có deadline gấp hoặc gói dịch vụ trả phí cao được ưu tiên xử lý trước.
- Không để tồn đọng các case chờ quá lâu vượt quá cam kết thời gian dịch vụ (SLA).

### 3.2. Công thức tính điểm tổng hợp
$$\text{PriorityScore} = W_{\text{tier}} + W_{\text{wait}} + W_{\text{deadline}} + W_{\text{revision}}$$

Trong đó:
1. **$W_{\text{tier}}$ — Trọng số Gói dịch vụ (Package Tier):**
   - Gói Doanh nghiệp / Chuyên sâu (VIP Package): **100 điểm**
   - Gói Đánh giá Tiêu chuẩn (Standard Paid Package): **50 điểm**
   - Gói Phân tích Miễn phí (Free Tier Package): **10 điểm**

2. **$W_{\text{wait}}$ — Trọng số Thời gian chờ (Wait Time):**
   - Mỗi khoảng thời gian **6 giờ** mà Case ở trạng thái chờ duyệt (`triage_pending`) hoặc chưa bắt đầu phân tích (`assigned`): cộng **5 điểm**.
   - Mức cộng tối đa cho thời gian chờ: **60 điểm**.

3. **$W_{\text{deadline}}$ — Trọng số Hạn nộp Học thuật của Sinh viên (Student Deadline Urgency):**
   - Hạn nộp bài của sinh viên còn dưới 48 giờ: **+80 điểm**
   - Hạn nộp bài còn từ 48 giờ đến dưới 7 ngày: **+40 điểm**
   - Hạn nộp bài trên 7 ngày hoặc không có hạn chót gấp: **+10 điểm**

4. **$W_{\text{revision}}$ — Trọng số Vòng gửi bản sửa (Revision Round):**
   - Case đang ở vòng sửa đổi sau khi sinh viên đã cập nhật tài liệu theo góp ý vòng 1: **+30 điểm** (ưu tiên chốt nhanh chu trình cố vấn).

### 3.3. Phân cấp Mức độ Khẩn cấp (Priority Severity Levels)
Dựa trên điểm số `PriorityScore` được tính toán thời gian thực:
- 🔴 **CRITICAL (Điểm $\ge 180$):** Case đặc biệt khẩn cấp. Hiển thị badge đỏ nổi bật ở đầu danh sách, tự động gửi thông báo nhắc nhở Admin điều phối trong vòng 2 giờ.
- 🟠 **HIGH ($120 \le$ Điểm $< 180$):** Mức độ ưu tiên cao. Cam kết Supporter tiếp nhận và bắt đầu xử lý trong vòng 12 giờ.
- 🟡 **MEDIUM ($60 \le$ Điểm $< 120$):** Mức độ bình thường. Xử lý theo đúng chuẩn SLA tiêu chuẩn (24 - 48 giờ).
- 🟢 **LOW (Điểm $< 60$):** Hồ sơ không gấp hoặc gói trải nghiệm miễn phí, xử lý theo thứ tự nộp khi có nguồn lực trống.

---

## 4. Chính sách Sử dụng Công bằng đối với Gói Miễn phí (Fair-Use Policy)

### 4.1. Định mức sử dụng gói Team-Idea Fit Miễn phí (`pkg_tf_free`)
- Mỗi tài khoản sinh viên đăng ký trên Nexus Platform được cấp tối đa **ba (03) lượt tạo báo cáo phân tích Team-Idea Fit miễn phí** trong toàn bộ vòng đời tài khoản.
- Mục đích của gói miễn phí là giúp sinh viên và nhóm khởi nghiệp bước đầu định hình ý tưởng, đánh giá độ phù hợp của đội ngũ sáng lập và làm quen với phương pháp luận phản biện của Nexus.

### 4.2. Cơ chế kiểm soát vượt hạn mức
- Khi người dùng đã sử dụng hết 03 lượt đánh giá miễn phí:
  - Hệ thống tự động vô hiệu hóa tùy chọn tạo Case miễn phí trên giao diện.
  - Hiển thị thông báo hướng dẫn người dùng nạp số dư vào Ví VND hoặc lựa chọn các gói phản biện chuyên sâu trả phí để tiếp tục sử dụng hệ thống AI Engine và đội ngũ Cố vấn.

### 4.3. Biện pháp Phòng chống Gian lận & Lạm dụng (Anti-Abuse Measures)
- Nhằm ngăn chặn các hành vi cố tình tạo nhiều tài khoản giả mạo (Sybil attack), sử dụng script tự động để spam gọi API mô hình ngôn ngữ lớn (OpenAI / Google Gemini):
  - Hệ thống áp dụng kiểm soát giới hạn tần suất tạo case (Rate Limiting) theo địa chỉ IP và mã nhận dạng thiết bị trình duyệt (Fingerprint).
  - Nghiêm cấm mọi hành vi can thiệp kỹ thuật nhằm qua mặt cơ chế đếm lượt sử dụng miễn phí. Các tài khoản vi phạm sẽ bị khóa vĩnh viễn và chặn truy cập từ dải mạng liên quan theo Điều khoản Dịch vụ.
