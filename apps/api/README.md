# API

Hono backend for Nexus Platform.

## Tech Stack

- Hono (Backend framework)
- Better Auth (Authentication)
- Prisma 7 (Database client)
- Vercel AI SDK + Core Providers (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`)

## Core Features

- Health check at `/health`
- Streaming demo at `/stream`
- Better Auth at `/api/auth/*`
- Bounded contexts modules (Cases, Reports, Payments, Packages, AI Engine) mounted at `/api/*`
- Prisma access through root schema
- AI analyses using Google Gemini + OpenAI via Vercel AI SDK

## Folder Structure (Modular Monolith + Clean Architecture + DDD)

Code grouped by **business domains (Bounded Contexts)** in `src/modules/`, not technical folders. Each module split into 4 Clean Architecture layers:

```
apps/api/src/
├── index.ts                      # Entry point, boots server, registers modules
├── env.ts                        # Environment config
├── auth.ts                       # Better Auth config
├── db.ts                         # Prisma database client setup
├── shared/                       # Shared Kernel (cross-cutting concerns)
│   ├── domain/                   # Generic domain interfaces/primitives
│   ├── application/              # Common exceptions & helpers
│   └── infrastructure/           # Base Prisma repo, shared requireAuth middleware
└── modules/                      # Business Modules (Bounded Contexts)
    └── [module_name]/            # e.g., cases, reports, payments, packages, ai-engine
        ├── domain/               # Domain Layer (Pure TS - Entities, Value Objects, Repo Interfaces)
        ├── application/          # Application Layer (Use Cases, DTOs)
        ├── infrastructure/       # Infra Layer (Prisma Repo implementations, external clients)
        └── presentation/         # Presentation Layer (Hono routes & controller handlers)
```

### Module Communication Rules
- **Direct Calls**: Modules communicate by directly importing target module's Application Services / Use Cases.
- **No Sockets/Event-Buses**: No messaging brokers, sockets, or event buses in this phase.
- **Decoupled Database**: Modules reference users via `auth_user_id: String`. No strict Prisma model-level relations with Better Auth `User` model.

### Better Auth Integration
- Setup in `src/auth.ts`.
- Routes mounted via `app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))`.
- Authenticated endpoints guarded by shared middleware `requireAuth` (`src/shared/infrastructure/middlewares/auth.ts`).

## Setup

Run from repo root:

```bash
npm install
```

Set root `.env`:

- `PORT` (default `8000`)
- `DATABASE_URL`
- `DIRECT_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Payment proof uploads use Cloudinary public URLs; local `/uploads/*` serving removed.

## Run

```bash
npm run dev --workspace=apps/api
```

## Build and checks

```bash
npm run build --workspace=apps/api
npm run check-types --workspace=apps/api
```

## Docker

```bash
docker build -t nexus-api -f apps/api/Dockerfile .
```

Full guide: `docs/docker-build-push-guide.md`

## CI/CD

GitHub Actions workflow: `docs/ci-guide.md`

## Database

| Guide | When to Read |
|-------|-------------|
| `docs/db-query-guide.md` | Safe DB query via READONLY_DATABASE_URL |
| `docs/db-backup-guide.md` | Backup before migration |
| `docs/db-migration-guide.md` | Prisma migration workflow |
