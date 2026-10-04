# Phase 03: PDF Versioning + System Prompt Routing

## Goal
- PDF filename có version suffix (v01, v02...)
- System prompt 3 loại: lần đầu / đã sửa / soi logic (2 file mới đã viết)

## Changes

### 3.1 PDF Filename Versioning
**File:** `apps/api/src/modules/reports/infrastructure/pdf/pdfService.ts` + `omp-audit-finalizer.ts`

Hiện tại filename: `audit_report_a4`

Dùng `lifecycle_unit.version_no` (đã có sẵn, unique per case):
```typescript
// Trong finalizer, sau khi có lifecycleUnitId:
const unit = await prisma.lifecycleUnit.findUnique({ where: { id: lifecycleUnitId } });
const version = String(unit.version_no).padStart(2, '0'); // "01", "02"

const filename = `${slug}_${timestamp}_v${version}.pdf`;
// VD: wayvee_20260912-143022_v01.pdf
```

### 3.2 Resubmit Input Scoping — nộp tài liệu nào, audit đọc gì
**File:** `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts`

Hiện tại `triggerOmpAuditForCase(caseId)` lấy ALL `document_records` + `findFirstIntakeUnit` — không scope theo version. Resubmit lẫn lộn v00+v01.

Định nghĩa lại:

- `initial`: input = intake unit (v00) docs + `intake_submission.md`. Không có previous report.
- `resubmit`: BẮT BUỘC đã qua `POST /:id/revisions/upload` → có `lifecycle_unit` v01+ và docs link `lifecycle_unit_id`. Input = docs của target unit + previous report (report mới nhất từ DB) + `change_summary.md`. KHÔNG nạp intake baseline, KHÔNG nạp full history v1..vN — previous report đã nén lịch sử, nạp thừa chỉ tốn token.
- `logic_check`: input = docs unit mới nhất + previous report nếu có (không bắt buộc). Không cần upload mới.

```typescript
export async function triggerOmpAuditForCase(
  caseId: string,
  opts?: { submission_type?: 'initial' | 'resubmit' | 'logic_check'; lifecycle_unit_id?: string },
): Promise<void> {
  const submissionType = opts?.submission_type ?? 'initial';
  // initial → intake unit docs; resubmit → target unit docs + previous_report (DB) + change_summary; logic_check → latest unit docs (+ previous_report nếu có)
  // KHÔNG nạp intake baseline cho resubmit, KHÔNG nạp full history — previous report đã nén lịch sử
  // sandbox dùng chung storage/jobs/{caseId}: dọn input/ + output/ trước khi nạp, nạp lại đúng đồ đã scope mỗi lần trigger; finalizer xong được phép dọn vì DB + Cloudinary đã giữ report + PDF
  // ghi { submission_type, lifecycle_unit_id } vào AiJob.input_json (KHÔNG phải metadata_json — AiJob không có cột đó)
}
```

**Lưu ý schema:** `AiJob` chỉ có `input_json` / `output_json`, không có `metadata_json`. Mọi plan cũ ghi `ai_jobs.metadata_json` đều sai — sửa thành `input_json`.
### 3.2b System Prompt Routing — 3 loại (2 file ĐÃ VIẾT)
**Files:** `data/system-prompts/` + `apps/api/src/modules/ai-engine/omp-audit.service.ts` + `apps/worker-omp/src/omp-runner.ts`

- `initial` → `input_clarification_gate_v4_1.md` (có sẵn).
- `resubmit` → `input_clarification_gate_v4_1_resubmit.md` (đã viết: giữ 2-step V4.1 + đối chiếu previous_report + change_summary, tone CP1).
- `logic_check` → `input_clarification_gate_v4_1_logic.md` (đã viết: chỉ 2 điểm khả thi + khách hàng, tone CP1 không gắt).

Chọn prompt ở cả 2 nơi (cả 2 đều đang hardcode promptText):
1. `omp-audit.service.ts runOmpAudit`: nhánh theo submission_type khi copy prompt vào sandbox.
2. `worker-omp/src/omp-runner.ts executeOmpJob` (dòng 53-54): mở rộng `OmpJobPayload` thêm `submissionType`, đọc nó để dựng prompt. Không sửa là payload gửi sang bị vứt.

### 3.2c Sandbox cleanup (explicit)
**Files:** coordinator (trigger) + finalizer + `prepareSandbox`

- Trigger: xóa `input/*` + `output/*` trước khi ghi (hiện chỉ `mkdirSync` nên file cũ sót lại). Finalize xong được phép dọn sandbox (DB + Cloudinary đã giữ report + PDF).
- `logic_check` input = docs unit mới nhất (giống resubmit) nhưng không bắt buộc `previous_report` — có thì đối chiếu, không thì thôi.

