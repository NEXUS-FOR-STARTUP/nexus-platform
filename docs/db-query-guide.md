# Production Database Script Query Guide (Read-Only)

_Cập nhật: 2026-08-03. Production DB là self-hosted PostgreSQL 18.4 trên VPS (docker-compose.prod.yml)._

Tài liệu này hướng dẫn cách viết file script tạm thời để truy vấn dữ liệu từ Production Database một cách nhanh chóng, an toàn bằng Node.js/TypeScript, sử dụng tài khoản Read-Only `guest` đã được cấu hình trong file `.env`.

> [!NOTE]
> Tài khoản **`guest`** đã được cấu hình toàn bộ quyền đọc (`SELECT`) trên toàn bộ bảng hiện tại và tương lai của schema `public`, đảm bảo an toàn tối đa cho DB Production. Mọi câu lệnh thay đổi dữ liệu (`INSERT`, `UPDATE`, `DELETE`) đều sẽ bị từ chối truy cập.

---

## 1. Thông tin kết nối (Connection Details)

Để đảm bảo an toàn tối đa cho dữ liệu Production, mọi hoạt động truy vấn tự do hoặc viết script tra cứu **chỉ được phép sử dụng duy nhất biến môi trường `READONLY_DATABASE_URL`**. Tuyệt đối không sử dụng `DATABASE_URL` hoặc `DIRECT_URL` để tránh rủi ro thay đổi dữ liệu ngoài ý muốn.

* **Biến môi trường duy nhất được dùng:** `READONLY_DATABASE_URL`
* **Quyền hạn:** Chỉ đọc (`SELECT`) trên schema `public`.

---

## 2. Cách viết và chạy script truy vấn trực tiếp

Do môi trường chạy lệnh hoặc một số hệ điều hành không cài đặt sẵn `psql` hoặc các công cụ dòng lệnh PostgreSQL, phương pháp viết script TypeScript/JavaScript chạy qua Node/tsx là tối ưu nhất.

### Bước 1: Tạo file script tạm thời
Tạo một file script tạm (ví dụ: `scripts/temp-query.ts` hoặc `temp/query-db.ts`) với nội dung sử dụng thư viện `pg` (được cài đặt sẵn trong dự án):

```typescript
import 'dotenv/config'
import pg from 'pg'

const connectionString = process.env.READONLY_DATABASE_URL

if (!connectionString) {
  console.error('Lỗi: Chưa định nghĩa READONLY_DATABASE_URL trong file .env')
  process.exit(1)
}

async function main() {
  console.log('Đang kết nối tới Production Database (Read-Only)...')
  const client = new pg.Client({ connectionString })

  try {
    await client.connect()
    
    // Viết câu lệnh SQL truy vấn của bạn ở đây
    const query = `
      SELECT id, name, email, role
      FROM users
      LIMIT 5;
    `
    const res = await client.query(query)
    
    console.log('\n--- Kết quả truy vấn ---')
    console.table(res.rows)

  } catch (error) {
    console.error('Lỗi thực thi truy vấn:', error)
  } finally {
    await client.end()
  }
}

main()
```

### Bước 2: Chạy script bằng tsx
Để chạy file script TypeScript mà không cần compile thủ công, sử dụng công cụ `tsx` được tích hợp sẵn trong devDependencies của dự án:

```bash
# Chạy script từ thư mục gốc
npx tsx <đường-dẫn-file-script>

# Ví dụ:
npx tsx scripts/temp-query.ts
```

---

## 3. Các bảng dữ liệu chính trong Schema `public`

Toàn bộ 24 bảng được cấu hình trong [schema.prisma](../prisma/schema.prisma), chia theo nhóm:

### Auth (Better Auth quản lý)
* `users` - Người dùng hệ thống.
* `sessions` - Phiên đăng nhập.
* `accounts` - Tài khoản liên kết (OAuth).
* `verifications` - Mã xác thực (email, password reset).
* `two_factors` - Xác thực 2 yếu tố.

### Core Business
* `cases` - Dự án phản biện/đánh giá.
* `case_members` - Thành viên tham gia dự án (student, admin, supporter).
* `case_messages` - Tin nhắn trao đổi trong workspace.
* `case_events` - Nhật ký hoạt động của dự án.
* `checkpoints` - Mốc kiểm tra tiến độ.
* `lifecycle_units` - Tài liệu/Phiên bản nộp của dự án.
* `document_records` - Bản ghi tài liệu minh chứng.
* `document_types` - Loại tài liệu.
* `reports` - Báo cáo kết quả/đánh giá.
* `team_fit_reports` - Báo cáo phân tích đội ngũ (AI).

### Payments & Credits
* `deposits` - Nạp tiền vào ví (thay thế Payment + WalletTopup).
* `orders` - Đơn hàng mua credit/dịch vụ.
* `order_items` - Chi tiết dòng trong đơn hàng.
* `payments` - Thanh toán (legacy, @deprecated — thay bởi deposits).
* `service_packages` - Gói dịch vụ.
* `credit_ledgers` - Sổ cái credit (purchase/consumption/refund).

### Wallet
* `user_wallets` - Ví của người dùng (1 user = 1 wallet).
* `wallet_transactions` - Biến động số dư ví (append-only).
* `wallet_topups` - Nạp tiền cũ (legacy, @deprecated — thay bởi deposits).

### Infrastructure
* `domain_event_outbox` - Outbox pattern cho financial events (atomic DB write + event publish).

### AI
* `ai_jobs` - Job xử lý AI (team-fit analysis, etc).

Ví dụ câu lệnh kiểm tra số lượng bản ghi của tất cả các bảng:
```sql
SELECT 
    table_name, 
    (xpath('/row/cnt/text()', xmlparse(document query_to_xml(format('select count(*) as cnt from %I.%I', table_schema, table_name), false, true, ''))))[1]::text::int AS row_count
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY 
    row_count DESC;
```

---

## 4. Chính sách bảo mật (Security & Safety)
Tài khoản `guest` chỉ được cấp quyền `SELECT`. Mọi lệnh can thiệp ghi dữ liệu đều bị chặn:

```sql
UPDATE users SET name = 'Test' WHERE id = '1';
-- ERROR: permission denied for table users
```
