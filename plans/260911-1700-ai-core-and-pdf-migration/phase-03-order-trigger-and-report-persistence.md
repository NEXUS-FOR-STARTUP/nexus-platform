# Phase 03: Dây nối Thanh toán & Lưu Báo cáo (Order Trigger & Report Persistence)
> **Trạng thái:** Completed (100% Hoàn thành)


## 1. Mục tiêu (Objective)
Kích hoạt tự động `omp-audit.service` ngay khi sinh viên hoàn tất thanh toán gói 79k, lưu toàn bộ kết quả thẩm định (`report.json` và Markdown) vào bảng `reports` của PostgreSQL và chuyển Case sang trạng thái hoàn tất để sinh viên xem kết quả.

---

## 2. Quyền Sở hữu File (File Ownership)
- `apps/api/src/modules/orders/application/create-order.usecase.ts` (Nhúng `case_id` vào event `ORDER_PAID`)
- `apps/api/src/modules/orders/application/credit-audit-order.helpers.ts` (Định nghĩa gói `pkg_ai_audit` 79.000đ)
- `apps/api/src/modules/ai-engine/application/ai-audit-order.listener.ts` (Lắng nghe `ORDER_PAID`, gọi `runOmpAudit`, lưu DB)
- `apps/api/src/modules/reports/http/reports.routes.ts` (Endpoint tải PDF: `GET /reports/:id/pdf`)
- `apps/api/src/index.ts` (Đăng ký listener khi server khởi động)

---

## 3. Các Bước Triển khai Chi tiết (Step-by-Step Implementation)

### Bước 3.1: Bổ sung Dữ liệu vào Outbox Event `ORDER_PAID`
Trong `create-order.usecase.ts`, đưa `caseId` vào top-level payload của Outbox Event để listener bắt được ngay lập tức:
```ts
const targetCaseId = (resolvedItems.find(i => i.item.service_type === CREDIT_AUDIT_SERVICE)?.item.metadata_json as any)?.case_id;

await insertOutboxEvent(tx, {
  event_type: DOMAIN_EVENTS.ORDER_PAID,
  payload_json: {
    orderId: order.id,
    userId,
    totalAmount,
    caseId: targetCaseId,
    items: resolvedItems.map(({ item, unitPrice }) => ({
      service_type: item.service_type,
      quantity: item.quantity,
      unit_price: unitPrice,
      metadata_json: item.metadata_json,
    })),
  },
});
```

### Bước 3.2: Xây dựng Listener Kích hoạt OMP (`ai-audit-order.listener.ts`)
```ts
import { onEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { runOmpAudit } from "../omp-audit.service.js";
import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";

export function initAiAuditOrderListener(): void {
  onEvent(DOMAIN_EVENTS.ORDER_PAID, async (event) => {
    const { orderId, caseId } = event.payload as any;
    if (!caseId) return;

    logger.info({ orderId, caseId }, "AI Audit Listener triggered. Starting OMP process...");

    try {
      // 1. Lấy thông tin Case và các file đã upload
      const caseRecord = await prisma.case.findUnique({
        where: { id: caseId },
        include: { documents: true, lifecycle_units: true },
      });
      if (!caseRecord) return;

      // Cập nhật trạng thái đang xử lý
      await prisma.case.update({
        where: { id: caseId },
        data: { user_facing_stage: "under_review", internal_status: "supporter_working" },
      });

      // 2. Thu thập file input (nội dung form + file đính kèm)
      const inputFiles: Array<{ name: string; content: string | Buffer }> = [];
      const intakeUnit = caseRecord.lifecycle_units.find(u => u.unit_type === "intake_form");
      if (intakeUnit) {
        inputFiles.push({ name: "intake_submission.md", content: intakeUnit.content });
      }

      for (const doc of caseRecord.documents) {
        if (doc.download_url) {
          try {
            const res = await fetch(doc.download_url);
            if (res.ok) {
              const buf = Buffer.from(await res.arrayBuffer());
              inputFiles.push({ name: doc.file_name, content: buf });
            }
          } catch (e) {
            logger.warn({ docId: doc.id }, "Failed to fetch document file");
          }
        }
      }

      // 3. Khởi chạy OMP Audit Service
      const result = await runOmpAudit({
        caseId,
        projectName: caseRecord.title,
        inputFiles,
      });

      // 4. Lưu kết quả vào bảng Report
      const payloadToStore = JSON.stringify({
        ...result.reportJson,
        reportMarkdown: result.reportMarkdown,
      });

      await prisma.report.create({
        data: {
          case_id: caseId,
          checkpoint_id: "cp1",
          report_type: "input_clarification",
          content_md: payloadToStore,
          status: "APPROVED",
          created_by: "omp_worker",
        },
      });

      // 5. Chuyển trạng thái Case sang Hoàn tất Báo cáo
      await prisma.case.update({
        where: { id: caseId },
        data: { user_facing_stage: "report_ready", internal_status: "report_ready_to_publish" },
      });

      logger.info({ caseId }, "AI Audit finished and report published successfully!");
    } catch (err: any) {
      logger.error({ caseId, err }, "AI Audit failed!");
      await prisma.case.update({
        where: { id: caseId },
        data: {
          metadata_json: { ai_audit_error: err?.message || "Failed to process" },
        },
      });
    }
  });
}
```

### Bước 3.3: Endpoint Tải Báo cáo PDF (`reports.routes.ts`)
- Thêm route `GET /api/reports/:id/pdf` (hoặc `GET /api/cases/:caseId/report/pdf`):
  - Kiểm tra nếu đã có file PDF sẵn trong `storage/jobs/:caseId/output/report.pdf`, trả về ngay lập tức.
  - Nếu chưa có, gọi `compileMarkdownToTypstPdf` từ `content_md` và trả về dạng file tải về (`Content-Type: application/pdf`).

---

## 4. Tiêu chí Chấp thuận (Verification)
- Kích hoạt sự kiện `ORDER_PAID` $\rightarrow$ OMP chạy tự động $\rightarrow$ Kết quả được lưu vào bảng `reports`.
- Case chuyển sang trạng thái `report_ready`.
- Truy cập `GET /api/reports/:id/pdf` tải về file PDF hợp lệ.
