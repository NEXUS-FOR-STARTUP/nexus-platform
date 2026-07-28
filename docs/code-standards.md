# Code standards

_Cập nhật: 2026-07-23_

## Repo structure

- `apps/api`: Hono backend, Better Auth, Prisma, document/report/payment workflows.
- `apps/web-1`: Next.js 16 product app (Mantine UI v9).
- `packages/ui`: shared React primitives.
- `packages/validation`: Zod schemas chia sẻ giữa api và web-1.
- `prisma/schema.prisma`: single source of truth cho data model.
- Tài liệu DB tham khảo: [`db-query-guide.md`](./db-query-guide.md), [`db-backup-guide.md`](./db-backup-guide.md).

## TypeScript

- **Strict mode:** `strict: true` (theo tsconfig presets trong `packages/typescript-config/`).
- ESM: relative import trong TS dùng `.js` suffix.
- `as any` hạn chế tối đa — dùng type narrowing hoặc branded types.
- Prefer `interface` over `type` cho object types (trừ union/intersection).
- Nullable fields khai báo rõ với `| null`, không dùng optional chaining để che type lỗi.

## Naming conventions

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Biến / hàm | `camelCase` | `getCaseDetails`, `formatPrice` |
| Component | `PascalCase` | `WorkspaceSidebar`, `TabDiscussionChat` |
| Type / Interface | `PascalCase` | `CaseData`, `IntakeDocument` |
| File (TS/TSX) | `kebab-case` | `use-case-details.ts`, `workspace-sidebar.tsx` |
| File (routes) | `[param]` | `case/[id]/page.tsx` |
| File (components) | `PascalCase` | `WorkspaceSidebar.tsx` |
| DB tables | `snake_case` plural | `service_packages`, `case_members` |
| DB columns | `snake_case` | `user_facing_stage`, `locked_price` |

## API standards

- Mount auth qua `/api/auth/*` (Better Auth).
- Keep CORS narrow, chỉ cho phép origin cần thiết.
- Stream/health/session là runtime endpoint nền tảng.
- Authorization: role + case membership từ `apps/api`, không duplicate policy ở frontend.
- Contract mới cho document workspace: additive, backward-compatible với case detail payload hiện có.

## API module organization

- Bounded context theo domain: cases, reports, payments, packages, documents, admin, supporter, ai-engine.
- Layering theo clean architecture: domain → application → infrastructure → presentation.
- Modules giao tiếp trực tiếp qua use-case/service, không cần event bus cho MVP.
- Shared infra: `AppError` class, `requireAuth` middleware, `requireCaseAccess` authorization, audit-logger.

## Error handling

- **API:** Dùng `AppError` class — structured JSON response với `{ error, code, status }`.
- **Frontend:** TanStack Query `onError` callback + `@mantine/notifications` cho user-facing error.
- **Network:** Axios interceptor cho global error handling (401 → redirect login).
- **Validation:** Zod schemas (`packages/validation`) — parse input ở cả API và frontend.
- **Không:** try/catch tràn lan ở component — delegate lên hook hoặc query layer.

## Web standards

- Next.js App Router, route groups: public, auth, dashboard, supporter, admin.
- Giữ UI consistent với Mantine UI v9 và shared primitives (`packages/ui`).
- Không đưa business logic nặng vào component page — tách hook/module.
- Với Nexus MVP, ưu tiên shared workspace shell thay vì page flow rời rạc.
- Phân biệt rõ 2 lớp document flow: intake (hybrid Drive/Docs + checklist) và workspace (checkpoint/version/assessment).
- Discussion/chat hiện là REST + polling; không viết tài liệu hoặc UI như thể đã có realtime socket.
- Payment là surface phụ; không để nó lấn narrative chính của audit/review flow.
- Data fetching: TanStack Query + Axios. Không dùng Redux/Zustand — server state qua query.
- Forms: TanStack Form everywhere.
- Icons: Lucide React, không dùng Mantine icons.

## Testing standards

_Trạng thái hiện tại: Chưa có test file trong codebase._

- **Unit test:** prefer Vitest (phù hợp với Vite/esbuild toolchain của Turborepo).
- **Component test:** Testing Library + Vitest (nếu setup sau này).
- **E2E test:** Playwright (khuyến nghị, chưa setup).
- **API test:** Vitest + Hono `app.request()` helper.
- Test naming: `{module}.test.ts` hoặc `{component}.test.tsx`, đặt cạnh file cần test.
- Coverage: không bắt buộc ở MVP, nhưng khuyến khích cho core business logic.

## Documentation standards

- Doc nói đúng hiện trạng, không invent API hay env key.
- File mới đặt theo topic rõ ràng, không tạo folder rỗng.
- Giữ nội dung ngắn, scan nhanh, tách ý theo heading.
- Khi mô tả MVP demo flow, ghi rõ code-confirmed vs deferred decision.
- Nếu bề mặt đã tồn tại (document workspace, chat, timeline, supporter output, sidebar, payment page, revision rounds...) mô tả đúng vai trò hiện tại trước khi đề xuất thay đổi.
- Với DB docs: phân biệt runtime config (`DATABASE_URL`/`DIRECT_URL`) và read-only (`READONLY_DATABASE_URL`).
- Mọi file trong `docs/` nên có timestamp cập nhật trong header.

## Database conventions

- Plural table names: `service_packages`, `case_members`, `document_records`.
- Snake_case columns: `user_facing_stage`, `locked_price`, `last_price_changed_at`.
- Migration: tạo qua `prisma migrate dev`, commit migration files.
- Read-only queries: dùng `READONLY_DATABASE_URL` (xem [`db-query-guide.md`](./db-query-guide.md)).
- Backup: tham khảo [`db-backup-guide.md`](./db-backup-guide.md).

## Conventions chung

- Một root `.env`, không tách env per app.
- Prisma CLI chạy từ root (`prisma generate --schema prisma/schema.prisma`).
- Auth/session logic chỉ sống trong `apps/api`.
- Frontend không tự định nghĩa access policy riêng.
