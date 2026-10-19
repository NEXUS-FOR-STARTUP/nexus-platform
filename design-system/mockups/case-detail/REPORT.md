# Mockup trang chi tiết dự án (case detail): báo cáo quyết định

Tệp này gom mọi quyết định đã chốt trong quá trình làm mockup, để không bị quên. Mockup chỉ là đề xuất UI, không phải code sản phẩm. Dữ liệu hồ sơ, lịch sử và tài liệu là dữ liệu mẫu bịa; câu hỏi và gợi ý lấy từ catalog CP1, CP2 thật.

## 1. Cách xem

- Mở trực tiếp `index.html` bằng `file://`, không cần server.
- Điều hướng bằng query giống UI thật: `?tab=<overview|journey|billing|timeline|settings|spec>&stage=<y-tuong|thi-truong>&view=<draft|files|results>`. Mọi trạng thái mở được bằng URL; nút Back, Forward của trình duyệt hoạt động.
- Tham số chỉ có ở mockup:
  - `?grading=queued|running|failed|cancelled|completed`: hiện bảng tiến trình chấm bài (StageGradingPanel). Không có tham số thì không có bảng.
  - `?answers=all`: giai đoạn Thị trường với toàn bộ câu đã trả lời. Mặc định là `partial` để thấy đủ trạng thái câu hỏi.
- Tab `spec` (Quy ước, tham khảo) chỉ có ở mockup: bảng thang chữ, màu, trạng thái, nút, bề mặt và các dòng câu hỏi.

## 2. Cấu trúc tệp

| Tệp | Vai trò |
|---|---|
| `index.html` | Khung trang và thứ tự nạp script |
| `css/base.css` | Token, khung (topbar, sidebar), thành phần dùng chung |
| `css/views.css` | Style riêng từng màn |
| `js/app.js` | Router theo query, hàm dùng chung, ngăn kéo menu trên điện thoại |
| `js/icons.js` | Icon Lucide inline (tạo từ `lucide-react` của repo, mở được bằng `file://`) |
| `js/data/questions-cp1.js`, `questions-cp2.js` | Câu hỏi, gợi ý lấy từ catalog thật, câu trả lời mẫu bịa |
| `js/data/unlocks.js` | Luật khoá câu, tạo từ catalog thật (`cp1.ts`, `cp2.ts`) |
| `js/data/states.js` | Trạng thái mẫu cho Thị trường (xem mục 5) |
| `js/data/stages.js`, `stage.js`, `history.js` | Dữ liệu từng giai đoạn, lần chấm, giao dịch và sự kiện |
| `js/views/*.js` | Mỗi màn một tệp; `audit.js`, `upload.js`, `grading.js` là hộp thoại và bảng tiến trình |

## 3. Hệ thống chung

