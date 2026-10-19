# QA cuối (2026-10-19)

## Đã chạy
- `bun run check-types` (web-1): sạch.
- `eslint --max-warnings 0` trên toàn bộ file đã đổi/mới (83 file, gồm untracked): sạch.
- Script tạm (đã xóa, web-1 không có runner): `formatVndAmount` (6 ca), `parseStageView`, `filterCreditEntries`/`countByType`, `groupEventsByDay` (ranh giới 00:00 giờ VN, mới nhất trước): pass.
- taste `lint.mjs` trên file đã đổi: 7 FAIL hairline (sidebar `border-right` theo mockup; `border-t`/`w-px` ở `CaseDeleteSection`, `CreditBalanceCard` là file cũ), 10 WARN đã biết.

## Chưa chạy
- Smoke trình duyệt (cần đăng nhập): ma trận `?tab=&stage=&view=` ở 1440/768/390, sáng/tối, trạng thái chặn/mở khóa, tải lên, chấm bài.
- Script kiểm `document-groups`, `result-runs`, `describeGradingState`, `countMissingProfileFields`.
- Không có `tester`/`code-reviewer` subagent (chủ dự án yêu cầu không gọi agent).
- Xác nhận route `/api/reports/:id/download?view=inline` ở API.

## Khoảng trống đã ghi
Xem `gap-register.md` C-37 đến C-39.
