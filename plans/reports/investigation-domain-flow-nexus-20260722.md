# Điều tra: Domain & Flow Nexus Platform

22/07/2026. Mục đích: trace toàn bộ user flow, phát hiện điểm đứt gãy giữa model cũ (gói cố định) và model mới (pay-per-round).

---

## 1. Hiện trạng

### 1.1. Chuyển đổi business model

| | Cũ | Mới |
|---|-----|-----|
| Package | 4 gói Gói 0-3 (0-399k), deactivated | `pkg_tf_free` (0đ) + `pkg_tf_audit` (39k/lượt) |
| Cách trả | Trả 1 lần lúc chọn gói, revision miễn phí không giới hạn | Mỗi lượt supporter audit = 1 payment 39k |
| Tạo case | Qua intake form 9 bước, tạo checkpoint | Qua team-fit Mad Libs 3 bước, case lightweight (không checkpoint) |
| Mua thêm | Không có khái niệm | `buy-round` endpoint, mỗi round = `audit_rounds` record + payment riêng |

### 1.2. Ba wave đã deploy

Tất cả trên branch `feat/wave-system`. Xây theo kiểu additive: thêm code mới, không sửa code cũ.

| Wave | Commit | Thêm gì |
|------|--------|---------|
| Wave 1 | `9e372e6` | `team_fit_reports` table, AI prompt free (chỉ ra gaps), save/upgrade-package endpoint, team-fit page 3-step, upgrade banner trên case detail, dashboard CTA "Mua ngay 39k" |
| Wave 2b | `e1a54b3` | `audit_rounds` table, `buy-round` endpoint, payment-verify hook, block revision/recall cho `pkg_tf_audit`, BuyRoundModal, AuditRoundTimeline |
| Wave 4 | `c0aaedc` | GET /api/admin/stats, StatsDashboard, SLA timer wire-up (admin-side, không đụng flow user) |

### 1.3. Các route frontend hiện tại

| Route | Nguồn gốc |
|-------|-----------|
| `/` | Landing (gốc) |
| `/auth` | Login/register (gốc) |
| `/dashboard` | Dashboard student (gốc + Wave 1) |
| `/dashboard/intake` | Intake form 9 bước (gốc) |
| `/dashboard/team-fit` | Team-fit Mad Libs 3 bước (Wave 1) |
| `/dashboard/case/[id]` | Case workspace (gốc + Wave 1 + Wave 2b) |
| `/dashboard/case/[id]/payment` | Payment (gốc) |

---

## 2. Sáu điểm đứt gãy

### F1. AuthPanel redirect mọi package về intake — Critical

File: `apps/web-1/app/auth/_components/AuthPanel.tsx:71,115,159`

Ba hàm (`handleQuickLogin`, `handleGoogleSignIn`, `form.onSubmit`) cùng dùng logic:
```typescript
const callbackUrl = packageId
  ? `/dashboard/intake?packageId=${packageId}`
  : "/dashboard";
```

PackageId `pkg_tf_free` và `pkg_tf_audit` đều bị đẩy vào intake 9 bước. Phải redirect về `/dashboard/team-fit`.

### F2. `?intent=paid` bị ignore — High

File: `apps/web-1/app/dashboard/team-fit/page.tsx`

Dashboard link: `/dashboard/team-fit?intent=paid`. Nhưng `page.tsx` không import `useSearchParams`, không có logic đọc `intent`. `handleSave` hardcode `packageId: "pkg_tf_free"`, `handleBuy` hardcode `packageId: "pkg_tf_audit"`.

Plan Wave 1 Todo 15 yêu cầu: nếu `intent=paid` thì auto-save với `pkg_tf_audit` và redirect thẳng payment. Chưa implement.

### F3. Empty state chỉ có intake — High

File: `apps/web-1/app/dashboard/_components/DashboardEmptyState.tsx:17`

User mới chưa có case chỉ thấy 1 nút "Tạo hồ sơ mới" dẫn đến `/dashboard/intake`. Không có option vào team-fit. Ba CTA chỉ xuất hiện khi đã có ít nhất 1 case.

### F4. Intake form vẫn nhận team-fit packages — High

File: `apps/web-1/app/dashboard/intake/_components/IntakeChatFlow.tsx:199-235`

Step PACKAGE trong intake form fetch packages từ API và hiển thị tất cả, gồm `pkg_tf_free` + `pkg_tf_audit`. Chọn `pkg_tf_free` trong intake tạo case đầy đủ (có checkpoint). Team-fit page tạo case lightweight (không checkpoint). Cùng 1 package, 2 loại case khác nhau.

### F5. Dashboard 3 CTA song song — Medium

File: `apps/web-1/app/dashboard/page.tsx:29-77`

"Đánh giá đội ngũ" (team-fit), "Tạo hồ sơ mới" (intake cũ), "Mua ngay 39k" (paid audit) nằm cạnh nhau. Intake cũ là primary CTA (màu brand). Không rõ user nên chọn gì.

### F6. Revision miễn phí và Buy-round cùng tồn tại — Medium

File: `apps/web-1/app/dashboard/case/[id]/page.tsx:57-60,125-146,170-182`, `StatusGuidanceCard.tsx:101-136`

Case detail có 3 cơ chế song song tùy package:
- `pkg_tf_free` + not_required: "Nâng cấp ngay" (upgrade-package)
- `pkg_tf_audit` + report_ready: "Mua thêm lượt 39k" (buy-round)
- Còn lại + report_ready: "Nộp bản sửa đổi" (revision miễn phí, giữ cho backward compat với Gói 0-3)

---

## 3. Nguyên nhân

**Additive-only.** Ba wave chỉ thêm code, không sửa/xóa code cũ. Wave 1 không đụng AuthPanel, empty state, intake form. Wave 2b không xóa RevisionSubmitModal.

**Thiếu spec tổng thể.** Mỗi wave có plan riêng nhưng không có tài liệu mô tả toàn bộ user journey. Component build đúng plan nhưng không khớp khi ghép.

**Todo 15 chưa implement.** Plan Wave 1 yêu cầu team-fit page đọc `searchParams.intent`, nhưng code không có.

---

## 4. Cần quyết định

1. Intake form cũ giữ hay bỏ? Thay hoàn toàn bằng team-fit?
2. Landing page link đến team-fit hay giữ qua auth có redirect?
3. Có implement `?intent=paid` không, hay bỏ query param?
4. Dashboard merge 3 CTA thành mấy? Flow thống nhất hay tách biệt?
5. Empty state ưu tiên team-fit hay intake?

