# Phase 2: Tab Thông tin cá nhân + Vùng nguy hiểm

Priority: P2 · Status: Pending · Effort: 5h · blockedBy: Phase 1 · Q-P3, Q-P4, Q-P7

SD = `apps/web-1/app/dashboard/settings`

## Context Links
- Mockup: `js/views/profile.js` (139), `js/views/delete-modal.js` (63), `css/views.css`; `REPORT.md` §4.1-4.3
- `research/scout-01` §2 "Profile tab", "Delete modal", §3 "Avatar flow", "Delete account"; `reports/gap-register.md` P-04, P-07, P-17, P-18, P-19, mục C wording
- Code: `SD/profile/_components/ProfileInfoForm.tsx` (183), `DeleteAccountModal.tsx` (90), hooks tách ở P1

## Key insights
- Tên: TanStack Form, `!value.trim()` → "Tên hiển thị không được để trống.", lỗi chỉ hiện sau khi chạm, truyền vào `error` của `TextInput`. **Giữ.**
- Email: `TextInput disabled`, hiện tại tooltip + icon; mockup hiện chữ "Không thể thay đổi" cố định → `description` (mobile không có hover).
- Lưu: hiện luôn bật; mockup chỉ bật khi dirty (Q-P7) → `form.Subscribe` selector `(s) => [s.isDirty, s.canSubmit, s.isSubmitting]`.
- Avatar (Q-P3): **giữ upload ngay**; thêm ghi chú giới hạn cố định "Tối đa 2MB (.jpg, .jpeg, .png, .webp)", lỗi hiển thị cạnh nút (`Text c="red" role="alert"`) ngoài toast hiện tại, `Avatar` đang tải có `opacity` + `Loader`; session được refetch như hiện tại (kiểm navbar cập nhật ảnh).
- Modal xóa: đã có đúng luật mockup; **chỉ đổi style/layout**, giữ chữ chuẩn (Q-P4): "Xóa tài khoản vĩnh viễn", "Hủy bỏ", "Xác nhận thao tác", placeholder "XOA", "Xác nhận xóa tài khoản".
- Vùng nguy hiểm: viền đỏ nhạt + tiêu đề đỏ + `TriangleAlert`; nút "Xóa tài khoản" kiểu `Button variant="light" color="red"` (quiet danger). Global `!important` ép viền Paper → dùng class có độ đặc hiệu cao hoặc `div`.
- Nhãn thành công chuẩn: "Đã cập nhật thông tin hồ sơ." (không theo mockup).

## Requirements
- Thẻ "Thông tin cơ bản" (18/500) + ghi chú "Thông tin hiển thị trên hệ thống và trong các báo cáo phản biện." (đối chiếu wording trước khi giữ câu này).
- Avatar 96px, chữ cái đầu viết hoa trên nền `--color-brand-soft`; nút "Đổi ảnh" `Button variant="default" size="sm"` + `ImagePlus`.
- Form: Tên hiển thị* (placeholder "Nhập tên hiển thị" nếu wording cho phép; chưa có thì giữ placeholder hiện tại), Email (disabled).
- Nút "Lưu thay đổi": `disabled` khi `!isDirty`, `loading` khi submit.
- Vùng nguy hiểm tách component riêng.

## Architecture
```
profile/page.tsx
 └─ ProfileInfoForm.tsx (≤120)    form + Subscribe + 2 con
     ├─ AvatarField.tsx           Avatar + nút + ghi chú + lỗi
     ├─ ProfileNameEmailFields.tsx
     └─ (danger) DangerZoneCard.tsx → DeleteAccountModal.tsx
profile.module.css                .card .avatar .dangerCard
```
`ProfileInfoForm` dùng chung với admin/supporter/writer: vùng nguy hiểm đang hiện ở các vai trò đó? Kiểm trước (grep `DeleteAccountModal` ở route khác). Giữ nguyên điều kiện hiển thị hiện có.

## Related code files
**Modify:** `ProfileInfoForm.tsx`, `DeleteAccountModal.tsx` (style), `profile/page.tsx` (nếu cần).
**Create:** `AvatarField.tsx`, `ProfileNameEmailFields.tsx`, `DangerZoneCard.tsx`, `profile.module.css`.
**Delete:** không.

