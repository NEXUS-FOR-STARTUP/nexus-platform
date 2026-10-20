# Bản đồ dùng lại Mantine: settings/profile

Quy tắc chung (xem `../../261019-1500-case-detail-redesign/reports/mantine-reuse-map.md`). Ở đây chỉ nêu khác biệt riêng.

| Mockup | Dùng ở code thật | Giữ nguyên gì |
|---|---|---|
| Ô Tên + lỗi | `TextInput` + `error` từ TanStack Form | Luật `!value.trim()` → "Tên hiển thị không được để trống." |
| Email vô hiệu + "Không thể thay đổi" | `TextInput disabled` + `description` | Hiện tại có `Tooltip` + `Info`; mockup hiển thị chữ cố định: dùng `description` để người dùng mobile thấy |
| Avatar 96px + chữ cái đầu | `Avatar size={96}` | Có sẵn |
| Nút "Đổi ảnh" | Giữ `<input type=file hidden>` + ref, hoặc `FileButton` | **Giữ `validateAvatarFile`** (Mantine `FileButton` chỉ có `accept`, không kiểm 2MB) |
| Ghi chú cỡ/loại ảnh | `Text` với class `--ui-text-note` | Chữ: "Tối đa 2MB (.jpg, .jpeg, .png, .webp)" (code cho phép `.jpeg`, mockup quên) |
| Lỗi ảnh | `Text c="red"`/`Alert` gần nút + toast hiện tại | Chuỗi cũ: "Chỉ hỗ trợ ảnh .jpg, .jpeg, .png hoặc .webp", "Dung lượng ảnh tối đa là 2MB" |
| Lưu chỉ bật khi sửa | `form.Subscribe` selector `isDirty` + `Button disabled` | Loading như hiện tại |
| Vùng nguy hiểm | `Paper` + class riêng (viền biến danger) | `DeleteAccountModal` (Mantine `Modal centered radius="md"`) |
| Modal xóa 2 bước | `DeleteAccountModal` hiện có | Luật `["XOA","XÓA"]` trim+upper; chặn đóng khi loading |
| Công tắc thông báo | `Switch` đã dùng, `color="brand"`, `label` + `description` | Lưu tức thì + rollback khi lỗi |
| Phiên | `Paper` + `Badge` ("Phiên hiện tại") | `SessionsList`, `SessionItem`, `RevokeOthersModal`, `parseUserAgent`, `formatIpAddress` |
| Mật khẩu | `PasswordInput` (3 ô), `Tooltip` | `ChangePasswordForm` hai chế độ |
| Menu bên | `SettingsSidebar` (Link) | Route-based, `aria-current` |
| Alert trong trang | `notifications.show` hoặc `Alert` | |

Lucide: `User`, `KeyRound`, `MonitorSmartphone`, `Bell`, `TriangleAlert`, `Trash2`, `ImagePlus`, `Info`, `Laptop`, `Smartphone`, `Tablet`, `Globe`, `LogOut`, `Loader2`.
