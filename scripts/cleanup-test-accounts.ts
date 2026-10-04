/**
 * Cleanup test-case accounts spam — xoá toàn bộ user sinh ra từ test case.
 *
 * Test marker: email LIKE '%@test.local' (phase-08/phase-09 tạo randomUUID@test.local).
 * Bao gồm mọi tên: "t", "a", "b", "owner", "admin-a", "admin-b", "test-user".
 *
 * Run:
 *   npx tsx scripts/cleanup-test-accounts.ts            # dry-run (mặc định)
 *   npx tsx scripts/cleanup-test-accounts.ts --execute  # xoá thật
 *
 * Requires DATABASE_URL trong root .env (quyền ghi — READONLY_DATABASE_URL không xoá được).
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env");
loadEnv({ path: envPath });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set. Aborting.");
  process.exit(1);
}

const EXECUTE = process.argv.includes("--execute");

// user_id columns của các bảng tham chiếu trực tiếp users
// (NULL-safe refs: chỉ SET NULL; owned rows: DELETE)
const USER_REF_TABLES: Array<{ table: string; column: string }> = [
  { table: "notifications", column: "user_id" }, // Cascade nhưng xoá tường minh để đếm
  { table: "case_events", column: "actor_auth_user_id" },
  { table: "case_messages", column: "sender_auth_user_id" },
  { table: "case_members", column: "auth_user_id" },
  { table: "document_records", column: "uploaded_by_auth_user_id" },
  { table: "deposits", column: "user_id" },
  { table: "wallet_topups", column: "user_id" },
];

// Nullable FK → SET NULL (không xoá row chia sẻ với dữ liệu thật)
const USER_NULLABLE_REFS: Array<{ table: string; column: string }> = [
  { table: "cases", column: "assigned_supporter_auth_user_id" },
  { table: "reports", column: "approved_by_auth_user_id" },
  { table: "payments", column: "verified_by_auth_user_id" },
];

const TEST_USERS_CTE = `SELECT id FROM users WHERE email LIKE '%@test.local'`;

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const { rows: users } = await client.query(
      `SELECT id, name, email, created_at FROM users WHERE email LIKE '%@test.local' ORDER BY created_at`,
    );
    if (users.length === 0) {
      console.log("Không có account @test.local nào — DB sạch.");
      return;
    }
    console.log(`\nTìm thấy ${users.length} account @test.local:`);
    console.table(users);

    const counts: Record<string, number> = {};
    for (const { table, column } of USER_REF_TABLES) {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS n FROM ${table} WHERE ${column} IN (${TEST_USERS_CTE})`,
      );
      counts[`${table}.${column}`] = rows[0].n;
    }
    for (const { table, column } of USER_NULLABLE_REFS) {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS n FROM ${table} WHERE ${column} IN (${TEST_USERS_CTE})`,
      );
      counts[`${table}.${column} (NULL)`] = rows[0].n;
    }
    const { rows: caseCount } = await client.query(
      `SELECT COUNT(*)::int AS n FROM cases WHERE owner_auth_user_id IN (${TEST_USERS_CTE})`,
    );
    counts["cases.owner (DELETE + cascade)"] = caseCount[0].n;
    const { rows: walletCount } = await client.query(
      `SELECT COUNT(*)::int AS n FROM user_wallets WHERE user_id IN (${TEST_USERS_CTE})`,
    );
    counts["user_wallets"] = walletCount[0].n;
    for (const t of ["sessions", "accounts", "two_factors"]) {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS n FROM ${t} WHERE user_id IN (${TEST_USERS_CTE})`,
      );
      counts[t] = rows[0].n;
    }

    console.log("\nSố row tham chiếu sẽ bị xử lý:");
    console.table(
      Object.entries(counts).map(([target, n]) => ({ target, n })),
    );

    if (!EXECUTE) {
      console.log("\nDRY-RUN — chưa xoá gì. Chạy lại với --execute để xoá thật.");
      return;
    }

    await client.query("BEGIN");

    for (const { table, column } of USER_NULLABLE_REFS) {
      await client.query(
        `UPDATE ${table} SET ${column} = NULL WHERE ${column} IN (${TEST_USERS_CTE})`,
      );
    }
    for (const { table, column } of USER_REF_TABLES) {
      await client.query(
        `DELETE FROM ${table} WHERE ${column} IN (${TEST_USERS_CTE})`,
      );
    }

    // Cases test (owner là test user) — children đều Cascade theo schema
    await client.query(
      `DELETE FROM cases WHERE owner_auth_user_id IN (${TEST_USERS_CTE})`,
    );

    // Wallet: transactions → orders/order_items → deposits → wallets
    await client.query(
      `DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM user_wallets WHERE user_id IN (${TEST_USERS_CTE}))`,
    );
    await client.query(
      `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (${TEST_USERS_CTE}))`,
    );
    await client.query(`DELETE FROM orders WHERE user_id IN (${TEST_USERS_CTE})`);
    await client.query(`DELETE FROM user_wallets WHERE user_id IN (${TEST_USERS_CTE})`);

    // Auth tables (Better Auth)
    await client.query(`DELETE FROM sessions WHERE user_id IN (${TEST_USERS_CTE})`);
    await client.query(`DELETE FROM accounts WHERE user_id IN (${TEST_USERS_CTE})`);
    await client.query(`DELETE FROM two_factors WHERE user_id IN (${TEST_USERS_CTE})`);

    const { rowCount } = await client.query(
      `DELETE FROM users WHERE email LIKE '%@test.local'`,
    );

    await client.query("COMMIT");
    console.log(`\nĐã xoá ${rowCount} user @test.local + toàn bộ row tham chiếu.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Lỗi:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
