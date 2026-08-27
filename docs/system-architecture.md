# System Architecture

_Cập nhật: 2026-08-24. Bám codebase hiện tại._

## 1. Mục tiêu tài liệu

Tài liệu này mô tả architecture hiện trạng phục vụ MVP demo Nexus, bám codebase đang có thay vì mô tả tương lai giả định.

## 2. Kiến trúc tổng quan

Nexus hiện là monorepo Turborepo với 3 vùng chính:
- `apps/web-1`: product frontend Next.js 16
- `apps/api`: backend Hono + Better Auth + Prisma
- `packages/validation`: Zod schemas dùng chung (FE↔BE)
- Mantine UI v9: design system chính cho web-1

Data model trung tâm nằm ở `prisma/schema.prisma` (30 models), với auth, case, checkpoint, lifecycle unit, document record, report, payment, event, AI job, team-fit report, credit ledger, notification (Notification + NotificationOutbox), service catalog (ServiceType + ServicePricing), wallet (UserWallet + WalletTransaction + WalletTopup [deprecated]), deposit/order (Deposit + Order + OrderItem), và domain event outbox (DomainEventOutbox).

## 2.1 Sơ đồ kiến trúc (text-based)

```
┌──────────────────────────────────────────────────────────────┐
│  apps/web-1 (Next.js 16, Mantine UI v9, TanStack Query)      │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐   │
│  │ Student │ │Supporter │ │   Admin   │ │   Auth / UI   │   │
│  │ Intake  │ │Workspace │ │  Triage   │ │  (useSession) │   │
│  │Dashboard│ │+ Output  │ │+ Packages │ │  Mantine v9   │   │
│  │Workspace│ │  Upload  │ │           │ │  Lucide/TQ    │   │
│  └────┬────┘ └────┬─────┘ └─────┬─────┘ └───────┬───────┘   │
│       └───────────┴─────────────┴────────────────┘           │
│                        │ Axios (HTTP)                        │
└────────────────────────┼─────────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────────┐
│  apps/api (Hono, Better Auth, Prisma 7)                      │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────────┐  │
│  │  Cases   │ │Documents │ │Reports │ │ Admin/Supporter  │  │
│  │  module  │ │  module  │ │ module │ │    modules       │  │
│  │22 routes │ │          │ │        │ │                  │  │
│  ├──────────┤ ├──────────┤ ├────────┤ ├──────────────────┤  │
│  │Payments  │ │ Packages │ │AI Eng. │ │ Shared: AppError │  │
│  │2 routes  │ │  module  │ │ module │ │ requireAuth, etc │  │
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └──────────────────┘  │
│       └────────────┴───────────┴───────────────────────────  │
│                         │ Prisma                              │
└─────────────────────────┼────────────────────────────────────┘
                          │
                  ┌───────┴───────┐
                  │  PostgreSQL   │
                  │ (30 models)   │
                  └───────────────┘
```

> Sơ đồ trên là snapshot trước phase notifications + realtime + wallet + deposits/orders + profile. Module mới `notifications` (5 routes: list, unread-count, `:id/read` PATCH, read-all PATCH, `stream` SSE) + `realtime` (2 routes: connection-token, `cases/:caseId/subscribe-token`) + `wallet` (4 routes: balance, history, purchase-credits [deprecated], topups [410 GONE]) + `deposits` (5 routes) + `orders` (3 routes) + `profile` (2 routes: avatar upload, delete account) + event bus `shared/` (xem §4.5, §4.6, §4.8) chưa vẽ vào. API hiện: 14 modules, 81 routes (77 module + 4 system: `/`, `/health`, `/stream`, `/session`).

## 3. Frontend surfaces chính

### 3.1 Intake
- route student intake sống trong `apps/web-1/app/dashboard/intake/`
- workflow nhiều bước, save draft local, submit lên `/cases`
- document step hiện dùng 1 Drive/Docs URL chính + checklist loại tài liệu
- step này còn có template helper để copy Markdown hoặc tải `.docx`

