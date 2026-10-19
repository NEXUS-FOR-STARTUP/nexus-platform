# Phase 2: Khung trang, sidebar, ngăn kéo mobile

Priority: P2 · Status: Pending · Effort: 4h · blockedBy: Phase 1 · Chờ Q2 (đổi màu sidebar)

CW = `apps/web-1/app/dashboard/case/[id]/_components`

## Context Links
- Mockup: `index.html`, `css/base.css:26-37,106-120`, `js/app.js`; `REPORT.md` §4
- `research/scout-02` §2 "Routing"; `reports/gap-register.md` C-29, C-30, C-19
- Code: `CW/workspace/JourneyWorkspaceShell.tsx` (183), `JourneySidebar.tsx` (65), `JourneySidebar.module.css` (153), `JourneyMobileNav.tsx` (52)

## Key insights
- Sidebar thật: sticky `top:64px`, rộng 280px, **nền `--color-brand` đặc**, chữ trắng, link hover trắng/brand (`JourneySidebar.module.css:2-153`). Mockup: 264px, nền trắng, viền phải, mục đang chọn nền `--color-brand-subtle` chữ brand, icon muted → brand khi chọn.
- `JourneyMobileNav` đã là Mantine `Drawer` (đúng quy tắc); header/body bị `!important` brand. Burger/FAB thật là nút tùy biến nổi (`JourneyWorkspaceShell.tsx:101`, `shadow-md`): được phép (vật thể nổi).
- Mockup tự viết focus trap, Esc, khóa cuộn, tự đóng khi phóng to: **Mantine Drawer đã có** focus trap/Esc/khóa cuộn; tự đóng khi ≥ breakpoint cần `useMediaQuery` (chưa xác minh trong code hiện tại).
- Pitfall có sẵn: `handleTabChange` bỏ `stage`/`view`. **Giữ nguyên** (C-19).
- Chiều cao topbar thật 64px, không phải 56px mockup → dùng `--ui-topbar-height`.

## Requirements
- Sidebar sticky `top: var(--ui-topbar-height)`, `height: calc(100dvh - var(--ui-topbar-height))`, cuộn riêng khi menu dài; trang cuộn bình thường (không khung cuộn lồng).
- 5 mục nav như hiện tại (`overview, journey, billing, timeline, settings`), icon Lucide hiện có, **giữ chân sidebar có link Zalo** (`JourneySidebar.tsx:51-62`).
- Cột nội dung: `.col` max 880px mặc định; `.narrow` 720px (timeline, settings); `.wide` 1320px (chi tiết giai đoạn). Padding desktop `40px 48px 96px`, mobile `24px 16px 88px` (chừa chỗ cho FAB).
- Mobile ≤820px: Drawer rộng `min(320px, 85vw)`, nút đóng, Esc, focus về nút mở khi đóng, tự đóng khi viền màn hình lớn lên.
- Chế độ tối: nền sidebar theo `--color-surface`, không hardcode.

## Architecture
```
workspace-layout.module.css   .layout (grid 280→264px | 1fr)  .main  .col .narrow .wide
JourneySidebar.module.css     rút còn ~80 dòng: .navbar (nền surface), .link, .linkActive, .footer
JourneyWorkspaceShell.tsx     chọn class .col/.narrow/.wide theo tab; không đổi routing
```
Chọn độ rộng cột bằng prop `width: "col" | "narrow" | "wide"` ở `WorkspaceMain` (component 15 dòng mới) thay vì rải class.

## Related code files
**Modify**
- `CW/workspace/JourneySidebar.tsx`, `JourneySidebar.module.css`: nền trắng, viền phải, trạng thái active; bỏ `!important` brand ở drawer header/body/content, dùng `--color-surface`.
- `CW/workspace/JourneyMobileNav.tsx`: giữ `Drawer`; đóng khi ≥ md (`useMediaQuery`); trả focus về nút mở (Mantine `returnFocus` mặc định, kiểm).
- `CW/workspace/JourneyWorkspaceShell.tsx`: dùng `WorkspaceMain`; không đổi logic URL.

