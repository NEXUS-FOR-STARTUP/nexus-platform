# Copilot Review — PR #37 `feat/79k-dual-credit` (10 threads)

- **PR:** #37 `feat/79k-dual-credit` → `feat/pricing-package-tiers-ui` (OPEN, CLEAN, MERGEABLE)
- **Review:** @copilot-pull-request-reviewer, 2026-09-12T13:57:09Z, tại commit `cf4778d`
- **Đối chiếu HEAD:** `1c164dc` (local in-sync origin, 2026-09-15)
- **Kết quả:** 1/10 stale (false positive), 9/10 còn hiệu lực
- **Lưu ý stack:** #37 merge vào base `feat/pricing-package-tiers-ui` (nhánh của PR #33 draft).
  Base-draft KHÔNG phải điều kiện merge #37 — #33 → `dev` là nấc downstream riêng.

---

## Thread 1 — Race khi trừ credit (coordinator.ts:261)

- **Copilot nói:** check balance rồi insert debit không lock — 2 trigger đồng thời cùng đọc 1 balance, cùng trừ, số dư âm / double-dispatch.
- **HEAD:** đã đưa vào 1 `prisma.$transaction` (`omp-audit-coordinator.ts:308-346`) nhưng `getCreditBalanceForTx` vẫn là `SUM` không lock, không `SELECT FOR UPDATE` row case. Guard `AUDIT_IN_PROGRESS` (296-299) nằm ngoài tx nên cũng race.
- **Trạng thái:** CÒN ĐÚNG (giảm nhẹ, chưa hết). **Severity: cao.**
- **Hướng fix:** `SELECT ... FOR UPDATE` row `cases` cùng caseId TRƯỚC khi đọc balance (pattern finalizer đã dùng `tx.$queryRaw`). Lưu ý: `SUM` trên ledger là aggregate-only, `FOR UPDATE` phải đặt trên row case, không phải bảng ledger.
- **Liên quan:** `idempotencyKey = audit-trigger-${caseId}-${startedAt}` sinh `startedAt` mới mỗi lần → retry hợp lệ của cùng 1 trigger bị tính debit 2 lần. Retry phải reuse key của trigger gốc, chỉ user-trigger mới sinh key mới.

## Thread 2 — `resolvedLifecycleUnitId` không persist (coordinator.ts:334)

- **Copilot nói:** `initial`/`logic_check` resolve unit lúc assemble nhưng chỉ lưu `lifecycle_unit_id` gốc (thường null) vào `ai_jobs.input_json`; finalizer fallback "latest unit lúc finalize" → drift + lệch guard trùng.
- **HEAD:** vẫn chỉ lưu `lifecycleUnitId ?? null` (dòng 330-344). Unit resolve thực tế tính ở bước 9 (dòng 373) chỉ log (dòng 424), không write-back, không đưa vào queue payload (`dispatchOmpJob` chỉ có `submissionType`, không có unit id). Finalizer đọc lại latest unit khi null (finalizer.ts:75-82).
- **Trạng thái:** CÒN ĐÚNG. **Severity: trung bình-cao** (gắn nhầm report sang version mới upload chen giữa trigger→finalize).
- **Hướng fix:** sau assemble, persist resolved id về `aiJob.input_json` (update) trước khi dispatch; kèm unit id trong queue payload để finalize dùng đúng bản lúc trigger.

## Thread 3 — Guard "1 report / lifecycle_unit" ở fallback path (finalizer.ts:99)

- **Copilot nói:** guard chặn tạo nhiều report cho cùng `lifecycle_unit_id` → phá intent `logic_check` tạo report mới trên cùng unit với `initial`.
- **HEAD:** dòng 84-96 giữ nguyên — không có `lifecycleUnitId` → tìm latest unit → có report → return `completed` không tạo mới.
- **Trạng thái:** CÒN ĐÚNG. **Severity: cao (blocker chức năng).**
- **Hướng fix:** thu hẹp guard — chỉ chặn `initial` trùng (trả report cũ), `resubmit`/`logic_check` luôn cho qua tạo mới. Guard thay thế phải key theo trigger identity (`startedAt`/`jobId` trong `input_json`), KHÔNG key theo `submission_type` (kẻo BullMQ retry / completed event fire 2 lần → double-insert).

## Thread 4 — Check trùng trong transaction (finalizer.ts:201)