- **Token**: lấy theo `apps/web-1` (`globals.css`, Mantine theme): nền trang `#f8fafc`, bề mặt trắng viền 1px `#e2e8f0`, xanh brand `#2563eb`, bo 8px (radius md của Mantine). Font Inter Tight như web-1; máy chưa cài sẽ dùng font hệ thống, nên mockup không chứng minh được độ rộng chữ thật.
- **Thang chữ** (4 bậc, 2 độ đậm): tiêu đề trang 24/500, tiêu đề mục 18/500, thân 16/400, ghi chú 14/400. Không có chữ dưới 14px. Độ đậm 400 và 500.
- **Màu**: một màu nhấn xanh cho nút chính và mục đang chọn. Xanh lục, vàng, đỏ chỉ để báo trạng thái. Màu cam và nút bo tròn hẳn của trang chủ không dùng trong workspace.
- **Bề mặt**: thẻ, hàng danh sách, hộp mục lục đều trắng có viền (giống Paper `withBorder` của web-1). Không shadow ở trạng thái nghỉ; shadow chỉ cho menu `⋯`, hộp thoại và ngăn kéo.
- **Nhãn trạng thái (chip)**: nền màu nhạt, chữ đậm cùng tông, một thành phần dùng cho mọi trạng thái (Đang soạn, Đã có kết quả, Cần bổ sung, Sắp ra mắt, Lỗi). Không còn kiểu badge viết hoa nhỏ.
- **Nút**: mỗi màn một nút chính (xanh); nút còn lại là nút phụ (xám). Ví dụ trong Hành trình: nút xanh chỉ ở trang chi tiết giai đoạn, danh sách giai đoạn dùng nút phụ.
- **Icon**: Lucide cho thao tác và trạng thái (từ gói `lucide-react` trong repo). Icon tệp tài liệu là PNG của sản phẩm (`pdf`, `doc`, `xls`, `ppt`, `txt`), cùng bảng ánh xạ đuôi tệp với `FileTypeIcon.tsx`, chép vào `assets/` để mockup mở độc lập. Chỉ dùng cạnh tên tệp thật.
- **Tabs**: kiểu A (chữ thường, tab đang chọn có thanh xanh dày 3px bên dưới, không có đường kẻ nền) dùng cho cả ba tab Soạn thảo, Tài liệu, Kết quả chấm và bộ lọc loại ở Lượt chấm, Lịch sử. Mockup không còn kiểu khối xám bo tròn nào. Tab giai đoạn hiện có `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` và panel `role="tabpanel"`. **Chưa có** bàn phím theo mẫu ARIA tab (roving tabindex, phím mũi tên trái phải): cả ba tab đều Tab được; Mantine `Tabs` có sẵn phần này nên khi implement thì lấy từ đó. Bộ lọc là nhóm nút `aria-pressed`, vì không đổi panel.
- **Không dùng**: eyebrow viết hoa, đánh số, gradient, font monospace ngoài `<code>`. Hai chỗ có `taste-skill-ignore` kèm lý do: viền của bề mặt web-1 và nhãn "bản 02" (nhãn phiên bản của sản phẩm).
- **Chưa dùng Tailwind Play CDN**: mockup giữ CSS tự viết với token khớp `globals.css`, để mở offline bằng `file://` và chạy được kiểm tra của `lint.mjs`. Play CDN cần mạng và chỉ dành cho phát triển. Nếu muốn chuyển sang lớp Tailwind để copy thẳng vào code thật thì cần một đợt viết lại riêng.

## 4. Khung trang (layout)

- Sidebar cố định bên trái bằng `position:sticky; top:56px` (cao bằng topbar), `height:calc(100vh - 56px)`, `overflow-y:auto` (tự cuộn riêng nếu menu dài). Cuộn là cuộn trang thường: phần main không phải khung cuộn riêng, chỉ sidebar là phần tử dính. Đã đo: cuộn 1400px mà `top` của sidebar vẫn 56px.
- Topbar dính ở đầu trang; bảng gợi ý (hint panel) dính dưới topbar (`top:72px`).
- Điện thoại (≤820px): sidebar thành ngăn kéo rộng tối đa 320px, mở bằng nút burger cố định góc dưới trái; có lớp phủ, nút đóng, phím Esc, khoá cuộn trang nền, vòng Tab nằm trong ngăn kéo, tự đóng khi phóng to lại lên desktop.
- Danh sách dài trên điện thoại gập lại để trang không quá dài (mục lục câu hỏi, gợi ý, lịch sử lượt chấm, từng ngày trong lịch sử hoạt động). Trên desktop các mục này luôn mở.

## 5. Hành trình, Soạn thảo (đã sửa lần này)

- **Trạng thái dòng câu hỏi** theo đúng `GuidedTOC.tsx`, dùng lại icon Lucide của UI cũ:

| Trạng thái | Icon | Điều kiện (khớp UI cũ) |
|---|---|---|
| Đã trả lời | tròn xanh lục có dấu tick (Check) | có nội dung, không ngắn |
| Chưa trả lời | vòng tròn rỗng (Circle) | chưa có nội dung |
| Còn ngắn | tròn cảnh báo vàng (CircleAlert) | chỉ câu `cp2_`, có chữ nhưng dưới 10 từ |
| Đang khoá | ổ khoá (Lock), mờ, không bấm được | thiếu câu điều kiện (`unlock_requires`), hoặc câu bắt buộc liền trước chưa trả lời |
| Đang chọn | nền xanh nhạt, chữ xanh, mũi tên phải | câu đang mở |
| Quan trọng | nhãn cam "Quan trọng" | `cp2_expert_interviews`, `cp2_survey`, `cp2_ai_disclosure` |

