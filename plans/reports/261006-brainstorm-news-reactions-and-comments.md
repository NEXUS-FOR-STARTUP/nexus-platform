# Báo cáo Thiết kế: Tính năng Reaction (Like/Dislike) & Comment cho Tin tức Nexus

**Ngày:** 2026-10-06  
**Trạng thái:** Đã chốt phương án thiết kế  
**Tác giả:** Brainstorm & Research Session (`ck:brainstorm` + `ck:research`)

---

## 1. Yêu cầu & Quyết định Nghiệp vụ (Key Decisions)

1. **Phạm vi Reaction (Like / Dislike):**
   - Hỗ trợ cả 2 nút **Like** và **Dislike**.
   - **Quy tắc bất biến:** Một khi người dùng đã reaction bài viết thì chỉ có chuyển đổi giữa `LIKE` $\leftrightarrow$ `DISLIKE`, **tuyệt đối không cho undo / un-vote** về trạng thái chưa vote.
   - Click lại vào chính reaction hiện tại là hành động idempotent (giữ nguyên, không xóa).
2. **Cấu trúc Bình luận (Comments):**
   - Cấu trúc **1 cấp reply duy nhất (Parent – Child)**, tương tự YouTube / Facebook.
   - Chặn tuyệt đối việc reply vào một reply con (không cho lồng quá cấp 1).
3. **Phân quyền & Định danh (Authentication):**
   - **Bắt buộc đăng nhập:** Chỉ người dùng đã đăng nhập tài khoản Nexus (Better Auth) mới được thả reaction hoặc gửi bình luận.
   - Khách vãng lai chỉ có quyền xem danh sách bình luận và số lượt like/dislike.
4. **Kiểm duyệt & Xóa bình luận:**
   - Người dùng có thể xóa comment của chính mình.
   - Người dùng có quyền `admin` hoặc `writer` có quyền xóa bất kỳ comment nào trong bài viết.
   - Sử dụng cơ chế **Soft Delete** (`deleted_at`): Nếu comment cha bị xóa mà đã có reply con, nội dung comment cha sẽ hiển thị thông báo *"Bình luận này đã bị xóa"* để bảo toàn cấu trúc luồng thảo luận.

---

## 2. Kiến trúc Kỹ thuật (Technical Architecture)

Tuân thủ nguyên tắc **YAGNI**, **KISS**, và **DRY**. Sử dụng 100% stack hiện tại (`PostgreSQL 18`, `Prisma 7`, `Hono`, `Better Auth`, `TanStack Query`), không dùng thêm hàng đợi ngoài hay Redis counter.

```
[Client (Next.js 16 + TanStack Query)]
      │
      ├── POST   /api/news/:id/reaction       (Like / Dislike UPSERT)
      ├── GET    /api/news/:id/comments       (Lấy comments + replies + user info)
      ├── POST   /api/news/:id/comments       (Gửi comment cha hoặc reply con)
      └── DELETE /api/news/comments/:id       (Xóa comment - soft/hard delete)
      │
[Hono API Router + Session Guard (Better Auth)]
      │
[PostgreSQL Database (Prisma 7)]
      ├── news_reactions (unique: news_id, user_id)
      └── news_comments  (self-referencing: parent_id)
```

### 2.1. Prisma Schema

```prisma
enum NewsReactionType {
  LIKE
  DISLIKE
}

model NewsReaction {
  id         String           @id @default(cuid())
  news_id    String
  user_id    String
  type       NewsReactionType
  created_at DateTime         @default(now())

  news NewsItem @relation(fields: [news_id], references: [id], onDelete: Cascade)
  user User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([news_id, user_id]) // Khóa chặn race condition, 1 user = 1 reaction duy nhất
  @@index([news_id, type])      // Tối ưu tốc độ aggregate đếm số like/dislike
  @@map("news_reactions")
}

model NewsComment {
  id         String    @id @default(cuid())
  news_id    String
  user_id    String
  parent_id  String?   // null: comment gốc; có giá trị: reply cấp 1
  content    String    @db.Text
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime? // Soft delete để bảo toàn luồng thảo luận

  news    NewsItem      @relation(fields: [news_id], references: [id], onDelete: Cascade)
  user    User          @relation(fields: [user_id], references: [id], onDelete: Cascade)
  parent  NewsComment?  @relation("CommentReplies", fields: [parent_id], references: [id], onDelete: Cascade)
  replies NewsComment[] @relation("CommentReplies")

  @@index([news_id, parent_id, created_at])
  @@index([user_id])
  @@map("news_comments")
}
```

### 2.2. Xử lý Logic Backend (Hono)

1. **Reaction UPSERT (Atomic, No Race Condition):**
   ```ts
   await prisma.newsReaction.upsert({
     where: { news_id_user_id: { news_id: newsId, user_id: userId } },
     create: { news_id: newsId, user_id: userId, type: newType },
     update: { type: newType },
   });
   ```
2. **Comment Querying:**
   - Lấy danh sách comment gốc (`parent_id: null`) kèm danh sách `replies` con lồng 1 cấp qua Prisma relational join.
   - Đính kèm thông tin tác giả bình luận (`id`, `name`, `image`, `role`).
3. **Comment Guarding:**
   - Nếu `parent_id` được cung cấp, kiểm tra nếu `parent.parent_id !== null` $\rightarrow$ Ném lỗi `400 Bad Request` (chặn lồng sâu).
4. **Delete Guarding:**
   - Chỉ cho phép xóa nếu `user.id === comment.user_id` hoặc `user.role === 'admin' || user.role === 'writer'`.
   - Nếu comment cha có `replies.length > 0`: Cập nhật `deleted_at = now()`. Nếu không có replies: Xóa vĩnh viễn (`delete`).

### 2.3. Giao diện Người dùng (Frontend UX)

1. **Thanh Like / Dislike:**
   - Đặt ở cuối bài viết (hoặc cạnh thanh chia sẻ).
   - Hiển thị số lượng Like và Dislike.
   - Nút Like đổi màu xanh/brand khi active, Dislike đổi màu xám đậm/cam khi active.
   - **Optimistic Update**: Click là đổi số và đổi active state ngay lập tức, rollback nếu request lỗi.
2. **Khu vực Bình luận:**
   - Form gửi bình luận gốc ở trên cùng với avatar người dùng.
   - Danh sách bình luận dạng card phẳng, có nút "Trả lời" dưới mỗi bình luận cha.
   - Khi bấm "Trả lời", mở form nhập reply ngay bên dưới bình luận cha đó (thụt lề 32px-48px).

---

## 3. Ước lượng Effort & Các giai đoạn thực hiện

- **Tổng thời gian dự kiến:** ~3.5 – 4 ngày làm việc.
- **Phân kỳ:**
  1. **Phase 1: DB & API Core (1.5 ngày)**: Tạo schema, migration, viết repository, usecase và Hono route endpoints.
  2. **Phase 2: Reaction UI & Optimistic Mutation (0.5 ngày)**: Tích hợp nút Like/Dislike vào trang chi tiết bài viết `/news/[slug]`.
  3. **Phase 3: Comment Box & Reply Thread UI (1.5 ngày)**: Viết component danh sách comment, form gửi comment/reply, modal xóa/ẩn comment.
  4. **Phase 4: Review, Type-check & Quyền Admin/Writer (0.5 ngày)**: Kiểm tra quyền xóa bài của Admin/Writer, edge cases và audit.
