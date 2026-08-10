# Phase 01 — DB Schema + Migration

**Effort:** 1.5h

## Việc

Thêm 2 models vào `prisma/schema.prisma`. Migration create-only. Generate client.

## Bước

1. **Thêm models vào `prisma/schema.prisma`:**

```prisma
// ==========================================
// NOTIFICATION MODULE MODELS
// ==========================================

model Notification {
  id            String    @id @default(uuid())
  user_id       String
  type          String
  title         String
  body          String?
  link          String?
  case_id       String?
  metadata_json Json?
  read_at       DateTime?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  user          User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  case          Case?     @relation(fields: [case_id], references: [id], onDelete: Cascade)

  @@index([user_id, read_at])
  @@index([user_id, created_at(sort: Desc)])
  @@map("notifications")
}

model NotificationOutbox {
  id                  String    @id @default(uuid())
  event_id            String
  type                String
  channel             String
  recipient_type      String    @default("user") // user | email | chat (telegram)
  recipient           String
  title               String
  body                String?
  link                String?
  payload_json        Json?
  status              String    @default("pending")
  attempts            Int       @default(0)
  processing_at       DateTime?
  next_retry_at       DateTime?
  sent_at             DateTime?
  provider_message_id String?
  last_error          String?
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  @@unique([event_id, channel, recipient])
  @@index([status, next_retry_at])
  @@index([status, sent_at]) // purge job
  @@map("notification_outbox")
}
```

2. **Thêm relation vào `User` model:**
```prisma
  notifications       Notification[]
```

3. **Thêm relation vào `Case` model:**
```prisma
  notifications       Notification[]
```

4. **Migration create-only** (luật dự án — không bao giờ `migrate dev` full run):
```bash
npm run prisma:generate
npx prisma migrate dev --create-only --name add_notifications
```

5. **Review migration SQL.** Chỉ tạo 2 bảng + index + FK. Không destructive. Xác nhận target DB (docs/db-migration-guide.md).

6. **Generate client:**
```bash
npm run prisma:generate
```

## Verify

- [ ] `npx prisma validate` pass
- [ ] Migration SQL không destructive
- [ ] `npm run check-types --workspace=apps/api` pass

## Chốt (Acceptance)

- 2 bảng + unique `[event_id, channel, recipient]`
- Index `[user_id, created_at desc]` + `[user_id, read_at]`
- Outbox: `processing_at` (reclaim crash), `provider_message_id` (audit + idempotency), `recipient_type` (user|email|chat), index `[status, sent_at]` (purge)
- Convention: plural snake_case, snake_case columns, FK indexed
