---
title: "Lưu mọi lần chạy AI đánh giá ban đầu (Start / Team-Fit) & trang lịch sử quản lý"
description: "Lưu toàn bộ các lần chạy ở /dashboard/start (kể cả khi chưa tạo dự án), bổ sung API lịch sử và trang danh sách lịch sử tái sử dụng ResultView, đồng thời đặt link vào bên trong phần expand Hồ sơ dự án."
status: done
priority: P1
effort: 4h
tags: [prisma, api, web-1, pre-cp1, team-fit, history]
blockedBy: []
blocks: []
created: 2026-11-13
---

# Plan: Lưu mọi lần chạy AI đánh giá ban đầu & Trang lịch sử

## 1. Bối cảnh & Vấn đề hiện tại
1. **Mất dữ liệu khi chưa tạo dự án:** `PreCp1Report.case_id` và `TeamFitReport.case_id` hiện đều `NOT NULL`. Endpoint `POST /api/ai-engine/team-fit` và `POST /api/pre-cp1/label` chỉ trả kết quả cho trình duyệt, không ghi DB. Chỉ khi user tạo dự án mới gọi `POST /api/pre-cp1/save`.
2. **Mất lịch sử AI theo từng lần chạy:** `team_fit_reports` có `@unique([case_id])` (`upsert` với `update: {}`), nên mỗi dự án chỉ giữ 1 kết quả AI đầu tiên; chạy lại không lưu snapshot AI riêng của lần chạy mới.
3. **Thiếu trang danh sách lịch sử & vị trí nút chưa rõ:** Nút `Xem chi tiết` ở tiêu đề `OverviewProfileFold` không rõ xem chi tiết cái gì, và trang hiện tại chỉ xem được các lần gắn với 1 case chứ chưa quản lý được toàn bộ các lần chạy (đã gắn dự án vs chưa gắn dự án).

## 2. Nguyên tắc bắt buộc
- **DB Safety (`.agents/rules/prisma-migration-safety.md`):**
  - Mọi thay đổi `schema.prisma` và tạo migration phải giải thích rõ và xin xác nhận từng bước.
  - Chỉ dùng `prisma migrate dev --create-only` để sinh SQL; tuyệt đối không chạy `migrate reset`, `db push`, `DROP`, `DELETE`, `TRUNCATE`.
- **UI Wording:** Tuyệt đối không hiển thị chữ `CP1`, `Pre-CP1`, `team-fit` thô trong UI người dùng. Dùng ngôn ngữ tự nhiên: *"Đánh giá ban đầu"*, *"Phân tích nhóm & ý tưởng"*.
- **Giữ nguyên `team_fit_reports` (`@unique([case_id])`):** Không phá vỡ `ai-engine` (`cp1-audit-input.ts`), `guided-documents` (`get-sync-proposals.usecase.ts`), `admin-workers` đang gọi `findUnique({ where: { case_id } })`.
- **Ponytail & Clean Code:** File ≤ 200 dòng, không `apiClient` hay `try/catch` trực tiếp trong component UI, không `as any`.

---

## 3. Kế hoạch triển khai (4 Phase)

### Phase 1: Database Schema & Migration (`prisma/schema.prisma`)
**Mục tiêu:** Cho phép `pre_cp1_reports` lưu cả lần chạy chưa gắn dự án và lưu kèm snapshot kết quả AI team-fit của chính lần chạy đó.

- Trong `model PreCp1Report`:
  - Đổi `case_id String` → `case_id String?` và `case Case? @relation(..., onDelete: SetNull)`.
  - Thêm cột `team_fit_snapshot Json?`.
  - Thêm `@@index([auth_user_id, input_hash])` để tra cứu/cập nhật bản ghi chưa gắn dự án (`case_id: null`) theo user + hash.
- Tạo migration bằng `npx prisma migrate dev --create-only --name pre_cp1_nullable_case_and_team_fit_snapshot`, kiểm tra SQL sinh ra (chỉ `ALTER TABLE ... ALTER COLUMN "case_id" DROP NOT NULL`, `ADD COLUMN "team_fit_snapshot" JSONB`, `DROP CONSTRAINT`/`ADD CONSTRAINT ... ON DELETE SET NULL`, `CREATE INDEX`), rồi chạy `npx prisma generate`.

