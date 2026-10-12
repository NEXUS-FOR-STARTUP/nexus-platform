---
title: "Spiderum-inspired News UX research"
description: "Recent Spiderum 2025–2026 evidence adapted into a Nexus-native public and admin News experience."
created: 2026-10-05
tags: [feature, frontend, ui, ux]
---

# Spiderum-inspired News UX research

## Conclusion

Use Spiderum as reference for reading rhythm and information hierarchy, not brand/UI copying. Nexus direction: content-first editorial layout, existing Sapphire Blue tokens, Google Sans Flex, generous whitespace, 720px article measure, wide cover image, clear metadata.

Do not import Spiderum social mechanics: comments, reactions, follows, fixed action rail, categories/tags, popularity sorting. No reading-progress bar; none was observed in recent snapshots.

## Evidence

Live Spiderum returned HTTP 503 on 2026-10-05. Recent archived sources:

- Home, 2026-01-05: https://web.archive.org/web/20260105063419id_/https://spiderum.com/
- Article, 2026-01-12: https://web.archive.org/web/20260112225858id_/https://spiderum.com/bai-dang/Review-nhung-quyen-sach-minh-da-doc-nam-2025-3Htj0kFZX52W
- Category page, 2026-02-15: https://web.archive.org/web/20260215102105id_/https://spiderum.com/danh-muc/sach
- Article, 2025-06-14: https://web.archive.org/web/20250614085525id_/https://spiderum.com/bai-dang/Loi-khuyen-cho-nhung-ban-tre-muon-bat-dau-viet-bai-tren-Spiderum-x7x

Observed list/card hierarchy:

- Thumbnail.
- Content type/category and reading time.
- Title.
- Excerpt.
- Author/source metadata.
- Video block uses thumbnail + play icon and links directly to YouTube; no internal video detail observed.

Observed article hierarchy:

- Category, H1, excerpt/deck, author/date, cover/body, article actions, author module, more content.
- Body supports headings, emphasis, lists, blockquotes, inline figures and captions.
- 2025 desktop body measured near 700px; body around 19/32px, H1 around 42/58px. Mobile H1 near 34/42px and body stayed readable.
- Fixed social rail exists but depends on excluded social features and is unsuitable for Nexus mobile.

Archive CSS/assets were incomplete. Structure and metadata are reliable; colors and full spacing are not treated as canonical.

## Nexus-native direction

Name: **Nexus Editorial**.

Keep current global style:

- Font: Google Sans Flex. Do not add Spiderum/Noto Serif/Montserrat or change global font.
- Colors: existing semantic tokens only. Brand `#2563EB`; light background/surface/text `#F8FAFC/#FFFFFF/#0F172A`; existing dark tokens.
- No gradients, decorative glow, or heavy card shadow.
- Motion only 150–200ms color/opacity/subtle image transform; honor reduced motion.

Suggested design values:

| Role | Value |
|---|---|
| Public container | Mantine `Container size="lg"` |
| Article body | max 720px, 60–75 chars/line |
| Page H1 | 32/40 base, 40/48 at md+ |
| Article H1 | 32/40 base, 44/52 at md+ |
| Deck | 18/28, muted token |
| Body | 17/30 base, 18/32 at md+ |
| H2/H3 | 28/36 and 22/30 |
| Card title | 20/28, weight 600, 2-line clamp |
| Metadata/badge | 14/20 and 12/16 |
| Media | 16:9, 12px radius, reserved aspect ratio |
| Spacing | 4/8/12/16/24/32/48/64px |
| Controls | minimum 44×44px, visible 2px focus ring |

Breakpoints: base under 768px, sm 768px, md 992px, lg 1200px. Admin remains blocked below 1024px.

## `/news` design

Header:

- Add `Tin tức` to desktop AppShell header and mobile drawer.
- Active state uses weight plus underline/border, not color alone.
- Preserve 64px header, logo, theme toggle, login, existing desktop design.

Page hierarchy:

1. Compact intro: H1 `Tin tức`, one-line purpose statement.
2. First published item as lead card: desktop split image/copy; mobile stacked.
3. Remaining cards: one column base, two columns from sm; 24px gap.
4. Pagination below feed.

Card:

- 16:9 media, badge with icon and exact text `Bài viết`/`Video`.
- Title, excerpt, publication date. Article also gets derived `x phút đọc`.
- Article card: one Next Link to internal detail.
- Video card: one external anchor; visible `Mở trên YouTube` + Lucide ExternalLink; accessible new-tab label and safe rel.
- No nested interactive control inside whole-card anchor.
- Card media may use empty alt when adjacent title describes same link; detail cover uses authored alt.

States:

