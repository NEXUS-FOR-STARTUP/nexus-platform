# Brainstorm 2026-10-24 — Mở dịch vụ chấm CP3 và CP4

> Báo cáo lưu lại để phân tích tiếp. Chưa có plan, chưa có code nào được viết trong session.
> Ghi chú: mục "Đã xác nhận" là điều đọc trực tiếp từ file. Mục "Suy luận / chưa kiểm" là điều chưa chạy thử.

## 1. Mục tiêu session
Bàn cách mở dịch vụ chấm AI cho CP3 và CP4 (đã có template câu hỏi + DOCX, chưa có dịch vụ chấm), có liên kết các checkpoint sau. Ưu tiên CP3.

## 2. Hiện trạng đã xác nhận
- Template CP3 (27 câu, `packages/validation/src/catalogs/cp3.ts`, `questions-cp3.ts`) và CP4 (`cp4.ts`, `questions-cp4.ts`) đã xong, có `sync-rules.ts` nạp câu trả lời CP1/CP2 sang.
- `AUDIT_SERVICES = { CP1, CP2 }` (`apps/api/src/modules/ai-engine/application/audit-services.ts`). `getAuditService("CP3")` ném 400 `AUDIT_SERVICE_NOT_AVAILABLE`; test `audit-services.test.ts` đang khẳng định điều này.
- `stages.ts`: CP3, CP4 `serviceType: null, available: false`. Web `GuidedTemplateGallery.tsx` khóa bằng `COMING_SOON_TEMPLATES = ["cp3","cp4"]`.
- Hạ tầng dùng lại được: queue BullMQ, credit/ledger, refund, PDF, finalizer, `_library`.
- Giá hiện có: `pkg_ai_audit` (CP1) 79.000đ/2 lượt, `pkg_cp2_audit` 79.000đ/2 lượt (`prisma/seeds/seed-active-packages.ts`). `service_types` của CP2 được thêm bằng migration `INSERT INTO service_types` (`20261010170000_cp2_credit_ledger_by_service_type`).

## 3. Tài liệu đã đọc
| Nguồn | Của ai | Ghi chú |
|---|---|---|
| `E:\FPT\Semester_7\EXE101\CP3-Requirements-EXE101SP26 (2).pdf` | thầy Thanhntl2 | MVP 120đ + BMC 30đ; yêu cầu giá, ≥10 tester, iterate/persevere, AI Disclosure (thiếu = rớt), BMC 1 trang. Không có SWOT. **Chỉ tham khảo** (quyết định của user) |
| `E:\...\CP4-Paths-Requirements-EXE101SP26-1 (2).pdf` | thầy Thanhntl2 | Path 1 400đ: Porter, định giá, vốn gọi, P&L tháng năm 1 + 3 năm. Tham khảo |
| `E:\...\CP3\HƯỚNG DẪN MVP_BMC_SWOT.pdf` | cô Hanhlh5 | **Nguồn rubric chính.** BMC 9 ô liên kết chặt; SWOT mỗi yếu tố có số liệu định lượng; 4 chiến lược S-O/S-T/W-O/W-T |
| `E:\...\CP3\SWOT.pdf` | cô Hanhlh5 | Ma trận 2×2 trống, mỗi ô 5 dòng |
| `E:\...\CP3\MVP_BMC_SWOT.pdf` | cô Hanhlh5 | Slide ảnh, trích văn bản thất bại. **User bảo bỏ qua OCR** |
| `docs/nexus-document/cp3|cp4/feedback/*-summary.md` | mentor | CP4: điểm bị trần bởi pitching, không công khai |
| `E:\...\CP4\FINANCE TEMPLATE.xlsx`, `101_13_Nexus_CP4_P&L.xlsx`, hướng dẫn P&L | — | xem mục 4 |
| `tmp/` 3 prompt của member | member | xem mục 6 |

## 4. Phát hiện về Excel CP4 (`FINANCE TEMPLATE.xlsx`)
Đã xác nhận bằng openpyxl (đọc nội dung ô):
- `B33 = B31*B33` tự tham chiếu chính nó; `C33 = C31*D34` trỏ nhầm ô (phải là `C32`). Các cột D–M đúng `=x31*x32`.
- Hàng margin cho `#DIV/0!` khi chưa nhập số: **không phải lỗi template** (bạn kế toán đúng ở điểm này).
- Giá trị `#REF!` là **giá trị lưu sẵn trong file**; chưa tính lại bằng Excel/LibreOffice nên không khẳng định Excel hiện đúng như vậy.
- Metadata người tạo là "Ha Phan", ngày tạo 2023. **Chưa chứng minh nguồn gốc là của cô**; đã rút lại câu "cô là người tạo".
- Thuế nhập tay (0), ô trống `B5`/`B6`, 4 sheet rỗng: **không coi là lỗi công thức**, có thể là lựa chọn thiết kế. 12 quý so với yêu cầu "tháng năm 1 + 3 năm": chênh lệch giữa hai tài liệu, không phải lỗi công thức.
- Bản trong repo `apps/web-1/public/templates/finance-template.xlsx` (sửa 2026-10-24 19:33): `B33/C33` đã đúng, margin có `IF`, còn 1 sheet. User báo template CP4 đã xong.
- Nếu làm kiểm tra Excel bằng code: dò theo **nhãn dòng** (nhóm 13 tự đổi bố cục sang học kỳ + thêm dòng + sheet Charts); báo tham chiếu vòng và công thức lệch hàng, không báo ô trống/thuế nhập tay.

