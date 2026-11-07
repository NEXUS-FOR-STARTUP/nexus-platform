# Research: đổi giá/lượt gói vs đơn đã có

Ngày: 2026-11-07. Nguồn ngoài: 2 lượt tìm web (DuckDuckGo/tổng hợp); dữ liệu hệ thống: query read-only prod + đọc code.

## 1. Kết luận
- Đổi gói 79k/2 lượt → 49k/1 lượt KHÔNG sửa đơn hay lượt đã mua. Đơn và ledger đã lưu snapshot.
- Chuẩn ngoài kia: giá/đơn lưu cố định lúc mua; đổi giá = giá mới cho đơn mới (Stripe: tạo Price mới, archive cũ; Shopify: line item snapshot).
- Mâu thuẫn thật chỉ ở 3 chỗ: (a) lượt cũ đắt "thấp hơn" lượt mới theo đơn giá/lượt, (b) 12 dòng ledger cũ thiếu metadata, (c) tài liệu/test còn ghi 79k/2 lượt.

## 2. Cách các nền tảng xử lý
| Nền tảng | Cách làm | Nguồn |
|---|---|---|
| Stripe Price | Price bất biến; đổi giá = tạo Price mới + `active=false` cho Price cũ; không đụng khách hiện có | docs.stripe.com/products-prices/how-products-and-prices-work |
| Stripe subscription | Khách cũ giữ giá cũ đến khi chủ động chuyển sang Price mới (grandfathering) | pricepilot.cloud, finrite.co |
| Shopify | Giá line item được chụp lúc đặt; đổi giá sản phẩm không đổi đơn cũ | marketcube.io (nguồn thứ cấp) |
| Stripe credit grants | Credit đã mua giữ giá trị tiền; nhưng tiêu hao theo giá dịch vụ hiện tại | moesif.com (thứ cấp) |

Ghi chú: Shopify/credit grants là tổng hợp từ nguồn thứ cấp, chưa đọc tài liệu gốc.

## 3. Hệ thống mình đã có (prod, read-only)
- Đơn `paid`: 31. Không có đơn trạng thái khác.
- order_items theo giá: 79,000 × 22 dòng (7 `pkg_ai_audit`, 4 `pkg_cp2_audit`, 11 `package_id` null), 39,000 × 10 dòng (qty 1/3/4). Không có dòng 49,000.
- credit_ledgers: purchase 24 dòng (+48 lượt), consumption 34 (−34), refund 13 (+13).
- Lượt chưa dùng: CP1 22 lượt ở 13 case; CP2 5 lượt ở 3 case. CP3 chưa có.
- discount_redemptions: 0.
- `service_pricing`: 0 dòng; giá lấy từ `service_packages.price`.

## 4. Snapshot hiện có
| Nơi | Snapshot | Bằng chứng |
|---|---|---|
| `order_items.unit_price`, `quantity`, `amount` | Có, mọi dòng | `prisma/schema.prisma:304`; query |
| `credit_ledgers.amount` (số lượt) | Có, ghi số lượt tại lúc mua | `order-in-tx.ts:116,126` |
| `credit_ledgers.metadata_json` | `package_unit_price`, `credits_granted`, `price_per_credit`, `quantity` | `order-in-tx.ts:132-141` |
| `orders.metadata_json` | Rỗng ở 2 đơn mới nhất; không dựa vào | query |
| Refund | Đọc từ snapshot (`price_per_credit`, `unit_price`, `credits_granted`), không đọc giá gói hiện tại | `credit-refund.ts:60-65`; `phase-08-refund-credit.test.ts` |

Thiếu: 12/24 dòng purchase ledger không có metadata đầy đủ (7 dòng null hẳn, 1 chỉ có qty, 4 chỉ có credits=2). Nhiều khả năng đơn cũ từ trước khi thêm trường (suy luận). Refund của dòng đó dựa vào `order_items` (suy luận từ test fallback, chưa chạy trên dữ liệu thật).

## 5. Mâu thuẫn tiềm ẩn
1. Đơn giá/lượt đảo chiều: khách cũ trả 39,500/lượt (79k/2); khách mới 49,000/lượt. Không sai kỹ thuật nhưng khách cũ có thể thấy "bán lẻ lại đắt hơn".
2. Hoàn lượt cũ vẫn theo 39,500; hoàn lượt mới theo 49,000 hoặc 29,400 (khi có mã). Đúng theo snapshot, cần giải thích CSKH.
3. Tài liệu/test ghi 79k/2 lượt: `docs/technical-notes/money-credit-completion-model-note.md`, `design-system/wording/`, fixture test (refund fixtures nên giữ vì mô phỏng đơn cũ).
4. Giá chặng khác sau này: `service_pricing` có `is_current` (lịch sử giá) nhưng đang trống; nếu muốn lưu lịch sử thì nên dùng bảng này thay vì sửa tay `service_packages`.

## 6. Khuyến nghị
- Không đổi dòng cũ: giữ nguyên đơn/ledger đã có (không migrate dữ liệu).
- Dùng seed (upsert) cho giá mới như đã làm; đơn mới sẽ có snapshot 49,000.
- Cân nhắc ghi giá vào `service_pricing` (`is_current`) để có lịch sử đổi giá thay vì chỉ sửa cột (cần xem code đọc `pricing_tiers[0]` có lấy đúng bản ghi hiện tại).
- Test hồi quy: sau seed, tạo đơn thử → `order_items.unit_price = 49000`; refund đơn cũ 79k vẫn 39,500/lượt.
- Quyết định kinh doanh: có tặng bù cho 13 + 3 case còn lượt (22 CP1, 5 CP2) không? Chưa cần làm kỹ thuật.

## 7. Chưa kiểm
- Hành vi refund trên 12 dòng ledger thiếu metadata (chưa chạy thật).
- Có code nào đọc `service_packages.price` trực tiếp cho đơn đã tạo hay không (chưa grep đủ).
- Tài liệu gốc Shopify/Stripe credit grants.

## Câu hỏi mở
1. Tặng bù cho khách còn lượt cũ hay không?
2. Có ghi lịch sử giá vào `service_pricing` không?