**Create**
- `CW/workspace/WorkspaceMain.tsx`, `CW/workspace/workspace-layout.module.css`

**Delete:** không (code chết xử lý ở plan riêng, Q6).

## Implementation steps
1. Đọc `JourneyWorkspaceShell.tsx:37-128` và xác nhận biến `tab`, cách render từng tab; liệt kê tab nào cần `narrow|wide|col`.
2. `workspace-layout.module.css`: grid `280px minmax(0,1fr)`; `.main` padding như trên; `.col`/`.narrow`/`.wide` dùng `max-width` + `margin-inline: 0` (căn trái, mockup căn trái). `@media (max-width: 820px)` một cột. Dùng `@mixin smaller-than` của `postcss-preset-mantine` nếu đã dùng ở module khác, nếu không thì media query thường.
3. `JourneySidebar.module.css`: viết lại `.navbar` (nền `--color-surface`, `border-right: 1px solid var(--color-border)`, `top: var(--ui-topbar-height)`, chiều cao theo biến), `.link` (padding `10px 12px`, bo `var(--mantine-radius-md)`, chữ `--color-text`, `font-size: var(--ui-text-body)`, `font-weight: var(--ui-weight-regular)`), `.link:hover` nền `--color-surface-soft`, `.linkActive` nền `--color-brand-subtle` chữ `--color-brand`, icon `--color-text-muted` → brand. Footer Zalo: viền trên `--color-border`.
4. Drawer: xóa `!important` brand ở `.mobileDrawer*`; nội dung dùng lại `.link/.linkActive` (bỏ `.mobileNavButton*` riêng nếu trùng). Mantine `Drawer` đặt `size="min(320px, 85vw)"` không cần class vị trí.
5. FAB mở menu: giữ nút hiện tại, đổi nền `--color-brand`, vị trí `left:16px; bottom: calc(16px + env(safe-area-inset-bottom))` ở CSS module (đây là nút của mình, không phải `Modal`/`Drawer`, nên được đặt vị trí).
6. `WorkspaceMain`: nhận `width` + children, bọc `.main > .col|.narrow|.wide`.
7. Thay trong `JourneyWorkspaceShell` từng tab bằng `WorkspaceMain` (overview: col; journey: col khi danh sách, wide khi `stage` có; billing: col; timeline/settings: narrow).
8. Smoke 1440/390 từng tab: sidebar không nhảy khi cuộn 1400px (đo `getBoundingClientRect().top` = 64); Tab trong drawer không thoát ra ngoài; Esc đóng; phóng to cửa sổ từ 390→1440 khi drawer mở thì đóng.
9. `check-types`, `lint`, taste `lint.mjs` trên `workspace/`.

## Todo
- [ ] Chốt Q2 (nếu từ chối: giữ nền brand, chỉ đổi biến chiều cao)
- [ ] `workspace-layout.module.css` + `WorkspaceMain`
- [ ] Sidebar desktop
- [ ] Drawer mobile + tự đóng
- [ ] FAB
- [ ] Smoke 3 cỡ màn, sáng/tối

## Success criteria
- Sidebar `top` = 64px sau khi cuộn 1400px. Không khung cuộn lồng trong `main`.
- URL `?tab=&stage=&view=`, nút Back/Forward hoạt động như trước (so hành vi trước/sau).
- Không còn `!important` brand ở `JourneySidebar.module.css`; file ≤ 100 dòng.
- Drawer: Tab bị kẹt trong drawer, Esc đóng, focus về nút mở.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Người dùng quen sidebar xanh | Q2; giữ 1 commit riêng để hoàn tác riêng |
| `max-width` mới làm vỡ tab dùng bố cục rộng hơn (draft 3 cột) | Draft/stage dùng `wide` 1320px; kiểm ở P5 |
| `useMediaQuery` gây nháy SSR | Dùng `useMediaQuery(q, false, { getInitialValueInEffect: true })` |

## Security
Không có. Link Zalo giữ `rel="noopener noreferrer"` nếu đã có.

## Next steps
P3 (Tổng quan), P4 (Hành trình) dùng `WorkspaceMain`.
