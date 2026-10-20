---
title: "Redesign Chi tiết dự án (case workspace) theo mockup, giữ Mantine + logic cũ"
description: "Áp bố cục/hình thức mockup case-detail lên đường sống JourneyWorkspaceShell của web-1; phase 1 dựng nền chung (token, tabs, chip, hàng mở rộng, formatVndAmount) cho cả 3 plan redesign."
status: pending
priority: P2
effort: 58h
tags: [frontend, web-1, ux, refactor, tech-debt]
blockedBy: []
blocks: []
created: 2026-10-19
branch: feat/landing-redesign
---

# Redesign Chi tiết dự án

Mockup: `design-system/mockups/case-detail/` (mở `index.html` bằng `file://`; spec ở `REPORT.md` §11). **Mockup chỉ là đặc tả UX/UI, không phải mã sản phẩm.**

Đọc trước khi code: [gap-register](reports/gap-register.md) (mọi chỗ mockup ≠ code), [mantine-reuse-map](reports/mantine-reuse-map.md), [skill-filter](reports/skill-filter-taste-minimalist.md), `apps/web-1/AGENTS.md`, `.agents/rules/frontend-ui-rules.md`, `design-system/wording/pages/case-detail.md`.

## Ground rules (mọi phase)

1. **Mantine trước.** Giữ `Tabs`, `Modal`, `Textarea`, `TextInput`, `Select`, `Stepper`, `Dropzone`, `CopyButton`... với `error`/`placeholder`/validation hiện có. Đổi style qua `classNames` + CSS module + biến. Không chép DOM/CSS mockup.
2. **Giữ logic cũ.** Mỗi phase có mục "Logic phải giữ" lấy từ `research/scout-02`. Redesign không đổi hook, key query, luật khóa câu, polling, gating tín dụng, URL `?tab=&stage=&view=`.
3. **Mockup thiếu / code thiếu → báo, không tự quyết.** Mọi chỗ mới phát hiện thêm vào `reports/gap-register.md` rồi hỏi chủ dự án; không lặng lẽ bỏ hay thêm hành vi.
4. **Clean code frontend.** File ≤200 dòng (tách khi chạm); style trong `*.module.css` dùng biến CSS (`--color-*`, `--ui-*`), không hex/px rải trong TSX; component dùng lại ở `components/ui/`; không `apiClient` trong component, không try/catch trong component, không `as any`.
5. **Quy tắc hiển thị.** Tiền `79,000 VND` (`formatVndAmount`), không CP1-CP4 hay mã `cp1_audit` trên UI, Lucide (không Phosphor), tiếng Việt, chữ ≥14px, trọng lượng 400/500, `size>=sm`, không shadow lúc nghỉ, không gradient.
6. **Ponytail ultra.** Mỗi phase hỏi "có cần không"; không thêm abstraction/option/config ngoài yêu cầu; logic mới không tầm thường (formatVndAmount, derive chip, build nhóm tài liệu, nhóm ngày) kèm một file kiểm assert nhỏ.
7. **Taste.** Cổng ở `reports/skill-filter-taste-minimalist.md`.
8. **Cổng chung mỗi phase:** `bun run check-types`, `bun run lint`, smoke trình duyệt 1440 + 390 so với mockup, ghi kết quả vào phase file.


## Quy ước ghi đè (sau rà soát)
- **Nhánh:** dùng nhánh hiện tại `feat/landing-redesign` (kết quả `git branch --show-current`); đổi nhánh khi bắt đầu code nếu muốn tách.
- **Test:** `AGENTS.md` chỉ cho test ở `apps/api`; web-1 không có runner. Mọi `*.test.ts` nêu trong phase **không commit**: kiểm hàm thuần bằng script tạm (xóa sau), cổng chính là `check-types` + `lint` + smoke trình duyệt. Thiếu hạ tầng test web ghi nhận là khoảng trống, không tự dựng.
- **Viền:** `frontend-ui-rules.md` §6.3 (bắt buộc) đòi viền Card/Paper 1.5px, không phải 1px của mockup. Dùng 1.5px qua biến.
- **Phụ thuộc:** Phase 1 của plan case-detail (token, `UnderlineTabs`, `StatusChip`, `ExpandableList`, `CopyIconButton`, `formatVndAmount`) là tiền đề cho plan này; chạy plan case P1 trước.

## Phạm vi

- **Trong:** đường sống `NEXT_PUBLIC_JOURNEY_WORKSPACE=true` (`workspace/*`, `guided-documents/*`, `billing/*`, `CreditTransactionHistory`, `ActivityTimeline`, `TabCaseSettings`, `TabReportFindings`/`RoundCard`).
- **Ngoài:** backend/API, schema DB, luồng chat/thảo luận (đã tắt), dọn ~3.000 dòng code chết (đề xuất plan riêng, xem Q6), admin/supporter, landing.
- **Backend:** không sửa. Dữ liệu mockup đòi mà API chưa có thì bỏ hoặc lấy lazy qua endpoint có sẵn (C-01, C-02).

## Cross-Plan Dependencies

