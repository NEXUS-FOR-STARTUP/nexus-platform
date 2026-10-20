# Landing redesign: toàn bộ thông tin hiện có

Ngày: 2026-10-18. Nhánh: `feat/landing-redesign` (từ `dev` @ `931dbc5`). Chưa implement dòng code nào.

## 1. Hiện trạng landing (đọc từ code, render thật ở 1440 và 390)

- Nguồn: `apps/web-1/app/page.tsx` + `components/landing/` (`LandingHero`, `FeaturesGrid`, `LandingPricing`, `FAQSection`, `ContactUs`, `HeroBullets.module.css`) + `components/layout/AppShell.tsx` + `app/globals.css`.
- Năm khối xếp chồng: hero, lưới 4 tính năng, một thẻ giá, FAQ accordion, danh sách liên hệ.
- Font toàn app: Inter Tight (`--font-inter-tight`, `app/layout.tsx`, `globals.css`, `providers.tsx`). Merriweather có nhưng landing không dùng.
- Dev server chạy được, API `:8000` tắt nên `get-session` lỗi và header hiện "Đăng nhập" (môi trường, không phải lỗi landing).

### Vấn đề thị giác
Hero chữ nằm trái, 40% bên phải trống; `hero_illustration.png` có nhưng không dùng; chip xanh Mantine mặc định; không có nhận diện, màu cam `--color-accent-warm` có trong `globals.css` nhưng landing không dùng; lưới 4 thẻ giống nhau với icon không khớp nội dung (CPU cho "lỗ hổng lập luận") và 4 màu khác nhau; thẻ giá đơn lẻ có nhãn "Khuyên dùng" khi chỉ có một gói, nhãn chồng tiêu đề ở 390px; FAQ accordion trong card trong section; liên hệ 5 hàng ngang trọng lượng; footer mỏng; chữ 12px; tiêu đề section Title Case lẫn sentence case; thêm "(FAQ)"; không hover/press ngoài nút hero, không chuyển động.

### Vấn đề UX
Không thấy sản phẩm (không báo cáo mẫu); CTA chính mơ hồ (hero → `/dashboard/team-fit`, giá → `/dashboard/intake`); mục "Quy trình" liệt kê tính năng chứ không phải các bước; không dấu hiệu tin cậy; desktop nav chỉ có "Bài viết", anchor chỉ có trong drawer mobile; không CTA dính; email và số điện thoại cá nhân công khai.

### Nên giữ
Nội dung tiếng Việt, cụ thể, không thổi phồng; định dạng giá `79,000 VND`; cấm nhãn CP1/CP2 trên UI; logo, theme sáng/tối, Mantine + Tailwind v4; cấu trúc anchor, link pháp lý, FAQ thật về dữ liệu.

## 2. Câu trả lời của user qua các vòng

**Vòng 1.** Khách: sinh viên môn khởi nghiệp, biết Nexus qua Facebook/TikTok/truyền miệng. Hành động chính: **làm rõ ý tưởng** (mua 79k là phụ, không muốn làm CTA chính). Không thích: giao diện không điểm nhấn, khách vào là rời đi, không hiểu giá trị. Cá tính: người bạn thân thiện trong cộng đồng sinh viên. Giữ: logo, nguyên văn văn bản (tiêu đề, mô tả, FAQ, bảng giá); màu xanh nghiêm túc một chút.

**Vòng 2.** Template 4 giai đoạn đã có trong repo (`packages/validation/src/catalogs/`, `cp1`..`cp4` + `questions-cp*.ts`, ~103 câu kèm hướng dẫn trả lời, `FILE_TEMPLATE_REGISTRY` cho file mẫu). Hành trình mong muốn: landing hiện vài câu hỏi + hướng dẫn → "Xem thêm" → đăng nhập → danh sách case → tạo case → Tổng quan có hướng dẫn → template. Màu: giữ xanh nghiêm túc, cam nhẹ làm điểm nhấn; logo hiện có 3 màu (xanh dương, xanh lá, cam lan).

**Vòng 3.** Báo cáo mẫu: dùng một báo cáo tự động của một nhóm sinh viên (đoạn ít thuật ngữ nhất). Hướng dẫn: **`Alert`**, không modal; không lưu "đã xem". Gộp hai file dashboard + landing một đợt. Bài viết SSR. Ba bài từ `/news` làm link.

**Vòng sau.** Hướng B. Prototype HTML được duyệt bố cục. Giữ email + điện thoại cá nhân. **Inter Tight toàn app.**

