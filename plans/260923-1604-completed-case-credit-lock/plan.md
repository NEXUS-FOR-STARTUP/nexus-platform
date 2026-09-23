---
title: "Khóa mua lượt sau khi sinh viên hoàn tất dự án"
description: "Thêm modal cảnh báo trước khi sinh viên hoàn tất và ẩn CTA mua lượt ở case đã completed."
status: completed
priority: P1
effort: 1h
branch: refactor/mobile-responsive
tags: [bugfix, frontend, credit]
blockedBy: []
blocks: []
created: 2026-09-23
---

# Khóa mua lượt sau khi sinh viên hoàn tất dự án

## Overview

Sinh viên đang bấm `Xác nhận hoàn thành` trực tiếp tại `report_ready`; sau transition `T17_USER_CONFIRM_COMPLETE`, tab Lượt đánh giá vẫn hiện CTA mua credit. Plan này thêm cảnh báo trước completion và bỏ CTA mua ở workspace khi case trả về `completed`.

## Scope

In scope:
- Modal Mantine xác nhận/cảnh báo cho hành động hoàn tất của sinh viên.
- Giữ lịch sử đơn hàng và credit đã có; chỉ ẩn mọi CTA mua của workspace khi `user_facing_stage === "completed"`.

Not in scope:
- API, database, order/credit backend logic, package, giá, migration Prisma, hoặc policy `rejected`/`closed`.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Terminal condition | Chỉ `user_facing_stage === "completed"` | Đúng request; không âm thầm đổi workflow `rejected`/`closed`. |
| UI behavior | Hủy CTA, giữ tab Lượt đánh giá và lịch sử | Người dùng vẫn cần xem số dư/đơn cũ. |
| Modal ownership | `StatusGuidanceCard` giữ state modal | Nút và warning cùng branch `report_ready`; không thêm prop/state vào page vô ích. |

## Cross-Plan Dependencies

Không có blocker. Các plan pricing/QR liên quan đã completed. `260915-0000-ticket-wallet-cleanup` là draft cleanup khác scope; không phụ thuộc output plan này.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [Completion confirmation UX](./phase-01-completion-confirmation-ux.md) | Completed |
| 2 | [UI surface verification](./phase-02-ui-verification.md) | Completed |

## Affected Files

| File | Action | Purpose |
|---|---|---|
| `D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx` | Modify | Add final-action confirmation modal. |
| `D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/apps/web-1/app/dashboard/case/[id]/page.tsx` | Modify | Derive `canBuyCredits`; prevent stale checkout/modal opening. |
| `D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/apps/web-1/app/dashboard/case/[id]/_components/CreditPanel.tsx` | Modify | Render CTA only when purchase allowed. |
| `D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/apps/web-1/app/dashboard/case/[id]/_components/CreditBalanceCard.tsx` | Modify | Render CTA only when purchase handler exists. |

## Success Criteria

- Student click `Xác nhận hoàn thành` opens Mantine warning; cancel sends no API request; confirm sends exactly one existing completion request.
- After refreshed case data reports `completed`, no workspace CTA can open `CreditQuantityModal`; credit history remains visible.
- Case chưa `completed` giữ nguyên CTA và flow mua hiện tại.

## Handoff

```text
/ck:cook --auto D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/plans/260923-1604-completed-case-credit-lock/plan.md
```