Tham chiếu:
- `apps/web-1/app/dashboard/intake/_components/Steps/DocumentInputStep.tsx`

### 3.2 Student dashboard + case workspace
- dashboard liệt kê case của user
- case workspace có sidebar shell
- điều hướng chính hiện bám `documents`, `discussion`, `timeline`, `settings`
- page dùng `useCaseDetails(id)` để lấy dữ liệu workspace (polling 10s)
- stage-based case flow: `CaseStatusHeader` (hiển thị `user_facing_stage` + next action), `StatusGuidanceCard`, `CaseOverviewPanel`
- credit/ledger economy: `CreditPanel`, `CreditQuantityModal`, `CreditActions`, `CreditTransactionHistory`, `CreditBalanceCard` — mua credit, xem lịch sử giao dịch, số dư hiện tại
- payment/credit là core economy (không còn là surface phụ): mua credit qua sepay webhook, admin veto-with-refund (48h)
- ví VND (2026-08-11): trang `/dashboard/wallet` hiển thị số dư VND (`WalletBalanceCard`), lịch sử giao dịch (`WalletTransactionList`/`WalletTransactionItem`), và modal nạp tiền SePay (`WalletTopupModal` — trả QR + transfer content); nav item "Ví của tôi" (icon Wallet) trong `DashboardShell` cho student; hooks `useWalletBalance`/`useWalletHistory`/`useCreateDeposit` (`app/dashboard/wallet/hooks/useWallet.ts`, polling 30s)

Tham chiếu:
- `apps/web-1/app/dashboard/case/[id]/page.tsx`
- `apps/web-1/app/dashboard/case/[id]/hooks/useCaseDetails.ts`
- `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/CreditPanel.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/CaseStatusHeader.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/CaseOverviewPanel.tsx`
- `apps/web-1/app/dashboard/wallet/page.tsx` (xem §4.7)

### 3.3 Supporter workspace
- supporter mở case bằng shell rất giống student workspace
- supporter tái dùng `WorkspaceSidebar`, `CaseStatusHeader`, `TabDiscussionChat`, `ActivityTimeline`, `DocumentWorkspace`
- supporter không có settings tab trong workspace
- supporter có `SupporterOutputUploadModal` để upload output report
- ✅ **Đã xác nhận:** Supporter không có review page riêng (`apps/web-1/app/supporter/case/[id]/review/page.tsx` không tồn tại). Việc biên tập báo cáo chuyển qua usecases `get-draft-report`/`edit-draft-report` trong supporter module; xuất report qua modal upload thay vì page riêng.

Tham chiếu:
- `apps/web-1/app/supporter/case/[id]/page.tsx`
- `apps/web-1/app/supporter/case/[id]/_components/SupporterOutputUploadModal.tsx`
- `apps/api/src/modules/supporter/application/get-draft-report.usecase.ts`
- `apps/api/src/modules/supporter/application/edit-draft-report.usecase.ts`

### 3.4 Admin triage
- admin có modal chi tiết case để đọc intake snapshot, documents, support needs
- admin có action từ chối, duyệt, phân công supporter (action request-more-info đã xóa — reject reason ≥ 10 ký tự là kênh trao đổi triage)

Tham chiếu:
- `apps/web-1/app/admin/_components/AdminCaseDetailModal.tsx`

## 4. Backend responsibilities

### 4.1 Auth, session, authorization
- auth/session thuộc `apps/api`
- Better Auth mount qua `/api/auth/*`
- middleware và authorization layer ở backend gate dashboard, supporter, admin surfaces theo role + case membership
- frontend không tự định nghĩa access policy riêng

### 4.2 Case workflow
- backend cung cấp endpoints cho case detail, message thread, status update, settings update, payment, admin triage, supporter actions
- frontend không sở hữu workflow semantics; frontend chủ yếu map và trình bày

