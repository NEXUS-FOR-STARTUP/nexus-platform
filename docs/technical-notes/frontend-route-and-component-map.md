# Frontend Route and Component Map cho CP1 MVP

- PRD reference: [`../prd/core-product-prd.md`](../prd/core-product-prd.md)
- Flow reference: [`../flows/cp1-mvp-screen-spec.md`](../flows/cp1-mvp-screen-spec.md)
- Technical context:
  - [`./document-lifecycle-model-note.md`](./document-lifecycle-model-note.md)
- Trạng thái: đang làm việc
- Nguồn khảo sát: CodeGraph + `apps/web-1` hiện tại

## 1. Mục tiêu

Chốt bản đồ route và bản đồ component cho `apps/web-1` theo hướng implement MVP nhanh nhất, ít đập code nhất, và vẫn bám business flow đã khóa.

## 2. Quyết định gốc

- Không thiết kế router mới từ đầu nếu route family hiện tại đã đủ gần.
- Ưu tiên `adapt` route và component sẵn có trước khi tạo mới.
- Không giữ `payment` và `chat tự do` trong golden flow của CP1 MVP.
- `User workspace` phải đổi trọng tâm sang `report + next action + revision`, không còn là tabbed portal chung chung.

## 3. Current codebase scan

### Route tree hiện có trong `apps/web-1/app`

- `/`
- `/auth`
- `/dashboard`
- `/dashboard/intake`
- `/dashboard/case/[id]`
- `/dashboard/case/[id]/payment`
- `/dashboard/wallet`
- `/admin`
- `/supporter`
- `/supporter/case/[id]`
- `/dashboard/payments` (redirect → `/dashboard/wallet`)
- `/dashboard/profile` (redirect → `/dashboard/settings/profile`)
- `/auth/forgot-password` (BROKEN — server chưa có `sendResetPassword`)

> Ghi chú (cập nhật 2026-08-24): `/supporter/case/[id]/review` **không tồn tại** — supporter biên tập report qua usecases `get-draft-report`/`edit-draft-report` + modal upload, không có page riêng. Route `/dashboard/wallet` đã triển khai — ví VND student (số dư, lịch sử giao dịch, nạp tiền SePay). Nav item "Ví của tôi" (icon Wallet) được thêm vào `DashboardShell` cho student. Backend: wallet module giữ live `GET /api/wallet/balance` + `GET /api/wallet/history`; **nạp tiền thuộc module deposits** (5 routes, `POST /api/deposits` + `POST /api/deposits/:id/verify`), `POST /api/wallet/topups` → **410 GONE**, `POST /api/wallet/purchase-credits` **deprecated**.

### Shell hiện có

- `AppShell`: public pages
- `AuthShell`: auth page
- `DashboardShell`: authenticated app shell cho user / admin / supporter

### Workspace hiện có

- student workspace và supporter workspace đang tái dùng nhiều component chung:
  - `CaseStatusHeader`
  - `WorkspaceSidebar`
  - `TabIdeaContent`
  - `TabReportFindings`
  - `TabDiscussionChat`
  - `ActivityTimeline`

### Mismatch lớn với docs đã khóa

- `payment` vẫn có route và component riêng trong codebase, nhưng không còn thuộc golden flow MVP.
- `discussion/chat` vẫn là tab chính trong workspace hiện tại, nhưng phase 1 không dùng chat tự do làm core flow.
- `dashboard/intake` đang là conversational flow cũ; cần giữ route nhưng đổi nội dung để bám wizard đã chốt.
- `admin` hiện thiên về payment verification + assignment, chưa đúng hoàn toàn với triage flow mới.

## 4. Route naming decision

Để giảm churn, route canonical cho MVP nên bám route family hiện có thay vì đổi sang naming mới như `/login`, `/register`, `/cases/new`.

### Kết luận

- Giữ `/auth` làm route auth hợp nhất.
- Giữ `/dashboard/intake` làm route create case wizard.
- Giữ `/dashboard/case/[id]` làm user case workspace.
- Giữ `/supporter/case/[id]`; KHÔNG tạo `/supporter/case/[id]/review` — supporter biên tập report qua modal/`SupporterOutputUploadModal` (get-draft-report/edit-draft-report usecases), page riêng không tồn tại.
- Dùng `/admin/case/[id]` như route canonical cho admin case detail ngay từ phase 1.
- Xem `/dashboard/case/[id]/payment` là legacy/deferred route, không thuộc luồng CP1 MVP chính.

## 5. Canonical route map cho MVP