- **Copilot nói:** cùng gốc thread 3 — check `findFirst({lifecycle_unit_id})` trong tx làm cho >1 report/unit là không thể, mâu thuẫn versioning.
- **HEAD:** dòng 190-201 giữ nguyên (có lock case row là tốt, nhưng guard vẫn blanket theo unit).
- **Trạng thái:** CÒN ĐÚNG. **Severity: cao (cùng blocker với thread 3).**
- **Hướng fix:** cùng hướng thread 3 — guard chống double-finalize của CÙNG trigger (idempotency theo trigger identity), không chặn blanket theo unit.
- **Liên quan:** 2 report cùng `version_no` sẽ trùng tên Cloudinary `audit_report_vNN` → thêm reportId ngắn/timestamp vào filename khi cho phép nhiều report/unit.

## Thread 5 — Seed ghi `metadata_json`, code đọc `features` (create-order.usecase.ts:131) — STALE

- **Copilot nói:** seed thêm `credits_granted` dưới `metadata_json`, code đọc `pkg.features` → vẫn grant 1, mất tác dụng 79k=2.
- **Kiểm chứng:** premise sai ngay tại thời điểm review — `git show cf4778d:...seed-active-packages.ts` đã có `credits_granted: 2` trong `features` (dòng 78), code `cf4778d` đã đọc `pkg.features`. HEAD còn cứng hơn: đọc `features.credits_granted * qty` (137-139) + fallback `pkg_ai_audit → 2*qty` (140-142) + ghi ledger `metadata_json` (157).
- **Trạng thái:** STALE, false positive. Xóa khỏi blocker.

## Thread 6 — `submission_type: string | null` vs FE union strict (get-case-detail.usecase.ts:136)

- **Copilot nói:** API trả `null` khi thiếu, FE type union 3 giá trị → label lookup rớt / hiện thiếu.
- **HEAD:** dòng 125-127 vẫn trả `null`.
- **Trạng thái:** CÒN ĐÚNG. **Severity: thấp.** Fix 1 dòng: default `"initial"` + coerce unknown về `"initial"`.

## Thread 7+8+9 — Thiếu test cho `lifecycle_unit_id` + `version_no` (submit-revision.usecase.ts:171/180/191)

- **Copilot nói (3 threads trùng 1 issue):** resubmit flow phụ thuộc 2 field mới nhưng không có test assert chúng tồn tại/đúng.
- **HEAD:** `deprecate-revision.test.ts` bị gut (+0/-46), không có test mới.
- **Trạng thái:** CÒN ĐÚNG. **Severity: thấp** (test-only, không chặn merge trừ khi team giữ gate test).

## Thread 10 — Docstring sai route (reports.controller.ts:338)

- **Copilot nói:** docstring ghi `/api/reports/:reportId/pdf`, route thực + FE gọi là `/:reportId/download`.
- **HEAD:** dòng 338 vẫn ghi sai.
- **Trạng thái:** CÒN ĐÚNG. **Severity: trivial.** Sửa docstring 1 dòng.

---

## Phát hiện thêm (ngoài Copilot)

- **A. Cancel-refund mâu thuẫn:** docstring trigger (coordinator 266-268) ghi user-cancel không refund, nhưng `cancelOmpAuditForCase` (dòng 440) gọi refund với reason `"cancelled-by-user"`. Cần chốt 1 hướng. Đề xuất: hủy khi còn queued (chưa chạy) → hoàn; hủy khi đã chạy → không hoàn (đã tốn chi phí worker). Ghi rõ cho user.
- **B. Frontend chưa debounce double-trigger:** nếu giữ lock ở thread 1 thì BE đã an toàn; nhưng vẫn nên disable nút ngay sau bấm đầu để UX rõ ràng.
- **C. Không có required CI:** `statusCheckRollup: []`, `reviewDecision: ""` — GitHub cho merge mù. Tự giữ gate thủ công.

---

## Thứ tự xử lý đề xuất

1. Thread 3+4 (guard finalizer theo trigger identity + filename chống trùng Cloudinary) — blocker chức năng.
2. Thread 1 (lock case row + reuse idempotency key khi retry) — blocker tiền.
3. Thread 2 (persist resolved unit id) — đúng dữ liệu version.
4. Phụ lục A (chốt policy cancel-refund) — tránh tranh chấp với khách.
5. Thread 6, 10 (1 dòng mỗi cái) + thread 7/8/9 (test) — gọn trong cùng lượt.