### 3.3 API Endpoint — upload trước, trigger sau (+ trừ credit, validate, chống bấm 2 lần)
**File:** `apps/api/src/modules/cases/http/cases-ai.controller.ts`
```typescript
// POST /api/cases/:id/ai-retry (mở rộng, hiện không nhận body)
body: {
  submission_type: 'initial' | 'resubmit' | 'logic_check',
  lifecycle_unit_id?: string // bắt buộc khi resubmit; logic_check dùng unit mới nhất
}
```

Validate ở cổng (Zod, backend standard): `submission_type` whitelist 3 giá trị; `lifecycle_unit_id` nếu có phải thuộc đúng `caseId` (chống chĩa unit case khác vào) + thuộc đúng loại `version`; resubmit thiếu unit → `409 RESUBMIT_REQUIRES_UPLOAD`.

Chống bấm 2 lần: trigger khi đã có job `queued/processing` cho case → `409 AUDIT_IN_PROGRESS`. Không có guard này là 2 cú bấm = 2 reports + trừ 2 credits cho 1 lượt.

Luồng FE: `initial` → trigger thẳng. `resubmit` = `POST /:id/revisions/upload { change_summary, documents }` → lấy `lifecycle_unit_id` → `POST /:id/ai-retry { submission_type: 'resubmit', lifecycle_unit_id }`. `logic_check` → `POST /:id/ai-retry { submission_type: 'logic_check' }`, không cần upload mới. Không cho trigger resubmit khi chưa upload (BE throw `RESUBMIT_REQUIRES_UPLOAD`).

### 3.4 PDF Download Route — Thêm report_id param + check ownership
**File:** `apps/api/src/modules/reports/http/reports.controller.ts`

Route hiện tại: `GET /api/cases/:caseId/report/:filename` → generate PDF on-the-fly, lấy report mới nhất.

Thay bằng route mới:
```typescript
// Route mới: lấy PDF theo report_id
GET /api/reports/:reportId/pdf
```

**BẮT BUỘC check ownership** (chống IDOR): load `report.case_id` → `requireCaseAccess(c, case_id)` như route cũ. Ai đoán được reportId cũng không tải được bài người khác.

Frontend `TabReportFindings` cần truyền `reportId` khi click download từng version.

### 3.5 Trừ credit khi trigger (B1 — không có là verification 2→1→0 fail)
**File:** `apps/api/src/modules/ai-engine/application/omp-audit-finalizer.ts` + coordinator (`triggerOmpAuditForCase`)

Hệ hiện tại chỉ trừ credit ở `T11_SUBMIT_OUTPUT` / `T3_RESUBMIT_AFTER_REJECT` (machine `subtractCredit`); đường audit AI (`ai-retry` → trigger) không qua transition nào nên không trừ — mua 2 credits chấm 10 lần vẫn còn 2.

Fix trong coordinator, trước khi dispatch job:
1. `getCreditBalance(caseId)` < 1 → `402 NO_CREDITS` (cùng message với machine: 'Hết credit. Vui lòng mua thêm credit để tiếp tục.').
2. Ghi `creditLedger { case_id, type: 'usage', amount: -1, ... }` trong cùng tx với `upsertAiJobQueued`. Dispatch queue fail sau đó → ghi bù `type: 'refund'` (compensation, cùng pattern `refundCredit` của machine). Không refund là trừ tiền mà job không chạy.
3. Cả 3 loại (`initial`/`resubmit`/`logic_check`) tốn 1 credit như nhau.

## Acceptance Criteria
- [ ] PDF v01 filename: `wayvee_20260912-143022_v01.pdf`
- [ ] PDF v02 filename: `wayvee_20260912-150511_v02.pdf`
- [ ] Trigger "Lần đầu" → prompt v4_1, input = intake unit only
- [ ] Trigger "Đã sửa" → prompt resubmit, input = target unit docs + previous_report + change_summary (không intake baseline, không full history)
- [ ] Trigger "Soi logic" → prompt logic, input = unit mới nhất, không cần upload mới
- [ ] Resubmit không upload trước → `409 RESUBMIT_REQUIRES_UPLOAD`
- [ ] Hết credit → `402 NO_CREDITS`; mỗi trigger trừ đúng 1 credit (ledger `type:'usage'`); dispatch fail → refund bù
- [ ] Bấm 2 lần lúc job đang chạy → `409 AUDIT_IN_PROGRESS` (không trừ thêm credit)
- [ ] `submission_type` whitelist Zod; `lifecycle_unit_id` lạ (không thuộc case) → 400
- [ ] `submission_type` lưu trong `AiJob.input_json` (không phải metadata_json)
- [ ] Download route trả đúng PDF version + chặn user lạ (ownership qua `report.case_id`)
