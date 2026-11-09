# Phase 04 — Luồng gộp `/dashboard/start`

## Context Links
- Demo chạy được: `temp-1/demo/{index.html,app.js,engine.js,data.js,style.css}` (câu chữ + 6 kịch bản)
- team-fit để tham chiếu phần AI: `apps/web-1/app/dashboard/team-fit/page.tsx`, `_components/TeamFitResultStep.tsx`, `_components/TeamFitUpsellCard.tsx`
- Khung URL/nháp để học: `apps/web-1/app/dashboard/team-fit/page.tsx` (`?step=`, `LS_KEY_*`, guard)
- Modal tạo dự án: `apps/web-1/app/dashboard/_components/CreateProjectModal.tsx`
- Design system: `apps/web-1/AGENTS.md` (Mantine v9, Phosphor icons)

## Overview
- **Ưu tiên:** P0
- **Trạng thái:** pending
- Một luồng duy nhất thay cả team-fit lẫn luồng pre-CP1. Hai câu hỏi rẽ nhánh; kết quả một trang; tạo dự án ở cuối.

## Key Insights
- Hai câu hỏi rẽ nhánh **không** cần màn riêng: "có nhóm chưa" chính là câu số người ở `team` (chọn 1 = chỉ mình); "có ý tưởng cụ thể chưa" là 1 cặp chip ở đầu `idea`, rẽ sang Mad Libs hoặc ô nháp.
- Chỉ **một** trục làm kết quả giàu/nghèo: có Mad Libs hay không. Không phải 2 sản phẩm, không phải 3 luồng.
- Form nhóm gộp: tên, chuyên ngành (9 ngành + "Ngành khác"), 9 trục năng lực + mức, ô thêm. **Không** hỏi mảng nghề / sở trường / kinh nghiệm (server suy ra — Phase 07).
- Chỉ **"Ngành khác"** hỏi thêm 1 chip Kỹ thuật / Marketing / Kinh doanh–Tài chính; 8 ngành còn lại map thẳng (`TRACK_BY_MAJOR`, Thiết kế đồ hoạ → Kỹ thuật). `trackCoverage` hiện số người theo mảng, nên chỉ ngành không map được mới phải hỏi.

## Requirements
- **Chức năng:** 7 bước; rẽ nhánh ý tưởng; AI chỉ chạy ở nhánh Mad Libs; kết quả ẩn/hiện mục theo nhánh; tạo dự án ở cuối → lưu kết quả sơ bộ + báo cáo AI cùng case; nháp + URL giữ chỗ khi F5.
- **Phi chức năng:** mỗi file ≤ 200 dòng; mobile 390px; không `apiClient` trong component; không `shadow-*`; không chữ "CP".

## Architecture
```
apps/web-1/app/dashboard/start/
  page.tsx                          # auth, ?step=, nhánh, guard
  _hooks/usePreCp1Form.ts           # state + validate + nháp localStorage
  _hooks/usePreCp1Label.ts          # POST /pre-cp1/label (25s abort)
  _hooks/usePreCp1Save.ts           # POST /pre-cp1/save { caseId, input, aiLabels?, aiResult? }
  _hooks/useTeamFitEvaluation.ts    # chuyển từ team-fit/hooks (chỉ phần chấm, bỏ phần save), 40s
  _components/StartStepper.tsx
  _components/steps/{Intro,Basics,Team,Assets,Network,Idea}.tsx
  _components/idea/IdeaFork.tsx     # cặp chip "đã có / chưa có" + rẽ
  _components/idea/MadLibsForm.tsx  # 6 ô (port IdeaMadLibsStep)
  _components/idea/InlineBlank.tsx  # chuyển từ team-fit, component con của MadLibsForm
  _components/idea/madlibs-validation.ts # chuyển từ team-fit/lib/validation.ts (validate 6 ô + câu lỗi)
  _components/idea/DraftForm.tsx    # 2 ô nháp
  _components/result/ResultView.tsx # 8 khối có điều kiện
  _components/result/{TeamSection,RecruitSection,FlagsSection,ZonesSection,QuestionsSection}.tsx
  _components/result/AiResultCard.tsx  # chuyển từ team-fit/_components/TeamFitReportCard.tsx (areas, industryRoles, trackCoverage)
  _data/copy.ts
```
State = `PreCp1Input` (Phase 01) + `{ step, phase:'write'|'confirm', busy, ideaMode:'none'|'draft'|'structured', aiResult? }`.

