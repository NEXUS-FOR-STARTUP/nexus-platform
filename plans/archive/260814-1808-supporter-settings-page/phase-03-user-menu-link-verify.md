# Phase 03 — UserMenu supporter link + verify

## Mục tiêu

Thêm link "Cài đặt" cho supporter trong `UserMenu` (wallet giữ student-only, admin không đổi) + verify toàn feature.

## Files

```
SỬA  apps/web-1/components/layout/_components/UserMenu.tsx
```

## Chi tiết

### 1. Thêm `isSupporter` + `settingsHref`

- [x] Sau dòng `isStudent` (line 35), thêm:

```tsx
  const isSupporter = user?.role === "supporter";
  const settingsHref = isStudent
    ? "/dashboard/settings"
    : isSupporter
      ? "/supporter/settings"
      : null;
```

### 2. Restructure options — wallet student-only, settings student+supporter

- [x] Thay block options (hiện tại lines 62-70):

```tsx
  const options: UserMenuOption[] = [
    { href: getHomeLink(user.role), label: "Trang chủ", icon: Home },
    ...(isStudent
      ? [{ href: "/dashboard/wallet", label: "Thanh toán", icon: CreditCard }]
      : []),
    ...(settingsHref
      ? [{ href: settingsHref, label: "Cài đặt", icon: Settings }]
      : []),
  ];
```

- [x] Xác nhận file vẫn ≤ 200 dòng (hiện 147 → ~152, OK).

## Verify

- [x] `npm run check-types` — root turbo pass (web-1).
- [x] `npx eslint components/layout/_components/UserMenu.tsx` — 0 warning.
- [x] Manual matrix:

| Role | Trang chủ | Thanh toán | Cài đặt | Wallet block |
|------|-----------|-----------|---------|--------------|
| Student | ✓ | ✓ `/dashboard/wallet` | ✓ `/dashboard/settings` | ✓ |
| Supporter | ✓ | ✗ | ✓ `/supporter/settings` | ✗ |
| Admin | ✓ | ✗ | ✗ | ✗ |

- [x] Supporter click Cài đặt → điều hướng + Popover đóng (`handleNavigate`).
- [x] Regression student: `/dashboard/settings/*` nav + form không đổi.
- [x] Responsive 375px (sidebar ngang) + 768px+ (cột 240px) — cả 2 route group.

## Trạng thái

`Status: completed`