### 4.3 Report workflow
- supporter biên tập draft report qua usecases `get-draft-report` (GET `/supporter/cases/:caseId/reports/draft`) và `edit-draft-report` (PUT `/supporter/reports/:reportId`) trong supporter module
- publish report qua `publish-report` (POST `/supporter/reports/:reportId/publish`)
- report là output chính thức của supporter, không để chat thay vai trò này

### 4.4 Document workflow
- backend documents module đã encode document workspace theo checkpoint/version/assessment
- contract mới được expose theo kiểu additive từ case detail payload, giữ tương thích với field cũ
- document type và document record đã có module riêng trong backend

### 4.5 Notification workflow (SSE + event bus + outbox)
- Module mới `apps/api/src/modules/notifications/` theo clean architecture: domain (`notification.types`), application (4 inbox usecases: list, unread-count, mark-read, mark-all-read + `notification-listener` + `notification-relay` + `notification-templates` + `recipients`), infrastructure (`notification.repository`, `notification-outbox.repository`, `sse-hub`, `email.service` (Resend), `telegram.service` (grammY)), http (`notifications.routes` + controller)
- **Event bus mới** `shared/domain/domain-events.ts` (14 event types) + `shared/infrastructure/event-bus.ts` (`emitEvent`/`onEvent`, queueMicrotask) — khác với "direct module-to-module calls" trước đây: usecase emit event, notifications module subscribe
- **Outbox pattern**: listener ghi outbox rows → relay worker (setInterval 2s) xử lý kênh in-app/email/telegram với retry exponential backoff; crash/restart → pending rows xử lý lại
- **SSE**: `GET /api/notifications/stream` (requireAuth, cap 5 connection/user, heartbeat 25s, `retry: 5000`); chỉ gửi ping → client refetch REST list. CORS allowMethods mở rộng thêm `PATCH`
- Endpoints (5): `GET /api/notifications` (list), `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`, `GET /api/notifications/stream` (SSE)
- Frontend: `apps/web-1/lib/hooks/useNotifications.ts` (SSE + TanStack Query), `components/layout/NotificationBell.tsx`, `types/notification.ts`
- Env mới (optional, 6): `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_SUPPORTER_CHAT_ID`, `NOTIFICATIONS_ENABLED`
- Kênh Telegram: admin alert tự động trên event `payment.verified`; `payment.proof_uploaded` gửi kèm `transferContent` ("Nội dung chuyển khoản")
- Types/validation dùng chung FE↔BE qua `@repo/validation` (single source of truth): `NOTIFICATION_TYPES` (9 notification types trong `@repo/validation`: case.assigned, case.approved, case.rejected, payment.proof_uploaded, payment.verified, payment.rejected, case.stage_changed, report.published, request_more_info; 5 financial events được định nghĩa riêng tại backend domain events), `NotificationItemSchema`, `ListNotificationsResponseSchema`
- Test: `apps/api/src/shared/infrastructure/tests/phase-08-notifications.test.ts` (16 tests, all pass)
- SSE chỉ dùng cho notifications; chat realtime đi qua Centrifugo (xem §4.6)

### 4.6 Realtime chat workflow (Centrifugo v6) — đã ship 2026-08-08
- Module mới `apps/api/src/modules/realtime/`: 2 routes — `GET /api/realtime/connection-token`, `GET /api/realtime/cases/:caseId/subscribe-token` (cả 2 qua `requireAuth` + `requireCaseAccess`)
- Token: HS256 JWT qua `jose`, TTL 15 phút, channel `chat:{caseId}`
- Publish: `infrastructure/centrifugo.service.ts` POST `{CENTRIFUGO_URL}/api/publish` với header `X-API-Key`; fire-and-forget sau khi insert message trong `send-message.usecase.ts` (`toPublishMessage` sanitize payload — không leak email)
- **DB = source of truth**; Centrifugo chỉ transport realtime. Client không publish trực tiếp — tin phải qua REST để giữ credit check + stage lock + access control
- Env: `CENTRIFUGO_URL` (default `http://localhost:8010`), `CENTRIFUGO_API_KEY` (thiếu → bỏ publish + warn), `CENTRIFUGO_TOKEN_SECRET` (thiếu → 503)
- Web-1: `lib/realtime/centrifuge-client.ts` (singleton, `NEXT_PUBLIC_CENTRIFUGO_URL` default `ws://localhost:8010/connection/websocket`), `hooks/useRealtimeChat.ts` (per-sub token, dedup theo message id), `TabDiscussionChat.tsx`
- Fallback: `useCaseChat` polling `refetchInterval: 60_000` khi Centrifugo down
- Test: `apps/api/src/shared/infrastructure/tests/phase-09-realtime-chat.test.ts`
- Ops chi tiết: [`realtime-centrifugo-guide.md`](./realtime-centrifugo-guide.md)

