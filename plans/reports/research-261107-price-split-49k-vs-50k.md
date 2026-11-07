# Research: tách giá 79k -> lượt 1 + lượt 2; 49k hay 50k

Date: 2026-11-07. Liên quan: `brainstorm-261107-oc1-oc2-lecturer-feedback-checkpoint.md` (mục 2.1 #4-#5, mục 5.1).

## Kết luận ngắn

1. 49k vs 50k: chênh 1k (~2%). Bằng chứng chung nghiêng nhẹ 49k cho khách nhạy giá + giá thấp hơn kỳ vọng; không có bằng chứng đủ mạnh để chắc. Không A/B được với lưu lượng hiện tại.
2. Quyết định lớn hơn nhiều: tách giá làm GIẢM doanh thu/khách trừ khi tăng đủ số người mua (22-35%). Chưa có dữ liệu để biết có tăng không.
3. Code hiện tại làm được tách giá không đổi schema (2 gói 1 lượt), nhưng gate "chỉ mua lượt 2 sau khi đã dùng lượt 1" cần code.

## 1. 49k hay 50k

Nguồn: https://learningloop.io/blog/charm-pricing-99-vs-95 (tổng hợp Thomas & Morwitz 2005; Schindler 2006; Gendall 1998; Stiving 2000; Wadhwa & Zhang 2015; Harms 2018). Đã đọc trực tiếp bài này; các paper gốc CHƯA mở.

| Cơ chế | Nội dung | Áp vào NexCert |
|---|---|---|
| Left-digit effect | Chỉ có tác dụng khi chữ số đầu đổi. 49k -> 4, 50k -> 5: đủ điều kiện. | Có lợi cho 49k |
| 9 = tín hiệu "giá rẻ/khuyến mãi" | Giúp khi cạnh tranh bằng giá; hại khi cạnh tranh bằng chất lượng/tin cậy (round hợp hơn). | NexCert bán "rẻ + đáng tin"; hai chiều kéo ngược nhau |
| Kỳ vọng giá của khách | Khách kỳ vọng trả NHIỀU hơn giá bán -> đuôi 9 hợp; kỳ vọng ít hơn -> đuôi tròn/95. (1 pilot nhỏ, giả thuyết) | Nhóm nói khách tự nói họ chi nhiều hơn 79k -> nghiêng 49k. Chưa đo kỳ vọng thật |
| Processing fluency (round dễ xử lý, "cảm giác đúng") | Wadhwa & Zhang: round hợp mua theo cảm xúc, chính xác hợp mua theo phân tích. Harms 2018: replication KHÔNG tái lập. | Trực giác của user ("50k đơn giản, dễ ước = 1 ly trà sữa") khớp cơ chế này nhưng bằng chứng yếu |
| Nhất quán giữa các bậc | Trộn đuôi tròn và đuôi 9 trên cùng bảng giá làm khách để ý đuôi giá thay vì giá trị. | 50k + 29k = lẫn; 49k + 29k hoặc 50k + 30k = nhất quán |

Nhận xét về trực giác của user:
- "49k không rẻ" là cảm nhận của người bán đã biết giá; đối chiếu 1 người, không phải bằng chứng về khách.
- "Ít gặp 49k trong đời sống" là [INFERENCE] chưa kiểm; đuôi 9 (49k/99k/199k) khá phổ biến trong bán lẻ/online VN nhưng tôi không có nguồn VN đáng tin trong phiên này (search tiếng Việt chỉ ra bài tổng quan chung, 1 bài lấy ví dụ 49k).
- Anchor "1 ly trà sữa" dùng được cho cả hai số; cô đã dùng "79k = 2 ly trà sữa".

Quy mô hiệu ứng: nghiên cứu hiện trường đo được ở mức vài % đến vài chục % tùy bối cảnh; với 1k chênh, không thể đo ở NexCert. Ước tính [tính tay]: baseline mua 5%, muốn phát hiện 5% -> 6% (power 80%) cần cỡ 7.600 lượt/nhánh; hiện reach tổng ~11k (TikTok 4,8k + Fanpage 6,1k) và chuyển đổi xem->mua thấp hơn 5%.

## 2. Tách giá: cái giá phải trả

Hiện: mọi người mua 2 lượt = 79k/lần, kể cả khi chỉ dùng 1 lượt.
Tách: doanh thu/người mua = P1 + 29k x p (p = tỉ lệ mua lượt 2).
Số người mua phải tăng bao nhiêu lần để hòa vốn doanh thu (79 / (P1 + 29p)):

| p (mua lượt 2) | P1 = 50k | P1 = 49k |
|---|---|---|
| 30% | x1,35 | x1,37 |
| 50% | x1,22 | x1,24 |
| 70% | x1,12 | x1,14 |
| 100% | x1,00 | x1,01 |

- Với 3 người trả tiền, "tăng 22-35%" = 1 người nữa; không chứng minh được gì.
- Biên lợi nhuận/lượt (chi phí AI mỗi lượt chấm) chưa có số, chưa xét.
- Cô chốt "kịch bản nào cũng tốt" về tâm lý khách, không về doanh thu nhóm.
- Dữ liệu chưa có mà cần: bao nhiêu trong 4 đơn đã dùng hết cả 2 lượt (đo p).

## 3. Thực tế bên ngoài (độ chắc thấp)

Nguồn tìm được thực sự thấy: nghiên cứu bucket pricing / mixed bundling (ScienceDirect S0167811612000043; Harlam et al. 1995; SurveyMonkey bundling). Không có nguồn trực tiếp cho kiểu "lượt đầu rẻ, lượt sau mua thêm sau khi thấy kết quả". Các mẫu dưới đây từ kiến thức chung, [INFERENCE], chưa kiểm nguồn trong phiên này:

| Mẫu | Cách làm | Hợp NexCert? |
|---|---|---|
| Entry price + add-on (cô gợi ý) | Lượt 1 giá thấp; lượt 2 mua thêm sau khi thấy kết quả | Có: đúng ý cô, khách đã thấy giá trị lúc mua lượt 2 |
| Mixed bundling | 1 lượt X; 2 lượt giá gộp thấp hơn 2X, bán sẵn lúc đầu | Có, đơn giản nhất về code; mất khoảnh khắc "sau khi thấy kết quả" |
| Trả sau (pay-later) | Dùng trước, trả sau | Repo đã có receivable (`receivables-*`, brainstorm 261016); nhưng khách im sau khi gửi bài cho thấy rủi ro thu tiền |

## 4. Đụng gì trong repo

Đã đọc: `prisma/seeds/seed-active-packages.ts`, `apps/api/src/modules/orders/application/credit-audit-order.helpers.ts`, tests `phase-08-refund-credit.test.ts`, `credit-ledger-by-service-type.test.ts`.

- 3 gói 79k/2 lượt: `pkg_ai_audit` (CP1), `pkg_cp2_audit`, `pkg_cp3_audit`. Đơn giá/lượt = unit_price / credits_granted (tests: 79k/2 -> 39.500).
- Đã chạy `phase-08-refund-credit.test.ts` + `credit-ledger-by-service-type.test.ts`: 42/42 pass. Chứng minh: hoàn tiền FIFO đúng khi các lần mua có giá/lượt KHÁC nhau (vd "mua 3@39k rồi 2@49k, tiêu 2 -> hoàn 137,000 VND"), và `resolvePurchaseUnitPrice` tính đúng khi `credits_granted: 1`. KHÔNG chứng minh có gói 1 lượt thật trong seed (fixture 39k/1 lượt trong test là dữ liệu giả; `pkg_tf_audit` thật là 39.000/2 lượt, inactive). Chưa có test cho luồng mua 2 gói 1 lượt trên cùng case.
- `pricing_tiers` = bảng `service_pricing` (`package_id`, `price`, `is_current`, `previous_price`, `changed_by`, `changed_at`): LỊCH SỬ GIÁ của 1 gói, lấy dòng `is_current`; KHÔNG phải bậc theo lượt/số lượng. Không biểu diễn được "lượt 1 = 50k, lượt 2 = 29k". Vậy tách giá không chỉ là cấu hình tier; vẫn cần 2 gói (hoặc code mới).
- Cạm bẫy: giá đơn = `pricing_tiers[0]?.price ?? pkg.price` (`credit-audit-order.helpers.ts:54`, `package-dto.ts:9`). Nếu prod có dòng `service_pricing` is_current cho gói, sửa `price` trong seed KHÔNG đổi giá bán. Cần kiểm bảng này trên prod trước khi đổi giá (chưa kiểm).
- Seed chỉ chạy tay trên VPS -> đổi giá = sửa seed + chạy lại trên prod + kiểm `service_pricing` + kiểm đơn đã bán (đơn cũ giữ `unit_price` trong metadata nên không đổi).
- Hiển thị tiền theo `apps/web-1/AGENTS.md`: `49,000 VND` (không dùng `đ`/dấu chấm) -> mọi copy marketing trong web phải theo, kể cả TVC/Fanpage nếu muốn khớp web.
- Gate "lượt 2 chỉ mua sau khi dùng lượt 1" cần code (không chỉ seed): UI mua lượt, list-packages, tạo đơn.

## 5. Phương án

| | A. 49k + 29k (78k) | B. 50k + 30k (80k) | C. 50k + 29k (79k) |
|---|---|---|---|
| Nhất quán đuôi giá | Có (đuôi 9) | Có (tròn) | Không |
| Khớp lời cô | gần | gần | đúng nguyên văn |
| Tổng so với hiện tại | -1k | +1k | giữ 79k |
| Tín hiệu | "rẻ", hợp khách nhạy giá | "đơn giản, tin cậy" | lẫn |

Khuyến nghị (độ chắc thấp): A nếu chấp nhận tín hiệu "rẻ"; B nếu muốn định vị tin cậy. Không chọn C vì lẫn đuôi mà không được lợi gì thêm ngoài khớp lời cô. Bất kể chọn gì, nó là quyết định ~2%; việc có tách hay không và có gate hay không quan trọng hơn.

## 6. Câu hỏi mở

1. p thực tế: trong các đơn đã bán, bao nhiêu dùng cả 2 lượt? (cần query DB read-only, chưa chạy)
2. Chi phí AI/lượt chấm?
3. Khách tự nói chi bao nhiêu (con số cụ thể từ khảo sát của nhóm)? -> xác định kỳ vọng giá.
4. Tách giá cho cả 3 gói hay chỉ CP1 (cô chỉ nói gói chấm ý tưởng trong video)?
5. Gate lượt 2: bắt buộc hay cho mua tự do (khi tự do, khách có thể mua mỗi lượt 29k, mua rẻ hơn lượt 1)?
6. Có dòng `service_pricing` is_current nào trên prod đang ghi đè giá seed? Admin có UI sửa giá không?

## 7. Quyết định (2026-11-07) và kết quả kiểm tra

Mục tiêu: tối đa số ĐƠN (KPI 20 đơn, 1 khách mua nhiều đơn được). Không cần hòa vốn.
Quyết định: lượt đầu 49k (gói 1 lượt); mua lần đầu xong được tặng mã giảm giá cho lượt sau (~29k).

Kiểm tra (đã làm):
- Prod `service_pricing`: KHÔNG có dòng override cho `pkg_ai_audit`, `pkg_cp2_audit`, `pkg_cp3_audit` -> sửa giá trong seed có hiệu lực.
- Cơ chế mã giảm giá có sẵn: `DiscountCode` (`percent_off` Int, theo `service_type_id`, `max_redemptions`, `expires_at`, 1 lần/user/mã). Admin tạo qua `POST /admin/discount-codes` + UI `AdminDiscountCodes`; học viên nhập mã ở `CreditQuantityModal` / `ServiceCheckoutModal`. KHÔNG có tự động tặng mã sau lần mua đầu.
- Làm tròn: `applyPercentOff = Math.round(price * (100 - pct) / 100)`. 49.000 không ra đúng 29.000 với pct nguyên: 40% -> 29.400; 41% -> 28.910. 50.000 với 42% -> 29.000 đúng.
- Prod hiện chỉ có 1 mã `TANG4LUOT` (50%, max 1, inactive, chưa dùng).
- Prod orders: 31 đơn `paid` từ 2 tài khoản, mới nhất 2026-10-19, không có đơn nào sau đó; deposits `verified` 12. Không phân biệt được tài khoản test với khách thật (không truy vấn PII). Không đo được tỉ lệ dùng cả 2 lượt có ý nghĩa từ dữ liệu này.