## 5. Quyết định đã chốt (user)
| # | Quyết định |
|---|---|
| D1 | Nguồn rubric CP3 = **ba tài liệu của cô Hanhlh5**. File của thầy Thanh chỉ tham khảo, không dùng số điểm, không ép format |
| D2 | **Thang 100** như CP1/CP2 |
| D3 | **Không đánh giá MVP sản phẩm**; ghi thành luật cứng trong system prompt. Chỉ chấm cái chấm được. Giao diện báo rõ phần MVP không được chấm |
| D4 | Phạm vi chấm = template hiện có; **không bổ sung** câu hỏi (giá, tester, iterate, AI Disclosure) |
| D5 | AI Disclosure và BMC một trang: **cô đã đồng ý bỏ** (user xác nhận, không đòi nguồn) |
| D6 | Đầu vào: `answers` / `files` / `both` như CP2 (có đọc tài liệu tải lên) |
| D7 | **Có resubmit** như CP1/CP2, chấm nhiều lần |
| D8 | CP3 đọc tài liệu CP1/CP2 làm bối cảnh qua `_library` (không phải bằng chứng) |
| D9 | CP4 trả **mức sẵn sàng + danh sách lỗi, không điểm số** |
| D10 | Giá CP3 = **79.000đ**; mở bán (`is_active: true`). Giả định của AI: 2 lượt như CP1/CP2 — **chưa user xác nhận số lượt** |
| D11 | Tiêu chí chấm **nội dung và khả năng truy vết, không chấm hình thức** (không bắt mã S1/W1, số lý do, số mốc) |
| D12 | So sánh với CP1/CP2 là **lưu ý không tính điểm** (xem mục 7) |

Ghi chú nội bộ: ghi chú họp ban đầu nói "CP3 BMC khó nên tăng giá", "chờ giá CP3-CP4 trước khi bán gói trọn CP1→CP4". Sau đó user chốt 79k cho CP3; giá CP4 và gói trọn **chưa chốt**.

## 6. Đánh giá 3 prompt của member (`tmp/`)
Kết luận: **không đưa nguyên bộ vào `data/system-prompts/`.**

Bỏ: workflow operator (điều phối chat thủ công; ta có coordinator); Triad (packet trung gian "không phải bằng chứng", chạy hai lượt LLM; CP2 đã bỏ Triad); output markdown 23 dòng thay vì JSON; kích thước ~108KB (CP2 ~49KB).

Lấy (nguyên liệu): B01–B09 tiêu chí BMC; bảng mối nối (§7 Gate); phân biệt dữ liệu/giả định/diễn giải/kế hoạch (§8.2); issue có "điều kiện đóng" (§9.2); 8 tình huống chuẩn (§14.1) làm bộ test hồi quy; không phạt kết quả test âm tính.

Lưu ý: Gate có yêu cầu nguồn/vị trí cho mỗi issue và claim (lỗi nhận xét ban đầu "không có trích dẫn" đã sửa). Cái thiếu là **bước máy kiểm tra trích dẫn**. Bộ prompt cố ý đặt `REQUIRE_AI_LOG=false`, "BMC không một trang không tạo lỗi" (trái PDF thầy, khớp D5). M07–M14 (giá, tester, dữ liệu gốc, quyết định) không áp dụng vì D4. Chưa đọc phần schema packet cuối Triad và Phụ lục A (mẫu điền) của Gate. Chưa chạy thử prompt trên bài thật.

## 7. Bảng check CP3 đề xuất (24 tiêu chí, chờ user duyệt)
Cơ chế tính điểm đã đọc (`packages/validation/src/catalogs/cp2-audit-score.ts`):
- `gate`, `core` trọng số 2; `normal` trọng số 1 trong nhóm.
- Gate trượt/thiếu → tổng ≤ 49 (CHƯA ĐỦ YÊU CẦU BẮT BUỘC). Gate `partial` hoặc core trượt/thiếu → tổng ≤ 74 (CẦN BỔ SUNG). Core `partial` không bị chặn trần. ≥ 75 SẴN SÀNG.
- `not_applicable` bị loại khỏi mẫu số; trọng số nhóm được chuẩn hóa lại. Hàm chỉ đọc `checks`, **không đọc `crossIssues`**.