### 4.7 Wallet + deposit workflow (ví VND + SePay top-up) — ship 2026-08-11
- Module `apps/api/src/modules/wallet/` (clean architecture: domain `wallet.types`, application `wallet.service`, infrastructure/http `wallet.routes`) mount tại `/api/wallet`, toàn bộ qua `requireAuth`. **Live endpoints (2):** `GET /api/wallet/balance` (số dư từ `user_wallets.balance`), `GET /api/wallet/history?limit&offset` (danh sách `wallet_transactions`). `POST /api/wallet/topups` → **410 GONE** ("Tạo mã nạp tiền tại POST /api/deposits"); `POST /api/wallet/purchase-credits` **deprecated 2026-08-12** — cả hai usecase (`wallet-topup.usecase`, `purchase-credits.usecase`) còn trên đĩa nhưng không dùng.
- **Top-up/nạp tiền thuộc module deposits** `apps/api/src/modules/deposits/` — 5 routes: `GET /api/deposits/admin/all`, `GET /api/deposits`, `POST /api/deposits` (tạo deposit pending, trả QR + `transferContent` prefix `CR`, min 10,000 VND), `GET /api/deposits/:id`, `POST /api/deposits/:id/verify`. **Mua credit/order thuộc module orders** (3 routes: GET/POST `/api/orders`, GET `/api/orders/:id`).
- **DB = source of truth cho ví**: `UserWallet` (cached `balance`, `currency` = "VND") + `WalletTransaction` (append-only ledger, `balance_before`/`balance_after`); `WalletTopup` `@deprecated` (replaced by deposits). Khác `credit_ledgers` cũ (case-level) — ví là account-level VND
- Frontend: trang `apps/web-1/app/dashboard/wallet/page.tsx` (header "Ví của tôi", `WalletBalanceCard`, `WalletTransactionList`, `WalletTopupModal` — nay tạo deposit); hooks trong `app/dashboard/wallet/hooks/useWallet.ts` (`useWalletBalance`, `useWalletHistory`, `useCreateDeposit` — polling 30s, mutation invalidates `["wallet"]`)
- Nav: `DashboardShell` thêm menu item "Ví của tôi" (icon `Wallet` từ lucide-react) cho student → `router.push("/dashboard/wallet")`

### 4.8 Profile & account workflow (avatar upload + account deletion) — ship 2026-08-27
- Module `apps/api/src/modules/profile/` (domain `avatar-upload-rules`, application `upload-avatar.usecase`, `delete-account.usecase`, http `profile.routes`, `avatar.controller`, `profile.controller`) mount tại `/api/profile`, toàn bộ qua `requireAuth`.
- **Avatar upload (`POST /api/profile/avatar`)**:
  - DoS Guard: kiểm tra header `content-length` $\le 2\text{ MB} + 64\text{ KB}$ trước khi parse multipart body.
  - Validation: cho phép `.jpg`, `.jpeg`, `.png`, `.webp`, đối chiếu MIME type với extension, dung lượng $\le 2\text{ MB}$.
  - Cloudinary: tải lên thư mục `nexus-platform/avatars` với resource type `image`, lưu secure URL vào `User.image` trong PostgreSQL.
  - Rollback & Cleanup: tự động xóa avatar mới trên Cloudinary nếu cập nhật DB thất bại; tự động dọn dẹp avatar Cloudinary cũ khi upload mới thành công (bỏ qua nếu avatar cũ là external URL OAuth).
