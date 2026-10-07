# Phase 01 — Contracts and Database Foundation

## Context Links

- [Overview](./plan.md)
- [Architecture research](./research/architecture-research.md)
- [UX research](./research/spiderum-ux-research.md)
- Rule: `D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/.agents/rules/prisma-migration-safety.md`

## Overview

- **Priority:** P1
- **Status:** Complete
- **Depends on:** Explicit user confirmations and usable backup
- **Output:** One additive model, shared schemas/constants, explicit editor dependencies. No database command is part of planning.

## Key Insights

- A unified model gives one chronology and avoids union pagination/state duplication.
- Existing Prisma style uses UUIDs, snake_case, mapped plural tables, string workflow values, and timestamps.
- Shared request/response schemas must remain inline in `packages/validation/src/index.ts` because `docs/shared-validation-convention.md` says Turbopack cannot resolve package re-exports. This pre-existing oversized convention file is exempt from the 200-line rule; keep the addition focused.
- Current observed environment was local, but `DIRECT_URL` and `prisma/backup/` were absent. Revalidate at implementation time; never infer safety from this report.

## Requirements

### Confirmed

- Represent article and YouTube video cards in one public feed.
- Draft and published lifecycle; articles have cover and rich body.

### Confirmed technical contract

- `type`: `article | video`; `status`: `draft | published`, stored as strings.
- Fields: UUID `id`; required `title`; default-empty `excerpt`; nullable unique `slug`; nullable `content_json`, `youtube_video_id`, `cover_image_url`, `cover_image_public_id`, `cover_image_alt`, `published_at`; required audit IDs `created_by_auth_user_id`, `updated_by_auth_user_id`; timestamps.
- Index `(status, published_at DESC, id DESC)` and `(updated_at DESC, id DESC)`; table `news_items`; no User foreign key.
- Limits: title 200, slug 160, excerpt 320, alt 200, serialized body 512 KiB; list page defaults/max public 12/48 and admin 20/100.
- Article publish requires unique slug, managed cover URL/public ID, cover alt, valid non-empty body, and absent YouTube ID.
- Video publish requires normalized 11-character ID and absent slug/body/managed-cover fields.
- First `published_at` survives republish; article slug and type lock after initial publication/save. Published full-record edits are allowed only when the resulting item still satisfies publish invariants and `expected_updated_at` matches. Delete still requires draft.

### Excluded

No taxonomy, search, schedule, analytics, social data, inline media, relation to public authors, or schema support for deferred features.

## Architecture

Use Zod discriminated unions as canonical runtime contracts. Separate common draft fields from article/video payloads; separate create/update, list query, public response, admin response, and action response schemas. Never trust TypeScript narrowing alone for persistence invariants.

```text
Admin form → shared Zod input → Phase 2 use case → Prisma NewsItem
Prisma row → mapper → public/admin response schema (audit fields excluded publicly)
```

## Related Code Files

| Action | Absolute path | Responsibility |
|---|---|---|
| Modify | `D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/prisma/schema.prisma` | Add `NewsItem` only after confirmation |
| Create | `D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/prisma/migrations/<timestamp>_add_news_items/migration.sql` | Future create-only additive SQL; never hand-apply |
| Modify | `D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/packages/validation/src/index.ts` | Inline News constants, exact request/response/error schemas, limits, and inferred types per repository convention |
| Modify | `D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/apps/web-1/package.json` | Declare direct TipTap dependencies actually imported |
| Modify | `D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/bun.lock` | Lock resolved dependencies |
| Delete | None | No deletion planned |

No other phase may edit these files.

## Implementation Steps

