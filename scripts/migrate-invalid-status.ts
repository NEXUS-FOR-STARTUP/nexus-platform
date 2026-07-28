/**
 * Migrate cases with invalid internal_status to valid values.
 * Run: npx tsx scripts/migrate-invalid-status.ts
 * 
 * Requires DATABASE_URL (write access) in root .env
 * SAFETY: This is a targeted UPDATE — only affects 13 cases
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking for cases with invalid internal_status...");
  
  // Count before migration
  const before = await prisma.case.count({
    where: {
      internal_status: { in: ["draft", "submitted", "unassigned"] },
    },
  });
  console.log(`📊 Found ${before} cases with invalid internal_status (draft/submitted/unassigned)`);
  
  if (before === 0) {
    console.log("✅ No cases need migration. Complete.");
    await prisma.$disconnect();
    return;
  }
  
  console.log("🔄 Migrating to 'triage_pending'...");
  
  const result = await prisma.case.updateMany({
    where: {
      internal_status: { in: ["draft", "submitted", "unassigned"] },
    },
    data: {
      internal_status: "triage_pending",
    },
  });
  
  console.log(`✅ Migrated ${result.count} cases to 'triage_pending'`);
  
  // Verify after migration
  const after = await prisma.case.count({
    where: {
      internal_status: { in: ["draft", "submitted", "unassigned"] },
    },
  });
  
  if (after === 0) {
    console.log("✅ Verification passed: 0 cases with invalid internal_status remain.");
  } else {
    console.error(`❌ WARNING: ${after} cases still have invalid internal_status!`);
  }
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Migration failed:", error);
  prisma.$disconnect().then(() => process.exit(1));
});
