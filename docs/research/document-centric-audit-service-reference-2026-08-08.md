# Research Report: Document-Centric Audit Services — Thiết kế tham chiếu cho Nexus Platform

**Ngày:** 2026-08-08 | **Nguồn:** 5 web searches (peer review systems, DMS, escrow/ledger, PDF annotation, startup evaluation platforms)

## Executive Summary

Business Nexus = dịch vụ đánh giá tài liệu startup của sinh viên: user tải PDF/DOCX → cộng tác viên đọc, đánh giá, ghi chú vào PDF → gửi lại. Toàn bộ hoạt động xoay quanh **tài liệu, version, trạng thái tài liệu, trạng thái case**. Research cho thấy mô hình này gần nhất với **hệ thống peer-review học thuật (Editorial Manager/ScholarOne/OJS)** kết hợp **DMS lifecycle (M-Files/DocuWare)** và **escrow wallet (Upwork/Fiverr)**.

**Kết luận quan trọng:** Nexus Platform hiện tại đã bắt đúng kiến trúc cốt lõi (case + lifecycle units + version) nhưng thiếu 3 mảnh ghép mà mọi hệ thống tham chiếu đều có: (1) **stage-based workflow engine enforced ở mọi use case**, (2) **double-entry ledger thay cho balance column**, (3) **revision round tracking chuẩn** (round ≠ version).

---

## 1. Peer Review Submission Systems — Mô hình gần nhất với business Nexus

**Editorial Manager, ScholarOne (commercial), OJS (open-source, PKP)** — chuẩn vàng cho luồng "user nộp tài liệu → chuyên gia đánh giá → sửa lại → duyệt".

### Editorial lifecycle chuẩn (5 stage)
1. **Submission + QC** — author upload file + metadata; system validate format/completeness; editorial office check kỹ thuật (plagiarism, formatting)
2. **Editorial Assessment & Assignment** — assign editor/reviewer; **desk reject** nếu không hợp scope
3. **Peer Review** — hệ thống tự động invite, reminder, track status ("Under Review", "Required Reviews Completed")
4. **Decision & Revision** — Accept / Reject / Request Revision
5. **Revision Rounds** — mỗi round là một sự kiện riêng, author nộp bản sửa **kèm response-to-reviewers document**; lặp tới khi Accept/Reject

### Điểm học được cho Nexus
| Khái niệm Nexus | Chuẩn peer-review | Ghi chú |
|-----------------|-------------------|---------|
| Case stage | Editorial lifecycle | Đã có `user_facing_stage` — khớp |
| Version (v01, v02...) | Revision round | Đã có — nhưng cần tách round vs version |
| Supporter | Reviewer | Đã có — cần SLA, reassign |
| Yêu cầu bổ sung | Request Revision | Đã có `need_more_information` — đúng chuẩn |
| Reject/Veto | Desk reject / Reject | Đã có — nhưng thiếu refund policy chuẩn |
| **Response-to-reviewers** | **Bắt buộc** | **Nexus THIẾU** — bản sửa không có tài liệu trả lời từng góp ý |

**Khoảng trống chính:** peer-review yêu cầu author trả lời từng điểm reviewer (response-to-reviewers). Nexus chưa có — đây chính là thứ làm "bản sửa lần 2" của sinh viên chất lượng kém vì không biết đã giải quyết góp ý nào chưa.

---

## 2. Document Management Systems (DMS) — Versioning & Lifecycle

**M-Files, DocuWare, SharePoint** — mọi DMS chuẩn có 5 thành phần cốt lõi:

1. **Workflow Engine** — route document theo business rule (vd: Invoice > $10k → route CFO); notification + deadline tracking để enforce SLA
2. **Versioning** — mọi thay đổi thành bản mới, giữ lịch sử đầy đủ, **người dùng luôn thấy version hiện hành**
3. **Lifecycle Status** — Draft / In Review / Approved / Effective / Obsolete — **status quyết định ai được sửa**
4. **Check-in/Check-out** — lock tài liệu khi đang edit, chống conflict
5. **Approval + Audit trail** — chữ ký, lịch sử, tuân thủ (21 CFR Part 11, ISO)

### Best practices áp dụng được
- **Metadata-first** (M-Files): tìm theo *tài liệu là gì*, không theo *nó ở đâu* → Nexus nên có document type + flow + unit_scope (đã có trong code!)
- **Map process trước khi automate** — đừng số hóa luồng hỏng
- **RBAC theo stage** — chỉ authorized user được xem/sửa ở stage tương ứng
- **Status governs modify rights** — đúng gốc Bug 17 (update intake mọi trạng thái) — DMS chuẩn chặn edit ở stage Approved/Submitted