- **Account deletion (`DELETE /api/profile/account`)**: tuân thủ NĐ 13/2023 về quyền xóa dữ liệu cá nhân.
- Frontend: form Cài đặt `/dashboard/settings/profile` (`ProfileInfoForm`), mutation `useProfileMutations`, đồng bộ tức thì qua Better Auth `refetch()` cập nhật đồng thời form profile và Popover `UserMenu` trên Navbar Header.
- Test: `apps/api/src/shared/infrastructure/tests/avatar-upload.test.ts` (9/9 pass).

## 5. Case workspace data flow

### 5.1 Case details
`useCaseDetails(id)` hiện:
- GET `/cases/:id`
- polling mỗi 10 giây
- trả về:
  - `case`
  - `intake_snapshot`
  - `latest_report`
  - `latest_user_action`
  - `document_board_sections`
  - `round_history`
  - `open_requests_for_more_info`
  - `document_workspace`

Điều này cho thấy payload case detail đang mang cả field cũ lẫn contract mới cho document workspace.

Tham chiếu:
- `apps/web-1/app/dashboard/case/[id]/hooks/useCaseDetails.ts`

### 5.2 Chat / discussion
Chat hiện là **realtime qua Centrifugo (WebSocket primary)** + REST fallback:
- `useRealtimeChat(caseId)`: lấy subscribe-token qua `/api/realtime/cases/:caseId/subscribe-token`, sub WebSocket `chat:{caseId}`, publication → `setQueryData` cache + dedupe theo message id
- REST (source of truth): GET `/cases/:id/messages`, POST `/cases/:id/messages`
- Fallback khi Centrifugo down: `useCaseChat` polling `refetchInterval: 60_000` (không còn 5s polling)
- Client KHÔNG publish trực tiếp — tin qua REST để giữ credit check + stage lock + access control

Tham chiếu:
- `apps/web-1/app/dashboard/case/[id]/hooks/useRealtimeChat.ts`
- `apps/web-1/app/dashboard/case/[id]/hooks/useCaseChat.ts`
- `apps/web-1/lib/realtime/centrifuge-client.ts`
- `apps/web-1/app/dashboard/case/[id]/_components/TabDiscussionChat.tsx`

### 5.3 Timeline / activity log
- `ActivityTimeline` đọc `caseData.events`
- timeline hiện map nhiều event_type sang label UI
- timeline là lớp truy vết user-facing cho case progression

Tham chiếu:
- `apps/web-1/app/dashboard/case/[id]/_components/ActivityTimeline.tsx`
- `apps/web-1/types/case.ts`

### 5.4 Document workspace
`DocumentWorkspace` hiện:
- nhận `document_workspace` từ case detail payload
- cho chọn checkpoint khi case có nhiều checkpoint
- render các tab `overview`, `documents`, `external-feedback`
- tách tài liệu support flow và tài liệu đánh giá bên ngoài

Tham chiếu:
- `apps/web-1/app/dashboard/case/[id]/_components/documents/DocumentWorkspace.tsx`
- `apps/api/src/modules/documents/domain/document-contract.ts`

> Ghi chú: component `VersionSelector` không còn tồn tại trong codebase — version switching không còn là bề mặt UI riêng.

### 5.5 Workspace tabs abstraction
Case workspace dùng `WorkspaceTabs` để điều hướng giữa các tab, mỗi tab là một component riêng:

| Tab | Component | Vai trò |
|-----|-----------|---------|
| Nội dung ý tưởng | `TabIdeaContent` | Xem nội dung case và intake snapshot |
| Trao đổi | `TabDiscussionChat` | Chat realtime Centrifugo (WS), REST + polling 60s fallback |
| Kết quả đánh giá | `TabReportFindings` | Xem report và findings |
| Timeline | `ActivityTimeline` | Event log liên tục |
| Document | (qua `DocumentWorkspace`) | Tài liệu theo checkpoint |

