# Bug 13: Intake spam tài liệu không giới hạn

## Thông tin gốc (Google Docs)

> [trang intake ở user] có thể spam nhiều tài liệu thoải mái không giới hạn (trừ giới hạn 15k mb)

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Validation thiếu |
| Effort | **M** |
| Độ phức tạp | Trung bình: thêm max-count validation |
| Dependency | #12 (spam gây lệch doc count) |
| Quyết định cần | Giới hạn bao nhiêu tài liệu? |
| Vùng code | Intake upload — `apps/web-1/app/dashboard/intake/` + API validation |

## Tracking

| Field | Value |
|-------|-------|
| Status | Done |
| Assignee | — |
| Priority | Medium |
| Target | 2026-08-16 |
| Ghi chú | Đã fix trong plan `260815-2154-backlog-bugs-fix` (2026-08-16): max 10 tài liệu intake-only, enforce ở `Cp1IntakeSchema` + FE `DocumentInputStep`; KHÔNG đụng `validateDocumentWriteInputs` (revision/supporter output giữ nguyên) |

## Acceptance Criteria (draft)
- [x] Giới hạn số tài liệu tối đa khi upload intake
- [x] Báo lỗi rõ ràng khi vượt giới hạn
