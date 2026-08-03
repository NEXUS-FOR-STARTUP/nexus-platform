# Shared Validation Convention

## Rule 1: All zod schemas live in @repo/validation

- Request validation (input DTO)
- Response types visible to FE
- Entity types shared FE↔BE
- AI output schemas (Gemini structured output)

## Rule 2: All new modules must use @repo/validation

- `http/*.schema.ts` imports from `@repo/validation`, never defines own zod
- FE imports types from `@repo/validation`, never copies Prisma
- Schemas inlined in `packages/validation/src/index.ts` (Turbopack can't resolve `.js` ext in package re-exports)

## Rule 3: Domain types vs validation types

- `domain/` = business enums, pure interfaces, workflow rules (NO zod imports)
- `@repo/validation` = zod schemas, inferred types for FE↔BE sharing
- BE-internal DTOs stay in module `application/*.dto.ts`

## Rule 4: New entity types

- After adding Prisma model → add zod schema to `@repo/validation` (even if only FE imports type)
- FE deletes hand-written DTO, re-exports from `@repo/validation`
- FE interfaces with nested Prisma relations (e.g., `Case` with `owner?`, `members[]`) may keep local interface — re-export base entity from `@repo/validation`, extend locally

## Rule 5: Cleanup checklist

- Delete file → grep importers → if 0, safe delete
- After delete → run `npm run knip` → verify warnings
- After schema migration → run `check-types` + `build` as gate
