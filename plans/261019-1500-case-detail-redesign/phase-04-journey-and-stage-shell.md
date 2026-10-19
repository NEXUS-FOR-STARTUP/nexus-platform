# Phase 4: Hành trình + khung chi tiết giai đoạn

Priority: P2 · Status: Pending · Effort: 5h · blockedBy: Phase 1, 3 (`StageRow`, `stage-status.ts`) · Chờ Q7

CW = `apps/web-1/app/dashboard/case/[id]/_components`

## Context Links
- Mockup: `js/views/journey.js` (57), `REPORT.md` §7 "Hành trình"
- `research/scout-02` §2 "Journey list", "Stage detail"; `reports/gap-register.md` C-05, C-14, C-28
- Code: `CW/workspace/JourneyTab.tsx` (78), `StageCard.tsx` (155), `stage/StageDetail.tsx` (171), `stage/StageHeader.tsx` (81), `stage/StageDraftView.tsx` (24), `hooks/useGuidedDrafts.ts` (73), `hooks/useGuidedDocuments.ts` (181)

## Key insights
- `StageDetail` điều phối: có lượt → `AuditConfirmModal`, hết lượt → `ServiceCheckoutModal`, sau khi mua → mở modal chấm (`onPurchased`); nút chấm khóa khi `grading`; `StageGradingPanel` nằm trên tabs. **Giữ nguyên toàn bộ.**
- Tabs hiện là `variant="pills"` + icon Lucide (`StageDetail.tsx:102-113`); mockup: chữ thường, gạch dưới 3px, không icon, không nền → `UNDERLINE_TABS_CLASSES`.
- `generateDocx`, `isGenerating` được destructure nhưng không dùng (`StageDetail.tsx:55`): xóa hoặc dùng cho menu `⋯` (xem dưới).
- Menu `⋯` (Đồng bộ thông tin, Xuất DOCX) của mockup đặt ở header, chỉ tab Soạn thảo. `syncAnswers` cần `Object.keys(drafts)` mà `drafts` là `useState` trong từng instance `useGuidedDrafts` (C-05). Giải pháp: gọi `useGuidedDrafts` một lần ở `StageDetail`, truyền `drafts` xuống `StageDraftView` → editor và `StageHeader`. Kiểm `useGuidedDrafts` có đọc `sessionStorage` đồng bộ (`nexus_guided_drafts:<caseId>`): nếu editor tự gọi hook riêng thì phải bỏ để một nguồn duy nhất.
- Mockup bỏ bộ lọc `Select` ở danh sách Hành trình (Q7). Danh sách chỉ 4 mục.
- Tab hiện có `Tài liệu (N)`: đếm tài liệu, giữ.
- URL: `?tab=journey&stage=<slug>&view=draft|files|results`; `view` đang được ép kiểu không kiểm chứng (`JourneyWorkspaceShell`): thêm kiểm tra giá trị hợp lệ, mặc định `draft`.

## Requirements
- Danh sách: `StageRow` đầy đủ: tên, ghi chú "mô tả · a/b câu · n tài liệu · còn N lượt chấm" (hoặc "hết lượt chấm"), chip, nút phụ. Nút xanh (chính) chỉ ở trang chi tiết.
- Trang chi tiết: breadcrumb `Hành trình / <tên>` (Mantine `Breadcrumbs`), H1 + chip ("Đang chấm" khi `grading`, "Đã có kết quả" khi có lượt), nút chính: `Chấm bài` / `Chấm lại` / `Mua lượt chấm` (khóa khi đang chấm), menu `⋯` chỉ ở tab Soạn thảo.
- Tabs: `Soạn thảo`, `Tài liệu (N)`, `Kết quả chấm`; có `aria-controls`/`tabpanel` tự sinh bởi Mantine.
- Không đổi hành vi điều hướng; Back/Forward vẫn chạy.

## Architecture
```
JourneyTab.tsx            danh sách StageRow, bỏ Select lọc
StageDetail.tsx (≤150)    gọi useGuidedDrafts 1 lần; render StageHeader + GradingPanel + <Tabs UNDERLINE>
StageHeader.tsx           breadcrumb, H1+chip, nút chính, StageActionsMenu
StageActionsMenu.tsx (mới) Mantine Menu: Đồng bộ thông tin, Xuất file DOCX
```
Không thêm context/store; truyền prop 1 cấp.

