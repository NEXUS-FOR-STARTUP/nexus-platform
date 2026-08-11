/**
 * Migrate credit_ledgers → wallet VND for legacy cases.
 *
 * Quy tắc: Mỗi case có credit còn dư (balance_after > 0) → deposit VND vào
 * ví chủ case. Dùng actual payment amount nếu có, fallback locked_price.
 * Idempotency key `migration-case-{caseId}` đảm bảo chạy lại không trùng.
 *
 * Run: npx tsx scripts/migrate-credit-to-wallet.ts
 * Requires DATABASE_URL in root .env
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: new URL("../.env", import.meta.url).pathname });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set. Aborting.");
  process.exit(1);
}

const CREDIT_PRICE_VND = 39000;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

interface MigrationResult {
  caseId: string;
  userId: string;
  creditBalance: number;
  vndAmount: number;
  status: string;
}

async function migrateCreditToWallet() {
  const results: MigrationResult[] = [];

  const cases = await prisma.case.findMany({
    where: {
      credit_ledgers: {
        some: { balance_after: { gt: 0 } },
      },
    },
    select: {
      id: true,
      owner_auth_user_id: true,
      locked_price: true,
      payments: {
        where: { status: "paid" },
        select: { amount: true },
      },
      credit_ledgers: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: { balance_after: true },
      },
    },
  });

  console.log(`Found ${cases.length} cases with credit balance > 0\n`);

  for (const c of cases) {
    const latestBalance = c.credit_ledgers[0]?.balance_after ?? 0;
    if (latestBalance <= 0) continue;

    const totalPaid = c.payments.reduce((sum, p) => sum + p.amount, 0);
    const vndAmount =
      totalPaid > 0
        ? totalPaid
        : (c.locked_price ?? CREDIT_PRICE_VND) * latestBalance;

    const idempotencyKey = `migration-case-${c.id}`;

    try {
      await prisma.$transaction(async (tx) => {
        let wallet = await tx.userWallet.findUnique({
          where: { user_id: c.owner_auth_user_id },
          select: { id: true, balance: true },
        });

        if (!wallet) {
          wallet = await tx.userWallet.create({
            data: { user_id: c.owner_auth_user_id, balance: 0 },
            select: { id: true, balance: true },
          });
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + vndAmount;

        await tx.walletTransaction.create({
          data: {
            wallet_id: wallet.id,
            type: "migration",
            amount: vndAmount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            source_type: "migration",
            source_id: c.id,
            idempotency_key: idempotencyKey,
          },
        });

        await tx.userWallet.update({
          where: { id: wallet.id },
          data: { balance: balanceAfter },
        });
      });

      results.push({
        caseId: c.id,
        userId: c.owner_auth_user_id,
        creditBalance: latestBalance,
        vndAmount,
        status: "SUCCESS",
      });
    } catch (err: unknown) {
      const pgError = err as { code?: string; message?: string };
      if (pgError.code === "P2002") {
        results.push({
          caseId: c.id,
          userId: c.owner_auth_user_id,
          creditBalance: latestBalance,
          vndAmount,
          status: "SKIPPED (already migrated)",
        });
      } else {
        results.push({
          caseId: c.id,
          userId: c.owner_auth_user_id,
          creditBalance: latestBalance,
          vndAmount,
          status: `FAILED: ${pgError.message ?? "unknown"}`,
        });
      }
    }

    console.log(
      `[${results.length}/${cases.length}] Case ${c.id}: ${results[results.length - 1].status}`,
    );
  }

  const success = results.filter((r) => r.status === "SUCCESS").length;
  const skipped = results.filter((r) => r.status.startsWith("SKIPPED")).length;
  const failed = results.filter((r) => r.status.startsWith("FAILED")).length;

  console.log(`\n=== Migration Summary ===`);
  console.log(`Total cases with credit: ${results.length}`);
  console.log(`Success: ${success}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(
    `Total VND migrated: ${results
      .filter((r) => r.status === "SUCCESS")
      .reduce((s, r) => s + r.vndAmount, 0)
      .toLocaleString("vi-VN")} VND`,
  );

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} case(s) failed. Check errors above.`);
  }
}

migrateCreditToWallet()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("Migration failed:", err);
    prisma.$disconnect().then(() => process.exit(1));
  });
