# Brainstorm — 20 đơn trả tiền trong 14 ngày

- **Ngày:** 2026-11-23
- **Chủ đề:** Cần tối thiểu 20 đơn để qua môn EXE101; network nhóm chỉ có người học EXE201 (đã qua CP1–CP3). Đề xuất ban đầu: xây tính năng/dịch vụ liên kết EXE201 để có thêm đơn.
- **Trạng thái:** đã chốt hướng, chưa triển khai. Không sửa code.

## 1. Ràng buộc đã xác nhận (từ người dùng)

| Điều | Giá trị |
|---|---|
| Đơn được tính | Theo **dòng đơn** trong hệ thống, không theo khách unique |
| Deadline | Còn **14 ngày** (đến ~2026-12-07) |
| Mức giá chấp nhận được | **≤ 50.000đ/đơn** (giảng viên từng nói 79k cho 2 lượt là mắc; gợi ý tách thành 50k + 29k = 2 đơn) |
| Network | Chỉ có người học EXE201; không có kênh vào cohort EXE101 hiện tại |

## 2. Sự thật kỹ thuật đã kiểm chứng

| Sự thật | Bằng chứng |
|---|---|
| Đơn 0đ được tạo thẳng ở trạng thái `paid`, không qua thanh toán | `order-in-tx.ts:93` (`totalAmount > 0` mới đi nhánh ví) |
| Mã 100% vì thế vô nghĩa với mục tiêu 20 đơn | hệ quả của trên |
| Mã dùng chung cho cả lớp đã có sẵn: % giảm, số lượt tối đa, hạn dùng, gắn 1 dịch vụ | `DiscountCodeForm.tsx`, `DiscountCode.max_redemptions`, `discount-codes.usecase.ts` |
| Mỗi người chỉ dùng 1 lần/mã | `@@unique([code_id, user_id])` + `findUserRedemption` (`discount.helpers.ts:58`) |
| Cấp lượt nguyên tử, chặn vượt quota | `redeemDiscountInTx` → `updateMany ... redeemed_count < max_redemptions` |
| Không có gói combo 3 vòng; mỗi package 1 `service_type` | `prisma/seeds/seed-active-packages.ts` |
| Không có đường UI gom nhiều vòng vào 1 đơn | `CreditQuantityModal.tsx:27`, `usePlaceServiceOrder.ts:27` đều gửi đúng 1 item |
| Số lượng mua bị ép = 1 với 3 gói audit | `CreditQuantityModal.tsx:48` + `GRADING_PACKAGE_IDS` (`lib/pricing.ts:14`) |
| Mua credit vòng sau được ngay, không khóa theo tiến độ | `StageBalanceCards.tsx` (chỉ cần có package active) |
| Credit không có hạn dùng | `CreditLedger` không có `expires_at` |
| Mã 40% tự tặng chỉ áp cho **đúng dịch vụ vừa mua**, gắn user + case | `first-purchase-discount.listener.ts:70-73` |
| Thanh toán thật: nạp ví (min 2.000đ, SePay auto-verify) → mua trừ ví | `MIN_DEPOSIT_AMOUNT`, `sepay-webhook.usecase.ts` |

## 3. Phương án đã cân nhắc

| # | Phương án | Kết luận | Lý do |
|---|---|---|---|
| A | Mã dùng chung cho cả lớp, giảm sâu | **Chọn (sửa giá)** | 0 code; nhưng không dùng 80%/9.8k vì giảng viên đã nói 50k là mức ổn và sẽ nghi bán phá giá |
| A′ | Mã 100% / đơn 0đ | **Loại** | Đơn 0đ tự thành `paid`, không có tiền vào tài khoản → không chứng minh được nhu cầu |
| B | Bán gói riêng cho EXE201 (soát OC1/OC2) | **Loại trong 14 ngày** | Cần 2–4 ngày code + rubric EXE201; không kịp vừa xây vừa bán |
| C | Trang mua nhanh, không cần tạo case | **Hoãn** | Chỉ tăng conversion trên traffic đã có; traffic hiện tại = 0 |
| D | Hệ thống referral EXE201 → EXE101 | **Loại** | Referral nhân demand đã có; 0 × bất kỳ = 0. Cần 5–8 ngày code + rủi ro hình ảnh |

