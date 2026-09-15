# Copilot Review — PR #37 `feat/79k-dual-credit` (10 threads)

- **PR:** #37 `feat/79k-dual-credit` → `feat/pricing-package-tiers-ui` (OPEN, CLEAN, MERGEABLE)
- **Review:** @copilot-pull-request-reviewer, 2026-09-12T13:57:09Z, tại commit `cf4778d`
- **Đối chiếu HEAD:** `1c164dc` (local in-sync origin, 2026-09-15)
- **Kết quả:** 1/10 stale (false positive), 9/10 còn hiệu lực
- **Status sau commit `545bdcb` (2026-09-15):** T1 FIXED (FOR UPDATE + in-tx guard + free retry P2002 + key reuse gate); T2 FIXED (persist resolved unit + payload lifecycleUnitId + case-ownership validation); T3+4 FIXED (2-layer dedupe: trigger identity + per-type initial invariant + filename timestamped); T6 FIXED FE-only; T10 FIXED (docstring). Còn mở: 7/8/9 (test), A (cancel-refund policy), B (FE debounce), C (required CI).
- **Lưu ý stack:** #37 merge vào base `feat/pricing-package-tiers-ui` (nhánh của PR #33 draft).
  Base-draft KHÔNG phải điều kiện merge #37 — #33 → `dev` là nấc downstream riêng.

---

## Thread 1 — Race khi trừ credit (coordinator.ts:261) — ✅ FIXED (`545bdcb`)

- **Copilot nói:** check balance rồi insert debit không lock — 2 trigger đồng thời cùng đọc 1 balance, cùng trừ, số dư âm / double-dispatch.
- **Fix:** `SELECT ... FOR UPDATE` cases đầu tx + guard `queued/processing` trong tx (source of truth, fast-path ngoài tx giữ làm early-exit). P2002 → `skipCharge = true` (free retry, không throw 409). Key reuse gate: identical `submission_type` + `lifecycle_unit_id` only — mint mới nếu intent khác.
- **Trạng thái:** FIXED. **Severity: cao.**

## Thread 2 — `resolvedLifecycleUnitId` không persist (coordinator.ts:334) — ✅ FIXED (`545bdcb`)

- **Copilot nói:** `initial`/`logic_check` resolve unit lúc assemble nhưng chỉ lưu `lifecycle_unit_id` gốc (thường null) vào `ai_jobs.input_json`; finalizer fallback "latest unit lúc finalize" → drift + lệch guard trùng.
- **Fix:** persist `resolvedLifecycleUnitId` vào `aiJob.input_json` trước dispatch (id-targeted update, không `updateMany` blanket). `lifecycleUnitId` thêm vào `OmpJobPayload` + worker mirror. Finalizer ưu tiên `job.data.lifecycleUnitId` (validate `unit.case_id === caseId`) → `input_json` → `latestUnit` fallback (filter `unit_type='version'`).
- **Trạng thái:** FIXED. **Severity: trung bình-cao.**

## Thread 3 — Guard "1 report / lifecycle_unit" ở fallback path (finalizer.ts:99) — ✅ FIXED (`545bdcb`)

- **Copilot nói:** guard chặn tạo nhiều report cho cùng `lifecycle_unit_id` → phá intent `logic_check` tạo report mới trên cùng unit với `initial`.
- **Fix:** 2-layer dedupe trong tx: (1) **Global** `lifecycle_unit_id` + `metadata_json.triggerStartedAt` → return existing nếu BullMQ fire `completed×2` (bất kể type), (2) **Per-type** `lifecycle_unit_id` + `metadata_json.submission_type = 'initial'` → mỗi unit chỉ 1 initial report. Finalizer fallback: ưu tiên `job.data.lifecycleUnitId` (case-ownership validated) → `input_json` → `latestUnit` (filter `unit_type='version'`). Filename `_startedAtMs` chống trùng Cloudinary.
- **Trạng thái:** FIXED. **Severity: cao (blocker chức năng).**

## Thread 4 — Check trùng trong transaction (finalizer.ts:201) — ✅ FIXED (`545bdcb`)

- **Copilot nói:** cùng gốc thread 3 — check `findFirst({lifecycle_unit_id})` trong tx làm cho >1 report/unit là không thể, mâu thuẫn versioning.
- **Fix:** cùng pass với thread 3 — guard now key theo trigger identity (`metadata_json.triggerStartedAt`), không blanket theo unit. `SELECT FOR UPDATE cases` giữ nguyên.
- **Trạng thái:** FIXED. **Severity: cao (cùng blocker với thread 3).**

