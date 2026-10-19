---
title: "Redesign Cài đặt tài khoản (profile, mật khẩu, phiên, thông báo) theo mockup, giữ Mantine + logic cũ"
description: "Áp hình thức mockup settings-profile lên /dashboard/settings/*; giữ TanStack Form, hook, luật kiểm tra, chế độ đặt mật khẩu; không giả công tắc thông báo hay địa điểm phiên mà API không có."
status: implemented-unverified-in-browser
priority: P3
effort: 17h
tags: [frontend, web-1, ux, refactor]
blockedBy: []
blocks: []
created: 2026-10-19
branch: feat/landing-redesign
---

# Redesign Cài đặt tài khoản

Mockup: `design-system/mockups/settings-profile/` (`REPORT.md`, `index.html`). **Chỉ đặc tả UX/UI.**

Đọc trước: [gap-register](reports/gap-register.md), [mantine-reuse-map](reports/mantine-reuse-map.md), `research/scout-01-mockup-vs-code.md`, `design-system/wording/pages/settings-profile.md` (+ `settings-password.md`, `settings-sessions.md`, `settings-notifications.md` chưa được scout đọc hết), skill filter: `../261019-1500-case-detail-redesign/reports/skill-filter-taste-minimalist.md`.

## Ground rules

1. Mantine trước; giữ `TextInput`/`PasswordInput`/`Switch`/`Modal`/`Avatar`/`Badge` với `error`, `placeholder`, `disabled`, `description` đang chạy. Đổi style bằng `classNames` + CSS module + biến.
2. Giữ logic: TanStack Form + validation; `useProfileMutations`, `useSessionMutations`, `useNotificationPreferences`; `validateAvatarFile`; luật xóa `XOA/XÓA`; hai chế độ mật khẩu; skeleton/lỗi/trống của phiên.
3. Mockup thiếu hoặc code thiếu → vào `reports/gap-register.md` và hỏi chủ dự án; không tự giả dữ liệu (không vẽ công tắc không lưu, không bịa địa điểm).
4. File ≤200 dòng, style trong CSS module, component dùng lại, không `apiClient` trong component, không try/catch trong component, không `as any`.
5. Lucide, tiếng Việt, wording chuẩn thắng mockup, tiền (nếu có) `VND` dấu phẩy, `size>=sm`, chữ ≥14px, không shadow nghỉ.
6. Ponytail ultra: không thêm abstraction/tùy chọn ngoài yêu cầu; logic thuần mới kèm file assert nhỏ.
7. Cổng: `bun run check-types`, `bun run lint`, taste `lint.mjs` trên thư mục sửa, smoke trình duyệt 1440/390 sáng + tối.

## Điều đã quyết trước (phản biện mockup)

- **Không làm ngăn kéo mobile cho 4 mục.** Mockup dùng burger + drawer + focus trap cho 4 liên kết. Code hiện là dải cuộn ngang, đủ dùng, ít lỗi hơn. Mặc định: giữ dải, chỉ đổi style gạch dưới giống tabs (Q-P6).
- **Không làm Save-gate cho avatar** (P-04, Q-P3).
- **Không làm 4 nhóm thông báo** (P-01, Q-P1).
- **Không hiện địa điểm / "hoạt động X trước"** (P-02, Q-P2).


## Quy ước ghi đè (sau rà soát)
- **Nhánh:** dùng nhánh hiện tại `feat/landing-redesign` (kết quả `git branch --show-current`); đổi nhánh khi bắt đầu code nếu muốn tách.
- **Test:** `AGENTS.md` chỉ cho test ở `apps/api`; web-1 không có runner. Mọi `*.test.ts` nêu trong phase **không commit**: kiểm hàm thuần bằng script tạm (xóa sau), cổng chính là `check-types` + `lint` + smoke trình duyệt. Thiếu hạ tầng test web ghi nhận là khoảng trống, không tự dựng.
- **Viền:** `frontend-ui-rules.md` §6.3 (bắt buộc) đòi viền Card/Paper 1.5px, không phải 1px của mockup. Dùng 1.5px qua biến.
- **Phụ thuộc:** Phase 1 của plan case-detail (token, `UnderlineTabs`, `StatusChip`, `ExpandableList`, `CopyIconButton`, `formatVndAmount`) là tiền đề cho plan này; chạy plan case P1 trước.

