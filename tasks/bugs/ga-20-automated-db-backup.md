# GA-20: Tự động hóa sao lưu Cơ sở dữ liệu định kỳ (Automated DB Backup & RPO)

- **ID:** GA-20
- **Priority:** P2
- **Category:** Infrastructure / Security
- **Status:** Done
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`, `docs/db-backup-guide.md`

---

## 1. Mô tả vấn đề
Hiện tại, tài liệu `docs/db-backup-guide.md` mới chỉ cung cấp hướng dẫn chạy lệnh `pg_dump` thủ công bằng Docker trên máy chủ VPS. Hệ thống chưa có:
- Lịch tự động sao lưu định kỳ (Scheduled cron backup daily/hourly).
- Cam kết chỉ số RPO (Recovery Point Objective - tối đa mất bao nhiêu giờ dữ liệu khi gặp sự cố) và RTO (Recovery Time Objective).
- Quy trình tự động kiểm thử khôi phục dữ liệu (Automated restore test) định kỳ.
Vì Nexus Platform xử lý dữ liệu tài chính (ví tiền, đơn hàng, thanh toán), thiếu backup tự động là rủi ro vận hành nghiêm trọng.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Kịch bản tự động hóa (Backup Script):**
   - Viết shell script `scripts/backup-db.sh` chạy `pg_dump`, nén `gzip`, mã hóa và lưu trữ an toàn (local VPS + đẩy lên S3 / Google Cloud Storage offsite).
   - Thiết lập Cron job: Sao lưu đầy đủ hàng ngày vào lúc 02:00 AM UTC+7, giữ bản sao lưu trong 30 ngày (retention policy).
2. **Chỉ số RPO / RTO:**
   - Định nghĩa chính thức: RPO $\le$ 24 giờ, RTO $\le$ 2 giờ.
3. **Tài liệu & Diễn tập khôi phục:**
   - Bổ sung tài liệu quy trình khôi phục sự cố từng bước (Disaster Recovery Runbook) trong `docs/db-disaster-recovery.md`.