## Thread 5 — Seed ghi `metadata_json`, code đọc `features` (create-order.usecase.ts:131) — STALE

- **Copilot nói:** seed thêm `credits_granted` dưới `metadata_json`, code đọc `pkg.features` → vẫn grant 1, mất tác dụng 79k=2.
- **Kiểm chứng:** premise sai ngay tại thời điểm review — `git show cf4778d:...seed-active-packages.ts` đã có `credits_granted: 2` trong `features` (dòng 78), code `cf4778d` đã đọc `pkg.features`. HEAD còn cứng hơn: đọc `features.credits_granted * qty` (137-139) + fallback `pkg_ai_audit → 2*qty` (140-142) + ghi ledger `metadata_json` (157).
- **Trạng thái:** STALE, false positive. Xóa khỏi blocker.

## Thread 6 — `submission_type: string | null` vs FE union strict (get-case-detail.usecase.ts:136) — ✅ FIXED (`a0ba854`, FE-only)

- **Copilot nói:** API trả `null` khi thiếu, FE type union 3 giá trị → label lookup rớt / hiện thiếu.
- **Fix:** KHÔNG coerce ở BE (giữ null truthful cho legacy reports) — `RoundCard.tsx:58-60` mirror fallback `report-rows.ts:20` (`|| "initial"`, label fallback `"Báo cáo"`), `types/case.ts:124` widen union `| null`.
- **Trạng thái:** FIXED. **Severity: thấp.**

## Thread 7+8+9 — Thiếu test cho `lifecycle_unit_id` + `version_no` (submit-revision.usecase.ts:171/180/191)

- **Copilot nói (3 threads trùng 1 issue):** resubmit flow phụ thuộc 2 field mới nhưng không có test assert chúng tồn tại/đúng.
- **HEAD:** `deprecate-revision.test.ts` bị gut (+0/-46), không có test mới.
- **Trạng thái:** CÒN ĐÚNG. **Severity: thấp** (test-only, không chặn merge trừ khi team giữ gate test).

## Thread 10 — Docstring sai route (reports.controller.ts:338) — ✅ FIXED (`a0ba854`)

- **Copilot nói:** docstring ghi `/api/reports/:reportId/pdf`, route thực + FE gọi là `/:reportId/download`.
- **Fix:** docstring → `:reportId/download` (khớp `reports.routes.ts:17`). 1 dòng.
- **Trạng thái:** FIXED. **Severity: trivial.**

---

## Phát hiện thêm (ngoài Copilot)

- **A. Cancel-refund mâu thuẫn:** docstring trigger (coordinator 266-268) ghi user-cancel không refund, nhưng `cancelOmpAuditForCase` (dòng 440) gọi refund với reason `"cancelled-by-user"`. Cần chốt 1 hướng. Đề xuất: hủy khi còn queued (chưa chạy) → hoàn; hủy khi đã chạy → không hoàn (đã tốn chi phí worker). Ghi rõ cho user.
- **B. Frontend chưa debounce double-trigger:** nếu giữ lock ở thread 1 thì BE đã an toàn; nhưng vẫn nên disable nút ngay sau bấm đầu để UX rõ ràng.
- **C. Không có required CI:** `statusCheckRollup: []`, `reviewDecision: ""` — GitHub cho merge mù. Tự giữ gate thủ công.

---

## Thứ tự xử lý (đã thực hiện)

1. ~~Thread 3+4~~ ✅ `545bdcb` — guard finalizer theo trigger identity + filename chống trùng Cloudinary.
2. ~~Thread 1~~ ✅ `545bdcb` — FOR UPDATE + in-tx guard + free retry + key reuse gate.
3. ~~Thread 2~~ ✅ `545bdcb` — persist resolved unit + payload lifecycleUnitId + case-ownership validation.
4. ~~Thread 6, 10~~ ✅ `a0ba854` — FE null fallback + docstring route.
5. ~~Q1-Q6~~ ✅ `a0ba854` — legacy 39k cutover.
6. Phụ lục A (chốt policy cancel-refund) — còn mở, tránh tranh chấp với khách.
7. Thread 7/8/9 (test) + B (FE debounce) + C (required CI) — còn mở.
