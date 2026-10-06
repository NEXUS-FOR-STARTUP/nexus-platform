<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## OVERVIEW

Next.js 16 App Router product app. Mantine UI v9, TanStack Query v5 / Form v1, Lucide React, Tailwind CSS v4. 3 persona surfaces: student (mobile-responsive), admin (desktop-only), supporter (desktop-only).

## STRUCTURE

```
app/
├── layout.tsx + providers.tsx → Root layout (QueryClient, Mantine, Theme)
├── page.tsx → Landing (AppShell)
├── auth/ → Login/register (Google OAuth, Email OTP & Password; legacy verify-email @deprecated)
├── dashboard/ → Student (role=user, mobile-responsive)
│   └── case/[id]/ → Workspace (7 tabs: overview/documents/report/discussion/timeline/settings/credits with ?tab= URL sync)
├── admin/ → Admin panel (7 sections via ?tab=: stats/payments/cases/documents/packages/users/workers)
└── supporter/ → Supporter workspace (case queue, review & output upload, desktop-only)

components/ → Shared: 3 shells (App/Auth/Dashboard), 4 landing, UI primitives, DesktopOnlyNotice
lib/ → api-client (Axios), auth-client (Better Auth), pricing (VND)
types/ → Case, Payment, ServicePackage, User, Worker interfaces
```

## LAYOUT NESTING

```
RootLayout → Providers
├── AppShell → Landing (/)
├── AuthShell → Auth (/auth/*)
└── DashboardShell → Protected (Server guard via proxy.ts + role routing)
    ├── /dashboard/* (student, role=user, responsive)
    ├── /admin/* (admin, role=admin, DesktopOnlyNotice < 1024px)
    └── /supporter/* (supporter, role=supporter, DesktopOnlyNotice < 1024px)
```

## AUTH & SECURITY PATTERN

- **Server-side guard (`proxy.ts`)**: Next.js 16 entry interceptor checking session and role permissions before rendering protected trees. Preserves `returnUrl` for seamless post-login redirection.
- **Maintenance Mode**: `proxy.ts` evaluates `MAINTENANCE_MODE` env flag; when enabled, routes redirect to `/maintenance`.
- **Client-side sync**: `useSession()` in layouts ensures reactive state synchronization and immediate client-side redirects on logout or expired sessions.
- **Axios 401 Interceptor**: Auto-clears stale session tokens and routes back to `/auth`.

## PERSONA DEVICE SCOPE (MOBILE VS DESKTOP)

- **Student Workspace (`/dashboard/*`, `/intake`, `/team-fit`)**: Fully mobile-responsive. Employs mobile drawer navigation, responsive card-view tables for documents and transactions, and adaptive headers.
- **Admin & Supporter Consoles (`/admin/*`, `/supporter/*`)**: Strictly **DESKTOP-ONLY**. Rendered with `DesktopOnlyNotice.tsx` which explicitly blocks screens with viewport width < 1024px. **Never write responsive mobile overrides for Admin/Supporter screens.**

## CASE WORKSPACE (7 TABS & STATE GATING)

Case detail (`dashboard/case/[id]`) contains 7 distinct tabs synchronized with the query string `?tab=`:
1. `overview`: Radar score, phase cards, status guidance, and quick actions.
2. `documents`: Uploaded artifacts, student documents, supporter outputs, and external feedback.
3. `report`: Rendered AI critique report, scorecards, and Typst PDF download.
4. `discussion`: Realtime chat via Centrifugo (conditionally hidden for pure AI packages like `pkg_ai_audit`).
5. `timeline`: Audit history, stage changes, and chronological event ledger.
6. `settings`: Case metadata editing, member management, and danger zone actions.
7. `credits`: Evaluation balance, purchase CTA (locked once case reaches `completed` stage).

## DATA FETCHING PATTERN

- TanStack Query + Axios `apiClient`
- Query keys: `["cases"]`, `["case", id]`, `["case-messages", caseId]`, `["admin-workers"]`
- Realtime chat: Centrifugo WebSocket via `useRealtimeChat` (sub `chat:{caseId}`, token from `/api/realtime/cases/:caseId/subscribe-token`) → updates query cache directly.
- Polling: case details (10s), chat messages (60s fallback — WebSocket is primary), worker KPI (10s).
- Mutations invalidate related queries on success. No Redux/Zustand.

## CUSTOM HOOKS (37 total)

Core hooks across routes:
- **Case & Workspace**: `useCasesList`, `useCaseDetails`, `useCaseChatVirtualizer`, `useCaseChat`, `useRealtimeChat`, `useCaseDocumentUploads`, `useCaseStatusGuidance`, `useCaseActions`, `useCaseReports`.
- **Intake & Team-Fit**: `useIntakeForm`, `useTeamFitMutation`, `useTeamFitSaveMutation`, `useTeamFitStatus`.
- **Wallet & Orders**: `useWalletBalance`, `useWalletHistory`, `useCreateDeposit`, `useCreateOrder`, `useOrderDetails`.
- **Admin Console**: `useAdminCases`, `useAdminCaseDetail`, `useAdminStats`, `useAdminDeposits`, `useAdminUsers`, `useAdminDocuments`, `useAdminPayments`, `useAdminPackages`, `useAdminWorkerKpi`, `useAdminWorkerJobs`, `useAdminWorkerJobDetail`, `useAdminCancelJob`.
- **Supporter Workspace**: `useSupporterCases`, `useSupporterActions`, `useSupporterReportDraft`.
- **Shared / Settings**: `useNotifications`, `useProfileMutations`, `useUserPreferences`.

## MANTINE UI STYLING RULE

- **Không tự thêm Tailwind positioning classes** (`fixed`, `inset-0`, `flex`, `items-center`, `justify-center`) vào Mantine UI components (`Modal`, `Drawer`, v.v.). Mantine đã có layout mặc định. Override class gây xung đột hiển thị, lệch modal khỏi giữa màn hình.

## UI CONVENTIONS & WORDING

- Vietnamese-first (all labels, messages, notifications).
- Currency: **VND only**, phân cách phần ngàn dùng dấu phẩy `,` (e.g. `100,000 VND`, tuyệt đối không dùng `₫`, `đ`, hoặc dấu chấm `.`).
- **Canonical Wording**: Khi chỉnh sửa copy giao diện, bắt buộc tra cứu tài liệu tại `design-system/wording/` (1288 lines report + 28 page audits) để tuân thủ mental model người dùng (tránh dùng thuật ngữ kỹ thuật nội bộ như mã transition hay tên enum).

## DOCUMENTATION REFERENCE

| Doc | When to Read |
|-----|-------------|
| `design-system/wording/` | Bắt buộc đọc khi viết/sửa label, copy, thông báo UI |
| `docs/docker-build-push-guide.md` | Build/push Web Docker image |
| `docs/ci-guide.md` | CI/CD pipeline, GitHub Actions |
