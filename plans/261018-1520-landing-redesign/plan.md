---
title: "Redesign landing (hướng B) + dẫn khách vào tạo case + Inter Tight toàn app"
description: "Landing đưa việc làm được ngay lên đầu: hai chồng thẻ kéo được (câu hỏi mẫu, báo cáo mẫu), nút chính vào /dashboard, khối hướng dẫn ở Tổng quan case, font Inter Tight toàn app."
status: pending
priority: P2
effort: 18h
tags: [web-1, landing, ux, dashboard, font]
blockedBy: []
blocks: []
created: 2026-10-18
updated: 2026-10-18
branch: feat/landing-redesign
---

# Redesign landing hướng B

Thông tin nền (chẩn đoán, đo trang tham khảo, hiện trạng code): [report](../reports/261018-landing-redesign-context.md). **Đọc report trước khi code.** Phần 7 của report (prototype) đã cũ; khi lệch, plan này là nguồn đúng.

**Prototype đã duyệt:** [prototype/index.html](prototype/index.html) (commit `c7f21b2`). Tự chứa: `logo.svg`, `hero-bg.mp4`, `hero-poster.jpg`, 3 ảnh báo cáo cùng thư mục; mở thẳng bằng trình duyệt, cần mạng tải font. Chỉ để tham khảo, **không phải mã production**. Mọi giá trị CSS/JS bên dưới đã đo trong prototype.

## Quyết định đã chốt (đừng hỏi lại)

**Phạm vi và nội dung**
- Hướng **B**: "Đưa việc làm được ngay lên đầu". Nút chính **"Kiểm tra nhanh ý tưởng" → `/dashboard`** (không còn `/dashboard/team-fit`), nút phụ "Xem bảng giá".
- Không modal. Hướng dẫn sau khi tạo case = `Alert` ở Tổng quan, 3 dòng: điền template → chấm bài → sửa theo báo cáo, kèm nút mở template ý tưởng. Không localStorage.
- Gộp sửa landing và 2 file dashboard trong một đợt.
- **Giữ email và số điện thoại cá nhân** ở khối liên hệ. Zalo là kênh chính, qua `NEXT_PUBLIC_ZALO_GROUP_URL`; Facebook, TikTok là link phụ.
- Giá 79,000 VND một thẻ qua `formatPrice`, bỏ nhãn "Khuyên dùng". Giai đoạn 4 hiển thị "Sắp ra mắt". Không hiển thị CP1/CP2/Checkpoint trên UI.
- Landing chỉ giao diện sáng (dark mode landing không hỗ trợ, không phải blocker). Admin chỉ desktop.

**Font:** Inter Tight cho **toàn app** (Phase 1). Mantine theme không có `defaultRadius`; **không đổi theme toàn app**, mọi token bo góc/viền chỉ nằm trong landing.

**Hai chồng thẻ kéo được (kiểu Quizlet), cùng một hook**
- Chồng **báo cáo mẫu**: 3 ảnh thật đã che tên dự án + Job ID (`public/landing/report-sample.png` 1323×1290, `-2.png` 1323×2026, `-3.png` 1323×1871). Mỗi thẻ cùng `aspect-ratio: 1.05`, ảnh dài hơn bị **cắt đuôi** (`width: 100%; height: auto`, thẻ `overflow: hidden`). Thêm ảnh thứ 4 trở đi chỉ cần thêm một phần tử vào mảng. Link "Mở cả trang" luôn trỏ ảnh gốc của thẻ trên cùng. Không ghi tên nhóm/dự án/điểm vào docs hay code.
- Chồng **câu hỏi mẫu** (hero): 3 thẻ, mỗi thẻ có 1 câu đầy đủ (kèm Không đạt/Đạt) và câu kế mờ dần ở đuôi kèm "Xem thêm" → `/dashboard`. Sáu câu riêng, không lặp:

| Thẻ | Câu đầy đủ | Câu mờ ở đuôi |
|---|---|---|
| 1 | `cp1_primary_customer` | `cp1_customer_story` |
| 2 | `cp1_main_problem` | `cp1_non_priority_customer` |
| 3 | `cp1_idea_name` | câu đầu của giai đoạn Thị trường (CP2) |

