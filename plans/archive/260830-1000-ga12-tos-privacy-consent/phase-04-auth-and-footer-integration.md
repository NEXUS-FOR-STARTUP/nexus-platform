# Phase 4: Tích hợp AuthPanel, Footer & Ghi nhận Thỏa thuận Điều khoản

## 1. Mục tiêu
Kết nối hoàn chỉnh 2 trang chính sách vào toàn bộ luồng người dùng của Nexus:
1. Cập nhật Footer toàn cục trong `AppShell.tsx`.
2. Cập nhật form đăng ký trong `AuthPanel.tsx` để checkbox hiển thị liên kết mở tab mới.
3. Ghi nhận `terms_and_privacy_version: "2026-08-v1"` và `terms_and_privacy_accepted_at: now()` vào cơ sở dữ liệu khi tài khoản được tạo thành công.

---

## 2. Chi tiết Triển khai Kỹ thuật

### 2.1. Cập nhật Footer (`apps/web-1/components/layout/AppShell.tsx`)
Thay thế mảng `footerLinks` từ link rỗng `#` sang đường dẫn thực tế:
```tsx
const footerLinks = [
  { href: "/privacy", label: "Chính sách bảo mật" },
  { href: "/terms", label: "Điều khoản sử dụng" },
];
```

### 2.2. Cập nhật Form Đăng ký (`apps/web-1/app/auth/_components/AuthPanel.tsx`)
Tại ô Checkbox chấp thuận điều khoản (dòng ~420):
```tsx
<Checkbox
  label={
    <Text size="xs" className="font-body text-text-muted select-none">
      Tôi đồng ý với{" "}
      <Anchor
        component={Link}
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand font-medium hover:underline inline"
        onClick={(e) => e.stopPropagation()}
      >
        Điều khoản dịch vụ
      </Anchor>{" "}
      và{" "}
      <Anchor
        component={Link}
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand font-medium hover:underline inline"
        onClick={(e) => e.stopPropagation()}
      >
        Chính sách bảo mật
      </Anchor>
    </Text>
  }
  checked={field.state.value}
  onChange={(e) => field.handleChange(e.target.checked)}
  radius="sm"
  color="brand"
/>
```

### 2.3. Cập nhật Backend Ghi nhận Agreement (`apps/api/src/auth.ts`)
Tận dụng cơ chế `databaseHooks.user.create.after` của Better Auth (nơi đang tự động tạo ví cho user mới ở GA-22):
```typescript
// Trong auth.ts:
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        // 1. Tự động ghi nhận terms & privacy version ban đầu (GA-12)
        await db.user.update({
          where: { id: user.id },
          data: {
            terms_and_privacy_version: "2026-08-v1",
            terms_and_privacy_accepted_at: new Date(),
          },
        }).catch((err) => {
          logger.error({ err, userId: user.id }, "Failed to record user terms and privacy agreement");
        });

        // 2. Tự động tạo ví ban đầu (GA-22)
        // ... code hiện có ...
      }
    }
  }
}
```

---

## 3. Tiêu chí Hoàn thành (Definition of Done)
- [ ] Bấm link ở Footer mở đúng `/privacy` và `/terms`.
- [ ] Bấm link "Điều khoản dịch vụ" hoặc "Chính sách bảo mật" tại form đăng ký mở tab mới độc lập, không làm mất dữ liệu người dùng đang điền.
- [ ] Đăng ký tài khoản thử nghiệm thành công và xác minh trong database: bản ghi `users` có `terms_and_privacy_version = '2026-08-v1'` và `terms_and_privacy_accepted_at` khớp với thời điểm đăng ký.