### Đối chiếu lỗi Nexus đang gặp
| Bug Nexus | Chuẩn DMS | Đúng chuẩn? |
|-----------|-----------|-------------|
| #17 update intake mọi status | Status governs modify rights | ❌ Vi phạm |
| #12 doc count lệch admin/user | Versioning + visibility | ❌ Vi phạm |
| #13 spam doc | Check-in/check-out + giới hạn | ❌ Vi phạm |
| #7 nút upload hiện sai stage | Lifecycle status quyết định UI | ❌ Vi phạm |

---

## 3. Escrow & Ledger — Credit/Wallet cho dịch vụ audit

**Bài học từ Upwork/Fiverr, TigerBeetle, Modern Treasury:**

### Double-entry ledger (không dùng balance column)
- Balance = tổng journal entries, **không lưu balance cột** — tránh drift
- **Atomic transactions** — debit/credit phải cùng thành/bại
- Account types: User wallet / Escrow / Platform revenue / Treasury
- API-first **reversal** — refund là first-class event, không phải exception

### Escrow lifecycle chuẩn
```
Initiation (Pending) → Funding (Escrow) → Fulfillment/Lock → Release/Refund
```
- Escrow funds = **liabilities, không phải revenue**, tới khi release
- Automated release policy (7-21 ngày) nếu không dispute
- Refund logic = rules engine: milestone chưa start → auto refund; dispute → freeze + agent
- **Store credit vs original payment** — định nghĩa rõ khi nào refund về đâu

### Đối chiếu credit hiện tại của Nexus (NGUY HIỂM)
| Điểm | Nexus hiện tại | Chuẩn tham chiếu |
|------|---------------|------------------|
| `balance_after` column | creditLedger **lưu balance_after** | Không lưu balance — derive từ entries |
| Reject thường | **Không refund** — user mất tiền | Refund hoặc store credit nếu service chưa render |
| Veto | Refund toàn bộ → balance_after=0 | Đúng ý nhưng chặn resubmit (Bug BP1) |
| Credit scope | Case-level (`consume-v01-{caseId}`) | Account-level wallet + escrow |
| Refund policy | Không có rules engine | Auto/manual/dispute phân nhánh rõ |
| Dispute | Không có | Freeze funds + agent intervention |

**Kết luận:** `balance_after=0` không tự thân nguy hiểm, **nguy hiểm là thiếu policy rõ** — user bị reject thường mất tiền không refund, bị veto refund rồi lại bị chặn không resubmit được. Cần refund policy tường minh: service chưa render → refund/store credit; đã render → không refund (hoặc dispute).

---

## 4. PDF Annotation Review — Cách cộng tác viên chấm vào PDF

| Tool | Điểm mạnh | Khớp business Nexus? |
|------|-----------|---------------------|
| **Hypothesis** (open-source) | Social annotation, comment gắn đoạn văn cụ thể, tích hợp LMS | ✅ Khớp nhất — comment gắn text span trong PDF |
| **Kami** | Precision PDF markup — text box, highlight, strikethrough, pen | ✅ Khớp — đúng cảm giác "chấm bài" |
| **Perusall** | Social learning + AI engagement grading | ⚠️ Phù hợp lớp học lớn, ít khớp |
| **Redline tools** (Litera Compare, Draftable) | So sánh version, show added/deleted | ✅ Cho supporter so bản cũ vs mới |
| **Google Docs / Word Track Changes** | Chuẩn vàng cho redline văn bản | ⚠️ Chỉ nếu user upload docx |

### Gợi ý kiến trúc cho Nexus
- Supporter ghi chú **gắn vào đoạn văn** (text span + comment) — không chỉ ghi toàn bộ vào PDF
- Lưu annotation riêng (JSON) song song file PDF — **không flatten vào file gốc** → dễ diff version
- Export bản PDF có annotation khi gửi lại user
- Version diff: highlight thay đổi giữa v01 → v02 cho supporter xem nhanh

---

## 5. Startup Evaluation Platforms — Đối thủ/mô hình business tương tự