- Skeleton reserves media/title/metadata geometry.
- Empty: `Chưa có nội dung được xuất bản` / `Tin mới sẽ xuất hiện tại đây.`
- Error: inline message and `Thử lại`, keeping shell visible.
- Invalid empty page should resolve predictably, not render a blank grid.

## `/news/[slug]` design

Only published articles resolve. Drafts and videos return 404.

- Header max 900px: `Bài viết` badge, H1, excerpt, `Nexus Team · ngày xuất bản · x phút đọc`.
- Cover can break out to public container width; body returns to max 720px.
- Body paragraphs 17–18/30–32px, 20px bottom gap.
- H2/H3 use defined scale and sequential hierarchy.
- Blockquote: 3px brand left border and 20px left padding.
- Links: brand, visible underline on hover/focus.
- No fixed social rail, comments, reactions, author profile, related/category modules, or reading progress.
- 404 copy: `Không tìm thấy bài viết` with `Quay lại Tin tức`.

Responsive/accessibility:

- Gutter 16px base, 24px sm, 32px lg.
- Semantic `<ul>/<li>` feed and `<article>` detail; one H1.
- Visible focus, keyboard access, ≥44px targets, external-link phrase for screen readers.
- No horizontal overflow at 390/768/1024/1440.
- Dark mode uses current semantic mapping; images are not inverted.
- Lead image loads eagerly; lower cards lazy; all media has dimensions/sizes to avoid CLS.

SEO baseline:

- `/news`: title, description, canonical.
- Article: async Next.js 16 `generateMetadata`; title, excerpt description, canonical, OG/Twitter cover, article type, published and modified times.
- Video has no internal detail metadata or sitemap route.
- Drafts never reach public fetch or indexable route.

JSON-LD, sitemap automation, social-share controls, and related content are deferred; not required for held scope.

## Admin UX

Information architecture:

- Add `Tin tức` to current DoubleNavbar and `VALID_TABS`.
- News tab renders isolated `AdminNewsManager`; do not add News state directly to 700+ line `admin/page.tsx`.
- Main list has CTA `Tạo nội dung`; editor uses dedicated `/admin/news/new` and `/admin/news/[id]` pages, not a modal/drawer.

List:

- Filters: type (`Tất cả/Bài viết/Video`), status (`Tất cả/Bản nháp/Đã xuất bản`), sort (`Mới cập nhật/Mới xuất bản/Cũ nhất`). No keyword search.
- Table: 96×54 thumbnail, title/excerpt, type badge, status badge, updated date, published date, action menu.
- Actions: edit, publish/unpublish, delete. Published item must be unpublished before delete.
- Empty and filtered-empty states have explicit copy and reset/create action.

Create/edit:

- First choice: `Bài viết` or `Video`. Type locks after first save.
- Common: title, excerpt, status summary.
- Article: server-generated slug shown/editable before first publication, cover upload, alt text, TipTap body.
- Video: YouTube URL with immediate canonical validation and derived thumbnail preview; no article body/slug/cover upload.
- Sticky desktop action bar: `Lưu nháp`/`Lưu thay đổi`; separate `Xuất bản` action after a successful save.
- No standalone public draft-preview route in held scope. Article editor and card thumbnail provide sufficient authoring preview.
- Dirty form guard for route/back/reload; no autosave.
- Destructive delete uses Mantine confirmation modal with item title and irreversible effect.

TipTap:

- Separate client component with `immediatelyRender: false`.
- H2/H3 only; H1 comes from title field.
- Toolbar: undo/redo, bold, italic, underline, strike, H2/H3, bullet/ordered list, blockquote, link, horizontal rule.
- Vietnamese control labels; sticky toolbar; editor min height 480px, content max 760px.
- No inline images, video embeds, tables, raw HTML, font/color/alignment controls.

Cover:

- Article: JPG/PNG/WebP, max 5MB, recommended 1600×900, minimum 1200×675, required 16:9 preview and alt before publish.
- Video: derived YouTube thumbnail only. No arbitrary remote host or custom override in held scope.

## Risks

1. Whole-card anchors cannot contain nested buttons/links.
2. TipTap JSON still needs server node/mark/link allowlisting.
3. YouTube thumbnail may be unavailable at max resolution; use deterministic `hqdefault` fallback.
4. Public detail must stay a Server Component; isolate editor/client interactions.
5. Changing published slug breaks backlinks; lock it.
6. News must be added to `proxy.ts` matcher so maintenance mode remains site-wide.

## External standards

- WCAG 2.2 contrast: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- WCAG target size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Next.js 16 metadata: https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/04-functions/generate-metadata.mdx
- Mantine v9 TipTap: https://github.com/mantinedev/mantine/blob/9.0.0/apps/mantine.dev/src/pages/x/tiptap.mdx
