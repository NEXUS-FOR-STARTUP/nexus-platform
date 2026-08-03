# Phase 3: Migrate Entity Types to @repo/validation

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 2h
- **Risk:** MEDIUM — touches 12+ files across FE + BE for 4 entities. Expand→Migrate→Contract per entity, dual-export during transition

## Key Insights
- 4 entity types in `web-1/types/` are hand-written DTOs copying Prisma schema — drift risk
- Current drift confirmed: `ServicePackage.features: string[] | Record<string, any>` (any escape), `price: number` vs Prisma `Int`
- Research (researcher-01): Expand → Migrate → Contract pattern. Per-entity migration, keep dual-exports during transition
- BE does NOT need full zod entity schemas for read paths (Prisma inference is fine). Export TYPES only from @repo/validation for read paths; zod schemas for write/validate paths
- Phase 3 scope: ALL 4 entity types (ServicePackage, Case, Payment, User). Done completely in one phase — no orphan pattern.

## Implementation: All 4 Entity Types

### Schema Files to Create in @repo/validation

| File | Content |
|------|---------|
| `packages/validation/src/service-package.ts` | `export const ServicePackageSchema = z.object({...})` + `export type ServicePackage = z.infer<...>` |

### Files to Modify

| File | Action |
|------|--------|
| `packages/validation/src/index.ts` | Add 8 exports: ServicePackage, Case, Payment, User (schema + type each) |
| `apps/web-1/types/package.ts` | Replace hand-written with: `export { type ServicePackage } from '@repo/validation'` |
| `apps/web-1/types/case.ts` | Replace hand-written with re-export from @repo/validation (keep imports for helper types if needed) |
| `apps/web-1/types/payment.ts` | Replace hand-written with re-export from @repo/validation |
| `apps/web-1/types/user.ts` | Replace hand-written with re-export from @repo/validation |
| `apps/api/src/modules/packages/domain/package.types.ts` | Replace empty file with re-export |
| `apps/api/src/modules/payments/domain/payment.types.ts` | Replace entity type with re-export (keep PaymentDecision enum local) |
| `apps/api/src/modules/cases/domain/case.types.ts` | Replace entity type (CaseData etc.) with re-export (keep CaseStage, InternalStatus, CasePriority enums local — those are domain business types) |

### Schema Definition

```ts
// packages/validation/src/service-package.ts
import { z } from 'zod';

export const ServicePackagePublicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number().int().min(0).max(2147483647),
  is_active: z.boolean().default(true),
  features: z.array(z.string()).or(z.record(z.string())),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ServicePackage = z.infer<typeof ServicePackagePublicSchema>;

// BE-only: full entity with audit fields
export const ServicePackageSchema = ServicePackagePublicSchema.extend({
  previous_price: z.number().int().min(0).max(2147483647).nullable().optional(),
  last_price_changed_at: z.string().datetime().nullable().optional(),
  last_price_changed_by: z.string().nullable().optional(),
});
```

### Migration Pattern (per Finding 5 from researcher-01)

1. **Expand**: Add schema to @repo/validation. Export from index.
2. **Migrate**: Update FE type file to re-export from @repo/validation. Update BE domain stub.
3. **Contract** (future): Remove FE hand-written types entirely once all consumers import from @repo/validation.

## Implementation Steps

1. Create `packages/validation/src/service-package.ts` with schema above
2. Add re-export to `packages/validation/src/index.ts`
3. Replace `apps/web-1/types/package.ts` content with re-export
4. Replace `apps/api/src/modules/packages/domain/package.types.ts` with re-export
5. Run `npm run check-types` — verify all import paths resolve
6. Run `npm run build` — verify API + Web build
7. Git commit: `refactor: migrate ServicePackage type to @repo/validation (shared FE↔BE)`

## Verification
- `npm run check-types` passes across all workspaces
- `npm run build` succeeds
- `grep -r "from './package'" apps/web-1/types/case.ts apps/web-1/types/payment.ts` still resolves to re-exported type
- No new `any` types introduced (`features` uses `z.array(z.string()).or(z.record(z.string()))`)

## Risk Assessment
- MEDIUM: affects all 4 FE types + 3 BE domain files simultaneously (~12 files). Re-export pattern keeps old import paths working. Per-entity commits for safe partial revert.
- `features: z.array(z.string()).or(z.record(z.string()))` is initial guess — verify against actual DB data in separate PR
- Case/Payment/User schemas: create stub schemas matching current FE types first (minimal change), refine later

## Out of Scope (future phases)
- Add zod validation at write endpoints (admin create/update package, payment verification)
- Refine `features` shape from actual DB data
- Add Prisma-zod-generator for auto-generated entity schemas
