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