## Related Code Files
**Tạo:** ~16 file trên
**Sửa:** `apps/web-1/app/dashboard/_components/CreateProjectModal.tsx` (thêm 2 prop optional `initialValues`, `onCreated`)
**Xoá:** xem Phase 05 (xử lý trang team-fit)

## Implementation Steps
1. `_data/copy.ts`: chuỗi từ demo (intro, hint "vì sao hỏi", 9 trục, 5 câu tài sản, 6 ô Mad Libs, 5 cờ, 6+ câu hỏi). Bỏ mọi chữ "CP". Câu chữ Mad Libs port từ `IdeaMadLibsStep.tsx`. Bốn dáng trang dùng lại cho mọi bước (demo đã dựng): **chọn 1** (thẻ lớn, một câu hỏi), **viết** (ô nhập + 1 ví dụ + nút bỏ qua), **chip** (bấm nhiều, hiện ngay cái đã chọn), **xem lại** (danh sách + nút Sửa từng dòng).
2. `usePreCp1Form`: state, `validate(step)` như demo; nháp `localStorage['nexus:pre-cp1:draft:v1']` nạp qua `PreCp1InputSchema.safeParse`; `step` + `idea` mode ghi lên URL (`?step=idea&mode=libs`).
3. `page.tsx`: `?step=`; guard lùi về bước xa nhất hợp lệ + `router.replace`; `busy` chặn nhảy bước; `useSession` như team-fit.
4. `StartStepper`: 7 bước, ẩn < `lg` (thay bằng "Bước x/7").
5. `IntroStep`: 3 dòng "Cuối cùng bạn nhận được" — thêm 1 dòng nói rõ: có ý tưởng rồi thì nhận thêm phần nhận xét theo ngành.
6. `BasicsStep`: trường, môn, mục tiêu, ngân sách (giữ ngân sách — nuôi cờ Tiền).
7. `TeamStep`: bộ đếm số người (1 = chỉ mình), nhập tới **`sizeHardMax` = 8**, nút + tự tắt ở đó. Cố ý cho vượt trần môn học 6 để nhóm đông thật vẫn khai được và nhận cảnh báo "thừa N người"; **nhóm > 6 người thì phần chấm theo ngành bị bỏ qua và UI phải nói rõ lý do** (`deriveTeamFitInput` trả `null`), không im lặng mất 2 khối. Mỗi người: tên · chuyên ngành (`Select` 9 ngành + "Ngành khác" + ô tên ngành) · **chỉ khi ngành = "Ngành khác"**: 1 cặp chip Kỹ thuật / Marketing / Kinh doanh–Tài chính (bắt buộc, để `trackCoverage` không bịa số) · 9 chip năng lực (bấm = mức 2, `Segmented` đổi 1/2/3) · ô "chưa rõ" · ô thêm (1 dòng, thành kinh nghiệm). Hiện ngay "còn trống vai nào" bằng `computeCoverage`.
8. `AssetsStep`: 5 câu + chip "Mình không có / không nhớ" từng câu + nút **"Bỏ qua cả 5 — chưa nghĩ ra gì"** (một bấm tick hết) → `usePreCp1Label` → màn xác nhận nhãn (`Đúng/Không đúng` → `assetTags`); `aiOk:false` → "Chưa đọc được, bạn tự chọn nhãn" + 16 chip tick tay. **Không có câu trả lời nào thì không gọi AI** (`LabelRequestSchema` yêu cầu ≥1 câu) — đi thẳng sang 16 chip tick tay, không hiện màn chờ 20s cho một lần gọi chắc chắn rỗng.
9. `NetworkStep`: 1 ô + 9 chip gợi ý (điền/bỏ câu, chữ tự gõ giữ nguyên).
10. `IdeaStep`:
    - `IdeaFork`: "Bạn đã có ý tưởng cụ thể chưa?" → **Chưa** = `DraftForm` (2 ô nháp, 6 chip nhạy cảm, nhãn AI xác nhận) · **Có** = `MadLibsForm` (6 ô, cùng câu hỏi nhạy cảm).
    - Nhánh Mad Libs: bấm "Xem kết quả" → gọi **song song** hai thứ, cùng một màn chờ: (a) `useTeamFitEvaluation` (chỉ khi đủ 6 ô), (b) `usePreCp1Label({ kind:'idea', payload:{ madlibs } })` để có nhãn ý tưởng. Xong thì sang **màn xác nhận nhãn ý tưởng** như nhánh nháp (`Đúng/Không đúng` → `ideaTags`), rồi mới tới kết quả — nếu không, khối "ý tưởng có vấn đề gì" sẽ rỗng ở đúng nhánh cần nó nhất. AI nhãn hỏng → tick tay 10 luật ý tưởng. AI chấm đội lỗi/40s → vẫn sang kết quả, phần AI thay bằng "Chưa chấm được theo ngành, xem phần luật bên dưới", **không** chặn luồng.
