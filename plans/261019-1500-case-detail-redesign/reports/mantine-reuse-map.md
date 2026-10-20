# Bản đồ dùng lại Mantine (áp cho cả 3 plan redesign)

Nguyên tắc chủ dự án: mockup chỉ quyết **hình thức + bố cục**. Thành phần Mantine đã có `error`, `placeholder`, `disabled`, `aria`, bàn phím, focus trap: **giữ, chỉ đổi style**. Không chép CSS/DOM mockup (mockup dùng `<dialog>`, `<details>`, `<input>` thô).

Cách đổi style, thứ tự ưu tiên:
1. Prop Mantine có sẵn (`variant`, `size="sm|md"`, `radius="md"`, `color`).
2. `classNames` + CSS module (`*.module.css`) dùng biến `--color-*` / `--ui-*`. Đây là pattern sẵn có (`JourneySidebar.module.css`, `GuidedTemplateCard.module.css`).
3. Tailwind chỉ cho khoảng cách/bố cục thường (`gap-*`, `grid`), không đặt vị trí cho `Modal`/`Drawer`.
4. Không thêm `defaultRadius` / override `components` vào `providers.tsx` (xem Q3).

## Mockup → Mantine

| Mockup | Dùng | Ghi chú |
|---|---|---|
| Tabs kiểu A (chữ, gạch xanh 3px) | `Tabs` + `classNames` từ `components/ui/underline-tabs.module.css` | Giữ `role`/`aria`/phím mũi tên miễn phí (mockup tự nhận thiếu). Kiểm `variant="unstyled"` trong Mantine v9 qua context7 trước khi code |
| Bộ lọc loại (Tất cả/Mua/Dùng/Hoàn) | `SegmentedControl` **hoặc** `Tabs` cùng class | Mockup dùng nhóm nút `aria-pressed` vì không đổi panel. `SegmentedControl` có sẵn, nhưng nhìn khác tabs A; chọn `Tabs` nếu muốn đồng nhất. P8 chốt khi thấy thật |
| Chip trạng thái | `Badge variant="light" size="md" radius="sm"` qua `StatusChip` | Không tái tạo màu chữ riêng (`#065f46`...). Dark mode do Mantine lo |
| Nút chính / phụ | `Button` / `Button variant="default"` | `size="sm"` trở lên, cùng hàng phải cùng chiều cao |
| Nút icon | `ActionIcon variant="subtle"` + `aria-label` | |
| Thẻ, hàng danh sách | `Paper withBorder radius="md"` | Global CSS ép `background/border-color !important` cho `.mantine-Paper-root` (`globals.css:196-216`): đổi viền phải dùng class có độ đặc hiệu cao hơn |
| Hàng mở rộng (`<details>`) | `Accordion variant="unstyled"` + `classNames` (`components/ui/expandable-list/`) | Có sẵn aria + phím. Mẫu `ACCORDION_CLASSES` ở `TeamFitReportParts.tsx` |
| Gập mobile (`details.fold`) | `Collapse` + `useMediaQuery` hoặc `Accordion` | Desktop luôn mở |
| Hộp thoại (audit, upload, xóa) | `Modal centered radius="md"` | **Cấm** class `fixed/inset-0/flex/items-center/justify-center` |
| Ngăn kéo mobile | `Drawer` (đã có `JourneyMobileNav`) | Burger nổi giữ nguyên là nút tùy biến |
| Ô nhập | `TextInput`, `Textarea`, `PasswordInput`, `NumberInput`, `Select` | `error=`, `required`, `description` |
| Upload | `Dropzone` (đã có) | |
| Copy mã | `CopyButton` + `Tooltip` → `CopyIconButton` | Đang viết tay 2 chỗ (`OverviewTab.tsx:53-68`, `StageGradingPanel.tsx:153-161`) |
| Cảnh báo trong trang | `Alert` | Info icon mặc định đã gắn ở `providers.tsx:41-44` |
| Tiến trình chấm | `Stepper`, `Progress`, `Collapse` (đã có) | Giữ |
| Skeleton | `components/ui/LoadingSkeleton` | |
| Công tắc | `Switch` | Không CSS tay (xem plan profile) |
| Phân trang | `Pagination` | Server-side, giữ (plan wallet) |

## Phosphor (mockup) → Lucide (repo)

| Phosphor | Lucide |
|---|---|
| CheckCircle / Check | `CircleCheck` / `Check` |
| Circle | `Circle` |
| WarningCircle | `CircleAlert` |
| LockSimple | `Lock` |
| CaretRight / CaretDown / CaretUp | `ChevronRight` / `ChevronDown` / `ChevronUp` |
| Copy | `Copy` (đã sao chép: `Check`) |
| DownloadSimple | `Download` |
| Trash | `Trash2` |
| DotsThree | `Ellipsis` |
| X | `X` |
| Info | `Info` |
| ArrowsClockwise | `RefreshCw` |
| ArrowRight | `ArrowRight` |
| BookOpen / Lightbulb | `BookOpen` / `Lightbulb` |
| Camera / Image | `ImagePlus` |
| Bell, Wallet, User, Key | `Bell`, `Wallet`, `User`, `KeyRound` |
| Laptop, DeviceMobile, Tablet, Globe | `Laptop`, `Smartphone`, `Tablet`, `Globe` |
| SignOut | `LogOut` |
| Warning (tam giác) | `TriangleAlert` |
| File PDF/DOC/XLS... | **`components/ui/FileTypeIcon`** (PNG sản phẩm), không dùng vector |

Stroke Lucide thống nhất `1.75`; icon cạnh chữ 16-20px. Lucide có thể đổi tên ở phiên bản đã cài: kiểm `node_modules/lucide-react` trước khi import.
