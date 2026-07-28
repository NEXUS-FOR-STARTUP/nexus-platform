# Nexus Platform

Monorepo cho `apps/api`, `apps/web-1`, và shared `packages/*`. Nền tảng workflow hỗ trợ phản biện có cấu trúc: `student → admin → supporter`.

## Stack

- **Frontend:** Next.js 16.2.0, React 19.2.0, Mantine UI v9 (`@mantine/core`, `@mantine/hooks`, `@mantine/charts`, `@mantine/tiptap`, `@mantine/notifications`, `@mantine/dropzone`...)
- **TanStack:** Query v5, Form v1, Virtual v3
- **UI:** Lucide React (icons), Recharts (charts), TipTap (editor)
- **Backend:** Hono 4.12, Better Auth 1.4 (email/password + Google OAuth), Vercel AI SDK (`@ai-sdk/google`, `@ai-sdk/openai`)
- **Database:** Prisma 7 + PostgreSQL (PgBouncer adapter)
- **Tooling:** TypeScript, Turborepo, Tailwind CSS v4, next-themes, dayjs, axios
- **Monorepo:** npm workspaces, Turbo 2.10

## Structure

```txt
root/
├── apps/api/        # Hono backend, auth, Prisma, streaming
├── apps/web-1/      # Next.js 16 product app (Mantine UI v9)
├── packages/
│   ├── ui/          # Shared React primitives
│   ├── validation/  # Zod schemas (IdeaInput, TeamFitInput...)
│   ├── eslint-config/ # ESLint 9 flat configs
│   └── typescript-config/ # tsconfig presets
├── prisma/          # Root Prisma schema (16 models)
├── docs/            # Product + technical documentation
├── .agents/rules/   # Agent development rules
└── .codegraph/      # Code intelligence index
```

## Setup

```bash
npm install
```

Tạo root `.env` từ `.env.example`, set:

- `DATABASE_URL`
- `DIRECT_URL`
- `READONLY_DATABASE_URL` — chỉ dùng cho query đọc an toàn (xem [`docs/db-query-guide.md`](docs/db-query-guide.md))
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_API_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GOOGLE_GENERATIVE_AI_API_KEY` *(tuỳ chọn, cho AI engine)*
- `OPENAI_API_KEY` *(tuỳ chọn, cho AI engine)*

Cloudinary dùng cho upload minh chứng thanh toán. Lưu `secure_url` trong payment record.

## Run

```bash
npm run dev
```

Ports:

- API: `8000`
- Web: `3001`

## Build và checks

```bash
npm run build
npm run lint
npm run check-types
npm run prisma:generate
npm run prisma:migrate
```

## Quy ước

- Một root `.env` duy nhất — không tách env per app.
- API sở hữu auth và session logic (Better Auth mount tại `/api/auth/*`).
- Prisma: plural table names + snake_case columns.
- Toàn bộ code conventions: xem [`docs/code-standards.md`](docs/code-standards.md).
- DB query an toàn: xem [`docs/db-query-guide.md`](docs/db-query-guide.md).
- `docs/tech-doc-urls.txt` là nguồn tham khảo external library docs.

## Tài liệu chính

| File | Mô tả |
|------|-------|
| `docs/project-context.md` | Business context canonical |
| `docs/project-overview-pdr.md` | MVP demo realignment PDR |
| `docs/system-architecture.md` | Kiến trúc hệ thống hiện trạng |
| `docs/codebase-summary.md` | Tóm tắt codebase verified |
| `docs/code-standards.md` | Chuẩn code và conventions |
| `docs/db-query-guide.md` | Hướng dẫn truy vấn DB an toàn |
| `docs/db-backup-guide.md` | Hướng dẫn backup DB |
