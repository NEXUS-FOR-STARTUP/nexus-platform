# Phase 02 — Trang Thông tin cơ bản

## Mục tiêu

Trang `/dashboard/settings/profile`: thông tin trong các ô + nút "Lưu thay đổi" ở cuối. Email full read-only. Avatar không fake upload.

## Files

```
MỚI  apps/web-1/lib/auth-errors.ts
MỚI  apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts
MỚI  apps/web-1/app/dashboard/settings/profile/page.tsx
MỚI  apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx
```

## Chi tiết

### 1. `lib/auth-errors.ts` — dịch lỗi Better Auth dùng chung

Chuyển nguyên `translateError` từ page cũ (sửa chữ hoa title "Hồ Sơ Của Tôi" → không còn), export function thuần, auth pages khác tái dùng sau:

```ts
export function translateAuthError(message?: string): string {
  if (!message) return "";
  const map: Record<string, string> = {
    "invalid password": "Mật khẩu hiện tại không đúng.",
    "password is too weak": "Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn.",
    "user not found": "Không tìm thấy người dùng.",
    "invalid email or password": "Email hoặc mật khẩu không đúng.",
  };
  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key)) return value;
  }
  return message;
}
```

### 2. `useProfileMutations.ts` — hook layer (try/catch nằm đây, component sạch)

```ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { updateUser, changePassword } from "@/lib/auth-client";
import { notifications } from "@mantine/notifications";
import { translateAuthError } from "@/lib/auth-errors";

// QUAN TRỌNG: Better Auth updateUser/changePassword KHÔNG throw khi lỗi —
// trả { data, error }. mutationFn phải tự check và throw, nếu không onError
// không bao giờ chạy và onSuccess chạy cả khi lỗi (toast xanh sai).
export function useProfileMutations() {
  const updateName = useMutation({
    mutationFn: async (name: string) => {
      const result = await updateUser({ name });
      if (result.error) throw new Error(result.error.message || "update failed");
      return result.data;
    },
    onSuccess: () =>
      notifications.show({ title: "Thành công", message: "Đã cập nhật thông tin hồ sơ.", color: "green" }),
    onError: (err: unknown) =>
      notifications.show({
        title: "Lỗi",
        message: translateAuthError(err instanceof Error ? err.message : "") || "Không thể cập nhật tên hiển thị.",
        color: "red",
      }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      const result = await changePassword({ ...input, revokeOtherSessions: true });
      if (result.error) throw new Error(result.error.message || "change password failed");
      return result.data;
    },
    onSuccess: () =>
      notifications.show({
        title: "Thành công",
        message: "Đã đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất.",
        color: "green",
      }),
    onError: (err: unknown) =>
      notifications.show({
        title: "Lỗi",
        message: translateAuthError(err instanceof Error ? err.message : "") || "Không thể đổi mật khẩu. Kiểm tra lại mật khẩu hiện tại.",
        color: "red",
      }),
  });

  return { updateName, changePassword: changePasswordMutation };
}
```

Kiểm tra sau implement: `updateUser` success có refresh session name ngay không. Nếu không → trong `onSuccess` gọi `authClient.useSession` refetch (đọc Better Auth docs, không đoán — xem `docs/tech-doc-urls.txt`).

### 3. `ProfileInfoForm.tsx` — TanStack Form v1

- `useForm({ defaultValues: { name }, onSubmit: ({ value }) => updateName.mutateAsync(value.name.trim()) })`.
- `defaultValues` đồng bộ từ session bằng `useEffect` + `form.reset(...)` (pattern giống `useIntakeForm`).
- Field "Tên hiển thị": `<form.Field name="name" validators={{ onChange: value => !value.trim() ? "Tên hiển thị không được để trống." : undefined }}>` → `TextInput` với `field.state.value`, `field.handleChange`, error inline.
- Field "Email đăng nhập": KHÔNG phải input disabled — hiển thị row: label + giá trị full + ghi chú "Email dùng để đăng nhập, không thể thay đổi." (dùng `Text` + `text-text-muted`).
- Avatar block: `Avatar size={96} radius="100%"` (src = `session.user.image`, fallback initial — **không shadow class**) + Button "Đổi ảnh" → `notifications.show({ title: "Đang phát triển", message: "Chức năng này đang được phát triển.", color: "blue" })`. Không input file, không preview.
- Layout: `Paper p="xl" radius="md" className="bg-surface-app border border-border-app"` (giống pattern payments) — các ô trong `Stack gap="md"`, width tối đa `max-w-md` để form dễ đọc.
- Submit: `<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>` — Enter submit được. Nút "Lưu thay đổi" `color="brand" loading={updateName.isPending}` ở **cuối form**.
- Type render props: `(field: FieldApi<..., "name">)` — KHÔNG `any`. Import `import type { FieldApi } from "@tanstack/react-form"`.

### 4. `page.tsx`

Client component mỏng: `useSession()` → guard `isPending` (spinner như page cũ) → render `<ProfileInfoForm />`. Nếu `!session.user` sau isPending → thông báo lỗi nhẹ ("Không thể tải thông tin tài khoản"), KHÔNG `return null` (chống màn hình trắng).

## Verify phase

- Save tên → toast xanh, tên đổi ở navbar/avatar menu (test session refresh).
- Enter trong ô tên → submit.
- Email: full, không sửa được, có ghi chú.
- "Đổi ảnh" → notification xanh dương "đang phát triển", không mở file picker.
- Không `as any` trong file mới; ≤200 dòng/file.

## Trạng thái

`Status: done` — 4 file mới: `lib/auth-errors.ts`, `hooks/useProfileMutations.ts`, `profile/page.tsx`, `_components/ProfileInfoForm.tsx`. **Thực thi gộp với phase 03 trong 1 agent** (cùng `useProfileMutations`/`translateAuthError`).

Lệch thực tế so với snippet:

- (a) Validator nhận `{ value }` không phải `value` trực tiếp: `onChange: ({ value }) => ...`.
- (b) Dùng `mutate` + per-call `onSuccess` thay `mutateAsync` (tránh re-throw từ `handleSubmit`).
- (c) `FieldApi<TParentData, TName>` 2-generic KHÔNG hợp lệ với TanStack Form v1.33 (cần 23 type args) → **bỏ annotation render-props**, để TS infer (không `any`).
- Email fallback `"—"` + `break-all`; `auth-errors` có fallback tiếng Việt + map thêm `rate limit` (fix sau review).

Verify: `check-types` PASS, lint targeted sạch. QA thủ công còn lại: login → redirect chain; đổi tên → navbar refetch.
