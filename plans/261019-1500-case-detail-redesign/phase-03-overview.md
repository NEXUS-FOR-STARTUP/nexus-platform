# Phase 3: Tổng quan

Priority: P2 · Status: Pending · Effort: 5h · blockedBy: Phase 1, 2

CW = `apps/web-1/app/dashboard/case/[id]/_components`

## Context Links
- Mockup: `js/views/overview.js` (57 dòng), `REPORT.md` §7 "Tổng quan"
- `research/scout-02` §2 "Overview", §4; `reports/gap-register.md` C-12, C-27, C-28
- Code: `CW/workspace/OverviewTab.tsx` (103), `OverviewHero` (33), `OverviewProgressStrip` (96), `OverviewRecentReports` (85), `ContactNextStepCard` (29), `ZaloSupportCard` (36), `CW/CaseOverviewPanel.tsx` (229), `CW/overview/OverviewIdeaGuideAlert.tsx` (28), `CW/workspace/NextActions.tsx` (46, mồ côi), `hooks/useNextActions.ts`

## Key insights
- Thứ tự hiện tại (ràng buộc từ landing plan P3, đã merge): `ContactNextStepCard` → `OverviewHero` (chỉ khi liên hệ đủ) → `OverviewIdeaGuideAlert` (ẩn khi hành động kế là điền nháp CP1) → `OverviewProgressStrip` → `OverviewRecentReports` (3, theo `submitted_at`) → `CaseOverviewPanel` → `ZaloSupportCard`. **Không đảo thứ tự** `ContactNextStepCard`/`OverviewHero`/`OverviewIdeaGuideAlert`.
- Mockup cố ý rút gọn vì ca mẫu thiếu liên hệ (REPORT §9 tự nhận chưa dựng `NextActions`, `OverviewHero`, `OverviewIdeaGuideAlert`, `OverviewProgressStrip`). Ta phải dựng đủ các trạng thái này theo phong cách mới, không biến mất.
- "Còn thiếu N thông tin" của mockup là số gõ cứng; thực tế tính từ `validateCaseContact` + trường hồ sơ rỗng.
- `NextActions.tsx` không ai import và sẽ in `stageCode` ("CP1"): xóa.
- `STATUS_LABEL` trùng giữa `StageCard` và `OverviewProgressStrip`: gộp ở P4 vào `stage-status.ts`; P3 dùng bản gộp.
- Mockup bỏ thẻ Zalo khỏi Tổng quan (sidebar đã có) và bỏ dòng "Chưa cập nhật".

## Requirements
- Tiêu đề trang "Tổng quan dự án" 24/500; phụ đề tên nhóm; mã dự án là nút sao chép (`CopyIconButton`, nhãn "Sao chép mã dự án").
- Khối việc tiếp theo: một câu + một nút; nguồn dữ liệu `buildNextActions`/`isCaseContactComplete`; giữ `OverviewHero` khi liên hệ đủ.
- "Hành trình": danh sách dòng (tên giai đoạn, "Đã trả lời a/b câu · n tài liệu", `StatusChip`, nút phụ "Xem kết quả"/"Tiếp tục"); các giai đoạn khóa gộp thành 1 dòng "Sẽ mở sau".
- "Báo cáo gần đây": 3 dòng, `FileTypeIcon` PDF, nhãn từ `report.utils`, ngày, nút "Xem" → `?tab=journey&stage=<slug>&view=results`.
- "Hồ sơ dự án": mục gập (Mantine `Accordion` hoặc `Collapse`), dòng đầu "Còn thiếu N thông tin · Bổ sung" (link tới `?tab=settings`). Chỉ hiện trường có dữ liệu; chứa cả `OverviewMembersSection`, `OverviewGapsSection`, nhu cầu hỗ trợ.
- Không dùng nhãn HOA nhỏ (`OverviewHero` đang dùng `tt="uppercase"` → bỏ).

## Architecture
```
OverviewTab.tsx (orchestrator ≤100)
 ├─ OverviewHeader.tsx        tiêu đề + CopyIconButton (mới, 30 dòng)
 ├─ ContactNextStepCard / OverviewHero / OverviewIdeaGuideAlert (giữ, restyle)
 ├─ OverviewJourneyList.tsx   thay OverviewProgressStrip (dùng StageRow chung với P4)
 ├─ OverviewRecentReports.tsx restyle
 └─ OverviewProfileFold.tsx   bọc CaseOverviewPanel đã tách (≤200)
```
`StageRow` (dòng giai đoạn) dùng ở P3 (rút gọn) và P4 (đầy đủ) → tạo ở P4 nếu P4 đi trước; nếu P3 đi trước, tạo ở `workspace/StageRow.tsx` và P4 dùng lại. Chốt: **tạo ở P3**, P4 import.

