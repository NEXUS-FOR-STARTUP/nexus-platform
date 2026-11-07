import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

import { prisma } from "../../../db.js";
import { discountCodeStatus } from "../../../modules/orders/application/discount-status.js";
import { listMyDiscountCodesUseCase } from "../../../modules/orders/application/list-my-discount-codes.usecase.js";
import { listDiscountCodesUseCase, createDiscountCodeUseCase } from "../../../modules/admin/application/discount-codes.usecase.js";

const DAY = 86_400_000;
const NOW = new Date("2026-11-10T00:00:00Z");
const base = { max_redemptions: 1, redeemed_count: 0, is_active: true, expires_at: null as Date | null };

const originals = {
  findMany: prisma.discountCode.findMany,
  create: prisma.discountCode.create,
  findUnique: prisma.discountCode.findUnique,
  userFindMany: prisma.user.findMany,
  typeFindUnique: prisma.serviceType.findUnique,
};
const patch = (target: object, key: string, impl: unknown) => Reflect.set(target, key, impl);

let rows: Record<string, unknown>[];
let created = null as Record<string, unknown> | null;

const row = (over: Record<string, unknown>) => ({
  id: "id",
  code: "C",
  percent_off: 40,
  service_type_id: "t1",
  service_type: { code: "ai_audit" },
  created_at: NOW,
  owner_user_id: null,
  case_id: null,
  ...base,
  ...over,
});

beforeEach(() => {
  rows = [];
  created = null;
  patch(prisma.discountCode, "findMany", async () => rows);
  patch(prisma.discountCode, "findUnique", async () => null);
  patch(prisma.discountCode, "create", async ({ data }: { data: Record<string, unknown> }) => {
    created = data;
    return row({ ...data, id: "new" });
  });
  patch(prisma.user, "findMany", async () => [{ id: "u1", email: "a@x.vn" }]);
  patch(prisma.serviceType, "findUnique", async () => ({ id: "t1" }));
});

afterEach(() => {
  patch(prisma.discountCode, "findMany", originals.findMany);
  patch(prisma.discountCode, "create", originals.create);
  patch(prisma.discountCode, "findUnique", originals.findUnique);
  patch(prisma.user, "findMany", originals.userFindMany);
  patch(prisma.serviceType, "findUnique", originals.typeFindUnique);
});

test("status: used beats disabled and expired; boundary expiry counts as expired", () => {
  assert.equal(discountCodeStatus({ ...base }, NOW), "available");
  assert.equal(discountCodeStatus({ ...base, redeemed_count: 1, is_active: false }, NOW), "used");
  assert.equal(discountCodeStatus({ ...base, is_active: false }, NOW), "disabled");
  assert.equal(discountCodeStatus({ ...base, expires_at: new Date(NOW.getTime() - 1) }, NOW), "expired");
  assert.equal(discountCodeStatus({ ...base, expires_at: NOW }, NOW), "expired");
  assert.equal(discountCodeStatus({ ...base, max_redemptions: null, redeemed_count: 99 }, NOW), "available");
});

test("my codes: requires case_id; disabled shows as expired to the user", async () => {
  await assert.rejects(listMyDiscountCodesUseCase("u1", undefined), { code: "INVALID_REQUEST" });
  rows = [row({ code: "A", is_active: false }), row({ code: "B", expires_at: new Date(Date.now() + DAY) })];
  const out = await listMyDiscountCodesUseCase("u1", "case1");
  assert.deepEqual(out.map((c) => [c.code, c.status]), [["A", "expired"], ["B", "available"]]);
  assert.ok(out[1]?.expires_at);
});

test("admin list: summary covers all codes, scope/status only narrow rows, owner email resolved", async () => {
  rows = [
    row({ code: "SHARED", max_redemptions: null }),
    row({ code: "P1", owner_user_id: "u1", case_id: "case1" }),
    row({ code: "P2", owner_user_id: "u1", case_id: "case2", redeemed_count: 1 }),
    row({ code: "OFF", is_active: false }),
  ];
  const all = await listDiscountCodesUseCase();
  assert.deepEqual(all.summary, { total: 4, available: 2, used: 1, expired: 0, disabled: 1, personal_granted: 2, personal_redeemed: 1 });

  const personal = await listDiscountCodesUseCase({ scope: "personal" });
  assert.deepEqual(personal.codes.map((c) => c.code), ["P1", "P2"]);
  assert.equal(personal.codes[0]?.owner_email, "a@x.vn");
  assert.equal(personal.summary.total, 4);

  const used = await listDiscountCodesUseCase({ scope: "all", status: "used" });
  assert.deepEqual(used.codes.map((c) => c.code), ["P2"]);
  const shared = await listDiscountCodesUseCase({ scope: "shared" });
  assert.deepEqual(shared.codes.map((c) => c.code), ["SHARED", "OFF"]);
});

test("admin create: omitted expiry defaults to 30 days, explicit null means never", async () => {
  const expiry = () => created?.["expires_at"] as Date | null | undefined;
  const input = { code: "promo1", percent_off: 20, service_type_id: "t1" };
  await createDiscountCodeUseCase("admin1", input);
  const days = ((expiry()?.getTime() ?? 0) - Date.now()) / DAY;
  assert.ok(days > 29.9 && days <= 30, `got ${days}`);
  await createDiscountCodeUseCase("admin1", { ...input, code: "promo2", expires_at: null });
  assert.equal(expiry(), null);
  const fixed = new Date(Date.now() + 5 * DAY).toISOString();
  await createDiscountCodeUseCase("admin1", { ...input, code: "promo3", expires_at: fixed });
  assert.equal(expiry()?.toISOString(), fixed);
});