- Luật khoá sinh từ catalog thật (49 câu), cùng thứ tự ưu tiên với hook thật: luật riêng của câu, rồi luật của phần cho câu đầu phần, rồi câu bắt buộc liền trước.
- **Dòng dài**: các dòng có nhãn "Quan trọng" cho phép tên câu xuống 2 dòng, để nhãn không làm tên bị cắt vô nghĩa.
- **Cảnh báo còn ngắn** dưới ô trả lời: "Câu trả lời còn ngắn (N/10 từ). Viết thêm để AI có đủ căn cứ chấm." Tính theo lúc gõ, tắt khi đủ 10 từ.
- **Lưu**: bấm Lưu cập nhật câu trả lời trong bộ nhớ và icon trong mục lục đổi theo (chỉ trong phiên xem, không lưu thật).
- **Tự xác nhận (CP2)**: ba câu quan trọng có ô tick "Mục quan trọng khi chấm. Nhóm tự xác nhận, AI chấm sẽ đọc xác nhận này." Đây là checkbox duy nhất mang ý nghĩa, vì ở UI thật trạng thái này được lưu cùng câu trả lời và AI đọc khi chấm.
- **Bỏ checkbox ở gợi ý**: "Cần nêu" và "Tự kiểm tra trước khi lưu" là danh sách bullet thường, vì UI thật cũng không lưu việc tick (không có trường trong DB hay API).
- **Dữ liệu mẫu Thị trường (mặc định `partial`)**: 23 trên 27 câu đã trả lời; câu chuyên gia còn ngắn (6 từ), câu khảo sát và marketing 4P để trống, câu ngân hàng câu hỏi bị khoá do câu khảo sát bắt buộc chưa có. Tổng số câu ở Hành trình và Tổng quan tính từ dữ liệu, không gõ cứng. `?answers=all` không phải "trả lời hết": nó hiện câu trả lời mẫu có sẵn trong catalog, tức 26 trên 27 câu, câu cuối cố ý để trống. Khi lưu câu khảo sát, câu ngân hàng câu hỏi mở khoá và nút "Câu tiếp" bật lại.

## 6. Lượt chấm và thanh toán (đã sửa lần này)

- Giữ dạng danh sách đơn giản; **mỗi dòng bấm để mở rộng**, hiện chi tiết đầy đủ:
  - **Giao dịch**: thời gian đến giây, loại, giai đoạn, dịch vụ (kèm mã `cp1_audit`/`cp2_audit`), biến động, **số dư sau giao dịch**, trạng thái, nguồn, lần chấm, **ID giao dịch** và **mã tham chiếu** (mã lần chấm, mã lần chấm bị lỗi, mã đơn hàng hoặc mã nâng cấp gói). Mỗi mã có nút sao chép.
  - **Đơn hàng** (dòng mua): mã đơn, trạng thái đơn, bảng dịch vụ, số lượng, đơn giá, thành tiền, tổng tiền.
  - **Thanh toán** (dòng mua): phương thức VietQR, nội dung chuyển khoản, mã giao dịch ngân hàng, thời điểm ghi có, cách xác minh.
  - Dòng chấm lỗi có cảnh báo vàng và cùng mã lần chấm với dòng hoàn lượt.
- Số dư sau giao dịch cộng dồn đúng theo từng giai đoạn: Ý tưởng 3, 2, 1, 0, rồi 2; Thị trường 2, 1, 0, 1, 0.
- Trường dữ liệu lấy theo hợp đồng trong repo: `CreditEntry` (`credit-history.types.ts`), `Order`, `OrderItem`, `Payment` và `Deposit` (`apps/web-1/types/payment.ts`; các trường ngân hàng `transfer_content`, `bank_transaction_id`, `bank_credited_at`, `verification_source` có ở cả hai). **Cần lưu ý khi làm thật**: `Order` không chứa thông tin ngân hàng, API phải nối thêm từ `Deposit` hoặc `Payment` cho phần "Thanh toán"; tôi chưa kiểm tra API thật nối được hay chưa. Mã, giá (50.000 VND mỗi lượt) và mã ngân hàng đều là dữ liệu mẫu.
- Trên điện thoại mỗi dòng xếp 2 hàng, chi tiết xuống bên dưới, không tràn ngang (kiểm tra ở 390px).
- Bộ lọc loại, khoảng thời gian và "Xem thêm N giao dịch" (chỉ điện thoại) giữ nguyên.

