# Phase 03 — BE Admin allowed_transitions

- Priority: P1 | Status: Pending | Effort: 1h
- Depends: Phase 02 | Blocks: Phase 06

## Overview

Admin detail endpoint trả `allowed_transitions` để modal render nút đúng (D9). Không đổi list endpoint.

## Key Insights

- `get-case-detail.usecase.ts` (cases module) đã làm mẫu: `getAvailableTransitions(internal_status)` → `allowed_transitions`
- `get-admin-case-detail.usecase.ts` (admin module) chưa có field này
- `AdminCaseDetailModal` + `AdminCaseAssignmentTable` đang hardcode `internal_status` — modal sẽ chuyển sang allowed_transitions (phase 6)

## Architecture

```typescript
// get-admin-case-detail.usecase.ts (SỬA)
import { getAvailableTransitions } from "../../cases/domain/case-machine.js";
// trong response:
allowed_transitions: getAvailableTransitions(caseDetails.internal_status),
```

- Shape `string[]` — khớp cases detail endpoint, type FE `apps/web-1/types/case.ts:23` dùng chung

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/admin/application/get-admin-case-detail.usecase.ts` | SỬA: +allowed_transitions |

## Success Criteria

- `GET /admin/cases/:id` trả `allowed_transitions` đúng theo `internal_status`
- Manual: case triage_pending → list chứa T5/T12/T8/T15; case assigned → chứa T6; case supporter_working → chứa T8/T10/T11/T13/T15

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Admin thấy transition của role khác (T15 owner...) | Cao | Thấp | FE filter theo role (phase 6, D7) — BE trả raw list |

## Next Steps

→ Phase 04: FE student workspace.
