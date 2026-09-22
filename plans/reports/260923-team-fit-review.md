# Review cuối — Team-fit bản đơn giản (plan 260923-0100)

> Reviewer: TeamFitReviewer — chỉ đọc, **không sửa code**. Ngày 2026-09-23.
> Phạm vi: 16 file đổi + 2 file mới của 3 phase; 8 chỗ đọc dữ liệu team-fit cũ; xác nhận `CaseOverviewTab.tsx` đã xoá.

## Verdict: CHƯA SHIP

1 blocker phải xác minh trước khi ship (B1) + 5 major, trong đó M1–M2 đúng là các ô còn tick trống của plan §6. Không cần thiết kế lại; sửa 1 vòng ngắn là xong.

## 1. Bằng chứng đã chạy (không sửa file nào)

- `tsc --noEmit`: `packages/validation` **exit 0**, `apps/api` **exit 0**, `apps/web-1` **exit 0** (TS 5.9.2).
- `tsx --test team-fit-save.test.ts team-fit-rate-limit.test.ts` → **15/15 pass, 0 fail**, exit 0 (8 subtest save + 5 subtest rate-limit + 2 suite; 363ms).
- `eslint` 8 file web-1 đã đổi → exit 0, 0 warning.
- `prettier --check` fail ở cả file KHÔNG đổi (`page.tsx`, `useTeamFitMutation.ts`, `team-fit.dto.ts`) → baseline repo chưa theo prettier, không tính là lỗi của phase.
- Kiểm chứng schema độc lập (script chạy ngoài repo): 11 preset/54 member + NEXUS_PRESET đều pass `TeamFitInputSchema`; union nhận v2 và legacy, loại `{}`; v2 thiếu 1 khoá `trackCoverage` bị loại; `isTeamFitFreeReportV2(null)` ném TypeError.
- KHÔNG chạy prisma CLI, không đụng DB, không gọi API AI thật (ngoài quyền ticket).

## 2. Blocker

**B1 — Cap 2048 token dùng chung với token suy nghĩ của Gemini 3 → Phần B có thể trống ở mọi lượt mà vẫn trả 200.** `apps/api/src/modules/ai-engine/application/evaluate-team-fit.usecase.ts:22` (`AI_MAX_OUTPUT_TOKENS = 2048`, áp tại `:153`); provider chỉ gửi `thinkingConfig` khi được truyền (`node_modules/@ai-sdk/google/dist/index.js:1105`) nên Gemini 3 dùng mức suy nghĩ mặc định, mà `max_output_tokens` tính gộp token suy nghĩ + token trả lời (docs Google); `.env:28` và `.env.prod:27` đều là `gemini-3.1-flash-lite`; schema cho phép output tới ~13k ký tự tiếng Việt (`packages/validation/src/index.ts:98-121`). Tràn → `generateObject` ném → `catch` trả `ai: null` (`usecase.ts:167-179`) → người dùng thấy "AI chưa đưa ra nhận định" ở MỌI lượt, không test/cảnh báo nào bắt được. Trạng thái: **chưa sửa**. Cần: 1 lượt gọi thật (phase-02 còn để trống mục "Chạy thật 1 lần…" và ô "Báo cáo đủ 3 phần"; plan §6 tick trống hết) + nâng cap (≥4096) hoặc `providerOptions.google.thinkingConfig.thinkingLevel: 'low'`.

## 3. Major

- **M1 — Không có test cho `computeMachineStats`** (phase-02 mục Test và plan §6 yêu cầu rõ "máy đếm đúng: ngành/mảng/kinh nghiệm/ô trống"). Grep toàn repo: chỉ có định nghĩa `evaluate-team-fit.usecase.ts:107` + call site `:190`, không test nào. Bản throwaway đã bị xoá. Trạng thái: **chưa sửa**.
- **M2 — Không test nào chạy qua schema route cho dạng lưu.** `apps/api/src/shared/infrastructure/tests/team-fit-save.test.ts:234-256` gọi thẳng usecase với `legacyResult`, bỏ qua `TeamFitSavedResultSchema` (`http/ai-engine.routes.ts:29`), nên không chứng minh được union nhận legacy — và `assert.deepStrictEqual(storedResult, legacyResult)` chỉ là mock-echo (không kiểm hành vi thật). Trạng thái: **chưa sửa**.
- **M3 — `machineStats` (và cả `verdict`/`areas`) do client gửi được lưu nguyên si.** `http/ai-engine.routes.ts:121` → `save-team-fit.usecase.ts:114`. Số "máy đếm, không bịa được" khi lên case overview (`CaseOverviewPanel.tsx:163`) thực chất lấy từ payload client, nên client sửa được `distinctMajors: 99`. Với 2 mảng cũ thì đã tồn tại từ trước, nhưng phase này mở rộng sang số liệu/kết luận. Trạng thái: **chưa sửa** (gợi ý: tính lại `computeMachineStats` trong save — đã có sẵn `idea`+`team`).
- **M4 — Cutover dở sau khi xoá `CaseOverviewTab`.** `apps/web-1/app/dashboard/case/[id]/_components/overview/caseOverviewModel.ts:150-214` (`buildCaseOverviewModel`, `CaseOverviewModel`, `hasFreeAnalysis:207`, `mapFreeMembers`, `mapCaseMembers`, `compactFields`…) không còn ai gọi (grep toàn repo: 1 kết quả = định nghĩa), nhưng phase-02 lại thêm 65 dòng vào chính chỗ chết này. Trạng thái: **chưa sửa**.
- **M5 — Doc mất nội dung ngoài phạm vi.** `docs/flows/team-fit-flow.md:48` còn trơ heading `## Luồng ngoại lệ` (có 1 dấu cách thừa) với 0 nội dung: 3 bullet ngoại lệ và cả mục "Thiếu / chưa rõ" đã bị xoá (không liên quan phase này). Trạng thái: **chưa sửa**.
- **M6 — 3 file vượt 200 dòng do chính phase này (rule file <200 dòng).** `TeamFitResultStep.tsx` 169→**374**, `caseOverviewModel.ts` 154→**214**, `evaluate-team-fit.usecase.ts` 130→**236**. (`CaseOverviewPanel.tsx` 229 dòng nhưng 239→229 nên không tính.) Trạng thái: **chưa sửa**.

