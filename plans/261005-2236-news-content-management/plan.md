---
title: "Nexus News Content Management"
description: "Deliver secure article and YouTube publishing, a responsive public News experience, and desktop-only admin management."
status: pending
priority: P1
effort: 72h
branch: dev
tags: [feature, frontend, backend, database, api, auth]
blockedBy: []
blocks: []
created: 2026-10-05
---

# Nexus News Content Management

## Overview

Add one chronological News system for Nexus-authored articles and YouTube videos. Public pages use SEO-ready Server Components; authenticated admins use isolated desktop management screens.

## Scope

- **Confirmed:** `/news` feed; internal article detail; direct YouTube cards; draft/publish admin workflow; live edits for published content; managed article covers; responsive public UI; desktop-only admin.
- **Decisions:** unified `NewsItem`; TipTap JSON; byline `Nexus Team`; label `Tin tức`; YouTube thumbnail + safe new tab; immutable published slug; retained first `published_at`; optimistic concurrency on live edits; no-store end to end.
- **Assumptions:** current Better Auth, Cloudinary, Mantine, Axios/TanStack Query, Prisma, and API module patterns remain available.
- **Excluded:** categories, tags, search, comments, reactions, follows, analytics, RSS, scheduling, inline media, related content, share controls, progress bar, autosave, standalone draft preview, sitemap, JSON-LD.

## Architecture and Data Flow

```mermaid
flowchart LR
  A[Admin desktop UI] -->|session + validated payload| B[Admin News API]
  B --> C[(NewsItem)]
  B --> D[Cloudinary]
  C --> E[Public News API]
  E -->|no-store server fetch| F[/news Server Components]
  F -->|article| G[/news/slug]
  F -->|video ID| H[YouTube new tab]
```

## Phases

| Phase | Name | Depends on | Effort | Status |
|---|---|---|---:|---|
| 1 | [Contracts and Database Foundation](./phase-01-contracts-database-foundation.md) | DB safety confirmations | 14h | Pending |
| 2 | [News API and Security](./phase-02-news-api-and-security.md) | Phase 1 | 20h | Pending |
| 3 | [Public News Experience](./phase-03-public-news-experience.md) | Phase 2 | 14h | Pending |
| 4 | [Admin News Management](./phase-04-admin-news-management.md) | Phase 2 | 18h | Pending |
| 5 | [Integration, Verification, and Docs](./phase-05-integration-verification-and-docs.md) | Phases 3 and 4 | 6h | Pending |

## Execution

`Phase 1 → Phase 2 → {Phase 3 || Phase 4} → Phase 5`. Phase 1 needs separate approvals for schema edit, create-only generation, and human application of the reviewed artifact to isolated local/test DB. Production stays human-only. Phase 3 and 4 run concurrently after API contracts stabilize.

Exclusive ownership: P1 schema/migration/shared validation/dependencies; P2 API/auth/tests; P3 public routes/shell/config; P4 admin routes/components/hooks; P5 docs and final verification. New source files stay ≤200 lines. Existing oversized convention-bound files receive minimal wiring only; no unrelated decomposition.

## DB Safety Gate

Missing `prisma/backup/` blocks implementation. Confirm target and usable backup before schema edit; approve schema edit separately; approve create-only generation separately; inspect exact additive SQL; then a human may apply that exact artifact to isolated local/test only for implementation checks. Production backup, migration application, and deployment are always human-run.

## Success Criteria

Published items appear immediately; published edits remain valid and reject stale `expected_updated_at`; articles render securely with metadata; videos open canonical YouTube safely; drafts/admin identity never leak; admin can create/edit/upload/publish/unpublish/delete under state rules; existing visuals remain unchanged except `Tin tức` navigation.

## Red Team Review

Quick core review, 2026-10-05: 9 distinct Critical/High findings accepted—local/test migration applicability, deployment order, optimistic concurrency, oversized-file exception, exact wire schemas, CSRF, API cache headers, closed TipTap grammar/hostile fixtures, and consistent published-edit rules. User overrode “unpublish before edit”: live published edits stay supported with full invariant validation and conflict detection; delete still requires draft.

## Validation Log

| Question | Options | Answer |
|---|---|---|
| Khi bài đã xuất bản, admin sửa/xóa thế nào? | Phải hủy xuất bản trước / Cho sửa trực tiếp khi đang public | Cho sửa trực tiếp khi đang public |
| Card video YouTube dùng thumbnail và cách mở nào? | Thumbnail YouTube + tab mới / Thumbnail tùy chỉnh + tab mới / Thumbnail YouTube + cùng tab | Thumbnail YouTube + tab mới |
| Dòng tác giả trên bài viết hiển thị gì? | Nexus Team / Tên admin / Không hiển thị tác giả | Nexus Team |
| Tên mục trên header dùng chữ nào? | Tin tức / News | Tin tức |

Impact: Phases 1–4 use live published full-record edits with `expected_updated_at`, fixed byline, derived YouTube thumbnail, and Vietnamese nav. Canonical origin is `https://nexusforstartup.site`, grounded in deployment docs.
## Dependencies

Better Auth, Prisma/PostgreSQL, Hono, Zod, Cloudinary, Next.js 16, Mantine, TipTap, Axios/TanStack Query, Lucide. Research: [architecture](./research/architecture-research.md), [UX](./research/spiderum-ux-research.md).
