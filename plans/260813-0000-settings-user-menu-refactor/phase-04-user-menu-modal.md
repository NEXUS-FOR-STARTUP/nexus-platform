# Phase 04 — UserMenu modal + DashboardShell refactor

## Mục tiêu

Nhấn avatar → Mantine `Modal` sạch (thay `Menu.Dropdown` 8 mục). `DashboardShell` thu về tối giản.

## Files

```
MỚI  apps/web-1/components/layout/_components/UserMenu.tsx
SỬA  apps/web-1/components/layout/DashboardShell.tsx
```

## Chi tiết

### 1. `UserMenu.tsx` — avatar trigger + modal

Nguồn tham khảo pattern Modal: `app/admin/_components/BanUserModal.tsx` (`opened`/`onClose`/`size`/`radius`/`centered`). KHÔNG thêm Tailwind positioning vào Modal (Mantine rule).

State: `const [opened, setOpened] = useState(false)`.

**Trigger**: nút avatar `Avatar` bọc trong button (accessibility: `aria-label="Tài khoản"`), `cursor-pointer`, hover ring như hiện tại (`ring-2 ring-transparent hover:ring-brand` — đây là ring không phải shadow, giữ OK).

**Modal** (`size="sm"`, `radius="md"`, `centered`, `withCloseButton={false}` — nội dung ngắn, đóng bằng backdrop/Esc):

```
┌────────────────────────────┐
│ (Avatar 56)                │
│ Tên (semibold)             │
│ email full (text-muted)    │
│ [role badge]               │
│ Số dư ví: X VND  ← student │
├────────────────────────────┤
│ 👤 Hồ sơ            →      │
│ 💳 Thanh toán       →      │  (student only)
│ ⚙ Cài đặt          →      │
├────────────────────────────┤
│ Đăng xuất (đỏ)             │
└────────────────────────────┘
```

- **Info block**: `flex flex-col items-center gap-1.5 pb-4 border-b border-border-app` — Avatar `size={56}`, tên `font-heading font-semibold text-sm`, email full `text-xs text-text-muted break-all`, `getRoleBadge` (chuyển từ DashboardShell sang file này hoặc util riêng), dòng số dư (student + có walletData): `text-xs text-text-muted` + số `font-semibold tabular-nums`.
- **Options** (mỗi option = button full-width, icon `w-4 h-4` bên trái, `text-sm`, `rounded-md px-3 py-2.5 text-left hover:bg-surface-soft transition-colors cursor-pointer`):
  - Student: Hồ sơ (`User` icon) → `/dashboard/settings/profile`; Thanh toán (`CreditCard`) → `/dashboard/wallet`; Cài đặt (`Settings`) → `/dashboard/settings`.
  - Admin: Bàn làm việc Admin (`Shield`) → `/admin`.
  - Supporter: Bàn làm việc Supporter (`LayoutDashboard`) → `/supporter`.
  - Mỗi click: `router.push(href); setOpened(false);`.
- **Đăng xuất**: divider + button đỏ (`text-danger hover:bg-danger/5`, `LogOut` icon) → `handleSignOut` (giữ logic cũ: clear query, replace `/auth`).

**Props & ownership (đã chốt — tránh trùng logic):**

- `UserMenu` **tự gọi** `useSession`, `useWalletBalance`, `signOut` (component self-contained, không nhận props).
- `handleSignOut` **chuyển hẳn** vào `UserMenu` (queryClient.clear + router.replace("/auth") + router.refresh) — DashboardShell xóa hẳn, chỉ còn hiệu ứng disconnect Centrifugo.
- `useWalletBalance` **giữ nguyên trong `useWallet.ts`** — `WalletBalanceCard` (wallet page) cũng dùng; UserMenu chỉ thêm một call. Hook không di chuyển.

### 2. `DashboardShell.tsx` — thu gọn

- Xóa: `Menu`, `Badge`, `getRoleBadge`, `getHomeLink` (nếu UserMenu không cần — logo Link vẫn cần getHomeLink, giữ), các `Menu.Item` nav, block wallet trong dropdown, `handleSignOut` (chuyển vào UserMenu).
- Import thay: `UserMenu` từ `./_components/UserMenu`.
- Navbar giữ nguyên: Logo, NotificationBell, ThemeToggler, `{!isPending && user && <UserMenu />}`.
- Giữ: disconnect Centrifugo effect.
- Target: file ≤ 200 dòng (hiện 200 — xóa dropdown ~80 dòng là về ~120).

## Verify phase

- Avatar click → modal; Esc + backdrop đóng.
- Student: đủ 3 options + số dư; click mỗi option → đúng route + modal đóng.
- Admin/supporter: chỉ workspace link + Đăng xuất, KHÔNG thấy Hồ sơ/Thanh toán/Cài đặt.
- Đăng xuất hoạt động như cũ.
- 375px: modal không tràn, nội dung vừa.
- `npm run check-types` + `npm run lint`.

## Trạng thái

`Status: done` — `UserMenu.tsx` mới = **187 → 193 dòng** (self-contained: tự gọi `useSession`, `useWalletBalance`, `signOut`; `handleSignOut` chuyển hẳn vào — đúng như chốt ownership). `DashboardShell.tsx` 200 → **60 dòng** (bỏ dropdown, mount `UserMenu`, giữ disconnect Centrifugo).

Lệch thực tế so với snippet: không lệch cấu trúc; thêm fix sau review — focus-visible ring (avatar trigger + option buttons + signout button), `aria-current` không áp dụng (chỉ sidebar). Nội dung đúng spec: student 3 options + số dư; admin/supporter chỉ workspace link + Đăng xuất.

**Đổi sau QA người dùng (2026-08-13):** `Modal centered` → Mantine `Popover` `position="bottom-end"` (`offset={8}`, `width={280}`, `radius="md"`, `shadow="md"`, `trapFocus`, `closeOnEscape`, `closeOnClickOutside`) — menu gọn neo ngay dưới avatar, không mở giữa màn hình desktop.

**Cắt info block (2026-08-13, feedback "menu còn thừa"):** bỏ avatar lớn 56, tên, role badge (block centered to); **giữ email xem nhanh** (mọi role, `truncate` 1 dòng — phân biệt tài khoản) + **dòng số dư ví** (student, số đỏ `text-danger` `font-semibold` ngay sau label — đọc lướt thấy). 1 khối `border-b` ngăn cách với options. `getRoleBadge` + import `Badge` xóa. 193 → **154 dòng**. check-types PASS, eslint targeted sạch.

Verify: `check-types` PASS, lint targeted sạch. QA thủ công còn lại: popover với 3 role (student/admin/supporter), 375px không tràn.
