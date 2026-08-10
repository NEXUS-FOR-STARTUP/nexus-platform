# Bug 16: Không kick user khi admin xóa hồ sơ

## Thông tin gốc (Google Docs)

> [page hồ sơ ở user] lỗi không kick khứa user ra nếu admin xóa hồ sơ

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | State sync: xử lý case bị xóa |
| Effort | **M** |
| Độ phức tạp | Trung bình: theo dõi deleted status → redirect/clear state |
| Dependency | #11 (realtime đã Done — tận dụng) |
| Quyết định cần | Nhỏ |
| Vùng code | `apps/web-1/app/dashboard/case/[id]/` — case page + realtime subscription |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | Medium |
| Target | — |
| Ghi chú | User vẫn ở trang hồ sơ khi admin xóa → phải kick/redirect |

## Acceptance Criteria (draft)
- [ ] User bị kick/redirect khi admin xóa hồ sơ đang xem
- [ ] Không hiển thị trạng thái sai sau khi case bị xóa
