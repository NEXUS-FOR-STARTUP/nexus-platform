# GA-16: Chuẩn hóa Taxonomy Admin: Lý do đóng Case, Auto-priority & Giới hạn gói Free

- **ID:** GA-16
- **Priority:** P2
- **Category:** Policy (Vận hành)
- **Type:** Policy / Non-technical (Ban hành danh mục lý do đóng case & quy chế gói free)
- **Status:** Done
- **Assignee:** Phùng Lưu Hoàng Long
- **Completed Date:** 2026-08-30
- **Evidence:** `docs/policies/operational-taxonomy-and-fair-use-policy.md`; 7 mã lý do đóng case (`STUDENT_REQUEST`, `INACTIVE_TIMEOUT`, `DUPLICATE_CASE`, `INSUFFICIENT_DATA`, `OUT_OF_SCOPE`, `VIOLATION_POLICY`, `OTHER`); thuật toán Auto-priority Score; Fair-use policy giới hạn 3 lần miễn phí Team-Fit
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`, `docs/flows/case-lifecycle-flow.md`

---

## 1. Mô tả vấn đề
Trong luồng vận hành của Admin và Supporter:
1. **Lý do đóng case:** Khi Admin đóng/hủy case, lý do được nhập dạng text tự do, chưa có danh mục chuẩn hóa (taxonomy enum/code) để phục vụ thống kê phân loại nguyên nhân thất bại.
2. **Auto-priority:** Chưa có thuật toán tự động tính mức độ ưu tiên của case (dựa trên SLA sắp hết hạn, số credit đã mua, hoặc số ngày chờ duyệt).
3. **Giới hạn gói miễn phí:** Chưa có cơ chế giới hạn số lần người dùng/nhóm được tạo báo cáo đánh giá Team-Idea Fit miễn phí (`pkg_tf_free`), dẫn tới nguy cơ bị lạm dụng spam tài nguyên AI.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Taxonomy Enum Lý do đóng Case:**
   - Chuẩn hóa các mã lý do: `STUDENT_REQUEST`, `INACTIVE_TIMEOUT`, `DUPLICATE_CASE`, `INSUFFICIENT_DATA`, `OUT_OF_SCOPE`, `VIOLATION_POLICY`, `OTHER`.
2. **Auto-priority Score:**
   - Công thức tính điểm ưu tiên dựa trên: Thời gian ở trạng thái hiện tại, gói dịch vụ (Paid > Free), và SLA của Supporter.
3. **Giới hạn gói Free:**
   - Giới hạn mỗi tài khoản tối đa $N$ lần (ví dụ: 3 lần) tạo hồ sơ đánh giá miễn phí; từ lần thứ 4 bắt buộc nâng cấp hoặc dùng credit.
