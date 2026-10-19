# Gap register: case-detail mockup vs code (báo cáo cho chủ dự án)

Nguồn: `research/scout-01..03`. Mỗi dòng = chỗ mockup khác code, hoặc code có mà mockup chưa tính. "Mặc định" = cách plan xử lý nếu bạn không đổi ý. Cột "Cần bạn quyết" = Y thì xem mục Q cuối `plan.md`.

Mức: **B** blocker (không làm được nếu không quyết), **H** high, **M** med, **L** low.

## A. Mockup đòi cái code/API chưa có

| ID | Mức | Mockup | Thực tế | Mặc định trong plan | Cần bạn quyết |
|---|---|---|---|---|---|
| C-01 | B | Dòng giao dịch mở rộng có khối "Thanh toán" (VietQR, nội dung CK, mã GD ngân hàng, ghi có, xác minh) | Mua lượt trừ ví (`order-in-tx.ts:97-100`). `Order` không có trường ngân hàng; `Deposit` không có `order_id`/`case_id`. Không nối được | **Bỏ khối này.** Giữ khối "Giao dịch" + "Đơn hàng". Thông tin ngân hàng nằm ở trang Ví | Y (Q1) |
| C-02 | H | Khối "Đơn hàng" (bảng dịch vụ, SL, đơn giá, tổng) | `orders` KHÔNG có trong payload case-detail (`get-case-detail.usecase.ts:62-95`), nên "Đơn mua" hiện nay cũng không hiện. Ledger có `reference_type='order'` + `reference_id` = id đơn (`order-in-tx.ts:127-129`) nhưng type web `CreditEntry` bỏ `reference_type` | Đã xác minh: `getCreditLedgerByCaseId` select `reference_type` và use case trả `credit_ledger` nguyên (không map), nên chỉ cần thêm vào type web; `GET /orders/:id` kiểm chủ đơn (403 nếu khác `user_id`: thành viên nhóm không phải chủ đơn sẽ lỗi, UI xử lý). Gọi lazy `GET /orders/:id` khi mở dòng (hook mới, không đụng API). Không sửa backend | Y (Q1) |
| C-03 | H | "Lần chấm", "mã lần chấm bị lỗi" | Dòng dùng và hoàn đều `reference_id = caseId`, `reference_type = null` (`audit-credit.ts:26,44`). Không có job id | **Bỏ** hai trường này. Hiện: thời gian, loại, giai đoạn, biến động, số dư sau, ID giao dịch (copy), nguồn | N |
| C-04 | H | Gợi ý chia "Cần nêu" / "Ví dụ chưa tốt-tốt" | Catalog chỉ có `explanation` (văn xuôi), `suggested_actions`, `further_reading`. Mockup dùng `parseHint` cắt chuỗi theo mẫu chữ | **Không viết parser.** Panel gợi ý hiện 3 phần thật: explanation (giữ `whitespace-pre-line`), "Tự kiểm tra trước khi lưu" (bullet), "Đọc thêm" (link). Đổi hình thức, không đổi nội dung | Y (Q4) |
| C-05 | H | Menu `⋯` ở header giai đoạn (Đồng bộ thông tin, Xuất DOCX) | `syncAnswers` cần `Object.keys(drafts)`; `drafts` là `useState` mỗi instance của `useGuidedDrafts` nên header không đọc được | Nâng `useGuidedDrafts` lên `StageDetail`, truyền xuống editor và header | N (rủi ro P4) |
| C-06 | H | Chip "Bản 2" trên từng tài liệu; "Có thể thêm: <loại>" | Chưa xác nhận có trường version trong `Document` | P6 kiểm tra type. Không có thì bỏ chip; "Có thể thêm" tính từ danh sách loại - loại đã nộp | N |
| C-07 | M | Tab Kết quả: danh sách lần chấm trái + 1 khung PDF phải; không điểm | Code hiện là `RoundCard` accordion, mỗi thẻ 1 iframe; iframe bị ẩn dưới `sm`; có tải PDF từng thẻ | Dựng lại danh sách + 1 viewer ở ≥`md`. Dưới `md`: danh sách + nút "Mở PDF" / "Tải PDF" (giữ cách ẩn iframe) | N |
| C-08 | M | Lịch sử hoạt động nhóm theo ngày, lọc loại, mới nhất trước | API chỉ trả **50 sự kiện mới nhất**, UI đang xếp cũ trước (`case.repository.ts:85-93`) | Đổi thành mới trước (theo mockup). Thêm dòng "Hiển thị 50 sự kiện gần nhất" để không ẩn lặng lẽ | Y (Q5) |
| C-09 | M | Số dư kiểu "lượt còn lại" theo giai đoạn + "Mua thêm" | `StageBalanceTable` đã có, `canBuy = available && packages.length>0` | Restyle, giữ `ServiceCheckoutModal` + luồng thiếu ví (`startShortageDeposit`) | N |
| C-10 | L | Nút "Báo lỗi qua Zalo" ở panel chấm lỗi | Có, copy báo cáo rồi mở `ZALO_GROUP_URL`; nhưng copy UUID, không phải `case_code` | Giữ hành vi. Ghi lỗi nhỏ C-17 | N |