| Nhóm (trọng số) | id | Tiêu chí | Mức |
|---|---|---|---|
| Khách hàng & giá trị (20) | `c3_segment_narrow` | Phân khúc đủ hẹp, có nhóm khởi đầu cụ thể | core |
| | `c3_usp_differentiated` | Một câu USP, hơn cách hiện tại ở đâu, khó sao chép | core |
| | `c3_value_fits_pain` | USP đáp đúng nỗi đau của phân khúc | normal |
| | `c3_channels_fit_segment` | Kênh có lý do, khách ở phân khúc có mặt ở kênh | normal |
| | `c3_retention_mechanism` | Nêu được điều khiến khách quay lại | normal |
| Mô hình tiền (20) | `c3_revenue_concrete` | Giá/gói, đơn vị, giá thử hay chốt, có căn cứ | core |
| | `c3_cost_quantified` | Phân biệt chi phí đầu tư/vận hành/biến đổi, có số cho khoản lớn | core |
| | `c3_revenue_vs_cost` | Doanh thu cạnh chi phí thấy lãi/lỗ, không tự mâu thuẫn | normal |
| Vận hành (10) | `c3_resources_to_activities` | Nguồn lực gắn với hoạt động | normal |
| | `c3_activities_create_value` | Hoạt động chính tạo giá trị/doanh thu | normal |
| | `c3_partners_dependency` | Đối tác: cung cấp gì, phụ thuộc, thay thế | normal |
| Nhất quán BMC (10) | `c3_bmc_complete` | Cả 9 ô có nội dung thật | **gate** |
| | `c3_bmc_no_contradiction` | 9 ô không mâu thuẫn nhau | core |
| Bằng chứng SWOT (20) | `c3_swot_complete` | Đủ S, W, O, T có nội dung thật | **gate** |
| | `c3_swot_quantified` | Mỗi yếu tố có số liệu/ví dụ cụ thể | **gate** |
| | `c3_weakness_honest` | Điểm yếu thật, không phải điểm mạnh trá hình | normal |
| | `c3_opportunity_sourced` | Cơ hội có nguồn kiểm chứng được | normal |
| | `c3_threat_competition` | Có ít nhất một thách thức từ đối thủ/giải pháp thay thế | normal |
| Chiến lược SWOT (10) | `c3_strategies_complete` | Có đủ bốn loại chiến lược (mạnh+cơ hội, mạnh+thách thức, yếu+cơ hội, yếu+thách thức) | core |
| | `c3_strategy_pairing` | Mỗi chiến lược truy được về yếu tố nó dựa vào, ghép đúng loại (không bắt mã) | core |
| | `c3_strategy_actionable` | Hành động cụ thể, làm được trong thời gian dự án | normal |
| Kết luận (10) | `c3_findings_grounded` | Có kết quả định lượng, khớp phần trên | normal |
| | `c3_feasibility_evidence` | Kết luận khả thi có bằng chứng đỡ và nêu điều chưa chắc | normal |
| | `c3_next_steps_actionable` | Bước tiếp theo cụ thể, gắn kết quả mong đợi | normal |

Tổng trọng số nhóm 20+20+10+10+20+10+10 = 100. Ba cổng chặn: `c3_bmc_complete`, `c3_swot_complete`, `c3_swot_quantified`. Mức, trọng số, tiêu chí là đề xuất, **chưa user duyệt và chưa hiệu chỉnh trên bài thật**.

Đã **bỏ**: `c3_swot_codes` (chấm hình thức); `c3_prior_stage_consistent` (xem dưới).

Nhãn kết luận đề xuất (theo mẫu CP2): `SẴN SÀNG TRÌNH BÀY` / `CẦN BỔ SUNG` / `CHƯA ĐỦ YÊU CẦU BẮT BUỘC`.

Luật bắt buộc trong prompt: không chấm/nhận xét MVP (kể cả câu `cp3_key_findings` có chữ "thử nghiệm": chỉ xét tính cụ thể, có số, nhất quán; không đánh giá MVP tốt/xấu); không chấm hình thức; không thêm AI Disclosure, số trang, BMC một trang, số tester.

**So sánh CP1/CP2 (D12):** bộ kiểm tra trích dẫn CP2 (`cp2-quote-verify.ts`) coi nguồn trong `context/` và `_library/` là `unverified`; lệnh cho model cũng cấm trích context làm bằng chứng. Nên bỏ check chấm điểm đó. Thay bằng `crossIssues` mức MINOR, tiêu đề cố định kiểu "Khác biệt so với giai đoạn trước", bằng chứng chỉ trích phía CP3, phần lịch sử nói bằng lời trong `action` dưới dạng câu hỏi để nhóm giải thích. Không kết luận "mâu thuẫn/sai" từ phần lịch sử. Phân biệt đổi hướng có lý do (không phạt). Nếu sau này muốn chấm điểm so sánh lịch sử: cần snapshot câu trả lời giai đoạn trước + loại trích dẫn riêng kiểm bằng snapshot; đề xuất không làm trong CP3.