Văn bản câu hỏi, giải thích, ví dụ Không đạt/Đạt lấy từ `@repo/validation` bằng server component. **Đối chiếu nguyên văn với catalog**: các câu `cp1_customer_story` và `cp1_non_priority_customer` trong prototype là bản tôi tóm lại, phải thay bằng văn bản thật. Nhãn "Giai đoạn Ý tưởng · Câu N" và "Giai đoạn Thị trường · Câu 1" lấy theo vị trí thật trong catalog, không gõ cứng số của prototype.

**Hành vi chồng thẻ (đã thử trong prototype)**
- Bấm thẻ trên cùng: bay ra **trái-xuống** (vector `(-1, 0.35)`), xoay ∓8°, rồi chui xuống cuối chồng; thẻ kế nổi lên. Kéo giữ: thẻ đi theo con trỏ, xoay `dx × 0.04`°. Thả xa hơn `FLING_MIN = 90px` thì bay theo hướng kéo; ngắn hơn thì bật về. Kéo trên `DRAG_MIN = 6px` mới tính là kéo (dưới đó là bấm).
- Thời gian: bay ra `320ms`, khóa thao tác thêm `450ms` sau khi đặt lại; transition `0.45s var(--ease)`. Tất cả là hằng số đặt tên, không số trần trong code.
- Thẻ phía sau lệch lên-phải `14px` mỗi lớp (`translate(i × 14px, i × -14px)`), nội dung thẻ sau ẩn (`opacity: 0`, `inert`, `aria-hidden`) để không lộ chữ xuyên và không focus được.
- Bàn phím: Enter, Space, ← bay trái-xuống; → bay phải-xuống. Thẻ có link bên trong ("Xem thêm") thì link vẫn bấm được và **không** làm lật thẻ; khi đó chồng nhận `tabIndex=0`.
- Mobile: `touch-action: pan-y` để cuộn dọc trang vẫn chạy; kéo ngang hoặc chéo thiên về ngang mới lật. Bấm vẫn lật.
- `prefers-reduced-motion`: bỏ transition ở thẻ và nội dung, thời gian bay ra = 0. Không bật JS: các thẻ xếp dọc, báo cáo có link "Trang 2/3" trong `noscript`.

**Token landing (CSS module, dưới `.landing`, biến `--lp-*`)**

| Nhóm | Token |
|---|---|
| Bo góc | `--lp-r-md: 16px` (mọi thẻ, kể cả hai loại thẻ chồng), `--lp-r-sm: 12px` (khối con trong thẻ, viền focus), `--lp-r-pill: 999px` (nút, badge, tag, nav, thanh CTA dính, số thứ tự). **Chỉ ba mốc này.** |
| Viền | `--lp-line: #dfe4eb`, `--lp-line-strong: #d3dae6` (thẻ chồng), `--lp-chip-line: #b4c9fb` (badge, hover thẻ) |
| Nền badge | `--lp-chip-bg: #dfe9ff` (đủ đậm để thấy rõ trên nền trắng), chữ `--lp-blue-dark: #1d4ed8` |
| Bóng | `--lp-shadow-float: 0 22px 40px -26px rgba(26,26,28,.4)` chỉ cho hai loại thẻ chồng; không bóng trên Card/Paper còn lại |
| Màu | `--lp-ink #1a1a1c`, `--lp-muted #454b59`, `--lp-blue #2563eb`, `--lp-orange #f97316` (nút chính, Đăng nhập), nền section `#f4f5f8` |
| Chuyển động | `--lp-ease: cubic-bezier(.4, 0, .2, 1)` |

Keyframes/hook dùng tiền tố `lp-*`, không đưa vào `globals.css`.

**Nút (thống nhất màu):** nút chính và **Đăng nhập** đều cam (`--lp-orange`), Đăng nhập nhỏ hơn (cao 44px); nút phụ "Xem bảng giá" trắng viền; "Đọc thêm" ở thẻ bài viết xanh nhạt (hover xanh đậm), căn phải, **không mũi tên, không gạch chân khi hover**.