## Related code files
**Modify:** `JourneyTab.tsx`, `StageCard.tsx` (xóa nếu `StageRow` thay thế hoàn toàn; kiểm references), `stage/StageDetail.tsx`, `stage/StageHeader.tsx`, `stage/StageDraftView.tsx`, `JourneyWorkspaceShell.tsx` (kiểm `view`), `OverviewProgressStrip` đã xóa ở P3.
**Create:** `stage/StageActionsMenu.tsx`.
**Delete:** `workspace/StageCard.tsx` nếu không còn tham chiếu (LSP).

## Implementation steps
1. LSP references cho `StageCard`, `STATUS_META`, `getStageBadgeProps` (scout chưa tìm được nơi định nghĩa: tra trước).
2. `JourneyTab`: render `useStageSummaries` → `StageRow` đầy đủ (từ P3). Giữ `available=false` → hàng khóa, **gộp** thành 1 hàng như Tổng quan nếu >1 hàng khóa; còn 1 hàng khóa thì hiện riêng. Bỏ `Select`.
3. `StageDetail`: tạo `const { drafts, ... } = useGuidedDrafts(caseId)`; truyền xuống. Xóa `generateDocx`/`isGenerating` thừa nếu `StageActionsMenu` tự gọi hook (không destructure ở cha).
4. `StageHeader`: `Breadcrumbs`, `h1` 24/500 qua class `--ui-text-title`, `StatusChip`, `Button` chính (kích thước `sm`), `StageActionsMenu` hiện khi `view === "draft"`.
5. `StageActionsMenu`: `Menu` + `ActionIcon aria-label="Thêm"` (Lucide `Ellipsis`); mục "Đồng bộ thông tin" gọi `syncAnswers(Object.keys(drafts))`, "Xuất file DOCX" gọi `generateDocx`; trạng thái loading qua `loading`/`disabled` của mục; lỗi qua notification từ hook (đã có).
6. Tabs: `<Tabs value={view} onChange classNames={UNDERLINE_TABS_CLASSES}>` bỏ `variant="pills"`, `radius`, icon. Panel giữ nguyên.
7. Chuẩn hóa `view`: hàm `parseStageView(raw): "draft"|"files"|"results"` ở `stage-view.ts` (4 dòng + test 3 ca).
8. Kiểm tra gating: (a) còn lượt → mở modal chấm; (b) hết lượt → `ServiceCheckoutModal`; (c) mua xong → modal chấm; (d) `grading` → nút khóa.
9. Smoke: danh sách (có 0/1/2 lượt), vào/ra chi tiết, đổi tab bằng phím mũi tên (Mantine), Back/Forward, menu `⋯` ẩn ở tab Tài liệu/Kết quả. Chụp 1440/390.

## Todo
- [ ] Chốt Q7 (bỏ Select lọc)
- [ ] LSP references `StageCard`/`STATUS_META`
- [ ] Danh sách `StageRow`
- [ ] Nâng `useGuidedDrafts` lên `StageDetail`, một nguồn duy nhất
- [ ] Header + breadcrumb + menu
- [ ] Tabs gạch dưới
- [ ] `parseStageView` + test
- [ ] Smoke gating 4 ca

## Success criteria
- Ảnh khớp mockup ở 1440 và 390: tabs không icon, gạch xanh 3px, chip nhạt.
- `Đồng bộ thông tin` dùng được với bản nháp chưa lưu (kiểm bằng gõ 1 câu → không lưu → bấm đồng bộ).
- Không còn `variant="pills"` trong `stage/`; không còn `Select` lọc; `StageDetail` ≤200 dòng.
- Hành vi mua/chấm không đổi.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Hai nguồn `drafts` (editor và header) lệch | Một lần gọi hook ở cha; editor nhận prop; thêm kiểm thử thủ công |
| Mất `hideBackButton` / hộp thoại "Lưu và quay về" | Chỉ restyle; kiểm đường quay về ở P5 |
| `StageCard` còn dùng nơi khác | LSP trước khi xóa |

## Security
Không đổi quyền; lượt chấm vẫn kiểm ở server.

## Next steps
P5-P7 render bên trong các panel của khung này.