Tham chiếu:
- `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceTabs.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/TabIdeaContent.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/TabDiscussionChat.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/TabReportFindings.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/TabCaseSettings.tsx`

### 5.6 Stage flow & revision rounds
Workspace điều hướng theo stage (`user_facing_stage`) và revision rounds qua:
- `CaseStatusHeader`: hiển thị stage hiện tại + next action
- `StatusGuidanceCard`: hướng dẫn trạng thái hiện tại và next action
- `CaseOverviewPanel`: tóm tắt case
- Revision upload được gate theo stage (chỉ ở stage `waiting_for_revision`)
- Backend: `internal_status` chạy qua `case-machine.ts` (XState v5 — `transition.types.ts` giữ `TARGET_STAGE`), `allowed_transitions` trả về trong case detail, SLA `sla_deadline_at`

> Ghi chú: `RevisionSubmitModal`, `BuyRoundModal`, `AuditRoundTimeline` không còn tồn tại trong codebase — luồng vòng sửa được xử lý qua stage-based flow + revision upload gating, không phải modal mua vòng riêng.

Tham chiếu:
- `apps/web-1/app/dashboard/case/[id]/_components/CaseStatusHeader.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/CaseOverviewPanel.tsx`
- `apps/api/src/modules/cases/domain/case-machine.ts`

### 5.7 Credit / payment surface
Credit/ledger economy là core của hệ thống (không còn là surface phụ):
- `CreditPanel` + `CreditQuantityModal` + `CreditActions`: mua credit
- `CreditTransactionHistory` + `CreditBalanceCard`: lịch sử giao dịch + số dư
- Backend: model `CreditLedger` (purchase/consumption/refund, `balance_after`), error `NO_CREDITS` (402), events `credit_used`/`credits_purchased`
- Thanh toán: sepay webhook (`POST /api/payments/sepay-webhook`) xác minh bank transfer, admin veto-with-refund (48h)
- Giá: 39,000 VND/credit
- `payment/page.tsx` riêng vẫn tồn tại cho admin payment transparency

Tham chiếu:
- `apps/web-1/app/dashboard/case/[id]/_components/CreditPanel.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/CreditTransactionHistory.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/CreditBalanceCard.tsx`
- `apps/api/src/modules/payments/http/sepay.routes.ts`

> Ghi chú: `PaymentDrawer` không còn tồn tại trong codebase — luồng thanh toán chuyển sang credit purchase.

### 5.8 External feedback & document upload
- `ExternalFeedbackUploadModal`: cho phép upload phản hồi từ bên ngoài (lecturer feedback, v.v.)
- `StudentDocumentUploadModal`: student upload tài liệu minh chứng trong case workspace
- `SupporterOutputUploadModal`: supporter upload output report

Tham chiếu:
- `apps/web-1/app/dashboard/case/[id]/_components/ExternalFeedbackUploadModal.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/StudentDocumentUploadModal.tsx`
- `apps/web-1/app/supporter/case/[id]/_components/SupporterOutputUploadModal.tsx`

## 6. Data model bề mặt frontend đáng chú ý

### 6.1 Case
`Case` hiện đã có:
- `user_facing_stage`
- `internal_status`
- `payment_status`
- `locked_price`
- `sla_deadline_at`
- `credit_ledgers`
- `messages`
- `events`
- `checkpoints`
- `payments`
- `lifecycle_units`
- `reports`

Điều này cho thấy workspace hiện tại đã bám model giàu hơn nhiều so với form submit đơn giản, kèm credit ledger và SLA deadline cho stage flow.

### 6.2 ServicePackage
`ServicePackage` hiện đã có các trường cấu hình giá và audit trail:
- `price`
- `previous_price`
- `last_price_changed_at`
- `last_price_changed_by`

Tham chiếu:
- `apps/web-1/types/case.ts`
- `apps/web-1/types/package.ts`

### 6.3 Message
`CaseMessage` hiện gồm:
- `sender_auth_user_id`
- `sender_role_snapshot`
- `content`
- `created_at`
- optional `sender`

