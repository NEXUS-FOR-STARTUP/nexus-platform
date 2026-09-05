/**
 * Incremental Seed Script: Pricing Tier Restructuring (2026-09-04).
 *
 * Migrates service packages from legacy 39k model to 2-tier pricing:
 * 1. Deactivates `pkg_tf_audit` (39k legacy package).
 * 2. Upserts `pkg_ai_audit` (79k - Basic AI Audit).
 * 3. Upserts `pkg_supporter_audit` (149k - Premium Mentor Audit).
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   npx tsx prisma/seeds/seed-20260904-pricing-tiers.ts
 */

import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@prisma/client";
import path from "node:path";

// Load root .env for DATABASE_URL
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface PackageDef {
  id: string;
  name: string;
  features: Prisma.InputJsonValue;
  is_active: boolean;
}

const NEW_PACKAGES: PackageDef[] = [
  {
    id: "pkg_ai_audit",
    name: "Basic AI Audit",
    price: 79000,
    features: {
      items: [
        "Đánh giá hoàn toàn tự động bằng AI",
        "Phân tích theo Rubric chuẩn (5 tiêu chí cốt lõi)",
        "Nhận báo cáo chi tiết ngay lập tức (dưới 1 phút)",
        "Chỉ ~15.000đ/bạn khi chia theo nhóm 5 người",
      ],
      sla_hours: 0,
      mode: "ai_automated",
      auto_delivery: true,
    },
    is_active: true,
  },
  {
    id: "pkg_supporter_audit",
    name: "Premium Mentor Audit",
    price: 149000,
    features: {
      items: [
        "Bao gồm toàn bộ tính năng của Basic AI",
        "Mentor FPT trực tiếp review và đối chiếu",
        "Ưu tiên chỉ ra các rủi ro chặn (BLOCKER)",
        "Định hướng sửa bài thực chiến (SLA: 24h-48h)",
      ],
      sla_hours: 48,
      mode: "human_verified",
    },
    is_active: true,
  },
];

export async function seedPricingTiers20260904(): Promise<void> {
  console.log("🚀 Running Pricing Tiers 2026-09-04 Seed...\n");

  // 1. Deactivate legacy 39k package if exists
  console.log('📦 Deactivating legacy "pkg_tf_audit" (39k)...');
  const legacyPackage = await prisma.servicePackage.findUnique({
    where: { id: "pkg_tf_audit" },
    select: { id: true, is_active: true },
  });

  if (legacyPackage) {
    await prisma.servicePackage.update({
      where: { id: "pkg_tf_audit" },
      data: { is_active: false },
    });
    console.log("   ✅ Deactivated pkg_tf_audit.");
  } else {
    console.log("   ℹ️ pkg_tf_audit not found, skipping deactivation.");
  }

  // 2. Upsert new packages
  let created = 0;
  let updated = 0;

  for (const pkg of NEW_PACKAGES) {
    const { id, name, price, features, is_active } = pkg;
    console.log(`📦 Upserting "${name}" (${id})...`);

    const existing = await prisma.servicePackage.findUnique({
      where: { id },
      select: { id: true },
    });

    const result = await prisma.servicePackage.upsert({
      where: { id },
      create: { id, name, price, features, is_active },
      update: { name, price, features, is_active },
    });

    if (existing) {
      updated++;
      console.log(`   ✅ Updated (${result.id}).`);
    } else {
      created++;
      console.log(`   ✅ Created (${result.id}).`);
    }
  }

  // 3. Summary
  console.log("\n── Summary ──");
  console.log(`   Created: ${created}, Updated: ${updated}`);

  const active = await prisma.servicePackage.findMany({
    where: { is_active: true },
    select: { id: true, name: true, price: true },
    orderBy: { price: "asc" },
  });

  console.log(`\n   Current Active Packages (${active.length}):`);
  active.forEach((p) =>
    console.log(`   ${p.id} | ${p.name} | ${p.price.toLocaleString()} VND`),
  );

  console.log("\n✅ Pricing Tiers Seed — Complete");
}

if (require.main === module) {
  seedPricingTiers20260904()
    .catch((e) => {
      console.error("❌ Seed failed:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
