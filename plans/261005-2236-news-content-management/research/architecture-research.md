---
title: "News architecture research"
description: "Existing Nexus patterns and recommended schema/API architecture for News."
created: 2026-10-05
tags: [feature, backend, database, api, frontend]
---

# News architecture research

## Scope

Confirmed:

- One public `/news` feed containing Nexus-authored articles and YouTube links.
- Both types render as cards with `Bài viết` or `Video` badge.
- Article opens internal `/news/[slug]`; video opens YouTube directly, with no internal detail.
- Admin manages drafts and published content.
- Article cover upload and Spiderum-inspired long-form reading UX.

Excluded: categories, tags, search, comments, reactions, follows, analytics, RSS, scheduling, inline article media.

## Existing patterns

- API mounts bounded-context routers in `apps/api/src/index.ts:153-168`.
- Modules use `domain/`, `application/`, `infrastructure/persistence/`, `http/`.
- Shared request/response validation belongs in `packages/validation/src/index.ts`.
- Prisma uses snake_case fields, plural `@@map`, UUID IDs, string workflow values, `created_at`/`updated_at`.
- Admin controllers currently duplicate Better Auth role checks; shared `requireAuth` exists, `requireAdmin` does not.
- Public landing uses `apps/web-1/components/layout/AppShell.tsx`; desktop header currently has no content navigation, mobile drawer has landing links.
- Admin is desktop-only and uses `/admin?tab=`. `apps/web-1/app/admin/page.tsx` already exceeds 700 lines; News must remain isolated in new components/hooks.
- Web uses Axios + TanStack Query for client/admin data. Public News should use Server Components + native `fetch` for SEO-ready HTML.
- `@mantine/tiptap` and styles already exist, but no editor implementation exists. Direct TipTap dependencies needed by News must be declared instead of relying on lockfile hoisting.
- Cloudinary image replacement pattern exists in `upload-avatar.usecase.ts`: upload new, persist DB URL, roll back new asset on DB failure, delete old asset only after DB success.
- Root has static metadata only; News requires Next.js 16 `generateMetadata`.
- API tests use `node:test` + `node:assert`; no web test runner exists.

## Decision: one unified model

Use one `NewsItem` model with `type: article | video`.

Why:

- One chronology, admin list, pagination, publication workflow, card contract.
- Separate tables require union pagination, duplicated CRUD/state logic, and cross-table ordering.
- Conditional fields stay explicit through shared Zod discriminated unions and publish invariants.

Recommended shape:

```prisma
model NewsItem {
  id                      String   @id @default(uuid())
  type                    String
  status                  String   @default("draft")
  title                   String
  slug                    String?  @unique
  excerpt                 String   @default("")
  content_json            Json?
  youtube_video_id        String?
  cover_image_url         String?
  cover_image_public_id   String?
  cover_image_alt         String?
  published_at            DateTime?
  created_by_auth_user_id String
  updated_by_auth_user_id String
  created_at              DateTime @default(now())
  updated_at              DateTime @updatedAt

  @@index([status, published_at(sort: Desc), id(sort: Desc)])
  @@index([updated_at(sort: Desc), id(sort: Desc)])
  @@map("news_items")
}
```

Strings, not Prisma enums. Canonical values live in shared Zod:

- `NEWS_ITEM_TYPES = ["article", "video"]`
- `NEWS_ITEM_STATUSES = ["draft", "published"]`

No User FK. Actor IDs remain as audit identifiers if admin accounts are deleted. Public byline is a product label, not admin identity.

Publish invariants:

- Common: non-empty title and excerpt.
- Article: unique slug, managed cover URL/public ID, cover alt, valid non-empty TipTap JSON, no YouTube ID.
- Video: valid normalized 11-character YouTube video ID, no slug/content/managed cover fields. Thumbnail derives from exact YouTube image host.
- First `published_at` survives unpublish/republish.
- Article slug becomes immutable after first publication.
- Published item must be unpublished before hard delete.

Suggested limits: title 200, slug 160, excerpt 320, alt 200, serialized content 512 KiB, public page 12/max 48, admin page 20/max 100.

## Migration safety gate

