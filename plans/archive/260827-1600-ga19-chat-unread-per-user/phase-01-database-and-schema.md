# Phase 01 — Database Model & Shared Validation Schemas

- **Priority:** P2
- **Status:** completed
- **Effort:** 1.0h
- **Depends:** None
- **Blocks:** Phase 02, Phase 03

---

## 1. Mục tiêu (Objective)

Định nghĩa cấu trúc dữ liệu lưu trạng thái đọc tin nhắn của từng người dùng trong từng case và bổ sung các schema validation dùng chung giữa frontend và backend.

## 2. Thiết kế Cơ sở dữ liệu (Database Design)

### 2.1. Prisma Schema (`prisma/schema.prisma`)

Thêm model `CaseChatReadState`:

```prisma
model CaseChatReadState {
  case_id              String
  user_id              String
  last_read_message_id String?
  last_read_at         DateTime @default(now())
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt

  case                 Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  user                 User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([case_id, user_id])
  @@index([user_id])
  @@index([case_id, last_read_at])
  @@map("case_chat_read_states")
}
```

Bổ sung relation vào model `Case` và `User`:
- Trong model `Case`: `chat_read_states CaseChatReadState[]`
- Trong model `User`: `chat_read_states CaseChatReadState[]`

### 2.2. Quy tắc Migration an toàn (DB Safety Protocol)

- **Lệnh thực thi:** Chỉ chạy `npx prisma migrate dev --create-only --name add_case_chat_read_states`.
- **Kiểm tra file SQL sinh ra:**
  ```sql
  -- CreateTable
  CREATE TABLE "case_chat_read_states" (
      "case_id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL,
      "last_read_message_id" TEXT,
      "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,

      CONSTRAINT "case_chat_read_states_pkey" PRIMARY KEY ("case_id","user_id")
  );

  -- CreateIndex
  CREATE INDEX "case_chat_read_states_user_id_idx" ON "case_chat_read_states"("user_id");
  CREATE INDEX "case_chat_read_states_case_id_last_read_at_idx" ON "case_chat_read_states"("case_id", "last_read_at");

  -- AddForeignKey
  ALTER TABLE "case_chat_read_states" ADD CONSTRAINT "case_chat_read_states_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ALTER TABLE "case_chat_read_states" ADD CONSTRAINT "case_chat_read_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ```
- **Không thực hiện bất kỳ lệnh DROP TABLE hay DELETE nào.**

## 3. Shared Validation (`packages/validation/src/index.ts`)

Bổ sung các Zod schema và Type exports:

```typescript
// ---------------------------------------------------------------------------
// Chat Read State (GA-19)
// ---------------------------------------------------------------------------

export const MarkChatReadRequestSchema = z.object({
  last_read_message_id: z.string().optional(),
});
export type MarkChatReadRequest = z.infer<typeof MarkChatReadRequestSchema>;

export const CaseChatReadStateSchema = z.object({
  case_id: z.string(),
  user_id: z.string(),
  last_read_message_id: z.string().nullable().optional(),
  last_read_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type CaseChatReadState = z.infer<typeof CaseChatReadStateSchema>;

export const CaseUnreadCountResponseSchema = z.object({
  case_id: z.string(),
  unread_count: z.number().int().nonnegative(),
  last_read_at: z.string().datetime().nullable().optional(),
});
export type CaseUnreadCountResponse = z.infer<typeof CaseUnreadCountResponseSchema>;
```

## 4. Tiêu chí hoàn thành (Acceptance Criteria)

- [x] 1. Model `CaseChatReadState` được thêm vào `prisma/schema.prisma` với đúng quy ước plural `case_chat_read_states` và snake_case.
- [x] 2. Migration SQL được tạo qua `--create-only`, an toàn không gây gián đoạn.
- [x] 3. `npm run prisma:generate` sinh thành công Prisma client types.
- [x] 4. `@repo/validation` export đầy đủ các types & schemas cho MarkChatRead.
- [x] 5. `npm run check-types` pass 100% không có lỗi kiểu dữ liệu.
