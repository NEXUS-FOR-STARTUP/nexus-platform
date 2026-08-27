# Flow thanh toán & mua lượt đánh giá

- PRD reference: [`../prd/core-product-prd.md`](../prd/core-product-prd.md)
- Trạng thái: đang làm việc
- Ghi chú: file này thay thế nội dung "Payment Verification (deferred)" cũ — flow thanh toán thực tế đã được triển khai trong code và là một phần của luồng chính.

## Mục tiêu

Sinh viên nạp tiền vào ví, mua lượt đánh giá cho case, và case được đánh dấu `Đã thanh toán` — điều kiện bắt buộc để admin duyệt hồ sơ.

## Khái niệm

- **Ví**: nơi chứa số dư tiền thật của sinh viên (VND).
- **Lượt đánh giá**: mỗi lượt tương ứng với một lần supporter phân tích và nộp báo cáo. Lượt được mua theo case, không phải theo tài khoản.
- **Trạng thái thanh toán của case**:
  - `Chưa thanh toán` — case cần trả phí nhưng sinh viên chưa mua lượt.
  - `Đã thanh toán` — sinh viên đã mua ít nhất một lượt đánh giá cho case.
  - `Miễn thanh toán` — gói miễn phí, không cần mua lượt.

## Nguyên tắc

1. "Đã thanh toán" có nghĩa là **đã mua lượt đánh giá cho case đó** — không có bước thanh toán gói riêng biệt.
2. Giá lượt đánh giá do hệ thống tính từ gói dịch vụ (hiện tại 39.000đ/lượt, gói chuyên sâu). Sinh viên không tự đặt được giá.
3. Nạp tiền vào ví không làm case "Đã thanh toán". Chỉ hành động mua lượt mới đánh dấu thanh toán.
4. Mua lượt **không** đổi trạng thái hồ sơ (ngoại lệ: case đã hoàn tất thì mua lượt = mở lại case, xem flow vòng đời).
5. Mỗi lần supporter nộp báo cáo, hệ thống trừ 1 lượt. Sinh viên gửi bản sửa thì **không** bị trừ lượt.

## Sơ đồ luồng

```mermaid
flowchart TD
    subgraph SV["SINH VIÊN"]
        A(["Mở trang Ví"]) --> B["Tạo yêu cầu nạp<br/>số tiền tự chọn (có mức tối thiểu)"]
        B --> C["Chuyển khoản đúng nội dung mã nạp<br/>+ upload ảnh minh chứng"]
        C --> D["Mở case → bấm Mua lượt đánh giá"]
        D --> I
    end
    subgraph HT["HỆ THỐNG"]
        B --> E{"Ngân hàng báo tiền về tự động?"}
        E -- "có + khớp mã nạp" --> F["Ví cộng tiền ngay"]
        E -- "không/không khớp" --> G["Chuyển admin xác nhận thủ công"]
        F --> I["Kiểm tra khi mua lượt:<br/>số dư ví ≥ giá gói?"]
        I -- "không đủ → báo nạp thêm" --> B
        I -- "đủ" --> J["Ví trừ tiền · case +1 lượt ·<br/>case đánh dấu Đã thanh toán"]
    end
    subgraph ADM["ADMIN"]
        G --> H["Đối chiếu ảnh minh chứng"]
        H -- "đúng" --> F
        H -- "sai/thiếu → yêu cầu gửi lại" --> C
    end
    J --> K{"Trạng thái case?"}
    K -- "chưa nộp hồ sơ" --> L["Giữ nguyên trạng thái intake (draft/ready)<br/>Cập nhật payment_status: paid"]
    K -- "đã hoàn tất" --> M["Mở lại case để làm vòng mới<br/>không cần duyệt lại"]
    K -- "còn lại" --> N(["Lượt nằm chờ, dùng cho vòng sau"])
    RULES["Ràng buộc:<br/>• Giá do hệ thống tính từ gói — không nhận giá từ sinh viên<br/>• Nạp ví ≠ thanh toán; chỉ Mua lượt mới đánh dấu Đã thanh toán<br/>• Lượt gắn theo case, không theo tài khoản<br/>• 1 lượt = 1 lần supporter nộp báo cáo<br/>• Trừ lượt đúng 1, không tính theo số tài liệu hay lượt tải"]
    classDef warn fill:#FEF3C7,stroke:#D97706,color:#92400E
    class J warn
```

## Luồng ngoại lệ

- **Chuyển khoản sai nội dung**: ngân hàng không khớp mã → admin kiểm tra thủ công qua ảnh minh chứng.
- **Nạp tiền nhưng chưa mua lượt**: case vẫn `Chưa thanh toán` — tiền nằm trong ví, sinh viên mua lượt bất kỳ lúc nào.
- **Hết lượt giữa chừng**: supporter không nộp được báo cáo; hệ thống báo sinh viên mua thêm lượt.
- **Case kết thúc không trọn vẹn** (từ chối/veto/hủy/xóa): lượt chưa dùng được hoàn về ví theo giá đã mua.

## Thiếu / chưa rõ

- Chưa có hoàn tiền khi sinh viên muốn rút tiền khỏi ví (chỉ hoàn tự động khi case kết thúc không trọn vẹn).
- Chưa khóa chính sách giá cho gói miễn phí nếu mở rộng thêm gói mới.
