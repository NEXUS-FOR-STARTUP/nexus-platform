# Phase 3: Controller & Tuyến đường API Backend

**Tập tin mục tiêu:**
1. `apps/api/src/modules/admin/http/admin-workers.controller.ts`
2. `apps/api/src/modules/admin/http/admin.routes.ts`

---

## 1. Controller `admin-workers.controller.ts`

Tạo mới `apps/api/src/modules/admin/http/admin-workers.controller.ts` sử dụng hàm kiểm tra session `getAdminSession(c)` để đảm bảo 100% endpoint được bảo vệ:

```typescript
import type { Context } from "hono";
import { auth } from "../../../auth.js";
import { handleError, readJsonBody } from "../../../shared/infrastructure/http-helpers.js";
import { jobStore } from "../../ai-engine/infrastructure/persistence/job-store.repository.js";
import {
  AdminWorkerJobListQuerySchema,
  AdminRetryJobBodySchema,
  AdminHealStuckBodySchema,
} from "../application/admin-workers.dto.js";
import {
  getAdminWorkerStats,
  listAdminWorkerJobs,
  getAdminWorkerJobDetail,
  retryAdminWorkerJob,
  healStuckAdminWorkerJob,
  cancelAdminWorkerJob,
} from "../application/admin-workers.service.js";

async function getAdminSession(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return { ok: false as const, error: "Chưa đăng nhập", status: 401 as const };
  }
  if (session.user.role !== "admin") {
    return { ok: false as const, error: "Không có quyền quản trị", status: 403 as const };
  }
  return { ok: true as const, session };
}
```

Triển khai 7 handlers:
1. `getAdminWorkerStatsHandler(c: Context)`:
   - Xác thực Admin.
   - Gọi `getAdminWorkerStats()` và trả về JSON.
2. `listAdminWorkerJobsHandler(c: Context)`:
   - Xác thực Admin.
   - Parse query bằng `AdminWorkerJobListQuerySchema.safeParse(c.req.query())`.
   - Gọi `listAdminWorkerJobs(parsed.data)` và trả về danh sách phân trang.
3. `getAdminWorkerJobDetailHandler(c: Context)`:
   - Xác thực Admin.
   - Lấy `id = c.req.param("id")`.
   - Gọi `getAdminWorkerJobDetail(id)`.
4. `getAdminWorkerJobLogsHandler(c: Context)`:
   - Xác thực Admin.
   - Lấy `id = c.req.param("id")`.
   - Đọc logs từ Redis: `const logs = await jobStore.getLogs(id)`.
   - Trả về JSON `{ logs }`.
5. `retryAdminWorkerJobHandler(c: Context)`:
   - Xác thực Admin.
   - Lấy `id = c.req.param("id")`.
   - Parse body bằng `AdminRetryJobBodySchema`.
   - Gọi `retryAdminWorkerJob(id, body, session.user.id)`.
   - Trả về `{ ok: true, message: "Đã kích hoạt chạy lại tiến trình thẩm định AI" }`.
6. `healStuckAdminWorkerJobHandler(c: Context)`:
   - Xác thực Admin.
   - Lấy `id = c.req.param("id")`.
   - Parse body `AdminHealStuckBodySchema`.
   - Gọi `healStuckAdminWorkerJob(id, session.user.id, body.reason)`.
   - Trả về `{ ok: true, message: "Đã giải phóng tiến trình kẹt và hoàn trả credit thành công" }`.
7. `cancelAdminWorkerJobHandler(c: Context)`:
   - Xác thực Admin.
   - Lấy `id = c.req.param("id")`.
   - Gọi `cancelAdminWorkerJob(id, session.user.id)`.
   - Trả về `{ ok: true, message: "Đã gửi tín hiệu hủy tiến trình" }`.

---

## 2. Mount Tuyến đường trong `admin.routes.ts`

Trong `apps/api/src/modules/admin/http/admin.routes.ts`, import các handler từ `admin-workers.controller.js` và đăng ký:

```typescript
// Worker & Queue Monitoring
adminRouter.get("/workers/stats", getAdminWorkerStatsHandler);
adminRouter.get("/workers/jobs", listAdminWorkerJobsHandler);
adminRouter.get("/workers/jobs/:id", getAdminWorkerJobDetailHandler);
adminRouter.get("/workers/jobs/:id/logs", getAdminWorkerJobLogsHandler);
adminRouter.post("/workers/jobs/:id/retry", retryAdminWorkerJobHandler);
adminRouter.post("/workers/jobs/:id/heal-stuck", healStuckAdminWorkerJobHandler);
adminRouter.post("/workers/jobs/:id/cancel", cancelAdminWorkerJobHandler);
```

---

## 3. Tiêu chí Nghiệm thu Phase 3
- [ ] 7 endpoints được định tuyến chuẩn xác dưới tiền tố `/api/admin/workers/*`.
- [ ] Tất cả các route yêu cầu quyền `admin`, chặn `user` và `supporter` với mã 403 Forbidden.
- [ ] Typecheck và build của `apps/api` thành công 100%.