11. `ResultView` — 8 khối, đánh số động:
    1. Nhóm hiện tại (từng người, mạnh/thiếu) — luôn có.
    2. Nhóm có giữ tới hết môn không — chỉ khi có vai trống / 1 người / quá tải.
    3. Nên tìm thêm ai (3 việc lõi) + tin đăng mẫu (Sao chép) — luôn có.
    4. Vai trò theo ngành + mảng ổn/yếu — **chỉ khi có `aiResult`**.
    5. Ý tưởng có vấn đề gì (5 cờ + trích câu) — chỉ khi có ý tưởng (nháp hoặc Mad Libs).
    6. Hướng thay thế để đi hỏi — luôn có (rỗng thì nói rõ "chưa đủ dữ kiện, quay lại bước tài sản").
    7. Hội đồng sẽ hỏi gì (từ `aiResult`, 5-7 câu) — chỉ khi có `aiResult`.
    8. 5 câu hỏi người thật — luôn có.
    - Cuối trang: card upsell gói (chuyển từ team-fit) — chỉ hiện khi `aiResult` có.
    - **Thứ tự dựng = demo:** thẻ kết luận → mục lục → lưới "Số liệu nhóm" (3 thẻ số liệu + 3 ô mảng nghề) → khối 1 → 2 → 3 → 5 → 6 → 8. Khối 4 (nhận xét theo ngành) và 7 (hội đồng sẽ hỏi) chỉ có ở bản thật khi `aiResult` trả về, chèn ngay sau khối 3.
    - **Dáng trang kết quả (đã dựng trong demo):** một cột, không bảng, không sidebar. Trên cùng là 1 dòng "Đọc trước khi xem", rồi thẻ kết luận (`verdict`), rồi mục lục nhảy nhanh, rồi hàng 3 thẻ số liệu (số chuyên ngành · số mảng nghề có người · số người đã kể kinh nghiệm), rồi hàng 3 ô mảng nghề (ô trống ghi "Chưa có ai"). 5 cảnh báo xếp **2 cột từ 1024px**, 1 cột dưới. Khối chữ dừng ~78 ký tự/dòng, lưới ô dùng hết bề ngang. 8 khối kỹ thuật gom thành **5 mục người dùng thấy**: Nhóm · Nên tìm thêm ai · Ý tưởng này có vấn đề gì · Hướng thay thế · Việc tiếp theo.
    - **Chữ:** UI gọi đây là **kết quả sơ bộ**, không dùng chữ "bản đồ". Tiêu đề "Kết quả sơ bộ của nhóm bạn", mục lục "Trong trang này", nút "Tạo dự án từ kết quả này".
