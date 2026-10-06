---
title: "Fix Typst PDF Generation Engine on Production Docker"
description: "Khắc phục triệt để lỗi PDF_GENERATION_FAILED (500) trên production: cài đặt Typst CLI vào Dockerfile của apps/api, copy templates/fonts vào dist/ qua build script, và thêm cơ chế fallback path an toàn."
status: completed
priority: P0
effort: 1h
branch: fix/typst-pdf-generation-engine
tags: [fix, backend, pdf, typst, docker, reports]
blockedBy: []
blocks: []
created: 2026-09-16
completed: 2026-09-16
---

# Fix Typst PDF Generation Engine on Production Docker

## Overview
Khi chạy trên Production, endpoint `GET /api/reports/:id/download?view=inline` bị lỗi `500 PDF_GENERATION_FAILED` do container Docker của `apps/api` thiếu binary `typst` và thiếu các tài nguyên tĩnh (`templates/report.typ`, `fonts/Merriweather/*`) trong thư mục `dist/`. Kế hoạch này đã xử lý trọn vẹn và triệt để toàn bộ các mắt xích.

## Phases

| Phase | Description | Status | Link |
|---|---|---|---|
| **01** | Chuẩn hóa đóng gói build & Thêm cơ chế fallback đường dẫn trong `pdfService.ts` | Completed | [`phase-01-code-and-build-packaging.md`](./phase-01-code-and-build-packaging.md) |
| **02** | Cài đặt Typst CLI & đóng gói static assets trong Dockerfile (`apps/api/Dockerfile`) | Completed | [`phase-02-dockerfile-and-typst-runtime.md`](./phase-02-dockerfile-and-typst-runtime.md) |
| **03** | Xác minh biên dịch PDF A4 cục bộ từ thư mục `dist/` | Completed | [`phase-03-verification-and-testing.md`](./phase-03-verification-and-testing.md) |
