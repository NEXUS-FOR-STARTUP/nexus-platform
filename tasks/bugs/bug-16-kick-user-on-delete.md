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
| Status | Done |
| Assignee | — |
| Priority | Medium |
| Target | 2026-08-16 |
| Ghi chú | Đã fix trong plan `260815-2154-backlog-bugs-fix` (2026-08-16): `delete-case.usecase.ts` sau deleteCase → `publishToChannel(chat:{caseId}, {type:'case_deleted', caseId})`; FE `useRealtimeChat.ts` nhánh `case_deleted` (toast + redirect /dashboard + invalidate); fallback poll `useCaseDetails` 404 → redirect |

## Acceptance Criteria (draft)
- [x] User bị kick/redirect khi admin xóa hồ sơ đang xem
- [x] Không hiển thị trạng thái sai sau khi case bị xóa
