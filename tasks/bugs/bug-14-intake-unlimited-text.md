# Bug 14: Intake lưu không giới hạn chữ

## Thông tin gốc (Google Docs)

> [trang intake ở user] có thể lưu không giới hạn chữ (cả API lẫn FE chẳng có validation cho phép lưu không giới hạn)

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Validation thiếu (FE + BE) |
| Effort | **M** |
| Độ phức tạp | Trung bình: thêm max-length validation cả API lẫn FE |
| Dependency | Không có |
| Quyết định cần | Giới hạn bao nhiêu ký tự? |
| Vùng code | Intake text fields — `apps/api` + `apps/web-1/app/dashboard/intake/` |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | Medium |
| Target | — |
| Ghi chú | Không có giới hạn ký tự ở cả 2 tầng — đơn giản, làm nhanh |

## Acceptance Criteria (draft)
- [ ] Giới hạn ký tự các field text trong intake (FE + BE)
- [ ] Báo lỗi/thông báo rõ khi vượt giới hạn
