# Phase 2 — Verify

## Context

- Phase 1 xong mới làm.
- Click crash đã vá: capture `checked` trước `setDraft`.

## Overview

Smoke UI trên tab đã login. Không thêm FE test suite (repo test chỉ `apps/api`).

Visual confirm trên tab đã login (user screenshot). Không chạy browser loop.

## Implementation steps

1. [x] `/dashboard/settings/notifications` — 2 section + divider + Lưu (screenshot).
2. [ ] Bấm 1 switch nhóm, reload không Lưu — skip (user: không test UI).
3. [ ] Đổi + Lưu + reload — skip.
4. [ ] Console `currentTarget.checked` — skip.
5. [x] Không hiện telegram / chat / marketing (screenshot).

## Success

- 2 section nhìn thấy
- Draft vs Lưu đúng luật A
- Không error boundary khi bấm switch