Current observation: `DATABASE_URL` host is local; `DIRECT_URL` missing; `prisma/backup/` does not exist. No DB command was run.

Implementation MUST stop before each schema/migration action and obtain explicit user confirmation:

1. Confirm target environment/host and backup.
2. Confirm schema edit.
3. Create additive migration only on confirmed local DB with `prisma migrate dev --create-only`.
4. Inspect generated SQL: only `CREATE TABLE`, indexes, and FK-free columns; no drop/delete/rename.
5. Never run `prisma db push`, full `prisma migrate dev`, reset, or production mutation.
6. Production migration deployment remains human-run after backup and SQL review.

Classification: additive safe migration; no backfill or destructive operation.

## API contract

Public `/api/news`:

- `GET /?page=1&limit=12`: published only, stable `published_at DESC, id DESC`; returns cards and pagination.
- `GET /:slug`: published article only. Draft, video, or missing slug returns 404.

Admin `/api/admin/news` guarded by backend `requireAuth` + `requireAdmin`:

- `GET /?page=&limit=&status=&type=&sort=`
- `GET /:id`
- `POST /`: create draft; actor comes from session.
- `PUT /:id`: full type-specific payload; status excluded.
- `POST /:id/cover`: article-only multipart upload/replace.
- `POST /:id/publish`
- `POST /:id/unpublish`
- `DELETE /:id`: draft only.

Errors: 400 validation, 401 unauthenticated, 403 non-admin, 404 missing/inaccessible, 409 slug/state conflict.

## Rich content security

Persist TipTap JSON, never raw HTML. Render to React through a controlled static renderer; never use `dangerouslySetInnerHTML`.

Allowlist:

- Nodes: doc, paragraph, text, H2/H3, bullet/ordered list, list item, blockquote, horizontal rule, hard break.
- Marks: bold, italic, strike, underline, link.
- Reject H1 in body, raw HTML, inline images, embeds, tables, colors, font styling, unknown nodes/marks, excessive depth/node count/serialized size.
- Links: relative path or exact `http:`/`https:`. Reject `javascript:`, `data:`, protocol-relative URLs. External output receives safe `rel`.

YouTube input:

- Allow exact HTTPS hosts `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`.
- Parse supported watch/share URLs to an 11-character ID.
- Store only normalized ID; derive canonical watch and thumbnail URLs. Reject lookalike domains and arbitrary redirects.

## Cloudinary cover lifecycle

- Article only; JPEG/PNG/WebP, max 5 MiB, extension/MIME match, SVG rejected.
- Folder `nexus-platform/news/<newsItemId>`; persist secure URL and public ID.
- Item must exist as draft before upload.
- Replacement: upload new, update DB, delete new if DB fails, then best-effort delete old after success.
- Item deletion: DB first, then best-effort Cloudinary cleanup with structured orphan log.

## Performance and SEO

- Public list/detail: Server Components and `cache: "no-store"` initially. Immediate publish/unpublish consistency matters more than ISR at current scale.
- Dynamic article metadata: title, excerpt, canonical, OG/Twitter cover, first publication and modified times.
- `next/image` strict remote patterns for Cloudinary and YouTube thumbnail host.
- Reading time derives from validated TipTap text; no DB column.
- No public client-state store or TanStack hydration.

## Key risks

1. Admin page and validation index already exceed size limits. Only wiring edits there.
2. Tiptap JSON is safe only with server structural allowlist and controlled output.
3. ISR without explicit cross-app invalidation can expose unpublished content temporarily; use no-store.
4. YouTube URL and thumbnail variants need canonical parser and deterministic fallback.
5. No frontend test runner. Require browser smoke at 390/768/1024/1440 and keyboard/dark-mode checks.
6. `proxy.ts` matcher currently omits `/news`; add it so maintenance mode still covers News.

## Sources

- Next.js 16 metadata and cache: https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/01-getting-started/14-metadata-and-og-images.mdx
- Next.js ISR: https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/02-guides/incremental-static-regeneration.mdx
- TipTap persistence/static renderer/SSR: https://github.com/ueberdosis/tiptap-docs
- Mantine v9 TipTap: https://github.com/mantinedev/mantine/blob/9.0.0/apps/mantine.dev/src/pages/x/tiptap.mdx
