# Bản đồ dùng lại Mantine + thành phần có sẵn: wallet

Quy tắc chung: `../../261019-1500-case-detail-redesign/reports/mantine-reuse-map.md`. Riêng ví:

| Mockup | Dùng | Giữ nguyên gì |
|---|---|---|
| Tabs Lịch sử / Minh chứng | `Tabs` + `UNDERLINE_TABS_CLASSES` (case plan P1) | Hiện `variant="pills"` ở `wallet/page.tsx:42` + `WalletTabsList` (12 dòng): xóa wrapper |
| Tabs loại giao dịch | `Tabs` cùng class (không đổi panel thì dùng `SegmentedControl`) | Param `type` server-side |
| Hàng mở rộng | `ExpandableList` (case P1) | `onOpen` để lazy fetch |
| Chip loại / trạng thái | `StatusChip` | Trạng thái deposit từ `getDepositDisplay` |
| Copy nội dung CK / ID | `CopyIconButton` | |
| Thẻ số dư | `Paper withBorder radius="md"`, bỏ gradient | `useWalletBalance`, trạng thái lỗi/tải |
| Phân trang | `Pagination` (có sẵn) | `page`, `limit=10`, dòng "Hiển thị X trên tổng Y" |
| Sắp xếp | `Select size="sm"` | `sortBy`/`sortOrder` server-side |
| Modal nạp tiền | `WalletTopupModal` (`Modal centered radius="md"`, `NumberInput thousandSeparator="," decimalSeparator="."`) | `useCreateDeposit`, key idempotency, `submittingRef`, `MIN_TOPUP_AMOUNT`, redirect |
| 4 nút chọn nhanh | `Button.Group`/`Group` + `Button variant="default" size="sm"` | Mức: 50,000 / 79,000 / 100,000 / 200,000 (hằng, không gõ cứng trong JSX) |
| Skeleton | `components/ui/LoadingSkeleton` (`table-row`) hoặc `Skeleton` | |
| Link minh chứng | `getProofUrl` (`payment/hooks/usePayment.ts`) | Icon PDF vs ảnh |
| Icon | Lucide: `Wallet`, `Plus`, `ChevronDown`, `Copy`, `Check`, `RefreshCw`, `FileText`, `Image`, `ExternalLink`, `TriangleAlert` | Không Phosphor |
| Số tiền | `formatVndAmount` (case P1), `tabular-nums` | Không `toLocaleString("vi-VN")` |