## Phạm vi

- **Trong:** `apps/web-1/app/dashboard/settings/**` (layout, sidebar, profile, password, sessions, notifications).
- **Ảnh hưởng chéo:** `ProfileInfoForm` + `SettingsLayout` dùng chung với `app/{admin,supporter,writer}/settings/**` (P-14). Hình thức đổi theo; kiểm hồi quy 3 route, không viết responsive riêng cho admin/supporter (chỉ desktop).
- **Ngoài:** API/DB, schema `notification preferences`, geo-IP, SSO.

## Cross-Plan Dependencies

| Quan hệ | Plan | Ghi chú |
|---|---|---|
| Phụ thuộc artefact Phase 1 (không dùng `blockedBy` vì field theo cả plan) | [261019-1500-case-detail-redesign](../261019-1500-case-detail-redesign/plan.md) | Cần token `--ui-*`, `StatusChip`. Khi Phase 1 merge thì plan này chạy song song với phần còn lại của plan case; frontmatter giữ `blockedBy` để scan nhắc thứ tự |
| Độc lập | [261019-1520-wallet-redesign](../261019-1520-wallet-redesign/plan.md) | Không chung file |
| Độc lập | landing / pay-later / worker-jobspec | Không chạm |

## Phases

| Phase | Name | Effort | Status |
|---|---|---|---|
| 1 | [Tách file + khung Cài đặt](./phase-01-split-and-settings-shell.md) | 3h | Pending |
| 2 | [Tab Thông tin cá nhân + Vùng nguy hiểm](./phase-02-profile-tab.md) | 5h | Pending |
| 3 | [Tab Thiết bị và phiên](./phase-03-sessions.md) | 3h | Pending |
| 4 | [Tab Mật khẩu + Thông báo](./phase-04-password-and-notifications.md) | 3h | Pending |
| 5 | [QA, hồi quy vai trò khác, tài liệu](./phase-05-qa-docs.md) | 3h | Pending |

## Câu hỏi cần chủ dự án quyết

| # | Câu hỏi | Mặc định | Chặn |
|---|---|---|---|
| Q-P1 | Thông báo: giữ 1 công tắc "Nhận email" (không có 4 nhóm). Muốn 4 nhóm = plan backend riêng (schema, API, cột DB, sự kiện gửi). Chấp nhận? | Giữ 1 công tắc | P4 |
| Q-P2 | Phiên: bỏ địa điểm và "hoạt động 2 giờ trước" vì API không có. Muốn thì thêm geo-IP + last-seen ở backend. Chấp nhận? | Bỏ | P3 |
| Q-P3 | Avatar: giữ upload ngay khi chọn (thêm xem trước trong lúc tải + ghi chú giới hạn + lỗi gần nút), không Save-gate như mockup. Chấp nhận? | Giữ upload ngay | P2 |
| Q-P4 | Chữ modal xóa/huy hiệu phiên: theo `design-system/wording` (mặc định) hay theo mockup (phải cập nhật luôn wording)? | Wording chuẩn | P2, P3 |
| Q-P5 | `ProfileInfoForm`/`SettingsLayout` đổi hình thức cho **cả** admin/supporter/writer (cùng component), hay fork bản sinh viên? | Đổi cho tất cả | P1 |
| Q-P6 | Mobile: giữ dải cuộn ngang (restyle gạch dưới) thay vì drawer như mockup. Chấp nhận? | Giữ dải | P1 |
| Q-P7 | Nút Lưu chỉ bật khi form có sửa (mockup). Chấp nhận thay đổi hành vi? | Có | P2 |

## Unresolved

Q-P1..Q-P7; chưa đọc đủ 3 file wording; chưa kiểm admin/supporter/writer mobile (chỉ desktop nên không cần); `useSession` có refresh avatar trên navbar sau đổi ảnh? (P2 kiểm).
