# Phase 3: Kiểm thử & Đảm bảo Không Hồi quy (Verification & Regression)

## 1. Mục tiêu
Xác minh toàn bộ luồng nộp hồ sơ, kiểm tra tính đúng đắn của Data Contract, trải nghiệm người dùng trên cả 2 gói và chạy toàn bộ test suite.

## 2. Các kịch bản kiểm thử (Test Scenarios)

### Kịch bản 1: Sinh viên nộp gói 79k (`pkg_ai_audit` - AI Audit)
1. Truy cập `/dashboard/intake?packageId=pkg_ai_audit`.
2. Kiểm tra giao diện:
   - Banner SLA hiển thị: "Kết quả thẩm định tự động hoàn tất trong vòng 1 phút".
   - Stepper chỉ có 6 bước (không xuất hiện bước "Nhu cầu hỗ trợ").
3. Điền các bước: Tình huống $\rightarrow$ Liên hệ $\rightarrow$ Bối cảnh dự án $\rightarrow$ Tài liệu $\rightarrow$ Phạm vi $\rightarrow$ Xác nhận.
4. Kiểm tra trang Xác nhận: Không hiển thị trường "Ghi chú cho Supporter".
5. Bấm nộp hồ sơ: Request gửi thành công (200/201), không có lỗi 400 validation.
6. Verify dữ liệu trong DB và case được chuyển sang trạng thái chờ xử lý bởi AI Worker.

### Kịch bản 2: Sinh viên nộp gói 149k (`pkg_supporter_audit` - Mentor Audit)
1. Truy cập `/dashboard/intake?packageId=pkg_supporter_audit`.
2. Kiểm tra giao diện:
   - Banner SLA hiển thị: "Thời gian phản biện: 24h–48h có Mentor chuyên môn đồng hành".
   - Stepper có đầy đủ 7 bước (bao gồm bước "Nhu cầu hỗ trợ").
3. Điền bình thường, chọn nhu cầu hỗ trợ cho Mentor, nộp bài thành công.

### Kịch bản 3: Danh mục tài liệu mới
1. Tại bước Upload tài liệu, kiểm tra dropdown phân loại tài liệu:
   - Đủ 5 loại: "Thuyết minh ý tưởng", "Slide thuyết trình", "Nghiên cứu thị trường", "Kế hoạch tài chính", "Tài liệu bổ sung".
   - Không còn chữ "Đề cương phân công".
   - Không còn dấu gạch chéo `/` hay ngoặc đơn `()`.
2. Upload thử 1 file PDF và 1 file Excel (`.xlsx`), phân loại và xác nhận lưu đúng vào `metadata_json`.

### Kịch bản 4: Kiểm tra hồi quy kỹ thuật (Automated Tests & Types)
1. Chạy test suite của backend:
   ```bash
   bun run --filter nexus-platform-api test
   ```
2. Chạy type checking toàn bộ repo:
   ```bash
   bun run check-types
   ```
3. Chạy linter:
   ```bash
   bun run lint
   ```
