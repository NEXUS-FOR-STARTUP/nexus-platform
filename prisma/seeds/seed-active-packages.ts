/**
 * Seed script: Upsert active Team-fit packages (T1.3).
 *
 * Idempotent — safe to run multiple times.
 *
 * Usage: npx tsx prisma/seeds/seed-active-packages.ts
 */

import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
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

// ---------------------------------------------------------------------------
// Package definitions
// ---------------------------------------------------------------------------

interface ActivePackageDef {
  id: string;
  name: string;
  price: number;
  features: unknown;
  is_active: boolean;
}

const ACTIVE_PACKAGES: ActivePackageDef[] = [
  {
    id: "pkg_tf_free",
    name: "Kiểm tra đội ngũ miễn phí",
    price: 0,
    features: [
      "Phản biện tự động bằng AI",
      "Báo cáo lỗi ý tưởng sơ bộ",
      "Phân tích phân khúc khách hàng & vấn đề cơ bản",
    ],
    is_active: true,
  },
  {
    id: "pkg_tf_audit",
    name: "Kiểm tra chuyên sâu",
    price: 39000,
    features: {
      items: [
        "Supporter (mentor) đánh giá chi tiết",
        "Thời gian SLA phản hồi trong 48h",
        "Mua thêm lượt audit khi cần",
      ],
      sla_hours: 48,
    },
    is_active: true,
  },
];

// ---------------------------------------------------------------------------
// Seed function (exported for composition with other seed scripts)
// ---------------------------------------------------------------------------

export async function seedActivePackages(): Promise<void> {
  console.log("🚀 Active packages seed — start\n");

  let created = 0;
  let updated = 0;

  for (const pkg of ACTIVE_PACKAGES) {
    const { id, name, price, features, is_active } = pkg;
    console.log(`📦 Upserting "${name}" (${id})...`);

    const existing = await prisma.servicePackage.findUnique({
      where: { id },
      select: { id: true },
    });

    const result = await prisma.servicePackage.upsert({
      where: { id },
      create: {
        id,
        name,
        price,
        features,
        is_active,
      },
      update: {
        name,
        price,
        features,
        is_active,
      },
    });

    if (existing) {
      updated++;
      console.log(`   ✅ Updated (id: ${result.id}).`);
    } else {
      created++;
      console.log(`   ✅ Created (id: ${result.id}).`);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("\n── Summary ──");
  console.log(`   Created: ${created}, Updated: ${updated}`);

  const active = await prisma.servicePackage.findMany({
    where: { is_active: true },
    select: { id: true, name: true, price: true },
    orderBy: { price: "asc" },
  });

  console.log(`\n   Active packages (${active.length}):`);
  active.forEach((p) =>
    console.log(`   ${p.id} | ${p.name} | ${p.price.toLocaleString()} VND`),
  );

  console.log("\n✅ Active packages seed — complete");
}

// ---------------------------------------------------------------------------
// Direct execution
// ---------------------------------------------------------------------------

if (require.main === module) {
  seedActivePackages()
    .catch((e) => {
      console.error("❌ Seed failed:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
