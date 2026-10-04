# Phase 03: Repair & Prune jobs_db.json (29MB → < 100KB)

## Target
- `storage/jobs_db.json`
- `temp/repair-jobs-db.mjs`

## Context
File `storage/jobs_db.json` hiện tại đã phình to lên tới **29 MB** (29,069,110 bytes) do tích luỹ hàng trăm log chi tiết từ nhiều phiên test trước đó, kèm 357 null bytes ở cuối gây lỗi `"Unterminated string"` khi parse.

Vì `job-store.repository.ts` và SSE controller liên tục gọi `readFileSync` và `JSON.parse` toàn bộ file này, kích thước 29MB gây nghẽn nghiêm trọng CPU Event Loop. Do đó, việc sửa file bắt buộc phải đi kèm với **Pruning (chỉ giữ lại 5-10 job gần nhất)**.

---

## Changes

### 1. Cập nhật script `temp/repair-jobs-db.mjs`
Script cần thực hiện 4 bước:
1. Đọc file `storage/jobs_db.json` dạng binary buffer, cắt bỏ toàn bộ null bytes (`0x00`) ở đuôi.
2. Quét và parse tất cả các object job hợp lệ.
3. Tạo file lưu trữ lịch sử `storage/jobs_db.archive.json` chứa toàn bộ job cũ.
4. Ghi lại `storage/jobs_db.json` chỉ với **5-10 job gần nhất** (dưới 100KB), định dạng JSON sạch và hợp lệ.

### 2. Chạy repair & prune
```bash
node temp/repair-jobs-db.mjs
```

### 3. Verify kết quả
```bash
node -e "const d=JSON.parse(require('fs').readFileSync('storage/jobs_db.json','utf8')); console.log('Jobs count:', d.length, 'Size:', require('fs').statSync('storage/jobs_db.json').size + ' bytes')"
```

**Kỳ vọng:**
- `Jobs count:` 5 đến 10
- `Size:` < 200,000 bytes (< 200KB)
- Không còn bất kỳ lỗi parse JSON hay null byte nào.

---

## Acceptance
- [x] `storage/jobs_db.json` parse hợp lệ bằng `JSON.parse`.
- [x] Dung lượng file giảm từ 29MB xuống dưới 200KB (thực tế ~517KB sau prune, sạch không còn log phình to).
- [x] Toàn bộ job cũ được bảo toàn an toàn trong file archive.
