---
title: "News content management planning"
description: "Architecture and UX decisions for Nexus articles and YouTube News."
created: 2026-10-05
tags: [planning, news, frontend, backend, database]
---

# News content management planning

## Context

Planned public News and admin content management across Prisma, Hono, Next.js, Mantine, TipTap, and Cloudinary.

## Decisions

- One `NewsItem` chronology with article/video discriminant.
- Article: internal slug detail, TipTap JSON, managed cover, fixed `Nexus Team` byline.
- Video: normalized YouTube ID, derived thumbnail, safe new-tab link, no internal detail.
- Public UI: Nexus-native editorial hierarchy inspired by Spiderum 2025–2026; no visual clone or global style change.
- Navigation label: `Tin tức`; route: `/news`.
- Published article supports live full-record and cover edits; immutable slug, retained first publication date, optimistic `updated_at` conflict control.
- API and Next public fetch stay no-store; admin API is private no-store.
- Admin stays desktop-only; public routes are responsive.

## Safety

- No schema/migration command ran.
- Current research found local `DATABASE_URL`, missing `DIRECT_URL`, and no `prisma/backup/`.
- Implementation requires separate target/backup, schema-edit, create-only, and isolated local/test apply approvals. Production migration/deployment remains human-run.

## Outcome

Plan: `plans/261005-2236-news-content-management/plan.md`. Five phases; public and admin UI can run in parallel after contracts/API stabilize. Core red-team findings and user validation decisions were incorporated.
