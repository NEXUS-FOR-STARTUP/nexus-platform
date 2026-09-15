---
description: "Fix P0 audit pipeline: guard finalizer (T3+4) → race credit (T1) → persist unit (T2). Code-only, no migration."
status: done
priority: P0
effort: 4h
branch: feat/79k-dual-credit
tags: [fix, p0, ai-engine, credit, finalizer]
blockedBy: []
blocks: []
created: 2026-09-15
---

# Fix P0 Audit: Guard → Race → Unit

## Context

Branch feat/79k-dual-credit @ 073c5a2. Audit AI trừ 1 credit/trigger nhưng còn 3 lỗi P0: finalizer chạy trùng + ghi đè PDF (T3+4), guard ngoài tx gây double-charge khi trigger đồng thời (T1), unit resolve lại ở finalizer gây gắn nhầm report (T2). Zero covering tests.

## Phases

| # | Phase | Ticket | Status |
|---|---|---|---|
|| 01 | [Guard finalizer + filename Cloudinary](./phase-01-guard-finalizer.md) | T3+4 | ✅ Done (`545bdcb`) |
|| 02 | [Race credit: guard vào tx + reuse key](./phase-02-race-credit.md) | T1 | ✅ Done (`545bdcb`) |
|| 03 | [Persist unit: payload + finalizer ưu tiên job.data](./phase-03-persist-unit.md) | T2 | ✅ Done (`545bdcb`) |

## Status

- [x] Phase 01 T3+4 ✅ `545bdcb`
- [x] Phase 02 T1 ✅ `545bdcb`
- [x] Phase 03 T2 ✅ `545bdcb`
- [x] Reviewer pass + check-types PASS

## Dependency

Thứ tự implement T3+4 → T1 → T2. T2 là tiền đề để guard T3+4 đúng nghĩa: phase-01 code guard nhận `lifecycleUnitId` optional (forward-compatible), phase-03 mới nối `job.data` vào. Không đảo thứ tự.

## Verify

1. Trước khi sửa exported symbol: `lsp references`.
2. Sau mỗi phase: repo `check-types` + `node:test` file liên quan.
3. Cuối: reviewer agent duyệt cả 3 phases.
4. Commit conventional (`fix(ai-engine): ...`), không ref AI.
5. Code-only: cấm schema/migration; nếu cần chỉ `--create-only`, không apply.

## Blast Radius

`triggerOmpAuditForCase` 4 callers (cases-ai.controller:133, ai-audit-order.listener:48), `cancelOmpAuditForCase` 2 callers, `dispatchOmpJob` 2 callers, `finalizeOmpAuditResult` 4 callers (coordinator:100, omp-audit-status:24). Mọi phase giữ signature tương thích ngược.