---

### Phase 2: Backend API (`apps/api/src/modules/pre-cp1` & `cases`)
**Mục tiêu:** Lưu mọi lần chạy (có hoặc không có `caseId`), gắn `caseId` khi tạo dự án sau đó, và cung cấp endpoint lấy toàn bộ lịch sử của user.

1. **`POST /api/pre-cp1/save`** (`pre-cp1.routes.ts`, `save-pre-cp1.usecase.ts`, `pre-cp1.repository.ts`):
   - `SaveBodySchema`: đổi `caseId` thành `z.string().min(1).nullable().optional()`, thêm `reportId: z.string().min(1).optional()`.
   - Luồng xử lý:
     - **Có `caseId`:**
       - Kiểm tra quyền sở hữu case (`findCaseOwnedBy(caseId, userId)`).
       - Nếu truyền kèm `reportId` của bản ghi `case_id: null` thuộc `userId`: cập nhật gắn `case_id = caseId` (+ `team_fit_snapshot`, `ai_labels` nếu có) thay vì tạo dòng trùng; đồng thời `upsertTeamFit` nếu có `aiResult && teamFit`.
       - Nếu không có `reportId`: giữ logic tìm theo `(case_id, input_hash)` → attach AI hoặc `createReport` (ghi luôn `team_fit_snapshot: data.aiResult`).
     - **Không có `caseId` (`caseId == null`):**
       - Tìm bản ghi gần nhất của `userId` với `case_id: null` và `input_hash` trùng.
       - Nếu đã tồn tại: cập nhật `ai_labels` (nếu chưa có) và `team_fit_snapshot` (nếu có `aiResult`).
       - Nếu chưa tồn tại: tạo bản ghi mới với `case_id: null`, `team_fit_snapshot: data.aiResult`.
2. **`GET /api/pre-cp1/history`** (endpoint mới trong `pre-cp1.routes.ts` + `get-pre-cp1-history.usecase.ts`):
   - Yêu cầu `requireAuth`.
   - Query `prisma.preCp1Report.findMany({ where: { auth_user_id: userId }, orderBy: { created_at: "desc" }, include: { case: { select: { id: true, case_code: true, team_name: true, team_fit_report: { select: { result_snapshot: true } } } } } })`.
   - Trả về danh sách items gồm: `id`, `case_id`, `case` (`{ id, case_code, team_name } | null`), `input_snapshot`, `ai_labels`, `report_snapshot`, `team_fit_snapshot` (fallback `case?.team_fit_report?.result_snapshot ?? null`), `created_at`.
3. **`GET /api/cases/:id`** (`case.repository.ts`):
   - Bổ sung `team_fit_snapshot: true` vào `select` của `pre_cp1_reports`.
4. **Unit test:** Cập nhật/bổ sung test trong `apps/api/src/shared/infrastructure/tests/pre-cp1-save.test.ts` cho 3 case: lưu không có `caseId`, attach AI vào bản ghi `caseId: null`, và gắn `caseId` qua `reportId` khi tạo dự án.

---

### Phase 3: Frontend — Tự động lưu mọi lần chạy (`apps/web-1/app/dashboard/start`)
**Mục tiêu:** Không để mất bất kỳ lần chạy AI nào ở `/dashboard/start`, kể cả khi user chưa tạo dự án.

1. **`usePreCp1Save.ts`**:
   - Cho phép `caseId?: string | null` và `reportId?: string`.
