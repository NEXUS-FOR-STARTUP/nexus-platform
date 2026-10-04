# 79k Dual Credit & Report Versioning

**Date**: 2026-09-12 11:00  
**Status**: Resolved  
**Scope**: Backend Billing, Credit Ledger, Reports, Frontend Workspace  
**Plan**: `plans/260912-1100-79k-dual-credit-and-report-versioning/plan.md`  

---

## 1. What Happened

Gói 79k trước đây cấp 1 credit tương ứng 1 lượt audit AI. Định hướng kinh doanh mới nâng cấp gói 79k lên 2 lượt đánh giá AI (1 lượt ban đầu + 1 lượt sau khi sửa). Đồng thời, hệ thống cần hỗ trợ lưu trữ báo cáo theo phiên bản (versioning) thay vì ghi đè (`upsert`), và bỏ giới hạn thời gian 24h để sinh viên tự do sử dụng lượt đánh giá.

## 2. Technical Decisions

1. **Cơ chế 2 Credits Tinh giản**:
   - Gói 79k cấp thẳng 2 credits vào ví case, fungible, không phân biệt lượt 1 hay lượt 2.
   - Tránh lỗi trừ tiền gấp đôi: Giữ `Order.quantity = 1 gói`, lưu số lượng credit được cấp (`credits_granted: 2`) trong `metadata_json` của package.
2. **Report Versioning (Create thay vì Upsert)**:
   - Mỗi lần chạy AI audit tạo 1 record `reports` mới, liên kết với `lifecycle_unit_id` tương ứng.
   - Tên file PDF được đánh số phiên bản (`v01`, `v02`...) chống ghi đè trên storage và CDN.
3. **Phân loại Submission & Prompt Routing**:
   - Khi trigger audit, sinh viên chọn 1 trong 3 loại: "Lần đầu" (`initial`), "Đã sửa" (`resubmit`), hoặc "Soi logic" (`logic_check`). Cả 3 loại đều tiêu tốn 1 credit.
   - Worker định tuyến system prompt phù hợp (`v4_1`, `v4_1_resubmit`, `v4_1_logic`).
4. **Hiển thị Lịch sử Đánh giá (Round History)**:
   - Tab Báo cáo trên web-1 hiển thị danh sách các lượt thẩm định đã chạy (`round_history`), cho phép sinh viên xem lại và tải PDF của từng phiên bản cũ.

## 3. Key Changes

- `apps/api/src/modules/packages/`: Cập nhật seed metadata gói 79k ghi nhận 2 credits.
- `apps/api/src/modules/orders/`: Tự động cộng 2 credits vào `credit_ledgers` khi đơn hàng 79k hoàn tất.
- `apps/api/src/modules/reports/`: Sửa hàm lưu báo cáo sang `prisma.report.create`, đánh version file PDF.
- `apps/web-1/`: Cập nhật modal mua hiển thị 2 lượt, thêm select loại thẩm định khi trigger audit, và component `RoundCard` hiển thị lịch sử các lần thẩm định.

## 4. Verification

- Mua gói 79k qua ví kiểm tra ví chỉ bị trừ đúng 79,000 VND và nhận đủ 2 credits.
- Chạy thẩm định 2 lần liên tiếp trên 1 case: sinh ra 2 records report riêng biệt, hiển thị đủ 2 rounds trên giao diện sinh viên.
- Typecheck toàn bộ workspace hoàn tất 0 lỗi.
