# Nexus Platform — RCA + Research + Design Brainstorm (2026-08-08)

**Mục đích:** Snapshot toàn bộ chuỗi phân tích 2026-08-08 để compact session, phục vụ bàn luận tiếp về thiết kế hệ thống. Gồm: (1) RCA backlog 18 bugs, (2) Verify debugger 2 điểm chặn, (3) Research hệ thống tham chiếu, (4) Brainstorm response-to-reviewers, (5) Kết luận thiết kế hệ thống.

---

## 1. RCA Toàn Bộ Backlog — Hội tụ 3 Root Bugs

### Root Bug A — State machine `user_facing_stage` thiếu gate nhất quán

**Bằng chứng:** `submitRevisionUseCase` (student) CÓ đủ gate (`submit-revision.usecase.ts:135-154`), còn `submitSupporterOutputUploadUseCase` **không có gate stage nào** (chỉ check auth, `submit-revision.usecase.ts:317-320`), `submitExternalFeedbackUploadUseCase` cũng thiếu. Supporter-request-more-info thì có.

**Hệ quả chuỗi (6 bug):**

| Bug | Cơ chế |
|-----|--------|
| **#18** CRITICAL | `need_more_information → revision_submitted` — map transition cho phép (`case.types.ts:60`) nhưng kẹt ở repo (chi tiết bên dưới) |
| **#2** (verified) | Supporter upload thiếu gate → chạm repo → P2002 → "Lỗi hệ thống" |
| **#4** | Cùng use case thiếu gate → upload lần 2 không bị chặn → hết credit |
| **#15** | Rework dùng form sai vì stage điều hướng sai → trống "YÊU CẦU HIỆN TẠI" |
| **#7** | Ẩn/hiện nút upload phụ thuộc status chuẩn — chưa có |
| **#17** | Guard stage thiếu ở cả FE + BE → update intake mọi trạng thái |

### Root Bug B — Intake/document validation + data consistency thiếu

| Bug | Cơ chế |
|-----|--------|
| **#13** | Không giới hạn số tài liệu (chỉ 15MB) |
| **#14** | Không giới hạn ký tự (FE + BE đều thiếu) |
| **#12** | Doc count admin (nhiều) vs user (1) lệch — versioning/view data layer |
| **#9** | Trả tiền xong mà intake trống → admin duyệt trống (flow không khóa) |

### Root Bug C — Quyết định sản phẩm chưa chốt (KHÔNG phải bug code)

| Bug | Quyết định |
|-----|-----------|
| **#1** | SLA reset khi reassign? User hủy ở stage nào? |
| **#3** | UX guidance "lần 2 = mua credit → chat → upload" |
| **#5** | Ai xác nhận hoàn thành: user hay supporter? |
| Bonus #15 | Gói free vs Premium khác gì? |

### Standalone
- **#16** — State sync: kick user khi case bị xóa (tận dụng #11 realtime đã Done)

---

## 2. Verify Debugger — 2 Điểm Chặn CONFIRMED + Lỗi Gốc Bug 18

### BP1: `requireCredits` chặn resubmit sau veto — CONFIRMED

```
veto → veto-case.usecase.ts:39-50 refund toàn bộ → balance_after=0
→ user sửa intake → submit-intake.usecase.ts:22 requireCredits (ngoài transaction, trước stage check)
→ balance 0 < 1 → 402 NO_CREDITS "Hết lượt kiểm tra. Vui lòng mua thêm credit."
→ KẸT VĨNH VIỄN
```

- `requireCredits` đặt **line 22 — trước** check `rejected→submitted` (line 91), không có bypass
- Route duy nhất `POST /:id/intake` (cases.routes.ts:46), không có endpoint khác
- FE vẫn hiện nút "Chỉnh sửa hồ sơ để nộp lại" (StatusGuidanceCard.tsx:207) → user bấm → 402
- **Nuance:** reject thường KHÔNG refund credit (rejectCase repo không đụng creditLedger) → resubmit sau reject thường vẫn chạy. Chỉ **veto** bị chết. Veto để `internal_status='cancelled'` + stage `rejected`.

### BP2: mỗi lần submit intake = INSERT v00 mới — CONFIRMED

- `lifecycleUnit.create` vô điều kiện (submit-intake.usecase.ts:51) — không findFirst/upsert; `upsertDocumentRecordsForUnit` tồn tại nhưng **không được dùng**
- `listAdminDocumentsUseCase` = `findMany()` **không WHERE** — admin thấy mọi document_record mọi case → spam
- User xem qua `assembleDocumentWorkspace` group theo `lifecycle_unit_id` → mỗi v00 là 1 unit riêng

