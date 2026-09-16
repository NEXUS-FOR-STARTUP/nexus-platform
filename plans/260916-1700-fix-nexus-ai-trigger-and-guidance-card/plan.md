# Plan: Fix Nghẽn Luồng Kích Hoạt Nexus AI & Tối Ưu Hóa Giao Diện Case Submitted

**Mã kế hoạch:** `plans/260916-1700-fix-nexus-ai-trigger-and-guidance-card/plan.md`  
**Trạng thái:** `pending`  
**Ngày tạo:** 16/09/2026  
**Dựa trên Báo cáo:** `plans/reports/260916-brainstorm-nexus-ai-trigger-and-guidance-card.md`  
**Tiêu chuẩn sản xuất (Production Standards):** Không `TODO`/`FIXME`, Type-safe 100%, Xử lý triệt để lỗi Transaction Postgres, Không nuốt lỗi.

---

## Mục tiêu Kế hoạch

1. **Khắc phục triệt để lỗi Transaction Abort tại Backend** (`omp-audit-coordinator.ts`):
   - Loại bỏ việc tái sử dụng `previousStartedAt` khiến Postgres gặp lỗi `P2002` dẫn đến abort transaction block.
   - Luôn mint `startedAt` mới cho các lượt thẩm định retry/resubmit, trừ 1 credit sạch sẽ (vì credit cũ đã được hoàn lại khi fail).
   - Đảm bảo job được chuyển sang `queued` và case chuyển sang `under_review` ngay khi nộp intake thành công.
2. **Chuẩn hóa Giao diện Status Guidance Card** (`StatusGuidanceCard.tsx` & `statusCopyMap.ts`):
   - Phân nhánh thông điệp tại stage `submitted` theo gói dịch vụ (`package_id`).
   - Gói 79k (`pkg_ai_audit`): Hiển thị thông báo đang chờ xử lý bởi Nexus AI (kết quả trong ít phút), dứt khoát không nhắc đến Supporter hay việc phân công.
   - Gói 149k (`pkg_supporter_audit`): Giữ nguyên thông báo phân công Supporter chuyên môn trong 24h-48h.
3. **Bổ sung Unit Test & Xác minh trên Production DB**:
   - Kiểm tra không hồi quy, đảm bảo case `NX-469518` có thể kích hoạt lại thẩm định trơn tru.

---

## Phân rã Các Phase Thực Hiện

### Phase 1: Sửa Backend Transaction & Kích hoạt AI (`apps/api`)
- **Tập tin:** `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts`
- **Nội dung:**
  1. Loại bỏ logic `sameTriggerIntent` tái sử dụng `previousStartedAt`.
  2. Bỏ khối `try/catch` bọc `createCreditEntry` vô hiệu trong Postgres transaction.
  3. Cải thiện logging trong `submit-intake.usecase.ts` để ghi nhận chính xác trạng thái trigger.
- **Tập tin chi tiết:** `phase-01-backend-ai-trigger-transaction.md`

### Phase 2: Sửa Frontend Status Guidance Card theo Gói Dịch Vụ (`apps/web-1`)
- **Tập tin:**
  - `apps/web-1/app/dashboard/case/[id]/_components/statusCopyMap.ts`
  - `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`
- **Nội dung:**
  1. Thêm cấu hình copy cho AI package (`pkg_ai_audit`) ở stage `submitted`.
  2. Cập nhật `StatusGuidanceCard.tsx` để truyền và nhận diện `isAiOnlyPackage` hoặc `package_id`.
- **Tập tin chi tiết:** `phase-02-frontend-status-guidance-adaptation.md`

### Phase 3: Kiểm thử, Xác minh & Regression Test (`Verification`)
- **Nội dung:**
  1. Viết unit test cho trigger retry flow trong `apps/api/src/shared/infrastructure/tests/omp-audit-trigger.test.ts`.
  2. Chạy `bun run check-types` toàn bộ monorepo (0 error).
  3. Chạy test suite `bun run --filter nexus-platform-api test`.
- **Tập tin chi tiết:** `phase-03-verification-and-testing.md`
