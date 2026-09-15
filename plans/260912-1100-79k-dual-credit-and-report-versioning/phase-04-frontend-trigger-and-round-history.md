# Phase 04: Frontend: Trigger Audit + Round History Display

## Goal
- Student chọn "Lần đầu" / "Đã sửa" / "Soi logic" khi trigger audit
- Report tab hiển thị round_history (nhiều versions)

## Changes

### 4.1 Trigger Audit Flow — upload trước, trigger sau
**File:** `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx` hoặc component trigger audit

`initial`: nút "Gửi đánh giá" gọi `POST /:id/ai-retry { submission_type: 'initial' }`.

`resubmit`: form 2 bước — (1) upload tài liệu sửa + `change_summary` (≥10 ký tự) qua `POST /:id/revisions/upload`, (2) dùng `lifecycle_unit_id` trả về để gọi `POST /:id/ai-retry { submission_type: 'resubmit', lifecycle_unit_id }`. Không cho skip bước 1 — BE throw `RESUBMIT_REQUIRES_UPLOAD`.

`logic_check`: bấm thẳng `POST /:id/ai-retry { submission_type: 'logic_check' }`, không cần upload mới — máy tự lấy tài liệu unit mới nhất.

```tsx
<Select
  label="Loại đánh giá"
  data={[
    { value: 'initial', label: 'Lần đầu — Đánh giá tổng quát' },
    { value: 'resubmit', label: 'Đã sửa — Đối chiếu với kết quả trước' },
    { value: 'logic_check', label: 'Soi logic — Khả thi + khách hàng' },
  ]}
  value={submissionType}
  onChange={setSubmissionType}
/>
// resubmit → hiện thêm file input + textarea change_summary
// logic_check → dùng tài liệu mới nhất, không cần upload mới
```

**Lưu ý:** Select chỉ hiện khi `credit_balance >= 1` + stage cho phép submit.
### 4.2 Report Tab: Round History — liệt kê theo REPORTS, không theo units
**Files:** `apps/api/src/modules/cases/application/get-case-detail.usecase.ts` + `apps/web-1/app/dashboard/case/[id]/_components/TabReportFindings.tsx`

**Vì sao:** `logic_check` link cùng unit với lần đầu → 2 reports chung 1 `lifecycle_unit_id`. Liệt kê theo units + tìm report theo unit là thằng sau tàng hình. Liệt kê theo reports (mới nhất trước), mỗi report gắn `version_no` của unit nó link tới (không có unit → để null, sort bằng `created_at`).

```typescript
// get-case-detail.usecase.ts — round_history mới:
// reports = prisma.report.findMany({ where: { case_id }, orderBy: { created_at: 'desc' } })
// round_history = reports.map(r => ({
//   report_id: r.id,
//   version_no: r.lifecycle_unit?.version_no ?? null,
//   submitted_at: r.created_at,
//   submission_type: (r.metadata_json as any)?.submission_type ?? 'initial',
//   report: r, pdfUrl: (r.metadata_json as any)?.pdfUrl,
// }))
```

```tsx
{round_history.map((round) => (
  <div key={round.report_id}>
    <h3>Lần {round.version_no ?? '?'} — {formatDate(round.submitted_at)} — {round.submission_type}</h3>
    {round.report ? (
      <>
        <ReportContent report={round.report} />
        <a href={round.report.pdfUrl}>Tải PDF v{round.version_no}</a>
      </>
    ) : (
      <p>Chưa có báo cáo</p>
    )}
  </div>
))}
```

### 4.3 Documents Tab: Hiển thị PDF báo cáo
**File:** `apps/web-1/app/dashboard/case/[id]/_components/TabDocuments.tsx`

Hiện tại tab documents hiển thị tài liệu từ `document_records`. Cần thêm section cho assessment_report PDFs:

```tsx
// Query document_records có doc_type = 'assessment_report'
// Mỗi document record = 1 PDF version
const reportDocs = documentRecords.filter(d => d.doc_type === 'assessment_report');

// Hiển thị list với download link
{reportDocs.map(doc => (
  <div key={doc.id}>
    <span>{doc.original_name}</span>  {/* wayvee_20260912-143022_v01.pdf */}
    <a href={doc.file_url}>Tải PDF</a>
  </div>
```

**Lưu ý:** `upsertReportArtifactDocumentRecord` đã tạo document record per report (ID = `report-artifact-${reportId}`). Chỉ cần query đúng `doc_type`.

### 4.4 Credit Display
**File:** `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx`

Hiển thị: "Số dư credit: 2 credits" thay vì "1 credit".

## Acceptance Criteria
- [ ] Trigger audit có select "Lần đầu" / "Đã sửa" / "Soi logic"
- [ ] Report tab hiển thị danh sách theo reports (v01 initial, v02 resubmit/logic) — 2 reports cùng unit vẫn hiện đủ 2
- [ ] Mỗi round có link tải PDF riêng
- [ ] Documents tab hiển thị PDF báo cáo
- [ ] Credit display: "2 credits"
