# Bug 1: Supporter ốm → phân lại supporter, SLA có reset?

## Thông tin gốc (Google Docs)

> Nếu Supporter bị ốm bị đau thì làm sao để admin có thể phân lại Supporter khi hồ sơ đã vào trạng thái báo cáo chờ gửi? Vậy nó còn giữ được cái giá trị SLA? (Assign supporter khác nhau, tại admin quản lý case rồi ghi lại lịch sử hệ thống là đã assign supporter khác, sla vẫn đếm chứ không reset lại. Khách k cần biết ai là supporter, họ chỉ cần biết là bao giờ có kết quả)

**Note [a]:** ý tui là admin phân supporter đó nhưng supporter đó không làm thì sla sẽ đếm tới khi nào kết thúc rồi giao thằng supporter khác hả. Rồi nếu supporter đó có xin phép là "Admin ơi em nay em bận" nhưng admin lỡ phân nó làm rồi vậy phải đợi 2 ngày sau mới phân lại. Biết chắc chắn supporter đó sẽ không làm luôn. [user] có quyền hủy hồ sơ nếu đã vào trạng thái "báo cáo chờ gửi" không? khi nào [user] có quyền hủy?

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Quyết định sản phẩm + workflow |
| Effort | **XL** |
| Độ phức tạp | Cao: reassign supporter + audit history + SLA timer |
| Dependency | Không có — độc lập |
| Quyết định cần | SLA đếm tiếp hay reset? User hủy hồ sơ được ở stage nào? |
| Vùng code | `assignSupporterUseCase` (`apps/api/src/modules/cases/application/assign-supporter.usecase.ts:26`), admin case management |

## Tracking

| Field | Value |
|-------|-------|
| Status | Done |
| Assignee | — |
| Priority | High |
| Target | 2026-08-16 |
| Ghi chú | Đã fix trong plan `260815-2154-backlog-bugs-fix` (2026-08-16): SLA đếm tiếp (đúng — no code), thêm T6 self-loop cho reassign ở `supporter_working`/`report_ready_to_publish`, refund credit dư theo FIFO giá mua thực tế (DESC, newest first), idempotency `refund-credit-{caseId}`, xóa supporter close-case route |

## Acceptance Criteria (draft)
- [x] Admin phân lại supporter ở stage "báo cáo chờ gửi"
- [x] Ghi lịch sử assign supporter vào hệ thống
- [x] SLA tiếp tục đếm (không reset) — chờ xác nhận
- [x] [user] biết thời điểm có kết quả, không cần biết ai là supporter
