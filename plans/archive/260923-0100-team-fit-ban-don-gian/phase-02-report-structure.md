# Phase 02: báo cáo 3 phần

> Trạng thái: xong (agent Phase02Report làm chính, bị kill vì quá 30 phút recon; Main tiếp quản: nối AreaList vào tab, dọn panel, sửa narrowing union, throwaway 3/3 pass rồi xoá, save test 9/9 pass; tsc 0 lỗi 3 workspace).

## Vì sao

Prompt hiện tại cấm mọi thứ hữu ích (không kết luận, không mức độ, không lý do, không điểm tốt). Viết lại: luật cố định + AI tự suy yêu cầu ngành từ ô lĩnh vực khách ghi lúc chạy, không tra bảng nào.

## File sửa

- `apps/api/src/modules/ai-engine/application/evaluate-team-fit.usecase.ts` — prompt mới + schema AI 4 trường + hàm máy đếm
- `packages/validation/src/index.ts` — tách schema phần AI
- 8 file đang đọc kết quả cũ: `TeamFitResultStep.tsx`, `caseOverviewModel.ts`, `CaseOverviewTab.tsx`, `OverviewGapsSection.tsx`, `CaseOverviewPanel.tsx`, `admin-workers.service.ts`, `omp-audit-coordinator.ts`, `team-fit-save.test.ts`

## Các bước

1. Prompt mới: luật cố định (chỉ chấm đội ngũ, không chấm ý tưởng; mọi nhận định có dẫn chứng từ câu khách viết; không bịa; không đưa cách sửa) + đọc ô lĩnh vực, tự nêu ngành đó cần gì, đối chiếu với thành viên.
2. AI chỉ sinh 4 trường (`verdict`, `areas`, `industryRoles`, `committeeQuestions`). Server ghép thêm phần máy đếm + cầu dẫn cố định + cờ phiên bản. Không để AI sinh số liệu máy đếm — nó sẽ bịa số.
3. Cờ `hasFreeAnalysis` trong `caseOverviewModel.ts` tính từ dạng mới (có `verdict`), không phải 2 mảng cũ.
4. `CaseOverviewPanel.tsx`: bỏ interface viết tay trùng schema, dùng kiểu chung từ validation.
5. Dọn lỗi có sẵn trong file usecase: chuỗi `SYSTEM_PROMPT` không ai dùng; điều kiện `AI_APICallError` trùng; thiếu ngoặc ở chỗ kiểm tra "not supported" (mọi lỗi có chữ đó đều bị báo sai); gọi AI không có thời gian chờ; số viết cứng trong code.
6. Giữ nguyên cách gọi: 1 lần gọi AI rồi trả ngay, không qua hàng đợi worker bản trả tiền.
7. Không nối vào `TeamFitReportSchema` (không chỗ nào dùng, lại chứa `recommendations` là thứ bản free phải thiếu). Không xoá nó ở đây vì không phải mã của kế hoạch này.

## Test

- Unit test hàm máy đếm (node:test, apps/api): đếm đúng số ngành đào tạo khác nhau, phủ/thiếu mảng nghề, số người có kinh nghiệm, ô trống.
- Test parse schema output AI 4 trường; cập nhật `team-fit-save.test.ts` theo dạng mới.
- Chạy thật 1 lần, kiểm tra bằng mắt: đủ 3 phần, nhãn "Đã kiểm tra" / "AI nhận định" tách rõ, nhận định có dẫn chứng.
- Mở 1 case thật rà 8 chỗ đọc — đổi dạng mà quên chỗ nào là 2 danh sách hiện trống trơn mà không báo lỗi.

## Xong khi

- [ ] Báo cáo đủ 3 phần, nhãn tách rõ
- [ ] Có kết luận sơ bộ + mảng ổn/yếu, mỗi nhận định có dẫn chứng
- [ ] AI tự nêu ngành cần gì từ ô lĩnh vực, không tra bảng
- [ ] Cầu dẫn đủ 4 câu kể cả khi AI lỗi
- [ ] 8 chỗ đọc kiểm tra bằng mắt xong
