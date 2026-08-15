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
| Status | Done |
| Assignee | — |
| Priority | High |
| Target | 2026-08-16 |
| Ghi chú | Đã fix trong plan `260815-2154-backlog-bugs-fix` (2026-08-16): user xác nhận hoàn thành qua T17 (isOwner) từ `report_ready_to_publish` → done; T14 guard đổi isAssignedSupporter→isAdmin (admin force-close); auto-done 7 ngày neo latest T11 fire T14 ADMIN; mua credit cho case `done` (owner verified) → T19_REOPEN → `supporter_working`, TARGET_STAGE `under_review`, re-arm SLA |

## Acceptance Criteria (draft)
- [x] Xác định rõ actor xác nhận hoàn thành
- [x] Hiển thị tick/trạng thái hoàn thành rõ ràng cho cả 2 phía
