# Agent Review: Price Locking Plan (locked_price)

**Source:** Oracle agent review | **Date:** ~26/07/2026  
**Context:** Review của AI agent về price-locking plan, phát hiện các gap trong coverage UI/API/backfill.  
**File gốc:** Transcript từ agent session (raw output, không edit).

---

Có. Plan hiện đúng hướng, nhưng còn thiếu vài chỗ quan trọng so với vấn đề gốc: case cũ giữ giá cũ, chỉ case mới ăn giá mới.

Kết luận ngắn

Root fix đúng nhất: lock giá trên Case tại lúc tạo case/đăng ký, rồi dùng giá lock đó ở mọi nơi sau này.

Plan hiện đã có xương sống đó. Nhưng còn thiếu coverage ở nhiều điểm đọc giá và thiếu làm rõ backfill/semantics.

---

Thiếu gì trong plan

1. Chưa cover hết tất cả UI đang đọc live package.price

Plan Phase 03 mới nhắc PaymentDrawer.tsx. Nhưng code đang còn chỗ khác đọc giá live:

- apps/web-1/app/dashboard/case/[id]/payment/page.tsx:43
- apps/web-1/app/dashboard/case/[id]/payment/page.tsx:152
- apps/web-1/app/dashboard/case/[id]/page.tsx:91
- apps/web-1/app/dashboard/case/[id]/\_components/UnpaidAlertBanner.tsx:14
- apps/web-1/app/supporter/case/[id]/page.tsx:70

Ý nghĩa:

- redirect “gói free thì không vào payment page” đang dựa vào caseData.package?.price === 0
- banner unpaid/supporter warning cũng dựa vào live price
- nếu admin đổi gói từ paid -> free, case cũ chưa thanh toán sẽ bị xem như free, sai rule

Plan phải bổ sung: mọi check free/paid trên frontend phải đổi sang:

- caseData.locked_price
- chỉ fallback package.price cho data legacy nếu thật sự cần, và nên có note tạm thời

---

2. Chưa ghi rõ API response phải expose locked_price

Backend getCaseDetailUseCase đang trả shape case, nhưng chưa có locked_price trong mapper:

- apps/api/src/modules/cases/application/get-case-detail.usecase.ts:45-70

Hiện toBaseResponse() trả package_id, package, payments... nhưng không trả locked_price.

Plan phải bổ sung rõ:

- update toBaseResponse() thêm locked_price
- nếu có DTO/types response riêng chỗ khác, update luôn

Nếu không làm chỗ này, frontend có field mới trong type cũng vô dụng.

---

3. Chưa ghi rõ create-case persistence phải lưu locked_price ngay khi create

Plan nói “intake flow set locked_price”, nhưng wording còn hơi chung. Code hiện tại:

- apps/api/src/modules/cases/application/create-case.usecase.ts:80-94
- apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts:163-179

Luồng hiện:

- chỉ dùng để tính isFree
- lúc tx.case.create, chỉ lưu package_id, không lưu locked_price

Plan nên nói thẳng:

- thêm lockedPrice vào input createCaseWithCheckpointAndIntake
- persist ngay trong tx.case.create
- isFree nên derive từ lockedPrice === 0, không derive lại từ live package sau đó

Như vậy rule mới kín hơn.

---

4. Backfill strategy còn thiếu quyết định business cho legacy unpaid/rejected cases

Plan hiện ghi:

- paid có payment -> lấy Payment.amount
- chưa có payment -> lấy ServicePackage.price hiện tại

Cái này kỹ thuật chạy được, nhưng với rule business gốc thì legacy unpaid/rejected cases vẫn mơ hồ:

- nếu case cũ tạo lúc giá 300k
- giờ package đang 500k
- backfill bằng current package.price
- thì case cũ bị đổi thành 500k => trái yêu cầu gốc

Nói thẳng: không thể suy ra đúng giá gốc cho mọi legacy unpaid case nếu DB chưa từng lưu snapshot.

Plan phải bổ sung mục “known limitation / business decision”:
chọn 1 trong 3:

1. Accept approximation: backfill legacy unpaid/rejected bằng current package price
2. Manual review: legacy unpaid/rejected cần admin review/import thủ công
3. Historical reconstruction: nếu có log/timestamp/ngoài hệ thống thì dựng lại giá theo mốc thời gian

Không chốt mục này, plan chưa kín.

---

5. Audit trail trên ServicePackage chưa đủ nếu đổi giá nhiều lần

Plan đang dùng:

- previous_price
- last_price_changed_at
- last_price_changed_by

Cái này chỉ giữ 1 lần đổi gần nhất, không phải audit trail đầy đủ. Trong khi plan.md đang ghi mục tiêu:

- “Lưu audit trail: ai đổi, khi nào, giá cũ → mới”

Nếu chỉ thêm 3 cột trên package thì đó là last-change metadata, không phải full audit trail.

