# Journal: Hoàn thành Chính sách Kinh doanh & Vận hành (GA-15 & GA-16)

- **Ngày thực hiện:** 2026-08-30
- **Nhiệm vụ:** GA-15 (Chính sách Credit & Hoàn tiền) & GA-16 (Taxonomy Đóng Case, Auto-priority & Giới hạn gói Free)
- **Tác giả:** Phùng Lưu Hoàng Long / AI Assistant
- **Trạng thái:** Hoàn thành 100%

---

## 1. Bối cảnh & Mục tiêu

Sau khi hoàn thành bộ khung pháp lý ToS & Privacy Policy (`GA-12`), dự án cần tiếp tục hoàn thiện 2 bộ quy chế nền tảng:
1. **GA-15 (Kinh doanh & Tài chính):** Chốt vòng đời Credit (hết hạn, hoàn tiền, rút tiền, chuyển nhượng).
2. **GA-16 (Vận hành & Kỹ thuật):** Chuẩn hóa 7 mã lý do đóng case, thuật toán tính điểm ưu tiên tự động và hạn mức sử dụng công bằng gói phân tích ý tưởng miễn phí.

---

## 2. Kết quả & Văn bản ban hành

### A. Chính sách Vòng đời Credit & Hoàn tiền (`POL-BUS-01`)
- **Tài liệu:** [`docs/policies/credit-lifecycle-and-refund-policy.md`](../policies/credit-lifecycle-and-refund-policy.md)
- **Quyết định cốt lõi:**
  - **Ví VND:** Số dư bảo toàn vĩnh viễn, không hết hạn.
  - **Credit trả phí:** Hạn sử dụng **12 tháng (365 ngày)**; gửi cảnh báo trước 30 ngày và 7 ngày.
  - **Hoàn tiền 100% tự động về ví:** Khi Admin Veto, Supporter vi phạm SLA hoặc sinh viên hủy trước khi review.
  - **Rút tiền VND:** Hỗ trợ rút về tài khoản ngân hàng chính chủ (xử lý 3-5 ngày).
  - **Chuyển nhượng:** Không chuyển giữa các tài khoản cá nhân độc lập; dùng chung trong cùng nhóm Case.

### B. Quy chế Vận hành, Taxonomy & Fair-Use (`POL-OPS-02`)
- **Tài liệu:** [`docs/policies/operational-taxonomy-and-fair-use-policy.md`](../policies/operational-taxonomy-and-fair-use-policy.md)
- **Quyết định cốt lõi:**
  - **7 mã lý do đóng case:** `STUDENT_REQUEST`, `INACTIVE_TIMEOUT`, `DUPLICATE_CASE`, `INSUFFICIENT_DATA`, `OUT_OF_SCOPE`, `VIOLATION_POLICY`, `OTHER` (kèm quy định xử lý hoàn tiền minh bạch).
  - **Thuật toán Auto-priority Score:**
    $$\text{PriorityScore} = W_{\text{tier}} + W_{\text{wait}} + W_{\text{deadline}} + W_{\text{revision}}$$
    Phân loại mức độ: `CRITICAL` ($\ge 180$), `HIGH` ($120-179$), `MEDIUM` ($60-119$), `LOW` ($< 60$).
  - **Chính sách Fair-Use gói Free:** Tối đa **3 lần** tạo đánh giá Team-Idea Fit miễn phí (`pkg_tf_free`) trên mỗi tài khoản để tránh lạm dụng và bảo vệ chi phí API OpenAI/Gemini.

---

## 3. Cập nhật Tracker & Trạng thái

- Cập nhật `GA-15` và `GA-16` từ `Todo` sang `Done` trong [`tasks/gap-analysis-tasks.md`](../../tasks/gap-analysis-tasks.md) và [`tasks/README.md`](../../tasks/README.md).
- Toàn bộ 3 task thuộc mảng Policy (`GA-12`, `GA-15`, `GA-16`) đã hoàn thành trọn vẹn và nhất quán với Điều khoản Dịch vụ công khai.
