---
description: "Gói 79k cấp 2 credits. User chọn 'Lần đầu' / 'Đã sửa' / 'Soi logic' khi trigger audit. Report tạo mới mỗi lần (không upsert). PDF versioned. Bỏ 24h limit."
status: done
priority: P1
effort: 7.5h
branch: feat/79k-dual-credit
tags: [feature, backend, frontend, credit, report-versioning, ai-engine]
blockedBy: []
blocks: []
created: 2026-09-12
---

# 79k = 2 Credits + Report Versioning

## Overview

Gói 79k hiện cấp 1 credit = 1 lần AI audit. Business intent: 79k cho 2 lượt quét (1 ban đầu + 1 sửa lại). Giải pháp: **79k = 2 credits plain và simple.** Không track thứ tự, không 24h limit, không quota layer. User muốn dùng sao thì dùng. Credit dùng cho cả 3 loại audit (lần đầu / đã sửa / soi logic).

Khi trigger audit, user chọn "Lần đầu" / "Đã sửa" / "Soi logic" → system prompt phù hợp. Mỗi lần audit = 1 report row mới + 1 PDF mới. Report tab hiển thị round_history thay vì chỉ bản mới nhất.

## Design Decisions

| Decision | Choice | Why |
|---|---|---|
| Credit quantity | 79k = 2 credits | Đơn giản, user tự quản |
| **Order quantity** | **= 1 gói (KHÔNG phải 2)** | **CRITICAL: wallet withdraw = quantity × unit_price. Nếu quantity=2 → trừ 158k. Solution: credits_granted trong package metadata_json.** |
| **credits_granted location** | **metadata_json, không phải features** | `AdminPackagesSettings.tsx` dùng `Array.isArray(pkg.features)` → nếu đổi features sang object sẽ break UI. |
| Quota tracking | Không cần | Credits fungible, user tự decide |
| 24h limit | Bỏ | User request |
| Submission type | 3 loại: `initial` / `resubmit` / `logic_check` | Bỏ `pass_prediction` (ngoài scope 79k). Cả 3 đều tốn 1 credit như nhau. |
| Prompt files | 3 file: v4_1 (lần đầu) + v4_1_resubmit (đã viết) + v4_1_logic (đã viết) | Resubmit: đối chiếu previous_report + change_summary. Logic: chỉ 2 điểm khả thi + khách hàng, tone CP1 không gắt. |

## Scope

### In Scope
1. Schema: không thêm cột nào (credits xử lý qua CreditLedger.amount)
2. Seed: 79k features ghi "2 lượt đánh giá AI"
3. Order: grant 2 credits khi mua 79k
4. CreditQuantityModal: hiển thị đúng 2 credits
5. Report: create mới thay vì upsert, link lifecycle_unit_id
6. PDF: versioned filenames
7. Frontend: trigger audit có select + hiển thị round_history
8. System prompts: 3 loại (lần đầu / đã sửa / soi logic) — 2 file mới đã viết

### Out of Scope
- Resubmission quota / 24h deadline
- Auto-assign supporter cho gói 149k
- Chat access 24h limit
- Pass prediction kèm nhận xét cô (để phase sau)

## Phases

| Phase | Name | Effort | Status |
|---|---|---|---|
| 01 | [Seed + Order: 79k = 2 credits](./phase-01-seed-and-order-2-credits.md) | 1h | Done |
| 02 | [Report Versioning: Create thay vì Upsert](./phase-02-report-versioning-create-not-upsert.md) | 1.5h | Done |
| 03 | [PDF Versioning + System Prompt Routing](./phase-03-pdf-versioning-and-system-prompt-routing.md) | 2h | Done |
| 04 | [Frontend: Trigger Audit + Round History Display](./phase-04-frontend-trigger-and-round-history.md) | 2.5h | Done |

## Key Files

| File | Change |
|---|---|
| `prisma/seeds/seed-active-packages.ts` | Thêm `credits_granted: 2` vào `metadata_json` (KHÔNG đổi `features`) |
| `apps/api/src/modules/orders/application/create-order.usecase.ts` | Đọc `credits_granted` từ package `metadata_json` → credit_ledger.amount + ORDER_PAID totalCredits |
| `apps/api/src/modules/orders/application/credit-audit-order.helpers.ts` | Không đổi (price per package = 79k) |
| `apps/api/src/modules/reports/infrastructure/persistence/report.repository.ts` | Create instead of upsert |
| `apps/api/src/modules/ai-engine/application/omp-audit-finalizer.ts` | Link report vào unit có sẵn (KHÔNG tự tạo unit); versioned PDF; unit id từ payload (fallback AiJob.input_json) |
| `apps/api/src/modules/ai-engine/omp-audit.service.ts` | Nhánh chọn prompt theo submission_type; `AiJob.input_json` (KHÔNG metadata_json) |
| `apps/worker-omp/src/omp-runner.ts` | Mở rộng `OmpJobPayload` + đọc `submissionType` để dựng prompt (đang hardcode) |
| `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts` | `triggerOmpAuditForCase(caseId, opts)` — trừ 1 credit + guard 402/409, scope input theo unit + previous_report + change_summary, dọn input/output trước khi nạp |
| `apps/api/src/modules/cases/http/cases-ai.controller.ts` | `POST /:id/ai-retry` nhận `{ submission_type, lifecycle_unit_id }` |
| `apps/api/src/modules/cases/application/submit-revision.usecase.ts` | Trả thêm `lifecycle_unit_id` + `version_no` (unblocker) |
| `apps/api/src/modules/cases/application/get-case-detail.usecase.ts` | Return round_history (join lifecycleUnits → reports) |
| `apps/api/src/modules/reports/infrastructure/pdf/pdfService.ts` | Versioned filename (dùng lifecycle_unit.version_no) |
| `apps/api/src/modules/reports/http/reports.controller.ts` | Thêm route `GET /api/reports/:reportId/pdf` |
| `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx` | Show 2 credits |
| `apps/web-1/app/dashboard/case/[id]/_components/TabReportFindings.tsx` | Round history + submission type select (3 options) + reportId param |
| `apps/web-1/app/dashboard/case/[id]/_components/TabDocuments.tsx` | Hiển thị assessment_report PDFs |
| `data/system-prompts/` | 3 prompts: v4_1 (có sẵn) + v4_1_resubmit (đã viết) + v4_1_logic (đã viết) |

## Verification

1. Mua 79k → credit_balance = 2 (không phải 1), wallet trừ 79k (không phải 158k)
2. Trigger audit lần 1 (submission_type=initial) → report v01 created, lifecycle_unit v00 linked, PDF v01 generated
3. Upload revision (`POST /:id/revisions/upload`) trả `lifecycle_unit_id` + `version_no`; trigger audit lần 2 (submission_type=resubmit) → report v02 created (row mới), PDF v02 generated
4. Trigger soi logic (submission_type=logic_check) → prompt logic, input = unit mới nhất, không cần upload mới
5. Report tab hiển thị cả 2 rounds trong round_history
6. Documents tab hiển thị 2 PDF báo cáo
7. Select "Lần đầu" → prompt v1, "Đã sửa" → prompt resubmit, "Soi logic" → prompt logic
8. Credit balance: 2→1→0 (mỗi loại audit tốn 1 credit; hết credit → 402; bấm 2 lần → 409 không trừ thêm)
9. ORDER_PAID event có totalCredits=2 (không phải 1)

## Cook

```bash
/ck:cook E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/plans/260912-1100-79k-dual-credit-and-report-versioning/plan.md
```