## 8. Điểm chạm kỹ thuật cho CP3 (đọc từ code; chưa chạy thử)
| Khu vực | Việc |
|---|---|
| `packages/shared` | dòng `CP3` trong `AUDIT_CHECKPOINTS` (một scope, hai loại `initial`/`resubmit`, output, progressSteps); `stages.ts` mở CP3 |
| API | `audit-services.ts` (planScope cố định); `audit-registry.ts` đăng ký assembler/post-processor; assembler CP3 (chỉ render câu hỏi CP3 như `renderCp2Answers`, **không** dùng `renderStageAnswers` khi `AUDIT_STAGE_INPUT_RULES` bật vì nó gộp cả stage trước thành "bằng chứng"); post-processor; `AGENTS.md` builder; instruction builder |
| Validation | catalog check + điểm + schema `report.json` (hiện cứng `CP2_SCHEMA_IDS`) + nhãn nhóm PDF; test đồng bộ id prompt |
| Validator sandbox | `packages/validation/tsup.cli.config.ts` chỉ bundle `validate-cp2-report`; cần bản CP3 hoặc CLI tổng quát |
| **Hồi quy cần chặn** | `report.repository.ts` `findApprovedReports` chỉ loại `CP2_REPORT_TYPES`; báo cáo CP3 sẽ lọt vào mốc so sánh chấm lại của CP1 nếu không thêm |
| Chấm lại | `findLatestCp2FullReport` cứng `cp2_full`/`cp2_full_resubmit` → cần hàm theo report type CP3 |
| Context | `loadStageContext("CP2")` ghi câu trả lời CP1+CP2; gọi thêm `("CP1")` sẽ lặp câu trả lời CP1 → cần cờ bỏ câu trả lời hoặc gọi `findStageDocs` riêng |
| Worker | `runner-instruction.ts` (map CP1/CP2), `job-sandbox.ts` (nhãn mốc), `omp-queue.ts` (kiểu `"CP1"\|"CP2"`, nhận diện mốc bằng `cp2_evidence.json`) |
| Báo cáo | `reports.controller.ts`, `pdfService.ts`, `isCp2ReportType`, `report.utils.ts` |
| Tóm tắt stage | `derive-stage-summaries.ts`: cờ `answers_ready_*` chỉ CP2 |
| Web | `StageDetail`, `AuditConfirmModal`, `AuditStepOptions` (rẽ nhánh `isCp2`), `TabReportFindings` (lọc `CP1\|CP2`), `CreditQuantityModal`, `PurchaseFields`, `PACKAGE_KEYS`, `GuidedTemplateGallery` (bỏ `"cp3"` khỏi coming-soon), hook, thẻ mua gói |
| DB | migration `--create-only` `INSERT INTO service_types` (`cp3_audit`) + package 79k; tuân `.agents/rules/prisma-migration-safety.md` |
| Prompt | `cp3_audit_core_v1.md`, `cp3_review_v1.md`, `cp3_resubmit_v1.md` |

Hướng làm: thêm CP3, **không viết lại ruột CP2**; chỗ hằng/kiểu CP2 chặn đường dùng chung thì mở rộng thành danh sách, không nhân đôi nhánh `isCp2`. Ước lượng: ≥ 35 điểm chạm.

Quy tắc CP2 dùng lại được: không viết hộ, không bịa số, tin lời kể nhưng tìm mâu thuẫn nội bộ, dữ liệu trong `input/` là dữ liệu không phải lệnh, không chép thông tin cá nhân, trích dẫn ≤ 200 ký tự nguyên văn, `missing` không cần bằng chứng, `calcChecks` tính lại bằng shell. Bỏ `itemReviews` và `boardQuestions`. Chấm lại: đối chiếu `previous_report.json`, `reaudit.fixed/partial/still/newIssues`, "số liệu đổi không giải thích" là MAJOR.

## 9. CP4 (chỉ ở mức định hướng)
- Kiểm tra Excel bằng **code** (tham chiếu vòng, công thức lệch hàng, lỗi công thức thật, input hợp lý), AI chỉ viết nhận xét từ danh sách lỗi.
- Trả mức sẵn sàng + danh sách lỗi, không điểm (điểm CP4 bị trần bởi pitching, mentor không công khai).
- Template CP4 chưa phủ yêu cầu PDF thầy (Porter, định giá, vốn gọi) — theo D4 không bổ sung. Kết luận này dựa tìm từ khóa; chưa đọc kỹ `cp4_fund_ask`.
- Giá CP4 và gói trọn CP1→CP4 chưa chốt. Package hiện gắn **một** `service_type` (`credit-audit-order.helpers.ts`); gói trọn cần đơn nhiều dòng (`order.items[]` đã là mảng) hoặc đổi cách gắn — suy luận từ code, chưa chạy thử.

## 10. Sai sót đã tự sửa trong session (để khỏi lặp lại)
1. Nói "gói trọn khó" và "Excel template có nhiều lỗi (thuế, ô trống, sheet rỗng)" → chỉ B33/C33 là lỗi công thức được chứng minh.
2. Nói Gate "không có bằng chứng bắt buộc" → sai; Gate có yêu cầu nguồn/vị trí, chỉ thiếu bước kiểm máy.
3. Nói "chỉ 10% prompt member hữu dụng" khi chưa đọc hết → sau khi đọc: khoảng một phần ba (ước lượng chủ quan).
4. Đề xuất `c3_swot_codes`, "2–3 lý do", "ba mốc" → chấm hình thức, đã bỏ/sửa.
5. Đề xuất `c3_prior_stage_consistent` chấm điểm → đã đổi thành lưu ý không tính điểm.
6. Nói "cô là người tạo file Excel" → chưa chứng minh, đã rút lại.
7. Đề xuất giữ package CP3 `is_active=false` → hết hiệu lực vì user chốt giá 79k.
8. Lúc đầu đề xuất CP3 "chỉ chấm câu trả lời" → bỏ vì CP2 đã đọc file tải lên và MVP (ảnh) đã loại khỏi phạm vi.