| Route | Access | Màn hình / vai trò | Tình trạng triển khai | Ghi chú |
| --- | --- | --- | --- | --- |
| `/` | Public | Landing | Reuse + adapt | Giữ route, đổi copy/value cho đúng CP1 MVP |
| `/auth` | Public | Register / Login | Reuse + adapt | Một route cho cả login và register |
| `/dashboard` | User | Empty dashboard / case list | Reuse + adapt | Giữ route; empty state phải đẩy tạo case |
| `/dashboard/intake` | User | Create case wizard | Reuse + rebuild content | Giữ route, thay flow chat cũ bằng guided wizard |
| `/dashboard/case/[id]` | User | User case workspace | Reuse + refocus | Màn quan trọng nhất; chuyển sang report-centric |
| `/dashboard/case/[id]/payment` | User | Payment legacy | Deferred / legacy | Không nằm trong golden flow hiện tại |
| `/dashboard/wallet` | User | Student wallet — số dư VND, lịch sử giao dịch, nạp tiền SePay | New (2026-08-11) | Nav item "Ví của tôi" trong DashboardShell |
| `/admin` | Admin | Admin triage queue | Adapt mạnh | Trang queue chính |
| `/admin/case/[id]` | Admin | Admin case detail | New | Canonical route cho detail view; không gộp tạm trong `/admin` |
| `/supporter` | Supporter, Admin | Supporter queue | Reuse + adapt | Giữ route; đổi filter và copy theo queue thật |
| `/supporter/case/[id]` | Supporter, Admin | Supporter case workspace | Reuse + adapt | Giữ route |

## 6. Route transition map

### Public to user flow

- `/` -> CTA chính -> `/auth`
- `/auth` -> đăng nhập thành công với role `user` -> `/dashboard`
- `/dashboard` -> `Tạo case mới` -> `/dashboard/intake`
- `/dashboard/intake` -> submit thành công -> `/dashboard/case/[id]`
- `/dashboard/case/[id]` -> `Gửi bản sửa mới` -> mở modal hoặc drawer revision ngay trong cùng route

### Admin flow

- `/auth` -> đăng nhập thành công với role `admin` -> `/admin`
- `/admin` -> click case -> `/admin/case/[id]`
- `/admin/case/[id]` -> assign supporter thành công -> quay lại `/admin` hoặc mở case kế tiếp

### Supporter flow

- `/auth` -> đăng nhập thành công với role `supporter` -> `/supporter`
- `/supporter` -> click case -> `/supporter/case/[id]`
- `/supporter/case/[id]` -> biên tập report trong workspace (get-draft-report/edit-draft-report usecases) -> publish qua `SupporterOutputUploadModal`

## 7. Route-level implementation notes

- `Submit revision` nên là modal hoặc drawer trong `/dashboard/case/[id]`, không cần route riêng ở phase 1.
- `Review before submit` và `Case submitted success` có thể là step cuối + success state bên trong `/dashboard/intake` nếu muốn giảm số route.
- Nếu cần redirect sau auth, nên điều hướng theo role:
  - `user` -> `/dashboard`
  - `supporter` -> `/supporter`
  - `admin` -> `/admin`

## 8. Component map

## 8.1 Shell components

| Component | Trạng thái | Dùng ở đâu | Hành động |
| --- | --- | --- | --- |
| `AppShell` | Existing | `/` | Reuse |
| `AuthShell` | Existing | `/auth` | Reuse |
| `DashboardShell` | Existing | `/dashboard`, `/admin`, `/supporter` | Reuse |
| `ThemeToggler` | Existing | shell-level | Reuse |
| `LoadingScreen` | Existing | protected layouts | Reuse |
| `LoadingSkeleton` | Existing | nhiều màn | Reuse |

## 8.2 Public/auth components

| Component | Trạng thái | Dùng ở đâu | Hành động |
| --- | --- | --- | --- |
| `LandingHero` | Existing | `/` | Adapt copy và CTA |
| `PackagePreview` | Existing | `/` | Optional / not core MVP |
| `FAQSection` | Existing | `/` | Reuse nếu nội dung còn phù hợp |
| `AuthPanel` | Existing | `/auth` | Adapt nội dung auth |

## 8.3 User dashboard and intake

| Component | Trạng thái | Dùng ở đâu | Hành động |
| --- | --- | --- | --- |
| `DashboardEmptyState` | Existing | `/dashboard` | Adapt để bám `case` thay vì `dự án` chung |
| `CaseCard` | Existing | `/dashboard`, `/supporter` | Adapt nhãn stage/status |
| `useCasesList` | Existing | dashboard/supporter queue | Reuse, nhưng cần filter đúng theo role |
| `IntakeProgressStepper` | Existing | `/dashboard/intake` | Reuse nếu hợp wizard mới |
| `IntakeChatFlow` | Existing | `/dashboard/intake` | Replace hoặc refactor mạnh |
| `DriveValidatorInput` | Existing | intake | Reuse nếu vẫn phù hợp |
| `useIntakeForm` | Existing | intake | Adapt để bám field set mới |
| `WalletBalanceCard` / `WalletTransactionList` / `WalletTransactionItem` | New (2026-08-11) | `/dashboard/wallet` | Số dư VND + lịch sử giao dịch (`wallet_transactions`) |
| `WalletTopupModal` | New (2026-08-11) | `/dashboard/wallet` | Nạp tiền SePay — trả QR + transfer content |
| `useWallet` (useWalletBalance / useWalletHistory / useCreateDeposit) | New (2026-08-11) | `/dashboard/wallet` | Query balance/history (polling 30s), create-deposit mutation |

