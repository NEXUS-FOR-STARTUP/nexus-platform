<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## OVERVIEW

Next.js 16 App Router product app. Mantine UI v9, TanStack Query v5 / Form v1, Lucide React, Tailwind CSS v4. 3 persona surfaces: student, admin, supporter.

## STRUCTURE

```
app/
├── layout.tsx + providers.tsx → Root layout (QueryClient, Mantine, Theme)
├── page.tsx → Landing (AppShell)
├── (auth)/ → Login/register (AuthPanel, TanStack Form + Google OAuth)
├── dashboard/ → Student (role=user)
│   └── case/[id]/ → Workspace (4 tabs, 16 components, 6 hooks)
├── admin/ → Admin panel (5 sections, 5 hooks, 11 components)
└── supporter/ → Supporter workspace (case view + output upload; settings mirrors student via shared dashboard SettingsLayout)

components/ → Shared: 3 shells (App/Auth/Dashboard), 4 landing, 4 UI primitives
lib/ → api-client (Axios), auth-client (Better Auth), pricing (VND)
types/ → Case, Payment, ServicePackage, User interfaces
```

## LAYOUT NESTING

```
RootLayout → Providers
├── AppShell → Landing (/)
├── AuthShell → Auth (/auth/*)
└── DashboardShell → Protected (role-guarded)
    ├── /dashboard/* (student)
    ├── /admin/* (admin)
    └── /supporter/* (supporter|admin)
```

## DATA FETCHING PATTERN

- TanStack Query + Axios apiClient
- Query keys: `["cases"]`, `["case", id]`, `["case-messages", caseId]`
- Realtime chat: Centrifugo WebSocket qua `useRealtimeChat` (sub `chat:{caseId}`, token từ `/api/realtime/cases/:caseId/subscribe-token`) → setQueryData trực tiếp
- Polling: case details (10s), chat messages (60s fallback — realtime chính qua WebSocket)
- Mutations invalidate related queries on success
- No Redux/Zustand

## CUSTOM HOOKS (16 total)

| Hook | File | Purpose |
|------|------|---------|
| useCasesList | dashboard/hooks/ | Student case list |
| useMyPayments | dashboard/hooks/ | Student payment history |
| useCaseDetails | case/[id]/hooks/ | Single case + workspace (10s poll) |
| useCaseChat | case/[id]/hooks/ | Messages + send (60s poll fallback) |
| useRealtimeChat | case/[id]/hooks/ | Centrifugo WS subscription `chat:{caseId}` → live messages |
| useCaseDocumentUploads | case/[id]/hooks/ | 4 sub-hooks: document types, student upload, supporter-output upload, external-feedback upload |
| useIntakeForm | intake/hooks/ | 7-step wizard (TanStack Form + localStorage) |
| useTeamFitMutation | team-fit/hooks/ | AI team-fit analysis |
| useTeamFitSaveMutation | team-fit/hooks/ | Save as case |
| useAdminCases | admin/hooks/ | Admin case triage (5 actions) |
| useAdminStats | admin/hooks/ | Dashboard stats |
| useAdminDocuments | admin/hooks/ | Document CRUD |
| useAdminPayments | admin/hooks/ | Payment verification |
| useAdminPackages | admin/hooks/ | Package management |
| useNotifications | lib/hooks/ | Notification list + unread count |
| useProfileMutations | dashboard/settings/hooks/ | Đổi tên + mật khẩu (Better Auth); đổi ảnh POST /api/profile/avatar |

## MANTINE UI STYLING RULE

- **Không tự thêm Tailwind positioning classes** (`fixed`, `inset-0`, `flex`, `items-center`, `justify-center`) vào Mantine UI components (`Modal`, `Drawer`, v.v.). Mantine đã có layout mặc định. Override class gây xung đột hiển thị, lệch modal khỏi giữa màn hình.

## AUTH PATTERN

Client-side only (no middleware guard):

- `useSession()` in layout → redirect if missing/wrong role
- `apiClient` 401 interceptor → `/auth`
- Protected: dashboard (user), admin (admin), supporter (supporter|admin)

## UI CONVENTIONS

- Vietnamese-first (all labels, messages, notifications)
- Currency: **VND only**, phân cách phần ngàn dùng dấu phẩy `,` (e.g. `100,000 VND`, tuyệt đối không dùng `₫`, `đ`, hoặc dấu chấm `.`)
- Lucide React (icons), Mantine Charts (Recharts), @mantine/tiptap (TipTap editor)
- TanStack Form for forms
- Tailwind CSS v4 + Mantine theme

## KEY EXTERNAL DEPS

| Package | Role |
|---------|------|
| @mantine/core/hooks | Primary UI components |
| @tanstack/react-query v5 | Server state |
| @tanstack/react-form v1 | Form state |
| lucide-react | Icons |
| axios | HTTP client |
| better-auth/react | Auth client + useSession |
| centrifuge | Realtime chat WebSocket client (useRealtimeChat) |
| next-themes | Dark/light mode |
| recharts (via @mantine/charts) | Charts |
| @tiptap/react | Rich text editor |
| dayjs | Date formatting |

## DOCUMENTATION REFERENCE

| Doc | When to Read |
|-----|-------------|
| `docs/docker-build-push-guide.md` | Build/push Web Docker image |
| `docs/ci-guide.md` | CI/CD pipeline, GitHub Actions |
