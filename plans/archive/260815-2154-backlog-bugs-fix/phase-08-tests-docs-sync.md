# Phase 08 — Tests + Docs Sync (DoD)

- Priority: P0 | Status: In Progress (4/6) | Effort: 4h
- Depends: Phase 01-07 | Blocks: —

## Overview

Tổng hợp tests, cập nhật bug tracker status, `tasks/README.md`, `CHANGELOG.md [Unreleased]`, journal theo Definition of Done. Không thêm code feature.

## Requirements (DoD)

- Tests: `cp1-intake-validation.test.ts` (phase 1), refund FIFO unit test (phase 5), supersede integration test (phase 2), mở rộng `phase-07-xstate-case-machine.test.ts` (phase 3). Tất cả pass.
- Bug files: cập nhật `tasks/bugs/bug-01/03/05/09/12/13/14/16-*.md` → status Done + ghi chú plan + AC check.
- `tasks/README.md`: master table status (#1 #3 #5 #9 #12 #13 #14 #16 → Done; #12 bỏ "Partial"); effort ranking + execution order + open decisions clear.
- `CHANGELOG.md [Unreleased]`: Added/Changed/Fixed cho 8 bug.
- Journal: `docs/journals/260815-backlog-decisions.md` (nhật ký quyết định + kết quả).
- Verify toàn bộ: `npm run check-types` + `npm test` (apps/api).

## Architecture

N/A — docs + test aggregation only.

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/shared/infrastructure/tests/cp1-intake-validation.test.ts` | VERIFY (phase 1 tạo) pass |
| `apps/api/src/shared/infrastructure/tests/phase-07-xstate-case-machine.test.ts` | VERIFY mở rộng T17/T14/T19 pass |
| `apps/api/src/shared/infrastructure/tests/` (refund FIFO, supersede) | VERIFY pass |
| `tasks/bugs/bug-01-supporter-reassign-sla.md` | SỬA: Done + AC + note refund rule |
| `tasks/bugs/bug-03-user-understand-second-round.md` | SỬA: Done |
| `tasks/bugs/bug-05-completion-confirmation.md` | SỬA: Done |
| `tasks/bugs/bug-09-paid-but-empty-profile.md` | SỬA: Done |
| `tasks/bugs/bug-12-doc-count-mismatch.md` | SỬA: Done (bỏ Partial) |
| `tasks/bugs/bug-13-intake-unlimited-docs.md` | SỬA: Done |
| `tasks/bugs/bug-14-intake-unlimited-text.md` | SỬA: Done |
| `tasks/bugs/bug-16-kick-user-on-delete.md` | SỬA: Done |
| `tasks/README.md` | SỬA: master table + ranking + decisions |
| `CHANGELOG.md` | SỬA: [Unreleased] Added/Changed/Fixed |
| `docs/journals/260815-backlog-decisions.md` | TẠO: journal |

## Implementation Steps

1. Chạy toàn bộ test suite — xác nhận phase 1-7 tests pass.
2. `npm run check-types` PASS (all workspaces).
3. Cập nhật 8 bug files → status Done + link plan + AC check.
4. `tasks/README.md`: master table status, effort ranking (chuyển 8 bug sang Done), xóa open decisions đã chốt.
5. `CHANGELOG.md [Unreleased]`: thêm Fixed cho 8 bug + Added (T17/T19, category, superseded_at).
6. Viết journal `docs/journals/260815-backlog-decisions.md`.

## Todo List

- [x] Test suite full pass (node --test apps/api) — 275/293; 18 fail pre-existing env (docker prod creds vs root .env), out-of-scope, documented
- [x] `npm run check-types` PASS
- [x] 8 bug files → Done (bug-01/03/05/09/12/13/14/16 — status Done + ghi chú plan + AC)
- [x] tasks/README.md sync (master + ranking + decisions) — 8 bug chuyển Done, open decisions đã chốt, "không còn bug mở"
- [x] CHANGELOG.md [Unreleased] sync — 2026-08-16 block Added/Changed/Fixed/Removed, 8 bug bullets
- [x] Journal docs/journals/260815-backlog-decisions.md — created (59 lines: decisions, per-phase build, red-team fixes, verification, leftovers)

## Success Criteria

- 8 bug status Done trong tracker + README.
- CHANGELOG ghi nhận đủ 8 bug.
- Test suite + typecheck PASS.
- Không còn open decision cho 8 bug này.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Test mới flaky (realtime/timing) | Trung bình | Trung bình | Test đơn vị thuần, không test realtime E2E |
| Doc lệch code (status claim sai) | Thấp | Thấp | Chỉ đánh Done khi verify check-types + test pass |

## Next Steps

→ Đóng plan: cập nhật plan.md status `done`, tạo báo cáo tổng kết trong `plans/reports/`.