## 8.4 User case workspace

### Existing components nên giữ và refactor

| Component | Vai trò mới trong MVP |
| --- | --- |
| `CaseStatusHeader` | Giữ, nhưng phải map sang user-facing stage mới |
| `ActivityTimeline` | Giữ làm timeline lịch sử |
| `TabIdeaContent` | Có thể đổi thành panel `Tài liệu nhóm đã gửi` |
| `TabReportFindings` | Giữ làm lõi của latest report view |
| `useCaseDetails` | Giữ làm hook chính cho workspace |
| `CreditPanel` / `CreditQuantityModal` / `CreditActions` | Core economy — mua credit trong workspace |
| `CreditTransactionHistory` / `CreditBalanceCard` | Lịch sử giao dịch + số dư credit |
| `StatusGuidanceCard` / `CaseOverviewPanel` | Hướng dẫn next action theo stage + tóm tắt case |

### Existing components nên bỏ khỏi golden flow hoặc hạ ưu tiên

| Component | Lý do |
| --- | --- |
| `TabDiscussionChat` | Phase 1 không dùng chat tự do làm core flow |
| `TabCaseSettings` | Không phải giá trị chính cho khách hàng trong MVP |
| `UnpaidAlertBanner` | Chỉ giữ nếu thật sự cần warning nội bộ; không để chi phối UI khách hàng |
| `WorkspaceSidebar` / `WorkspaceTabs` | Có thể giữ tạm, nhưng cần refactor để ưu tiên `report + next action` thay vì portal tab-heavy |

> Ghi chú (cập nhật 2026-08-03): `PaymentDrawer` không còn tồn tại trong codebase — luồng thanh toán đã chuyển sang credit/ledger economy (`CreditPanel`, `CreditQuantityModal`, `CreditActions`, `CreditTransactionHistory`, `CreditBalanceCard`).

### New user-facing components cần thêm

| Component đề xuất | Vai trò |
| --- | --- |
| `CaseWorkspaceHeader` | Header ngắn gọn cho case workspace nếu không muốn nhồi quá nhiều vào `CaseStatusHeader` |
| `NextActionCard` | Luôn chỉ ra việc user cần làm tiếp |
| `LatestReportPanel` | Hiển thị report mới nhất trực tiếp trong workspace |
| `RequestMoreInfoNotice` | Hiển thị yêu cầu bổ sung có CTA rõ |
| `DocumentBoard` | Gom tài liệu theo nhóm và theo round |
| `DocumentBoardSection` | Section con cho từng nhóm tài liệu |
| `RevisionUploadGate` | Nộp bản sửa mới, gate theo stage (`waiting_for_revision`) |
| `RoundHistoryPanel` | Cho user thấy các vòng đã qua mà không áp đảo UI |

## 8.5 Admin components

### Existing components có thể tái dùng

| Component | Vai trò | Hành động |
| --- | --- | --- |
| `AdminCaseAssignmentTable` | nền cho queue assign supporter | Adapt mạnh |
| `useAdminCases` | fetch cases/supporters | Adapt |

### Existing components nên xem là legacy/deferred cho CP1 MVP

| Component | Lý do |
| --- | --- |
| `AdminPaymentVerificationTable` | payment không còn thuộc golden flow |
| `RejectionReasonModal` | Có thể giữ pattern modal, nhưng nội dung phải đổi sang reject case (lý do ≥ 10 ký tự) — admin không còn action request more info |
| `useAdminPayments` | deferred theo payment |

### New admin components cần thêm

| Component đề xuất | Vai trò |
| --- | --- |
| `AdminTriageQueueTable` | queue case mới theo flow CP1 |
| `AdminCaseRow` | item/card cho queue |
| `AdminCaseSummaryPanel` | summary của case trong detail view |
| `AdminDocumentPreviewPanel` | preview tài liệu để triage |
| `AdminTriageActionPanel` | accept / reject / assign |
| `RejectCaseModal` | nhập lý do reject (bắt buộc ≥ 10 ký tự) |
| `AssignSupporterPanel` | chọn supporter phù hợp |

## 8.6 Supporter components

### Existing components nên giữ và refactor