## 3. Luồng sản phẩm (scout code)

- `proxy.ts:78-80`: chưa có cookie session → `/dashboard*`, `/admin*`, `/writer*` chuyển tới `/auth?returnUrl=...`; sau đăng nhập `returnUrl` được giữ.
- Danh sách case trống: `DashboardEmptyState.tsx`, nút chính hiện là "Đánh giá đội ngũ miễn phí" (team-fit), nút phụ "Bắt đầu kiểm tra dự án" (tạo case) → **đảo lại**.
- Tạo case: `CreateProjectModal` (7 trường), tạo xong chuyển vào `/dashboard/case/[id]`.
- Tổng quan: `OverviewHero` ("Việc tiếp theo") chỉ hiện khi đã điền thông tin liên hệ; trước đó `ContactNextStepCard` (alert vàng) trỏ `?tab=settings`. Cần chọn vị trí `Alert` hướng dẫn mới không đè hai khối này.
- Journey shell bật bởi `NEXT_PUBLIC_JOURNEY_WORKSPACE=true`. Stage ý tưởng: `?tab=journey&stage=y-tuong&view=draft`. Tab `overview|journey|billing|timeline|settings`.
- Giai đoạn 3 và 4: code có `available: true` cho ý tưởng và thị trường; giai đoạn 4 là "coming soon"; giai đoạn 3 cần mở khóa trước khi landing nói "4 giai đoạn".
- 2 lượt chấm đi kèm 79,000 VND; "Chấm bài" bắt đầu khi hết lượt thì "Mua lượt chấm" (`PackageSelectionModal`).
- Trang `/news`: render phía client từ API `/api/news` (revalidate 60). Bài viết `NewsTipTapRenderer`, bảng dữ liệu trong DB, không có seed offline.
- Ba bài đã biết: "Cách tính TAM, SAM, SOM cực đơn giản cho dự án khởi nghiệp" (09/10/2026, xác nhận qua metadata); slug `lam-sao-de-viet-tot-hon-trong-thoi-dai-ai-slop-bk5t`; slug `khach-noi-co-nhu-cau-da-thu-san-pham-nhung-ho-co-mua-khong`. Hai tiêu đề sau suy từ slug, chưa xác nhận.

## 4. Báo cáo mẫu cho landing

- Nguồn: báo cáo tự động (PDF 11 trang) của một nhóm sinh viên, nằm ở thư mục hỗ trợ các nhóm bên ngoài repo. **Cố ý không ghi đường dẫn, tên nhóm, tên dự án, Job ID hay điểm số ở đây** vì nhóm chưa cho phép và report này được commit vào git.
- Báo cáo do ChatGPT + WeasyPrint tạo, chưa phải báo cáo Typst của Nexus.
- Ảnh trang 1 đã che tên dự án và Job ID (1323×1290) được đưa vào repo tại `apps/web-1/public/landing/report-sample.png` và dùng thẳng trên landing. Việc xin phép nhóm do chủ dự án tự xử lý, không thuộc phạm vi implement.
- Không ghi tên nhóm/dự án/điểm vào docs hay code; ảnh là nguồn duy nhất của chi tiết đó.
- Mockup trong landing KHÔNG dùng tên thật, KHÔNG dùng persona thật.

## 5. Tham chiếu thiết kế: https://ai-software-two.vercel.app/ (NextSaaS)

Chỉ lấy thông số, **không sao chép mã, HTML hay ảnh** (template trả phí có nút Purchase; đã đo qua `getComputedStyle`).

| Thành phần | Thông số đo |
|---|---|
| Font | Inter Tight, tiêu đề hero 68px / weight 500 / line-height 1.1 |
| Tiêu đề section | 52px / 400 |
| Nút chính | nền `#1A1A1C`, chữ trắng, padding `14px 32px`, cao 54px, pill |
| Nút phụ | nền `#FCFCFD`, viền `#D7DDE5` |
| Chip | nền `#FDF7BC`, pill `6px 20px`, chữ 14px |
| Card | bo 20px, trắng, viền `1px #DFE4EB`, không bóng |
| Khối lớn | bo 32px, nền `#F4F5F8` |
| Section xen kẽ | `#FFFFFF` và `#F4F5F8` / `#F9FAFB` |
| Chuyển động | `0.5s cubic-bezier(0.4,0,0.2,1)`; keyframes `fadeInUp` (20px), `slideUp` (15px), `gradientFadeIn` (scale 0.9→1) |