**Kính mờ (do user yêu cầu):** chỉ thanh nav (`blur(25px)`, nền trắng 60%) và thanh CTA dính mobile (`blur(25px)`). **Badge/chip dùng nền đặc `--lp-chip-bg` + viền `--lp-chip-line`, không kính mờ** (kính làm badge nhạt, khó thấy trên nền trắng). Không thêm kính nơi khác.

**Hero:** video nền `hero-bg.mp4` (1280×720, không tiếng, ~0,53 MB) + `hero-poster.jpg`, lớp phủ trắng 80% mờ dần xuống 100% ở đáy; dừng ở khung poster khi giảm chuyển động. Bốn bong bóng icon Lucide nổi, ẩn dưới 1360px, `animation: none` khi giảm chuyển động. Copy hai file vào `apps/web-1/public/landing/` khi dựng thật.

**Icon:** Lucide (`lucide-react` đã có trong dự án). Danh sách lấy đúng theo các `<symbol id="i-...">` trong sprite của prototype; không thêm icon mới.

**Bài viết (3 thẻ):** mỗi thẻ có **tag = chuyên mục**, **ngày đăng** (`dd/MM/yyyy`) và nút "Đọc thêm" căn phải. Server fetch qua `fetchPublicNewsList` (`apps/web-1/lib/news-server.ts`), không gõ cứng. Tag lấy từ trường `category` qua `getNewsCategoryName`, ngày từ `published_at`. Ba bài trong prototype (chốt ngày 18/10/2026, chỉ là dữ liệu mẫu):

| Bài | Tag | Ngày |
|---|---|---|
| Cách tính TAM, SAM, SOM cực đơn giản… | Khởi nghiệp | 09/10/2026 |
| Khách nói có nhu cầu, đã thử sản phẩm, nhưng họ có mua không? | Khởi nghiệp | 16/10/2026 |
| Làm sao để viết tốt hơn trong thời đại AI slop | Quan điểm - Tranh luận | 06/10/2026 |

Ảnh bìa dùng `cover_image_url` của bài (prototype để ô xám). Chọn 3 bài theo slug cố định hay theo tag là việc mở (xem cuối).

## Phase 1: Font toàn app (độc lập, làm trước)

- [ ] `apps/web-1/app/layout.tsx`: thay `Google_Sans_Flex` bằng `Inter_Tight` (`subsets: ["latin","vietnamese"]`, weight 400/500/600/700, `display: "swap"`), biến `--font-inter-tight`. Giữ Merriweather.
- [ ] `apps/web-1/app/globals.css` (dòng 46-48, 183, 188) và `apps/web-1/app/providers.tsx` (dòng 29, 35): trỏ sang `--font-inter-tight`.
- [ ] Tìm mọi chỗ còn nhắc Google Sans Flex (docs, `design-system/wording`, AGENTS) và cập nhật.
- [ ] Kiểm tra tiếng Việt có dấu, số dùng `tabular-nums` chỗ có bảng số, bề rộng admin/student không vỡ.
- [ ] Commit phase.

## Phase 2: Landing

Mỗi file ≤ 200 dòng (tách component). Đọc `apps/web-1/AGENTS.md` và `design-system/wording/` trước.