| Quan hệ | Plan | Trạng thái | Ghi chú |
|---|---|---|---|
| Phase 1 là tiền đề (artefact, không serialize cả plan) | [261019-1510-profile-settings-redesign](../261019-1510-profile-settings-redesign/plan.md) | pending | Cần token `--ui-*`, `StatusChip`... Sau Phase 1 chạy song song |
| Phase 1 là tiền đề (artefact, không serialize cả plan) | [261019-1520-wallet-redesign](../261019-1520-wallet-redesign/plan.md) | pending | Cần `UnderlineTabs`, `ExpandableList`, `formatVndAmount`, `CopyIconButton` |
| Liên quan, không chặn | [261018-1520-landing-redesign](../261018-1520-landing-redesign/plan.md) | pending (lỗi thời) | Scout xác nhận phase 1 (Inter Tight) và phase 3 (`OverviewIdeaGuideAlert`) **đã merge** (`78691ec`, `ad6cb5f`, `00a50c9`); phase còn lại chỉ đụng `components/landing/*`. Plan này sửa `OverviewTab.tsx` ở P3, phải giữ thứ tự của landing P3 |
| Liên quan, không chặn | [261016-1530-grant-wallet-funds-pay-later](../261016-1530-grant-wallet-funds-pay-later/plan.md) | completed | Không chạm `PaymentView` & `lib/deposit-display.ts` ở plan này |

## Phases

| Phase | Name | Effort | Status |
|---|---|---|---|
| 1 | [Nền chung: token, tabs, chip, hàng mở rộng, tiền](./phase-01-shared-foundation.md) | 6h | Pending |
| 2 | [Khung trang, sidebar, ngăn kéo mobile](./phase-02-shell-sidebar-mobile-nav.md) | 4h | Pending |
| 3 | [Tổng quan](./phase-03-overview.md) | 5h | Pending |
| 4 | [Hành trình + khung chi tiết giai đoạn](./phase-04-journey-and-stage-shell.md) | 5h | Pending |
| 5 | [Soạn thảo: mục lục, câu hỏi, gợi ý](./phase-05-draft-editor.md) | 8h | Pending |
| 6 | [Tài liệu + hộp thoại tải lên](./phase-06-files-and-upload.md) | 6h | Pending |
| 7 | [Kết quả chấm + panel chấm + hộp thoại xác nhận](./phase-07-results-grading-audit.md) | 8h | Pending |
| 8 | [Thanh toán + lịch sử giao dịch mở rộng](./phase-08-billing-and-history.md) | 8h | Pending |
| 9 | [Lịch sử hoạt động + Cài đặt dự án](./phase-09-timeline-and-settings.md) | 4h | Pending |
| 10 | [QA, a11y, tài liệu](./phase-10-qa-docs.md) | 4h | Pending |

Thứ tự: 1 → (2, 3, 4) → 5, 6, 7 → 8 → 9 → 10. Sau P1, P2-P4 sửa file khác nhau; P5-P7 chỉ cùng chạm `StageDetail.tsx` (P4 chốt trước).

## Câu hỏi cần chủ dự án quyết (chưa chặn P1)

| # | Câu hỏi | Mặc định nếu không trả lời | Chặn phase |
|---|---|---|---|
| Q1 | Dòng giao dịch mở rộng: bỏ khối "Thanh toán/ngân hàng" (không nối được đơn ↔ nạp tiền), giữ "Đơn hàng" lấy lazy bằng `GET /orders/:id`. Chấp nhận? | Có | P8 |
| Q2 | Sidebar đổi từ nền **xanh brand đặc** sang **trắng viền phải** như mockup. Đây là đổi nhận diện. Chấp nhận? | Có (theo mockup) | P2 |
| Q3 | Token chữ 14/16/18/24 + trọng lượng 400/500: thêm biến mới `--ui-text-*` chỉ dùng trong vùng redesign (không sửa `--app-text-*` vì ảnh hưởng admin), hay sửa toàn cục? | Thêm mới, không sửa cũ | P1 |
| Q4 | Panel gợi ý: không viết parser tách "Cần nêu / Ví dụ"; hiện đúng 3 phần catalog có (explanation, tự kiểm tra, đọc thêm). Chấp nhận? | Có | P5 |
| Q5 | Lịch sử hoạt động đổi sang mới nhất trước + nhãn "50 sự kiện gần nhất" (API chỉ trả 50). Chấp nhận? | Có | P9 |
| Q6 | Dọn code chết của luồng cũ (~3.000 dòng, `page.tsx` 347 dòng) + tắt websocket chat vô ích mỗi lần mở case (`page.tsx:76-77`): làm plan riêng? | Chỉ báo, không làm | ngoài |
| Q7 | Bỏ `Select` lọc giai đoạn ở danh sách Hành trình (mockup không có). Chấp nhận? | Có | P4 |
| Q8 | `missingMandatoryCount` không bao giờ được truyền → cảnh báo vàng ở modal chấm không hiện. Sửa trong plan này hay để riêng? | Để riêng, ghi nhận | P7 |
| Q9 | Khi mở CP3/CP4: catalog `questions-cp3/cp4.ts` chứa chữ "CP2/CP3" hiển thị cho người dùng. Sửa catalog trước khi mở? | Báo, không sửa ở plan này | ngoài |

## Verification tổng

Smoke theo `?tab=overview|journey|billing|timeline|settings` + `&stage=y-tuong|thi-truong&view=draft|files|results`, 1440/768/390, sáng + tối, so với mockup. Chi tiết `phase-10`.

## Unresolved questions

Q1-Q9 ở trên. Chưa xác minh: tương thích `Tabs variant="unstyled"` ở Mantine v9 (P1 kiểm bằng context7), trường version tài liệu (P6), việc `StageFilesView` còn phục vụ sinh viên ở tab "Phản hồi ngoài" (P6).
