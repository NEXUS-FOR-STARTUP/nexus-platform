# GA-02: Xác minh code + chốt intake flow (case kẹt `intake_ready` khi thanh toán trước khi nộp)

- **ID:** GA-02
- **Priority:** P0 (Khẩn cấp)
- **Status:** Done
- **Assignee:** Phùng Lưu Hoàng Long
- **Nguồn:** `docs/research/decision-2026-08-25-intake-payment-stage-separation.md`
- **Plan:** `plans/250825-2100-ga02-intake-flow-fix/`

---

## 1. Mô tả vấn đề
Case được người dùng thanh toán trước khi nộp hồ sơ (`payment_status: paid`) có nguy cơ bị kẹt vĩnh viễn ở trạng thái `intake_ready` thay vì tự động hoặc cho phép chuyển tiếp sang `submitted`. Người dùng đã trả tiền nhưng hồ sơ không thể tiến triển vào hàng đợi triage của Admin; flow intake còn 5 câu hỏi mở (Q1–Q5) về luồng chưa được chuẩn hóa.

## 2. Giải pháp thực hiện
- Chốt 5 câu hỏi kiến trúc Q1–Q5 trong tài liệu quyết định `docs/research/decision-2026-08-25-intake-payment-stage-separation.md`.
- Phân tách rành mạch hai trục trạng thái: `payment_status` (`unpaid`/`paid`/`not_required`) và `internal_status` (`intake_pending`/`intake_ready`/`submitted`).
- Trong `case-transition.service.ts`: Khi hồ sơ ở `intake_ready` và người dùng bấm nộp intake form $\rightarrow$ transition hợp lệ sang `submitted`.
- Đảm bảo admin triage chỉ hiển thị case đã sẵn sàng (`submitted`) và lọc riêng bucket `intake_pending`.

## 3. Bằng chứng mã nguồn & Kiểm thử (Evidence)
- Backend: `apps/api/src/services/case-transition.service.ts`, `apps/api/src/modules/cases/domain/case.types.ts`.
- Test suite: `apps/api/src/shared/infrastructure/tests/phase-09-intake-stuck-fix.test.ts` (7/7 pass).
- Báo cáo: `plans/250825-2100-ga02-intake-flow-fix/reports/reviewer.md` (APPROVED).
- Pull Request: https://github.com/NEXUS-FOR-STARTUP/nexus-platform/pull/20.
