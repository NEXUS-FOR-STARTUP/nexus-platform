import { prisma } from "../../../db.js";
import type { AdminStatsResponse, RevenueTrendPoint, CaseTrendPoint } from "./admin-stats.dto.js";

interface Bucket {
  label: string;
  startDate: Date;
  endDate: Date;
  revenue: number;
  transactions: number;
  free: number;
  paid: number;
}

function generateBuckets(period: string): Bucket[] {
  const buckets: Bucket[] = [];
  const now = new Date();

  if (period === "7d" || period === "30d") {
    const days = period === "7d" ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const endDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const dayStr = String(d.getDate()).padStart(2, "0");
      const monthStr = String(d.getMonth() + 1).padStart(2, "0");
      buckets.push({
        label: `${dayStr}/${monthStr}`,
        startDate,
        endDate,
        revenue: 0,
        transactions: 0,
        free: 0,
        paid: 0,
      });
    }
  } else if (period === "month") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthStr = String(d.getMonth() + 1).padStart(2, "0");
      const yearShort = String(d.getFullYear()).slice(-2);
      buckets.push({
        label: `T${monthStr}/${yearShort}`,
        startDate,
        endDate,
        revenue: 0,
        transactions: 0,
        free: 0,
        paid: 0,
      });
    }
  } else if (period === "semester") {
    // 3 Semesters per year: Spring (Jan-Apr), Summer (May-Aug), Fall (Sep-Dec)
    // Build 6 past semesters
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    let currentSemIdx = currentMonth <= 4 ? 0 : currentMonth <= 8 ? 1 : 2; // 0: Spring, 1: Summer, 2: Fall

    const semNames = ["Spring", "Summer", "Fall"];
    const semRanges = [
      { startM: 0, endM: 3 },  // Jan-Apr
      { startM: 4, endM: 7 },  // May-Aug
      { startM: 8, endM: 11 }, // Sep-Dec
    ];

    for (let i = 5; i >= 0; i--) {
      let semIdx = currentSemIdx - i;
      let yr = currentYear;
      while (semIdx < 0) {
        semIdx += 3;
        yr -= 1;
      }
      const range = semRanges[semIdx];
      const startDate = new Date(yr, range.startM, 1, 0, 0, 0, 0);
      const endDate = new Date(yr, range.endM + 1, 0, 23, 59, 59, 999);
      buckets.push({
        label: `${semNames[semIdx]} ${yr}`,
        startDate,
        endDate,
        revenue: 0,
        transactions: 0,
        free: 0,
        paid: 0,
      });
    }
  } else if (period === "quarter") {
    // 4 Quarters per year: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let currentQIdx = Math.floor(currentMonth / 3);

    const qRanges = [
      { startM: 0, endM: 2 },
      { startM: 3, endM: 5 },
      { startM: 6, endM: 8 },
      { startM: 9, endM: 11 },
    ];

    for (let i = 5; i >= 0; i--) {
      let qIdx = currentQIdx - i;
      let yr = currentYear;
      while (qIdx < 0) {
        qIdx += 4;
        yr -= 1;
      }
      const range = qRanges[qIdx];
      const startDate = new Date(yr, range.startM, 1, 0, 0, 0, 0);
      const endDate = new Date(yr, range.endM + 1, 0, 23, 59, 59, 999);
      const yrShort = String(yr).slice(-2);
      buckets.push({
        label: `Q${qIdx + 1}/${yrShort}`,
        startDate,
        endDate,
        revenue: 0,
        transactions: 0,
        free: 0,
        paid: 0,
      });
    }
  } else if (period === "year") {
    const currentYear = now.getFullYear();
    for (let i = 4; i >= 0; i--) {
      const yr = currentYear - i;
      const startDate = new Date(yr, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(yr, 11, 31, 23, 59, 59, 999);
      buckets.push({
        label: `${yr}`,
        startDate,
        endDate,
        revenue: 0,
        transactions: 0,
        free: 0,
        paid: 0,
      });
    }
  } else {
    // Default 30d
    return generateBuckets("30d");
  }

  return buckets;
}

