# Phase 5: Soạn thảo (mục lục, câu hỏi, gợi ý)

Priority: P2 · Status: Pending · Effort: 8h · blockedBy: Phase 4 · Chờ Q4

CW = `apps/web-1/app/dashboard/case/[id]/_components`

## Context Links
- Mockup: `js/views/stage-draft.js` (91), `css/views.css`, `REPORT.md` §5, `index.html`
- `research/scout-02` §2 "GuidedTOC", "GuidedQuestionCard"; `reports/gap-register.md` C-04, C-13, C-36
- Code: `CW/guided-documents/GuidedDocumentsEditor.tsx` (236), `GuidedTOC.tsx` (148, **Tailwind + `<button>` thô, không Mantine**), `GuidedQuestionCard.tsx` (128), `Cp2SelfCheck.tsx`, `hooks/useGuidedDocuments.ts:129-162` (luật khóa), `answer-quality.ts` (`isThinAnswer`, `THIN_ANSWER_WORDS`=10), `CP2_SELF_CHECK_BY_QUESTION`

## Key insights
- **Logic này nhạy nhất của cả plan:** luật khóa (`unlock_requires` của câu → của phần cho câu đầu phần → câu bắt buộc liền trước), cảnh báo ngắn (<10 từ, chỉ câu `cp2_`), self-check 3 câu quan trọng (lưu cùng câu trả lời, AI đọc khi chấm), bản nháp `sessionStorage`, hộp thoại rời trang. **Không viết lại, chỉ đổi cách vẽ.**
- Mockup đã mô phỏng đúng `GuidedTOC.tsx` (REPORT §5); phần khác UI hiện tại: nhãn "Quan trọng" cam, dòng dài xếp 2 cột, icon tick xanh lá thay `CheckCircle` cũ, hint panel dính (`top:72px` → `calc(var(--ui-topbar-height) + 8px)`), "Câu tiếp" chỉ hiện mobile.
- Gợi ý: catalog chỉ có `explanation` (prose), `suggested_actions`, `further_reading` → hiện hình thức mới nhưng **không parse** (Q4, C-04). Mockup còn bỏ checkbox "Cần nêu"/"Tự kiểm tra" thành bullet vì UI thật không lưu tick: khớp quyết định.
- Nhãn "Quan trọng" ở mockup có màu cam `#c2410c`/`#ffedd5` ngoài token → dùng `StatusChip tone="warn"`.
- "Bắt buộc/Nên có/Tuỳ chọn" là phân loại catalog (`classification`).
- Mockup hint "Chưa tốt/Tốt" chip lấy từ parse; **bỏ** (C-04).
- Mobile (≤820px): TOC và hint gập; chọn câu thì đóng TOC và focus vào tiêu đề (mockup đã làm); code hiện dùng `useMediaQuery("(max-width:767px)")` + override: giữ cơ chế, đổi ngưỡng thống nhất 820? **Không đổi ngưỡng** (767) trừ khi sidebar/drawer mâu thuẫn; ghi nhận.
- Catalog CP3/CP4 sẽ hiện "CP2/CP3" cho người dùng (C-36/Q9): không sửa ở đây, nhưng thêm vào checklist trước khi mở CP3/CP4.

## Requirements
- 3 cột desktop: mục lục 280px | trả lời | gợi ý 360px; ≤1240px gợi ý xuống dưới trả lời; ≤820px một cột, TOC + gợi ý gập.
- TOC dùng Mantine (`NavLink` hoặc `UnstyledButton`) chứ không `<button>` + Tailwind thô, giữ `aria-current`, `title`, trạng thái disabled cho câu khóa. Trạng thái (6): đã trả lời / chưa / còn ngắn / khóa / đang chọn / quan trọng — bảng trong REPORT §5.
- Ô trả lời: giữ Mantine `Textarea` (autosize, `minRows=8`, `maxRows=16`), placeholder, cảnh báo ngắn `role="status"`, nút Lưu chỉ bật khi `isDirty`, "Câu trước/Câu tiếp".
- Self-check CP2: `Checkbox` Mantine, câu chữ cũ "Mục quan trọng khi chấm. Nhóm tự xác nhận, AI chấm sẽ đọc xác nhận này."
- Gợi ý: panel dính; mục có icon trên nền nhạt (Cần nêu: brand, Ví dụ: vàng, Tự kiểm tra: xanh lá, Đọc thêm: tím) — **chỉ để phân biệt, không mang trạng thái**; màu lấy từ `--color-*-soft`, tím dùng Mantine `violet` light (không hex).

## Architecture
```
GuidedDocumentsEditor.tsx (≤150)  3 cột + state (tách logic điều hướng sang hook)
 ├─ GuidedTOC.tsx (≤150)          TocPhaseGroup + TocQuestionRow (tách)
 │   ├─ TocQuestionRow.tsx        6 trạng thái, 2 cột khi có nhãn
 │   └─ guided-toc.module.css
 ├─ GuidedQuestionCard.tsx (≤150) tiêu đề, meta, Textarea, cảnh báo ngắn, Cp2SelfCheck, footer
 └─ GuidedHintPanel.tsx (mới)     explanation + Tự kiểm tra + Đọc thêm; Collapse ở mobile
hooks/useGuidedNavigation.ts (mới, nếu cần)  chọn câu, câu trước/tiếp, khóa
```