## 7. Các màn đã chốt

- **Tổng quan**: không gom banner, hành trình, báo cáo, hồ sơ, Zalo thành một trang dài.
  - "Việc tiếp theo" là một câu và một nút (nếu thiếu liên hệ).
  - Hành trình 4 dòng; hai giai đoạn khoá gộp thành một dòng.
  - "Báo cáo gần đây" (3 báo cáo mới nhất, mỗi dòng có nút Xem).
  - Mã dự án `NX-894046` là nút sao chép.
  - "Hồ sơ dự án" là mục gập, dòng đầu ghi "Còn thiếu N thông tin", chỉ hiện trường có dữ liệu.
  - Bỏ card Zalo (sidebar đã có) và 14 dòng "Chưa cập nhật".
- **Hành trình**: danh sách giai đoạn dùng nút phụ. Trang chi tiết: breadcrumb, tên giai đoạn kèm chip, nút chính (Chấm bài, Chấm lại, hoặc Mua lượt chấm khi hết lượt, khoá khi đang chấm), menu `⋯` (Đồng bộ thông tin, Xuất DOCX) chỉ ở tab Soạn thảo, ba tab Soạn thảo, Tài liệu, Kết quả chấm (kiểu tabs A).
- **Tab Tài liệu**: nhóm theo phân loại (thay bảng 7 cột), mỗi tệp một dòng, tải xuống và xoá là nút icon; hộp thoại tải tài liệu có đủ luật (tối đa 5 tệp, 25MB, PDF, DOCX, XLSX, PPTX, TXT, gán loại cho từng tệp, thông báo lỗi đúng câu chữ UI cũ). Thị trường có khung "Lưu ý quyền riêng tư".
- **Tab Kết quả chấm**: danh sách các lần chấm bên trái, xem PDF bên phải (khung PDF là khung giữ chỗ). Không hiển thị điểm hay xu hướng tăng giảm: điểm chỉ nằm trong PDF, không có cột lưu riêng.
- **Hộp thoại xác nhận chấm bài** (`AuditConfirmModal`), **bảng tiến trình chấm** (`StageGradingPanel`, năm trạng thái queued, running, failed, cancelled, completed; bước thật lấy từ `audit-checkpoints.ts`).
- **Quy ước**: bảng thang chữ, màu, trạng thái, nút, bề mặt, dòng câu hỏi.

## 8. Đã khoá, không sửa thêm

- **Lịch sử hoạt động** (timeline dọc, nhóm theo ngày, lọc theo loại, gập nhóm trên điện thoại).
- **Cài đặt** (kiểm tra bắt buộc khi lưu, thông báo lỗi và thành công đúng câu chữ UI cũ, nút Lưu chỉ bật khi có thay đổi).

## 9. Chưa làm, chưa kiểm tra

- Tổng quan chưa dựng `NextActions`, `OverviewHero` (chỉ hiện khi đã đủ liên hệ), `OverviewIdeaGuideAlert`, `OverviewProgressStrip` (đủ 4 giai đoạn), vì ca mẫu thiếu liên hệ.
- Hai giai đoạn Sản phẩm, mô hình và Gọi vốn, tài chính chưa có trang chi tiết.
- Chưa dựng nhóm câu hỏi khoá theo `unlock_requires` của phần (ví dụ "Chuẩn bị phản biện") như thông báo riêng; mục lục chỉ làm mờ và vô hiệu hoá câu bị khoá, giống UI cũ.
- Chưa kiểm tra: ngưỡng 768px của hai hộp thoại mới, giới hạn 25MB của tải tệp, bảng chi tiết giao dịch ở màn hẹp hơn 390px, chế độ tối.
- Chưa dựng card số dư kiểu "đã mua, đã dùng, đã hoàn" (chưa có yêu cầu).
- Phần "Thanh toán" cần nối dữ liệu ngân hàng ở API (xem mục 6).
- `inspect.mjs` đã chạy một lần; vẫn báo lỗi nặng vì mockup không có chữ lớn, ảnh hay video (đó là tiêu chí của landing page, không áp dụng cho màn hình sản phẩm).
- `lint.mjs` hiện 0 FAIL, 14 WARN (trước đợt này là 12): font Inter Tight của sản phẩm, viền của bề mặt web-1 (bảng chi tiết giao dịch, dòng câu hỏi), nhãn phiên bản "bản 02", và hai cảnh báo "copy" về cụm từ chung chung. Chưa xem từng cảnh báo mới để xác định hai cảnh báo thêm là câu chữ nào.