## 11. Chưa kiểm tra / chưa làm
- Số lượt của package CP3 (giả định 2 lượt, như CP1/CP2).
- Agent trong sandbox đọc được định dạng nào (ảnh, docx, pdf) cho bài BMC dạng ảnh.
- Tính lại `FINANCE TEMPLATE.xlsx` bằng Excel/LibreOffice (chỉ đọc công thức).
- `cp4_fund_ask` và phần còn lại của `NỘI DUNG CHECKPOINT 3.md`, 3 PDF pitch deck CP4, file Excel nhóm 155.
- Phần schema packet cuối Triad và Phụ lục A của Gate (member).
- Chi phí chạy thật của một lượt chấm CP2 (từ `ai_jobs`) — mốc để định giá CP4 và đánh giá giá CP3.
- Ý kiến Marketing về độ khó BMC.
- Hiệu chỉnh bảng check trên bài thật (hai mẫu: `101_13_Nexus_CP3.md`, `101_155_RootAccess_CP3.pdf`, đều là tài liệu Word/PDF, phải chuyển tay thành câu trả lời theo 27 câu mới chạy thử được).
- OCR `MVP_BMC_SWOT.pdf`: user bảo bỏ qua.

## 12. Việc có thể làm tiếp (chưa được user yêu cầu)
1. Duyệt bảng check mục 7 (ba cổng, trọng số 7 nhóm).
2. Chạy `/ck:plan` cho CP3 (user đã yêu cầu viết report thay vì plan ở lượt này).
3. Bộ kiểm tra Excel CP4 bằng code.
4. Đo chi phí chạy thật CP2 để làm mốc định giá.

## 13. Cập nhật: tài liệu Fall26 của cô Hanhlh5 (`tmp/co-hanhlh5-moi-nhat/`) và ưu tiên nguồn

### 13.1 Nguyên tắc mới (user chốt)
- Cô Hanhlh5 thuộc hội Khởi nghiệp Quốc gia phía Nam (lớn hơn trường) → chuẩn của cô được **ưu tiên hơn chuẩn của thầy Thanhntl2** cho cả CP2 và CP3. Chuẩn thầy chỉ để tham khảo.

### 13.2 Hai file mới
- `BMC_SWOT.pptx` (8 slide): BMC + SWOT, không có MVP/UX, không có điểm số. Metadata: tác giả nga1968@gmail.com (Nguyen Van Nga), nội dung ghi 9/2025, logo Khởi nghiệp Quốc gia phía Nam, tức deck bên ngoài cô dùng lại. Chưa đối chiếu được với `MVP_BMC_SWOT.pdf` cũ (bỏ OCR). SWOT slide 7 là ảnh EMF: chỉ đọc được 4 tiêu đề ô S/W/O/T; chưa biết có 4 chiến lược S-O/S-T/W-O/W-T hay không (yêu cầu này vẫn có căn cứ từ `HƯỚNG DẪN` và `SWOT.pdf` cũ).
- `Huong_dan_Market_Research_CP2_EXE101_Fall26.docx`: thang 100 (VPC 10, khám phá khách hàng 25, iterate/pivot 15, cạnh tranh 15, TAM/SAM/SOM 25, trình bày 10). Quét từ khóa: không có `MVP`, `chuyên gia`, `AI`, `Harvard`, `4P`, mức tối thiểu; Porter ghi "không bắt buộc".

### 13.3 CP3: thay đổi so với mục 7 (D1–D12 và bảng 24 tiêu chí giữ nguyên, chỉ chỉnh)
| Thay đổi | Lý do |
|---|---|
| `c3_revenue_concrete`, `c3_cost_quantified`: **core → normal**; sửa chữ: nêu nguồn thu và cách tính tiền; phân biệt chi đầu tư ban đầu / chi vận hành, khoản chính được gọi tên; số ước tính là điểm cộng, không bắt buộc | Ví dụ BMC sữa chua của cô chỉ liệt kê sản phẩm và loại chi, không giá, không số. Ô hỏi của cô hỏi "nguồn nào / khoản nào", không hỏi "bao nhiêu". Quy tắc "phải có số" của cô chỉ áp dụng cho SWOT |
| `c3_segment_narrow` thêm: quy mô và địa điểm | Ô 1 của cô: "cho ai, ở đâu, quy mô tiêu thụ bao nhiêu" |
| `c3_usp_differentiated` thêm: tính mới, đặc biệt | Slide USP |
| `c3_strategy_actionable` thêm: dựa trên số liệu hoặc xu hướng | Slide 4: chiến lược căn cứ dữ liệu quá khứ và dự báo xu hướng |
| Không đổi: ba cổng `c3_bmc_complete`, `c3_swot_complete`, `c3_swot_quantified`; trọng số 7 nhóm | Slide 4 lặp lại gần nguyên văn quy tắc SWOT có dữ liệu định lượng |
- Chưa thêm câu hỏi nào (D4). Các ý "mục tiêu và kỳ vọng nhà đầu tư", "rủi ro và cách ứng phó", "sứ mệnh tầm nhìn" nằm ngoài template hiện có; chỉ là hướng cho sau này.

