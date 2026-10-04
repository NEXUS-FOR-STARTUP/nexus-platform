# Phase 1: Rules & Root AGENTS.md

## Context Links
- `.agents/rules/frontend-ui-rules.md`
- `.agents/rules/documentation-management.md`
- `AGENTS.md`
- `README.md`

## Overview
- **Priority:** P1 (Blocker)
- **Status:** Completed
- **Description:** Loại bỏ triệt để các xung đột gây hallucination ngay từ tầng rules của agent (HeroUI, file ma), đồng bộ thông tin cốt lõi tại root `AGENTS.md` và root `README.md`.

## Key Insights
- `.agents/rules/` có cờ `trigger: always_on`, nghĩa là mọi agent khởi tạo đều đọc các file này đầu tiên. Dòng `Nexus stack: HeroUI + Tailwind` là nguyên nhân nguy hiểm nhất khiến các subagent frontend tự động đề xuất hoặc import thư viện HeroUI.
- Root `AGENTS.md` được sinh từ ngày 2026-08-24, hoàn toàn bỏ qua `apps/worker-omp` và package `packages/shared`, đồng thời đưa ra số lượng model/endpoint/test cũ hơn thực tế rất nhiều.

## Requirements
1. **Sửa `.agents/rules/frontend-ui-rules.md`**:
   - Đổi dòng khai báo stack thành `Mantine UI v9 + Tailwind CSS v4`.
   - Xóa bỏ mọi tham chiếu tới HeroUI; giữ nguyên các quy chuẩn Mantine v9 chuẩn (color schemes, `.mantine-Card-root`, `c="dimmed"`, v.v.).
2. **Sửa `.agents/rules/documentation-management.md`**:
   - Thay thế việc cập nhật file ma (`docs/development-roadmap.md`, `docs/project-changelog.md`) bằng `CHANGELOG.md` và các plan file trong thư mục `plans/`.
   - Sửa đường dẫn tham chiếu `./docs/development-rules.md` thành `./.agents/rules/development-rules.md`.
3. **Cập nhật root `AGENTS.md`**:
   - Đổi `Generated:` thành ngày hiện tại (`2026-10-04`).
   - Cập nhật sơ đồ `STRUCTURE`:
     ```text
     root/
     ├── apps/api/         # Hono backend (15 modules, 112 endpoints)
     ├── apps/web-1/       # Next.js 16 product app (port 3001)
     ├── apps/worker-omp/  # AI evaluation daemon (BullMQ + Redis sandbox)
     ├── packages/
     │   ├── shared/       # Shared worker & telemetry metrics (@app/shared)
     │   ├── validation/   # Zod schemas (shared FE↔BE)
     │   ├── eslint-config/# ESLint 9 flat configs
     │   └── typescript-config/ # tsconfig presets
     ├── prisma/           # Root Prisma schema (32 models, 31 migrations)
     ```
   - Sửa bảng `WHERE TO LOOK`: thêm worker-omp, cập nhật test infra lên 48 files.
   - Sửa `CONVENTIONS` & `ANTI-PATTERNS`:
     - Ghi nhận `proxy.ts` (Next.js 16 server-side auth guard + `MAINTENANCE_MODE`), bỏ câu "Auth entirely client-side (no middleware guard)".
     - Thêm quy tắc UI: Student dashboard hỗ trợ mobile responsive; Admin và Supporter là Desktop-only (`DesktopOnlyNotice` < 1024px).
4. **Sửa root `README.md`**:
   - Bỏ `packages/ui/`, thêm `apps/worker-omp/` và `packages/shared/`.
   - Sửa số model Prisma thành 32.
   - Bỏ `@ai-sdk/openai` trong stack backend (thực tế chỉ dùng `@ai-sdk/google`).

## Verification
- Chạy grep kiểm tra toàn bộ workspace không còn chữ `HeroUI` hay `packages/ui`.
- Đảm bảo root `AGENTS.md` phản ánh chính xác cấu trúc thư mục thực tế trên ổ cứng.
