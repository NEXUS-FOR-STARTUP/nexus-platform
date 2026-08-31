# Journal — GA-09 / GA-10 case list + admin export

Date: 2026-08-25

## What shipped

Server-side case list pagination/search/sort for user, supporter, and admin. Admin CSV export of four full resources (cases, deposits, transactions, orders). No migration.

HTTP contract aligned with notifications + wallet history:

```
GET /cases?page=1&limit=20
GET /admin/cases?page=1&limit=20&view=all
→ { items, total, page, limit }
```

`limit` default 20, max 50. Invalid query returns 400. Prisma still uses `skip = (page - 1) * limit`.

Export: `GET /admin/exports?resource=...` — admin only, no filters, UTF-8 BOM, formula prefix, `Cache-Control: no-store`, row cap 10_000.

## Decisions

- `page` not `offset` at HTTP. Plan first draft copied wallet *repo*; wallet *HTTP* already used `page`.
- Export has no filter UI/API. Admin picks one resource, downloads all rows.
- Admin sidebar buckets moved to `view=` so pagination totals stay correct.
- Package filter on admin table dropped — no API field.

## Review

Score 6/10, 1 critical: admin sort `split("_")` on `created_at_desc` always collapsed to `created_at desc`. Fixed with `/^(created_at|case_code)_(asc|desc)$/`.

Also fixed: no intake JSON on `GET /cases`, CSV formula guard, export cache header, CORS `Content-Disposition`, page cap 500, export error blob message.

Left: queue badge still uses `view=all` total; tests do not assert Prisma `where`.

## Verify

`tsx --test case-list-export.test.ts` 19/19. `tsc` api / web-1 / validation clean.
