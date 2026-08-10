# Phase 4: Rewrite Cp1Intake Schema to Zod

## Overview
- **Priority:** P1
- **Status:** Done
- **Effort:** 1h30m
- **Risk:** HIGH — rewrites 89-line imperative function to declarative zod. Function is used in 1 place (cases.controller). MUST have pre-refactor test before touching function.
- **Phase gate:** Phase 3 must pass first (ServicePackage type migrated, import paths verified).

## Key Insights
- Current `validateCp1Intake(body: any): string[]` is manual validation — no type inference, no FE sharing, string error messages
- Target: zod schema in @repo/validation → FE + BE both import
- Function has 4 validation groups: contact, main request, documents, boundary confirmations
- Vietnamese error messages must be preserved
- Route handler currently calls `validateCp1Intake(body)` and returns `{ errors }` — after zod, use `schema.safeParse()` → `{ errors: formatted }`

## Current State

```
cases.schema.ts  →  validateCp1Intake(body: any): string[]  →  cases.controller.ts
                                                                    ↓
                                                               if (errors.length > 0) return c.json({ errors }, 400)
```

## Target State

```
@repo/validation/cp1-intake.ts  →  Cp1IntakeSchema (zod)  →  cases.controller.ts: schema.safeParse(body)
                                                            →  web-1/intake/hooks/: validate form input
```

## Files to Create

| File | Content |
|------|---------|
| `packages/validation/src/cp1-intake.ts` | `Cp1IntakeSchema` + `Cp1Intake` type (zod, structured as 4-part schema) |

## Files to Modify

| File | Action |
|------|--------|
| `packages/validation/src/index.ts` | Add export for `Cp1IntakeSchema`, `Cp1Intake` |
| `apps/api/src/modules/cases/http/cases.schema.ts` | Replace 89-line function with: `export { Cp1IntakeSchema } from '@repo/validation'` |
| `apps/api/src/modules/cases/http/cases.controller.ts` | Replace `validateCp1Intake(body)` call with `Cp1IntakeSchema.safeParse(body)`, map zod errors to Vietnamese messages |

## Schema Design

```ts
// packages/validation/src/cp1-intake.ts
import { z } from 'zod';

const ContactSchema = z.object({
  full_name: z.string().min(2, "Họ tên người liên hệ không hợp lệ (tối thiểu 2 ký tự)"),
  student_code: z.string().min(5, "Mã số sinh viên không hợp lệ (tối thiểu 5 ký tự)"),
  team_role: z.string().min(2, "Vai trò trong nhóm không hợp lệ"),
  zalo: z.string().regex(/^\d{10}$/, "Số điện thoại Zalo không hợp lệ (phải bao gồm chính xác 10 chữ số)"),
  email: z.string().email("Email liên hệ không hợp lệ"),
});

const CurrentSituationsSchema = z.array(z.string()).optional().default([]);

const DocumentSchema = z.object({
  file_url: z.string().optional(),
  drive_url: z.string().optional(),
  document_type: z.string().min(1, "Vui lòng chọn ít nhất một loại tài liệu có trong thư mục"),
});

// ... (complete schema matching all validation rules)

export const Cp1IntakeSchema = z.object({
  contact: ContactSchema,
  case_summary: z.string().optional(),
  current_situations: CurrentSituationsSchema,
  current_blocker: z.string().optional(),
  support_needs: SupportNeedsSchema,
  documents: z.array(DocumentSchema).min(1, "Thư mục tài liệu là bắt buộc"),
  boundary_confirmations: z.array(z.unknown()).min(3, "Phải xác nhận đầy đủ ít nhất 3 cam kết ranh giới"),
}).refine(/* cross-field validation for hasText + hasLegacyContext logic */);

export type Cp1Intake = z.infer<typeof Cp1IntakeSchema>;
```

## Controller Changes

Before:
```ts
const errors = validateCp1Intake(body);
if (errors.length > 0) return c.json({ errors }, 400);
```

After:
```ts
const result = Cp1IntakeSchema.safeParse(body);
if (!result.success) {
  const errors = result.error.issues.map(i => i.message);
  return c.json({ errors }, 400);
}
const { contact, documents, ...rest } = result.data;
```

## Implementation Steps

**Step 0 (MANDATORY — 30m):** Create snapshot test file
  - File: `apps/api/src/shared/infrastructure/tests/cp1-intake-validation.test.ts`
  - Read current `validateCp1Intake` function, extract all 4 validation groups + cross-field logic
  - Create 20+ test cases (valid + invalid payloads), capture exact error messages from old function
  - Run tests: `node --test apps/api/src/shared/infrastructure/tests/cp1-intake-validation.test.ts`
  - Commit: `test: add cp1 intake validation snapshot tests`

**Step 1 (1h):** Write `Cp1IntakeSchema` in `packages/validation/src/cp1-intake.ts` — exact parity with manual function, Vietnamese messages
  - Define `ContactSchema`, `DocumentSchema`, `SupportNeedsSchema` (primary_need field), `CurrentSituationsSchema`
  - Implement cross-field `.refine()` for hasLegacyContext (case_summary >= 20 OR current_situations has content — use `.superRefine()` with `ctx.addIssue()` per condition for granular errors)
  - Run snapshot tests against new schema: assert 100% identical to old function output
  - If ANY mismatch → fix schema until 100% match. Do not proceed otherwise.
**Step 2:** Add export to `packages/validation/src/index.ts`
**Step 3:** Replace `cases.schema.ts` with re-export from @repo/validation
**Step 4:** Update `cases.controller.ts` to use `safeParse` instead of `validateCp1Intake`
**Step 5:** Run API tests: `node --test apps/api/src/shared/infrastructure/tests/` + snapshot tests
**Step 6:** Verify error messages match old format (Vietnamese, same array structure `{ errors: string[] }`)
**Step 7:** Git commit: `refactor: rewrite Cp1Intake validation to zod, share via @repo/validation`

## Verification
- Snapshot tests pass: 100% identical output between old `validateCp1Intake` and new `Cp1IntakeSchema.safeParse`
- API tests pass (existing case tests still work with new validation)
- Error messages identical to old format (Vietnamese text preserved)
- `npm run check-types` passes
- Manual test: POST /api/cases/submit-intake with invalid body → same error response format
- No breaking change to FE — response format `{ errors: string[] }` unchanged

## Risk Assessment
- MEDIUM: rewriting 89-line manual function to zod. Risk: subtle validation differences.
  - Mitigation: run existing tests (if cases/intake tests exist), compare error output manually for edge cases
  - `refine` for cross-field logic (hasLegacyContext: case_summary >= 20 OR current_situations has content) — needs careful zod translation
  - If tests don't cover intake validation → Step 0 creates snapshot test