### Lỗi gốc THẬT Bug 18 (kẹt luồng)

```
Supporter request-more-info → internal_status='waiting_user', stage='need_more_information'
→ user nộp bản sửa → submitCaseRevision (case.repository.ts:466-471) chỉ đổi user_facing_stage='revision_submitted'
→ internal_status VẪN 'waiting_user' ← KHÔNG đổi!
→ symflow có transition resume_work (waiting_user→supporter_working) nhưng KHÔNG ai tự gọi
→ case lẫn trong admin view, không phân chia/duyệt được → kẹt
```

### Bảng verdict tổng

| Claim | Verdict |
|-------|---------|
| BP1 requireCredits chặn sau veto | ✅ CONFIRMED |
| Reject thường không refund (khác veto) | ✅ CONFIRMED |
| BP2 insert v00 mới mỗi lần | ✅ CONFIRMED |
| Bug 12 admin nhiều/user 1 | ⚠️ PARTIAL — admin là findMany không filter; user thấy hết nhưng group theo unit |
| Bug 18 kẹt luồng | ✅ **GỐC: internal_status dính waiting_user** + submitCaseRevision không đổi |
| Veto để cancelled | ✅ CONFIRMED |

### 4 câu hỏi mở từ debugger
1. Admin UI có nút "Reject" riêng không hay chỉ "Veto"? (rejectCase repo tồn tại — ai gọi?)
2. `resubmitCaseUseCase` (POST /:id/resubmit) — đường bypass requireCredits? Chưa phân tích sâu.
3. Admin FE có default filter giấu `waiting_user` không?
4. User mua credit mới có qua được không — có, nhưng refund mất trắng = bug semantics.

### Root bug thực sự (tổng hợp)

`submitIntakeUseCase` vừa đóng vai trò create vừa update/resubmit nhưng:
- `requireCredits` đặt sai chỗ (chặn resubmit sau veto)
- insert v00 mới mỗi lần (spam data)
- không guard stage (update mọi trạng thái)

---

## 3. Research — Hệ Thống Tham Chiếu (5 searches, 2026-08-08)

> Full report: `docs/research/document-centric-audit-service-reference-2026-08-08.md`

### 3.1 Peer Review Submission Systems (gần nhất với business Nexus)

**Editorial Manager, ScholarOne (commercial), OJS (open-source, PKP)** — Editorial lifecycle 5 stage:
1. Submission + QC (validate format/completeness, technical check)
2. Editorial Assessment & Assignment (desk reject nếu không hợp scope)
3. Peer Review (auto invite, reminder, track status)
4. Decision & Revision (Accept / Reject / Request Revision)
5. Revision Rounds (mỗi round là sự kiện riêng, author nộp bản sửa kèm response-to-reviewers)

**Gap Nexus:** Response-to-reviewers chưa có — bản sửa không có tài liệu trả lời từng góp ý.

### 3.2 DMS Lifecycle (M-Files, DocuWare, SharePoint)

5 cột trụ: Workflow Engine, Versioning, Lifecycle Status, Check-in/Check-out, Approval + Audit trail.

**Nexus vi phạm chuẩn:** #17 (status governs modify rights), #12 (versioning), #13 (spam doc), #7 (UI theo status).

### 3.3 Escrow & Double-Entry Ledger (Upwork, Fiverr, TigerBeetle)

- Balance = tổng journal entries, **không lưu balance column**
- Atomic transactions, account types (wallet/escrow/platform/treasury)
- Refund = rules engine (auto/manual/dispute), store credit vs original payment
- Escrow funds = liabilities tới khi release
- API-first reversal — refund là first-class event

**Nexus hiện tại:** lưu `balance_after` column; reject = mất tiền không refund; veto refund rồi chặn resubmit; credit case-level.

### 3.4 PDF Annotation (Hypothesis, Kami, Perusall, redline tools)

- Hypothesis: comment gắn text span — khớp nhất
- Kami: PDF markup pen-and-paper
- Redline (Litera, Draftable): so sánh version
- **Gợi ý:** annotation lưu JSON riêng song song file PDF, export PDF có annotation, version diff

### 3.5 Startup Evaluation Platforms

Untap (competition mgmt, rubric scoring), PitchScore (investment-readiness framework), LivePlan (comment trực tiếp từng section), Upmetrics (AI-assisted planning), Qooper/ADPList (mentorship).

Rubric chuẩn: Problem-solution fit → Market validation → Execution/MVP → Team capability (Nexus đã có findings + completeness_score).

### 3.6 Đối chiếu tổng Nexus vs chuẩn ngành

