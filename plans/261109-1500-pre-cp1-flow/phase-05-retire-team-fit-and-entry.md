# Phase 05 — Bỏ team-fit, đổi điểm vào, docs, QA

## Context Links
- Trang bị bỏ: `apps/web-1/app/dashboard/team-fit/` (page, hooks, components, lib)
- Link trỏ vào: `apps/web-1/components/landing/LandingHero.tsx:43`, `components/landing/LandingStickyCta.tsx:24`, `app/auth/get-auth-redirect.ts:11`, `app/dashboard/_components/DashboardEmptyState.tsx:29`, `app/dashboard/page.tsx:64`
- API bị bỏ phần lưu: `apps/api/src/modules/ai-engine/http/ai-engine.routes.ts` (route `/team-fit/save`), `application/save-team-fit.usecase.ts`
- Docs: `.agents/rules/documentation-management.md`, `docs/flows/team-fit-flow.md`, `docs/system-architecture.md`, `CHANGELOG.md`

## Overview
- **Ưu tiên:** P1 (sau Phase 04)
- **Trạng thái:** pending
- Xoá sản phẩm thứ hai, để mọi người vào một luồng; không để link/endpoint chết.

## Key Insights
- Landing **đã có** nút vào (nút "free" trỏ `team-fit?step=1`). Gộp xong thì không dựng thêm nút — chỉ đổi đích sang `/dashboard/start`. Người chưa đăng nhập vẫn đi qua `proxy.ts` như hiện nay.
- `get-auth-redirect.ts` đang đưa người mới (gói FREE) vào team-fit → đổi sang `/dashboard/start`.
- 2 nút trùng trong `DashboardEmptyState` + `dashboard/page.tsx` cùng trỏ team-fit → giữ **một** card "Bắt đầu từ đây", xoá nút còn lại.
- `POST /ai-engine/team-fit` (chấm) **giữ**; `POST /ai-engine/team-fit/save` (tạo case) **bỏ** — việc tạo case giờ do `CreateProjectModal` + `POST /pre-cp1/save`.
- Phần AI đã lưu vẫn hiện trong workspace case qua `OverviewGapsSection` và `OverviewProfileDetails` (đọc `team_fit_reports`) — không cần sửa; đó là lý do Phase 03 ghi báo cáo AI **vào cùng case**.
- Đổi chữ nút ở landing: "Kiểm tra nhanh ý tưởng" → "Bắt đầu (miễn phí)" cho khớp đích mới; giữ nguyên vị trí/kích thước hai nút để không phải chỉnh layout.

## Requirements
- **Chức năng:** không còn trang team-fit; link cũ chuyển hướng; không còn endpoint chết; upsell vẫn hiện (ở trang kết quả).
- **Phi chức năng:** `grep -r "team-fit"` chỉ còn 3 loại: redirect, doc ghi "đã thay thế", và tên bảng `team_fit_reports`.

## Architecture
- `app/dashboard/team-fit/page.tsx` → thay bằng server component `redirect("/dashboard/start")` (**không** `?idea=yes`: nút landing không xác nhận người dùng đã có ý tưởng, điền sẵn sẽ bỏ qua chính câu rẽ nhánh). Route giữ để link ngoài (Zalo, slide, email) không 404.
- 6 file dùng lại **đã được Phase 04 `git mv`** sang `start/` (bước 0 của phase đó) — Phase 05 **không chuyển lại**, chỉ kiểm rồi xoá phần còn lại:
  - `IdeaMadLibsStep` → `idea/MadLibsForm.tsx`, kèm `InlineBlank` → `idea/InlineBlank.tsx`.
  - `lib/validation.ts` → `idea/madlibs-validation.ts` (`INITIAL_BLANKS`, `validateBlank`, `validateAllBlanks`, `formatIssue` + câu lỗi tiếng Việt).
  - `TeamFitReportCard` → `result/AiResultCard.tsx` (`areas`, `industryRoles`, `trackCoverage` — khối kết quả cần).
  - `TeamFitUpsellCard` → `result/UpsellCard.tsx`.
  - Phần chấm của `hooks/useTeamFitMutation.ts` → `_hooks/useTeamFitEvaluation.ts`; **bỏ** `useTeamFitSaveMutation` (endpoint save bị xoá ở bước 4). `TeamMemberInput` lấy từ `packages/validation` (Phase 07), không từ hook cũ.

## Related Code Files
**Tạo:** `docs/flows/pre-cp1-flow.md`
**Sửa:** 5 file link ở Context Links, `app/dashboard/team-fit/page.tsx` (thành redirect), `apps/api/src/modules/ai-engine/http/ai-engine.routes.ts` (bỏ route save), `docs/flows/team-fit-flow.md` (ghi đã thay thế), `docs/system-architecture.md`, `CHANGELOG.md`, `plans/261109-1500-pre-cp1-flow/plan.md` (status)
**Xoá:** phần còn lại của `app/dashboard/team-fit/` — 6 file ở Architecture đã được Phase 04 `git mv` đi, nên chỉ còn `_components/{StepIndicator,TeamInputStep,TeamMemberCard,TeamFitResultStep,ErrorBanner,NavigationButtons}.tsx`, `_data/demo-preset.ts`, `lib/storage.ts`, `page.tsx` cũ; `apps/api/.../application/save-team-fit.usecase.ts`, test của nó, repository fn `createCaseAndReport` **nếu** grep xác nhận không còn ai dùng