| Platform | Mô hình | Điểm học |
|----------|---------|----------|
| **Untap** | Startup competition management — branded portal, pitch deck submission, multi-round judging, rubric scoring, mentor management | Mô hình gần nhất về vận hành (round, rubric, mentor assign) |
| **PitchScore** | Standardized "investment-readiness" framework, so sánh startup nhất quán | Rubric chuẩn hóa — Nexus có sẵn (completeness_score, findings) |
| **LivePlan** | Instructor comment **trực tiếp vào từng section** của business plan, theo dõi progress real-time | Comment theo section — khớp document_workspace |
| **Upmetrics** | AI-assisted business planning, template-guided | Template-guided intake cho sinh viên |
| **Qooper / ADPList** | Mentorship matching + booking + ROI tracking | Nếu mở rộng sang mentoring session |

### Rubric chuẩn startup (best practice chung)
Problem-solution fit → Market validation → Execution/MVP → Team capability
→ Nexus đã có (findings, completeness_score) — đúng hướng

---

## 6. Đối chiếu tổng — Nexus Platform vs chuẩn ngành

| Thành phần | Chuẩn ngành | Nexus hiện tại | Gap |
|-----------|-------------|---------------|-----|
| Stage workflow engine | Enforced mọi use case | ✅ Có workflow engine + stage list, ⚠️ nhưng không enforced nhất quán (submitSupporterOutputUpload thiếu gate) | **Fix Root Bug A** |
| Document versioning | Immutable versions + current view | ⚠️ Có lifecycle unit nhưng insert v00 mới mỗi lần, không upsert | **Fix submitIntakeUseCase** |
| Document status lifecycle | Draft→In Review→Approved→Obsolete | ❌ Chưa có document-level status riêng | Thiết kế mới |
| Check-in/check-out | Lock khi edit | ❌ Chưa có | Thiết kế mới |
| Response-to-reviewers | Bắt buộc kèm bản sửa | ❌ Chưa có | **Thiết kế mới — ưu tiên cao** |
| Annotation trên PDF | Text span + comment JSON | ❌ Hiện chỉ supporter upload file đã chấm | Thiết kế mới |
| Double-entry ledger | Derive balance từ entries | ⚠️ Lưu balance_after + idempotency key (đúng hướng) | Cải tiến |
| Refund policy | Rules engine rõ ràng | ❌ Reject = mất tiền, veto = refund rồi chặn | **Fix gấp + backlog account-level credit** |
| Escrow | Funds = liabilities tới khi release | ❌ Trừ credit ngay khi upload | Cân nhắc |
| SLA enforcement | Deadline tracking + reminder | ⚠️ Có deadline field, chưa thấy enforcement | Cải tiến |

---

## 7. Khuyến nghị triển khai (ưu tiên)

### Tức thì (fix bugs — không cần thiết kế mới)
1. **Refund policy rõ**: reject thường = refund/store credit nếu service chưa render; veto = refund + cho resubmit (bỏ `requireCredits` cho resubmit path)
2. **Fix `submitIntakeUseCase`**: upsert lifecycle unit thay vì insert v00 mới; guard stage theo BR
3. **Enforce workflow engine ở mọi use case** (supporter output, external feedback, intake)

### Ngắn hạn (thiết kế theo chuẩn ngành)
4. **Response-to-reviewers**: khi user nộp bản sửa v02, bắt buộc kèm tài liệu trả lời từng góp ý của supporter (chuẩn peer-review)
5. **Document status**: thêm document-level lifecycle status, hiển thị "đang chấm / đã chấm / chờ sửa"

### Trung hạn (backlog account-level credit)
6. **`docs/backlog/credit-du-tru-account-level.md`** (đang Draft, chưa triển khai) — chuyển sang account-level wallet + double-entry ledger chuẩn, refund rules engine, SePay auto top-up
7. **Annotation system**: comment gắn text span, export PDF có annotation, version diff

---

## Resources & References

- Peer review: Editorial Manager (Aries/Elsevier), ScholarOne (Silverchair), OJS (PKP — open-source)
- DMS: M-Files (metadata-first), DocuWare (workflow automation), SharePoint
- Escrow/ledger: TigerBeetle, Modern Treasury, Upwork/Fiverr escrow docs
- Annotation: Hypothesis (open-source), Kami, Perusall, Draftable/Litera Compare (redline)
- Startup evaluation: Untap, PitchScore, LivePlan, Upmetrics, Qooper, ADPList

## Unresolved Questions
- [?] Credit có hết hạn không? (backlog Q mở — chưa chốt)
- [?] Supporter chấm PDF: annotation gắn text span hay chỉ upload file chấm sẵn? (ảnh hưởng kiến trúc lớn)
- [?] Response-to-reviewers: cần thiết cho MVP hay phase sau?
- [?] Dispute process: user khiếu nại kết quả audit — có cần MVP không?