| Thành phần | Chuẩn | Nexus | Gap |
|-----------|-------|-------|-----|
| Stage workflow engine | Enforced mọi use case | Có engine nhưng không enforced nhất quán | Fix Root Bug A |
| Document versioning | Immutable + current view | Insert v00 mới mỗi lần | Fix submitIntakeUseCase |
| Document lifecycle status | Draft→In Review→Approved→Obsolete | Chưa có document-level status | Thiết kế mới |
| Check-in/check-out | Lock khi edit | Chưa có | Thiết kế mới |
| Response-to-reviewers | Bắt buộc kèm bản sửa | Chưa có | Thiết kế mới |
| Annotation PDF | Text span + comment JSON | Supporter chỉ upload file đã chấm | Thiết kế mới |
| Double-entry ledger | Derive từ entries | Lưu balance_after + idempotency key | Cải tiến |
| Refund policy | Rules engine | Reject = mất tiền, veto = refund rồi chặn | Fix gấp |
| Escrow | Liabilities tới release | Trừ credit ngay khi upload | Cân nhắc |
| SLA | Deadline + reminder | Có deadline field, chưa enforcement | Cải tiến |

---

## 4. Brainstorm — Response-to-Reviewers

### Khái niệm (chuẩn peer-review)

Khi reviewer yêu cầu sửa, tác giả nộp bản sửa **kèm trả lời từng góp ý** (đã sửa gì, sửa ở đâu, hoặc vì sao không sửa). Reviewer vòng sau chỉ soi phần đã trả lời. Nexus có `ReportFinding` (report.types.ts:4: field/status/evidence/reason/question/next_action) nhưng chưa có vòng lặp trả lời — user nộp kèm `change_summary` text tự do.

### Vì sao core business

`project-context.md:38-42` — điểm đau số 1: "Sửa xong vẫn không chắc bản mới đã ổn hơn chưa." Response-to-reviewers biến "sửa mù" thành "sửa có đối chiếu" — làm nên vòng lặp giá trị (report → sửa → review vòng sau).

### Lợi (3 bên)

**User:** mỗi góp ý = 1 việc rõ ràng; thấy tiến bộ (xử lý 5/8); học trả lời feedback có cấu trúc (đạo đức, không làm bài hộ).

**Supporter:** review vòng sau giảm 50-70% công; bắt "sửa giả"; giữ chất lượng audit.

**Nexus:** khác biệt hóa với đối thủ (note.txt điểm 2); nguồn data đo lường KPI; nối gói giá mới (note.txt điểm 6).

### Hại / rủi ro

| Rủi ro | Mức | Giảm thiểu |
|--------|-----|-----------|
| User ngại viết, drop-off | Cao | Form tối giản: chọn trạng thái + ghi chú 1-2 câu |
| Supporter chậm hơn | Trung | Findings đã có — hiển thị thành checklist, không format mới |
| Over-engineering (comment-level diff) | Nguy hiểm | KHÔNG làm. Chuẩn peer-review dùng plain document |
| Sinh viên chưa quen khái niệm | Trung | UI hướng dẫn 1 màn hình |
| Vi phạm "không làm bài hộ" | Thấp | Supporter chỉ chấm đạt/không, user tự viết |

### Ba phương án

- **A — Tối thiểu (0 bảng, 1-2 ngày):** Bắt buộc text trả lời từng góp ý khi nộp bản sửa. Không đụng schema.
- **B — Checklist (1 bảng `review_responses`, 3-5 ngày):** Findings → checklist; user trả lời từng item; supporter chấm đạt/chưa → case tiếp tục khi đủ.
- **C — Version/assessment + điểm tiến bộ (2-3 bảng, 1-2 tuần):** B + tự tính điểm tiến bộ giữa vòng; nối note.txt điểm 3 + gói AI rẻ. ⚠️ YAGNI risk.

---

## 5. Kết Luận Thiết Kế (quan trọng — đã đổi hướng sau phản hồi user)

> **User phản hồi:** "peer-review giải quyết những vấn đề gì trong hệ thống hiện tại? Tôi yêu cầu tham khảo hệ thống có sẵn vì hệ thống hiện tại nhiều bug và sai logic do thiếu kinh nghiệm — KHÔNG yêu cầu thêm feature mới."

### Nhận định cốt lõi

Hệ thống **đã copy hình dáng peer-review** (stages, version, checkpoint, report) nhưng **copy thiếu xương sống: workflow engine enforced ở mọi use case**. Bugs hiện tại = lệch khỏi hình dạng chuẩn, không phải thiếu feature.

### Bản đồ bug ← lệch chuẩn ngành