### 13.4 CP2: quyết định user (áp dụng nguyên tắc 13.1)
| Mục | Quyết định | Tác động lên `cp2-audit-checks.ts` |
|---|---|---|
| Phỏng vấn trực tiếp | **Bắt buộc, tối thiểu 2 cuộc; chuyên gia hoặc khách hàng mục tiêu đều tính.** Định nghĩa **theo từng dự án được chấm**, không cố định: *khách hàng mục tiêu* = nhóm người đúng Persona mà chính dự án đó nêu; *chuyên gia* = người có kinh nghiệm trong lĩnh vực của chính dự án đó. Ví dụ minh họa, **chỉ cho dự án Nexus**: chuyên gia = mentor, giảng viên chuyên về khởi nghiệp; khách hàng mục tiêu = sinh viên đang học môn khởi nghiệp, cá nhân chuẩn bị khởi nghiệp. Dự án khác (ví dụ dịch vụ giặt sấy) có chuyên gia và khách hàng khác hẳn. Phỏng vấn trực tiếp 2–3 người có giá trị hơn 100 form | Gộp cổng: `fr_expert_gate` thành `fr_interview_gate` (nguồn `cp2_expert_interviews` + `cp2_customer_discovery_process`). Mọi tiêu chí phỏng vấn khác phải **không phụ thuộc loại người được hỏi** để nhóm chỉ hỏi chuyên gia hoặc chỉ hỏi khách hàng đều không bị phạt: xem 13.7. **Prompt không được ghi cứng ví dụ Nexus**: AI phải đối chiếu người được phỏng vấn với Persona và lĩnh vực mà chính tài liệu của nhóm khai. Còn mở: "6 tháng kinh nghiệm" của chuyên gia (luật thầy) |
| Khảo sát | **Không bắt buộc.** Nếu làm form thì tối thiểu 100. Phỏng vấn trực tiếp 2–3 người có giá trị hơn 100 form | `fr_survey_gate` không còn là cổng bắt buộc; thành điều kiện "nếu có khảo sát thì ≥ 100". Cần đổi cách điểm `not_applicable` khi nhóm không làm khảo sát (hiện CP2 cấm `not_applicable`) |
| Công bố AI | **Bỏ** | Xóa `fr_ai_disclosure` (hiện là gate) |
| Harvard, phụ lục | **Bỏ** | Xóa `fr_harvard`, `fr_appendix` |
| MVP | **Bỏ** | Xóa `fr_mvp_evidence` |
| Porter | **Bỏ** | Xóa `fr_five_forces` |
| Hệ quả | Nhóm `compliance` (trọng số 10) không còn tiêu chí nào | Bỏ nhóm hoặc dồn lại trọng số |
| Giữ | `fr_competitor_framework`, `fr_invisible_competitors`, VPC, insight, pivot, bottom-up, tỷ lệ chuyển đổi | |

Bản câu hỏi tương ứng (`cp2_ai_disclosure`, `cp2_harvard_referencing`, `cp2_appendix`, `cp2_mvp_demo`, `cp2_porters_five_forces`) vẫn nằm trong template; chỉ ngừng chấm.

Trọng số nhóm đề xuất (chờ duyệt): evidence 30, market 30, customer 10, product 15, competition 15 (hiện: 30/20/15/15/10/compliance 10). **Đây là phân bổ lại có chủ ý, không phải chuẩn hóa thang của cô.** Thang cô: khám phá 25, thị trường 25, VPC 10, pivot 15, cạnh tranh 15, trình bày 10; bỏ "trình bày" thì tổng 90 và chuẩn hóa đúng sẽ là 27,78 / 27,78 / 11,11 / 16,67 / 16,67. Bộ số tròn ở trên gần đó và giữ được tổng 100.

Phạm vi `questionnaire`: `qr_survey_minimum` đang là gate (≥ 7 câu, ≥ 2 loại, kế hoạch 100 phản hồi); `qr_expert_plan` yêu cầu 6 tháng kinh nghiệm; `qr_target_screening`, `qr_commitment_probe` mặc định nghĩ về khách hàng. Cần quyết cùng lúc với `fr_survey_gate` và theo cùng nguyên tắc 13.7.

