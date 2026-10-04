# Journal: Migrate Monorepo Package Manager from npm to Bun

**Date**: 2026-09-08  
**Status**: Completed  
**Scope**: Root monorepo, `apps/api`, `apps/web-1`, CI/CD, and developer tooling

---

## 1. Context & Motivation

Dự án Nexus Platform trước đây sử dụng `npm@11.11.1` làm package manager cho toàn bộ monorepo (Turborepo) và Node.js làm runtime cho cả API (Hono) lẫn Web (Next.js 16). Việc chuyển đổi sang **Bun** mang lại các lợi ích lớn:
1. **Tốc độ cài đặt & build**: Tối ưu đáng kể thời gian `install` và `prune`/`build` trong CI/CD lẫn môi trường dev.
2. **API Native Performance**: Chạy Hono backend trên native runtime `Bun.serve` với hiệu năng HTTP cao hơn, khởi động tức thì (`bun --watch`).
3. **Web Production Stability**: Giữ nguyên 100% runtime Node.js (`node:24.18.0-alpine`) cho Next.js 16 standalone server trên production runner container để tuân thủ khuyến cáo chính thức của Vercel/Next.js.

---

## 2. Version & Runtime Matrix

| Thành phần | Trước chuyển đổi | Sau chuyển đổi |
| :--- | :--- | :--- |
| **Package Manager (Toàn repo)** | `npm@11.11.1` (`package-lock.json`) | **`bun@1.4.0`** (`bun.lock`) |
| **API Runtime (Dev & Prod)** | Node.js (`tsx watch` / `node dist`) | **Bun** (`bun --watch` / `bun dist`) |
| **API Docker Runner Image** | `node:24.18.0-alpine` | `oven/bun:1.4.0-alpine` |
| **Web Runtime (Prod Runner)** | Node.js (`node server.js`) | **Node.js** (`node server.js`) *(Giữ nguyên)* |
| **Web Docker Runner Image** | `node:24.18.0-alpine` | `node:24.18.0-alpine` *(Giữ nguyên)* |
| **Web Docker Builder Stage** | npm (`npm ci` / `npm run build`) | **Bun** (`bun install` / `bun run build`) |
| **CI Engine (GitHub Actions)** | `actions/setup-node@v4` (Node 22) | `oven-sh/setup-bun@v2` (Bun 1.4.0) |

---

## 3. Summary of Changes

### 3.1. Bộ file sao lưu phục vụ Rollback (Backup Files)
Đã tạo 4 file backup nguyên vẹn trước khi áp dụng bất kỳ thay đổi cấu hình nào:
- `package-lock.json.backup` (sao lưu từ `package-lock.json` của `npm@11.11.1`)
- `apps/api/Dockerfile.npm` (sao lưu Dockerfile API dùng npm + Node.js runner)
- `apps/web-1/Dockerfile.npm` (sao lưu Dockerfile Web dùng npm + Node.js runner)
- `.github/workflows/ci.npm.yml.backup` (sao lưu workflow GitHub Actions dùng npm, đuôi .backup để GitHub Actions không chạy nhầm)

### 3.2. Cập nhật Root Monorepo
- `package.json`: Đổi `"packageManager": "npm@11.11.1"` thành `"packageManager": "bun@1.4.0"`.
- Chạy `bun install` sinh ra file `bun.lock` (209KB).
- Xóa `package-lock.json` khỏi git tracking (đã có bản `.backup`).

### 3.3. Cập nhật `apps/api`
1. **Source Code (`apps/api/src/index.ts`)**:
   - Khởi chạy song song linh hoạt: tự động phát hiện nếu có `Bun` runtime thì dùng `Bun.serve({ fetch: app.fetch, port })`, nếu chạy trên Node.js thì dùng `@hono/node-server` `serve({ fetch: app.fetch, port })`.
   - Bổ sung typed interface `BunRuntime` tránh dùng `any` vi phạm coding standard.
2. **Scripts (`apps/api/package.json`)**:
   - `"dev"`: `bun --watch src/index.ts`
   - `"start"`: `bun dist/index.js`
   - `"build"`: `bun run prisma:generate && tsc`
   - `"check-types"`: `bun run prisma:generate && tsc --noEmit`
3. **Dockerfile (`apps/api/Dockerfile`)**:
   - Base stage: `oven/bun:1.4.0-alpine`
   - Turbo prune stage: `oven/bun:1.4.0-alpine` (chạy `bun add -g turbo@^2` và `turbo prune nexus-platform-api --docker`)
   - Deps stage: `bun install --frozen-lockfile && mkdir -p /app/apps/api/node_modules`
   - Builder stage: `bun run --filter nexus-platform-api build`
   - Runner stage: `oven/bun:1.4.0-alpine`, chạy `CMD ["bun", "apps/api/dist/index.js"]`

### 3.4. Cập nhật `apps/web-1`
1. **Dockerfile (`apps/web-1/Dockerfile`)**:
   - Base/Turbo/Deps/Builder: Dùng `oven/bun:1.4.0-alpine` (`bun add -g turbo@^2`) để prune, cài đặt dependencies và build standalone cực nhanh.
   - Runner stage: Giữ nguyên `node:24.18.0-alpine`, chạy `CMD ["node", "apps/web-1/server.js"]` đảm bảo tương thích 100% với Next.js 16 standalone output.

### 3.5. Cập nhật CI/CD & Developer Tooling
- `.github/workflows/ci.yml`: Đổi sang `oven-sh/setup-bun@v2` (version `1.4.0`), thay `npm ci` bằng `bun install --frozen-lockfile`.
- `Makefile`: Đổi toàn bộ các target `dev`, `build`, `lint`, `check-types`, `test` sang `bun run ...`.
- `AGENTS.md` & `README.md`: Cập nhật toàn bộ hướng dẫn cài đặt và chạy lệnh sang `bun`.

---

## 4. One-line Rollback Procedure

Nếu cần hoàn tác khẩn cấp về môi trường npm cũ, thực hiện lệnh duy nhất sau:
```bash
cp package-lock.json.backup package-lock.json && \
cp apps/api/Dockerfile.npm apps/api/Dockerfile && \
cp apps/web-1/Dockerfile.npm apps/web-1/Dockerfile && \
cp .github/workflows/ci.npm.yml.backup .github/workflows/ci.yml && \
npm install
```

---

## 5. Verification Checklist

- [x] 4 file backup tồn tại và nguyên vẹn.
- [x] Root `package.json` khai báo `bun@1.4.0`.
- [x] Lockfile `bun.lock` sinh chuẩn xác từ monorepo.
- [x] `apps/api/src/index.ts` hỗ trợ native `Bun.serve` và fallback Node.js.
- [x] Dockerfile API chạy `oven/bun:1.4.0-alpine`.
- [x] Dockerfile Web runner chạy `node:24.18.0-alpine`.
- [x] CI workflow cấu hình `setup-bun@v2`.
- [x] TypeScript type checking pass trên toàn bộ monorepo.
