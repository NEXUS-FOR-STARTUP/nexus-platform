# API KNOWLEDGE BASE

## OVERVIEW
Hono backend for monorepo. Handles health, streaming, Better Auth, Prisma access, AI engine (Vercel AI SDK + OpenAI/Google).

## STRUCTURE
```
src/
├── index.ts   # server entry, routes, CORS, auth mount
├── auth.ts    # Better Auth config
├── db.ts      # Prisma client wiring
└── env.ts     # root env load
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Start server | `src/index.ts` | `serve()` entry, port default `8000` |
| Auth config | `src/auth.ts` | Better Auth source of truth |
| DB access | `src/db.ts` | Prisma adapter/client setup |
| Env loading | `src/env.ts` | Reads root `.env` |

## CONVENTIONS
- ESM only.
- Relative imports use `.js` suffix in TS source.
- CORS only for auth routes, localhost `3000`.
- `/api/auth/*` mounts Better Auth handler directly.
- `/health`, `/stream`, `/session` are canonical runtime endpoints.

## ANTI-PATTERNS
- Add second auth system.
- Read env from per-app files.
- Move auth/session logic into web app.
- Hardcode extra localhost origins unless auth flow needs them.
- Replace streaming helper with ad hoc chunking.

## COMMANDS
```bash
npm run dev --workspace=apps/api
npm run build --workspace=apps/api
npm run check-types --workspace=apps/api
```

## NOTES
- Keep auth and Prisma changes aligned with root schema/URL config.
- **Database Migration Safety**: For Prisma schema/migration tasks, MUST read [prisma-migration-safety.md](file:///E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/.agents/rules/prisma-migration-safety.md). Direct DB mutation on production forbidden for agents.
- API is backend-only; no UI conventions here.
- Configure provider API keys in root `.env` (`GOOGLE_GENERATIVE_AI_API_KEY`, `OPENAI_API_KEY`) for AI Engine.

## 1. MODULE MAP

| Module | Mount Path | Routes | Auth | domain/ | application/ | infrastructure/ | http/ |
|--------|-----------|--------|------|---------|-------------|----------------|-------|
| **Cases** | `/api/cases` | 19 | Mixed | ✅ CaseStage, InternalStatus | ✅ 12 use cases | ✅ case.repository | ✅ routes |
| **Admin** | `/api/admin` | 12 | Admin only | ✅ admin.types | ✅ 11 use cases | ❌ uses shared DB directly | ✅ routes |
| **Supporter** | `/api/supporter` | 5 | Supporter/Admin | ❌ (.gitkeep) | ✅ 5 use cases | ❌ uses shared DB directly | ✅ routes |
| **Reports** | `/api/reports` | 4 | Supporter/Admin | ✅ AiCritiqueReport | ✅ 4 use cases | ✅ report.repository | ✅ routes |
| **Payments** | `/api/payments` | 3 | Mixed | ✅ PaymentDecision | ✅ 3 use cases | ✅ payment.repository | ✅ routes |
| **Packages** | `/api/packages` | 1 | Public | ⚠️ stub | ✅ list-packages | ✅ package.repository | ✅ routes |
| **AI Engine** | `/api/ai-engine` | 2 | Authenticated | ✅ DTOs (from @repo/validation) | ✅ 2 use cases | ❌ (.gitkeep) | ✅ routes |
| **Documents** | `/api/documents` | 1 | Authenticated | ✅ DocumentContract | ✅ 5 use cases | ✅ document.repository | ✅ routes |

## 2. SHARED INFRASTRUCTURE

```
shared/
├── domain/app-error.ts  — AppError(status, code, message, details?)
└── infrastructure/
    ├── middlewares/auth.ts  — requireAuth (injects user + session)
    ├── authorization.ts     — requireCaseAccess, requireReportCaseAccess
    ├── http-helpers.ts      — getSession, readJsonBody, handleError
    └── audit-logger.ts      — Structured JSON logger
```

## 3. AUTH LAYERS (4 patterns)

1. **requireAuth middleware** — for AI Engine, Documents routes
2. **getSession() helper** — manual check in handler body (Cases, Payments)
3. **requireCaseAccess(c, caseId, scope)** — role+ownership gate (Cases, Supporter, Reports)
4. **Admin-specific** — `getAdminSession()` checks role=admin

## 4. ERROR HANDLING

```
AppError → caught by controller (handleError) → { code, message, details? }
Uncaught  → global app.onError → { code: "INTERNAL_ERROR", message: "Lỗi hệ thống" }
```

## 5. EXTERNAL SERVICES

| Service | File | Purpose |
|---------|------|---------|
| Cloudinary | `services/cloudinary.ts` | File upload, delete, signed URLs |
| Google Generative AI | `services/google-provider.ts` | Gemini model singleton |

## 6. ENDPOINTS BY MODULE

System (4): GET /, /health, /stream, /session
Auth: POST|GET /api/auth/* (Better Auth handler)
Cases (19): CRUD, revisions, messaging, upgrades, buy-round
Admin (12): Case triage, documents, stats, packages
Supporter (5): Draft report, edit, publish, request info, close
Reports (4): Draft, edit, approve, latest
Payments (3): List, proof upload, verify
AI Engine (2): Team-fit evaluate, save
Documents (1): Upload
Packages (1): List active

Total: 51 endpoints across 10 mount points.

## 7. KNOWN DEVIATIONS

- **admin/ and supporter/ modules lack infrastructure layer** — they use other modules' repos directly
- **ai-engine routes** contain inline Prisma transactions (in handler, not use case)
- **Module communication**: Direct JS imports between modules — no event bus or message broker
- **Imports**: ESM with `.js` suffix in relative imports
- **Prisma schema**: lives at root `prisma/`, referenced via relative path
