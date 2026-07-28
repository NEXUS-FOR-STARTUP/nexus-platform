# CI Guide

## Overview

GitHub Actions workflow defined in `.github/workflows/ci.yml`.

**Jobs:** `build` + `check-types` (không chạy unit test).

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