## 4. Nit

- **N1** `team-fit-rate-limit.ts:8-10,23-25`: map theo process → nhiều replica là N×10 lượt; `MAX_ENTRIES_BEFORE_SWEEP = 1000` lặp y nguyên `message-send-rate-limit.ts:2`. Trạng thái: chưa sửa (đúng như mẫu có sẵn, có ghi chú ponytail).
- **N2** `http/ai-engine.routes.ts:42` kiểm lượt TRƯỚC khi parse body (`:44`): payload sai vẫn mất 1 lượt. Trạng thái: chưa sửa. (Đúng yêu cầu "chặn trước khi gọi AI" — `:42` trước `:56`; `/team-fit/save` không tính lượt — đúng.)
- **N3** Hằng số magic trong UI: `TeamFitResultStep.tsx:122` `"mức tối thiểu: 2"`, `:129` `{coveredTracks}/3` (nên dùng `ROLE_TRACK_CODES.length`); `:43` fallback `79000` (có từ trước). Trạng thái: chưa sửa.
- **N4** `EMPTY_ROLE_TRACK = '' as RoleTrackCode` — cast che kiểu, chỉ an toàn nhờ validate ở `page.tsx:112`: `TeamMemberCard.tsx:24`, `TeamInputStep.tsx:11`. Trạng thái: chưa sửa.
- **N5** `packages/validation/src/index.ts:176` `isTeamFitFreeReportV2` chỉ là `"version" in result` → ném TypeError nếu đầu vào không phải object (hiện chưa có caller nào truyền unknown, nên chưa nổ). Trạng thái: chưa sửa.
- **N6** `TeamFitResultStep.tsx:287-317` nhánh legacy không thể chạm tới: prop `result` chỉ đến từ response analyze (luôn v2, `page.tsx:248`). `caseOverviewModel.ts:129-131` safeParse fail thì lặng im bỏ `verdict`/`areas` (có thể xảy ra nếu `trackCoverage` thiếu khoá — `packages/validation/src/index.ts:134` là record enum đòi đủ 3 khoá, đã kiểm chứng), không log. Trạng thái: chưa sửa.
- **N7** `computeMachineStats` nhánh thiếu `roleTrack` (`usecase.ts:126-128`) không thể chạm tới sau `safeParse` (`:184`) — nhánh chết nhưng vô hại. Trạng thái: chưa sửa.
- **N8** `OverviewMembersSection.tsx:42` không hiện "mảng nghề" mới, trong khi model chết `caseOverviewModel.ts:98` có hiện. Trạng thái: chưa sửa.
- **N9** Không có metric/alert cho tỷ lệ AI fail (chỉ `logger.error`), nên sự cố hệ thống trông giống "AI không có ý kiến". `plan.md` §6 còn tick trống hết dù §4 ghi 3 phase "Xong". Trạng thái: chưa sửa.

## 5. Đã sửa trong phase (ghi nhận tốt, cần giữ)

- Bỏ mục "Kết quả đánh giá sơ bộ" khỏi `team_fit_report.md`, còn 2 mục đúng như plan: `omp-audit-coordinator.ts:259-273`.
- Xoá `CaseOverviewTab.tsx`: không còn import nào trỏ tới (chỉ còn bản copy trong `.next/standalone` — artifact build) ✔
- Dọn lỗi sẵn có trong usecase: bỏ `SYSTEM_PROMPT` chết, gộp nhánh `AI_APICallError`, thêm ngoặc cho "not found / not supported" (`usecase.ts:218-223`), thêm timeout 30s (`:154`).
- Phần A/B/C đủ, C luôn hiện kể cả `ai: null` (`TeamFitResultStep.tsx:259-282`); dữ liệu cũ thiếu `roleTrack` hiện "Chưa xác định" (`caseOverviewModel.ts:98`); case cũ (result v1) vẫn ra 2 danh sách (`OverviewGapsSection.tsx:61-95`).
- 8 chỗ đọc cũ: không còn chỗ nào đọc `teamGaps` sai chỗ. `admin-workers.service.ts:379-397` không đọc `result_snapshot` (1 dòng thừa trong danh sách plan, không cần sửa).

## 6. Việc cần làm trước khi ship

1. Xác minh B1 bằng 1 lượt gọi AI thật; nâng cap ≥4096 hoặc hạ `thinkingLevel`.
2. Bổ sung test `computeMachineStats` + test chạy qua `TeamFitSavedResultSchema` (M1, M2).
3. Tính lại `machineStats` phía server trong save (M3).
4. Xoá dead code `buildCaseOverviewModel` + phần thừa của `caseOverviewModel.ts`; tách bớt `TeamFitResultStep.tsx` (M4, M6).
5. Khôi phục "Luồng ngoại lệ" + "Thiếu / chưa rõ" trong `docs/flows/team-fit-flow.md` (M5).