Cần sửa plan wording hoặc scope:

- nếu muốn KISS/YAGNI: đổi wording thành “lưu metadata lần đổi giá gần nhất”
- nếu thật sự muốn audit trail đầy đủ: cần bảng riêng kiểu package_price_changes

Theo vấn đề gốc user nêu, full history không bắt buộc. Nên tốt nhất:

- giảm scope
- giữ 3 cột metadata gần nhất
- đừng gọi nó là full audit trail

---

6. Chưa cover backend checks ngoài upload-payment-proof

Plan cover upload-payment-proof.usecase.ts. Tốt. Nhưng còn các nơi đang dùng live package price để quyết định flow:

- create-case.usecase.ts:80-83 dùng live price để set isFree
- frontend route logic dùng live price
- supporter page warning dùng live price

Backend chính chưa thấy chỗ khác charge amount, nhưng plan nên ghi rõ invariant:

▎ Sau migration, mọi quyết định “case này có cần thanh toán không / số tiền bao nhiêu” phải dựa trên Case.locked_price, không dựa trên ServicePackage.price.

Dòng này quan trọng. Giữ team không quên chỗ phát sinh sau.

---

7. Test scope còn thiếu rõ

Plan có scenarios, nhưng nên ghi thành test cases cụ thể hơn cho backend + frontend.

Thiếu ít nhất:

Backend

- create case trước đổi giá -> Case.locked_price = old price
- create case sau đổi giá -> Case.locked_price = new price
- upload proof dùng locked_price, không dùng package.price
- rejected resubmission vẫn tạo Payment.amount = locked_price
- package đổi từ paid -> free không làm case cũ unpaid upload bị reject sai vì current package = 0
- getCaseDetailUseCase trả locked_price

Frontend

- payment page redirect dùng locked_price === 0
- unpaid banner hide/show dùng locked_price
- supporter warning dùng locked_price
- displayed amount + QR amount dùng locked_price

---

Chỗ wording nên sửa trong plan

plan.md

Dòng goal 4 đang nói audit trail. Nên đổi thành:

- “Lưu metadata lần đổi giá gần nhất”
  hoặc
- thêm note “không làm full history table trong scope này”

phase-02-backend-logic-fixes.md

Task 1 đang viết:

- “Khi case được assign package_id ...”

Nhưng code thực tế hiện tại là ngay lúc create case. Nên đổi wording cụ thể:

- “Create-case flow: snapshot locked_price tại lúc tạo case”

Nếu tương lai có đổi package sau này thì viết thành follow-up, không nhập nhằng.

phase-03-frontend-display-fixes.md

Phải thêm file list:

- apps/web-1/app/dashboard/case/[id]/payment/page.tsx
- apps/web-1/app/dashboard/case/[id]/page.tsx
- apps/web-1/app/dashboard/case/[id]/\_components/UnpaidAlertBanner.tsx
- apps/web-1/app/supporter/case/[id]/page.tsx

Hiện mới nhắc PaymentDrawer.tsx là thiếu.

---

Đề xuất scope chốt gọn, đúng vấn đề gốc

Nên chốt plan thành 4 việc cứng:

1. Schema

- Case.locked_price
- optional package last-change metadata

2. Create case

- snapshot package price vào locked_price
- payment_status derive từ locked_price

3. Read/use case

- case detail API trả locked_price
- upload proof dùng locked_price
- mọi UI/redirect/banner/QR dùng locked_price

4. Legacy/backfill

- paid: lấy Payment.amount
- unpaid/rejected: cần business decision rõ vì không thể suy ra chắc giá gốc

---

Verdict

Plan không sai, nhưng chưa đủ kín. Thiếu lớn nhất:

- chưa cover hết UI đọc package.price
- chưa expose locked_price từ case detail API
- chưa chốt business rule cho legacy unpaid/rejected
- đang gọi “audit trail” hơi quá scope thực tế

Tôi khuyên sửa plan theo priority

1. Bổ sung locked_price vào API response + all frontend guards
2. Làm rõ create-case persistence lưu snapshot ngay lúc create
3. Chốt decision cho legacy unpaid/rejected backfill
4. Giảm “audit trail” thành “last change metadata” nếu không tạo bảng history

Nếu muốn, tôi có thể review trực tiếp và patch luôn 4 file plan trong plans/260703-1352-price-locking-audit-trail/ để plan kín hơn.

✻ Worked for 7m 58s

● Agent "Read docs batch 2" finished · 2m 34s

Thought for 1s

Noted. Doc finding separate from price-locking root fix.

For current plan review, verdict unchanged:

- need locked_price in case API

3. Chốt decision cho legacy unpaid/rejected backfill
4. Giảm “audit trail” thành “last change metadata” nếu không tạo bảng history

Nếu muốn, tôi có thể review trực tiếp và patch luôn 4 file plan trong plans/260703-1352-price-locking-audit-trail/ để plan kín hơn.