- [ ] **Hook dùng chung** `components/landing/useCardStack.ts`: hằng số đặt tên (`DRAG_MIN`, `FLING_MIN`, `OUT_MS`, `LOCK_MS`, `STACK_OFFSET_PX`, `FLY_VECTOR`), trả về props cho từng thẻ và cho chồng; hỗ trợ con trỏ, bàn phím, `prefers-reduced-motion`, `inert` thẻ sau. Không dùng thư viện thêm.
- [ ] `CardStack.tsx` (client, bọc hook + CSS module) và hai nội dung: `QuestionStack.tsx`, `ReportStack.tsx`. Báo cáo dùng `next/image` (`width`/`height` thật, `alt` mô tả từng trang, `draggable={false}`).
- [ ] `LandingQuestionCards.tsx` (server component): đọc `QUESTION_REGISTRY`/`TEMPLATE_REGISTRY` từ `@repo/validation` (đã có trong `package.json`), dựng 3 cặp câu hỏi theo bảng trên, đối chiếu nguyên văn.
- [ ] `LandingHero.tsx` (hai cột: tiêu đề + 3 gạch đầu dòng nguyên văn hiện tại, video nền), "Sau khi điền xong" (`ReportStack`), "Hành trình 4 giai đoạn", giá một thẻ, `LandingArticles.tsx` (server fetch), FAQ 2 cột (giữ nguyên văn 5 câu), liên hệ, footer.
- [ ] `landing.module.css` (hoặc nhiều module nhỏ theo file ≤ 200 dòng) chứa token `--lp-*` ở bảng trên và keyframes `lp-*`.
- [ ] Chỉ ba mốc bo góc; chỉ `--lp-line*` cho viền. Không `border-radius` số trần ở ngoài khối token.
- [ ] Mantine + Tailwind v4, Lucide, không bóng trên Card/Paper (trừ hai chồng thẻ), không class định vị Tailwind trên Modal/Drawer.
- [ ] CTA dính trên mobile: chỉ hiện sau khi hero CTA cuộn khỏi màn hình (IntersectionObserver). Anchor desktop khớp mobile.
- [ ] `prefers-reduced-motion`, focus ring (`--lp-r-sm`), skip link, meta + `og:image`, link pháp lý ở footer, favicon.
- [ ] Commit phase.

## Phase 3: Dashboard (cùng đợt)

- [ ] `app/dashboard/_components/DashboardEmptyState.tsx`: nút chính = **tạo case**, `team-fit` xuống nút phụ hoặc bỏ.
- [ ] `app/dashboard/case/[id]/_components/overview/*`: thêm `Alert` hướng dẫn 3 dòng + nút mở template ý tưởng (`?tab=journey&stage=y-tuong&view=draft`). Không trùng `ContactNextStepCard`/`OverviewHero`; chỉ hiện đúng thứ tự, tránh chồng.
- [ ] Commit phase.

## Phase 4: Kiểm tra

- [ ] `bun run check-types`, `bun run lint` (zero warnings).
- [ ] Mở trình duyệt thật: desktop 1440, tablet 768, mobile 390 (landing chỉ light); quét bàn phím.
- [ ] **Hai chồng thẻ:** bấm; kéo ngắn (bật về); kéo xa (chuyển); Enter/Space/←/→; "Xem thêm" không lật thẻ; cuộn dọc trên điện thoại không bị chặn; giảm chuyển động; không bật JS (xếp dọc). Thử trên điện thoại thật (prototype chỉ thử headless).
- [ ] So sánh cạnh nhau với prototype ở 1440 và 390; kiểm đúng ba mốc bo góc (đo `getComputedStyle`: chỉ 16px, 12px, 999px).
- [ ] Mở dashboard và admin trước/sau: không đổi gì ngoài font.
- [ ] Hồi quy: đăng nhập → danh sách case → tạo case → Tổng quan hiện `Alert` → mở template.
- [ ] Cập nhật docs/changelog, commit theo phase.

## Việc còn mở (không chặn code, đánh dấu trong PR)

1. Chọn 3 bài trên landing theo slug cố định hay theo tag/mới nhất. Prototype dùng 3 bài ở bảng trên.
2. Duyệt từng dòng chữ mới tôi viết (badge, "Sau khi điền xong", "Hành trình", chú thích ảnh, dòng hướng dẫn "Bấm vào thẻ hoặc kéo sang trái…").
3. Giai đoạn 3 phải mở khóa trước khi landing ra (landing nói 4 giai đoạn). Ngoài phạm vi redesign.
4. Nhãn nút "Kiểm tra nhanh ý tưởng" nay dẫn tới tạo case; có thể đổi nhãn sau.
5. Chưa thử: chồng thẻ trên điện thoại thật, Safari/Firefox (kính mờ cần `-webkit-backdrop-filter`, đã thêm trong prototype), tablet 768, tương phản chữ trong chồng thẻ ở trình đọc màn hình.
6. Chồng thẻ báo cáo cho ảnh thứ 4 trở đi: chưa có ảnh, chỉ thêm mảng khi có.