## B. Code có mà mockup chưa tính (đừng làm mất)

| ID | Mức | Code hiện có | Mockup | Mặc định | Cần quyết |
|---|---|---|---|---|---|
| C-11 | H | Luồng `NEXT_PUBLIC_JOURNEY_WORKSPACE=true` bỏ hẳn: chat thảo luận, `StatusGuidanceCard` (765 dòng), chuyển bước intake T2/T16, `confirmComplete`, `?checkout=true`, gating gói AI. `useRealtimeChat` + `useCaseUnreadCount` vẫn chạy mỗi lần mở case (`page.tsx:76-77`) dù không có UI chat | Không nói | **Ngoài phạm vi.** Chỉ redesign đường sống. Đề xuất plan dọn code chết riêng (`page.tsx` 347 dòng, ~3.000 dòng chết). Mở websocket vô ích mỗi trang case là rò rỉ tài nguyên: báo bạn | Y (Q6) |
| C-12 | H | `OverviewMembersSection`, `OverviewGapsSection`, nhu cầu hỗ trợ, thẻ Zalo | Chỉ trường hồ sơ; bỏ Zalo và "Chưa cập nhật" | Đưa tất cả vào mục gập "Hồ sơ dự án", ẩn mục rỗng. Zalo: giữ ở chân sidebar (đã có `JourneySidebar.tsx:51-62`), bỏ `ZaloSupportCard` khỏi Tổng quan | N |
| C-13 | H | Hộp thoại "Lưu và quay về / Bỏ thay đổi" khi rời editor có bản nháp | Không | Giữ nguyên logic. Chỉ restyle | N |
| C-14 | M | `Select` lọc giai đoạn (tất cả/đang làm/xong/sắp mở) ở danh sách Hành trình | Danh sách 4 dòng, không lọc | Bỏ bộ lọc (4 mục, lọc không giúp gì). **Là bỏ hành vi**, báo bạn | Y (Q7) |
| C-15 | M | Tab Tài liệu có tab "Phản hồi ngoài" + lọc vai trò student/supporter (`DocumentWorkspaceHeader`) | Không | P6 đọc `StageFilesView`: nếu chỉ phục vụ supporter (đã đóng băng 2026-10-11) thì bỏ; nếu sinh viên còn thấy thì giữ | Y nếu còn thấy |
| C-16 | M | `missingMandatoryCount` không bao giờ được truyền (luôn 0) nên cảnh báo vàng "còn câu điều kiện" của modal chấm không bao giờ hiện | Mockup có cảnh báo này | **Bug có sẵn, không sửa.** Báo bạn. Mockup vẽ cảnh báo sẽ không bao giờ hiện cho tới khi truyền prop | Y (Q8) |
| C-17 | L | `copyReport` copy UUID case, không phải `case_code` | | Không sửa; ghi nhận | N |
| C-18 | L | `RadarLogsViewer` trong panel chấm | Mockup chỉ vẽ stepper | Giữ, gập mặc định | N |
| C-19 | L | `handleTabChange` bỏ `stage`,`view` khi đổi tab | | Giữ; không đổi hành vi URL | N |
| C-20 | M | Delete case chỉ hiện khi `stage==="submitted"`, gõ `DELETE` | Mockup luôn vẽ hộp, nút không hoạt động | Giữ điều kiện. Không chép "luôn hiện" | N |
| C-21 | M | Lưu cài đặt: nút chỉ khoá khi đang lưu | Mockup: chỉ bật khi có sửa | Nhận hành vi mockup (dirty-gate) | N |

