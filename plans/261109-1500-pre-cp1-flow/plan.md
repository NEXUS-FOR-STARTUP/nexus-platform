# Plan: một luồng "Bắt đầu" duy nhất (gộp pre-CP1 + team-fit)

**Ngày lập:** 2026-11-09 · **Cập nhật:** 2026-11-10 · **Trạng thái:** chờ duyệt; **chưa sửa một dòng code sản phẩm nào** — mọi thay đổi tới giờ nằm trong demo UX `temp-1/demo/` và trong chính plan này
**Nguồn:** demo UX `temp-1/demo/` · brainstorm `docs/research/brainstorm-2026-11-08-pre-cp1-team-idea-flow.md`
**Đích:** `apps/web-1` (`/dashboard/start`) + `apps/api` (module `pre-cp1`) + `packages/validation` (`pre-cp1/`)
**Demo UX (2026-11-10):** `temp-1/demo/` chạy được 6 kịch bản; kết quả là một trang 5 mục, cảnh báo 2 cột ở ≥1024px; UI gọi là "kết quả sơ bộ", không dùng chữ "bản đồ". Demo là **bản đặc tả UX đã chốt** — Phase 04 phải khớp nó, không sáng tạo thêm.

## Bài toán
Người mới vào không có nhóm / chưa có ý tưởng thì sản phẩm hiện tại không có cửa. Đồng thời đang có **hai** sản phẩm nói gần giống nhau (`team-fit` và luồng pre-CP1 mới), hai cửa tạo dự án, hai định nghĩa "nhóm thiếu ai". Gộp thành **một luồng, hai câu hỏi rẽ nhánh**, và một dự án chứa mọi thứ.

## Nguyên tắc không đổi
- Luật cố định nằm ở `packages/validation/src/pre-cp1/rules.ts`: FE xem trước, BE tính lại khi lưu.
- AI chỉ gán nhãn / nhận xét; người dùng xác nhận; không có AI thì trang vẫn ra kết quả.
- Không hiện "CP1" ở UI. Không matchmaking, không AI sinh ý tưởng.
- Mọi bước phải nuôi một mục kết quả cụ thể; bước nào không nuôi gì thì bỏ.

## Phases

| # | Phase | Nội dung | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 1 | [Contracts & rules](phase-01-contracts-and-rules.md) | catalog, Zod schema (nhóm + ý tưởng 2 dạng), 5 hàm luật, test | — | pending |
| 2 | [AI nhãn](phase-02-ai-labels.md) | `POST /api/pre-cp1/label` (Gemini, allowlist, rate limit) | 1 | pending |
| 3 | [Lưu vào dự án](phase-03-db-and-save.md) | `pre_cp1_reports` (`case_id` NOT NULL) + ghi luôn báo cáo AI vào `team_fit_reports` cùng case | 1, 2, 7 | pending |
| 4 | [Luồng gộp](phase-04-web-flow.md) | `/dashboard/start`: 2 câu hỏi rẽ nhánh, 1 form nhóm, nhánh Mad Libs, kết quả hợp nhất | 1, 2, 3, 7 | pending |
| 5 | [Bỏ team-fit + điểm vào](phase-05-retire-team-fit-and-entry.md) | xoá trang team-fit, chuyển hướng, đổi 5 link, docs, QA | 4 | pending |
| 6 | [Điền sẵn](phase-06-auto-fill-from-result.md) | thêm nguồn `pre_cp1` vào `SYNC_RULES` | 3 | pending |
| 7 | [Suy ra input cho AI](phase-07-derive-ai-input.md) | `major` + 9 năng lực → `roleTrack`/`strengths`/`experience`; không hỏi "mảng nghề" | 1 | pending |

