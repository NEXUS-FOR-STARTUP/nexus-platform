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