## C. Vi phạm quy tắc repo có sẵn trong file sắp sửa

| ID | Việc | Xử lý |
|---|---|---|
| C-22 | `StageDocumentUploadModal` gọi `apiClient` trực tiếp + try/catch trong component (`:11,:109,:104-138`); hook `useStageDocumentUpload` đã có | Chuyển sang hook ở P6 |
| C-23 | `ServiceCheckoutModal.tsx:87` `catch {}` nuốt lỗi | Xử lý ở P8 (hiện thông báo, ghi log context) |
| C-24 | `toLocaleString("vi-VN")` ra `79.000` (`credit-history.types.ts:52-53`, `CreditBalanceCard`) | `formatVndAmount` mới (P1) |
| C-25 | Nhãn lịch sử dùng "credit" ("Nạp credit"...) | Đổi theo `design-system/wording/pages/case-detail.md` ở P8 |
| C-26 | File >200 dòng sẽ chạm: `CreditTransactionHistory` 418, `AuditConfirmModal` 284, `GuidedDocumentsEditor` 236, `StageGradingPanel` 231, `StageDocumentUploadModal` 224, `CaseOverviewPanel` 229 | Tách theo từng phase |
| C-27 | `NextActions.tsx` mồ côi, sẽ in `stageCode` ("CP1") nếu ai import | Xóa ở P3 |
| C-28 | `STATUS_LABEL` trùng ở `StageCard.tsx` và `OverviewProgressStrip.tsx` | Gộp vào `StatusChip` map (P1) |

## D. Quy tắc/skill mâu thuẫn mockup

| ID | Mức | Việc | Mặc định |
|---|---|---|---|
| C-29 | M | Sidebar thật nền xanh brand đặc (`JourneySidebar.module.css:13`), mockup nền trắng viền phải | Theo mockup (trắng). Ghi vào Q2 vì đổi nhận diện | Y |
| C-30 | M | Topbar mockup 56px, thật 64px (`DashboardShell.tsx:47`) | Giữ 64px. `top`/`height` sidebar dùng token | N |
| C-31 | M | `--app-text-xs/sm` đều 16px ở ≥640px; tiêu đề thật bị ép 600 (`globals.css:188-191`); mockup cần 14px + trọng lượng 400/500 | Thêm token mới `--ui-text-*` chỉ cộng thêm, áp qua CSS module trong vùng redesign. KHÔNG đổi biến cũ (ảnh hưởng admin) | Y (Q3) |
| C-32 | M | Mockup viền 1px; `frontend-ui-rules.md` §6.3 (non-negotiable) bắt 1.5px cho Card/Paper | **1.5px** qua biến, luật dự án thắng mockup | N |
| C-33 | L | Mockup dùng Phosphor; repo bắt Lucide | Map Lucide (bảng ở `reports/mantine-reuse-map.md`) | N |
| C-34 | L | `index.html:11` topbar mockup có chữ "CP1 và CP2"; `billing.js` hiện `cp1_audit` trong `<code>`; catalog hiện "Pass/Fail" | Không chép. Tên dịch vụ dựng từ `stageName` | N |
| C-35 | L | `fmtVND` mockup in `50.000 VND` (dấu chấm) | Sai quy tắc; dùng `formatVndAmount` | N |
| C-36 | L | CP3/CP4 catalog (`questions-cp3.ts`, `questions-cp4.ts`) chứa chữ "CP2/CP3" hiện cho người dùng khi mở khóa | Chưa mở; báo trước khi bạn mở CP3/CP4 | Y (Q9) |
