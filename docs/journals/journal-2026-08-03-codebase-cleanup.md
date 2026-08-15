# Journal: Codebase Cleanup & Shared Validation Convention — hoàn tất

**Date:** 2026-08-03

**Branch:** `feat/codebase-cleanup-shared-validation`

**Plan:** `plans/260803-2059-codebase-cleanup-validation/plan.md`

**Status:** Done — 7/7 phase, P1, effort 6h.

## Vấn đề gốc

`@repo/validation` được tạo giữa vòng đời dự án (wave-system) — chỉ 1/8 module dùng nó (ai-engine), 7 module cũ dùng inline/manual validation, không backfill. Hệ quả: 5 file schema placeholder rỗng, 1 domain file rỗng, 1 shim backward-compat chết, 4 entity type FE copy tay từ Prisma, 3 bản `getSession` trùng, 16 dep unused. 3-stage build history (Lean DDD scaffold → MVP inline → wave-system) để lại dead code rải khắp.

## Việc đã làm (7 phase)

1. **Delete dead files** — xóa `packages/ui` scaffold (0 consumers, Mantine là design system thật), 5 file `http/*.schema.ts` placeholder rỗng, `cloudinary-url.service.ts` shim (đã unified trong `services/cloudinary.ts`). Cập nhật AGENTS.md tránh reference chết.
2. **Move TeamFitReport schema** — từ `ai-engine/domain/` sang `@repo/validation` (infrastructure concern đặt sai layer). Schema cho paid tier, pre-designed chưa kích hoạt — user quyết định move ngay vì chi phí ~0.
3. **Migrate 4 entity types** (ServicePackage, Case, Payment, User) — FE types viết tay copy Prisma → re-export từ `@repo/validation`. Drift xác nhận: `ServicePackage.features: string[] | Record<string, any>` (any escape), `price: number` lệch Prisma `Int`. Pattern Expand→Migrate→Contract, giữ domain enums (CaseStage, PaymentDecision...) local — không migrate sang shared.
4. **Rewrite `validateCp1Intake`** — 89 dòng imperative manual validation → `Cp1IntakeSchema` zod trong `@repo/validation`, FE+BE cùng import. GIỮ parity 100%, bảo toàn Vietnamese error messages. Phase rủi ro HIGH nhất — bắt buộc snapshot test trước refactor (Step 0).
5. **Dedup `getSession` 3→1** — canonical tại `http-helpers.ts`, `authorization.ts` import từ đó, middleware auth giữ inline (use case khác). Xóa dead exports + dead components.
6. **Remove 12 unused deps** — 16 phát hiện → 12 xóa, 4 giữ vì CSS-only import (`@mantine/*` trong `globals.css`). Nắm được trap: grep JS import không đủ, CSS-only count as used.
7. **Knip + convention doc** — `knip.jsonc` monorepo config, script `npm run knip` (warn-level trước), `docs/shared-validation-convention.md` để pattern không drift lại.

## Red team (2026-08-03)

34 raw findings → 18 unique → **10 accepted, 5 rejected, 3 user-decided**. Đáng giá nhất:

- **Bắt lỗi trước khi đụng code**: `package.types.ts` bị liệt kê xóa trong 2 phase (conflict), path sai `packages/domain/`, peer-dep auto-install claim sai.
- **Accepted**: price cần `.max(2147483647)`, `features` dùng `z.unknown()` làm mất type → concrete union, audit fields phải split Public vs BE-only schema, rollback strategy, success metrics đo được.
- **Rejected có chủ đích**: URL injection / boundary `z.unknown()` — phase 4 là parity rewrite, không phải security hardening. Không trộn 2 mục tiêu.
- **User-decided**: move team-fit schema ngay (không chờ paid tier), knip warn trước escalate error sau, migrate full 4 entities (không làm 1 template).

## Kết quả

| Metric | Trước | Sau |
|--------|-------|-----|
| Module dùng `@repo/validation` | 1/8 | 3/8 (ai-engine + packages + cases) |
| Dead tracked files | 9 | 0 |
| FE hand-written entity types | 4 | 3 (Case/Payment/User deferred) |
| Shared entity schemas | 0 | 1 (ServicePackage) |
| Duplicate getSession | 3 | 1 |
| Unused deps | 16 | 4 (12 đã xóa) |

## Cảm nghĩ

Đây là plan "dọn nhà" hiếm hoi làm đúng quy trình: red team từ phase plan chặn được 3 lỗi critical trước khi code (file conflict, path sai, peer-dep claim sai) — nếu không review, phase 1 đã xóa nhầm file có content hoặc phase 6 đã xóa dep đang dùng CSS. Kỷ luật "parity not hardening" đáng nhớ: từ chối 2 finding security dù hợp lý về mặt kỹ thuật, vì trộn mục tiêu sẽ phình scope và khó verify.

Điểm yếu thật: Case/Payment/User entities vẫn chưa migrate (deferred) — 3 type FE copy Prisma vẫn còn drift risk; chưa ai chạy `npm run knip` để đo baseline nên "warn-level" giờ chỉ là khai hỏa, chưa thành rào chắn. Đề xuất: migrate 3 entity còn lại + escalate knip lên error trong plan kế tiếp.

## Pending

- [ ] Migrate Case/Payment/User entity types còn lại sang `@repo/validation`
- [ ] Escalate knip lên error-level sau khi triage false positives
- [ ] Baseline knip report lần đầu để đo regressions sau này
