---
title: "GA12: Điều khoản dịch vụ, Chính sách bảo mật & Ghi nhận Consent (NĐ 13/2023)"
description: "Soạn thảo văn bản pháp lý ToS và Privacy Policy, tạo 2 trang công khai /terms và /privacy, liên kết Footer/Auth checkbox và ghi nhận consent tracking vào database tuân thủ an toàn migration."
status: completed
priority: P1
effort: 4h
branch: feat/ga12-tos-privacy-consent
tags: [legal, policy, auth, frontend, schema, privacy]
blockedBy: []
blocks: []
created: 2026-08-30
---

# GA12: Điều khoản dịch vụ, Chính sách bảo mật & Ghi nhận Consent (NĐ 13/2023)

## Overview

Kế hoạch triển khai nhiệm vụ **GA-12 (P1#8)**:
1. Soạn thảo hai văn bản pháp lý hoàn chỉnh, trung thực với dữ liệu và kiến trúc của Nexus Platform:
   - **`/terms` (Điều khoản Dịch vụ):** Quy định quyền sở hữu trí tuệ (100% thuộc về sinh viên), chuẩn mực liêm chính học thuật (không làm bài hộ, không bao điểm), quy chế vận hành case và thanh toán.
   - **`/privacy` (Chính sách Bảo mật theo NĐ 13/2023/NĐ-CP):** Minh bạch danh mục dữ liệu thu thập, các bên thứ ba xử lý (OpenAI/Gemini qua Vercel AI SDK, SePay, Centrifugo, Cloudinary, Resend), quyền của chủ thể dữ liệu (quyền xóa 72h theo GA-04).
2. Tạo 2 trang giao diện công khai `/terms` và `/privacy` trên `apps/web-1` với Mantine UI v9, hỗ trợ mục lục điều hướng (Table of Contents), Dark/Light theme, responsive hoàn chỉnh.
3. Bổ sung trường `consent_version` và `consented_at` vào bảng `users` tuân thủ nghiêm ngặt quy tắc an toàn cơ sở dữ liệu `prisma-migration-safety.md`.
4. Cập nhật `AppShell.tsx` (Footer links) và `AuthPanel.tsx` (Checkbox điều khoản dẫn link mở tab mới và truyền metadata ghi nhận consent khi đăng ký).
5. Kiểm thử toàn diện: `npm run check-types` và kiểm tra luồng đăng ký mới.

---

## Cross-Plan Dependencies

| Relationship | Plan | Status |
|---|---|---|
| Related | `plans/260827-0900-ga04-user-delete-account` (GA-04: Xóa tài khoản 72h NĐ 13/2023) | Completed |
| Phase | Tên Phase | Mô tả & Trọng tâm | Status |
|---|---|---|---|
| **1** | [Phase 1: Schema & An toàn Migration](./phase-01-schema-and-migration.md) | Thêm `terms_and_privacy_version` & `terms_and_privacy_accepted_at` vào `model User`, tạo migration an toàn `--create-only`, `prisma generate` | Completed |
| **2** | [Phase 2: Soạn thảo Văn bản Pháp lý ToS & Privacy](./phase-02-terms-and-privacy-content.md) | Soạn thảo chi tiết toàn bộ nội dung tiếng Việt cho `/terms` và `/privacy` | Completed |
| **3** | [Phase 3: Giao diện Trang /terms và /privacy](./phase-03-frontend-pages-and-layout.md) | Tạo trang `/terms` và `/privacy` với Mantine UI v9, Typography đẹp, Table of Contents, Theme switcher | Completed |
| **4** | [Phase 4: Tích hợp AuthPanel & AppShell Footer](./phase-04-auth-and-footer-integration.md) | Gắn link Footer, sửa Checkbox `AuthPanel.tsx`, truyền ghi nhận consent vào Better Auth hook | Completed |
| **5** | [Phase 5: Kiểm thử, Type Checking & Verification](./phase-05-verification-and-tests.md) | Test đăng ký, kiểm tra DB, kiểm tra responsive, `npm run check-types` | Completed |

---

## Dependencies & Tech Stack

- **Backend:** `apps/api` (Hono, Better Auth databaseHooks, Prisma Client).
- **Frontend:** `apps/web-1` (Next.js 16 App Router, Mantine UI v9, Lucide React, TanStack Form).
- **Database:** Prisma 7 + Postgres (Additive safe migration).
- **Quy chuẩn tuân thủ:** `.agents/rules/prisma-migration-safety.md`, Nghị định 13/2023/NĐ-CP.
