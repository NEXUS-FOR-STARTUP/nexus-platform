# Báo Cáo Tái Cấu Trúc Gói Dịch Vụ & Chiến Lược Định Giá Nexus Platform

- **Ngày lập:** 2026-09-04
- **Tác giả:** Solution Brainstormer
- **Mục đích:** Tổng hợp căn cứ thực tế từ tài liệu dặn dò Demo Pitching, phân tích tính khả thi tài chính và thiết lập kế hoạch kỹ thuật chuyển dịch từ gói 39k sang mô hình 2 gói trả phí: **Gói 1 (AI-only >70k)** và **Gói 2 (Supporter + AI >100k)**.

---

## 1. Nguồn Tài Liệu Gốc (Source of Truth)

Hai file DOCX chứa nhận xét, bảng điểm và chỉ dẫn chiến lược trực tiếp từ Giám khảo/Mentor trước buổi Demo Pitching:
1. **`E:\FPT\Semester_7\EXE101\DEMO PITCHING\Tham khảo chuẩn bị demo pitching.docx`**
   - *Nội dung chính:* Bảng điểm hội đồng chấm thử 5 dự án. Nexus xếp hạng 5/5 (72/100 điểm) do doanh thu SOM quá nhỏ (chỉ 1,17 – 3,51 triệu VNĐ với giá 39.000đ/lần), bị coi là "bài tập sinh viên nhỏ lẻ" không có khả năng scale.
2. **`E:\FPT\Semester_7\EXE101\DEMO PITCHING\Tham khảo (2).docx`**
   - *Nội dung chính:* Lời dặn dò chi tiết của Giám khảo/Mentor yêu cầu tái cấu trúc phễu giá: bỏ mức giá 39.000đ vì "tự làm giảm giá trị chất xám", phân tách thành 2 gói trả phí (Gói tự động hóa AI và Gói Human + AI từ 199k–299k), chuyển con người từ người viết chính sang người kiểm duyệt cuối cùng (Final Reviewer).
3. **Các tài liệu liên quan trên Google Drive (`phungluuhoanglong@gmail.com`):**
   - `05_Nghien_Cuu_&_Tai_Lieu_Tham_Khao/04 Sản phẩm Nexus/GPT DOANH THU` (ID: `15WMeXhCmsvVk-3xhvpuHpUzvYmk-vJhewltyepIKHsA`)
   - `05_Nghien_Cuu_&_Tai_Lieu_Tham_Khao/04 Sản phẩm Nexus/Tài liệu chính dự án hướng bán dịch vụ/Nexus Startup Idea Refinement` (ID: `1ccUnx_92_ku7ce3s3WXUvHJ5tGcpUorxw3mdGotm0tk`)
   - `06 Ghi âm và Video/Tập pitching/DEMO PITCHING` (ID: `18PokpUu3weFZeIHbum9AT4Pw-AvmcwVw8qtZrHkJPS8`)
   - `06 Ghi âm và Video/Tập pitching/Thái - Meet 24.07_21:00_DanDoPitching/Transcript` (ID: `16Ut_OjRUDxt60o4CDutS60QFZLZJRC3wFAx21PREu3A`)

---

## 2. Bối Cảnh & Lý Do Tái Cấu Trúc (Tại Sao Phải Tăng Giá?)

1. **Mức giá 39.000 VNĐ cũ là tạm bợ**: Được sinh ra ở mốc 21/07/2026 (sau CP3) như một giải pháp tình thế để kích cầu thử nghiệm MVP, nhưng đã thất bại hoàn toàn khi đối diện hội đồng đầu tư tại Demo Day.
2. **Nghịch lý tài chính**: 
   - Với 30–45 nhóm/năm, giá 39k chỉ đem lại tổng doanh thu 1,17 – 3,51 triệu VNĐ $\rightarrow$ Không thể chi trả tiền server, API, nói gì đến thù lao supporter hay duy trì đội ngũ sáng lập.
   - Thù lao một supporter thẩm định case thực tế là **80.000 VNĐ/giờ** (theo P&L CP4). Thu 39.000 VNĐ/case đồng nghĩa với việc Nexus đang bù lỗ tiền túi cho mỗi case có người đọc duyệt.
3. **Vòng đời khách hàng ngắn**: Sinh viên thi xong là bỏ, chi phí thu hút khách hàng (CAC) qua marketing/fanpage không bù nổi nếu chỉ thu 39.000 VNĐ.

---

## 3. Thiết Kế 2 Gói Dịch Vụ Mới

```
                       ┌──────────────────────────────────────────────┐
                       │          PHỄU SẢN PHẨM NEXUS PLATFORM        │
                       └──────────────────────────────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
       ┌─────────────────────────┐                         ┌─────────────────────────┐
       │   GÓI 1: BASIC AUDIT    │                         │  GÓI 2: PREMIUM AUDIT   │
       │     (100% AI Auto)      │                         │     (Human + AI)        │
       ├─────────────────────────┤                         ├─────────────────────────┤
       │ • Giá: 79.000 VNĐ       │                         │ • Giá: 149.000 VNĐ      │
       │ • SLA: Tức thì (1 phút) │                         │ • SLA: 24h - 48h        │
       │ • AI Diagnostic Report  │                         │ • Mentor duyệt & ký     │
       │ • Bỏ qua hàng chờ       │                         │ • Ưu tiên sửa lỗi       │
       └─────────────────────────┘                         └─────────────────────────┘
```