## Implementation steps
1. Đọc `ProfileInfoForm.tsx` (183) + `DeleteAccountModal.tsx` (90) + hook `useChangeAvatar` (P1). Ghi: chỗ đặt vùng nguy hiểm hiện tại, cách form khởi tạo giá trị, cách xử lý thành công.
2. Đọc `design-system/wording/pages/settings-profile.md` đầy đủ; ghi bảng chữ cuối.
3. Kịch bản trước sửa: đổi tên hợp lệ → toast + header đổi; tên trống → lỗi; đổi ảnh >2MB → toast lỗi; đuôi sai → toast lỗi; ảnh hợp lệ → toast + ảnh đổi; mở modal xóa → nút khóa tới khi gõ `XOA`/`XÓA`.
4. `AvatarField`: giữ ref + `<input hidden type=file accept=...>` (hoặc `FileButton`) → gọi `changeAvatar`; `useState<string | null>(error)` cho lỗi gần nút lấy từ chính `validateAvatarFile` **trước** khi gọi mutation (không đổi chuỗi). Hiển thị ghi chú giới hạn từ hằng `avatar-limits.ts`.
5. `ProfileNameEmailFields`: `form.Field` name → `TextInput` (label, `required`, `error` từ meta, `description` không đổi); email `disabled` + `description="Không thể thay đổi"`.
6. Nút Lưu: `form.Subscribe` selector; `disabled={!isDirty}`; sau lưu thành công `form.reset({ name: newName })` để dirty về false (xác nhận khớp API TanStack Form v1 qua context7).
7. `DangerZoneCard`: `Paper` + class `.dangerCard` (viền `color-mix(in srgb, var(--color-danger) 35%, transparent)`), tiêu đề đỏ + `TriangleAlert`, mô tả, nút `variant="light" color="red"`.
8. `DeleteAccountModal`: chỉ layout/spacing; giữ `centered radius="md"`, `closeOnClickOutside`/`closeOnEscape` bị chặn khi loading (như cũ).
9. Chạy lại kịch bản bước 3 + kiểm dirty-gate (lưu không sửa → nút khóa) + `lint`, `check-types`, taste lint.
10. Smoke 1440/390 sáng + tối; ảnh `.webp` thử thật; kiểm `useSession` cập nhật avatar ở topbar sau đổi.

## Todo
- [ ] Chốt Q-P3, Q-P4, Q-P7
- [ ] Đọc wording settings-profile
- [ ] Kịch bản trước sửa
- [ ] AvatarField + lỗi cạnh nút
- [ ] Dirty-gate nút Lưu
- [ ] DangerZoneCard + modal restyle
- [ ] Smoke + so sánh hành vi

## Success criteria
- Hành vi tên/ảnh/xóa không đổi so với kịch bản bước 3.
- Chữ UI khớp wording chuẩn; không còn `Tooltip` bắt buộc để hiểu email.
- Nút Lưu khóa khi chưa sửa, mở khi sửa tên, khóa lại sau khi lưu thành công.
- Ghi chú giới hạn ảnh luôn hiện; lỗi ảnh có ở cạnh nút.
- `ProfileInfoForm.tsx` ≤120 dòng; mọi file ≤200; không hex trong TSX.

## Risks
| Rủi ro | Xử lý |
|---|---|
| `form.reset` sai cách làm mất giá trị vừa lưu | Test tay lưu 2 lần liên tiếp |
| Vai trò khác hiển thị vùng nguy hiểm không mong muốn | Giữ điều kiện cũ; kiểm 3 route |
| Lỗi ảnh hiển thị 2 lần (toast + inline) gây rối | Giữ toast hiện tại hoặc inline, **một** nơi: nếu thấy trùng, bỏ toast lỗi, giữ inline (hỏi Q-P3 nếu muốn khác) |

## Security
Xác nhận xóa phía client chỉ là UX; server vẫn bắt buộc phiên hợp lệ. Không log tên/email. Test xóa tài khoản chỉ trên DB dev + tài khoản thử.

## Next steps
P3.
