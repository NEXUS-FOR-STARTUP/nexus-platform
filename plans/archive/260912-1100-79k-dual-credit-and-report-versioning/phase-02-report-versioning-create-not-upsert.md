# Phase 02: Report Versioning: Create thay vì Upsert

## Goal
Mỗi lần AI audit = 1 report row mới. Không ghi đè report cũ. Link report vào lifecycle_unit.

## Problem
`saveOmpAuditReport` hiện tại dùng upsert:
```typescript
const existingReport = await prisma.report.findFirst({ where: { case_id } });
if (existingReport) {
  return await prisma.report.update({ ... }); // GHI ĐÈ
}
```

→ Lần 2 audit sẽ overwrite report lần 1. Student không thể xem lại bản cũ.

## Changes

### 2.1 Report Repository
**File:** `apps/api/src/modules/reports/infrastructure/persistence/report.repository.ts`

Thay `saveOmpAuditReport`:
```typescript
// Trước: upsert (findFirst + update/create)
// Sau:luôn create mới, link lifecycle_unit_id

async saveOmpAuditReport(params: {
  caseId: string;
  lifecycleUnitId?: string;  // THÊM field này
  contentMd: string;
  metadataJson: ReportMetadata;
  status?: ReportStatus;
}) {
  return this.prisma.report.create({
    data: {
      case_id: params.caseId,
      report_type: "input_clarification",
      lifecycle_unit_id: params.lifecycleUnitId ?? null,
      content_md: params.contentMd,
      metadata_json: params.metadataJson,
      status: params.status ?? "APPROVED",
    },
  });
}
```

### 2.2 Audit Finalizer — KHÔNG tự tạo lifecycle_unit
**File:** `apps/api/src/modules/ai-engine/application/omp-audit-finalizer.ts`

**Cơ chế resubmit (định nghĩa lại):**

1. Student nộp tài liệu sửa qua `POST /api/cases/:id/revisions/upload` (đã tồn tại — `submitRevisionUploadUseCase`).
   - Validate `change_summary >= 10 chars`, `doc_type` flow=`revision` scope=`version`.
   - `submitCaseRevisionInTx` tạo `lifecycle_unit` mới `v01, v02...` + `document_records` link `lifecycle_unit_id`.
2. Student trigger audit với `{ submission_type: 'resubmit', lifecycle_unit_id }`.
   - Coordinator đọc target unit từ payload, scope input files theo unit đó.
3. Finalizer chỉ LINK report vào unit đã có — không create unit.

**Vì sao không để finalizer tự tạo unit:** bypass `change_summary` validation, bypass `doc_type` flow check, bypass `checkpoint.latest_version_no` accounting trong `submitCaseRevisionInTx`. Tái dùng luồng revision hiện có rẻ và an toàn hơn.

**Unit id đi theo `OmpJobPayload`, KHÔNG query lại (tránh đua):** 2 trigger sát nhau mà finalizer query "job mới nhất" là cả 2 đọc cùng 1 job → trùng unit. Coordinator đã có `lifecycle_unit_id` trong tay lúc dispatch → nhét vào payload (`lifecycleUnitId`), finalizer đọc từ payload. `AiJob.input_json` vẫn ghi lại để audit trail, chỉ dùng làm fallback khi payload thiếu.

```typescript
// Finalizer đọc target unit từ job payload (primary), AiJob.input_json chỉ fallback
const targetUnitId = ompPayload.lifecycleUnitId
  ?? (job?.input_json as any)?.lifecycle_unit_id
  ?? null;

let lifecycleUnitId = targetUnitId;
if (!lifecycleUnitId) {
  const latestUnit = await prisma.lifecycleUnit.findFirst({
    where: { case_id: caseId },
    orderBy: { version_no: 'desc' },
  });
  const existing = latestUnit
    ? await prisma.report.findFirst({ where: { lifecycle_unit_id: latestUnit.id } })
    : null;
  if (existing) throw new AppError(409, "RESUBMIT_REQUIRES_UPLOAD", "Cần nộp tài liệu sửa trước khi audit lại.");
  lifecycleUnitId = latestUnit?.id ?? null;
}

await saveOmpAuditReport({ caseId, lifecycleUnitId, contentMd, metadataJson });
```

### 2.3 Upload phải trả lifecycle_unit_id (unblocker)
**File:** `apps/api/src/modules/cases/application/submit-revision.usecase.ts`

`submitCaseRevisionInTx` đã `return revisionUnit` nhưng `submitRevisionUploadUseCase` vứt đi, chỉ return transition. Sửa để return thêm `{ ..., lifecycle_unit_id: revisionUnit.id, version_no: revisionUnit.version_no }`. FE cần id này để gọi `POST /:id/ai-retry { submission_type: 'resubmit', lifecycle_unit_id }`.

### 2.4 Document Record — Không cần sửa
`upsertReportArtifactDocumentRecord` dùng ID `report-artifact-${reportId}`. Mỗi report mới = reportId mới = document record mới. Không overwrite. **Không cần sửa.**
### 2.5 Reports Table — Không cần migration
Reports table đã có `lifecycle_unit_id` column. Chỉ cần populate đúng.

## Acceptance Criteria
- [ ] Audit lần 1 → report row #1 created, lifecycle_unit_id linked
- [ ] Audit lần 2 → report row #2 created (không overwrite row #1)
- [ ] Cả 2 reports đều query được từ DB
- [ ] Document record tạo mới per report (không upsert)
- [ ] Upload revision trả về `lifecycle_unit_id` + `version_no` đúng unit vừa tạo