## 10. Việc cần xoá khi duyệt xong

Cả thư mục `design-system/mockups/` là mockup tạm; sau khi duyệt xong thì xoá hoặc chuyển thành tài liệu. Hai tệp `CaseCard.tsx` và `globals.css` đang sửa trong working tree không thuộc mockup này.

## 11. Ánh xạ sang web-1 (cho người implement)

Mockup là đặc tả hình thức; code thật dùng Mantine v9 + token trong `globals.css`, Tailwind chỉ bổ trợ. **Không chép CSS của mockup**; dựng bằng thành phần Mantine rồi chỉnh theo bảng dưới. Cột "Khác UI hiện tại" là chỗ cố ý đổi, đừng sửa về như cũ. Tên tệp lấy từ `apps/web-1/app/dashboard/case/[id]/_components/` trừ khi ghi khác.


### Thành phần

| Mockup | Thành phần web-1 (tệp) | Khác UI hiện tại |
|---|---|---|
| Tabs kiểu A (Soạn thảo, Tài liệu, Kết quả chấm; bộ lọc loại ở Lượt chấm, Lịch sử) | `Tabs` trong `workspace/stage/StageDetail.tsx` (hiện `variant="pills" radius="md"`, có icon bên trái) | **Thay đổi có chủ ý, đừng giữ kiểu pills**: không nền cho danh sách tab, không icon, không đường kẻ nền, tab đang chọn có `border-bottom: 3px solid var(--color-brand)`; dùng `Tabs` mặc định kèm `classNames` hoặc CSS variables. **Chưa kiểm tra**: `variant="default"` của Mantine có sẵn đường kẻ nền 1px dưới danh sách tab; cần ghi đè nếu muốn bỏ. Giữ `role`, `aria-selected`, `aria-controls` (Mantine `Tabs` đã tự sinh). Bộ lọc loại không đổi panel nên dùng nút `aria-pressed`, không dùng `Tabs`. |
| Chip trạng thái | `Badge` trong `workspace/StageCard.tsx` (`STATUS_META`: gray, blue, cyan, orange, green; `variant="filled" size="sm"`) | Mockup dùng nền nhạt, chữ đậm cùng tông, cao 28px, bo 6px: tương ứng `variant="light"`, `size="md"`, `radius="sm"`. Bộ màu rút còn: xanh dương = Đang soạn, xanh lá = Đã có kết quả, cam = Cần bổ sung, xám = Sắp ra mắt, đỏ = Lỗi; bỏ cyan. Chưa kiểm tra tương phản từng màu với `variant="light"`. |
| Nút chính, nút phụ | `Button` (mặc định) và `Button variant="default"` | Mỗi màn một nút chính; danh sách giai đoạn dùng nút phụ, nút xanh chỉ ở trang chi tiết. Bo 8px là mặc định `md` của Mantine, không cần ghi đè. |
| Thẻ, hàng danh sách, mục lục | `Paper withBorder radius="md"` | Không shadow ở trạng thái nghỉ. |
| Sidebar cố định | `workspace/JourneySidebar.tsx` (+ `.module.css`) | `position:sticky; top:<chiều cao topbar>; height:calc(100vh - topbar); overflow-y:auto`; main cuộn theo trang thường (không tạo khung cuộn lồng nhau). |
| Ngăn kéo điện thoại | `workspace/JourneyMobileNav.tsx` (`Drawer`) | Nút mở là burger cố định góc dưới trái; chưa kiểm tra khoá cuộn, vòng Tab và Esc có sẵn trong `Drawer` không. |
| Mục lục câu hỏi | `guided-documents/GuidedTOC.tsx` | Gần như giống; thêm nhãn "Quan trọng", tick xanh lá, luật khoá và cảnh báo còn ngắn lấy từ `answer-quality.ts` và hook `useGuidedDocuments`. |
| Gợi ý "Cần nêu", "Tự kiểm tra" | `guided-documents/GuidedQuestionCard.tsx` | Danh sách bullet, không checkbox; checkbox chỉ cho ba câu quan trọng (`Cp2SelfCheck.tsx`). |
| Bảng tiến trình chấm | `workspace/stage/StageGradingPanel.tsx` (`Stepper`, `Collapse`) | Giữ cấu trúc; chỉ xếp dọc trên điện thoại. |
| Hộp thoại xác nhận chấm, tải tài liệu | `workspace/stage/AuditConfirmModal.tsx`, `StageDocumentUploadModal.tsx` | Mockup mô phỏng luật hiện có; không đổi luật. |
| Lịch sử lượt chấm có dòng mở rộng | `CreditTransactionHistory.tsx` (hiện `Table` 740px cuộn ngang) | Đổi từ bảng cột sang danh sách dòng bấm để mở; phần mở rộng cần thêm dữ liệu mà hiện bảng không hiện (xem mục 6). |
| Icon tệp PNG | `components/ui/FileTypeIcon.tsx` | Giữ nguyên; chỉ dùng đúng thành phần này, không thêm icon tệp Lucide. |

