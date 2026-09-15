# Tiêu đề: Tách rời giao diện và lõi AI để triển khai nhanh bảng giá mới

## Bối cảnh (Context)
Dự án đang chịu áp lực phải cập nhật bảng giá và gói dịch vụ mới (từ 39k lên 79k và 149k) sau buổi demo pitching. Việc tái cấu trúc toàn bộ lõi AI (Triad Framework + Input Gate) và quy trình xử lý luồng trạng thái tốn nhiều thời gian và đòi hỏi sự tập trung cao. Tâm trạng và sự tỉnh táo hiện tại không thuận lợi cho việc xử lý các logic phức tạp này.

## Quyết định (Decision)
Áp dụng chiến lược "Visual First / UI-First" (Làm giao diện trước): Tách biệt hoàn toàn việc hiển thị gói mới trên Web ra khỏi logic xử lý AI ở Backend. Kế hoạch (đã lập tại `plans/260904-frontend-pricing-integration`) sẽ chỉ tập trung vào:
1. Seed database để có sẵn dữ liệu gói.
2. Dựng LandingPricing component trên Web.
3. Chỉnh sửa routing và CTA để người dùng có thể mua gói mới bình thường.

## Phân tích rủi ro & Cảm xúc (Reflection)
Quyết định này mang lại sự nhẹ nhõm lớn, tuân thủ đúng nguyên tắc KISS và Agile. Nhóm có thể thấy ngay kết quả trực quan (bảng giá xịn xò) để báo cáo tiến độ, trong khi hệ thống bên dưới vẫn chạy mượt mà (chỉ khác là các ca AI 79k sẽ tạm thời rơi vào hàng chờ thủ công do chưa lắp lõi tự động). Rủi ro duy nhất được Red Team chỉ ra là trải nghiệm UX khi chuyển hướng từ dashboard, điều này sẽ được fix gọn bằng modal hoặc default CTA.

## Bước tiếp theo (Next Steps)
- Thực thi kế hoạch giao diện (nấu code - cook).
- Sau đó, khi tinh thần sẵn sàng, sẽ tập trung toàn lực vào xử lý Point 4 (Core AI Engine).