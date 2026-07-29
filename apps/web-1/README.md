# Web-1

Next.js 16 product app. Mantine UI v9, TanStack Query v5 / Form v1, Lucide React, Tailwind CSS v4. 3 persona surfaces: student, admin, supporter.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** Mantine UI v9, Tailwind CSS v4
- **State:** TanStack Query v5, TanStack Form v1
- **Icons:** Lucide React
- **Auth:** Better Auth client (`better-auth/react`)
- **Charts:** Recharts (via @mantine/charts)
- **Editor:** TipTap (@mantine/tiptap)

## Run dev

```bash
npm run dev --workspace=apps/web-1
# or from root:
npm run dev
```

Port: `3001`

## Build

```bash
npm run build --workspace=apps/web-1
```

## Docker

```bash
docker build -t nexus-web -f apps/web-1/Dockerfile .
```

Full guide: `docs/docker-build-push-guide.md`

## CI/CD

GitHub Actions workflow: `docs/ci-guide.md`

## Documentation

| Doc | When to Read |
|-----|-------------|
| `apps/web-1/AGENTS.md` | Conventions, hooks, data fetching patterns |
| `docs/docker-build-push-guide.md` | Build/push Docker image |
| `docs/ci-guide.md` | CI/CD pipeline |
