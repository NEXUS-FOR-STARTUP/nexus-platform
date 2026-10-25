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

## DESIGN SYSTEM (BẮT BUỘC, KHÔNG ĐƯỢC VI PHẠM)

Màu, border, font là hợp đồng giao diện. Nguồn duy nhất: `app/globals.css` (khối `:root`, `[data-mantine-color-scheme="dark"]`, `@theme`). Code UI chỉ dùng biến, không gõ giá trị.

### 1. Màu: 3 màu logo Nexus + thang xám

Logo có đúng 3 màu: navy `#0b409e`, xanh lá `#22ad46`, cam `#f36f21`. **Một màu một nghĩa, theo trạng thái, không theo tên giai đoạn** (số giai đoạn sẽ tăng, không có màu cho từng giai đoạn).

| Token | Giá trị | Nghĩa | Dùng cho |
|---|---|---|---|
| `--color-brand` / `-hover` / `-soft` / `-subtle` / `-mid` | `#0B409E` / `#09337D` / `#DBE4F3` / `#EAEFF8` / `#9FB4DC` | Hành động, đang ở đây, việc tiếp theo | Nút chính, liên kết, tab chọn, vòng focus, 1 mảng navy đặc mỗi màn hình |
| `--color-on-brand` | `#FFFFFF` | Chữ trên mảng navy | Chỉ trên `--color-brand` (9.4:1) |
| `--color-success` / `-soft` / `-ink` | `#22AD46` / `#D8F1DF` / `#166534` | Hoàn thành, đã có kết quả | Thanh tiến độ, ô icon, chip, tick |
| `--color-accent-warm` / `-hover` / `-soft` / `-ink` | `#F36F21` / `#D95A12` / `#FDE5D3` / `#9A3412` | Đang chấm, cần chú ý | Thanh tiến độ, ô icon, chip |
| `--color-danger` / `-soft` / `-ink` | `#EF4444` / `#FEE2E2` / `#991B1B` | Lỗi, xoá, bắt buộc | Nút xoá, lỗi form, nhãn "Quan trọng" |
| `--color-warning` / `-soft` / `-ink` | `#F59E0B` / `#FEF3C7` / `#A16207` | Cảnh báo nhẹ (câu còn ngắn) | Dòng cảnh báo, icon cảnh báo |
| `--color-bg` | `#F8FAFC` | Nền trang duy nhất | `<main>`, body |
| `--color-surface` | `#FFFFFF` | Thẻ, input, menu | Card, ô nhập |
| `--color-surface-soft` | `#F1F5F9` | Hàng, chip, hover | Dòng danh sách, chip trung tính |
| `--color-surface-muted` | `#E2E8F0` | Khoá, vô hiệu | Đoạn tiến độ khoá, nút disabled |
| `--color-border` / `--color-border-strong` | `#E2E8F0` / `#CBD5E1` | Viền thẻ / viền control | Card / nút phụ, input, select |
| `--color-text` / `-muted` / `-subtle` / `-disabled` | `#0F172A` / `#475569` / `#64748B` / `#94A3B8` | Chữ chính / phụ / chú thích / vô hiệu | Mọi chữ. Chữ phụ không nhạt hơn `-muted` |

Quy tắc:
- **CẤM** hex, `rgb()`, `hsl()` trong `*.module.css`, `style={{}}`, Tailwind arbitrary (`bg-[#...]`). Dùng `var(--color-*)` hoặc class Tailwind map từ `@theme` (`bg-brand`, `text-text-app`).
- Cam và xanh lá chỉ làm **nền** (độ tương phản trên trắng chỉ 2.9:1). Chữ trên nền nhạt dùng `-ink`. Chữ trắng chỉ đặt trên navy.
- Mỗi màn hình tối đa một mảng navy đặc. Không gradient, không glow, không tím/indigo, không màu mới ngoài bảng này.
- Thêm hoặc đổi màu: sửa ở `globals.css` (cả light và dark), cập nhật bảng này. Không đặt biến màu cục bộ trong module CSS.

### Quy tắc tương phản chữ/nền (BẮT BUỘC)

- **Nền đậm thì chữ sáng; nền sáng thì chữ đậm.** Không ngoại lệ, không để Mantine tự chọn: `autoContrast` có thể cho chữ đen trên nền cam/xanh trung bình, nhìn như lỗi.
- Nền đậm là navy (`--color-brand`, `-hover`): chữ `--color-on-brand` (trắng). Nền nhạt (`-soft`, `-subtle`, `--color-surface*`): chữ `--color-text` hoặc `-ink`.
- Cam và xanh lá logo (`--color-accent-warm`, `--color-success`) ở mức giữa, chữ trắng chỉ 2.9:1 còn chữ đen trông xám: **không làm nền nút**. Nút dùng navy. Cam/xanh lá chỉ làm mảng màu, ô icon, thanh tiến độ, hoặc nền `-soft` kèm chữ `-ink`.
- Mantine `Button`/`Badge` `variant="filled"` chỉ với `color="brand"` (hoặc `red` cho hành động xoá). Alert/banner cảnh báo dùng `variant="light"`; nút hành động bên trong vẫn là nút navy chữ trắng, không dùng `color="yellow"`.
- Tỉ lệ tối thiểu: chữ thường 4.5:1, chữ lớn (từ 18px, hoặc từ 14px đậm) 3:1.

### Chữ hoa trong badge/chip

