# Phase 03 — BE Admin allowed_transitions

- Priority: P0 | Status: Done | Effort: 1h
- Depends: Phase 02 | Blocks: Phase 06

## Overview

Admin detail endpoint trả `allowed_transitions` để modal render nút đúng (T5/T12/T6). Không đổi list endpoint.

## Key Insights

- `get-case-detail.usecase.ts` (cases module) đã làm mẫu: `getAvailableTransitions(internal_status)` → `allowed_transitions`
- `get-admin-case-detail.usecase.ts` (admin module) chưa có field này
- `AdminCaseDetailModal` + `AdminCaseAssignmentTable` đang hardcode `internal_status` — modal chuyển sang allowed_transitions (phase 06)

## Changes

```typescript
// get-admin-case-detail.usecase.ts (SỬA)
import { getAvailableTransitions } from "../../cases/domain/case-machine.js";
// trong response:
allowed_transitions: getAvailableTransitions(caseDetails.internal_status),
```

- Shape `string[]` — khớp cases detail endpoint, type FE dùng chung
- Lưu ý: `getAvailableTransitions` KHÔNG tính guard → FE lọc theo actor (phase 06, D14)

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/admin/application/get-admin-case-detail.usecase.ts` | SỬA: +allowed_transitions |

## Success Criteria

- `GET /admin/cases/:id` trả `allowed_transitions` đúng theo `internal_status`
- Manual: triage_pending → chứa T5/T12/T15; assigned → chứa T6; supporter_working → chứa T8/T10/T11/T13/T15
- KHÔNG có T8 cho admin ở triage (state triage_waiting không tồn tại — phase 01)

## Next Steps

→ Phase 04: FE student workspace.
