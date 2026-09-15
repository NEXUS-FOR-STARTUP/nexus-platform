---
title: "Quickfix legacy cutover + null contract FE-only + docs"
description: "6 quick-fixes co hoc: xoa pkg_tf_audit chet, FE null fallback, sua docs gia 39k"
status: pending
priority: P2
effort: 2h
branch: feat/79k-dual-credit
tags: [quickfix, legacy-cutover, null-contract, docs]
created: 2026-09-15
---
# Quickfix legacy cutover (Q1-Q6)

## Overview
Cutover co hoc `pkg_tf_audit` -> `pkg_ai_audit`, siet null contract FE-only, sua docs gia stale. Khong doi behavior, khong migration, khong DB.
Base: HEAD `1c164dc` tren `feat/79k-dual-credit`.

## Design decision: Q5 FE-only
BE `get-case-detail.usecase.ts:125-127` giu `null` truthful cho legacy reports (metadata thieu `submission_type`). Ly do: coerce `?? "initial"` o BE se giau data gap va sai contract lich su; default hien thi thuoc ve FE. Mirror pattern chuan `documents/report-rows.ts:20` (`|| "initial"`) vao `RoundCard.tsx:58-59` + widen type `types/case.ts:124` cho phep null. CAM sua BE.

## Phases
| Phase | File | Q | Status |
|---|---|---|---|
| 01 | `phase-01-backend-dead-code-docs.md` | Q1,Q3,Q4 | pending |
| 02 | `phase-02-frontend-null-docs.md` | Q2,Q5,Q6 | pending |

## Key files
- BE: `credit-audit-order.helpers.ts:8`, `create-order.usecase.ts:128-130`, `reports.controller.ts:338`, `reports.routes.ts:17`, `get-case-detail.usecase.ts:125-133`
- FE: `pricing.ts:5-6`, `RoundCard.tsx:58-59`, `types/case.ts:120-127`, `documents/report-rows.ts:20`
- Docs: `money-credit-completion-model-note.md:26-27`; truth gia `seed-active-packages.ts:65-67` (79k)

## Verification
- `grep LEGACY_AUDIT_PACKAGE_KEY apps packages prisma` -> 0 ref; FE `PACKAGE_KEYS.(AUDIT|LEGACY)` -> 0
- `check-types` BE/FE xanh; khong sua source ngoai scope
- RoundCard hien "Lan dau" voi `submission_type: null`; JSON BE van `null`

## Cook
```sh
# P1 phase-01 (BE) + phase-02 (FE/docs) song song duoc, khong trung file
# 1. Q1 -> Q3 -> Q4 -> verify BE; 2. Q2 -> Q5 -> Q6 -> verify FE
```

## Open questions
- `upgrade-package.usecase.ts:10` (`pkg_tf_audit` target) co xoa luon khong? Ngoai scope Q1-Q6, de rieng.