- Badge, chip, nhãn trạng thái chỉ viết hoa chữ cái đầu câu ("Báo cáo đã sẵn sàng", không phải "BÁO CÁO ĐÃ SẴN SÀNG"). Theme Mantine đã đặt `Badge` `text-transform: none`; không thêm `uppercase` cho nhãn.

### 2. Border, radius, bóng, focus

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--ui-border-width` | `1px` | Mọi viền (thẻ stage dùng `--ui-card-border-width`) |
| `--ui-radius` | `0.5rem` (8px) | Thẻ, nút, input, select, menu, ô icon |
| `--ui-radius-sm` | `0.375rem` (6px) | Mục bên trong menu/danh sách/dropdown |
| `--ui-radius-pill` | `999px` | Chip, và chỉ chip |
| `--ui-focus-ring` + `--ui-focus-offset` | `2px solid brand`, `2px` | `:focus-visible` của mọi control |
| `--shadow-float` | | Chỉ menu, popover, dialog |

- Thẻ: `1px solid var(--color-border)`, nền `--color-surface`, **không bóng khi đứng yên**. Control: `1px solid var(--color-border-strong)`, cao 40px.
- Không viền chân tóc để trang trí, không bóng trên thẻ, không glass/blur.

### 3. Font

- Chỉ **Inter Tight** (`--font-inter-tight`, nạp bằng `next/font`). Merriweather chỉ cho news/bài đọc.
- Không monospace, ngoại lệ duy nhất: giá trị mã thật (ID giao dịch, mã tham chiếu ngân hàng, code block).
- Vùng redesign (case, wallet, profile): cỡ chữ dùng `--ui-text-title|section|body|note`, độ đậm chỉ `--ui-weight-regular` (400) và `--ui-weight-medium` (500). **Không 600/700.**

### 4. Dark theme (CHƯA LÀM, phải tính sau)

Giá trị dark trong `globals.css` hiện chỉ là tạm, chưa kiểm. Việc còn lại:
- Navy `#0B409E` quá tối trên nền tối; dark đang dùng `#3B82F6`. Cần chọn lại navy/`-soft`/`-mid` và kiểm tương phản chữ trên mảng navy.
- Kiểm lại `-ink` của success/warm/danger, thanh tiến độ, ô icon, chip, khung PDF, thẻ navy.
- Rà các chỗ ghi đè Mantine (`--mantine-color-dark-*`) và modal/dropdown trong portal.
- Quy tắc từ giờ: mọi màu mới phải có giá trị dark ngay trong `[data-mantine-color-scheme="dark"]`. Chỉ dùng token thì dark chỉ cần đổi ở một nơi.

### 5. Nợ còn lại (chưa thống nhất, không được làm nặng thêm)

- **Mantine palette**: `app/providers.tsx` là nơi duy nhất được giữ hex (Mantine cần màu parse được để dựng thang). Ở đó `brand` và `blue` = navy, `green` và `teal` = xanh lá logo, `orange` = cam logo, `red` = danger, `gray` = thang slate; `autoContrast` bật. Vì vậy `color="blue|teal|green|orange|red|gray"` đi theo hệ màu. **Không dùng** `yellow|grape|violet|indigo|cyan|lime|pink` (còn khoảng 321 chỗ dùng màu Mantine toàn app, chưa rà từng chỗ).
- **Tailwind palette** (`bg-amber-50`, `text-red-600`, `border-blue-200`...): còn khoảng 203 chỗ (admin, news, team-fit, intake, case). Chưa map về token. Code mới dùng class token (`bg-brand`, `text-text-app`, `border-border-app`), không dùng bậc màu Tailwind.
- **Hex gõ cứng**: 85 chỗ: `app/admin/_components` (18), `components/landing/*` (30), `app/auth/_components` (10), `components/ui/RainbowBuyButton.tsx` (9, cố ý nhiều màu), `app/news/[slug]` (4).
- **Trang đã biết còn lệch**: `/dashboard` (banner vàng "cần cập nhật thông tin liên hệ" dùng amber/yellow), landing (chữ xanh `#2563eb` cũ, CTA cam).

Đưa về token khi chạm tới các file này; không thêm hex hoặc bậc màu mới.

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
- **Cấm CP1/CP2/CP3/CP4/PITCH và "Checkpoint N" trên UI** (mọi persona: student, admin, supporter): label, tiêu đề, thông báo, tooltip, tên gói/dịch vụ hiển thị. Dùng tên vòng: CP1 = "Ý tưởng", CP2 = "Thị trường", CP3 = "Mô hình kinh doanh", CP4 = "Tài chính", PITCH = "PITCH DECK" (lấy từ `STAGES[].name`, vd. "Gói chấm Thị trường", "Vòng Thị trường"). Mã nội bộ (`cp1_audit`, `"CP2"`, tên biến/enum/query param) giữ nguyên trong code. Stage không có `serviceType` (CP4, PITCH) không có chấm, tải tài liệu hay lượt chấm: UI chỉ hiện Soạn thảo. Tên gói/dịch vụ từ API (`ServicePackageDto.name`, `service_type.name`) có thể còn chứa "Checkpoint" trong DB, nên KHÔNG render trực tiếp: dựng nhãn từ tên vòng (`stageName`) hoặc `credits_granted`.

## DOCUMENTATION REFERENCE

| Doc | When to Read |
|-----|-------------|
| `design-system/wording/` | Bắt buộc đọc khi viết/sửa label, copy, thông báo UI |
| `docs/docker-build-push-guide.md` | Build/push Web Docker image |
| `docs/ci-guide.md` | CI/CD pipeline, GitHub Actions |
