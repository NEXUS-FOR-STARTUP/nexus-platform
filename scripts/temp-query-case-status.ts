import 'dotenv/config'
import pg from 'pg'

const connectionString = process.env.READONLY_DATABASE_URL

if (!connectionString) {
  console.error('Lỗi: Chưa định nghĩa READONLY_DATABASE_URL trong file .env')
  process.exit(1)
}

async function main() {
  const client = new pg.Client({ connectionString })

  try {
    await client.connect()
    console.log('Đã kết nối DB (Read-Only).\n')

    // 1. Check NX-844205
    console.log('=== NX-844205 ===')
    const r1 = await client.query(`
      SELECT case_code, internal_status, user_facing_stage, 
             assigned_supporter_auth_user_id, sla_deadline_at, deadline,
             created_at, updated_at
      FROM cases WHERE case_code = 'NX-844205'
    `)
    if (r1.rows.length === 0) console.log('Không tìm thấy case NX-844205')
    else console.table(r1.rows)

    // 2. Count all cases by internal_status
    console.log('\n=== Phân bố internal_status ===')
    const r2 = await client.query(`
      SELECT internal_status, COUNT(*) as count
      FROM cases
      GROUP BY internal_status
      ORDER BY count DESC
    `)
    console.table(r2.rows)

    // 3. Cases with "assigned" status but no supporter assigned
    console.log('\n=== Case assigned nhưng chưa có supporter ===')
    const r3 = await client.query(`
      SELECT case_code, internal_status, user_facing_stage, assigned_supporter_auth_user_id, created_at
      FROM cases 
      WHERE internal_status = 'assigned' AND assigned_supporter_auth_user_id IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `)
    console.table(r3.rows)

    // 4. All recent cases (last 20)
    console.log('\n=== 20 case gần nhất ===')
    const r4 = await client.query(`
      SELECT case_code, internal_status, user_facing_stage, 
             assigned_supporter_auth_user_id IS NOT NULL as has_supporter,
             created_at
      FROM cases
      ORDER BY created_at DESC
      LIMIT 20
    `)
    console.table(r4.rows)

    // 5. Check supporters list
    console.log('\n=== Danh sách supporter ===')
    const r5 = await client.query(`
      SELECT id, name, email, role FROM users WHERE role = 'supporter'
    `)
    console.table(r5.rows)

    // 6. Cases with "unassigned" status (Prisma default mismatch)
    console.log('\n=== Case có internal_status "unassigned" ===')
    const r6 = await client.query(`
      SELECT COUNT(*) FROM cases WHERE internal_status = 'unassigned'
    `)
    console.log('Count:', r6.rows[0].count)

  } catch (error) {
    console.error('Lỗi:', error)
  } finally {
    await client.end()
  }
}

main()
