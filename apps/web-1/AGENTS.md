<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Breaking changes — APIs, conventions, file structure may differ from training data. Read relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## OVERVIEW

Next.js 16 App Router product app. Mantine UI v9, TanStack Query v5 / Form v1, Phosphor Icons (@phosphor-icons/react), Tailwind CSS v4. 3 persona surfaces: student (mobile-responsive), admin (desktop-only), supporter (desktop-only).

## STRUCTURE

```
app/
├── layout.tsx + providers.tsx → Root layout (QueryClient, Mantine, Theme)
├── page.tsx → Landing (own glass nav + footer, components/landing/; no AppShell)
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
├── Landing (/) → self-contained (LandingNav/LandingFooter); AppShell now only /news + policy pages
├── AuthShell → Auth (/auth/*)
└── DashboardShell → Protected (Server guard via proxy.ts + role routing)
    ├── /dashboard/* (student, role=user, responsive)
    ├── /admin/* (admin, role=admin, DesktopOnlyNotice < 1024px)
    └── /supporter/* (supporter, role=supporter, DesktopOnlyNotice < 1024px)
```

## AUTH & SECURITY PATTERN

- **Server-side guard (`proxy.ts`)**: Next.js 16 entry interceptor checks session + role permissions before rendering protected trees. Preserves `returnUrl` for post-login redirect.
- **Maintenance Mode**: `proxy.ts` evaluates `MAINTENANCE_MODE` env flag; enabled → routes redirect `/maintenance`.
- **Client-side sync**: `useSession()` in layouts → reactive state sync, immediate client redirect on logout/expired session.
- **Axios 401 Interceptor**: Auto-clear stale session tokens, route back to `/auth`.

## PERSONA DEVICE SCOPE (MOBILE VS DESKTOP)

- **Student Workspace (`/dashboard/*`, `/intake`, `/team-fit`)**: Fully mobile-responsive. Mobile drawer nav, responsive card-view tables for documents + transactions, adaptive headers.
- **Admin & Supporter Consoles (`/admin/*`, `/supporter/*`)**: Strictly **DESKTOP-ONLY**. Rendered with `DesktopOnlyNotice.tsx`, blocks viewport width < 1024px. **Never write responsive mobile overrides for Admin/Supporter screens.**

## CASE WORKSPACE (5 TABS & STATE GATING)

Case detail (`dashboard/case/[id]`, live path `NEXT_PUBLIC_JOURNEY_WORKSPACE=true`) has 5 tabs synced with `?tab=` (stage detail adds `&stage=<slug>&view=<draft|files|results>`):
1. `overview`: header, next-step hero, journey list, recent reports, profile fold.
2. `journey`: stage rows; stage detail with draft editor (TOC + question + hint panel), files, results (run list + PDF).
3. `billing`: stage balance cards, buy CTA, expandable credit history (lazy order fetch).
4. `timeline`: activity grouped by day, newest first (API returns the latest 50).
5. `settings`: project + contact forms (save enabled only when dirty), danger zone.

Redesign primitives: `--ui-text-*`/`--ui-weight-*`/`--ui-gap-section`/`--ui-topbar-height` in `globals.css`; `components/ui/{underline-tabs,StatusChip,CopyIconButton}`; `formatVndAmount` in `lib/pricing.ts` (always `1,000 VND`).

## DATA FETCHING PATTERN

- TanStack Query + Axios `apiClient`
- Query keys: `["cases"]`, `["case", id]`, `["case-messages", caseId]`, `["admin-workers"]`
- Realtime chat: Centrifugo WebSocket via `useRealtimeChat` (sub `chat:{caseId}`, token from `/api/realtime/cases/:caseId/subscribe-token`) → update query cache directly.
- Polling: case details (10s), chat messages (60s fallback - WebSocket primary), worker KPI (10s).
- Mutations invalidate related queries on success. No Redux/Zustand.

## CUSTOM HOOKS (37 total)