### 13.5 Rủi ro khi sửa CP2 đang chạy (suy luận từ code, chưa chạy thử)
- `cp2-audit.test.ts` khẳng định gate = {`fr_ai_disclosure`, `fr_expert_gate`, `fr_survey_gate`}, 7 core, và có test cho `fr_harvard`/`fr_appendix`; `cp2-audit-quotes.test.ts` dùng `fr_survey_gate` và `fr_expert_gate`.
- Prompt `cp2_full_review_v1.md`, `cp2_questionnaire_review_v1.md` liệt kê các id này; test giữ prompt và catalog đồng bộ.
- Chấm lại: `previous_report.md/json` chỉ được đưa vào sandbox làm **văn bản** cho model (đã đọc `cp2-audit-input.ts`); không thấy chỗ nào kiểm tra lại id cũ bằng schema. Báo cáo mới được kiểm bằng schema của chính nó (`Cp2ReportSchema` đòi đúng bộ id của schema đó). Hiển thị báo cáo cũ đọc `categoryScores` đã lưu (`cp2-report-display.ts`), nhóm vắng thì bị bỏ qua. Vì vậy rủi ro thấp hơn mình nêu ban đầu: **không bắt buộc `cp2_full_v2`**, chỉ cần (a) giữ nhãn nhóm `compliance` trong `FULL_GROUP_LABELS` để báo cáo cũ vẫn hiện đủ, (b) prompt chấm lại dặn model ghép id cũ sang id mới. Chưa chạy thử một lần chấm lại thật.
- Hạ cổng khảo sát và bỏ cổng AI làm điểm CP2 của bài cũ cao hơn khi chấm lại; điều này chủ ý, nhưng cần nói rõ trên giao diện.

### 13.6 Còn mở
1. Hiểu "phỏng vấn trực tiếp tối thiểu 2 cuộc, loại nào cũng được" đã đúng chưa? Phương án khác: ≥ 2 chuyên gia **và** có phỏng vấn khách hàng. Mình đang dùng cách hiểu thứ nhất (theo "hoặc" của user).
2. Chuyên gia còn bắt buộc "từ 6 tháng kinh nghiệm" (luật của thầy) không? Đề xuất bỏ số tháng, chỉ cần chức danh hoặc đơn vị và lý do phù hợp lĩnh vực.
3. `fr_pmf_signals`, `fr_4p_grounded`: user chưa nói. Hướng dẫn Fall26 không chấm 4P; PMF chỉ là mục tiêu và next steps (thử giá, thử kênh).
4. Fall26 là tài liệu học kỳ khác với SU26 của user; chưa biết SU26 có chấm theo tài liệu này không.
5. Mục SOM mới của Fall26: tính theo năng lực thực tế (người, máy, điểm nhận), thị phần mục tiêu = SOM/SAM, luôn ghi cỡ mẫu n; chưa đưa vào `fr_som_*`.

### 13.7 Tiêu chí phỏng vấn phải trung lập theo loại người được hỏi
Vấn đề (từ advisory, đã xác nhận bằng prompt hiện tại): cổng mới nhận chỉ chuyên gia hoặc chỉ khách hàng, nhưng `fr_interview_scale_method` (core) đòi "phỏng vấn khách hàng mục tiêu thật" và `fr_expert_learning`/`qr_expert_plan` đòi chuyên gia. Nhóm chỉ hỏi mentor sẽ trượt core (trần 74); nhóm chỉ hỏi khách hàng bị phạt vì thiếu chuyên gia.

| Hiện tại | Đề xuất |
|---|---|
| `fr_expert_gate` (gate) | `fr_interview_gate` (gate): từ 2 cuộc phỏng vấn trực tiếp, loại nào cũng được; mỗi cuộc có người được hỏi (chức danh/đơn vị, hoặc đúng Persona) và lý do phù hợp |
| `fr_interview_scale_method` (core, ngưỡng ≥ 10 người) | Hạ xuống `normal`, **bỏ ngưỡng số người** (đã có ở cổng): chỉ chấm có mô tả phương pháp (chọn người, thời lượng, cách tổng hợp, giới hạn mẫu) cho từng loại đã phỏng vấn |
| `fr_interview_quality` (core) | Giữ `core`, viết điều kiện theo loại: với khách hàng, hỏi hành vi đã xảy ra, không dẫn dắt; với chuyên gia, hỏi góc nhìn thị trường, điều cần tránh, kinh nghiệm với khách hàng mục tiêu, không chào hàng. Chấm loại nào nhóm thực sự có |
| `fr_expert_learning` (normal) | Đổi thành `fr_interview_learning`: mỗi cuộc có điều học được cụ thể và nêu nhóm đã đổi gì nhờ đó |
| `qr_expert_plan` (normal) | Đổi thành `qr_interview_plan`: kế hoạch ≥ 2 cuộc phỏng vấn trực tiếp, nêu ai, tìm ở đâu, bộ câu hỏi đúng loại người được hỏi |
| `qr_target_screening` (core) | Giữ, nhưng chỉ xét phần khách hàng khi nhóm có phỏng vấn khách hàng; phần chuyên gia xét theo "đúng lĩnh vực" |
| `qr_commitment_probe` (normal), `qr_past_behavior` | Chỉ áp dụng cho phỏng vấn khách hàng |

