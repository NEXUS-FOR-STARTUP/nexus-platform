# Gap register: settings-profile mockup vs code

Nguồn: `research/scout-01-mockup-vs-code.md`. Mức: **B** blocker, **H** high, **M** med, **L** low. "Mặc định" = cách plan xử lý nếu chủ dự án không đổi ý; câu hỏi tương ứng ở `plan.md` (Q-P#).

## A. Mockup đòi cái API/code chưa có

| ID | Mức | Mockup | Thực tế | Mặc định | Q |
|---|---|---|---|---|---|
| P-01 | B | 4 công tắc thông báo (kết quả phản biện, biến động ví, nhắc hạn nộp, bản tin hệ thống) lưu được | Schema strict `{ email_enabled: boolean }` (`packages/validation/src/index.ts` ~L684), UI 1 `Switch` "Nhận email". Không có loại thông báo theo nhóm; "nhắc hạn nộp" và "bản tin hệ thống" có thể không phải sự kiện gửi được [UNVERIFIED] | **Giữ 1 công tắc** "Nhận email", chỉ đổi hình thức. Không vẽ 3 công tắc không lưu (là hành vi giả). Việc thêm nhóm = plan backend riêng | Q-P1 |
| P-02 | H | Phiên đăng nhập hiện **địa điểm** ("Hà Nội") và **"hoạt động 2 giờ trước"** | `ActiveSessionDtoSchema`: `id, ipAddress, userAgent, createdAt, expiresAt, isCurrent` (`index.ts` ~L791, `list-sessions.usecase.ts:44-48`). Không geo-IP, không last-seen | **Bỏ địa điểm và "hoạt động X trước"**. Giữ `{hệ điều hành} • {trình duyệt}`, `IP: …`, `Đăng nhập lúc dd/mm/yyyy hh:mm` như hiện tại | Q-P2 |
| P-03 | M | Tên thiết bị "Windows 11", "MacOS Sonoma" | `parseUserAgent` chỉ ra `Windows 10/11`, `macOS` | Dùng đầu ra parser thật; dữ liệu mockup chỉ là mẫu | N |
| P-04 | H | Ảnh đại diện: chọn ảnh → xem trước tức thì → bấm "Lưu thay đổi" mới áp dụng; chỉ kiểm cỡ 2MB | Code: **upload ngay khi chọn**, không xem trước, kiểm cả đuôi (`.jpg/.jpeg/.png/.webp`) lẫn cỡ (`validateAvatarFile`), lỗi bằng toast, thành công toast + refetch session | **Giữ upload-ngay.** Thêm: ghi chú giới hạn hiển thị cố định, lỗi hiện **cạnh nút** (không chỉ toast), trạng thái đang tải trên avatar. Không làm Save-gate: hai API (`updateUser` Better Auth + `POST /profile/avatar`) khác nhau, một nút Lưu cho cả hai sinh nửa-thành-công và cần xử lý hoàn tác | Q-P3 |

## B. Code có mà mockup chưa tính (không được làm mất)

| ID | Mức | Code hiện có | Mockup | Mặc định |
|---|---|---|---|---|
| P-05 | H | Chế độ **"Đặt mật khẩu"** cho tài khoản OAuth (ẩn ô mật khẩu hiện tại; nhãn "Mật khẩu"/"Xác nhận mật khẩu"; nút "Đặt mật khẩu"); `GET /profile/password-status`; lời nhắn "Các thiết bị khác đã được đăng xuất." | Tab Mật khẩu là **bản giả**: 3 ô `type="text"` bị vô hiệu | Giữ nguyên form, chỉ restyle. **Không chép** `type="text"` |
| P-06 | H | Phiên: skeleton 3 dòng, lỗi + "Tải lại", trạng thái trống, `RevokeOthersModal` xác nhận | Không có | Giữ cả bốn |
| P-07 | H | `translateAuthError`, `updateName` ném lỗi Better Auth (`useProfileMutations.ts`) | Không | Giữ nguyên hook |
| P-08 | M | Xác nhận khi đăng xuất **hàng loạt** (modal). Đăng xuất 1 phiên: không xác nhận | Mockup: cả hai đều tức thì; nhắn cứng "tất cả 3 thiết bị khác" | Giữ modal hàng loạt; số thiết bị tính từ dữ liệu |
| P-09 | M | Tải trạng thái mật khẩu: Paper chỉ chứa nút "Đặt mật khẩu" đang loading (xấu) | | Sửa thành skeleton đúng kích thước form |
| P-10 | M | Nút "Đăng xuất" từng phiên `size="xs"` | Mockup cỡ chuẩn | Đổi `size="sm"` (đúng quy tắc ≥ sm) |
| P-11 | L | Điều hướng theo **route** (`/dashboard/settings/<tab>`), `aria-current="page"` | `?tab=` (chỉ mockup) và tab "Quy ước" | Giữ route; bỏ tab Quy ước |

## C. Khác biệt chữ (wording canon thắng)

`design-system/wording/pages/settings-profile.md` là nguồn chuẩn. Chưa đọc hết `settings-password.md`, `settings-sessions.md`, `settings-notifications.md`: P1 phải đọc.

| Vị trí | Chuẩn (code + wording) | Mockup | Dùng |
|---|---|---|---|
| Tiêu đề modal xóa | "Xóa tài khoản vĩnh viễn" | "Xác nhận xóa tài khoản" | Chuẩn |
| Nút hủy | "Hủy bỏ" | "Hủy" | Chuẩn |
| Nhãn ô xác nhận | "Xác nhận thao tác" | "Nhập XOA hoặc XÓA để xác nhận:" | Chuẩn |
| Placeholder | "XOA" | "Nhập XOA hoặc XÓA" | Chuẩn |
| Toast lưu | "Đã cập nhật thông tin hồ sơ." | "Đã cập nhật thông tin tài khoản thành công." | Chuẩn |
| Huy hiệu phiên hiện tại | "Phiên hiện tại" | "Thiết bị này" | Chuẩn |
| Nút hàng loạt | "Đăng xuất tất cả thiết bị khác" | "Đăng xuất khỏi thiết bị khác" | Chuẩn |

Chủ dự án muốn chữ mockup thì phải cập nhật luôn `settings-sessions.md`, `settings-notifications.md`: Q-P4. Mặc định: chuẩn.

## D. Quy tắc repo

| ID | Việc | Xử lý |
|---|---|---|
| P-12 | Mockup Phosphor | Lucide: `User`, `KeyRound`, `MonitorSmartphone`, `Bell` (đã dùng ở sidebar), `TriangleAlert`, `Trash2`, `ImagePlus`, `Info`, `Laptop`, `Smartphone`, `Tablet`, `Globe`, `LogOut` |
| P-13 | `ProfileInfoForm.tsx` 183 dòng, `useProfileMutations.ts` 199 dòng: chạm sẽ vượt 200 | Tách trước khi thêm gì |
| P-14 | `ProfileInfoForm` + `SettingsLayout` dùng chung với **admin/supporter/writer** (`app/{admin,supporter,writer}/settings/**`) | Thay đổi hình thức áp cho mọi vai trò; admin/supporter chỉ-desktop không vi phạm. Kiểm hồi quy 3 route. `getSettingsNav` ẩn tab thông báo khi `basePath` khác `/dashboard/settings`: giữ | Q-P5 |
| P-15 | Chữ `size="xs"`/`sm` = 16px ở ≥640px (`--app-text-*`) nên không dựng được ghi chú 14px | Dùng `--ui-text-note` (token từ case plan P1) qua CSS module |
| P-16 | `alert()`/thanh `.p-notice` của mockup | Dùng `notifications.show` (đã là mẫu repo) hoặc `Alert` Mantine |
| P-17 | Mockup bỏ nút Lưu "luôn bật" → "chỉ bật khi có sửa" | Nhận (dirty-gate bằng `form.Subscribe`) |
| P-18 | Mockup ô Tên lỗi chỉ khi submit, xóa khi gõ | Code: lỗi sau khi chạm (touched); giữ cách của TanStack Form, không đổi |
| P-19 | Vùng nguy hiểm viền đỏ nhạt `rgba(239,68,68,.35)` | Dùng `--color-danger` + độ mờ qua biến, không hex; chú ý global `!important` ép viền Paper (`globals.css:196-216`) |

## E. Ngoài phạm vi
Spec tab, `.mock` disclaimers, nút giả "mô phỏng xóa", `file://` router.