## Quyết định kiến trúc đã chốt
1. **Gộp thật**: `/dashboard/team-fit` bị xoá, thay bằng redirect sang `/dashboard/start` (**không** điền sẵn `?idea=yes` — nút landing không ngụ ý người dùng đã có ý tưởng; để họ tự trả lời câu rẽ nhánh). AI chấm theo ngành giữ lại như một nhánh, không phải một trang.
2. **Một câu hỏi rẽ nhánh, không phải ba luồng**: chỉ "Có ý tưởng cụ thể chưa?" (Mad Libs / nháp) mới làm kết quả giàu/nghèo. "Có nhóm chưa?" **không còn là câu hỏi**: bước nhóm luôn mở với một thẻ là bạn, nhóm một mình là mặc định; có thêm người thì bấm "+ Thêm thành viên".
3. **Một form nhóm đầy đủ**: tên, chuyên ngành, 9 trục năng lực + mức, ô thêm. **Không hỏi "mảng nghề"** — 8 chuyên ngành map thẳng sang mảng nghề qua `TRACK_BY_MAJOR` (Thiết kế đồ hoạ → Kỹ thuật), chỉ **"Ngành khác"** hỏi thêm 1 chip Kỹ thuật / Marketing / Kinh doanh–Tài chính, vì `trackCoverage` hiện công khai số người theo mảng nên không được gán bừa. "Sở trường" và "kinh nghiệm" của team-fit **tự sinh** từ 9 ô năng lực + ô thêm, không bắt gõ lại.
4. **Ngân sách giữ**: chỉ nó nuôi cờ "Tiền" — ý tưởng có quá sức không.
5. **AI chạy một lần, chỉ ở nhánh có ý tưởng cấu trúc** (Mad Libs đủ 6 ô). Nháp 1-2 câu thì không gọi AI chấm ngành (không đủ dữ kiện) — vẫn có 5 cờ bằng luật.
6. **Một dự án chứa cả ba thứ**: `pre_cp1_reports` (kết quả sơ bộ) + `team_fit_reports` (báo cáo AI, cùng `case_id`) + câu trả lời CP1 điền sẵn. Không có bản ghi nào nằm ngoài dự án.
7. **Lưu chỉ khi tạo dự án** (nút cuối là "Tạo dự án từ kết quả này", dùng lại `CreateProjectModal`). Không có nút "Lưu" riêng.
8. **Điền sẵn qua cơ chế sẵn có** `SYNC_RULES` — không viết cơ chế mới, không nhét dữ liệu vào `TeamMemberInputSchema` từ client.
9. **Điểm vào đã có sẵn**: landing dùng nút "free" trỏ `/dashboard/team-fit?step=1`; đổi đích sang `/dashboard/start`, không dựng thêm nút.
10. **Trần nhóm là luật của trường, không phải của môn**: FPT → 4–6 người và ≥2 chuyên ngành khi học EXE101; trường khác → **không trần** (`max(50)` chỉ là chặn kỹ thuật của API). Quá 6 người thì phần chấm theo ngành bị bỏ qua vì `MAX_TEAM_MEMBERS = 6` là hợp đồng của endpoint chấm — UI phải nói đúng lý do đó, không nói "quá trần môn học".
11. **Nhập nhóm bằng thẻ, không bằng bộ đếm**: thẻ đầu là bạn (không xoá được), thêm bằng nút nét đứt "+ Thêm thành viên (n/6)" như `TeamInputStep.tsx` hiện tại, mỗi thẻ thêm có "Xoá người này". Mặc định 1 người.
12. **Không có nút bỏ qua cả bước** ở bước tài sản và bước người quen: mỗi câu/chip chỉ bỏ đúng thứ đó. Bước tài sản nuôi phần "hướng nên đi hỏi thử" nên khuyến khích bỏ qua là tự làm mất căn cứ của kết quả. Nhãn tài sản = **16 chip chọn tay** + **ô tự do `assetsOther`** (không có trong danh sách thì ghi ra, và nó thành một hướng riêng chứ không bị gán nhãn giả).
13. **`coverage.room = null` khi trường không đặt trần**, không dùng `Infinity` (`JSON.stringify` biến nó thành `null` → snapshot/hash lệch kiểu).

## Rủi ro chính
- **Đường dài nhất dài hơn**: nhóm 4 người + có ý tưởng ≈ 5 phút nhập + 2 lần AI. **Không bù bằng nút bỏ qua cả bước tài sản** — bước này là đầu vào duy nhất cho phần "hướng nên đi hỏi thử", bỏ qua thì kết quả mất căn cứ và người dùng sẽ đọc là sản phẩm đoán mò. Bù bằng cách chia 5 câu thành từng câu ngắn, mỗi câu có chip "Mình không có / không nhớ" cho đúng câu đó.
- **Nhánh Mad Libs gọi 2 AI**: chấm đội + gán nhãn ý tưởng, chạy song song. Nhãn hỏng thì 10 chip tick tay, không chặn. Thiếu nhãn là khối 5 cờ rỗng — đã chốt phải gán nhãn trước khi tới kết quả.
- **Ghi báo cáo AI**: `team_fit_reports.idea_snapshot`/`team_snapshot` là `Json` NOT NULL → chỉ ghi khi có `madlibs` và derive khác `null`; lệch thì 400, không ghi object rỗng (Phase 03).
- **Xoá team-fit**: 5 link + 2 endpoint phải rà hết (liệt kê ở Phase 05), nếu sót là 404 cho người dùng thật.
- **Ngưỡng luật chưa có dữ liệu**: ghi rõ là giả thuyết, chỉnh sau ≥30 lượt.
- **AI có thể nhắc lại mảng nghề/số người theo mảng** (trùng khối luật). Đọc ở bước kiểm chất lượng Phase 07; chỉ sửa prompt nếu nó lặp số liệu hoặc mâu thuẫn với `trackCoverage`.
- **DB**: chỉ thêm 1 bảng + 2 quan hệ; không `migrate dev` full, `db push`, `reset`.
