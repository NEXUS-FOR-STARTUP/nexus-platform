# Phase 03: bàn giao audit + giới hạn lượt

> Trạng thái: xong (Main làm trực tiếp: xoá mục 2 khỏi team_fit_report.md; helper team-fit-rate-limit 10 lượt/10 phút + test 5 case; gắn vào POST /team-fit trước khi gọi AI; xoá CaseOverviewTab chết; cập nhật docs/flows/team-fit-flow.md; tsc 3 workspace sạch, test 15/15 pass).

## File sửa

- `omp-audit-coordinator.ts` (chỗ dựng `team_fit_report.md`) — bỏ mục kết quả AI, giữ 2 mục còn lại
- Mới: helper giới hạn lượt, copy mẫu `password-rate-limit.ts` / `message-send-rate-limit.ts`
- Route AI team-fit — kiểm tra lượt trước khi gọi AI

## Các bước

1. File giao cho buổi audit 79k bỏ mục "Kết quả đánh giá sơ bộ". Người chấm đọc bài với đầu óc trắng.
2. Giới hạn N lượt mỗi tài khoản trong một khoảng thời gian, N để trong cấu hình. Map trong bộ nhớ, kiểm tra trước khi gọi AI, quá thì báo rõ bằng tiếng Việt. Có hàm reset cho test. Không thêm bảng mới.

## Test (node:test, apps/api)

- Lượt thứ N+1 bị chặn (mục này bản cũ có, đã khôi phục).
- Xem lại kết quả đã lưu không tính lượt.
- Reset hoạt động giữa các test.

## Xong khi

- [ ] File audit không còn mục kết quả AI bản free
- [ ] Quá lượt báo rõ tiếng Việt; test pass
