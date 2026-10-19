# Lọc skill UI qua quy tắc Nexus

Chủ dự án yêu cầu luôn gọi skill taste. Đã đọc `design-taste-frontend` (taste v2) và `minimalist-ui`. `AGENTS.md` ghi rõ: skill UI là **tham chiếu, không phải nguồn sự thật**; Nexus Frontend UI/UX Rules v2 (`.agents/rules/frontend-ui-rules.md`) thắng.

Phạm vi của skill: taste v2 tự ghi **"Not for dashboards or app screens"** và dành cho trang công khai. Plan này dùng **bộ "House rules" + luật chữ/màu/khoảng cách** làm bộ kiểm, không chạy `draw.mjs` (skill nói: component/màn đơn lẻ thì bỏ bước draw, khớp thiết kế xung quanh). Hai mockup REPORT đã chạy `lint.mjs` (0 FAIL) và ghi `taste-skill-ignore` cho viền Paper.

## Bảng xung đột

| Quy tắc skill | Nexus | Quyết định |
|---|---|---|
| taste: không eyebrow, không đánh số, không chữ HOA nhỏ dãn chữ, không monospace ngoài code, không emoji, tối đa 2 typeface | Không mâu thuẫn | **Áp dụng** |
| taste: không gradient, không shadow lúc nghỉ, không glow, không kính mờ | `frontend-ui-rules` 6.3/6.4 cùng ý; ví hiện có gradient + 2 vòng tròn trang trí | **Áp dụng** (wallet bỏ gradient) |
| taste: không viền 1px, không đường kẻ mảnh | Paper `withBorder` là chuẩn Mantine/web-1; `frontend-ui-rules` 6.3 còn bắt viền | **Không áp dụng** cho Paper/Table/input (taste tự miễn cho bảng + form field). Giữ `taste-skill-ignore` như mockup |
| taste: nút phẳng, vuông hoặc tròn hẳn, bo 9-16px là "mặc định yếu" | web-1 dùng `radius="md"` 8px | **Không áp dụng**; giữ 8px |
| taste: tiêu đề tối đa 2 dòng mọi độ rộng | Hợp lý cho tiêu đề trang | **Áp dụng**, kiểm ở 390px |
| taste: chữ chạy ≥16px, màu mực đầy đủ; xám chỉ cho ghi chú | Mockup 16px thân, 14px ghi chú | **Áp dụng** |
| taste: sàn 4 ảnh thật, video, "fullness" mỗi màn | Chỉ dành landing; mockup REPORT cũng ghi `inspect.mjs` báo nặng vì lý do này | **Bỏ qua**; không đo |
| taste: lớp chuyển động ≥8 phần tử | Màn app, `prefers-reduced-motion` | **Bỏ qua**. Chỉ phản hồi bấm/hover; không animation vào trang |
| minimalist-ui: cấm Inter/Roboto | Inter Tight đã ship toàn app (landing plan phase 1, commit `78691ec`) | **Không áp dụng** |
| minimalist-ui: cấm Lucide | `AGENTS.md`: bắt Lucide | **Không áp dụng** |
| minimalist-ui: nhãn trạng thái pill HOA nhỏ dãn chữ | Mockup: chip chữ thường 14px | **Không áp dụng** (trái taste) |
| minimalist-ui: nền ấm `#F7F6F3`, chữ `#111`, serif tiêu đề | Token slate/brand đã có | **Không áp dụng** |
| minimalist-ui: scroll-entry, stagger, ambient gradient | App màn làm việc | **Bỏ qua** |
| minimalist-ui: không màu chính cho nền lớn | Khớp với đổi sidebar xanh → trắng (C-29) | Áp dụng (cùng hướng mockup) |
| minimalist-ui: `kbd`, faux-OS chrome | Không dùng | Bỏ qua |

## Cổng kiểm cho từng phase

1. `node C:\Users\ADMIN\.claude\skills\design-taste-frontend\scripts\lint.mjs <thư mục file đã sửa>`: 0 FAIL; mỗi WARN phải bào chữa được (viền Paper, font Inter Tight, nhãn phiên bản là WARN đã biết).
2. Ảnh chụp 1440 / 768 / 390 bằng `browser` (đăng nhập dev) so với mockup mở `file://`. `inspect.mjs` chỉ chạy nếu có URL không cần đăng nhập; trang dashboard cần phiên, nên dùng `browser` thủ công. Nói rõ trong báo cáo phase rằng `inspect.mjs` không chạy được cho trang có auth.
3. Không có test runner ở web-1 (`vitest`/`playwright` không tồn tại): cổng = `bun run check-types` + `bun run lint` (zero warnings) + smoke trình duyệt.
