/**
 * Seed script: Deactivate old Gói 0-3 packages, create Team-fit Free + Audit 1 lượt.
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage: npx tsx prisma/seeds/seed-packages.ts
 */

import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import path from "node:path";

// Load root .env for DATABASE_URL
// Script runs from repo root: npx tsx prisma/seeds/seed-packages.ts
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/** Old packages to deactivate — matched by name (IDs are UUIDs in DB). */
const OLD_PACKAGE_NAMES = [
  "Gói 0: Sàng lọc ý tưởng",
  "Gói 1: Nhận xét 1 vòng",
  "Gói 2: Nhận xét + Sửa đổi (2 vòng)",
  "Gói 3: Đồng hành nhiều vòng",
] as const;

/** New packages to upsert. */
const NEW_PACKAGES = [
  { id: "pkg_tf_free", name: "Team-fit Free", price: 0, features: {} },
  {
    id: "pkg_tf_audit",
    name: "Audit 1 lượt",
    price: 39000,
    features: {},
  },
] as const;

async function main() {
  console.log("🚀 Package seed — start\n");

  // ── 1. Deactivate old packages (Gói 0–3) ──────────────────────────────
  console.log("📦 Deactivating old packages (Gói 0–3)...");

  const oldPackages = await prisma.servicePackage.findMany({
    where: { name: { in: [...OLD_PACKAGE_NAMES] } },
    select: { id: true, name: true, is_active: true },
  });

  if (oldPackages.length > 0) {
    const idsToDeactivate = oldPackages.map((p) => p.id);
    const result = await prisma.servicePackage.updateMany({
      where: { id: { in: idsToDeactivate } },
      data: { is_active: false },
    });
    console.log(`   ✅ Deactivated ${result.count} package(s):`);
    oldPackages.forEach((p) =>
      console.log(`      - ${p.name} (${p.id}) → is_active = false`),
    );
  } else {
    console.log("   ⏭️  No old packages found — nothing to deactivate.");
  }

  // ── 2. Create new packages (idempotent) ───────────────────────────────
  for (const pkg of NEW_PACKAGES) {
    console.log(`\n📦 Checking "${pkg.name}" (${pkg.id})...`);

    const existing = await prisma.servicePackage.findFirst({
      where: { id: pkg.id },
    });

    if (existing) {
      console.log(`   ⏭️  Already exists — skipping.`);
      continue;
    }

    await prisma.servicePackage.create({
      data: {
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        features: pkg.features,
        is_active: true,
      },
    });
    console.log(`   ✅ Created "${pkg.name}" (${pkg.id}).`);
  }

  // ── 3. Summary ─────────────────────────────────────────────────────────
  console.log("\n── Summary ──");
  const allActive = await prisma.servicePackage.findMany({
    where: { is_active: true },
    select: { id: true, name: true, price: true },
    orderBy: { price: "asc" },
  });

  console.log(`Active packages (${allActive.length}):`);
  allActive.forEach((p) =>
    console.log(`   ${p.id} | ${p.name} | ${p.price.toLocaleString()} VND`),
  );

  console.log("\n✅ Package seed — complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