| Component | Vai trò |
| --- | --- |
| `CaseCard` | card trong supporter queue |
| `CaseStatusHeader` | header của supporter workspace |
| `WorkspaceSidebar` | điều hướng trong supporter workspace |
| `TabIdeaContent` | đọc đầu vào / tài liệu nhóm |
| `TabReportFindings` | xem report hiện tại |
| `ActivityTimeline` | xem lịch sử case |
| `useReportReview` | hook lõi cho review editor |
| `FindingCard` | item trong report composer |
| `FindingEditor` | editor cho từng finding |
| `ReviewActionsPanel` | panel hành động của report composer |
| `DisclaimerBanner` | khu vực SOP / boundary nhắc supporter |

### New supporter components cần thêm

| Component đề xuất | Vai trò |
| --- | --- |
| `SupporterQueueFilters` | lọc theo deadline, round, stage |
| `SupporterCaseSummaryPanel` | summary riêng cho supporter |
| `SupporterAuditChecklistPanel` | checklist audit tối thiểu trong UI |
| `SupporterRoundComparisonPanel` | đặt bản cũ / bản mới cạnh nhau |
| `SupporterReportComposer` | wrapper rõ cho report composer trong `/supporter/case/[id]` (không dùng route riêng) |
| `CloseCaseModal` | đóng case với lý do rõ |
| `SupporterRequestMoreInfoAction` | phát yêu cầu bổ sung từ supporter |

## 8.7 Hook / data layer map

| Hook hiện có | Quyết định |
| --- | --- |
| `useCasesList` | giữ |
| `useCaseDetails` | giữ |
| `useIntakeForm` | refactor |
| `useReportReview` | giữ + mở rộng |
| `useCaseChat` | hạ ưu tiên / legacy |
| `usePaymentUpload` | deferred |
| `useAdminCases` | refactor theo triage flow |
| `useAdminPayments` | deferred |
| `useWallet` | mới — ví VND: `useWalletBalance` (polling 30s), `useWalletHistory`, `useCreateDeposit` |

## 9. Reuse / adapt / new summary

### Reuse mostly as-is

- `AppShell`
- `AuthShell`
- `DashboardShell`
- `ThemeToggler`
- `LoadingScreen`
- `LoadingSkeleton`

### Adapt strongly

- `LandingHero`
- `DashboardEmptyState`
- `CaseCard`
- `CaseStatusHeader`
- `IntakeProgressStepper`
- `useIntakeForm`
- `useCaseDetails`
- `useAdminCases`
- `useReportReview`

### Replace or de-prioritize in golden flow

- `IntakeChatFlow`
- `TabDiscussionChat`
- `TabCaseSettings`
- `UnpaidAlertBanner`
- `AdminPaymentVerificationTable`
- `usePaymentUpload`
- `useAdminPayments`

> Ghi chú (cập nhật 2026-08-03): `PaymentDrawer` không còn trong codebase; thanh toán đã chuyển sang credit/ledger economy (`CreditPanel`, `CreditQuantityModal`, `CreditActions`, `CreditTransactionHistory`, `CreditBalanceCard`).

### New components required to finish MVP cleanly

- `NextActionCard`
- `LatestReportPanel`
- `RequestMoreInfoNotice`
- `DocumentBoard`
- `AdminTriageQueueTable`
- `AdminCaseSummaryPanel`
- `AdminTriageActionPanel`
- `SupporterAuditChecklistPanel`
- `SupporterRoundComparisonPanel`
- `CloseCaseModal`

> Ghi chú (cập nhật 2026-08-03): `RevisionSubmitModal` không còn trong codebase — revision được xử lý qua stage-based flow (`user_facing_stage` + revision upload gating), với `CaseStatusHeader`/`StatusGuidanceCard` làm hướng dẫn next action.

## 10. Implement-first order

1. Refactor `/dashboard/intake` thành wizard đúng spec.
2. Refactor `/dashboard/case/[id]` thành report-centric workspace.
3. Thêm revision upload gating theo stage trong user workspace.
4. Refactor `/supporter` và `/supporter/case/[id]`.
5. Gắn draft report composer (get-draft-report/edit-draft-report usecases) vào `/supporter/case/[id]` — không tạo route `/supporter/case/[id]/review`.
6. Refactor `/admin` thành triage queue.
7. Triển khai `/admin/case/[id]` như detail page riêng cho admin.

## 11. Guardrail cho implement

- Route map này là canonical cho frontend CP1 MVP, không phải ảnh chụp nguyên xi codebase cũ.
- Khi có mâu thuẫn giữa route/component cũ và PRD/flow mới, ưu tiên PRD/flow mới.
- Nếu một component cũ kéo UI về hướng `payment portal` hoặc `chat portal`, hạ ưu tiên hoặc loại khỏi golden flow thay vì cố giữ bằng mọi giá.

