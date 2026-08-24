# Flow admin triage and assignment

- PRD reference: [`../prd/core-product-prd.md`](../prd/core-product-prd.md)
- Related requirement: [`../requirements/admin-triage-and-assignment.md`](../requirements/admin-triage-and-assignment.md)
- Trạng thái: đang làm việc

## Mục tiêu

Đảm bảo mỗi case mới được nhận, từ chối, hoặc giao đúng người xử lý thay vì trôi nổi không owner.

## Luồng chính

1. User submit case.
2. Case vào `Admin triage queue`.
3. Admin mở case detail.
4. Admin xem summary, tài liệu, feedback, deadline, urgency.
5. Admin quyết định một trong ba action:
   - `Accept case`
   - `Reject case`
   - `Assign supporter`
6. Nếu admin accept nhưng chưa assign ngay, case ở trạng thái `accepted_unassigned`.
7. Khi assign supporter, case chuyển sang `assigned` và xuất hiện trong queue của supporter.

## Sơ đồ luồng

```mermaid
flowchart TD
    subgraph QUEUE["HÀNG ĐỢI ADMIN"]
        A(["Case vào hệ thống"]) --> B{"Case thuộc nhóm nào?"}
        B -- "chưa nộp / chưa thanh toán" --> C["Mục Chờ sinh viên<br/>(ẩn khỏi danh sách chính)"]
        B -- "đã nộp" --> D["Hàng đợi xét duyệt"]
        D --> E["Mở chi tiết:<br/>tóm tắt, tài liệu, feedback,<br/>deadline, mức độ gấp"]
    end
    E --> F{"Điều kiện duyệt"}
    F -- "chưa thanh toán → nút Duyệt khóa<br/>hiện lý do: Chưa hoàn tất thanh toán" --> G["Đợi sinh viên mua lượt"]
    G -. "đã thanh toán" .-> F
    F -- "đã thanh toán nhưng chưa nộp đủ hồ sơ" --> H["Hiện thông báo:<br/>đã thanh toán nhưng chưa nộp hồ sơ"]
    F -- "Đã thanh toán (hoặc miễn phí)<br/>+ còn ≥1 lượt" --> I{"Quyết định"}
    I -- "Duyệt" --> J["Chờ phân công"]
    J --> K["Gán supporter"]
    K --> L(["Vào hàng đợi supporter"])
    I -- "Từ chối" --> M["Nhập lý do bắt buộc ≥10 ký tự<br/>lưu timeline, sinh viên nhìn thấy"]
    M --> N(["Case đóng —<br/>hoàn lượt chưa dùng về ví"])
    I -- "Veto — chỉ trong 48h từ lúc tạo case" --> O(["Case đóng —<br/>hoàn tiền gói + lượt chưa dùng"])
    RULES["Ràng buộc:<br/>• Duyệt = đồng ý nhận case, chưa cần gán ngay<br/>• Đổi supporter: cam kết SLA đếm tiếp, không reset<br/>• Case sắp/quá hạn SLA phải nổi bật trong queue<br/>• Từ chối phải kèm lý do — không có nút im lặng"]
    classDef warn fill:#FEF3C7,stroke:#D97706,color:#92400E
    class C,G warn
```

## Tiêu chí triage tối thiểu


- Có đủ thông tin để hiểu case đang kẹt ở đâu chưa.
- Có đủ tài liệu hoặc link tài liệu để supporter bắt đầu chưa.
- Deadline có quá sát đến mức cần ưu tiên cao không.
- Case có phù hợp phạm vi hỗ trợ hiện tại không.

## Luồng ngoại lệ

- Nếu thiếu dữ liệu quan trọng: admin duyệt rồi để supporter yêu cầu bổ sung (T8), hoặc reject với lý do rõ.
- Nếu case ngoài phạm vi hoặc không nên nhận: admin chọn `Reject case` với lý do rõ.
- Nếu chưa có supporter phù hợp: case ở `accepted_unassigned` cho đến khi được giao.

## Quy tắc UX nội bộ

- Queue phải scan nhanh được mức độ gấp và độ đủ của case.
- Admin không phải mở quá nhiều màn chỉ để quyết định accept/reject/assign.
- Lý do reject (≥ 10 ký tự) phải lưu trong timeline.

## Thiếu / chưa rõ

- Chưa khóa danh mục lý do reject.
- Chưa khóa rule auto-priority từ deadline/urgency.

