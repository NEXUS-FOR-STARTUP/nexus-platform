---
title: "News Reactions and Comments Implementation"
status: "completed"
created_at: "2026-10-06"
blockedBy: []
blocks: []
---

# Kế hoạch triển khai: Reaction (Like/Dislike) & Comment cho Tin tức

## 1. Tổng quan
Kế hoạch này vạch ra các bước chi tiết để xây dựng hệ thống tương tác cho tin tức trên Nexus Platform. Dựa trên bản báo cáo kiến trúc `plans/reports/261006-brainstorm-news-reactions-and-comments.md`, chúng ta sẽ áp dụng các pattern chuẩn nhất:
- **Reaction:** Atomic UPSERT, chỉ Like/Dislike (không unvote).
- **Comment:** Adjacency List 1 cấp (Parent - Child).
- **Auth:** Sử dụng Better Auth (chỉ user đã đăng nhập mới được thao tác).
- **Kiểm duyệt:** Role Admin/Writer có quyền xóa comment.

## 2. Các giai đoạn (Phases)

### Phase 1: Database Schema & Backend Core (1.5 ngày)
- **Database:**
  - Mở file `prisma/schema.prisma` và thêm model `NewsReaction` (kèm `enum NewsReactionType`) và `NewsComment` (với relation tự trỏ `parent_id`).
  - Đảm bảo các `@@index` và `@@unique` constraints chuẩn xác.
  - Tạo Prisma migration (tuân thủ DB Safety: dùng `prisma migrate dev --create-only` để review trước).
- **API UseCases & Repository (`apps/api/src/modules/news/`):**
  - Viết repository methods thao tác với DB.
  - Xây dựng Usecases cho Reaction (Toggle) và Comments (Create, Delete, FindByNewsId).
- **Hono Router:**
  - Định nghĩa các endpoint `POST /reaction`, `GET /comments`, `POST /comments`, `DELETE /comments/:id`.
  - Validate payload bằng Zod schema. Xác thực session qua context.

### Phase 2: Reaction UI & Optimistic Mutation (0.5 ngày)
- **Hooks:** Viết TanStack Query hooks (e.g. `useNewsReactions`, `useToggleNewsReaction`).
- **Components:** Tạo component `NewsReactionPanel.tsx`.
- **Logic:** 
  - Thực hiện Optimistic Update để số Like/Dislike nảy ngay lập tức trên UI khi người dùng click.
  - Vô hiệu hóa nút thao tác nếu chưa đăng nhập.

### Phase 3: Comment Box & Reply Thread UI (1.5 ngày)
- **Hooks:** Viết hooks lấy comments (bao gồm replies) và thao tác CRUD.
- **Components:**
  - `NewsCommentList.tsx`: Render cây comment 1 cấp.
  - `NewsCommentItem.tsx`: Hiển thị thông tin người dùng, avatar, text, thời gian. Nút "Trả lời" và "Xóa".
  - `NewsCommentForm.tsx`: Input nhập liệu có bảo vệ Auth. Trạng thái auto-focus khi bấm reply.

### Phase 4: Integration, Testing & Authorization (0.5 ngày)
- **Integration:** Gắn `NewsReactionPanel` và `NewsCommentList` vào trang đọc tin tức public `apps/web-1/app/news/[slug]/page.tsx` (và trang xem trước của Writer/Admin).
- **Authorization:** Kiểm tra kỹ logic xóa comment của `admin` và `writer`. Đảm bảo Soft Delete (`deleted_at`) hiển thị đúng "Bình luận này đã bị xóa".
- **QA:** Chạy `bun run check-types` toàn bộ workspace. Đảm bảo UI/UX hiển thị mượt mà trên desktop/mobile.