### Token

| Mockup | Giá trị | web-1 |
|---|---|---|
| Nền trang | `#f8fafc` | `--color-bg` (đã có) |
| Bề mặt | `#fff` | `--color-surface` (đã có) |
| Nền xám bề mặt | `#f1f5f9` | `--color-surface-soft` (đã có) |
| Viền | `#e2e8f0` | `--color-border` (đã có) |
| Chữ chính, chữ phụ | `#0f172a`, `#475569` | `--color-text`, `--color-text-muted` (đã có, đúng từng giá trị ở chế độ sáng) |
| Xanh brand, nền nhạt | `#2563eb`, `#eff6ff` | `--color-brand`, `--color-brand-subtle` (đã có) |
| Nền chip (xanh lá, cam, đỏ) | `#d1fae5`, `#fef3c7`, `#fee2e2` | `--color-success-soft`, `--color-warning-soft`, `--color-danger-soft` (đã có, đúng giá trị ở chế độ sáng; chế độ tối là `rgba` trong suốt nên cần kiểm tra chữ chip ở chế độ tối). Chữ đậm của chip (`#065f46`, `#92400e`, `#991b1b`) chưa có token. |
| Thang chữ | 24/500, 18/500, 16/400, 14/400 | `--app-text-xs`, `--app-text-sm` hiện đều là 16px từ 640px trở lên (đã đọc `globals.css`); **tiêu đề, mục, thân chưa có token riêng**, cần thêm. Mockup dùng 14px cho ghi chú, nên cần hạ `--app-text-xs` về 14px hoặc thêm token mới (chưa quyết định) |
| Độ đậm | 400 và 500 | Bỏ 600 và 700 trong workspace |
| Bo góc | 8px | Mantine `defaultRadius: "md"` (đã có), không cần đổi |

### Quy tắc khi implement

1. Dùng thành phần Mantine trước; chỉ thêm Tailwind cho khoảng cách và màu qua token. Không thêm lớp định vị thủ công (`fixed`, `inset-0`) vào `Modal` hoặc `Drawer`.
2. Không gọi `apiClient` trực tiếp trong UI; dữ liệu mở rộng của giao dịch qua hook.
3. Giữ mỗi tệp ≤200 dòng (`CreditTransactionHistory.tsx` hiện 418 dòng nên tách khi sửa).
4. Admin chỉ desktop (`DesktopOnlyNotice`); mockup này chỉ nói về giao diện sinh viên.
5. Chỉ dùng chữ tiếng Việt cho người dùng; không hiện CP1, CP2 ở giao diện.
6. Sau khi dựng, so lại với mockup ở 1440px và 390px.