## Related code files
**Modify:** `GuidedDocumentsEditor.tsx`, `GuidedTOC.tsx`, `GuidedQuestionCard.tsx`, `Cp2SelfCheck.tsx` (style), `stage/StageDraftView.tsx` (nhận `drafts` từ P4).
**Create:** `guided-documents/TocQuestionRow.tsx`, `guided-toc.module.css`, `GuidedHintPanel.tsx`, `guided-hint-panel.module.css`, (tuỳ) `hooks/useGuidedNavigation.ts`.
**Delete:** không.

## Implementation steps
1. Ghi lại hành vi trước khi sửa (kịch bản tay): gõ câu CP2 <10 từ → cảnh báo; lưu → icon đổi; câu bị khóa không bấm được; rời editor có nháp → hộp thoại 3 nút; reload → nháp còn.
2. Đọc đủ `GuidedDocumentsEditor.tsx` (236) và `GuidedTOC.tsx`; tách phần điều hướng câu (`prev/next/locked`) ra `useGuidedNavigation` **chỉ nếu** cần để ≤200 dòng; không đổi chữ ký hook cũ.
3. `TocQuestionRow`: props `{ question, index, state, important, selected, onSelect }`; `state` suy ra từ hàm có sẵn (`isQuestionUnlocked`, `isThinAnswer`, đã trả lời). Dùng `UnstyledButton` + `aria-current`, `aria-disabled` cho câu khóa (không dùng `disabled` thuần để vẫn hiện `title` lý do khóa nếu có). Icon Lucide: `CircleCheck` (`--color-success`), `Circle`, `CircleAlert` (warning), `Lock` (mờ). Đang chọn: nền `--color-brand-subtle`, `ChevronRight`.
4. Dòng quan trọng: lưới 2 cột `[icon | tên]`, nhãn `StatusChip tone="warn"` ở hàng riêng căn theo tên; tên `-webkit-line-clamp: 3` ở CSS module.
5. `GuidedHintPanel`: `position: sticky; top: calc(var(--ui-topbar-height) + 0.5rem)` ở CSS module (đây là panel của mình); ≤1240px `position: static`. Nội dung: `question.explanation` giữ `whitespace-pre-line`, `suggested_actions` bullet "Tự kiểm tra trước khi lưu", `further_reading` bằng `Anchor` (`target="_blank" rel="noopener noreferrer"`). Ẩn phần rỗng.
6. `GuidedQuestionCard`: chữ H2 câu hỏi `--ui-text-section`, meta `--ui-text-note`; cảnh báo ngắn giữ chữ "Câu trả lời còn ngắn (N/10 từ). Viết thêm để AI có đủ căn cứ chấm."; thêm `aria-live="polite"` cho vùng trạng thái lưu.
7. Mobile: TOC và hint bọc `Collapse` + `useMediaQuery`; chọn câu → đóng TOC, focus vào H2 (`tabIndex={-1}`, `ref.focus()`).
8. Footer: "Đã lưu / Chưa lưu / Chưa có câu trả lời", "Câu trước", "Lưu", "Câu tiếp" (chỉ mobile, `hiddenFrom`/media; khóa nếu câu kế bị khóa).
9. Chạy lại kịch bản bước 1 + chụp 1440/1240/820/390.

## Todo
- [ ] Chốt Q4 (không parse gợi ý)
- [ ] Kịch bản hành vi trước khi sửa
- [ ] `TocQuestionRow` + css
- [ ] `GuidedHintPanel`
- [ ] Question card restyle + `aria-live`
- [ ] Gập mobile + focus H2
- [ ] Tách ≤200 dòng mỗi file
- [ ] So sánh hành vi trước/sau 6 ca

## Success criteria
- 6 trạng thái dòng TOC khớp bảng REPORT §5, đo trên ca "Thị trường partial" (23/27 trả lời, câu chuyên gia còn ngắn, khảo sát để trống, ngân hàng câu hỏi khóa); mở khóa sau khi lưu câu khảo sát.
- Không mất nháp khi đổi tab; hộp thoại rời trang vẫn chạy.
- Không còn `<button>` + Tailwind thô trong TOC; mọi file ≤200 dòng; không hex trong TSX.
- Không nhãn "CP1/CP2/Pass/Fail" do **mình** thêm.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Đổi `<button>` → `UnstyledButton` làm mất focus ring/phím | Kiểm Tab/Enter/Space; `:focus-visible` outline brand |
| Câu khóa dùng `disabled` làm mất tooltip | `aria-disabled` + chặn onClick |
| Sticky bị cắt bởi `overflow` của cha | Kiểm không cha nào có `overflow` khác `visible` |
| Mất hành vi tự xác nhận khi tách | Giữ `Cp2SelfCheck` nguyên, chỉ đổi class |

## Security
Link ngoài `rel="noopener noreferrer"`. Không render HTML từ catalog (`explanation` là text thuần, không `dangerouslySetInnerHTML`).

## Next steps
P6, P7.