| Bug | Reference làm gì khác | Gốc lệch |
|-----|------------------------|----------|
| #18 kẹt luồng | Editorial Manager: revision round = state machine riêng | Workflow engine không gọi ở submitRevision |
| #2, #4 supporter upload | ScholarOne/OJS: mọi transition qua workflow engine | Gate bỏ qua ở 1 use case |
| #9 trả tiền intake trống | OJS: Submission QC — validate đủ trước khi vào pipeline | Không QC gate giữa payment và review |
| #17 update mọi trạng thái | DMS: status governs modify rights | Thiếu rule "stage quyết định quyền sửa" |
| #7 nút upload sai stage | DMS lifecycle UI render theo status | Cùng gốc #17 |
| #12, #13 doc spam | DMS: version immutable + upsert | submitIntakeUseCase insert v00 mới |
| Veto chặn resubmit | Escrow: refund = event, không khóa case | Ledger không gắn state machine |
| Reject = mất tiền | Upwork: refund rules engine | Thiếu refund policy |

### Ảnh hưởng lượng hóa

- **6/14 bugs** từ 1 gốc: workflow engine không enforced (#2, #4, #5, #7, #17, #18)
- **3 bugs** từ versioning sai (#9, #12, #13)
- **2 bugs** từ credit policy thiếu (BP1 veto, reject mất tiền)
- Sửa theo đúng chuẩn (workflow engine + upsert + refund rule) → **giải quyết ~80% backlog, không cần thêm feature**

### Điều chỉnh trọng tâm (brutal honesty)

**Response-to-reviewers là feature phụ — KHÔNG phải thứ reference systems dạy quan trọng nhất.** Thứ thật sự cần học:

1. **Workflow engine như xương sống** — mọi use case đi qua 1 bộ transition rule (`case-workflow-engine.js` + `isValidStageTransition` đã có, **chỉ 2 use case dùng**, còn lại bỏ qua). Đây là lỗi logic, không phải thiếu tính năng.
2. **Round tracking tách khỏi version** — đang trộn "version tài liệu" với "vòng đánh giá" → #18, #4.
3. **Ledger + state machine nói chuyện nhau** — credit consume/refund gắn transition, không độc lập (gốc veto kẹt + reject mất tiền).

### Ưu tiên thật sự

1. Làm workflow engine thành chuẩn bắt buộc duy nhất cho mọi transition
2. Versioning upsert (fix submitIntakeUseCase)
3. Refund policy (reject = refund khi service chưa render)
4. Response-to-reviewers chỉ sau — khi business chứng minh cần (gói AI giá rẻ)

---

## 6. note.txt — Ghi Chú Tương Lai (đọc 2026-08-08)

1. **Bản quyền** → tách phụ thuộc khỏi FPT; dùng phương pháp uy tín ngoài syllabus làm core tiêu chuẩn đánh giá
2. Đã có bên khác làm đánh giá ý tưởng khởi nghiệp (cần khác biệt hóa)
3. Chuyển đánh giá chữ → **con số (điểm)** dễ đo lường; khách có thước đo idea ổn không + report tốt không
4. User **resubmit after rejected** (cần luồng — đã có skeleton nhưng kẹt veto)
5. **Team fit** cần tặng thêm đánh giá nhiều hơn
6. Gói mới: **50-80k AI tự đánh giá ngay**; **VIP 100-200k AI + supporter chuyên nghiệp chat + đánh giá**

### Liên hệ với thiết kế
- Điểm 3 + 6 → AI cần output cấu trúc (findings) → user trả lời cấu trúc → supporter chấm cấu trúc. Cả chuỗi đứng trên response-to-reviewers làm mạch dữ liệu — nhưng theo kết luận phần 5, ưu tiên workflow engine trước.
- Điểm 4 → cùng luồng resubmit đang kẹt (BP1).

---

## 7. Trạng thái backlog credit account-level

- `docs/backlog/credit-du-tru-account-level.md` — **vẫn Draft (08-06), CHƯA triển khai**
- Credit hiện tại case-level (`consume-v01-{caseId}`)
- `creditLedger` đã có idempotency_key + journal entries — nền double-entry đúng hướng, thiếu account-level scope + refund rules

---

## 8. Câu hỏi mở / Quyết định cần

1. Workflow engine: ai chịu trách nhiệm map toàn bộ use case vào transition rule?
2. Refund policy: reject thường = refund/store credit khi service chưa render?
3. Admin UI có nút Reject riêng không hay chỉ Veto? (ảnh hưởng refund policy)
4. Response-to-reviewers: phương án A hay B, làm khi nào?
5. Round tracking tách khỏi version: thiết kế thế nào (assessment round id)?
6. Credit account-level: khi nào nâng cấp từ case-level?
7. Gói 50-80k AI: cần response-to-reviewers làm mạch dữ liệu trước?
