# Phase 1: Nền chung (token, tabs, chip, hàng mở rộng, tiền)

Priority: P1 (chặn plan profile + wallet) · Status: Pending · Effort: 6h · Chủ sở hữu duy nhất của các file dưới (plan khác chỉ import).

## Context Links
- `reports/mantine-reuse-map.md`, `reports/gap-register.md` (C-24, C-28, C-31)
- `research/scout-03-shared-foundation.md` §1-3 (bảng token, theme, component trùng)
- Mockup tokens: `design-system/mockups/case-detail/css/base.css`; spec: `REPORT.md` §3, §11
- `apps/web-1/app/globals.css` (token :76-132, override Paper :196-216), `apps/web-1/app/providers.tsx`, `apps/web-1/lib/pricing.ts`

## Key insights
- Đã có: `--color-bg|surface|surface-soft|border|border-strong|text|text-muted|brand*|success|warning|danger(-soft)`. **Thiếu:** thang chữ 24/18/16/14, trọng lượng 400/500, `--field`, khoảng cách mục.
- `--app-text-xs/sm` = 16px ở ≥640px, heading ép 600 (`globals.css:188-191`). Sửa toàn cục kéo theo admin/supporter → **thêm biến mới, không sửa cũ** (Q3).
- Theme không có `defaultRadius` (mặc định `sm` 4px); mỗi chỗ gọi `radius="md"`. Landing plan cấm đổi theme toàn app → không đụng `providers.tsx`.
- Không có test runner ở web-1. Logic thuần mới (`formatVndAmount`) cần một file assert nhỏ.
- Chip: không tái tạo màu chữ riêng của mockup; `Badge variant="light"` tự thích ứng dark mode.
- `uncommitted --app-text-meta` ở `globals.css:78` là thay đổi của người dùng: **không đụng**.

## Requirements
- Biến CSS mới có giá trị sáng; không cần dark (kích thước, không phải màu).
- `UnderlineTabs` giữ nguyên `role`/`aria`/phím mũi tên của Mantine `Tabs`.
- `StatusChip` 1 component cho mọi trạng thái; tone cố định 5 loại.
- `ExpandableList` là component dùng chung cho lịch sử giao dịch (case) + ví + minh chứng.
- `formatVndAmount` luôn `1,000 VND`, kể cả 0; có dấu `+`/`-` tùy chọn.

## Architecture
```
globals.css            --ui-text-{title,section,body,note}, --ui-weight-{regular,medium}, --ui-gap-section, --ui-topbar-height
components/ui/
  underline-tabs.module.css + underline-tabs.ts   → export UNDERLINE_TABS_CLASSES (classNames cho Mantine Tabs)
  StatusChip.tsx                                   → <Badge variant="light" size="md" radius="sm">
  CopyIconButton.tsx                               → CopyButton + Tooltip + ActionIcon (aria-label, đổi icon Check 1.5s)
  expandable-list/ExpandableList.tsx + .module.css → Accordion variant="unstyled", prop rows[]
lib/pricing.ts         + formatVndAmount()
lib/pricing.format-vnd-amount.test.ts              → node:test + assert
```
`ExpandableList` API (tối thiểu): `<ExpandableList items={[{ id, summary: ReactNode, children: ReactNode }]} onOpen?={(id)=>void} />`. `onOpen` cho phép fetch lazy khi mở (C-02).

## Related code files
**Modify**
- `apps/web-1/app/globals.css`: thêm khối `:root { --ui-* }` ngay dưới khối biến hiện có.
- `apps/web-1/lib/pricing.ts`: thêm `formatVndAmount` (không đổi `formatPrice`, nó trả "Miễn phí" cho 0).

**Create**
- `apps/web-1/components/ui/underline-tabs.module.css`, `underline-tabs.ts`
- `apps/web-1/components/ui/StatusChip.tsx`
- `apps/web-1/components/ui/CopyIconButton.tsx`
- `apps/web-1/components/ui/expandable-list/ExpandableList.tsx`, `expandable-list.module.css`
- `apps/web-1/lib/pricing.format-vnd-amount.test.ts`

**Delete:** không.

## Implementation steps
1. Context7: tra Mantine v9 `Tabs` (variant `unstyled`, Styles API `classNames` keys `root|list|tab|panel`), `Accordion` (`variant="unstyled"`, keys `item|control|chevron|panel|label`), `Badge` (`variant="light"`). Ghi kết quả vào đầu `underline-tabs.module.css`. Nếu `unstyled` không còn: dùng `variant="default"` và ghi đè `list::before`.
2. `globals.css`: thêm
   ```css
   :root {
     --ui-text-title: 1.5rem;   /* 24px */
     --ui-text-section: 1.125rem; /* 18px */
     --ui-text-body: 1rem;      /* 16px */
     --ui-text-note: 0.875rem;  /* 14px */
     --ui-weight-regular: 400;
     --ui-weight-medium: 500;
     --ui-gap-section: 3rem;
     --ui-topbar-height: 4rem;  /* khớp DashboardShell h-16 */
   }
   ```
   Kiểm `DashboardShell.tsx:47` vẫn `h-16`; nếu đổi thì cập nhật biến.
