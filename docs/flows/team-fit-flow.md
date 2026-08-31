# Flow team-fit (kiểm tra khớp nhóm)

- PRD reference: [`../prd/core-product-prd.md`](../prd/core-product-prd.md)
- Trạng thái: đang làm việc

## Mục tiêu

Sinh viên trả lời bộ câu hỏi về nhóm, hệ thống đánh giá độ khớp của nhóm với dự án và tạo một case kèm báo cáo — case này chính là case tiếp tục luồng intake, không phải case vứt đi.

## Quan hệ với intake

- Lưu báo cáo team-fit xong, hệ thống tạo luôn một case cho nhóm và dẫn sinh viên vào trang case đó.
- Case từ team-fit **chưa có hồ sơ intake đầy đủ** — sinh viên tiếp tục điền hồ sơ rồi nộp như luồng intake thường.
- Gói dịch vụ: mặc định gói miễn phí; nếu nhóm chọn gói chuyên sâu thì case cần thanh toán trước khi duyệt.

## Sơ đồ luồng

```mermaid
flowchart TD
    subgraph SV["SINH VIÊN"]
        A(["Mở bài kiểm tra khớp nhóm"]) --> B["Trả lời bộ câu hỏi về nhóm<br/>(chưa có lưu nháp — bỏ dở phải làm lại)"]
    end
    subgraph HT["HỆ THỐNG"]
        B --> C["Phân tích độ khớp"]
        C --> D["Lưu báo cáo khớp nhóm (bảng riêng)<br/>+ tạo case kèm theo"]
        D --> E{"Gói dịch vụ"}
        E -- "miễn phí — mặc định hiện tại<br/>(chưa có màn chọn gói)" --> F["Miễn thanh toán"]
        E -- "chuyên sâu (khi hệ thống gán)" --> G["Chờ thanh toán"]
    end
    F --> H["Sinh viên điền hồ sơ intake đầy đủ<br/>(case chưa có hồ sơ — admin thấy ở mục Chờ nộp)"]
    G --> I["Mua lượt → tự chuyển gói chuyên sâu<br/>→ Đã thanh toán"]
    I --> H
    H --> J["Nộp hồ sơ"]
    J --> K(["Hàng đợi xét duyệt của admin"])
    RULES["Ràng buộc:<br/>• Case team-fit = case intake — không tạo case thứ hai<br/>• Báo cáo khớp nhóm không lẫn vào hồ sơ intake<br/>• Chưa nộp hồ sơ đầy đủ thì không vào hàng đợi duyệt<br/>• Đổi gói = mua lượt cho case (không có nút đổi gói riêng)"]
    classDef warn fill:#FEF3C7,stroke:#D97706,color:#92400E
    class G warn
```

## Luồng ngoại lệ

- **Nhóm bỏ dở giữa chừng**: báo cáo chưa lưu — nhóm trả lời lại từ đầu (chưa có lưu nháp).
- **Đổi gói sau khi lưu**: sinh viên mua lượt đánh giá cho case — hệ thống tự chuyển gói sang chuyên sâu rồi đánh dấu thanh toán.
- **Case team-fit chưa nộp hồ sơ**: admin thấy case ở mục "Chờ sinh viên nộp hồ sơ", không lẫn vào hàng đợi duyệt.

## Thiếu / chưa rõ

- Chưa khóa bộ câu hỏi team-fit theo từng tình huống dự án.
- Chưa khóa chính sách gói miễn phí được dùng tối đa bao nhiêu lần.