Điều học được: nền sáng, chữ lớn nhẹ, viền mảnh không bóng, nhiều khoảng trắng, mockup sản phẩm dưới hero. Không lấy: hào quang tím/xanh, ảnh avatar người, demo "Purchase / 48+ Pre-built demos".

## 6. Stitch

- Project: `projects/9626890615167454132` ("Nexus Landing - 3 hướng A/B/C"); design system `assets/f81feacd24d24aa684fbd1114bfc9023` ("Nexus Evaluation Engine", Plus Jakarta Sans + Inter).
- Màn: A, B, C (bản đầu) + A v2, B v2, C v2 (phong cách trang tham khảo). User chọn **B v2**.
- Stitch hay timeout 60s nhưng vẫn tạo; mỗi màn xuất hiện sau 3-10 phút. Không gọi lại khi timeout, chỉ list.
- Stitch tự bịa số ("15 câu hỏi"), tên 5 tiêu chí có đuôi tiếng Anh, mô tả hero, cảnh báo "Rủi ro cao tại vòng Hội đồng". Không lấy các chữ này.

## 7. Prototype HTML hướng B

- `plans/261018-1520-landing-redesign/prototype/index.html` + `logo.svg` + `report-sample.png`, `-2.png`, `-3.png` cùng thư mục (tự chứa, mở thẳng bằng trình duyệt). Ảnh báo cáo cũng có bản ở `apps/web-1/public/landing/` cho code thật.
- Đã kiểm: 1440 và 390, không tràn ngang, ảnh báo cáo đúng tỷ lệ, CTA dính hiện sau hero, `.stage.soon h3` xám, hero/sticky CTA → `/dashboard`.
- Chưa kiểm: dark mode, tablet 768, bàn phím/screen reader.

Cấu trúc: hero hai cột (trái tiêu đề + 3 gạch + CTA, phải thẻ "Khách hàng chính của nhóm là ai?" với khối Không đạt đỏ nhạt và Đạt xanh nhạt, hai câu sau mờ dần, nút "Xem thêm"); "Sau khi điền xong / Nexus phản biện lại" + ảnh báo cáo; "Hành trình" 4 giai đoạn (4 = Sắp ra mắt, viền đứt); thẻ giá 79,000 VND; 3 bài viết; FAQ 2 cột; liên hệ gọn, Zalo là nút chính; footer đơn giản.

## 8. Việc chữ mới do assistant viết (chưa duyệt)

Chip "Phản biện dự án khởi nghiệp"; "Sau khi điền xong"; "Nexus phản biện lại"; "Hành trình"; "Bốn giai đoạn, từng bước một"; "Đọc trước khi bắt đầu"; "Bài viết hướng dẫn"; "Sắp ra mắt"; chú thích dưới ảnh báo cáo ("Trang đầu một báo cáo phản biện thực tế. Tên dự án đã được ẩn."). Tiêu đề, mô tả, 3 gạch đầu dòng, FAQ, giá: nguyên văn của user.

## 9. Ràng buộc kỹ thuật (từ AGENTS)

Next.js 16 (đọc `node_modules/next/dist/docs/` trước khi code), Mantine v9, Tailwind v4, TanStack Query, Lucide, không `apiClient` trong UI, không try/catch trong component, file ≤ 200 dòng, không bóng trên Card/Paper, không class định vị Tailwind trên Modal/Drawer, không thêm responsive cho Admin (desktop-only), một `.env` gốc, từ vựng tiếng Việt theo `design-system/wording/`.

Font: `Inter_Tight` từ `next/font/google`. Rủi ro: đổi toàn app → kiểm admin dashboard và student workspace; PDF báo cáo dùng Typst nên không ảnh hưởng.

## 10. Việc còn mở

1. Phép dùng ảnh báo cáo mẫu của nhóm sinh viên.
2. Hai tiêu đề bài viết chưa xác nhận; ảnh bìa bài viết lấy từ API.
3. Duyệt chữ mới (mục 8).
4. Mở khóa giai đoạn 3.
5. Nhãn nút "Kiểm tra nhanh ý tưởng" dẫn tới tạo case.
6. Số "22 câu hỏi" (giai đoạn 1) chưa dùng trên landing.
7. Email và số điện thoại cá nhân công khai: user chọn giữ; ghi nhận rủi ro (spam, lộ danh tính) nhưng đây là quyết định đã chốt.
