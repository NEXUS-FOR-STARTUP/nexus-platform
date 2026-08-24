# Flow vòng đời case

- PRD reference: [`../prd/core-product-prd.md`](../prd/core-product-prd.md)
- Related requirements:
  - [`../requirements/case-workspace-and-status.md`](../requirements/case-workspace-and-status.md)
  - [`../requirements/revision-rounds-and-history.md`](../requirements/revision-rounds-and-history.md)
- Trạng thái: đang làm việc

## Mục tiêu

Cho user, admin, và supporter một mô hình nhất quán để biết case đang ở đâu, report nào đang có hiệu lực, và round hiện tại của case là gì.

## Quyết định UX phase 1

- Case workspace là source of truth cho tài liệu, report, và lịch sử các vòng.
- User nhìn thấy `bản nhóm gửi`, `report vòng 1`, `bản sửa vòng 2` thay vì naming kỹ thuật nội bộ.
- Internal system vẫn giữ logic `version`, `assessment`, và `artifact` để không mất lịch sử.

## Vòng đời chính

1. User submit case.
2. Admin triage case.
3. Case được accept và assign supporter.
4. Supporter đọc tài liệu.
5. Nếu thiếu, supporter yêu cầu bổ sung (admin reject với lý do rõ — kênh trao đổi triage).
6. Nếu đủ, supporter audit và publish report.
7. User xem report trong case workspace.
8. Nếu cần vòng tiếp theo, user gửi bản sửa mới.
9. Hệ thống tạo round mới trong cùng case.
10. Supporter review round mới và publish report mới.
11. Case hoàn tất khi gói hỗ trợ đã xong hoặc được đóng có chủ đích.

## Sơ đồ luồng

```mermaid
flowchart TD
    A(["Case: Đã nộp"]) --> B["Admin duyệt + gán supporter<br/>(cam kết SLA bắt đầu chạy)"]
    B --> C["Supporter đọc tài liệu"]
    C --> D{"Đủ thông tin để phân tích?"}
    D -- "thiếu" --> E["Yêu cầu bổ sung kèm lý do rõ"]
    E --> F["Sinh viên bổ sung → nộp lại"]
    F --> C
    D -- "đủ" --> G["Supporter phân tích, viết báo cáo"]
    G --> H["Nộp báo cáo vào case<br/>trừ 1 lượt đánh giá"]
    H --> I["Sinh viên nhận thông báo, xem báo cáo"]
    I --> J{"Sinh viên quyết định"}
    J -- "tiếp tục cải thiện" --> K["Sinh viên sửa tài liệu của mình<br/>gửi bản mới — miễn phí, không trừ lượt"]
    K --> C
    J -- "xác nhận hoàn tất" --> L(["Case hoàn tất"])
    J -- "im lặng 7 ngày" --> L
    L -. "sinh viên mua lượt mới" .-> M["Case mở lại, bắt đầu vòng mới<br/>không cần admin duyệt lại, SLA chạy lại"]
    M --> C
    B -. "kết thúc không trọn vẹn:<br/>từ chối/veto/hủy/xóa" .-> N(["Hoàn lượt chưa dùng về ví<br/>theo đúng giá đã mua<br/>veto hoàn thêm tiền gói"])
    RULES["Ràng buộc vòng đời:<br/>• Mỗi vòng = 1 lượt, trừ đúng lúc supporter nộp báo cáo<br/>• Report mới nổi bật, bản cũ giữ làm lịch sử<br/>• Supporter không tự đóng case<br/>• Hết lượt: case đứng yên, không tự đóng<br/>• Bản sửa của sinh viên không bao giờ trừ lượt"]
    classDef note fill:#FEF3C7,stroke:#D97706,color:#92400E
    class N note
```

## User-facing stage đề xuất


- `submitted`
- `under_review`
- `need_more_information`
- `assigned`
- `audit_in_progress`
- `report_ready`
- `waiting_for_revision`
- `revision_submitted`
- `completed`
- `rejected`
- `closed`

## User-facing label phase 1

- `Nexus da nhan case`
- `Can bo sung thong tin`
- `Dang duoc xem xet`
- `Da co report moi`
- `Cho nhom cap nhat`
- `Nexus da nhan ban sua`
- `Da hoan tat`
- `Case chua duoc nhan`
- `Da dong`

## Internal status đề xuất

- `new`
- `triage_pending`
- `accepted_unassigned`
- `assigned`
- `waiting_user`
- `supporter_working`
- `report_ready_to_publish`
- `done`
- `cancelled`

## Artifact model trong case

Mỗi artifact cần tối thiểu:
- round số mấy
- loại tài liệu
- direction: `input / output / evidence`
- ai upload hoặc publish
- thời gian tạo
- visibility: `user / internal`
- mô tả vai trò của tài liệu
- trạng thái: `active / superseded / internal-only`

## Document board trong case workspace

### Các nhóm hiển thị cho user

- `Tài liệu nhóm đã gửi`
- `Report / phản hồi từ Nexus`
- `Bản sửa của nhóm`
- `Lịch sử các vòng`

### Mỗi item hiển thị

- tên dễ hiểu
- round badge
- trạng thái hiện tại
- mô tả ngắn vai trò của tài liệu
- nút `Xem` hoặc `Tải xuống`

## Quy tắc vòng đời tài liệu

- Bản mới từ nhóm tạo round hoặc version mới phù hợp.
- Feedback hoặc report mới không tự động xóa report cũ.
- Report mới nhất phải nổi bật là bản đang có hiệu lực.
- Tài liệu cũ được giữ làm lịch sử, không ghi đè.

## Luồng ngoại lệ

- Case thiếu dữ liệu: chuyển sang `need_more_information`.
- User không phản hồi sau khi được yêu cầu bổ sung: case có thể đóng với lý do rõ.
- Supporter thấy case không nên đi tiếp: có thể đề xuất đóng case với lý do rõ.

## Quy tắc UX

- User luôn thấy stage hiện tại và next action.
- Report final đang có hiệu lực phải nổi bật hơn report cũ.
- File list không được lấn át report và hướng sửa.
- Internal note và artifact nội bộ không lộ ra ngoài.

## Thiếu / chưa rõ

- Locked for phase 1: user-facing stage dung nhan de hieu thay vi ma ky thuat.
- Chưa khóa closed reasons taxonomy.
