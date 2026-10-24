---
title: "Mở dịch vụ chấm CP3 (BMC + SWOT) và cập nhật rubric CP2 theo chuẩn cô Hanhlh5"
description: "Thêm dịch vụ cp3_audit (single scope full, answers|files|both, initial + resubmit, thang 100, không chấm MVP) bằng cách nhân bản khung CP2 đã có; đồng thời sửa rubric CP2: bỏ AI/Harvard/phụ lục/MVP/Porter, gộp cổng phỏng vấn trung lập theo loại người được hỏi, khảo sát thành tùy chọn."
status: in-progress
priority: P1
effort: ~50h (ước lượng, chưa đo)
tags: [ai-engine, validation, prompts, web-1, prisma, cp2, cp3]
blockedBy: []
blocks: []
created: 2026-10-24
branch: feat/cp3-audit (tách từ feat/attachment-manifest; deploy sau khi PR #54 vào dev)
---

# CP3 audit + cập nhật rubric CP2

Nguồn quyết định và bằng chứng: `docs/research/brainstorm-2026-10-24-cp3-cp4-audit-service.md` (đọc mục 7, 8, 13). Kiến trúc registry: `plans/reports/brainstorm-261020-1927-audit-service-registry.md` (D1–D20). Plan này nói **làm gì, thứ tự, kiểm gì**; chi tiết cuối cùng do người làm tự quyết theo code (đọc code trước khi sửa).

## Quyết định đã chốt (user)

| # | Quyết định |
|---|---|
| D1 | Nguồn rubric = tài liệu cô Hanhlh5 (cả bản cũ lẫn `tmp/co-hanhlh5-moi-nhat/`). Tài liệu thầy Thanhntl2 chỉ tham khảo, không dùng điểm số, không ép format |
| D2 | Thang 100 như CP1/CP2 |
| D3 | CP3 **không chấm MVP** (7 câu `cp3_mvp_*`, persona, user flow, wireframe, mockup, UX logic): ghi thành luật cứng trong prompt, giao diện báo rõ |
| D4 | Phạm vi chấm = câu hỏi template hiện có (20/27 câu CP3); không thêm câu hỏi |
| D5 | AI Disclosure, BMC một trang: bỏ (cô đã đồng ý, user xác nhận) |
| D6 | CP3: một scope `full`, đầu vào `answers\|files\|both`, `initial` + `resubmit`, không `logic_check` |
| D7 | CP3 đọc CP1/CP2 làm **bối cảnh** qua `_library`/`context/`, không bao giờ là bằng chứng; khác biệt so với giai đoạn trước = `crossIssues` MINOR không tính điểm |
| D8 | Tiêu chí chấm **nội dung và khả năng truy vết, không chấm hình thức** (không bắt mã S1/W1, số lý do, số mốc, số trang) |
| D9 | Giá CP3 79.000đ, bán ngay (`is_active: true`) |
| D10 | CP2: bỏ `fr_ai_disclosure`, `fr_harvard`, `fr_appendix`, `fr_mvp_evidence`, `fr_five_forces` (nhóm `compliance` hết); phỏng vấn trực tiếp ≥ 2 cuộc, chuyên gia **hoặc** khách hàng mục tiêu đều tính, định nghĩa **theo từng dự án**, không ghi cứng ví dụ Nexus; khảo sát tùy chọn (nếu làm thì ≥ 100); mọi tiêu chí phỏng vấn trung lập theo loại người được hỏi |

## Giả định mặc định (user chưa phản hồi — đổi ở phase ghi trong ngoặc)

| # | Giả định | Phase |
|---|---|---|
| A1 | Cổng phỏng vấn đạt khi ≥ 2 cuộc, loại nào cũng được (không đòi cả hai loại) | 1 |
| A2 | Bỏ luật "chuyên gia từ 6 tháng kinh nghiệm"; chỉ cần chức danh/đơn vị + lý do phù hợp lĩnh vực | 1 |
| A3 | Giữ `fr_pmf_signals`, `fr_4p_grounded` nguyên (user chưa yêu cầu bỏ) | 1 |
| A4 | Có khảo sát nhưng < 100 phản hồi → `partial` và phải giới hạn kết luận, không chặn | 1 |
| A5 | Gói CP3: 79.000đ, 2 lượt như CP1/CP2 | 5 |
| A6 | Bảng 24 tiêu chí CP3, ba cổng chặn, trọng số 7 nhóm (xem `phase-02`) | 2, 3 |
| A7 | Trọng số CP2 mới 30/30/10/15/15 (evidence/market/customer/product/competition), là phân bổ lại có chủ ý, không phải chuẩn hóa thang cô (27,78/27,78/11,11/16,67/16,67) | 1 |
| A8 | `qr_interview_plan` (questionnaire scope) là `core`, không phải gate (**user đã chốt**: phỏng vấn trực tiếp là core vì là syllabus của môn và được nhấn mạnh ở tài liệu market research; áp cho cả `fr_interview_method`, `fr_interview_quality`, `fr_interview_learning`) | 1 |
| A9 | Tên vòng trên giao diện: "Mô hình kinh doanh" (đổi từ "Sản phẩm & mô hình" sau quyết định bỏ MVP, mục 15 của brainstorm); slug giữ `san-pham-mo-hinh`; UI không bao giờ hiện "CP3" | 6 |
| A11 | **Template CP3 không còn phase MVP/UX** (7 câu bị bỏ, còn 20 câu, tất cả đều chấm; user chốt 2026-10-25). Các phase file nhắc "không chấm 7 câu MVP", `CP3_UNGRADED_*` hay tên "Sản phẩm & mô hình" là lịch sử; code hiện hành là chuẩn | 2, 3, 4, 6 |
| A10 | Báo cáo CP3 dùng persistence như CP2: `lifecycleUnit: false`, mỗi lần chấm một báo cáo | 4 |

## Phases

| # | Phase | Ước lượng | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 1 | [Cập nhật rubric CP2](./phase-01-cp2-rubric-update.md) | 6h | — | Code xong; test đơn vị xanh; chưa smoke job thật (ca 8-9) |
| 2 | [Tầng validation CP3](./phase-02-cp3-validation.md) | 6h | 1 (cùng sửa bảng `CP2_SCHEMAS`) | Xong; validation 100/100 |
| 3 | [Prompt CP3](./phase-03-cp3-prompts.md) | 8h | 2 | Code xong; **chất lượng prompt chưa kiểm** bằng job thật |
| 4 | [API: dịch vụ CP3](./phase-04-cp3-api.md) | 10h | 2, 3 | Code xong; tsc sạch; test file liên quan xanh |
| 5 | [DB + gói bán](./phase-05-db-package.md) | 2h | 4 | Migration + seed viết xong; **chưa chạy lên DB nào** |
| 6 | [Web](./phase-06-web.md) | 12h | 4, 5 | Code xong; tsc sạch; **chưa duyệt bằng trình duyệt** |
| 7 | [Verify + tài liệu](./phase-07-verify-docs.md) | 6h | tất cả | **Chưa đóng**: smoke ca 1-10, hiệu chỉnh ngưỡng SWOT, 2 lỗi lint web có sẵn. Test chỉ chạy phần đã đổi (xem dưới) |


**Ngoài phạm vi (known issue, không chặn plan này):** bộ test API đầy đủ đang treo (>290s), chưa tìm ra test gây treo. Theo `AGENTS.md` (mục Test scope), chỉ chạy test của phần đã đổi, nên không chạy cả bộ và không tính là việc phải làm để đóng plan.
Phase 1 làm trước vì sửa chung `cp2-audit-checks.ts` với phase 2 và vì cách viết tiêu chí "trung lập theo loại người được hỏi" CP3 dùng lại. Phase 5 chạy song song được với phase 6 sau khi phase 4 xong chỉ ở phần viết mã; **deploy** thì phase 5 (DB) phải lên trước phase 6 (xem mục Triển khai).

## Phạm vi

**Làm:** CP2 rubric (catalog, prompt, test, nhãn, tự kiểm), CP3 từ catalog đến web, migration `service_types`, seed gói, verify bằng tệp gốc.
**Không làm:** CP4 (giá, gói trọn CP1→CP4, nối kiểm tra Excel vào dịch vụ chấm; bộ kiểm tra P&L đã có sẵn ở `packages/validation/src/finance/pl-validator.ts` từ commit `433a8f5`/`629092a`, plan này không đụng); thêm câu hỏi vào template CP3/CP2; tổng quát hóa ruột CP2 thành framework (chỉ mở rộng chỗ hằng/kiểu CP2 chặn đường dùng chung); cô lập agent giữa các case; tối ưu token prompt; cutover worker (`plans/261012-worker-jobspec/phase-03-cutover.md`).

## Phụ thuộc giữa các plan

- `plans/261020-2030-audit-service-registry`: mã registry, `_library`, manifest đã có trên nhánh `feat/attachment-manifest` (PR #54 vào `dev`); `plan.md` của nó vẫn ghi `pending` nhưng code đã giao. Plan này dựa trên code đó nên **không đánh `blockedBy`**; thứ tự deploy: merge PR #54 trước. Không sửa plan kia.
- `plans/261012-worker-jobspec`: phase 1–2 đã xong. Job CP3 chạy qua JobSpec nên **không cần rebuild worker image**; chỉ sửa mã worker để `tsc` còn exhaustive (xem phase 4). Không phụ thuộc phase 3 (cutover) của plan đó.

## Rủi ro chính

1. **CP2 đang chạy thật.** Đổi bộ id làm lệch báo cáo cũ khi chấm lại. Giảm: giữ nhãn nhóm `compliance` trong `FULL_GROUP_LABELS`; prompt chấm lại dặn ghép id cũ sang id mới; `previous_report.json` chỉ là văn bản đưa cho model (đã đọc `cp2-audit-input.ts`), không bị kiểm schema. Chưa chạy thử một lần chấm lại thật → verify ở phase 7.
2. **Rò báo cáo CP3 vào mốc chấm lại CP1.** `findApprovedReports` chỉ loại `CP2_REPORT_TYPES`. Phải loại cả loại CP3 (phase 4) và có test.
3. **Câu trả lời CP1 lặp trong context CP3** (`renderStageAnswers` gộp stage trước). Xử lý bằng cờ `ownAnswersOnly` (phase 4).
4. **Bằng chứng cho so sánh giai đoạn trước:** `cp2-quote-verify.ts` coi nguồn trong `context/`, `_library/` là `unverified`. Giữ nguyên; CP3 chỉ trích phía CP3.
5. **Prompt chưa hiệu chỉnh** trên bài thật (chỉ 2 bài CP3, 1 bài CP2 mẫu). Báo cáo trung thực ở phase 7; không hứa độ chính xác.
6. **Agent đọc được định dạng nào trong sandbox** chưa kiểm (PDF dạng ảnh có thể không đọc được) → smoke bằng tệp gốc ở phase 7.
7. **Không có model nào chạy trong test đơn vị**: chất lượng prompt chỉ kiểm được bằng job thật.

## Quy tắc dự án phải tuân

- DB: chỉ `prisma migrate dev --create-only` cho migration; không `db push`, `migrate reset`, `db seed` lên DB production; người vận hành chạy `migrate deploy` và seed gói (`.agents/rules/prisma-migration-safety.md`). DB local chỉ để smoke.
- Mọi ngưỡng đưa vào hằng có tên, cấu hình bằng env, mặc định có tài liệu (README); không `TODO`/`FIXME`, không code bị comment.
- Lỗi: phân biệt retryable/không; mọi `AppError` có mã; log có `caseId`/`jobId`; không log dữ liệu nhóm.
- Web: đọc `apps/web-1/AGENTS.md` trước; Mantine v9; không gọi `apiClient` trực tiếp trong component; file ≤ 200 dòng; chữ tiếng Việt, không hiện "CP1…CP4" cho người dùng (tên vòng).
- Rollback: tắt bán bằng `is_active=false` ở gói/`service_types` (không xóa dòng); CP2 trả về bằng revert commit catalog+prompt (báo cáo đã lưu không đổi).

## Kiểm sau khi code xong

Xem `phase-07-verify-docs.md`. Tối thiểu: `check-types`, `lint`, test API và validation xanh; smoke CP3 nhánh `files` (tệp gốc), `answers`, `both`, resubmit, đường lỗi hoàn credit; smoke CP2 hồi quy; sandbox CP1 không đổi.

## Triển khai (thứ tự và điều kiện)

1. **Tách hai lần phát hành (user đã chốt).** Lần A = phase 1 (rubric CP2, đang chạy thật và thu tiền). Lần B = CP3 (phase 2–7). Hai nhánh/PR riêng, rollback độc lập. Smoke CP2 (phase 7 ca 8, 9) thuộc lần A và chạy trước khi merge lần A.
2. **Lần A: đổi bộ id giữa lúc có job đang chạy.** `cp2ValidatorSource()` và prompt được dựng vào sandbox lúc trigger (`audit-services.ts` `sandbox()`; prompt đọc từ `data/system-prompts` ở máy API, `audit-instructions.ts:20`, `omp-audit.service.ts:128`). Job xếp hàng hoặc đang chạy trước lúc deploy sẽ sinh `report.json` với id cũ, còn finalizer của API (đã deploy) kiểm bằng catalog mới → 422 → hoàn credit. Cách giảm: deploy khi hàng đợi `omp-queue` trống, hoặc chấp nhận hoàn credit cho job ngay lúc đó. Prompt và API phải lên **cùng lúc**: `assertAuditPromptsPresent` chỉ kiểm file tồn tại, không kiểm id khớp catalog (test đồng bộ chỉ bảo vệ repo).
3. **Lần B: điều kiện trước khi bật.** (a) image worker trên VPS là bản đọc `specVersion` (sau phase 2 của `plans/261012-worker-jobspec`; chưa kiểm được: kiểm tag/commit image đang chạy). **Không build/push image worker** (nặng hơn 1 GB sau giải nén): lần B chỉ đổi mã nguồn worker một dòng để `check-types` xanh, không deploy worker; (b) migration `service_types` đã `migrate deploy` (người vận hành); (c) seed `pkg_cp3_audit` đã chạy tay; (d) ba prompt CP3 có trên máy API.
4. **Thứ tự lần B:** migration (additive) → API → web → seed gói → commit cuối bật `stages.ts` (`available: true`). Rollback bán: `is_active=false` ở gói; rollback hiển thị: revert commit `stages.ts`.

## Cập nhật sau review (user chốt)

- Tách hai lần phát hành: A (CP2) rồi B (CP3).
- **Phỏng vấn trực tiếp là core** ở cả hai phạm vi CP2: `fr_interview_method`, `fr_interview_quality`, `fr_interview_learning`, `qr_interview_plan` (xem `phase-01`). `fr_interview_gate` vẫn là cổng.
- A6, A7 được chấp nhận theo đề xuất (bảng 24 tiêu chí CP3, ba cổng, trọng số 7 nhóm; trọng số CP2 30/30/10/15/15). Ngưỡng cho `c3_swot_quantified` định nghĩa ở `phase-03` mục 5.
- CP2 cập nhật theo tài liệu Fall26 của cô Hanhlh5 và các quyết định đã chốt trước đó (`phase-01`).
- Thêm CP3 bằng cách **sao chép** các hàm CP2 (post-processor, nguồn đầu vào, tải tệp, AGENTS.md); không refactor ruột CP2 trong plan này. Chỉ sửa chung ba chỗ bắt buộc: loại báo cáo CP3 khỏi mốc chấm lại CP1, tham số tùy chọn cho `verifyCp2Quotes`, cờ `ownAnswersOnly` của `loadStageContext`.
- Worker: không build/push image (nặng hơn 1 GB); chỉ một dòng mã nguồn để `check-types` xanh.
