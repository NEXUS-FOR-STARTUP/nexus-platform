# CI Guide

_Cập nhật: 2026-08-03._

## Overview

GitHub Actions workflow defined in `.github/workflows/ci.yml`.

**Jobs:** 1 job duy nhất `build-and-typecheck` — chạy tuần tự `npm run build` rồi `npm run check-types` (không chạy unit test).

Job env:
- `TURBO_TELEMETRY_DISABLED: 1` — tắt telemetry của Turbo.
- `DATABASE_URL` placeholder (dummy) — Prisma cần để generate client, không cần DB thật.

## Trigger

| Event | Branch |
|-------|--------|
| Push | `main` |
| Pull Request | targeting `main` |

## Steps

1. `actions/checkout@v4`
2. `actions/setup-node@v4` — Node 22, cache npm
3. `npm ci` — clean install
4. `npm run build` — turbo build (kèm prisma generate)
5. `npm run check-types` — turbo type check

## View Results

- **PR:** Tab "Checks" trên GitHub PR page
- **Push:** GitHub repo → Actions tab → chọn workflow "CI"

Tự động fail nếu build hoặc type check lỗi.

## Local Run

```bash
npm run build
npm run check-types
```

Yêu cầu `DATABASE_URL` trong `.env` (Prisma client cần để generate).

## Troubleshoot

| Symptom | Cause | Fix |
|---------|-------|-----|
| Prisma client lỗi | Thiếu `DATABASE_URL` | Set env variable (dummy OK cho CI) |
| Cache miss slow | cache npm chưa warm | Chờ lần chạy đầu cache |
| `npm ci` fail | `package-lock.json` outdated | `npm install` và commit lại lock |
