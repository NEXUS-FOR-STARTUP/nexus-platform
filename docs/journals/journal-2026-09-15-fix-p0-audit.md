# Fix P0 Audit Pipeline: Guard, Race & Unit

**Date**: 2026-09-15 16:46  
**Status**: Resolved  
**Scope**: Backend AI Engine, Transaction Integrity, Credit Deduct  
**Plan**: `plans/260915-1646-fix-p0-audit/plan.md`  

---

## 1. What Happened

Sau khi triển khai gói 79k 2 credits, đợt kiểm toán hệ thống phát hiện 3 lỗi mức độ P0 tiềm ẩn nguy cơ mất dữ liệu và tiền bạc của người dùng:
1. **Lỗi T3+T4 (Finalizer Collision & PDF Overwrite)**: Finalizer bị gọi trùng khi kết hợp polling và queue event, dẫn đến việc upload PDF nhiều lần và ghi đè Cloudinary public ID.
2. **Lỗi T1 (Credit Race Condition)**: Kiểm tra số dư credit nằm ngoài database transaction; sinh viên bấm double click nhanh có thể trigger 2 job cùng lúc khi chỉ có 1 credit.
3. **Lỗi T2 (Lifecycle Unit Resolve)**: Finalizer tự tính lại `lifecycle_unit_id` ở thời điểm hoàn tất thay vì dùng đúng unit lúc tạo job, dẫn đến báo cáo bị gán sai phiên bản khi có thao tác chỉnh sửa hồ sơ xen giữa.

## 2. Technical Decisions

1. **Thứ tự Triển khai Nghiêm ngặt**: T3+T4 $\rightarrow$ T1 $\rightarrow$ T2. Giữ nguyên tính tương thích ngược của mọi exported functions.
2. **Guard Finalizer bằng Trạng thái Nguyên tử**:
   - Thêm trạng thái chuyển giao và idempotency key cho finalizer. Nếu job đã finalize hoặc đang trong quá trình finalize, các lời gọi lặp lại lập tức bị bỏ qua mà không throw error.
3. **Đưa Kiểm tra & Trừ Credit vào Bên trong Transaction (T1)**:
   - Toàn bộ chuỗi: Kiểm tra số dư credit $\rightarrow$ Trừ credit $\rightarrow$ Tạo record AI job được bọc trong 1 `prisma.$transaction` với idempotency key xác định.
4. **Truyền Cố định `lifecycleUnitId` qua Payload Job (T2)**:
   - Ghi nhận `lifecycle_unit_id` ngay tại thời điểm dispatch job vào `job.data`. Finalizer ưu tiên lấy trực tiếp từ payload job thay vì truy vấn lại từ DB.

## 3. Key Changes

- `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts`:
  - Thêm guard chống finalize lặp lại.
  - Bọc transaction nguyên tử khi trừ credit và tạo job.
  - Gắn `lifecycleUnitId` vào metadata của job gửi sang BullMQ.
- `apps/api/src/modules/ai-engine/application/omp-audit-finalizer.ts`:
  - Tiếp nhận `lifecycleUnitId` từ payload job, bảo đảm báo cáo gắn chính xác vào unit tương ứng.
- Commit tham chiếu: `545bdcb`.

## 4. Verification

- Kiểm thử chạy đồng thời (concurrency test) 2 request trigger audit với tài khoản chỉ còn 1 credit: hệ thống chỉ chấp nhận đúng 1 job, request thứ hai trả về lỗi thiếu credit rõ ràng.
- Giả lập dispatch 2 sự kiện hoàn tất song song: Finalizer chỉ chạy duy nhất 1 lần, Cloudinary chỉ upload 1 bản PDF.
- Báo cáo được liên kết chính xác với checkpoint và unit ID đã định.