## Implementation Steps
1. `grep -rn "team-fit"` toàn repo (bỏ `.next`), lập danh sách trước khi xoá; mỗi dòng phải hoặc đổi đích, hoặc là redirect/doc/bảng.
2. Đổi 5 link: landing hero + sticky → `/dashboard/start`; `get-auth-redirect` FREE → `/dashboard/start`; `DashboardEmptyState` giữ card mới; `dashboard/page.tsx:64` xoá nút trùng (nếu đã có card).
3. Kiểm rồi xoá: `grep -rn "dashboard/team-fit" apps/web-1/app/dashboard/start` phải **rỗng** (6 file đã được Phase 04 `git mv` đi); sau đó xoá phần còn lại của thư mục `team-fit/` và thay `page.tsx` bằng redirect.
4. API: bỏ route `POST /ai-engine/team-fit/save`; xoá `save-team-fit.usecase.ts` + test; grep `createCaseAndReport` — chỉ xoá nếu không còn caller (việc tạo case đã đi qua `POST /cases`).
5. Flag: 2 env (`NEXT_PUBLIC_PRE_CP1_ENABLED`, `PRE_CP1_ENABLED`); tắt → ẩn card, `/dashboard/start` redirect `/dashboard`, 2 endpoint module trả 404. Ghi mục "Tắt khẩn cấp" trong docs.
6. Docs:
   - `docs/flows/pre-cp1-flow.md`: luồng gộp, 2 câu hỏi rẽ nhánh, 4 nhánh kết quả, 2 endpoint, bảng `pre_cp1_reports` (`case_id` bắt buộc) + `team_fit_reports` cùng case, Phase 07 vì sao không hỏi mảng nghề, cách tắt, cách đọc log.
   - `docs/flows/team-fit-flow.md`: dòng đầu "Đã gộp vào `pre-cp1-flow.md`; route chỉ còn redirect".
   - `docs/system-architecture.md`, `CHANGELOG.md`: 1 entry mỗi file.
7. QA (thủ công):
   - 4 nhánh: nhóm/Mad Libs · nhóm/nháp · 1 mình/Mad Libs · 1 mình/nháp.
   - Link cũ: `/dashboard/team-fit`, `/dashboard/team-fit?step=1`, landing "free", đăng ký mới (FREE) → đều vào đúng chỗ.
   - Tạo dự án → 1 case, 1 `pre_cp1_reports`, +1 `team_fit_reports` khi có Mad Libs; mở dự án thấy phần AI trong overview.
   - AI hỏng (chặn mạng) · nhóm > 6 người (không gọi AI) · mobile 390px · tắt flag.
8. Đo: số lượt gọi AI + `aiOk:false` (log Phase 02), số kết quả sơ bộ + phân bố 5 cờ (log Phase 03), số dự án. **Không** đo được lượt bỏ giữa các bước (không có endpoint step) — không giả vờ có.

## Todo List
- [ ] danh sách link team-fit + đổi 5 chỗ
- [ ] grep `start/` không import `team-fit/`, xoá phần còn lại của thư mục, redirect
- [ ] redirect `/dashboard/team-fit`
- [ ] bỏ route + usecase `team-fit/save` (grep trước khi xoá)
- [ ] 2 flag + docs
- [ ] docs 3 file + changelog
- [ ] QA 4 nhánh + 5 link cũ + mobile + tắt flag

## Success Criteria
Không còn trang team-fit; 5 đường vào đều tới luồng mới; `grep team-fit` chỉ còn redirect/doc/tên bảng; tạo dự án ghi đủ 1-2 bảng cùng case; tắt flag là sạch; `npx tsc --noEmit` sạch ở 3 workspace.

## Risk Assessment
- **Sót link** → 404 cho người dùng thật; bước 1 bắt buộc chạy lại trước khi xoá.
- **Xoá nhầm hàm tạo case** → kiểm `createCaseAndReport` bằng grep trước khi xoá; nếu còn caller thì giữ.
- **Upsell rơi mất** → kiểm trên trang kết quả của nhánh Mad Libs.
- **User cũ có báo cáo team-fit** → dữ liệu vẫn hiện trong workspace (không phụ thuộc trang).

## Security Considerations
Endpoint bị bỏ không còn đường ghi case thứ hai; `POST /pre-cp1/save` kiểm quyền case; không log nội dung.

## Next Steps
Sau ≥30 lượt: chỉnh ngưỡng luật; nếu cần tỉ lệ hoàn thành thì làm endpoint step (quyết định riêng).
