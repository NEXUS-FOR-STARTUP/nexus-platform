# Deploy Log

Mỗi lần chạy `docker build && docker push` (theo `docs/docker-build-push-guide.md`), ghi lại 1 dòng vào bảng dưới.
Dùng để biết image `lgdlong/nexus-api:latest` và `lgdlong/nexus-web:latest` trên Docker Hub đang ở commit nào.

## Format

| Thời gian          | Commit   | Branch        | Message        | Image         |
| ------------------ | -------- | ------------- | -------------- | ------------- |
| `YYYY-MM-DD HH:MM` | `abcdef` | `branch-name` | commit message | 🔵 api 🟢 web |

---

## Lệnh ghi log nhanh (chạy sau `make build-push`)

```bash
echo "| $(date '+%Y-%m-%d %H:%M') | $(git rev-parse --short HEAD) | $(git branch --show-current) | $(git log --oneline -1 --format='%s') | 🔵 api 🟢 web |" >> docs/deploy-log.md
```

> ⚠️ **[Cần xác minh]** Tính đến HEAD `1942e5b` (branch `dev`, 2026-08-03, sau merge PR #5 `feat/wave-system`, release v1.0.0 — các commit `f4e6f6e`, `182af6b`, `1942e5b`), chưa có dòng deploy log mới nào được ghi. Commit thật sự đang chạy trên production image `lgdlong/nexus-*:latest` cần được verify bằng lệnh dưới đây trước khi coi log này là cập nhật:

```bash
# Trên VPS — xác minh commit/image đang chạy
docker inspect lgdlong/nexus-api:latest --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' 2>/dev/null || docker inspect lgdlong/nexus-api:latest --format '{{.Id}}'
docker exec nexus-web env | grep NEXT_PUBLIC   # xác minh build arg
```

Sau khi xác minh, ghi 1 dòng theo format trên (ví dụ: `2026-08-03 HH:MM | 1942e5b | dev | Merge pull request #5 from NEXUS-FOR-STARTUP/feat/wave-system | 🔵 api 🟢 web`).

---

## Lịch sử deploy

> Bảng luôn nằm ở đáy file — thêm dòng mới bằng lệnh ở mục trên.

| #                | Thời gian | Commit           | Branch                                                                               | Message       | Image |
| ---------------- | --------- | ---------------- | ------------------------------------------------------------------------------------ | ------------- | ----- |
| 2026-07-29 18:24 | 62f3e59   | feat/wave-system | docs: thêm deploy-log.md, cập nhật docker-build-push-guide với bước ghi log bắt buộc | 🔵 api 🟢 web |
| 2026-08-09 19:02 | 4a504c5   | staging          | docs(changelog): add v1.1.0 release notes                                             | 🔵 api 🟢 web |
| 2026-08-10 18:27 | 0442a6a | staging | Merge branch 'dev' into staging | 🔵 api |
| 2026-09-01 06:21 | 8b7d5d7 | staging | Merge pull request #22 from NEXUS-FOR-STARTUP/feat/gap-analysis-tasks | 🔵 api 🟢 web |
| 2026-09-01 07:01 | 0cacea9 | staging | fix(auth): wrap hooks with createAuthMiddleware to prevent 500 error | 🔵 api |
| 2026-09-01 08:42 | fabeb83 | staging | feat(web): elevate status banner, permanent timeline | 🟢 web |
| 2026-09-01 10:58 | 71cb29a | dev | Merge pull request #27 from NEXUS-FOR-STARTUP/fix/ux-credit-block | 🔵 api 🟢 web |
| 2026-09-02 19:45 | e4f1ab0 | staging | Merge pull request #31 from NEXUS-FOR-STARTUP/fix/usecase-payment-flow | 🔵 api 🟢 web |
| 2026-09-10 14:30 | 0520d4f | staging | Merge pull request #36 from NEXUS-FOR-STARTUP/refactor/migrate-npm-to-bun | 🔵 api 🟢 web |
| 2026-09-13 14:52 | d25b30d | feat/79k-dual-credit | refactor(worker-omp): move Dockerfile into apps/worker-omp | 🟠 worker |
| 2026-09-16 17:25 | 0c62c1e | staging | Merge pull request #33 from NEXUS-FOR-STARTUP/feat/pricing-package-tiers-ui | 🔵 api 🟢 web 🟠 worker |
| 2026-09-16 23:36 | 8b080c1 | staging | Merge remote-tracking branch 'origin/dev' into staging | 🔵 api 🟢 web |
| 2026-09-18 18:32 | d032e50 | staging | Merge pull request #39 from NEXUS-FOR-STARTUP/fix/pricing-chat-intake-quickfixes | 🔵 api 🟢 web |
| 2026-09-19 18:50 | 7cb0d6e | staging | perf(docker): optimize api and worker images and exclude tests from build | 🔵 api 🟢 web 🟠 worker |
| 2026-09-20 16:45 | 9355368 | staging | fix(ai-engine): resolve stale audit job deadlock and typst unclosed raw text | 🔵 api 🟢 web |
| 2026-09-20 20:55 | e5e31ad | staging | fix(web): preserve selected case tab | 🟢 web |
| 2026-09-21 15:17 | bc68db2 | staging | Merge pull request #40 from NEXUS-FOR-STARTUP/feat/ux-wording | 🟢 web |
| 2026-09-22 06:16 | 941b313 | staging | refactor(web): hide cancel evaluation button in radar header (#41) | 🟢 web |
| 2026-09-22 19:59 | 4795601 | staging | Merge branch 'dev' into staging | 🟢 web |
| 2026-09-22 20:42 | 17ec895 | staging | feat(web): add Zalo group icon to footer | 🟢 web |
| 2026-09-23 02:52 | 6217735 | staging | Merge branch 'dev' into staging | 🔵 api 🟢 web |
| 2026-09-23 20:19 | 12cb953 | staging | feat(web): add ExcelGuide Nhom 155 demo presets for team-fit and intake | 🟢 web |
| 2026-09-23 21:50 | 8813057 | staging | perf: A1-A5 optimization, Redis stats cache, bounded docs, non-blocking finalize, relax polls, B1 indexes | 🔵 api 🟢 web |
| 2026-09-23 22:50 | 7c71852 | staging | fix(credit): compute price per credit on refund to prevent double-refunding 79k package | 🔵 api |
| 2026-09-24 00:44 | e77da80 | staging | Merge commit 'd5026cd' into refactor/mobile-responsive | 🟢 web |
| 2026-09-28 22:08 | 874e37a | dev | feat(ai-engine): refine resubmit and logic prompts with pure Vietnamese and UX mindset | 🔵 api |
| 2026-10-06 20:03 | 971cda3 | staging | Merge branch 'dev' of https://github.com/NEXUS-FOR-STARTUP/nexus-platform into staging | 🔵 api 🟢 web |
| 2026-10-06 21:24 | 2da8d82 | staging | fix(api): change file logging from prependToFile to append-only stream | 🔵 api |
| 2026-10-06 21:51 | 849b34e | staging | feat(web-1): add articles nav to dashboard and sync auth state in app shell | 🟢 web |
| 2026-10-08 00:30 | 142fd9b | staging | fix(web-1): responsive thanh tim kiem news tren mobile | 🟢 web |
| 2026-10-09 22:31 | 00ec89e | staging | feat(news): upload ảnh từ máy trong editor bài viết | 🔵 api 🟢 web |
| 2026-10-12 20:59 | dbcdb76 | staging | fix(docker): build @repo/validation before app (turbo prune ships src without dist) | 🔵 api 🟢 web |
| 2026-10-12 21:12 | 54ad9bd | staging | worker-omp d2ae23ff (sha256:d2ae23ffdbdf5998d97d0fe67b4e426537f51f10b4bee98c01526c9af0a38d18) | 🟠 worker |
| 2026-10-12 23:15 | 9a01b8d | staging | chore(deploy): web rebuild với NEXT_PUBLIC_JOURNEY_WORKSPACE=true — web sha256:15446354582bf966e7c06124e4adb9101b5b9b052689b5820ebf041e3fc1aff5 (api sha256:9911b18da731 không đổi) | 🟢 web |
| 2026-10-12 23:29 | 69e037c | staging | docs(plans): thêm plan worker OMP thành engine thuần (api sha256:6da470574a0a | worker sha256:e7f3e12329ed) | 🔵 api 🟠 worker |
| 2026-10-13 00:23 | 2c5f5ec | staging | fix(web): bỏ setState trong effect ở modal chấm bài (api sha256:b1df11a401c4 | web sha256:294a02afde12) | 🔵 api 🟢 web |
| 2026-10-13 00:46 | 017f8d1 | staging | fix(api): chặn [___] bị parse thành in nghiêng làm hỏng PDF báo cáo (api sha256:4276d8575db3) | 🔵 api |
| 2026-10-14 12:46 | 8d636d5 | staging | chore(web): normalize wording and currency (api sha256:7b1ec139594c | web sha256:db70546e81c5) | 🔵 api 🟢 web |
| 2026-10-15 16:55 | e753502 | staging | feat(web): nút báo lỗi qua Zalo khi lần chấm bị gián đoạn (web sha256:b05f779ba5fe) | 🟢 web |
| 2026-10-16 10:48 | f9dd852+dirty | staging | feat(dashboard): guide users to fill case contact. DIRTY build: image chứa thêm thay đổi chưa commit ở document-parser.ts, docx-generator.ts, guided-documents.test.ts, prisma/seeds/seed-active-packages.ts (api sha256:c07176a19f1f | web sha256:7c9ff42a9ddb; web không bị ảnh hưởng) | 🔵 api 🟢 web |
| 2026-10-16 11:26 | d3874f0 | staging | feat(reports): name report PDFs {project}_{stage}_{type}_{timestamp}, use case team_name, drop version suffix. Build sạch từ worktree detached tại d3874f0 (api sha256:ea9d47c5fcc0 | web sha256:c6de91e6363b) | 🔵 api 🟢 web |
| 2026-10-16 11:37 | 5cdf5b4 | staging | fix(guided-documents)+chore(seed)+docs(plans): gộp thay đổi sau d3874f0, build sạch từ cây làm việc đã commit (api sha256:a1eb0cae4911 | web sha256:96f65f0716a6) | 🔵 api 🟢 web |
| 2026-10-20 12:58 | 2973a8b | staging | merge: dev into staging (PR #53 landing/case/settings/wallet redesign, Phosphor icons, wallet totals API). Build sạch (api sha256:aed7bda36e8d | web sha256:c94cfca4af6d) | 🔵 api 🟢 web |
| 2026-10-20 16:18 | 3eb5a0b | dev | merge: staging into dev (activity timeline events + marker colours). Build sạch (api sha256:11d6888e80e0 | web sha256:b0088f327e1d) | 🔵 api 🟢 web |
| 2026-10-20 17:07 | 77420d2 | dev | feat(wallet): mô tả giao dịch ví theo gói/dự án/mã hồ sơ + script backfill case_events. Build sạch (api digest sha256:5726ea4a3241) | 🔵 api |
| 2026-10-25 19:45 | ac54186 | staging | merge: dev into staging (PR #55 stage Tài chính + PITCH DECK docx-only, câu chọn track, DOCX nhãn TUỲ CHỌN, CP3 bỏ cp3_key_findings; OMP_VERSION=18.12.6 từ working tree chưa commit). Build sạch (api sha256:d43ba1e26e94 | web sha256:8e9e46f1e44c | worker sha256:0eaa5abfd8d1) | 🔵 api 🟢 web 🟠 worker |
| 2026-10-26 10:39 | 7cea274 | staging | feat(landing): bảng giá một thẻ mỗi giai đoạn chấm + thu hero. Chỉ web đổi từ ac54186 (api/worker giữ nguyên). Build sạch (web sha256:7edde572c0bc) | 🟢 web |
