# Phase 7 — Verify và tài liệu

Quy ước: viết xong code rồi mới chạy test (như plan registry); không chạy lệnh DB lên production; báo cáo kết quả đo thật, mục nào chưa chứng minh được thì ghi "chưa".

## A. Tự động

1. `bun run check-types`, `bun run lint`.
2. Test validation (catalog CP2 mới, CP3, đồng bộ prompt) và **chỉ các file test API của phần đã đổi** (từng file, `timeout 40 npx tsx --test <file>`). Không chạy cả bộ `bun run --filter nexus-platform-api test`: bộ đó đang treo (known issue ngoài phạm vi plan này, xem `AGENTS.md` mục Test scope).
3. Test hồi quy rò: `findApprovedReports` không trả `cp3_*`; sandbox CP1 giữ nguyên danh sách tệp (so với mốc chụp ở plan registry bước 1).

## B. Smoke bằng job thật (DB local + worker local + `omp`)

| # | Ca | Dữ liệu | Quan sát |
|---|---|---|---|
| 1 | CP3 `files` | **Tệp gốc** `E:\FPT\Semester_7\EXE101\CP3\101_13_Nexus_CP3.md` và `101_155_RootAccess_CP3.pdf` (không chuyển sang template) | Agent đọc được md/pdf trong sandbox; `report.json` qua validator; `evidenceUnverified`/`evidenceUnchecked`; **không có tiêu chí hay nhận xét MVP**; không đòi mã S1/W1/số trang/AI disclosure |
| 2 | CP3 `answers` | Fixture câu trả lời tự tạo cho 20 câu được chấm (một dự án **không phải Nexus**) | `cp3_answers.md` không chứa câu MVP; điểm và nhãn khớp `scoreCp2Report` |
| 3 | CP3 `both` | Fixture + một tệp | Cổng cả hai: thiếu một phía thì 400 trước khi trừ credit |
| 4 | CP3 `resubmit` | Từ báo cáo ca 1 hoặc 2 + `change_summary` | `previous_report.*` có mặt; `reaudit` điền; số đổi không giải thích bị gắn MAJOR; không có báo cáo trước thì chấm `initial` |
| 5 | Bối cảnh CP1/CP2 | Case có CP1/CP2 đã nộp | `input/context/` có cả hai, **không lặp** câu trả lời CP1; manifest `role=context`; khác biệt chỉ xuất hiện ở `crossIssues` MINOR không tính điểm; không trích context làm bằng chứng |
| 6 | Đường lỗi | `report.json` sai schema (ép) | Job fail, hoàn credit, stage rollback |
| 7 | Tắt bán | `is_active=false` ở gói local | Không mua được, báo lỗi rõ |
| 8 | CP2 hồi quy | `E:\FPT\Semester_7\EXE101\CP2\13_Nexus_CP2.pdf` (nhánh `files`) và fixture `answers`; `resubmit` từ một báo cáo CP2 cũ có id cũ | `report.json` hợp lệ, không id đã xóa, `reaudit` ghép id mới, báo cáo cũ hiển thị đủ nhóm `compliance` |
| 9 | CP2 phỏng vấn trung lập | Hai bộ fixture: chỉ 2 chuyên gia; chỉ 3 khách hàng đúng Persona; 1 cuộc phỏng vấn | Hai bộ đầu không bị trần vì thiếu loại kia; 1 cuộc: cổng trượt, trần 49. Chạy trên **hai dự án khác ngành** (không chỉ Nexus) |
| 10 | CP1 | Một job CP1 | Không đổi hành vi |

Tám tình huống §14.1 của prompt member rút gọn thành các câu trả lời mẫu cho ca 2 để kiểm tra mô hình không nuốt lập luận yếu (vd "nói sẽ trả tiền ≠ đã trả tiền").

Ca 8 và 9 (CP2) thuộc **lần phát hành A**, chạy trước khi merge lần A. Ca 1–7 và 10 thuộc lần B. Ở ca 1 và 2, ghi lại tỷ lệ mục SWOT có số liệu của hai bài mẫu để hiệu chỉnh `SWOT_QUANT_PASS_RATIO` và `SWOT_QUANT_PARTIAL_RATIO`; nếu ngưỡng cho kết quả vô lý (ví dụ cả hai bài cùng trượt cổng), báo user thay vì tự đổi ngưỡng.

Chưa thể chứng minh bằng smoke: mô hình có luôn dùng validator và manifest không (cần log tên công cụ); chất lượng prompt trên bài thật khác hai mẫu; trần/độ nhạy cổng khi người thật chấm; chi phí token CP3 so CP2 (đo từ `ai_jobs` local, không đo production). Ghi rõ trong báo cáo.

## C. Tài liệu (bắt buộc khi tính năng cố định)

- README: env `CP3_MIN_ANSWERED`, `CP3_MIN_AVG_WORDS` cạnh `CP2_*`; cách mở dịch vụ mới (một dòng bảng + prompt + assembler + post-processor).
- Changelog/roadmap theo `.agents/rules/documentation-management.md`.
- Cập nhật `docs/research/brainstorm-2026-10-24-cp3-cp4-audit-service.md`: mục "Chưa kiểm tra" → kết quả thật; ghi các giả định A1–A10 nào đã được user xác nhận hay đổi.
- Cập nhật `plans/261020-2030-audit-service-registry/plan.md` nếu người làm xác nhận mọi bước đã giao (hiện `status: pending` nhưng code đã có).
- Dọn: xóa fixture/script tạm, không để tệp nhóm thật trong repo (chứa dữ liệu cá nhân).

## D. Điều kiện đóng plan

Mọi acceptance của phase 1–6 đạt; ca smoke 1–10 chạy và ghi kết quả; danh sách "chưa chứng minh" được ghi trung thực; checklist vận hành phase 5 giao cho người vận hành; không còn `TODO`/`FIXME`.
