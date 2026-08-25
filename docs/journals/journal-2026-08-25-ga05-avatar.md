# Journal: GA-05 Đổi ảnh đại diện

**Ngày:** 2026-08-25

**Plan:** `plans/archive/260825-1050-ga-05-avatar-upload/`

**Tracker:** GA-05 = Done

## Thiếu gì

Vào Cài đặt → Thông tin cơ bản, bấm **Đổi ảnh** thì chỉ hiện “đang phát triển”. Người dùng không đổi được ảnh hồ sơ.

## Đã làm

Cùng trang hồ sơ cũ. Không tạo hồ sơ mới, không bảng mới, không trang mới.

Bấm **Đổi ảnh**, chọn file trên máy. Hệ thống nhận ảnh, lưu lên Cloudinary, gắn vào hồ sơ. Ảnh mới hiện ở trang hồ sơ và menu tài khoản.

- Chỉ nhận `.jpg`, `.jpeg`, `.png`, `.webp`
- Tối đa 2MB. File khác kiểu hoặc quá nặng thì từ chối, hồ sơ không đổi
- Đổi ảnh mới thì xóa ảnh cũ trên Cloudinary
- Không lưu file ảnh trong database — chỉ lưu đường dẫn
- Không cho trình duyệt tự gửi một URL tùy ý

Đổi tên và đổi mật khẩu vẫn đi Better Auth như cũ. Việc này không đụng hai chỗ đó.

## Không làm

- Crop / sửa ảnh, nút xóa avatar, GIF
- Migration database
- Trang quản lý thiết bị, điều khoản, khóa tài khoản (GA-06 / GA-12 / GA-03)

## Kiểm tra

- Test API avatar: 7/7 pass
- `npm run check-types`: pass
- Nút Đổi ảnh trên UI còn phải xác nhận chạy đúng (có lần bấm không đổi)

## Quyết định

- Lưu URL Cloudinary vào cột `User.image` sẵn có
- Server tự ghi database. Client chỉ `refetch()` session, không gọi `updateUser({ image })`
