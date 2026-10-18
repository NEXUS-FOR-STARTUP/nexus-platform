---
title: "Redesign landing (hướng B) + dẫn khách vào tạo case + Inter Tight toàn app"
description: "Landing đưa việc làm được ngay lên đầu (thẻ câu hỏi mẫu + báo cáo mẫu), nút chính vào /dashboard, thêm khối hướng dẫn ở Tổng quan case, đổi font toàn app sang Inter Tight."
status: pending
priority: P2
effort: 14h
tags: [web-1, landing, ux, dashboard, font]
blockedBy: []
blocks: []
created: 2026-10-18
branch: feat/landing-redesign
---

# Redesign landing hướng B

Mọi thông tin nền (chẩn đoán, quyết định, đo đạc trang tham khảo, hiện trạng code): [report](../reports/261018-landing-redesign-context.md). **Đọc report trước khi code.** Plan này chỉ neo việc cần làm.

Prototype HTML đã duyệt bố cục: [prototype/index.html](prototype/index.html), bản tự chứa (kèm `logo.svg` và 3 ảnh báo cáo cùng thư mục, mở thẳng bằng trình duyệt; cần mạng để tải font). Chỉ để tham khảo, không phải mã production. Ảnh dùng cho code thật nằm ở `apps/web-1/public/landing/`.

## Quyết định đã chốt (đừng hỏi lại)

- Hướng **B**: "Đưa việc làm được ngay lên đầu".
- Hero có tiêu đề + 3 gạch đầu dòng nguyên văn hiện tại, nút chính **"Kiểm tra nhanh ý tưởng" → `/dashboard`** (không còn `/dashboard/team-fit`), nút phụ "Xem bảng giá". Thẻ câu hỏi mẫu bên phải, câu sau mờ dần, nút "Xem thêm" → `/dashboard`.
- Không modal. Hướng dẫn sau khi tạo case = `Alert` ở Tổng quan, 3 dòng: điền template → chấm bài → sửa theo báo cáo, kèm nút mở template ý tưởng. Không localStorage.
- Gộp sửa landing và 2 file dashboard trong một đợt.
- **Giữ email và số điện thoại cá nhân** ở khối liên hệ (user đổi ý so với prototype đã bỏ). Zalo vẫn là kênh chính, qua `NEXT_PUBLIC_ZALO_GROUP_URL`.
- **Font Inter Tight cho toàn app** (không chỉ landing).
- Bài viết trên landing lấy từ server (SSR), 3 bài `/news`. Giá 79,000 VND một thẻ, bỏ nhãn "Khuyên dùng". Giai đoạn 4 hiển thị "Sắp ra mắt".
- Báo cáo mẫu = **ảnh chụp trang 1 PDF thật** (đã che tên dự án + Job ID), file `apps/web-1/public/landing/report-sample.png` (1323×1290), gắn bằng `next/image`, không dựng lại bằng UI. Không ghi tên nhóm/dự án/điểm vào docs hay code.
- **Cách dựng:** bắt chước giao diện https://ai-software-two.vercel.app/ bằng thông số đo (không chép mã, không hotlink ảnh), chỉ áp cho landing. Token/keyframes nằm dưới `.landing` (CSS module), biến `--lp-*`, keyframes `lp-*`; không đưa vào `globals.css`. Chỉ font Inter Tight là toàn app.
- **Landing chỉ giao diện sáng** (như trang tham khảo); dark mode landing ghi là không hỗ trợ, không phải blocker.
- Không hiển thị CP1/CP2/Checkpoint trên UI người dùng. Tiền dùng `formatPrice`. Admin chỉ desktop.

## Phase 1: Font toàn app (độc lập, làm trước)

