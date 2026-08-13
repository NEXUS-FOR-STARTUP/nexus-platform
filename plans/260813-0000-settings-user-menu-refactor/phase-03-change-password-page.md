# Phase 03 — Trang Đổi mật khẩu

## Mục tiêu

Trang `/dashboard/settings/password`: 3 field TanStack Form, inline validation, helper text, `revokeOtherSessions: true`.

## Files

```
MỚI  apps/web-1/app/dashboard/settings/password/page.tsx
MỚI  apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx
```

Tái dùng: `useProfileMutations` (phase 02), `translateAuthError` (phase 02).

## Chi tiết

### 1. `ChangePasswordForm.tsx` — TanStack Form v1

Default values: `{ currentPassword: "", newPassword: "", confirmPassword: "" }`.

Validators (pattern `validators={{ onChange }}` như `SupportNeedsStep`):

| Field | Validator |
|---|---|
| `currentPassword` | rỗng → "Vui lòng nhập mật khẩu hiện tại." |
| `newPassword` | rỗng → "Vui lòng nhập mật khẩu mới."; `< 8` → "Mật khẩu mới phải ít nhất 8 ký tự." |
| `confirmPassword` | `!== form.getFieldValue("newPassword")` → "Xác nhận mật khẩu không khớp." |

UI:

- `Paper p="xl" radius="md" className="bg-surface-app border border-border-app"` + `Stack gap="md"` + `max-w-md`.
- 3 × `PasswordInput` (label, placeholder, error inline từ `field.state.meta.errors`, `size="md"`).
- Helper text dưới "Mật khẩu mới": `Text size="xs" className="text-text-muted"` — "Tối thiểu 8 ký tự. Không nên trùng mật khẩu đã dùng ở nơi khác."
- Submit: nút "Xác nhận đổi mật khẩu" `color="brand" loading={changePassword.isPending}` ở cuối; `<form onSubmit={...}>` để Enter submit.
- Success: `form.reset()` (xóa 3 field) — toast đã nằm trong hook mutation.
- Lưu ý UX: sau success KHÔNG chuyển trang (giữ nguyên, field rỗng là đủ).

### 2. `page.tsx`

Client component mỏng: guard `useSession` (giống phase 02 page) → `<ChangePasswordForm />`.

## Verify phase

- Validation inline từng field; gõ nhầm confirm → lỗi ngay khi confirm field touched.
- Submit thành công → toast + 3 field rỗng.
- Sai mật khẩu hiện tại → toast đỏ "Mật khẩu hiện tại không đúng." (qua `translateAuthError`).
- Test 2 tab: tab kia bị logout (revokeOtherSessions).
- ≤200 dòng/file, không `any`.

## Trạng thái

`Status: done` — 2 file mới: `password/page.tsx`, `_components/ChangePasswordForm.tsx`. **Thực thi gộp với phase 02 trong 1 agent** (tái dùng `useProfileMutations`, `translateAuthError` từ phase 02).

Lệch thực tế so với snippet:

- (d) Thêm `onChangeListenTo: ["newPassword"]` vào confirm field → lỗi "không khớp" tự re-validate khi user sửa lại `newPassword`.
- Cùng 3 chệch chung của phase 02: validator `{ value }`, `mutate` + per-call onSuccess, bỏ `FieldApi` 2-generic annotation (xem phase-02 Trạng thái).

Verify: `check-types` PASS, lint targeted sạch. QA thủ công còn lại: đổi pass với 2 tab → tab kia logout.
