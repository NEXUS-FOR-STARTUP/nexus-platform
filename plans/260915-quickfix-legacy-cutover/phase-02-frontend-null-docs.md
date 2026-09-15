# Phase 02: Frontend null-contract + docs (Q2, Q5, Q6)

## Context Links
- Plan: `plans/260915-quickfix-legacy-cutover/plan.md`
- Pattern chuan: `apps/web-1/app/dashboard/case/[id]/_components/documents/report-rows.ts:20` (`|| "initial"`)
- BE truth (CAM sua): `apps/api/src/modules/cases/application/get-case-detail.usecase.ts:125-133` (null truthful)
- Truth gia: `prisma/seeds/seed-active-packages.ts:65-67` (`pkg_ai_audit` 79k, `pkg_tf_audit` legacy inactive)

## Overview
- Priority: P2. Status: pending.
- Q2 xoa keys chet; Q5 null fallback FE-only; Q6 sua gia stale 39k -> 79k.

## Key Insights
- `pricing.ts:5-6` (`AUDIT`/`LEGACY_AUDIT`) trung nhau (`pkg_tf_audit`), 0 consumer — FE chi dung `PACKAGE_KEYS.AI_AUDIT` (6 callsites: CreditQuantityModal, page, StatusGuidance, TeamFitResultStep, PackageSelectionModal, LandingPricing).
- `RoundCard.tsx:58-59` index map truc tiep bang `round.submission_type` (nullable runtime tu BE) -> label/color co the `null`; `report-rows.ts:20` da co fallback chuan.
- Note Q6 dan gia 39k tu `seed-packages.ts:39-42` (seed cu) trong khi seed active la 79k.

## Requirements
- Functional: Q2 xoa 2 keys chet, giu `FREE/AI_AUDIT/SUPPORTER_AUDIT`; Q5 RoundCard hien "Lan dau" khi null; type cho phep null; Q6 note ghi 79k + `pkg_ai_audit`.
- Non-functional: CAM coerce `?? "initial"` o BE; FE typecheck xanh; khong doi API contract.

## Architecture
- Data flow: BE tra `submission_type: null` (legacy) -> FE normalize tai render (`|| "initial"`), 2 consumer (RoundCard, report-rows) nhat quan. Type `RoundHistoryEntry` phan anh nullable that.

## Related Code Files
- Modify: `apps/web-1/lib/pricing.ts` (Q2, xoa `:5-6`)
- Modify: `apps/web-1/app/dashboard/case/[id]/_components/RoundCard.tsx` (Q5, `:58-59`)
- Modify: `apps/web-1/types/case.ts` (Q5, `:120-127`, widen `:124`)
- Modify: `docs/technical-notes/money-credit-completion-model-note.md` (Q6, `:26-27`)
- Read-only (CAM sua): `get-case-detail.usecase.ts:125-133`, `documents/report-rows.ts:20`, `report.utils.ts:9-19`
- Create/delete: none.

## Implementation Steps
1. Q2 — Xoa `pricing.ts:5-6` (`AUDIT`, `LEGACY_AUDIT`). Giu `FREE/AI_AUDIT/SUPPORTER_AUDIT`. `PackageKey` tu hep, khong sua them.
2. Q2 verify — grep `PACKAGE_KEYS\.(AUDIT|LEGACY_AUDIT)` trong `apps/web-1` -> 0; grep `LEGACY_AUDIT` -> 0.
3. Q5 type — `types/case.ts:124`: `submission_type: "initial" | "resubmit" | "logic_check";` -> `submission_type: "initial" | "resubmit" | "logic_check" | null;`
4. Q5 render — `RoundCard.tsx:58-59`, mirror `report-rows.ts:20`:
   `const submissionType = round.submission_type || "initial";`
   `const typeLabel = SUBMISSION_TYPE_LABELS[submissionType] || round.submission_type || "Báo cáo";`
   `const typeColor = SUBMISSION_TYPE_COLORS[submissionType] || "gray";`
5. Q5 NON-GOAL — Khong cham `get-case-detail.usecase.ts:125-133`; BE tiep tuc tra `null`.
6. Q6 — Note `:26`: `39,000 VND/credit (seed-packages.ts:39-42)` -> `79,000 VND/goi = 2 credits (seed-active-packages.ts:65-67)`; dong `:27`: `pkg_tf_audit` -> `pkg_ai_audit`.
7. Chay FE `check-types` (scope web-1). Doi xanh.

## Todo List
- [ ] Q2 xoa 2 keys + grep 0 ref
- [ ] Q5 widen type + RoundCard fallback
- [ ] Q5 xac nhan BE khong doi (diff khong cham usecase)
- [ ] Q6 gia 79k + ref seed active
- [ ] FE `check-types` xanh

## Success Criteria
- `pricing.ts` con 3 keys; khong consumer nao hong (typecheck).
- RoundCard voi `submission_type: null` render "Lan dau", khong crash/`null` label.
- JSON BE van `submission_type: null` cho legacy report (khong coerce).
- Note khong con `39,000`/`pkg_tf_audit` o dong 26-27.

## Risk Assessment
- Widen type gay loi cho consumer khac cua `RoundHistoryEntry`: thap — 2 consumer da null-safe sau fix; mitigation: FE typecheck bat het.
- Ai do "sua" BE cho tien: trung binh — mitigation: ghi ro NON-GOAL + review diff.

## Security Considerations
- Khong co: khong doi auth, fetch, PII. Badge/label la hien thi thuan.

## Next Steps
- Xong -> cook ca 2 phases: BE+FE typecheck, grep zero-ref, dong plan. Follow-up: audit con `pkg_tf_audit` trong tests (`team-fit-save`, `upgrade-package`) o ticket rieng.