Hệ quả kỹ thuật: bỏ ngưỡng số người và chấm theo loại cần `not_applicable` cho các tiêu chí chỉ có nghĩa với một loại (`qr_commitment_probe`, phần khách hàng của `fr_interview_quality`) và cho khảo sát. **Không cần sửa engine**: schema và `scoreCp2Report` đã chấp nhận `not_applicable` và loại nó khỏi mẫu số (có test); `cp2_audit_core_v1.md` chỉ dặn "dùng khi tệp hướng dẫn riêng cho phép với tiêu chí đó". Chỉ cần ghi rõ ở từng dòng của file review rằng tiêu chí đó được phép `not_applicable`. (Nhận định trước "CP2 cấm `not_applicable`" là sai.)

Phép thử kiểm duyệt (dùng làm test hồi quy sau này): (a) chỉ 2 mentor, không khách hàng, không khảo sát → không bị chặn trần vì thiếu loại kia; (b) chỉ 3 sinh viên đúng Persona, không chuyên gia → không bị chặn; (c) chỉ 1 cuộc → cổng trượt, trần 49.

### 13.8 Kế hoạch verify (thay cho ghi chú "phải chuyển tay" ở mục 11)
- Nhánh `files`: chạy bài **gốc** không chuyển định dạng: CP3 `101_13_Nexus_CP3.md`, `101_155_RootAccess_CP3.pdf`; CP2 `13_Nexus_CP2.pdf`. Đây cũng kiểm chứng agent trong sandbox thật sự đọc được md/pdf (chưa kiểm). Quan sát: trích dẫn có được kiểm (`unchecked` hay `verified`), không chấm MVP, không đòi mã S1/W1 hay số trang.
- Nhánh `answers` và `both`: tạo fixture câu trả lời riêng, chỉ để test hai nhánh này; không dùng fixture đã chuẩn hóa làm bằng chứng cho luồng tải tệp.
- Test đơn vị: ba phép thử ở 13.7 trên ít nhất hai dự án khác nhau; thang điểm và trần 49/74 của CP3 theo `cp2-audit.test.ts`.

## 14. Kết quả verify sau khi code (2026-10-24, chưa chạy job thật)

**Đã chạy và xanh:** `tsc` validation, API, web; test validation 100/100; 12 file test API liên quan (CP2, CP3, ledger, quote, routing, progress, manifest); CLI validator `validate-cp2-report.mjs` với báo cáo CP3 hợp lệ (OK), có `not_applicable` (bị từ chối), sai schema (bị từ chối); `eslint` cho các tệp web đã sửa (còn 2 lỗi `set-state-in-effect` có sẵn ở `TabReportFindings.tsx:39` và `StageStartGuide.tsx:57`, không do thay đổi này).

**Chưa chạy (ghi trung thực):**
- Smoke bằng job thật (ca 1-10 của phase 7): cần DB local, Redis, worker và model. Ca 8-9 (CP2 hồi quy, phỏng vấn trung lập) và hiệu chỉnh `SWOT_QUANT_PASS_RATIO`/`SWOT_QUANT_PARTIAL_RATIO` trên hai bài mẫu CP3 chưa làm.
- Chất lượng prompt CP3 trên bài thật; agent có đọc được PDF dạng ảnh trong sandbox hay không; chi phí token CP3 so với CP2.
- Toàn bộ bộ test API (`bun run test`) treo quá 290 giây ở máy này, chưa tìm test gây treo; chỉ chạy các file liên quan.
- Image worker trên VPS có đọc `specVersion` hay chưa; duyệt giao diện bằng trình duyệt.
- Plan `plans/261020-2030-audit-service-registry/plan.md` vẫn ghi `pending`: chưa đổi vì chưa xác nhận mọi bước đã giao.

## 15. Quyết định (user chốt 2026-10-25): bỏ hẳn phần MVP/UX khỏi CP3

MVP là sản phẩm phi tài liệu (màn hình, Figma, localhost); wireframe, mockup không chuyển thành văn bản và không có tiêu chí chấm. Chọn phương án C: bỏ cả phase `mvp_ux_ui` (7 câu) khỏi template, câu hỏi, DOCX, sync-rules và test; template còn 20 câu, đều được chấm. Các mục 7, 13.3 và 14 viết trước quyết định này (nhắc "7 câu MVP không chấm", "27 câu") là lịch sử, không còn đúng.

- Vòng đổi tên "Mô hình kinh doanh" (slug `san-pham-mo-hinh` giữ để không vỡ đường dẫn).
- Luật cứng trong prompt "không chấm MVP và giao diện" vẫn giữ: tệp tải lên có thể chứa MVP.
- **Rủi ro phải nói rõ với người bán/dùng:** PDF chính thức của CP3 tính MVP 120/150 điểm, nên "SẴN SÀNG" của dịch vụ chỉ nói về BMC và SWOT, không phải điểm toàn CP3. Ghi chú này đã nằm ở modal xác nhận và gói bán.
- `cp4_pmf_mvp_demo` (CP4, chưa mở) chỉ còn tự điền từ `cp2_mvp_demo`. Câu hỏi MVP ở CP4 chưa xem xét, ngoài phạm vi.
- Migration `20261024230000_cp3_service_type` đã sửa tên tại chỗ vì chưa deploy ở đâu; nếu ai đã áp dụng cục bộ thì tên `service_types.cp3_audit` còn cũ (`ON CONFLICT DO NOTHING` không cập nhật).
