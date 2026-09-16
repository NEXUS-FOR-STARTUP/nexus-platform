# Phase 01: Code & Build Packaging

## Context Links
- Plan: [`plan.md`](./plan.md)
- Target: `apps/api/package.json`, `apps/api/src/modules/reports/infrastructure/pdf/pdfService.ts`

## Overview
- Date: 2026-09-16
- Priority: P0
- Status: Completed

## Key Insights
- Trình biên dịch `tsc` chỉ xử lý các file `.ts` sang `.js`, bỏ qua các file tĩnh không phải TypeScript như `templates/report.typ` và `fonts/Merriweather/*.ttf`.
- Do đó, khi `apps/api` chạy từ `dist/` (`bun apps/api/dist/index.js`), hàm `readFileSync(templatePath)` ném lỗi `ENOENT`.
- Đã tự động hóa việc copy tài nguyên vào `dist/` khi build, đồng thời thêm cơ chế fallback đường dẫn trong code TypeScript để phòng vệ chiều sâu.

## Implementation Steps
1. Cập nhật `apps/api/package.json` build script:
   - Thêm lệnh copy đệ quy `templates/` và `fonts/` vào `dist/modules/reports/infrastructure/pdf/`.
   - Sử dụng `node:fs` thông qua `bun -e` để đảm bảo 100% tương thích cross-platform (Windows & Linux).
2. Cập nhật `pdfService.ts`:
   - Thay thế việc hardcode `resolve(__dirname, "templates")` và `resolve(__dirname, "fonts")` bằng các hàm fallback an toàn (`resolveTemplatesDir`, `resolveFontsDir`).
   - Kiểm tra lần lượt: `__dirname/templates` -> `src/.../templates` -> `process.cwd()/apps/api/.../templates`.

## Todo List
- [x] Cập nhật `build` script trong `apps/api/package.json`
- [x] Bổ sung `resolveTemplatesDir` và `resolveFontsDir` trong `pdfService.ts`

## Success Criteria
- Chạy `bun run --filter nexus-platform-api build` tạo ra đầy đủ `dist/modules/reports/infrastructure/pdf/templates/report.typ` và `dist/modules/reports/infrastructure/pdf/fonts/Merriweather/*.ttf`.