## Related code files
**Modify:** `OverviewTab.tsx`, `OverviewHero.tsx`, `OverviewRecentReports.tsx`, `ContactNextStepCard.tsx`, `CaseOverviewPanel.tsx` (tách), `OverviewIdeaGuideAlert.tsx` (chỉ style nếu cần; 28 dòng).
**Create:** `workspace/OverviewHeader.tsx`, `workspace/StageRow.tsx`, `workspace/OverviewJourneyList.tsx`, `workspace/OverviewProfileFold.tsx`, `workspace/stage-status.ts` (tone + nhãn dùng chung, nếu P4 chưa làm).
**Delete:** `workspace/NextActions.tsx` (mồ côi), `workspace/OverviewProgressStrip.tsx` (thay bằng `OverviewJourneyList`), `workspace/ZaloSupportCard.tsx` **chỉ nếu** grep chứng minh không còn nơi dùng ngoài `OverviewTab`.

## Implementation steps
1. `codegraph_explore` `OverviewTab OverviewProgressStrip CaseOverviewPanel` để lấy nguồn hiện tại; liệt kê mọi trường `CaseOverviewPanel` đang hiện.
2. Chạy `xd://lsp` references cho `NextActions`, `ZaloSupportCard`, `OverviewProgressStrip` trước khi xóa.
3. `stage-status.ts`: `STAGE_STATUS = { drafting:{tone:"draft",label:"Đang soạn"}, results:{tone:"ok",label:"Đã có kết quả"}, needs_info:{tone:"warn",label:"Cần bổ sung"}, coming_soon:{tone:"neutral",label:"Sắp ra mắt"}, error:{tone:"error",label:"Lỗi"} }`. Khóa lấy đúng từ `STATUS_META` hiện có trong `StageCard.tsx:24-36` (bỏ cyan); xác nhận từng khóa trước khi gõ.
4. `StageRow.tsx`: props `{ name, note, status, onOpen?, locked? }`; `Paper withBorder radius="md"`; nút phụ `Button variant="default" size="sm"`; khóa: icon `Lock` + `StatusChip neutral`, không nút.
5. `OverviewJourneyList.tsx`: map `useStageSummaries` → `StageRow`; gộp mọi giai đoạn `available=false` thành 1 dòng ghi tên các vòng ("Sản phẩm, mô hình" và "Gọi vốn, tài chính" lấy từ `STAGE_DISPLAY_META`, không gõ cứng "CP"). **Không** gõ cứng số giai đoạn (CP3/CP4 sẽ mở).
6. `OverviewHeader`: tên nhóm + `CopyIconButton value={case_code}`. Chữ lỗi sao chép do `CopyButton` xử lý.
7. `OverviewRecentReports`: giữ `RECENT_REPORTS_LIMIT` và `slugForReport`; dòng = `FileTypeIcon` + nhãn + ngày (`formatDateShort`) + nút "Xem".
8. `CaseOverviewPanel` (229 dòng): tách `OverviewMembersSection`/`OverviewGapsSection`... thành file riêng nếu chưa; `OverviewProfileFold` bọc bằng `Accordion` (mặc định đóng); tiêu đề gập "Hồ sơ dự án" + "Còn thiếu N thông tin"; N = số trường bắt buộc rỗng tính từ cùng hàm dùng ở Cài đặt (`validateCaseContact`/danh sách trường), không gõ cứng.
9. `OverviewTab`: ghép theo đúng thứ tự mục "Key insights"; bỏ `ZaloSupportCard`.
10. Test nhỏ: hàm đếm "còn thiếu" tách thành pure function `countMissingProfileFields(case)` có file assert (3 ca: đủ, thiếu liên hệ, thiếu hồ sơ).
11. Smoke: ca thiếu liên hệ; ca đủ liên hệ + 0 báo cáo; ca có 3+ báo cáo; hai giai đoạn khóa. Chụp 1440/390, sáng/tối.

## Todo
- [ ] LSP references trước khi xóa 3 file
- [ ] `stage-status.ts`, `StageRow`
- [ ] Header + CopyIconButton
- [ ] JourneyList, RecentReports, ProfileFold
- [ ] Tách `CaseOverviewPanel` ≤200
- [ ] Test `countMissingProfileFields`
- [ ] Smoke 4 ca × 2 cỡ

## Success criteria
- Cả 4 trạng thái (thiếu liên hệ / đủ liên hệ / có báo cáo / 0 báo cáo) hiển thị đúng; thứ tự khối không đổi so với trước.
- Không còn chữ "CP", "Chưa cập nhật", thẻ Zalo ở Tổng quan; Zalo còn ở sidebar.
- Mọi file ≤200 dòng; không `tt="uppercase"`.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Xóa nhầm component còn dùng | LSP references + grep trước |
| Làm mất dữ liệu hồ sơ (thành viên, khoảng trống đội) | Chúng nằm trong mục gập, kiểm từng trường so bản cũ |
| `StageRow` gõ cứng 2 giai đoạn | Lặp qua `STAGES`; kiểm thử với `available=true` giả cho giai đoạn 3 |

## Security
Mã dự án và dữ liệu liên hệ chỉ hiển thị cho chủ case như hiện tại; không log giá trị sao chép.

## Next steps
P4 dùng `StageRow` và `stage-status.ts`.