### A. Gói 1: AI-Automated Report (Gói Cơ Bản / Tốc Hành)
- **Mã hệ thống đề xuất:** `pkg_ai_audit`
- **Mức giá niêm yết:** **79.000 VNĐ / lượt** *(Chia cho nhóm 4–5 SV: ~16.000 – 19.000 VNĐ/người)*.
- **Bản chất thực thi:** **Tự động hóa 100% bằng AI**.
  - Sinh viên gửi intake $\rightarrow$ AI pipeline quét toàn bộ tài liệu theo rubric FPTU $\rightarrow$ Phát hiện lỗi logic, cấu trúc, điểm mơ hồ, giả định thiếu căn cứ $\rightarrow$ Tự động xuất PDF report ngay lập tức.
- **SLA:** Giao bài tức thì (30 giây – 1 phút). Phục vụ hoàn hảo cho các nhóm "nước đến chân mới nhảy" sát giờ nộp bài.
- **Biên lợi nhuận gộp:** **>95%** (Chi phí API LLM ~2.000 VNĐ/report).

### B. Gói 2: Supporter Verified + AI (Gói Chuyên Sâu / Đồng Hành)
- **Mã hệ thống đề xuất:** `pkg_supporter_audit`
- **Mức giá niêm yết:** **149.000 VNĐ / lượt** *(Chia cho nhóm 4–5 SV: ~30.000 – 37.000 VNĐ/người)* (hoặc **199.000 VNĐ** nếu kèm meeting/re-review).
- **Bản chất thực thi:** **Human + AI Collaboration (Quy tắc con người làm Final Reviewer)**.
  - Sinh viên nộp tài liệu $\rightarrow$ AI tạo bản thảo phân tích chi tiết (Draft Report) theo rubric $\rightarrow$ Chuyển lên Supporter Dashboard.
  - Supporter/Mentor dành 10–15 phút đọc duyệt, đối chiếu thực tế, chỉnh sửa các nhận xét ảo giác của AI, xếp thứ tự ưu tiên các lỗi cần sửa gấp $\rightarrow$ Ký duyệt và xuất bản báo cáo chính thức.
- **SLA:** 24 giờ – 48 giờ.
- **Biên lợi nhuận gộp:** **46% – 60%** (Thu 149.000 VNĐ, trả thù lao supporter 80.000 VNĐ $\rightarrow$ Lợi nhuận gộp 69.000 VNĐ/case; thu 199.000 VNĐ $\rightarrow$ Lợi nhuận gộp 119.000 VNĐ/case).

---

## 4. Hiện Trạng Codebase & Các Điểm Nghẽn Kỹ Thuật Cần Gỡ Bỏ

| Vị trí | Điểm nghẽn hiện tại | Yêu cầu thay đổi |
| :--- | :--- | :--- |
| **`prisma/schema.prisma`** | Bảng `ServicePackage` chỉ có 2 gói `pkg_tf_free` (0đ) và `pkg_tf_audit` (39k). | Bổ sung `pkg_ai_audit` (79k) và `pkg_supporter_audit` (149k/199k) vào seed & DB. |
| **`apps/api/.../upgrade-package.usecase.ts`** | Dòng 10: `const ALLOWED_UPGRADE_TARGET = "pkg_tf_audit";` (Khóa cứng chỉ cho nâng lên 39k). | Mở rộng cho phép nâng cấp lên bất kỳ package active nào. |
| **`apps/api/.../create-order.usecase.ts`** | Dòng 65: `if (item.service_type === CREDIT_AUDIT_SERVICE)` (Chỉ hỗ trợ duy nhất 1 loại dịch vụ). | Hỗ trợ phân biệt loại credit hoặc gắn `package_id` linh hoạt vào item order. |
| **`apps/api/.../case-machine.ts`** | Quy trình case luôn giả định có bước triage & chờ supporter nhận case. | Với `pkg_ai_audit`: Trigger AI Worker sinh report xong thì auto-transition sang `delivered` ngay lập tức. |
| **`apps/web-1/lib/pricing.ts` & Landing** | Hardcode link `/dashboard/intake?packageId=pkg_tf_audit` khắp UI. | Thay bằng bảng so sánh 2 gói dịch vụ minh bạch (Pricing Comparison Cards). |

---

## 5. Lộ Trình Triển Khai Kỹ Thuật (Cutover Plan)

1. **Giai đoạn 1: Database & Seed Update**
   - Tạo migration/seed cập nhật danh mục `ServicePackage`: kích hoạt `pkg_ai_audit` (79.000đ) và `pkg_supporter_audit` (149.000đ); lưu trữ gói `pkg_tf_audit` cũ.
2. **Giai đoạn 2: Backend Logic Refactor**
   - Gỡ bỏ `ALLOWED_UPGRADE_TARGET` hardcode trong `upgrade-package.usecase.ts`.
   - Bổ sung luồng `auto_delivery` cho Case sử dụng gói AI thuần (bỏ qua bước gán supporter thủ công).
3. **Giai đoạn 3: Frontend Pricing & Checkout UX**
   - Xây dựng component bảng giá (Pricing Matrix) hiển thị rõ sự khác biệt giữa AI Report (79k - nhận ngay) và Human + AI Report (149k - có mentor FPT duyệt).
   - Tối ưu luồng checkout: sinh mã QR động thanh toán trực tiếp đơn hàng thay vì bắt buộc nạp ví thủ công qua nhiều bước.