2. **`useStartFlow.ts`**:
   - Giữ `savedReportId` trong state/ref.
   - Ở `useEffect` auto-save khi `step === "result"`: bỏ điều kiện `if (!caseId) return` → `saveKey = `${caseId ?? "anon"}:${inputHash}:${evaluation.data ? "ai" : "noai"}``.
   - Ngay khi vào `result` (có `input`) → gọi `persist(caseId, input)` (lưu bản ghi rule ngay lập tức); khi AI (`evaluation.data` / `labels`) xong → gọi lại `persist` để gắn `team_fit_snapshot` và `ai_labels` vào bản ghi đó.
   - Trong `onCaseCreated(createdCaseId)`: truyền `reportId: savedReportId` kèm `caseId: createdCaseId` vào `persist` để gắn dự án vừa tạo vào đúng bản ghi lịch sử đó rồi redirect.

---

### Phase 4: Frontend — Danh sách lịch sử & Nút trong "Hồ sơ dự án" (`apps/web-1`)
**Mục tiêu:** User quản lý được toàn bộ lịch sử các lần chạy (đã gắn dự án / chưa gắn dự án) và mở lại đúng UI `ResultView`.

1. **Types & Hook (`apps/web-1/types/case.ts`, `apps/web-1/app/dashboard/start/_hooks/usePreCp1History.ts`):**
   - Thêm `team_fit_snapshot?: unknown` vào `PreCp1ReportRecord`.
   - Tạo hook `usePreCp1History()` dùng React Query gọi `GET /api/pre-cp1/history`.
2. **Đặt nút vào bên trong phần expand "Hồ sơ dự án":**
   - `OverviewProfileFold.tsx`: bỏ nút `Xem chi tiết` khỏi `<summary>`.
   - `OverviewProfileDetails.tsx`: thêm mục **"Đánh giá ban đầu"** bên trong phần expand (hiển thị số lần đánh giá đã lưu của dự án + nút/link **"Xem lịch sử đánh giá"** dẫn tới `/dashboard/start/history?caseId=${caseId}`).
   - Truyền `caseId` (và số lượng `pre_cp1_reports`) qua `OverviewData` hoặc props của `OverviewProfileDetails`.
3. **Trang danh sách lịch sử `/dashboard/start/history` (`apps/web-1/app/dashboard/start/history/page.tsx`):**
   - Đọc query `?caseId=...` (nếu đi từ 1 dự án cụ thể thì mặc định lọc hoặc highlight theo dự án đó, vẫn có tab/chip chuyển sang **Tất cả** / **Đã gắn dự án** / **Chưa gắn dự án**).
   - Danh sách mỗi dòng hiển thị:
     - Tên ý tưởng / tên nhóm (fallback *"Chưa đặt tên"* hoặc trạng thái ý tưởng).
     - Thời gian chạy (`created_at`).
     - Tóm tắt kết quả rule (`verdict.title`) + badge kết quả AI team-fit (nếu có `team_fit_snapshot`).
     - Badge trạng thái gắn dự án: **Dự án: `<team_name>`** (có link mở `/dashboard/case/${case_id}`) hoặc **Chưa gắn dự án**.
   - Bấm vào 1 dòng → hiển thị chi tiết kết quả bằng đúng `<ResultView ... readOnly />` (có nút quay lại danh sách / quay lại dự án).
4. **Route cũ `/dashboard/case/[id]/initial-check/page.tsx`:**
   - Redirect về `/dashboard/start/history?caseId=${id}` (hoặc giữ làm wrapper nhẹ) để tránh trùng code UI.

---

## 4. Kiểm tra & Xác minh sau triển khai
- `cd apps/api && npx tsc --noEmit`
- `cd apps/api && timeout 40 npx tsx --test src/shared/infrastructure/tests/pre-cp1-save.test.ts`
- `cd apps/web-1 && npx tsc --noEmit`
- `cd apps/web-1 && bun run lint`
- Kiểm tra thủ công trên trình duyệt:
  1. Chạy `/dashboard/start` không tạo dự án → vào `/dashboard/start/history` thấy bản ghi trạng thái *"Chưa gắn dự án"* + đủ `ZonesSection` & `AiResultCard`.
  2. Tạo dự án từ kết quả đó → bản ghi chuyển thành *"Đã gắn dự án"* và trong `tab=overview` → mở **"Hồ sơ dự án"** thấy mục **"Xem lịch sử đánh giá"**.
