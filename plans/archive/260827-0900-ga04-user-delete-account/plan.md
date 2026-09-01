---
title: "GA04: User Account Deletion (Soft-Delete & Danger Zone UI)"
description: "Implement user account self-deletion via secure soft-delete API, session revocation, and settings Danger Zone confirmation modal"
status: completed
priority: P2
effort: 3h
branch: feat/gap-analysis-tasks
tags: [auth, profile, frontend, api, security]
blockedBy: []
blocks: []
created: 2026-08-27
---

# GA04: User Account Deletion (Soft-Delete & Danger Zone UI)

## Overview

Kế hoạch triển khai tính năng **GA04: User Account Deletion** cho phép người dùng tự xóa tài khoản cá nhân một cách an toàn và tuân thủ nguyên tắc bảo toàn dữ liệu (Zero Data Loss) của dự án.

### Kết quả khảo sát kỹ thuật:
1. **Better Auth built-in API:** Better Auth có sẵn `user.deleteUser` và `authClient.deleteUser()`, nhưng thực thi **Hard Delete** (`DELETE FROM users WHERE id = ...`), dẫn đến lỗi vi phạm Foreign Key (do liên kết với `Case`, `Deposit`, `Order`, `UserWallet`, `Notification`, v.v.) và vi phạm quy tắc cấm xóa dữ liệu sản xuất trong `prisma-migration-safety.md`. Do đó, giải pháp tối ưu là sử dụng cơ chế **Soft-Delete + Anonymize + Session Revocation** thông qua endpoint `DELETE /api/profile/account`.
2. **Cấu trúc trang Cài đặt (Settings):** Trang `/dashboard/settings` (và `/supporter/settings`) được phân chia thành các mục qua Sidebar Navigation (tương đương tabs):
   - **Thông tin cơ bản** (`/dashboard/settings/profile`)
   - **Đổi mật khẩu** (`/dashboard/settings/password`)
3. **Vị trí nút Xóa tài khoản:** Đặt ở **cuối cùng** của trang "Thông tin cơ bản" (`ProfileInfoForm.tsx`), trong một khối **Vùng nguy hiểm (Danger Zone)** riêng biệt với nút bấm màu đỏ, đi kèm Modal xác nhận hai bước (yêu cầu người dùng nhập chữ "XOA" để xác nhận).

## Cross-Plan Dependencies

| Relationship | Plan | Status |
|-------------|------|--------|
| None | None | - |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Backend Soft-Delete API & Session Revocation](./phase-01-backend-soft-delete-api.md) | Completed |
| 2 | [Frontend Danger Zone & Delete Account Modal](./phase-02-frontend-danger-zone-modal.md) | Completed |
| 3 | [Automated Unit Tests & Verification](./phase-03-tests-and-verification.md) | Completed |

## Dependencies

- `apps/api`: Hono, Better Auth Admin Plugin (`banned` check), Prisma Client (`User`, `Session`, `Account`, `TwoFactor`), `auditLogger`.
- `apps/web-1`: Mantine UI v9 (`Modal`, `Button`, `Paper`, `TextInput`, `Text`), TanStack Form / Query, `authClient` (`signOut`).