1. **Block before touching schema.** Display resolved DB host/environment without exposing credentials. Require user confirmation that target is non-production/local and that a restorable backup exists. Missing `prisma/backup/` or uncertain/remote host stops work.
2. **Obtain separate schema-edit approval.** Only then add `NewsItem` with exact fields/indexes/maps above. Do not alter existing models, columns, migrations, or data.
3. Add inline shared constants and exact wire schemas: discriminated article/video cards and editor DTOs, `{ items, total, page, limit, total_pages }` list envelope, mutation item/action envelopes, ISO date strings, and one `{ code, message, details? }` error envelope. Reject unknown keys; trim text; enforce lengths/page bounds. Public DTOs omit actor IDs and Cloudinary public IDs.
4. Define a closed recursive TipTap JSON grammar: exact node/mark keys and attributes, per-node cardinality, maximum depth/node/text/serialized size, nodes `doc`, paragraph, text, heading levels 2/3, bullet/ordered list, list item, blockquote, horizontal rule, hard break; marks bold/italic/strike/underline/link. Reject H1, HTML, images, embeds, tables, styling, unknown keys. One shared URL normalizer accepts root-relative or exact `http:`/`https:` and rejects credentials, control characters, backslashes, protocol-relative, `javascript:` and `data:`.
5. Define YouTube parser contract for exact HTTPS hosts `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`; normalize supported watch/share URLs to one 11-character ID. Derive canonical URL and deterministic thumbnail; never persist arbitrary URL.
6. Keep the News section focused inside the mandatory validation index. Do not create a second validation convention or refactor unrelated schemas.
7. Add direct compatible TipTap packages used by editor/static rendering to `apps/web-1/package.json`; update `bun.lock` through the repository package-manager workflow.
8. **Obtain a second, distinct migration-generation approval.** Generate with `prisma migrate dev --create-only` only against confirmed local DB. Never run plain `prisma migrate dev`, `db push`, reset, or production apply.
9. Inspect and checksum generated SQL. It may contain only additive `CREATE TABLE`, indexes, unique constraint, and FK-free columns. Any destructive or unrelated statement stops work.
10. **Obtain a third explicit approval for local/test use.** An authorized human applies the exact reviewed artifact to an isolated local/test database, records target/checksum/result, and verifies schema state so Phase 2 can run real persistence tests. Agent never applies production migration.
11. Production backup, approval, migration application, and deployment remain separate human-run release actions.

## Todo List

- [ ] Local target and usable backup explicitly confirmed
- [ ] Schema edit separately approved
- [ ] Unified model and indexes added
- [ ] Inline shared strict wire contracts and closed content grammar defined
- [ ] TipTap direct dependencies declared
- [ ] Create-only generation separately approved
- [ ] Generated SQL proven additive and checksummed
- [ ] Exact artifact human-applied and verified on isolated local/test only

## Success Criteria

- Shared contracts fix every success/error wire shape and article/video invariant.
- Schema adds only `news_items`; no existing data/model is changed.
- Public schemas cannot serialize audit identity or Cloudinary public IDs.
- Migration is reviewed and checksummed; isolated local/test application is human-approved and verified; production remains unapplied by the agent.
- Missing confirmation/backup causes a hard stop, not a workaround.

## Verification

Implementation-time checks, only after approvals: schema formatting/validation; focused Zod tests for exact envelopes, valid/invalid discriminants, limits, URL normalization, malformed TipTap, and YouTube lookalikes; inspect SQL checksum; verify human-applied local/test migration state. Never use production credentials. Phase 5 runs repository-wide verification.

## Risk Assessment

| Risk | Impact | Mitigation / rollback |
|---|---|---|
| Wrong DB target | Critical data loss | Two confirmations, backup gate, create-only, stop on remote/unknown |
| Conditional null fields drift | Invalid public content | Zod plus use-case invariants; DB model stays simple |
| Oversized validation index | Hidden scope explosion | Minimal inline News section per mandatory convention; 200-line ceiling applies to new files, not this pre-existing exception |
| Dependency mismatch | Broken editor build | Pin repository-compatible direct packages; lockfile owned here |
| Unapplied/incorrect migration | Phase 2 cannot test | checksum reviewed artifact; human applies exact artifact only to isolated local/test |

Rollback before production: revert owned schema/contracts/dependencies and remove only the new unapplied migration directory. On isolated local/test, recreate the disposable database through the approved local workflow rather than destructive ad hoc SQL. After human production deployment, rollback requires a separately reviewed forward migration; no automated destructive rollback.

## Security

- Treat body JSON and URLs as hostile at every ingress.
- Store no HTML and expose no admin identity publicly.
- Reject unknown fields to prevent mass assignment.
- Keep Cloudinary secret/config and DB credentials outside payloads/logs.
- Actor IDs are audit identifiers without FK; validate retention/privacy expectation before release.

## Next Steps

After contracts and unapplied migration artifact are approved, Phase 2 implements APIs. Phase 3/4 must consume these contracts without changing Phase 1 files.
