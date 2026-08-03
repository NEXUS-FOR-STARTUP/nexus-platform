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

## Lịch sử deploy

| #                | Thời gian | Commit           | Branch                                                                               | Message       | Image |
| ---------------- | --------- | ---------------- | ------------------------------------------------------------------------------------ | ------------- | ----- |
| 2026-07-29 18:24 | 62f3e59   | feat/wave-system | docs: thêm deploy-log.md, cập nhật docker-build-push-guide với bước ghi log bắt buộc | 🔵 api 🟢 web |

> ⚠️ **[Cần xác minh]** Tính đến HEAD `1942e5b` (branch `dev`, 2026-08-03, sau merge PR #5 `feat/wave-system`, release v1.0.0 — các commit `f4e6f6e`, `182af6b`, `1942e5b`), chưa có dòng deploy log mới nào được ghi. Commit thật sự đang chạy trên production image `lgdlong/nexus-*:latest` cần được verify bằng lệnh dưới đây trước khi coi log này là cập nhật:

```bash
# Trên VPS — xác minh commit/image đang chạy
docker inspect lgdlong/nexus-api:latest --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' 2>/dev/null || docker inspect lgdlong/nexus-api:latest --format '{{.Id}}'
docker exec nexus-web env | grep NEXT_PUBLIC   # xác minh build arg
```

Sau khi xác minh, ghi 1 dòng theo format trên (ví dụ: `2026-08-03 HH:MM | 1942e5b | dev | Merge pull request #5 from NEXUS-FOR-STARTUP/feat/wave-system | 🔵 api 🟢 web`).