Core hooks across routes:
- **Case & Workspace**: `useCasesList`, `useCaseDetails`, `useCaseChatVirtualizer`, `useCaseChat`, `useRealtimeChat`, `useCaseDocumentUploads`, `useCaseStatusGuidance`, `useCaseActions`, `useCaseReports`.
- **Intake & Team-Fit**: `useIntakeForm`, `useTeamFitMutation`, `useTeamFitSaveMutation`, `useTeamFitStatus`.
- **Wallet & Orders**: `useWalletBalance`, `useWalletHistory`, `useCreateDeposit`, `useCreateOrder`, `useOrderDetails`.
- **Admin Console**: `useAdminCases`, `useAdminCaseDetail`, `useAdminStats`, `useAdminDeposits`, `useAdminUsers`, `useAdminDocuments`, `useAdminPayments`, `useAdminPackages`, `useAdminWorkerKpi`, `useAdminWorkerJobs`, `useAdminWorkerJobDetail`, `useAdminCancelJob`.
- **Supporter Workspace**: `useSupporterCases`, `useSupporterActions`, `useSupporterReportDraft`.
- **Shared / Settings**: `useNotifications`, `useUpdateProfileName`, `useChangeAvatar`, `usePasswordMutations`, `useDeleteAccount`, `useUserPreferences`.

 ## MANTINE UI STYLING RULE

 - **Không tự thêm Tailwind positioning classes** (`fixed`, `inset-0`, `flex`, `items-center`, `justify-center`) vào Mantine UI components (`Modal`, `Drawer`, v.v.). Mantine có layout mặc định. Override class gây xung đột hiển thị, lệch modal khỏi giữa màn hình.
 - **Độ dày control đồng nhất**: mọi `Button`, `Select`, `TextInput`, `NumberInput` tương tác cùng hàng dùng chung `size="sm"` trở lên (cấm `size="xs"` cho control lọc/bấm). Control đứng cạnh nhau cao bằng nhau trên desktop + mobile.
## UI CONVENTIONS & WORDING

- Vietnamese-first (mọi label, message, notification).
- Currency: **BẮT BUỘC chỉ dùng đơn vị `VND`**, đặt sau số, cách 1 dấu cách, phân cách phần ngàn bằng dấu phẩy `,` (đúng: `79,000 VND`, `13,167 VND`). **TUYỆT ĐỐI KHÔNG** dùng `đ`, `₫`, `VNĐ`, `đồng` hay dấu chấm `.` làm phân cách (sai: `79.000đ`, `79.000 VND`). Áp dụng mọi chuỗi hiển thị (landing, FAQ, banner, modal, thông báo). Dùng `formatPrice` (`lib/pricing.ts`) khi số tiền khác 0; số 0 cần hiện `0 VND` thì không dùng `formatPrice` (trả "Miễn phí").
- **Canonical Wording**: Chỉnh copy giao diện bắt buộc tra `design-system/wording/` (1288 lines report + 28 page audits) để theo mental model người dùng (tránh thuật ngữ kỹ thuật nội bộ như mã transition hay tên enum).
- **Cấm CP1/CP2/CP3/CP4 và "Checkpoint N" trên UI** (mọi persona: student, admin, supporter): label, tiêu đề, thông báo, tooltip, tên gói/dịch vụ hiển thị. Dùng tên vòng: CP1 = "Ý tưởng", CP2 = "Thị trường" (vd. "Gói chấm Thị trường", "Vòng Thị trường"). Mã nội bộ (`cp1_audit`, `"CP2"`, tên biến/enum/query param) giữ nguyên trong code. Tên gói/dịch vụ từ API (`ServicePackageDto.name`, `service_type.name`) có thể còn chứa "Checkpoint" trong DB, nên KHÔNG render trực tiếp: dựng nhãn từ tên vòng (`stageName`) hoặc `credits_granted`.

## DOCUMENTATION REFERENCE

| Doc | When to Read |
|-----|-------------|
| `design-system/wording/` | Bắt buộc đọc khi viết/sửa label, copy, thông báo UI |
| `docs/docker-build-push-guide.md` | Build/push Web Docker image |
| `docs/ci-guide.md` | CI/CD pipeline, GitHub Actions |
