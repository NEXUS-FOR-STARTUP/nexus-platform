# Nexus Typography Scale — Source of Truth

> **LOGIC:** File này là nguồn duy nhất cho phân cấp font size của Nexus Platform.
> Mọi UI code PHẢI dùng token trong bảng dưới — không hardcode size, không dùng size lạ.
> Khi build page, nếu `design-system/pages/[page-name].md` có override typography thì page đó ưu tiên, còn lại theo file này.

**Version:** v1
**Date:** 2026-08-10
**Stack mapping:** Tailwind CSS v4 (`@theme` tokens) + Mantine UI v9 (`createTheme`)

---

## 1. Nguyên tắc (Principles)

1. **Body ≥ 16px** — UI tiếng Việt, dấu thanh dễ đọc. Không nhỏ hơn 16px cho nội dung chính.
2. **Caption ≥ 12px** — không xuống dưới 12px cho bất kỳ text nào.
3. **Tỉ lệ ~1.25 (major third)** cho tầng heading, ~1.125 cho tầng trung.
4. **Semantic, không phải visual** — chọn size theo vai trò (title/body/meta/label), không theo sở thích.
5. **Một scale, hai mapping** — Tailwind class và Mantine size là 2 mặt của cùng token, phải đồng bộ.
6. **Label uppercase** luôn kèm `tracking-wider` + `font-semibold` + `text-xs` (micro label).
7. **Heading dùng `font-heading`**, body dùng `font-body`. Font family hiện tại: Google Sans Flex (cả 2, có thể tách sau).

---

## 2. Scale (9 nấc)

| Token | Tailwind | Mantine | Size | Line-height | Weight | Vai trò |
|-------|----------|---------|------|-------------|--------|---------|
| display | `text-display` | — | 2.5rem / 40px | 1.15 | 700 | Hero, 404, khoảnh khắc lớn |
| h1 | `text-h1` | Title h1 | 2rem / 32px | 1.2 | 700 | Page title |
| h2 | `text-h2` | Title h2 | 1.625rem / 26px | 1.25 | 700 | Section title |
| h3 | `text-h3` | Title h3 | 1.375rem / 22px | 1.3 | 600 | Sub-section / card title lớn |
| h4 | `text-h4` | Title h4 | 1.125rem / 18px | 1.4 | 600 | Card title / group heading |
| lead | `text-lg` | Text lg | 1.0625rem / 17px | 1.6 | 400 | Đoạn mở đầu, body nhấn |
| body | `text-base` | Text md | 1rem / 16px | 1.6 | 400 | **Body mặc định** |
| small | `text-sm` | Text sm | 0.875rem / 14px | 1.5 | 400 | Meta, secondary, nav |
| caption | `text-xs` | Text xs | 0.75rem / 12px | 1.4 | 500 | Label, timestamp, micro |

---

## 3. Semantic Usage Rules (BẮT BUỘC)

| Vai trò | Token | Ví dụ |
|---------|-------|-------|
| Page title (mỗi page 1 cái) | h1 | "Danh sách hồ sơ", "Quản lý hồ sơ" |
| Section title | h2 | "Câu hỏi thường gặp", "Tính năng" |
| Card title (grid card) | h4 | Tiêu đề case card |
| Card title lớn / workspace title | h3 | Tiêu đề chi tiết case |
| Đoạn mở đầu hero | lead | Slogan landing, intro paragraph |
| **Nội dung chính, paragraph, description** | **body (text-base)** | Mô tả case, nội dung report, FAQ answer |
| Meta, thời gian, secondary info | small (text-sm) | "2 giờ trước", email, badge text |
| Label micro, uppercase, timestamp | caption (text-xs) | "MÃ HỒ SƠ", "TRẠNG THÁI", thời gian trong bảng |
| Nav sidebar / mobile menu | small (text-sm) | Menu dashboard |

### Mantine `size=` mapping
```
Text size="xs" → caption (12px)
Text size="sm" → small (14px)
Text size="md" → body (16px)   ← mặc định nên là md
Text size="lg" → lead (17px)
Text size="xl" → h4 (18px)
```

### Tailwind class mapping
```
text-xs → caption (12px)
text-sm → small (14px)
text-base → body (16px)
text-lg → lead (17px)
text-h4 → 18px  |  text-h3 → 22px  |  text-h2 → 26px  |  text-h1 → 32px  |  text-display → 40px
```

---

## 4. Component Defaults

| Component | Size |
|-----------|------|
| Button label | `text-base` (16px) |
| Badge | `text-sm` (14px) |
| Table cell | `text-sm` (14px) |
| Table header | `text-xs` uppercase + tracking + semibold |
| Form input / Textarea | `text-base` (16px, chống zoom iOS) |
| Form label | `text-sm` semibold |
| Notification title | `text-base` semibold |
| Notification meta | `text-xs` |
| Alert banner title | `text-h3` (22px) |
| Alert banner text | `text-lg` (17px) |
| Error page title | `text-h3` (22px) |
| 404 number | `text-display` (40px) |

---

## 5. Anti-Patterns (CẤM)

- ❌ **Flatten scale**: override `--text-xs`/`--text-sm` thành 16px (đã từng xảy ra, gây mất phân cấp).
- ❌ Dùng `text-sm` cho body content — body phải `text-base`.
- ❌ Dùng `text-xs` cho paragraph — caption chỉ cho label/meta ngắn.
- ❌ Hardcode `fontSize: "16px"` rải rác trong component.
- ❌ Dùng `text-xl`/`text-2xl`/`text-4xl` (Tailwind default ngoài scale) — thay bằng `text-h1..h4`/`text-display`.
- ❌ Heading weight tùy tiện — h1/h2 = 700, h3/h4 = 600, body = 400.
- ❌ Size dưới 12px.
- ❌ Dùng 2 nguồn size cho cùng 1 element (vd: Mantine `size="sm"` + Tailwind `text-sm` cùng lúc — chỉ 1).

---

## 6. Responsive

- **Mobile (< 768px):** giảm 1 nấc cho display/h1/h2 nếu cần: display 40→32, h1 32→26, h2 26→22. Body/small/caption giữ nguyên.
- Không scale toàn bộ bằng viewport unit (clamp/vw) — giữ rem.
- Test: 375px, 768px, 1024px, 1440px.

---

## 7. Implementation Reference

- **Tailwind tokens:** `apps/web-1/app/globals.css` → block `@theme`
- **Mantine mapping:** `apps/web-1/app/providers.tsx` → `createTheme({ fontSizes, headings })`
- **File này là canonical** — nếu code lệch file này thì sửa code, không sửa file.

---

## 8. Pre-Delivery Checklist

- [ ] Body content dùng `text-base` (16px), không còn `text-sm` cho paragraph
- [ ] Caption chỉ cho label/meta ngắn (12px)
- [ ] Không còn override flatten `--text-xs`/`--text-sm` = 1rem
- [ ] Mantine Title order / Tailwind heading class nhất quán theo bảng
- [ ] Không còn `text-xl`/`text-2xl`/`text-4xl` lạc scale
- [ ] Heading weight theo scale (700/600)
- [ ] Contrast đạt 4.5:1, Vietnamese render đủ dấu