12. Nút cuối: **Tạo dự án từ kết quả này** → `CreateProjectModal` (điền sẵn trường/môn khi khớp option) → `onCreated(caseId)` → `usePreCp1Save({ caseId, input, aiResult })` bắn song song, retry 1 lần; lỗi giữ nháp + báo. **Thành công: KHÔNG xoá nháp** — ghi `caseId` vào nháp (chưa có endpoint đọc, xoá là mất kết quả sơ bộ); chỉ xoá khi người dùng bấm `Làm lại từ đầu`. Hiện "Đã lưu vào dự án …" + link sang dự án. Ghost: `Sửa câu trả lời`, `Làm lại từ đầu` (Modal xác nhận).
13. Mobile 390×844: chip wrap, stepper thu gọn, Mad Libs 1 cột.

## Todo List
- [ ] copy.ts (gồm câu chữ Mad Libs)
- [ ] form hook + validate + nháp + URL
- [ ] TeamStep gộp (kèm nhánh "Ngành khác")
- [ ] AssetsStep + "bỏ qua cả 5" + xác nhận nhãn
- [ ] IdeaFork + 2 form + nhánh AI
- [ ] ResultView 8 khối có điều kiện + upsell
- [ ] tạo dự án + lưu kết quả sơ bộ/báo cáo AI
- [ ] mobile 390px

## Success Criteria
4 nhánh chạy đúng (nhóm/1 mình × nháp/Mad Libs): khối 4 và 7 chỉ hiện khi có Mad Libs; khối 5 chỉ hiện khi có ý tưởng; số liệu khớp demo ở 3 kịch bản; AI hỏng không chặn đường; tạo dự án → 1 case + 1 `pre_cp1_reports` (+ 1 `team_fit_reports` nếu có AI); F5 giữ đúng bước + đúng nhánh; 5 cảnh báo 2 cột ở ≥1024 và 1 cột ở 390; không chuỗi nào chứa "bản đồ"; `npx tsc --noEmit` sạch.

## Risk Assessment
- **Luồng dài**: nhóm đông + Mad Libs là đường nặng nhất; bù bằng nút bỏ qua ở bước tài sản và validate lười (chỉ chặn khi thiếu thật).
- **File phình**: `ResultView` 8 khối → tách 6 section component, mỗi file < 200 dòng.
- **Hai lần gọi AI trong một lượt** (nhãn + chấm đội): đều có timeout riêng và nhánh hỏng riêng; không cái nào chặn đường.
- **Nhánh Mad Libs không đủ 6 ô** → không gọi AI; hiện "cần đủ 6 ô để chấm theo ngành" + vẫn xem kết quả luật.
- **Thiết kế đồ hoạ được tính là "làm ra sản phẩm"** (năng lực `craft`) → đội 2 designer + ý tưởng web vẫn bị báo thiếu vai sản phẩm, và ô "Kỹ thuật" ở kết quả lại có người. Cần chốt trước Phase 01 (câu hỏi mở §7 của doc brainstorm).
- **Thẻ số liệu thứ ba** đếm "người đã kể kinh nghiệm" (ô thêm khác rỗng). Ô thêm là tuỳ chọn, nên con số này có thể là 0 dù nhóm mạnh — copy phải nói rõ nó đếm cái gì, không gọi là "kinh nghiệm".

## Security Considerations
Không render HTML từ input; Zod giới hạn độ dài ở tầng API; nháp ở localStorage của người dùng; AI result do server trả, FE không tự dựng.

## Next Steps
Phase 05: xoá trang team-fit, chuyển 5 link, docs, QA tổng.