3. `underline-tabs.module.css`: `.list` (không nền, không viền, `gap: 1.75rem`, `overflow-x: auto`), `.tab` (padding 0.75rem 0, màu `--color-text-muted`, `font-size: var(--ui-text-body)`, `font-weight: var(--ui-weight-regular)`, `border-bottom: 3px solid transparent`, `margin-bottom: -1px`?), `.tab[data-active] { color: var(--color-text); font-weight: var(--ui-weight-medium); border-bottom-color: var(--color-brand) }`, `.tab:focus-visible` dùng outline brand 2px. Không dùng `!important` trừ khi Mantine ép.
4. `underline-tabs.ts`: `export const UNDERLINE_TABS_CLASSES = { list: s.list, tab: s.tab } as const;` (kiểu `TabsProps['classNames']`).
5. `StatusChip.tsx` (≤40 dòng): `type ChipTone = "draft"|"ok"|"warn"|"error"|"neutral"`; map tone→Mantine color `blue|green|orange|red|gray`; render `Badge variant="light" size="md" radius="sm"` kèm `leftSection` tùy chọn. Export `ChipTone`.
6. `CopyIconButton.tsx`: nhận `value`, `label` (vd "Sao chép mã dự án"); `CopyButton` + `Tooltip` + `ActionIcon variant="subtle" size="md" aria-label`. Icon Lucide `Copy`/`Check`. Thay hai bản viết tay ở P3, P7.
7. `ExpandableList.tsx`: `Accordion variant="unstyled" chevron={<ChevronDown/>}`, `multiple`, mỗi item `Accordion.Item value=id > Control(summary) + Panel(children)`; `onChange` gọi `onOpen` cho id vừa mở. CSS: hàng `Paper`-like nền `--color-surface`, viền `--color-border`, bo 8px, khoảng cách 8px giữa hàng, chevron xoay khi `data-active` (chỉ `transform`).
8. `formatVndAmount(amount: number, opts?: { signed?: boolean }): string`: không hữu hạn → `"—"`; `Math.round`; dùng `Intl.NumberFormat("en-US")` (tạo một lần cấp module); `signed` thêm `+` khi dương; âm luôn `-`; hậu tố ` VND`.
9. Test (`node:test` + `node:assert/strict`): `0 → "0 VND"`, `79000 → "79,000 VND"`, `-50000 → "-50,000 VND"`, `100000 signed → "+100,000 VND"`, `NaN → "—"`, `1234.6 → "1,235 VND"`. Chạy `bunx tsx --test lib/pricing.format-vnd-amount.test.ts` (nếu `tsx` thiếu ở web-1, chạy từ root; **chưa xác minh**, báo nếu phải thêm dependency: không thêm).
10. `bun run check-types && bun run lint`.

## Todo
- [ ] Tra Mantine v9 qua context7, ghi vào CSS
- [ ] Token `--ui-*`
- [ ] `UnderlineTabs` classNames
- [ ] `StatusChip`
- [ ] `CopyIconButton`
- [ ] `ExpandableList`
- [ ] `formatVndAmount` + test
- [ ] check-types + lint sạch

## Success criteria
- Hai plan còn lại import được 4 component + 1 hàm, không phải sửa nền.
- Test 6 ca pass. Lint zero warning.
- Không file nào đổi giá trị biến cũ; ảnh chụp trang admin/ví cũ trước/sau không đổi (smoke 1 trang).
- Bằng chứng nhìn thấy (tabs, chip, hàng mở rộng) lấy ở P4/P8 khi có consumer đầu tiên; ghi chú vào phase đó.

## Risks
| Rủi ro | Xử lý |
|---|---|
| `Tabs` Mantine v9 không còn `unstyled` | Bước 1 xác minh, có phương án `default` + ghi đè |
| Global `!important` cho `.mantine-Paper-root` ghi đè viền hàng mở rộng | Class có độ đặc hiệu cao hơn hoặc dùng `div` thay `Paper` trong `ExpandableList` |
| Người dùng sửa `globals.css` chưa commit (`--app-text-meta`) | Chỉ thêm khối mới, không format lại file |
| Không có test runner | File test 1 hàm; không thêm dependency; nếu không chạy được, thay bằng self-check `tsx -e` và nói rõ |

## Security
Không có dữ liệu người dùng. `CopyIconButton` chỉ ghi clipboard giá trị truyền vào; không log giá trị.

## Next steps
Merge P1 sớm (chỉ cộng thêm) để plan profile/wallet bắt đầu. P2-P4 là consumer đầu tiên.