### 6.4 Event
`CaseEvent` hiện gồm:
- `event_type`
- `actor_auth_user_id`
- optional links tới document/report/audit_round/payment/meeting
- `metadata_json`
- `created_at`

### 6.5 Intake document
`IntakeDocument` hiện gồm:
- `source_type: "drive" | "upload"`
- `drive_url?`
- `file_url?`
- `document_type`
- `role_description`

Tham chiếu:
- `apps/web-1/app/dashboard/intake/_types/intake.types.ts`

### 6.6 Additive document workspace contract
`document_workspace` hiện encode:
- `selected_checkpoint_id`
- `checkpoints[]`
- `overview`
- `version_units[]`
- `assessment_units[]`
- `support_flow_documents[]`
- `external_feedback_documents[]`

Đây là layer mới hơn so với `document_board_sections` và `round_history`, nhưng đang cùng tồn tại để giữ tương thích.

Tham chiếu:
- `apps/api/src/modules/documents/domain/document-contract.ts`

## 7. Document intake model hiện trạng

Current intake UI không phải multi-document manager đầy đủ.

Nó hiện hoạt động như sau:
- dùng `documents[0]` như primary document bundle;
- yêu cầu user nộp 1 Drive/Docs URL chính;
- user tick checklist loại tài liệu có trong thư mục;
- UI tạo summary string cho `document_type` và `role_description`;
- template helper hỗ trợ nhóm chuẩn bị hồ sơ nhanh hơn.

Điều này nghĩa là intake document model hiện là hybrid sơ khai, trong khi downstream case workspace đã giàu hơn nhiều.

Tham chiếu:
- `apps/web-1/app/dashboard/intake/_components/Steps/DocumentInputStep.tsx`
- `apps/web-1/app/dashboard/intake/hooks/useIntakeForm.ts`

## 8. Role boundaries

### Student
- tạo case
- xem case workspace
- theo dõi tài liệu, timeline, status, credit balance
- mua credit qua `CreditPanel`/`CreditQuantityModal`
- chat với supporter/admin nếu luồng cho phép
- xem report và nộp revision (gate theo stage)

### Supporter
- mở case workspace cùng shell
- xem context, tài liệu, timeline, chat
- upload output report qua `SupporterOutputUploadModal`
- upload external feedback qua `ExternalFeedbackUploadModal`

### Admin
- triage, reject (lý do ≥ 10 ký tự), approve
- assign hoặc reassign supporter

## 9. Architectural constraints cho MVP demo

- Không nên refactor backend workflow trước demo.
- Không nên thay schema tài liệu lớn trước demo.
- Không nên mô tả intake upload flow như đã hoàn chỉnh nếu UI vẫn thiên về Drive link + checklist.
- Không nên phá shared workspace shell; đây là lợi thế hiện tại của codebase.
- Không nên để credit/payment lấn narrative chính của audit/review flow, dù credit ledger + sepay webhook + veto-with-refund là core economy đã code xong.

## 10. Architectural direction ngắn hạn đã chốt

- Giữ nguyên shell và route structure hiện tại.
- Dùng semantic/UX realignment để làm rõ narrative.
- Dùng shared frontend mapping cho status nếu khả thi.
- Xem document workspace là bề mặt trung tâm để hiểu hồ sơ và revision rounds.
- Xem text chat là coordination path.
- Xem timeline là continuity/trust layer.
- Xem report là output chính thức của supporter.
- Xem credit ledger + stage flow là trạng thái vận hành hiện tại (đã code), không còn là mục tiêu deferred.

## 11. Những gì chưa nên hứa trong tài liệu

Không ghi như thể đã có sẵn:
- intake document ingestion file-by-file hoàn chỉnh;
- event sourcing đầy đủ;
- document version manager hoàn chỉnh cho mọi artifact ngoài scope hiện tại;
- automation AI mới chưa tồn tại trong luồng hiện tại.

> Realtime chat qua Centrifugo đã ship (xem §4.6) — không còn thuộc danh sách này.
