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
  service_type_code: string;
  credits_granted: number | null;
}

interface ServiceTypeDef {
  code: string;
  name: string;
  description: string;
}

const SERVICE_TYPES: ServiceTypeDef[] = [
  { code: "cp1_audit", name: "Chấm Checkpoint 1", description: "Lượt chấm AI cho ý tưởng ở Checkpoint 1" },
  { code: "cp2_audit", name: "Chấm Checkpoint 2", description: "Lượt chấm AI cho bảng hỏi phỏng vấn và Checkpoint 2" },
];

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
    service_type_code: "cp1_audit",
    credits_granted: null,
  },
  {
    id: "pkg_tf_audit",
    name: "Kiểm tra chuyên sâu (Legacy)",
    price: 39000,
    features: {
      items: [
        "Supporter (mentor) đánh giá chi tiết",
        "Thời gian SLA phản hồi trong 48h",
        "Mua thêm lượt audit khi cần",
      ],
      sla_hours: 48,
    },
    is_active: false,
    service_type_code: "cp1_audit",
    credits_granted: 2,
  },
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
    service_type_code: "cp1_audit",
    credits_granted: 2,
  },
  {
    id: "pkg_cp2_audit",
    name: "Gói chấm Checkpoint 2",
    price: 79000,
    features: {
      items: [
        "Chấm bảng hỏi phỏng vấn trước khi đi phỏng vấn thật",
        "Chấm toàn bộ Checkpoint 2 theo rubric, kèm trích dẫn từ bài nộp",
        "4 lượt dùng chung cho bảng hỏi và Checkpoint 2",
      ],
      sla_hours: 0,
      mode: "ai_automated",
      auto_delivery: true,
    },
    is_active: true,
    service_type_code: "cp2_audit",
    credits_granted: 4,
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
    service_type_code: "cp1_audit",
    credits_granted: 1,
  },
];

// ---------------------------------------------------------------------------
// Seed function (exported for composition with other seed scripts)
// ---------------------------------------------------------------------------

export async function seedActivePackages(): Promise<void> {
  console.log("🚀 Active packages seed — start\n");

  let created = 0;
  let updated = 0;

  const serviceTypeIds = new Map<string, string>();
  for (const st of SERVICE_TYPES) {
    const row = await prisma.serviceType.upsert({
      where: { code: st.code },
      create: st,
      update: { name: st.name, description: st.description },
    });
    serviceTypeIds.set(st.code, row.id);
  }

  for (const pkg of ACTIVE_PACKAGES) {
    const { id, name, price, features, is_active, credits_granted } = pkg;
    const service_type_id = serviceTypeIds.get(pkg.service_type_code);
    if (!service_type_id) throw new Error(`Unknown service type ${pkg.service_type_code}`);
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
        credits_granted,
        service_type_id,
      },
      update: {
        name,
        price,
        features,
        is_active,
        credits_granted,
        service_type_id,
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
