# Quickfix Legacy Cutover & Frontend Null Contract

**Date**: 2026-09-15 15:30  
**Status**: Resolved  
**Scope**: Backend Orders/Reports, Frontend Pricing & RoundCard, Technical Notes  
**Plan**: `plans/260915-quickfix-legacy-cutover/plan.md`  

---

## 1. What Happened

Gói thẩm định 79k (`pkg_ai_audit`) thay thế gói cũ `pkg_tf_audit`. Tuy nhiên, codebase vẫn còn tồn đọng một số hằng số chết (`LEGACY_AUDIT_PACKAGE_KEY`), comment và docstring tham chiếu nhầm route cũ (`:reportId/pdf` thay vì `:reportId/download`), hợp đồng `submission_type: null` của các báo cáo cũ có thể khiến frontend hiển thị nhãn rỗng, và tài liệu mô hình tiền tệ còn ghi giá 39,000 VND cũ.

## 2. Technical Decisions

1. **Backend Dead Code & Docstring Cleanup (Phase 1)**:
   - Xoá hằng số chết `LEGACY_AUDIT_PACKAGE_KEY` khỏi `credit-audit-order.helpers.ts`.
   - Sửa comment `pkg_tf_audit` thành `pkg_ai_audit` trong `create-order.usecase.ts`.
   - Chuẩn hóa docstring `reports.controller.ts:344` trỏ đúng vào endpoint `GET /api/reports/:reportId/download`.
2. **Frontend Null Contract & Fallback (Phase 2)**:
   - Dọn sạch `pricing.ts`, loại bỏ các key không dùng, chỉ giữ `FREE`, `AI_AUDIT`, `SUPPORTER_AUDIT`.
   - Mở rộng type `RoundHistoryEntry.submission_type` chấp nhận `null` (`types/case.ts:125`).
   - `RoundCard.tsx` chuẩn hóa fallback: `const submissionType = round.submission_type || "initial";` đảm bảo không bao giờ render nhãn `null` cho các báo cáo cũ.
3. **Đồng bộ Tài liệu Giá**:
   - Cập nhật `docs/technical-notes/money-credit-completion-model-note.md`: Ghi nhận giá chuẩn 79,000 VND = 2 credits thay cho 39k.

## 3. Verification

- `check-types` trên cả frontend và backend đạt 100% không lỗi.
- Các báo cáo cũ có `submission_type: null` mở lên hiển thị nhãn "Lần đầu" chuẩn xác.
