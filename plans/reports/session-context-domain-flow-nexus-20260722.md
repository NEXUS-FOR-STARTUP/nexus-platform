# Session Context: Domain & Flow Nexus Platform

**Ngày:** 22/07/2026
**Mục đích:** Toàn bộ context brainstorm về flow Nexus — từ phát hiện bug đến quyết định thiết kế end-to-end.

---

## PHẦN 1: PHÁT HIỆN BAN ĐẦU

### Bug report
User: từ trang chủ chọn "audit team-idea free" → login → dẫn đến `http://localhost:3001/dashboard/intake?packageId=pkg_tf_free`. Nhảy vào form intake chứ không phải team-fit.

### 3 commit gần nhất (branch feat/wave-system)
```
9e372e6 feat(wave1): implement team-fit free flow with 3 entry points
e1a54b3 feat(wave2b): implement pay-per-round audit system
c0aaedc feat(wave4): admin analytics + SLA timer wire-up
```

### AuthPanel redirect bug
File `apps/web-1/app/auth/_components/AuthPanel.tsx` — 3 vị trí (dòng 71-73, 115-117, 159-161) cùng dùng:
```typescript
const callbackUrl = packageId
  ? `/dashboard/intake?packageId=${packageId}`
  : "/dashboard";
```
Mọi packageId bị redirect vào intake form 9 bước, không phân biệt team-fit packages.

---

## PHẦN 2: ĐIỀU TRA CODE & DOCUMENT

### Document team đã đọc
- `.omo/reports/pay-per-audit-design-shift.md` — Design shift từ gói cố định sang mua lượt
- `.omo/plans/team-fit-free-flow-wave1.md` — Plan Wave 1 (17 todos, 3 entry points)
- `.omo/plans/pay-per-round-wave2b.md` — Plan Wave 2b (10 todos)
- `.omo/drafts/team-fit-free-flow-wave1.md` — Decisions + component ledger Wave 1
- `.omo/drafts/pay-per-round-wave2b.md` — Decisions + component ledger Wave 2b
- `.omo/drafts/wave4-operations-v2.md` — Scope Wave 4
- `.omo/session-handoff-260720.md` — Tổng quan roadmap + decisions
- `.omo/notepads/wave1/learnings.md` — Ghi chú learnings Wave 1
- `.omo/notepads/wave2b/learnings.md` — Ghi chú learnings Wave 2b
- `.omo/reports/wave4-scope-decisions.md` — Scope decisions Wave 4
- `.omo/boulder.json` — Trạng thái hoàn thành 3 wave