export async function getAdminStatsUseCase(period: string = "30d"): Promise<AdminStatsResponse> {
  // 1. Total cases
  const totalCases = await prisma.case.count();

  // 2. Cases by package_id — free vs paid
  const packageGroups = await prisma.case.groupBy({
    by: ["package_id"],
    _count: true,
  });

  let freeCases = 0;
  let paidCases = 0;
  for (const g of packageGroups) {
    if (!g.package_id || g.package_id === "pkg_tf_free") {
      freeCases += g._count;
    } else {
      paidCases += g._count;
    }
  }

  // 3. Conversion rate
  const nonIntakeCount = await prisma.case.count({
    where: { user_facing_stage: { notIn: ["intake_pending", "intake_ready"] } },
  });
  const conversionRate =
    nonIntakeCount > 0
      ? Math.round((paidCases / nonIntakeCount) * 100 * 100) / 100
      : 0;

  // 4. Total revenue from paid payments
  const revenueAgg = await prisma.payment.aggregate({
    where: { status: "paid" },
    _sum: { amount: true },
  });
  const totalRevenue = revenueAgg._sum.amount ?? 0;

  // 5. SLA breach
  const slaBreachCount = 0;

  // 6. Cases by stage
  const stageGroups = await prisma.case.groupBy({
    by: ["user_facing_stage"],
    _count: true,
  });
  const casesByStage: Record<string, number> = {};
  for (const g of stageGroups) {
    casesByStage[g.user_facing_stage] = g._count;
  }

  // 7. Supporter workload
  const supporterGroups = await prisma.case.groupBy({
    by: ["assigned_supporter_auth_user_id"],
    _count: true,
  });

  const assignedIds = supporterGroups
    .map((g) => g.assigned_supporter_auth_user_id)
    .filter((id): id is string => id !== null);

  const supporters =
    assignedIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: assignedIds } },
          select: { id: true, name: true },
        })
      : [];

  const nameMap = new Map(supporters.map((s) => [s.id, s.name]));

  const supporterWorkload = supporterGroups
    .filter((g) => g.assigned_supporter_auth_user_id !== null)
    .map((g) => ({
      supporterId: g.assigned_supporter_auth_user_id!,
      name: nameMap.get(g.assigned_supporter_auth_user_id!) ?? "Unknown",
      caseCount: g._count,
    }));

  // 8. Timeframe Buckets & Zero-Filled Trends
  const buckets = generateBuckets(period);
  const earliestDate = buckets[0].startDate;

  // Fetch paid payments since earliestDate
  const payments = await prisma.payment.findMany({
    where: {
      status: "paid",
      created_at: { gte: earliestDate },
    },
    select: {
      amount: true,
      created_at: true,
    },
  });

  // Fetch cases created since earliestDate
  const cases = await prisma.case.findMany({
    where: {
      created_at: { gte: earliestDate },
    },
    select: {
      package_id: true,
      created_at: true,
    },
  });

  // Fill buckets
  for (const p of payments) {
    const pTime = new Date(p.created_at).getTime();
    for (const b of buckets) {
      if (pTime >= b.startDate.getTime() && pTime <= b.endDate.getTime()) {
        b.revenue += p.amount;
        b.transactions += 1;
        break;
      }
    }
  }

  for (const c of cases) {
    const cTime = new Date(c.created_at).getTime();
    for (const b of buckets) {
      if (cTime >= b.startDate.getTime() && cTime <= b.endDate.getTime()) {
        if (!c.package_id || c.package_id === "pkg_tf_free") {
          b.free += 1;
        } else {
          b.paid += 1;
        }
        break;
      }
    }
  }

  const revenueTrend: RevenueTrendPoint[] = buckets.map((b) => ({
    label: b.label,
    revenue: b.revenue,
    transactions: b.transactions,
  }));

  const caseTrend: CaseTrendPoint[] = buckets.map((b) => ({
    label: b.label,
    free: b.free,
    paid: b.paid,
  }));

  // Legacy fallback for backward compatibility
  const revenueByMonth = revenueTrend.map((r) => ({
    month: r.label,
    revenue: r.revenue,
  }));

  return {
    totalCases,
    freeCases,
    paidCases,
    conversionRate,
    totalRevenue,
    slaBreachCount,
    casesByStage,
    supporterWorkload,
    revenueByMonth,
    revenueTrend,
    caseTrend,
    period,
  };
}
