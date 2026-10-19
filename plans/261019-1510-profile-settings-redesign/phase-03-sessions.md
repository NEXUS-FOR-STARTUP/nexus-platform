# Phase 3: Tab Thiết bị và phiên

Priority: P2 · Status: Pending · Effort: 3h · blockedBy: Phase 1 · Q-P2, Q-P4

SD = `apps/web-1/app/dashboard/settings`

## Context Links
- Mockup: phần sessions trong `js/views/spec.js` (mockup đặt các tab phụ chung file spec), `REPORT.md` §4.4
- `research/scout-01` §2 "Sessions", §3 "Sessions (GA06)"; `reports/gap-register.md` P-02, P-03, P-06, P-08, P-10
- Code: `SD/sessions/_components/SessionsList.tsx` (132), `SessionItem.tsx` (86), `RevokeOthersModal.tsx` (71), `hooks/useSessionQueries.ts`, `useSessionMutations.ts`, `@/lib/utils/ua-parser` (`parseUserAgent`, `formatIpAddress`), `ActiveSessionDtoSchema`

## Key insights
- API trả `id, ipAddress, userAgent, createdAt, expiresAt, isCurrent` (không địa điểm, không last-seen) → mockup phần địa điểm + "hoạt động 2 giờ trước" **không dựng** (Q-P2).
- `SessionItem` hiện: icon theo UA (Laptop/Smartphone/Tablet/Globe), `{os} • {browser}`, badge "Phiên hiện tại", dòng `IP: … • Đăng nhập lúc: dd/mm/yyyy hh:mm`, nút "Đăng xuất" `size="xs"` (vi phạm ≥ sm).
- `SessionsList`: skeleton 3 dòng, lỗi + "Tải lại", trạng thái trống, nút "Đăng xuất tất cả thiết bị khác" (ẩn khi không còn phiên khác) → `RevokeOthersModal`.
- Mockup đăng xuất 1 phiên tức thì (code cũng vậy) và đăng xuất hàng loạt tức thì (code: có modal). **Giữ modal.**
- Tên thiết bị mockup ("Windows 11", "MacOS Sonoma") là dữ liệu mẫu, parser thật chỉ ra `Windows 10/11`, `macOS` (P-03).

## Requirements
- Mỗi phiên là hàng `Paper withBorder radius="md"`: icon trong ô nền `--color-surface-soft`, tên thiết bị (16/500), dòng phụ (14 muted), `StatusChip tone="ok"` "Phiên hiện tại" cho phiên hiện tại (không có nút), nút "Đăng xuất" `variant="default" size="sm"` cho phiên khác.
- Nút "Đăng xuất tất cả thiết bị khác": `Button variant="default" size="sm"` ở đầu danh sách; ẩn khi không có phiên khác; mô tả trong modal dùng số thiết bị thật.
- Loading skeleton 3 hàng (cùng chiều cao hàng thật để không nhảy), lỗi + "Tải lại", trống.
- Chữ theo wording chuẩn ("Phiên hiện tại", "Đăng xuất tất cả thiết bị khác").

## Architecture
```
SessionsList.tsx (≤100)    header + nút hàng loạt + danh sách + trạng thái
 ├─ SessionItem.tsx (≤80)  1 phiên (restyle)
 ├─ SessionsSkeleton.tsx   (tách nhỏ nếu cần)
 └─ RevokeOthersModal.tsx  (giữ, chỉnh chữ/số)
sessions.module.css        .row .iconBox
```

## Related code files
**Modify:** `SessionsList.tsx`, `SessionItem.tsx`, `RevokeOthersModal.tsx`.
**Create:** `sessions.module.css`, (tuỳ) `SessionsSkeleton.tsx`.
**Delete:** không.

## Implementation steps
1. Đọc 3 component + 2 hook + `ua-parser` (chỉ dùng, không sửa). Đọc `design-system/wording/pages/settings-sessions.md` đầy đủ (scout mới đọc phần đầu).
2. Kịch bản trước sửa: tải danh sách, lỗi (chặn mạng thử), trống (chỉ phiên hiện tại), đăng xuất 1 phiên, đăng xuất hàng loạt qua modal.
3. `SessionItem`: icon từ `parseUserAgent` (không đổi), `StatusChip` cho phiên hiện tại; thay `size="xs"` → `size="sm"`; `aria-label` nút "Đăng xuất khỏi <tên thiết bị>".
4. `SessionsList`: skeleton cùng chiều cao hàng; trạng thái lỗi dùng `Alert` + `Button size="sm"` "Tải lại"; nút hàng loạt chuyển lên đầu danh sách.
5. `RevokeOthersModal`: chỉ chữ/layout; số thiết bị = `sessions.filter(s => !s.isCurrent).length`.
6. Chạy lại kịch bản + chụp 1440/390 sáng/tối. Thử UA khác nhau (giả lập) để thấy icon.

## Todo
- [ ] Chốt Q-P2
- [ ] Đọc wording settings-sessions
- [ ] Kịch bản trước sửa
- [ ] Restyle item + list + modal
- [ ] `size="sm"` mọi nút
- [ ] Smoke

## Success criteria
- Không hiện địa điểm/last-seen bịa; không "tất cả 3 thiết bị" cứng.
- Ba trạng thái (tải/lỗi/trống) còn nguyên và nhìn đúng.
- `RevokeOthersModal` vẫn xuất hiện trước khi đăng xuất hàng loạt.
- Mọi file ≤200 dòng; `size="xs"` không còn trong `sessions/`.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Test đăng xuất làm mất phiên dev của chính mình | Chỉ đăng xuất phiên **khác** (tạo bằng trình duyệt ẩn danh); không đăng xuất phiên hiện tại |
| Chiều cao skeleton lệch hàng thật | So ảnh chụp hai trạng thái |

## Security
IP hiển thị chỉ cho chủ tài khoản như hiện tại (qua `formatIpAddress`); không thêm log IP.

## Next steps
P4.
