# Phase 05 — Cleanup + verify

## Mục tiêu

Dọn route cũ, chạy verify toàn cục, cập nhật docs.

## Steps

### 1. Route cũ `/dashboard/profile` → redirect

`apps/web-1/app/dashboard/profile/page.tsx` (408 dòng) → thay toàn bộ nội dung bằng:

```tsx
import { redirect } from "next/navigation";

export default function LegacyProfilePage() {
  redirect("/dashboard/settings/profile");
}
```

### 2. Rà soát anti-patterns

> ✅ Đã chạy xong — tất cả PASS (13 file mới targeted eslint = 0 vấn đề).

- [x] Không còn `Record<string, any>` / `as any` trong các file mới (grep `settings/`, `UserMenu`).
- [x] Không try/catch trong component (mutation hook xử lý).
- [x] Không `shadow-*` trên Mantine components mới.
- [x] Mọi file mới ≤ 200 dòng: `wc -l` từng file (UserMenu 187; DashboardShell 60).
- [x] Không còn `URL.createObjectURL` (đã bỏ file picker).
- [x] Vietnamese-first: mọi label/toast tiếng Việt, đúng chính tả ("Hồ sơ", "Cài đặt" — không Title Case).

### 3. Verify

```bash
npm run check-types
npm run lint
```

- [x] `check-types` — **PASS (3/3 workspace)**. (Turbo chạy cả 2 workspace; `prisma:generate` OK với `.env` có `DATABASE_URL` hợp lệ.)
- [x] Lint **targeted** (13 file mới) — **PASS, 0 vấn đề**.
- [ ] Lint **repo-wide** — **FAIL 206 lỗi pre-existing, KHÔNG thuộc scope** → **QUYẾT ĐỊNH NGƯỜI DÙNG: defer task riêng** (không chặn plan này). Không warning mới từ file của plan.

Manual checklist (đọc acceptance criteria `docs/requirements/settings-sidebar-and-profile.md` mục 9):

- [x] Avatar → modal sạch, đủ info + options, không dropdown cũ. (Tester PASS)
- [x] "Cài đặt" → sidebar Facebook, active state đúng 2 mục (+ `aria-current="page"`).
- [x] Sidebar KHÔNG có Ví/Thanh toán.
- [x] Profile: ô sửa được, email read-only full (+ fallback "—", `break-all`), Save ở cuối, Enter submit.
- [x] "Đổi ảnh" → notification đang phát triển.
- [x] Đổi pass: inline validation (`onChangeListenTo` re-validate), success reset, session khác logout.
- [x] `/dashboard/profile` redirect, không 404. (redirect stub đã build + check-types)
- [x] 375px/768px/1440px + dark mode. (Review 8.4/10 + tester PASS)

> QA thủ công CÒN LẠI (dev manual chưa chạy, không phải tester): login → redirect chain; đổi tên → navbar refetch; đổi pass 2 tab logout thật; modal 3 role. Xem plan.md Implementation Notes.

### 4. Docs cập nhật (sau khi verify pass)

> ⏳ **PENDING — docs-manager làm sau** (chưa cập nhật trong scope này).

- [ ] `docs/requirements/settings-sidebar-and-profile.md`: đổi trạng thái → `implemented`, ghi ngày.
- [ ] `docs/codebase-summary.md` (nếu liệt kê routes): cập nhật `/dashboard/profile` → `/dashboard/settings/*`.
- [ ] `apps/web-1/AGENTS.md` (nếu liệt kê hooks count): +`useProfileMutations` (15 → 16 hooks).

## Done criteria

- [x] Toàn bộ checklist trên pass (trừ lint repo-wide 206 pre-existing — deferred theo quyết định người dùng; docs — pending docs-manager).
- [x] `git status` chỉ chứa files map trong plan.md (không file lạ).
- [x] Đề xuất commit message (theo chuẩn repo, xem `git log --oneline -10` trước khi commit).
