# GA-15: Chốt chính sách vòng đời Credit (Hết hạn, Hoàn tiền, Chuyển nhượng)

- **ID:** GA-15
- **Priority:** P2
- **Category:** Policy (Kinh doanh)
- **Type:** Policy / Non-technical (Quyết định chính sách hạn dùng, hoàn tiền, chuyển credit)
- **Status:** Done
- **Assignee:** Phùng Lưu Hoàng Long
- **Completed Date:** 2026-08-30
- **Evidence:** `docs/policies/credit-lifecycle-and-refund-policy.md`; `apps/web-1/app/terms/page.tsx` (Điều 5, 6, 7); `docs/research/brainstorm-2026-08-30-policy-legal-compliance-ga12.md`
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`, `docs/backlog/credit-du-tru-account-level.md §7`

---

## 1. Mô tả vấn đề
Hệ thống tính điểm tín dụng (Credit) để sử dụng dịch vụ tư vấn và xuất báo cáo. Hiện tại:
- Chưa có quy định rõ ràng credit có thời hạn sử dụng (expiration) hay tồn tại vĩnh viễn.
- Chưa có chính sách hoàn tiền credit khi người dùng không còn nhu cầu sử dụng (hiện chỉ có hoàn tiền khi admin veto/hủy case).
- Chưa có cơ chế chuyển nhượng hoặc gộp credit giữa các thành viên trong cùng một dự án khởi nghiệp.
- Thiếu các quy định này tiềm ẩn rủi ro tranh chấp tài chính khi vận hành thương mại quy mô lớn.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Quyết định chính sách (Business Decision):**
   - Hạn sử dụng credit: Không hết hạn hay có hiệu lực trong 12 tháng kể từ ngày mua?
   - Chính sách hoàn credit thành tiền VND: Cho phép hoàn hay không hoàn tiền sau khi đã mua?
   - Chuyển nhượng credit: Cho phép chuyển credit giữa các thành viên trong cùng nhóm case hay không?
2. **Kỹ thuật (Sau khi chốt chính sách):**
   - Bổ sung trường `expires_at` vào bảng ghi nhận gói credit (nếu có hạn dùng).
   - Xây dựng cron sweep cảnh báo người dùng trước khi credit hết hạn 30 ngày.
   - Thêm tài liệu hướng dẫn chính sách credit công khai cho sinh viên và đối tác.
