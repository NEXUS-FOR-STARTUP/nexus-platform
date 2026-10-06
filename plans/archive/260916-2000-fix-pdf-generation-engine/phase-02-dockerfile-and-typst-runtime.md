# Phase 02: Dockerfile & Typst Runtime

## Context Links
- Plan: [`plan.md`](./plan.md)
- Target: `apps/api/Dockerfile`, `apps/api/Dockerfile.npm`

## Overview
- Date: 2026-09-16
- Priority: P0
- Status: Completed

## Key Insights
- Base image của container API là `oven/bun:1.4.0-alpine` (dựa trên Alpine 3.22).
- Alpine 3.22 có gói chính thức `typst 0.13.1` trong kho package cộng đồng (`apk add --no-cache typst`).
- Runner stage trong Dockerfile đã được bổ sung lệnh cài đặt `typst` và copy các file assets tĩnh `templates/` và `fonts/`.

## Implementation Steps
1. Cập nhật `apps/api/Dockerfile`:
   - Thêm `RUN apk add --no-cache typst` tại stage `runner`.
   - Thêm lệnh `COPY` các thư mục `templates` và `fonts` từ `builder` sang `runner` tại `apps/api/dist/modules/reports/infrastructure/pdf/`.
2. Đồng bộ `apps/api/Dockerfile.npm`:
   - Thêm `apk add --no-cache typst` và các lệnh copy tương tự để dự phòng.

## Todo List
- [x] Thêm `apk add --no-cache typst` vào `apps/api/Dockerfile`
- [x] Thêm `COPY` static assets vào `apps/api/Dockerfile`
- [x] Đồng bộ hóa `apps/api/Dockerfile.npm`

## Success Criteria
- Image chứa đầy đủ binary `typst` và thư mục `templates/`, `fonts/`.