## 4. Phương án chốt

Không xây tính năng. Bán **trọn 3 vòng trong một lần** cho **7 khách**, hệ thống ghi thành 3 đơn/khách → **21 đơn**.

EXE201 không phải khách mà là **người mở cửa** tới một lớp EXE101 đang học (junior, CLB, lớp từng trợ giảng).

### Bảng giá

| Vòng | Giá | Cách tạo |
|---|---|---|
| Ý tưởng | 49.000 | giá gốc, không mã |
| Thị trường | 29.400 | mã giảm 40% tạo tay trong `/admin` |
| Mô hình | 29.400 | mã giảm 40% tạo tay trong `/admin` |

- Mỗi đơn ≤ 50k, khớp mức giảng viên chấp nhận; 29.400 khớp con số 29k giảng viên gợi ý.
- Doanh thu kỳ vọng: 7 × 107.800 ≈ 755.000đ.
- 2 mã 40% phải tạo tay: cơ chế tự tặng sau lần mua đầu chỉ cấp cho đúng dịch vụ vừa mua.

## 5. Timeline 14 ngày

| Ngày | Việc | Tiêu chí xong |
|---|---|---|
| 0 | Tự mua 1 đơn thật: nạp 50k → mua vòng Ý tưởng | Đơn `paid` + sao kê SePay khớp |
| 1 | Tạo 2 mã 40%; chốt 1 lớp + 1 người phát mã | Có tên người phát mã |
| 2 | Gửi tin bán + 1 báo cáo mẫu | ≥ 5 người phản hồi |
| 3–9 | Bán trọn gói | 7 khách = 21 đơn |
| 10–12 | Mở lớp 2 nếu thiếu; hoặc hạ vòng Ý tưởng xuống 29k | Đủ 21 đơn |
| 13 | Đối chiếu số đơn admin với sao kê | Khớp 100% |

Ngân sách: 0đ code, 0đ quảng cáo. Chi phí duy nhất là thời gian bán.

## 6. Rủi ro

1. **Không có người phát mã trong lớp.** Đây là nút chặn duy nhất; không có nó mọi phương án bằng 0.
2. **Tâm lý trả trước:** sinh viên ngại trả 108k cho credit dùng sau 3 tuần. Giảm bằng framing "mua 1 lần, 3 lượt để dành, không hết hạn" + báo cáo mẫu tại chỗ.
3. **Giảng viên coi 29k là bán phá giá.** Ghi rõ "giá ưu đãi lớp", không đổi giá niêm yết.
4. **Trần khách của một lớp:** nếu lớp chỉ có 3 nhóm thì không đủ 7 khách — kiểm sĩ số trước khi hứa.
5. **Chứng minh số đơn:** phải xác nhận màn admin đếm theo dòng đơn (khớp với cách giảng viên đếm).

## 7. Việc không làm

- Mã 100% / đơn 0đ.
- Hệ thống referral.
- Gói combo 3 vòng (không tồn tại; mỗi package 1 dịch vụ).
- Sản phẩm EXE201 trong học kỳ này.
- Trang mua nhanh không cần case.

## 8. Bước tiếp theo

1. Kiểm tra 1 lần: đơn 0đ không dùng làm bằng chứng; xác nhận admin đếm theo dòng đơn.
2. Nếu chốt triển khai bán: tạo 2 mã 40% → chạy timeline trên.
3. Nếu sau 14 ngày vẫn thiếu đơn: mới cân nhắc sản phẩm EXE201 (phương án B) ở học kỳ sau.
