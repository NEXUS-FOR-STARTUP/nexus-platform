# Phase 01: Backend dead-code + docs (Q1, Q3, Q4)

## Context Links
- Plan: `plans/260915-quickfix-legacy-cutover/plan.md`
- Truth gia: `prisma/seeds/seed-active-packages.ts:65-67` (`pkg_ai_audit`, 79000)
- Route that: `apps/api/src/modules/reports/http/reports.routes.ts:17` (`/:reportId/download`)

## Overview
- Priority: P2. Status: pending.
- Xoa export chet + sua 2 comment/docstring stale. Khong doi behavior, khong migration.

## Key Insights
- `LEGACY_AUDIT_PACKAGE_KEY` chi co 1 match dinh nghia, 0 import repo-wide (verify `apps;packages;prisma`).
- Comment Q3 noi upgrade len `pkg_tf_audit` nhung code `create-order.usecase.ts:134` dung `AUDIT_PACKAGE_KEY` (`pkg_ai_audit`); comment sai, code dung.
- Docstring Q4 ghi `:reportId/pdf` nhung route that la `:reportId/download`; copy-paste tu case-level handler.

## Requirements
- Functional: Q1 xoa export chet; Q3 comment dung dich `pkg_ai_audit`; Q4 docstring dung route that.
- Non-functional: zero behavior change; `check-types` BE xanh; khong cham FE/docs.

## Architecture
- Khong doi data flow. Q1 thu hep public surface cua helpers module (2 consumer import `AUDIT/FREE_PACKAGE_KEY` giu nguyen). Q3/Q4 text-only.

## Related Code Files
- Modify: `apps/api/src/modules/orders/application/credit-audit-order.helpers.ts` (Q1, xoa `:8`)
- Modify: `apps/api/src/modules/orders/application/create-order.usecase.ts` (Q3, sua `:128-130`)
- Modify: `apps/api/src/modules/reports/http/reports.controller.ts` (Q4, sua `:338`)
- Read-only (verify, CAM sua): `reports.routes.ts:17`, `credit-audit-order.helpers.ts:7`
- Create/delete: none.

## Implementation Steps
1. Q1 — Xoa dong 8 `credit-audit-order.helpers.ts`: `export const LEGACY_AUDIT_PACKAGE_KEY = "pkg_tf_audit";` (giua `AUDIT_PACKAGE_KEY:7` va interface `:10`). Khong sua gi khac.
2. Q1 verify — `grep LEGACY_AUDIT_PACKAGE_KEY apps packages prisma` -> chi con 0 match (hoac match trong test history thi bao cao, khong sua).
3. Q3 — Sua comment `create-order.usecase.ts:128-130`: `pkg_tf_audit` -> `pkg_ai_audit` (dong 128: "upgrade len pkg_ai_audit sau khi thanh toan"). Giu nguyen `:127,:129-130` va fallback `:140` (co ca 2 id, ngoai scope).
4. Q4 — Sua docstring `reports.controller.ts:338`: `GET /api/reports/:reportId/pdf` -> `GET /api/reports/:reportId/download`. Giu dong `:339` ownership note.
5. Chay `check-types` BE (hoac `tsc --noEmit` scope api). Doi xanh.

## Todo List
- [ ] Q1 xoa `LEGACY_AUDIT_PACKAGE_KEY` + grep 0 ref
- [ ] Q3 comment dung `pkg_ai_audit`
- [ ] Q4 docstring dung `:reportId/download`
- [ ] BE `check-types` xanh

## Success Criteria
- `grep LEGACY_AUDIT_PACKAGE_KEY` -> 0 match ngoai lich su git.
- `create-order.usecase.ts:128` khong con chu `pkg_tf_audit`.
- `reports.controller.ts:338` khop `reports.routes.ts:17`.
- BE typecheck pass; khong file FE/docs nao doi.

## Risk Assessment
- Ai do import constant tuong lai: thap — ten legacy, grep 0 consumer; mitigation: xoa la dung, can thi git revert.
- Sua nham code thay vi comment (Q3): thap — chi cham dong comment; mitigation: diff review 3 dong.

## Security Considerations
- Khong co: khong doi auth, input, query. Route ownership (`requireReportCaseAccess`) giu nguyen.

## Next Steps
- Xong -> phase-02 (song song duoc, khong trung file). Follow-up ngoai scope: `upgrade-package.usecase.ts:10` target `pkg_tf_audit`.
