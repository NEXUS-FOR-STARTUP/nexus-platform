# Journal: Kế hoạch triển khai chế độ bảo trì toàn trang web (Website Maintenance Mode)

- **Ngày:** 2026-09-08
- **Tác giả:** Solution Brainstormer / Planner
- **Chủ đề:** Giải pháp gác cổng bảo trì toàn diện trang web khi tái cấu trúc gói dịch vụ thu phí.

## Quyết định & Bối cảnh

1. **Bối cảnh:** Nhóm phát triển đang trong giai đoạn cập nhật, chỉnh sửa lại các gói thu phí và thanh toán, cần tạm ngắt truy cập của người dùng để tránh tạo giao dịch hoặc dữ liệu phát sinh.
2. **Quyết định kiến trúc:**
   - Sử dụng biến cấu hình môi trường `NEXT_PUBLIC_MAINTENANCE_MODE="true" | "false"`.
   - Điều hướng thông qua cơ chế gác cổng `apps/web-1/proxy.ts` của Next.js 16.
   - Tránh tuyệt đối việc tạo bảng trong database để lưu trạng thái này nhằm đảm bảo tính an toàn dữ liệu và giữ cho trang bảo trì hoạt động ổn định kể cả khi cơ sở dữ liệu có ngắt kết nối.

