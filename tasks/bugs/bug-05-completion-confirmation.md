# Bug 5: Chưa rõ ai xác nhận hoàn thành (user hay supporter)

## Thông tin gốc (Google Docs)

> thế nào là hoàn thành? supporter gửi báo cáo xong là hoàn thành nhưng chưa thấy tick hoàn thành? rồi [user] phải xác nhận là hoàn thành hay supporter?

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Quyết định sản phẩm + state machine |
| Effort | **M** |
| Độ phức tạp | Trung bình: thêm trạng thái/tick hoàn thành + xác định actor |
| Dependency | #4 (cùng luồng hoàn thành quy trình) |
| Quyết định cần | **Ai xác nhận hoàn thành: user hay supporter?** |
| Vùng code | Case status/completion flow — `submitSupporterOutputUploadUseCase`, case detail FE |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | High |
| Target | — |
| Ghi chú | Cần chốt: supporter gửi báo cáo xong = hoàn thành? hay user phải confirm? |

## Acceptance Criteria (draft)
- [ ] Xác định rõ actor xác nhận hoàn thành
- [ ] Hiển thị tick/trạng thái hoàn thành rõ ràng cho cả 2 phía
