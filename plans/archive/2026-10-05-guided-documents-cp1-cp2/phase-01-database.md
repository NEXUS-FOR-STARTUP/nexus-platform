# Phase 1: Cơ sở Dữ liệu (Database Migration Safety)

> ⚠️ **TUÂN THỦ NGHIÊM NGẶT `.agents/rules/prisma-migration-safety.md`**:
> - Tuyệt đối CẤM `prisma migrate reset`, CẤM `prisma db push`.
> - Chỉ dùng `prisma migrate dev --create-only`.

## 1. Cập nhật Prisma Schema (`prisma/schema.prisma`)

Thêm model `ProjectAnswer` duy nhất:

```prisma
model ProjectAnswer {
  id              String   @id @default(uuid())
  case_id         String
  question_id     String   // VD: "cp1_q1", map chuẩn với TS template catalog
  answer_text     String   @db.Text
  updated_at      DateTime @updatedAt
  
  case            Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)

  @@unique([case_id, question_id])
  @@index([case_id])
  @@map("project_answers")
}
```

*Đồng thời thêm quan hệ `project_answers ProjectAnswer[]` vào model `Case` trong schema.*

## 2. Quy trình Migration An toàn
1. **Kiểm tra target DB:** Đảm bảo `DATABASE_URL` trỏ local development.
2. **Tạo migration file (KHÔNG tự động apply):**
   ```bash
   bun run prisma migrate dev --create-only --name add_project_answers
   ```
3. **Review file SQL được sinh ra:** Đảm bảo chỉ có lệnh `CREATE TABLE "project_answers"` và foreign key tương ứng, không có bất kỳ lệnh DROP nào.
4. **Sinh Prisma Client:**
   ```bash
   bun run prisma:generate
   ```
5. **Apply migration an toàn:**
   ```bash
   bun run prisma migrate deploy
   ```

## 3. Lưu ý về DB Drift (Tham khảo từ lần chạy trước)
Nếu PostgreSQL local gặp tình trạng drift migration cũ (do các migration trước đó từng bị sửa nội dung hoặc thiếu FK ở `accounts`, `cases`):
- Báo cáo rõ ràng cho người dùng trước khi thực hiện bất kỳ thao tác nào.
- KHÔNG tự ý reset DB nếu có dữ liệu thật. Nếu là DB local dev và user đồng ý đồng bộ lại, thực hiện theo chỉ đạo của user.