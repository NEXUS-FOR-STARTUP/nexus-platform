import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../../db.js";
import { getAdminStatsUseCase } from "../../../modules/admin/application/get-admin-stats.usecase.js";

test("admin stats revenue uses paid orders, not legacy payments", async () => {
  const client = prisma as unknown as {
    case: { count: (...args: unknown[]) => Promise<number>; groupBy: (...args: unknown[]) => Promise<unknown[]>; findMany: (...args: unknown[]) => Promise<unknown[]> };
    user: { findMany: (...args: unknown[]) => Promise<unknown[]> };
    order: {
      aggregate: (...args: unknown[]) => Promise<unknown>;
      findMany: (...args: unknown[]) => Promise<unknown[]>;
    };
    payment: { aggregate: (...args: unknown[]) => Promise<unknown>; findMany: (...args: unknown[]) => Promise<unknown[]> };
  };

  const original = {
    caseCount: client.case.count,
    caseGroupBy: client.case.groupBy,
    caseFindMany: client.case.findMany,
    userFindMany: client.user.findMany,
    orderFindMany: client.order.findMany,
    paymentAggregate: client.payment.aggregate,
    paymentFindMany: client.payment.findMany,
  };

  const paidAmount = 39000;
  const paidOrderDate = new Date();
  const oldPaidOrderDate = new Date(paidOrderDate.getTime() - 10 * 24 * 60 * 60 * 1000);
  const orderRows = [
    { status: "paid", total_amount: paidAmount, created_at: paidOrderDate },
    { status: "paid", total_amount: 500000, created_at: oldPaidOrderDate },
    { status: "pending", total_amount: 100000, created_at: paidOrderDate },
    { status: "refunded", total_amount: 200000, created_at: paidOrderDate },
  ];
  client.case.count = async () => 0;
  client.case.groupBy = async (args: unknown) => {
    const query = args as { by?: string[] };
    if (query.by?.includes("package_id")) return [];
    return [];
  };
  client.case.findMany = async () => [];
  client.user.findMany = async () => [];
  client.order.aggregate = async (args: unknown) => {
    const query = args as { where?: { status?: string }; _sum?: { total_amount?: boolean } };
    assert.equal(query.where?.status, "paid");
    assert.equal(query._sum?.total_amount, true);
    return {
      _sum: {
        total_amount: orderRows
          .filter((order) => order.status === "paid")
          .reduce((sum, order) => sum + order.total_amount, 0),
      },
    };
  };
  client.order.findMany = async (args: unknown) => {
    const query = args as { where?: { status?: string; created_at?: { gte?: Date } }; select?: Record<string, boolean> };
    assert.equal(query.where?.status, "paid");
    assert.ok(query.where?.created_at?.gte instanceof Date);
    assert.equal(query.select?.total_amount, true);
    assert.equal(query.select?.created_at, true);
    const earliestDate = query.where?.created_at?.gte;
    return orderRows.filter(
      (order) => order.status === "paid" && (!earliestDate || order.created_at >= earliestDate),
    );
  };
  client.payment.aggregate = async () => {
    throw new Error("legacy payments must not be queried");
  };
  client.payment.findMany = async () => {
    throw new Error("legacy payments must not be queried");
  };

  try {
    const result = await getAdminStatsUseCase("7d");
    assert.equal(result.totalRevenue, paidAmount + 500000);
    assert.equal(result.revenueTrend.length, 7);
    assert.equal(result.revenueTrend.reduce((sum, point) => sum + point.revenue, 0), paidAmount);
    assert.equal(result.revenueTrend.reduce((sum, point) => sum + point.transactions, 0), 1);
    assert.equal(result.revenueTrend.filter((point) => point.revenue === 0).length, 6);
  } finally {
    client.case.count = original.caseCount;
    client.case.groupBy = original.caseGroupBy;
    client.case.findMany = original.caseFindMany;
    client.user.findMany = original.userFindMany;
    client.order.findMany = original.orderFindMany;
    client.payment.aggregate = original.paymentAggregate;
    client.payment.findMany = original.paymentFindMany;
  }
});