### Code frontend đã trace
- `apps/web-1/app/auth/_components/AuthPanel.tsx` — Auth redirect logic
- `apps/web-1/components/landing/PackagePreview.tsx` — Landing page package cards (link /auth?packageId=...)
- `apps/web-1/components/landing/LandingHero.tsx` — Hero section
- `apps/web-1/app/dashboard/page.tsx` — Dashboard student: 3 CTA (team-fit, intake, paid audit), paid audit card "Mua ngay 39k"
- `apps/web-1/app/dashboard/_components/DashboardEmptyState.tsx` — Empty state: chỉ 1 nút "Tạo hồ sơ mới" → /dashboard/intake
- `apps/web-1/app/dashboard/team-fit/page.tsx` — Team-fit 3-step: Idea Mad Libs → Team Input → Result. handleSave hardcode pkg_tf_free, handleBuy hardcode pkg_tf_audit. KHÔNG import useSearchParams, KHÔNG đọc ?intent=paid
- `apps/web-1/app/dashboard/intake/page.tsx` — Intake form 9 bước, đọc ?packageId từ URL
- `apps/web-1/app/dashboard/intake/hooks/useIntakeForm.ts` — Gán packageId từ URL vào IntakeData.package_id
- `apps/web-1/app/dashboard/intake/_components/IntakeChatFlow.tsx` — Step PACKAGE render tất cả package từ API (gồm pkg_tf_free + pkg_tf_audit)
- `apps/web-1/app/dashboard/intake/_components/Steps/DocumentInputStep.tsx` — Drive link upload + multi-select checkbox document type + template DOCX/Markdown
- `apps/web-1/app/dashboard/intake/_types/intake.types.ts` — IntakeData: package_id, current_blocker, contact, team_context, support_needs, documents, deadline, boundary...
- `apps/web-1/app/dashboard/case/[id]/page.tsx` — Case workspace: upgrade banner (pkg_tf_free), buy-round modal (pkg_tf_audit), revision button (cũ)
- `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx` — Guidance theo stage: paid case hiện "Mua thêm lượt 39k", old package hiện "Nộp bản sửa"
- `apps/web-1/app/dashboard/case/[id]/_components/RevisionSubmitModal.tsx` — Modal nộp bản sửa (upload file + change summary)
- `apps/web-1/app/dashboard/case/[id]/_components/BuyRoundModal.tsx` — Modal mua thêm lượt (POST buy-round, redirect payment)
- `apps/web-1/app/dashboard/case/[id]/_components/AuditRoundTimeline.tsx` — Timeline các audit round
- `apps/web-1/hooks/usePackages.ts` — TanStack Query fetch GET /api/packages
- `apps/web-1/proxy.ts` — Middleware auth guard, redirect /dashboard/* → /auth nếu không có session cookie
- `apps/web-1/components/layout/DashboardShell.tsx` — Shell chung cho dashboard/admin/supporter

### Code backend đã trace
- `apps/api/src/modules/packages/domain/package.types.ts` — DEFAULT_PACKAGES (Gói 0-3)
- `apps/api/src/modules/packages/application/list-packages.usecase.ts` — List active packages, seed default nếu DB trống
- `apps/api/src/modules/cases/application/submit-revision.usecase.ts` — Submit revision: tạo lifecycle_unit version mới, tăng latest_version_no
- `apps/api/src/modules/cases/application/recall-revision.usecase.ts` — Recall revision: block nếu pkg_tf_audit (dòng 85), rollback version_no
- `apps/api/src/modules/cases/http/cases.controller.ts` — Case routes (revisions, recall, upgrade, buy-round...)
- `apps/api/src/modules/documents/domain/document-types.ts` — Document types enum, unit code convention (v00=intake, vNN=revision, aNN-vNN=assessment)
- `prisma/schema.prisma` — Checkpoint (latest_version_no, latest_assessment_no), LifecycleUnit (unit_type, version_no, assessment_no), AuditRound (round_number, status)
- `prisma/seeds/seed-packages.ts` — Deactivate Gói 0-3, seed pkg_tf_free + pkg_tf_audit



---

## PHẦN 3: SỬA HIỂU LẦM VỀ BUSINESS DOMAIN

### Sai lầm 1: "vòng" và "assessment unit"
Agent suy diễn: `vNN` = version_no = "vòng", `aNN-vNN` = supporter output.

User sửa:
- `v00` = intake (user nộp lần đầu), `v01`, `v02`... = version document user upload
- `aNN-vNN` = tài liệu đánh giá từ GIẢNG VIÊN trên trường, user tự upload để supporter hiểu thêm. Convention đặt tên để phân biệt: user viết (vNN) vs giảng viên nhận xét (aNN-vNN)
- Nguồn code: `EXTERNAL_FEEDBACK_SOURCES = ["lecturer", "mentor", "other"]`, `ExternalFeedbackUploadModal`, `DOCUMENT_TYPE_FLOWS = ["intake","revision","supporter_output","external_feedback"]`
- Agent thừa nhận lỗi: tự suy diễn không đọc kỹ document và code. Không phải do tài liệu/code sai.

### Sai lầm 2: team-fit vs intake
Agent suy diễn team-fit thay thế intake hoặc 2 lựa chọn ngang hàng.

User sửa:
- **Intake** = sản phẩm cốt lõi. Mô phỏng flow audit thủ công đã chạy qua Zalo/chat:
  - Khách gửi tài liệu → supporter yêu cầu gửi hết hoặc gửi template → supporter đọc → audit → gửi report
  - User đọc → chưa đủ thì sửa → audit tiếp → hài lòng → nộp giảng viên → pass môn → upload feedback
  - Web quản lý tài liệu, version, case. Supporter audit bằng flow riêng bên ngoài.
- **Team-fit** = requirement SAU NÀY. Sinh ra từ mentor feedback (gói mắc nhất không ai mua).
  - Dịch vụ free kiếm khách: nhập idea, problem, mvp, solution, team → AI đánh giá sơ bộ → gaps → dẫn sang mua audit
  - Output AI lưu trong `team_fit_reports`, giá trị thấp, chỉ tham khảo và giữ context

### Sai lầm 3: "N vòng miễn phí trong gói"
Agent hiểu "vòng" = user upload version.

User sửa:
- "Vòng" = 1 chu trình hoàn chỉnh: user gửi tài liệu → supporter đọc → supporter gửi báo cáo → user đọc báo cáo. Xong 1 vòng.
- "Đọc" = tự hiểu ngầm việc xem tài liệu, không lưu hay tương tác hệ thống.
- Code cũ không enforce giới hạn số vòng. "N vòng" chỉ là chữ trong tên gói — business promise, không ràng buộc kỹ thuật.

---

## PHẦN 4: 6 ĐIỂM ĐỨT GÃY

File đầy đủ: `plans/reports/investigation-domain-flow-nexus-20260722.md`

| # | File | Vấn đề | Mức |
|---|------|--------|-----|
| F1 | AuthPanel.tsx:71,115,159 | Redirect mọi packageId → /dashboard/intake, không phân biệt team-fit | Critical |
| F2 | team-fit/page.tsx | Không import useSearchParams, ?intent=paid bị ignore | High |
| F3 | DashboardEmptyState.tsx:17 | Empty state chỉ link intake, không có team-fit | High |
| F4 | IntakeChatFlow.tsx:199-235 | Intake form vẫn hiển thị pkg_tf_free + pkg_tf_audit | High |
| F5 | Dashboard page.tsx:29-77 | 3 CTA song song (team-fit, intake, paid audit) | Medium |
| F6 | Case detail + StatusGuidanceCard | Revision miễn phí và Buy-round cùng tồn tại | Medium |

### Nguyên nhân
1. **Additive-only**: 3 wave chỉ thêm code, không sửa/xóa code cũ
2. **Thiếu spec tổng thể**: mỗi wave plan riêng, không có user journey end-to-end
3. **Todo 15 chưa implement**: plan yêu cầu team-fit page đọc searchParams.intent nhưng code không có (learnings ghi "will read in Todo 12+13")



---

## PHẦN 5: BRAINSTORM BUSINESS & QUYẾT ĐỊNH

### User giải thích business context

**Intake trong business Nexus:**
- Hệ thống phục vụ audit tài liệu đầy đủ: quản lý tài liệu, version, supporter đánh giá, feedback loop
- Mô phỏng flow audit thủ công đã hoạt động: khách gửi tài liệu (qua Zalo/chat) → supporter yêu cầu gửi hết hoặc gửi template để điền → supporter đọc → audit (flow riêng không đưa vào web) → gửi report → user đọc → chưa đủ thì sửa và audit tiếp → hài lòng → nộp giảng viên → pass môn → upload feedback giảng viên để đánh giá dịch vụ

**Team-fit trong business Nexus:**
- Requirement sau này, sinh ra từ mentor feedback: gói mắc nhất (399k) không ai mua
- Hướng đến trải nghiệm chiều user: dịch vụ free kiếm khách
- User nhập thông tin cơ bản (idea, problem, mvp, solution, team) → AI đánh giá sơ bộ → chỉ ra gaps → dẫn sang mua audit
- Output AI lưu trong `team_fit_reports`, giá trị thấp, chỉ tham khảo

**Pay-per-round — tại sao:**
- Thay đổi cơ chế thu phí: từ mua gói cố định mắc → mua lượt audit giá rẻ
- Tiện cho user ra quyết định (không phân vân giá), phù hợp về lượng (cần 1 lần → mua 1, cần thêm → mua thêm)
- Cùng 1 case, không tạo case mới mỗi lần mua thêm

**Tương lai:**
- Sẽ mở thêm checkpoint khác (CP2, CP3...), sân chơi quốc tế
- Cần nền tảng vững chắc, mở rộng được, không conflict

### Quyết định A: Bỏ Gói 0-3
- Hiện dev, chưa production → không cần backward compat
- Chuyển hoàn toàn sang pay-per-round
- Xóa data dev, bỏ DEFAULT_PACKAGES seed, bỏ RevisionSubmitModal, bỏ guard isPaidCase
- Chỉ giữ pkg_tf_free + pkg_tf_audit

### Quyết định B+C: Package chọn trước, form theo sau
- Intake form bỏ step PACKAGE
- Package xác định từ landing hoặc team-fit, từ đó mở form tương ứng
- Mở rộng sau này: mỗi package mới có form riêng, không phụ thuộc intake form
- Ví dụ: pkg_tf_free → team-fit Mad Libs, pkg_tf_audit → intake form, pkg_cp2_audit → form CP2

### Quyết định D: Bỏ Drive link, upload file trực tiếp

**Phân tích trước quyết định:**
- Drive link: user paste 1 link (dễ), hệ thống nặng (cần sync, phân loại, cron)
- Upload file: user upload từng file, hệ thống nhẹ (Cloudinary), mỗi file có doc_type riêng
- Hiện tại 2 cơ chế upload song song: Drive link (intake lần đầu) và upload file (nộp bản sửa)

**Lý do chọn upload file:**
- Đơn giản hóa hệ thống: không Drive API, không cron sync, không parse link
- Phân loại chính xác: mỗi file có doc_type riêng, không "khai báo chung chung"
- Supporter đọc file trực tiếp, không cần vào Drive
- Phù hợp tương lai: mỗi loại document có metadata/validate riêng

**Đánh đổi:** user lần đầu upload nhiều file hơi mất công hơn paste 1 link. Bù lại: hệ thống đơn giản hơn nhiều.

### Quyết định về pre-fill team-fit data → intake form

**Phân tích 2 hướng:**
- Có pre-fill: user đỡ điền lại, nhưng hệ thống phức tạp (mapping field, sync, conflict resolution khi user sửa trong intake khác với team-fit)
- Không pre-fill: hệ thống tách biệt đơn giản, user tự điền trong template DOCX

**Quyết định: KHÔNG pre-fill.**
- Overlap giữa 2 form rất ít (chỉ projectName)
- Template DOCX đã giải quyết vấn đề — user điền 1 lần, dùng lại cho CP2, sân chơi quốc tế
- Template là single source of truth, không phụ thuộc form Nexus
- Tách biệt logic: sau này thêm dịch vụ mới không bị dependency ngầm
- Complexity leo thang theo số form × số package nếu pre-fill

### Quyết định về landing page
- "Kiểm tra miễn phí" (team-fit) — CTA chính cho người mới
- "Mua 1 lượt kiểm tra chuyên sâu ngay (39k)" — CTA phụ cho người quen
- Phân cấp rõ: free là phễu, audit là dịch vụ. Không hiển thị như 2 lựa chọn ngang hàng

### Quyết định về team-fit case → intake
- Team-fit "Lưu kết quả" → tạo case lightweight (pkg_tf_free, không document, không checkpoint)
- Team-fit "Mua audit 39k" → tạo case paid (pkg_tf_audit)
- Sau khi có case paid: case detail hiện Mantine Alert "Bổ sung thông tin" + stepper
  - Stepper: "Bổ sung thông tin → Chờ supporter review → Nhận báo cáo"
- Bấm "Bổ sung thông tin" → mở intake form UPDATE case hiện tại (không tạo case mới)
- Intake form add document + checkpoint vào case đã có

### Quyết định về document upload
- Template DOCX (`public/idea-template/TEMPLATE_STARTUP_CHECKPOINT1_V2.docx`) là tham khảo, KHÔNG bắt buộc
- User upload file nào cũng được, không validate bắt buộc file gì
- Mỗi file chọn doc_type lúc upload
- Lần đầu có thể upload nhiều file, bản sửa upload 1-2 file

### Quyết định về feedback giảng viên
- Nút riêng "Tải đánh giá bên ngoài" trong case workspace document tab
- doc_type = external_feedback
- Upload sau khi case completed, để Nexus đánh giá chất lượng dịch vụ



---

## PHẦN 6: END-TO-END FLOW (THIẾT KẾ CUỐI CÙNG)

```
LANDING
│
├─ [Kiểm tra miễn phí] ──────────────────────────────────────────┐
│                                                                  │
├─ [Mua 1 lượt kiểm tra chuyên sâu ngay (39k)] ─────┐              │
│                                                    │              │
▼                                                    │              │
AUTH PAGE                                            │              │
│                                                    │              │
▼                                                    │              │
INTAKE FORM (package=audit, bỏ step chọn gói)        │              │
│ Step 1: Tình huống hiện tại                        │              │
│ Step 2: Liên hệ                                    │              │
│ Step 3: Bối cảnh dự án                             │              │
│ Step 4: Nhu cầu hỗ trợ                             │              │
│ Step 5: Tài liệu (upload file + chọn doc_type)     │              │
│   └─ Alert: Template DOCX tham khảo                │              │
│ Step 6: Deadline                                   │              │
│ Step 7: Boundary                                   │              │
│ Step 8: Review & Submit                            │              │
│                                                    │              │
▼                                                    │              │
CASE WORKSPACE (paid) ◄─────────────────────────────┘              │
│ [CaseStatusHeader: "Chờ xét duyệt"]                              │
│ [AuditRoundTimeline: Round #1]                                   │
│ [Tab Tài liệu: danh sách file đã upload]                         │
│                                                                  │
│ Supporter review → gửi report                                    │
│                                                                  │
▼                                                                  │
CASE WORKSPACE (report_ready)                                      │
│ [StatusGuidanceCard: "Báo cáo đã sẵn sàng"]                      │
│ [Nút: Mua thêm lượt audit (39k)]                                 │
│                                                                  │
│ User đọc report, thấy chưa đủ → mua thêm round                   │
│                                                                  │
▼                                                                  │
BUY ROUND MODAL → Payment → Case tiếp tục round mới                │
│                                                                  │
│ Lặp đến khi user hài lòng                                        │
│                                                                  │
▼                                                                  │
CASE WORKSPACE (completed)                                         │
│ [Nút: Tải đánh giá bên ngoài] → upload feedback giảng viên       │
│                                                                  │
└─ END                                                             │


TEAM-FIT (nhánh trái)                                               │
│                                                                  │
▼                                                                  │
AUTH PAGE (nếu chưa login)                                         │
│                                                                  │
▼                                                                  │
TEAM-FIT PAGE                                                      │
│ Step 1: Idea Mad Libs (6 blanks)                                 │
│   - projectName, field, targetCustomer, problem, solution, mvp   │
│ Step 2: Team Input (members)                                     │
│ Step 3: AI đánh giá → Result (teamGaps + commercialGaps)         │
│   ├─ [Lưu kết quả] → POST save {packageId: "pkg_tf_free"}       │
│   │     → tạo case lightweight                                   │
│   └─ [Mua audit 39k →] → POST save {packageId: "pkg_tf_audit"}  │
│         → tạo case paid, redirect payment                        │
│                                                                  │
▼ (sau khi lưu free)                                               │
CASE WORKSPACE (free)                                              │
│ Upgrade banner: "Nâng cấp ngay" → upgrade-package → payment      │
│                                                                  │
▼ (sau khi pay, hoặc sau khi mua audit từ result)                  │
CASE WORKSPACE (paid)                                              │
│ Mantine Alert: "Bổ sung thông tin"                               │
│ Mantine Stepper: "Bổ sung thông tin → Chờ review → Nhận báo cáo" │
│                                                                  │
▼ (bấm "Bổ sung thông tin")                                        │
INTAKE FORM (package=audit, update case hiện tại)                  │
│ Step 1-8 như luồng chính                                         │
│                                                                  │
▼                                                                  │
CASE WORKSPACE (paid) ◄── nhập vào luồng chính ──────────────────┘
```

### Ghi chú flow
- "Mua audit 39k" từ team-fit result: tạo case paid mới (chưa có document), redirect payment, pay xong → case detail → Alert "Bổ sung thông tin"
- "Lưu kết quả" từ team-fit result: tạo case free, case detail → upgrade banner. Upgrade + pay → case detail → Alert "Bổ sung thông tin"
- "Bổ sung thông tin": mở intake form, UPDATE case hiện tại (thêm document, checkpoint, intake metadata)
- Intake form KHÔNG có step chọn package — đã xác định là audit
- Tất cả upload là file trực tiếp (Cloudinary), mỗi file chọn doc_type
- Sau completed: user upload feedback giảng viên qua nút "Tải đánh giá bên ngoài" (doc_type=external_feedback)



---

## PHẦN 7: TỔNG KẾT QUYẾT ĐỊNH

| # | Quyết định | Chi tiết |
|---|-----------|----------|
| A | Bỏ Gói 0-3 | Xóa data dev, bỏ DEFAULT_PACKAGES seed, bỏ RevisionSubmitModal, bỏ guard isPaidCase. Chỉ giữ pkg_tf_free + pkg_tf_audit |
| B+C | Package chọn trước | Intake form bỏ step PACKAGE. Package xác định từ landing/team-fit, mở form tương ứng. Mở rộng sau: mỗi package = form riêng |
| D | Bỏ Drive link | Upload file trực tiếp (Cloudinary) cho mọi trường hợp. Mỗi file có doc_type riêng. Không còn cron sync Drive |
| E | Không pre-fill | Team-fit data KHÔNG tự động điền vào intake form. Template DOCX là single source of truth |
| F | Landing 2 CTA | "Kiểm tra miễn phí" (team-fit, primary) + "Mua 1 lượt kiểm tra chuyên sâu ngay" (audit, secondary) |
| G | Case update | Team-fit case → upgrade/pay → Alert "Bổ sung thông tin" → intake form UPDATE case (không tạo mới) |
| H | Alert + Stepper | Case detail: Mantine Alert thông báo bước tiếp theo + Stepper hiển thị tiến trình |
| I | Template tham khảo | DOCX template không bắt buộc, user upload file tùy ý |
| J | Feedback giảng viên | Nút "Tải đánh giá bên ngoài", doc_type=external_feedback |

---

## PHẦN 8: DANH SÁCH FILE LIÊN QUAN

### Document team
- `.omo/reports/pay-per-audit-design-shift.md`
- `.omo/plans/team-fit-free-flow-wave1.md`
- `.omo/plans/pay-per-round-wave2b.md`
- `.omo/drafts/team-fit-free-flow-wave1.md`
- `.omo/drafts/pay-per-round-wave2b.md`
- `.omo/drafts/wave4-operations-v2.md`
- `.omo/session-handoff-260720.md`
- `.omo/notepads/wave1/learnings.md`
- `.omo/notepads/wave2b/learnings.md`
- `.omo/reports/wave4-scope-decisions.md`
- `.omo/boulder.json`

### Code frontend
- `apps/web-1/app/auth/_components/AuthPanel.tsx`
- `apps/web-1/components/landing/PackagePreview.tsx`
- `apps/web-1/components/landing/LandingHero.tsx`
- `apps/web-1/app/dashboard/page.tsx`
- `apps/web-1/app/dashboard/_components/DashboardEmptyState.tsx`
- `apps/web-1/app/dashboard/team-fit/page.tsx`
- `apps/web-1/app/dashboard/intake/page.tsx`
- `apps/web-1/app/dashboard/intake/hooks/useIntakeForm.ts`
- `apps/web-1/app/dashboard/intake/_components/IntakeChatFlow.tsx`
- `apps/web-1/app/dashboard/intake/_components/Steps/DocumentInputStep.tsx`
- `apps/web-1/app/dashboard/intake/_types/intake.types.ts`
- `apps/web-1/app/dashboard/case/[id]/page.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/RevisionSubmitModal.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/BuyRoundModal.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/AuditRoundTimeline.tsx`
- `apps/web-1/hooks/usePackages.ts`
- `apps/web-1/proxy.ts`
- `apps/web-1/components/layout/DashboardShell.tsx`

### Code backend
- `apps/api/src/modules/packages/domain/package.types.ts`
- `apps/api/src/modules/packages/application/list-packages.usecase.ts`
- `apps/api/src/modules/cases/application/submit-revision.usecase.ts`
- `apps/api/src/modules/cases/application/recall-revision.usecase.ts`
- `apps/api/src/modules/cases/http/cases.controller.ts`
- `apps/api/src/modules/documents/domain/document-types.ts`
- `apps/api/src/modules/ai-engine/application/evaluate-team-fit.usecase.ts`
- `apps/api/src/modules/ai-engine/application/save-team-fit.usecase.ts`
- `apps/api/src/modules/ai-engine/http/ai-engine.routes.ts`

### DB & Seed
- `prisma/schema.prisma`
- `prisma/seeds/seed-packages.ts`
- `prisma/migrations/20260721000000_add_team_fit_reports/migration.sql`
- `prisma/migrations/20260722000000_add_audit_rounds/migration.sql`

### Reports đã tạo
- `plans/reports/investigation-domain-flow-nexus-20260722.md`
- `plans/reports/session-context-domain-flow-nexus-20260722.md` (file này)