- [ ] `apps/web-1/app/layout.tsx`: thay `Google_Sans_Flex` bằng `Inter_Tight` (`subsets: ["latin","vietnamese"]`, đủ weight 400/500/600/700, `display: "swap"`), đổi tên biến `--font-inter-tight`. Giữ Merriweather.
- [ ] `apps/web-1/app/globals.css` dòng 46-48, 183, 188 và `apps/web-1/app/providers.tsx` dòng 29, 35: trỏ sang `--font-inter-tight`.
- [ ] Tìm mọi chỗ còn nhắc Google Sans Flex (docs, `design-system/wording`, AGENTS) và cập nhật.
- [ ] Kiểm tra tiếng Việt có dấu, số dùng `tabular-nums` chỗ có bảng số, và chiều rộng admin/student không vỡ.

## Phase 2: Landing

- [ ] Đọc `apps/web-1/AGENTS.md` và `design-system/wording/` trước.
- [ ] Đo thêm trang tham khảo: khoảng cách section, lưới/container, bậc chữ, breakpoint, thứ tự hiện dần; chụp từng section 1440 và 390 làm mốc so sánh.
- [ ] Dựng `components/landing/*`: hero (hai cột), "Sau khi điền xong" (ảnh báo cáo thật), "Hành trình 4 giai đoạn", giá một thẻ, 3 bài viết, FAQ 2 cột (giữ nguyên văn 5 câu), liên hệ, footer.
- [ ] Token `--lp-*`, keyframes `lp-*` và hook `useReveal` chỉ trong `components/landing/`.
- [ ] Thẻ câu hỏi hero lấy từ `@repo/validation` bằng server component (không gọi API); đối chiếu nguyên văn Không đạt/Đạt với catalog. Xác nhận `@repo/validation` có trong `apps/web-1/package.json`.
- [ ] 3 bài viết: server fetch, link tới `/news/[slug]`. Tiêu đề từ metadata, không suy từ slug.
- [ ] Mantine + Tailwind v4, Lucide icon, không bóng trên Card/Paper, không class định vị Tailwind trên Modal/Drawer. Mỗi file ≤ 200 dòng (tách component).
- [ ] CTA dính trên mobile (chỉ hiện sau khi cuộn qua hero). Anchor trên desktop khớp mobile.
- [ ] `prefers-reduced-motion`, focus ring, skip link, meta + `og:image`, link pháp lý.

## Phase 3: Dashboard (cùng đợt)

- [ ] `app/dashboard/_components/DashboardEmptyState.tsx`: nút chính = **tạo case**, `team-fit` xuống nút phụ hoặc bỏ.
- [ ] `app/dashboard/case/[id]/_components/overview/*`: thêm `Alert` hướng dẫn 3 dòng + nút mở template ý tưởng (`?tab=journey&stage=y-tuong&view=draft`). Không trùng `ContactNextStepCard` / `OverviewHero` (chỉ hiện đúng thứ tự, tránh chồng).

## Phase 4: Kiểm tra

- [ ] `bun run check-types`, `bun run lint` (zero warnings).
- [ ] Mở trình duyệt thật: desktop 1440, tablet 768, mobile 390 (landing chỉ light); quét bàn phím.
- [ ] So sánh cạnh nhau với trang tham khảo ở 1440 và 390 rồi sửa đến khi giống.
- [ ] Mở dashboard và admin trước/sau: không đổi gì ngoài font.
- [ ] Hồi quy: đăng nhập → danh sách case → tạo case → Tổng quan hiện `Alert` → mở template.
- [ ] Cập nhật docs/changelog, commit theo phase.

## Việc còn mở (không chặn code, đánh dấu trong PR)

1. ~~Xin phép nhóm dùng ảnh báo cáo~~ — user tự lo, đã chọn dùng ảnh thật.
2. Hai tiêu đề bài viết (khách nói không có nhu cầu / làm sao viết tốt hơn) chưa xác nhận từ API.
3. Duyệt từng dòng chữ mới tôi viết (chip, "Sau khi điền xong", "Hành trình", chú thích ảnh).
4. Giai đoạn 3 phải mở khóa trước khi landing ra (landing nói 4 giai đoạn). Ngoài phạm vi redesign.
5. Nhãn nút "Kiểm tra nhanh ý tưởng" nay dẫn tới tạo case; có thể đổi nhãn sau.
