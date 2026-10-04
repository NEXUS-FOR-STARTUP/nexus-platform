---
title: "Quickfixes: Hide Chat 79k, Clean Intake Deadline, Block 149k Package"
description: "Ẩn tính năng chat cho gói 79k AI Audit (cả FE và BE), xóa bỏ trường Hạn nộp bài mong muốn (bug v5) tại bước 6 Xác nhận Intake, và thêm notification chặn chọn gói 149k tại PackageSelectionModal."
status: completed
priority: P1
effort: 2.5h
branch: staging
tags: [pricing, chat, intake, dashboard, modal, quickfix]
blockedBy: []
blocks: []
created: 2026-09-17
---

# Quickfixes: Hide Chat 79k, Clean Intake Deadline, Block 149k Package

## Overview

Thực hiện 3 chỉnh sửa tinh chỉnh giao diện và nghiệp vụ gói dịch vụ theo phản hồi người dùng:
1. **Gói 79k (`pkg_ai_audit` - Basic AI Audit) ẩn chat:**
   - Case thuộc gói 79k là quy trình đánh giá tự động bằng AI (Nexus AI Engine), không có Supporter (mentor con người).
   - Frontend: Ẩn tab "Chat với Supporter" trong `WorkspaceSidebar`, chặn switch vào tab `discussion`, tắt Centrifugo realtime subscription chat cho case này.
   - Backend: Cập nhật `evaluateChatAccess` trong `apps/api/src/modules/cases/application/chat-access.ts` và `send-message.usecase.ts` trả về mã lỗi `CHAT_AI_TIER` (HTTP 409) nếu cố ý gửi tin nhắn vào case 79k.
2. **Dọn dẹp "Hạn nộp bài mong muốn" (Bug v5) ở Bước 6. Xác nhận trong Intake:**
   - Trong `apps/web-1/app/dashboard/intake/_components/Steps/ReviewSubmitStep.tsx`, form không có trường nhập `deadline` nào nhưng lại hiển thị label `Hạn nộp bài mong muốn:` và giá trị `formatDate(values.deadline)`.
   - Xóa bỏ label và giá trị này. Giữ nguyên tiêu đề mục `4. Hạn chót & gói dịch vụ` và hiển thị mức độ ưu tiên/tốc độ phản hồi.
3. **Chặn gói 149k (`pkg_supporter_audit`) bằng notification tại `PackageSelectionModal`:**
   - Gói 149k chưa hoàn thiện lõi vận hành supporter ở backend.
   - Tại modal chọn gói `PackageSelectionModal.tsx` ở Dashboard, khi người dùng click vào nút "Chọn Premium", hiển thị Mantine `notifications.show` với nội dung thông báo tính năng đang phát triển, không chuyển hướng sang trang intake.

---

## Phase Breakdown

| Phase | Tên Phase | Mô tả & Trọng tâm | Status |
|---|---|---|---|
| **1** | [Phase 1: Backend Chat Access Guard](./phase-01-backend-chat-guard.md) | Thêm mã `CHAT_AI_TIER` vào `chat-access.ts`, truyền `packageId` từ case, ném lỗi 409 trong `send-message.usecase.ts` | Completed |
| **2** | [Phase 2: Frontend Case Workspace - Hide Chat 79k](./phase-02-frontend-case-chat-hide.md) | Ẩn tab Chat trong `WorkspaceSidebar`, chặn `activeTab === "discussion"`, tắt `useRealtimeChat` cho case `pkg_ai_audit` | Completed |
| **3** | [Phase 3: Frontend Intake - Clean Deadline Bug v5](./phase-03-frontend-intake-clean-deadline.md) | Xóa dòng `Hạn nộp bài mong muốn` khỏi `ReviewSubmitStep.tsx` | Completed |
| **4** | [Phase 4: Frontend Modal - Block 149k Package](./phase-04-frontend-modal-block-149k.md) | Tích hợp `@mantine/notifications` chặn nút chọn gói 149k trong `PackageSelectionModal.tsx` | Completed |
| **5** | [Phase 5: Verification & Tests](./phase-05-verification-and-tests.md) | Chạy typecheck `check-types`, test unit `evaluateChatAccess`, kiểm thử luồng UI | Completed |

---

## Affected Files & Scope

- `apps/api/src/modules/cases/application/chat-access.ts` (Thêm guard `CHAT_AI_TIER`)
- `apps/api/src/modules/cases/application/send-message.usecase.ts` (Truyền `package_id` và message thông báo)
- `apps/api/src/shared/infrastructure/tests/phase-03-messaging.test.ts` (Thêm test case chặn chat AI package)
- `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx` (Ẩn tab discussion khi gói là AI Audit)
- `apps/web-1/app/dashboard/case/[id]/page.tsx` (Gate `activeTab`, `isTabAvailable`, `useRealtimeChat`)
- `apps/web-1/app/dashboard/intake/_components/Steps/ReviewSubmitStep.tsx` (Xóa Hạn nộp bài mong muốn)
- `apps/web-1/app/dashboard/_components/PackageSelectionModal.tsx` (Notification chặn gói 149k)
