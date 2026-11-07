import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

import { prisma } from "../../../db.js";
import { AppError } from "../../domain/app-error.js";
import { DOMAIN_EVENTS, type DomainEvent } from "../../domain/domain-events.js";
import { grantFirstPurchaseCodes } from "../../../modules/orders/application/first-purchase-discount.listener.js";
import { resolveDiscountCode, applyPercentOff } from "../../../modules/orders/application/discount.helpers.js";
import { renderTemplate } from "../../../modules/notifications/application/notification-templates.js";
import { channelsFor } from "../../../modules/notifications/application/recipients.js";

const originals = {
  tx: prisma.$transaction,
  redemption: prisma.discountRedemption.findUnique,
  types: prisma.serviceType.findMany,
  codeFind: prisma.discountCode.findUnique,
};
const patch = (target: object, key: string, impl: unknown) => Reflect.set(target, key, impl);

type Row = Record<string, unknown>;
let codes: Row[];
let outbox: { event_type: string; payload_json: Row }[];
let redeemed: boolean;

beforeEach(() => {
  codes = [];
  outbox = [];
  redeemed = false;
  patch(prisma.discountRedemption, "findUnique", async () => (redeemed ? { id: "r" } : null));
  patch(prisma.serviceType, "findMany", async () => [{ id: "st-cp2", code: "cp2_audit" }]);
  patch(prisma.discountCode, "findUnique", async ({ where }: { where: { code: string } }) =>
    codes.find((c) => c["code"] === where.code) ?? null);
  patch(prisma, "$transaction", async (cb: (tx: unknown) => Promise<unknown>) =>
    cb({
      discountCode: {
        // Mirrors Postgres: both the code and the (owner, case, service) key are unique.
        createMany: async ({ data }: { data: Row[] }) => {
          const fresh = data.filter(
            (d) =>
              !codes.some(
                (c) =>
                  c["code"] === d["code"] ||
                  (c["owner_user_id"] === d["owner_user_id"] &&
                    c["case_id"] === d["case_id"] &&
                    c["service_type_id"] === d["service_type_id"]),
              ),
          );
          codes.push(...fresh.map((d) => ({ is_active: true, redeemed_count: 0, expires_at: null, ...d, id: String(d["code"]) })));
          return { count: fresh.length };
        },
      },
      domainEventOutbox: { create: async ({ data }: { data: (typeof outbox)[number] }) => void outbox.push(data) },
    }));
});

afterEach(() => {
  patch(prisma, "$transaction", originals.tx);
  patch(prisma.discountRedemption, "findUnique", originals.redemption);
  patch(prisma.serviceType, "findMany", originals.types);
  patch(prisma.discountCode, "findUnique", originals.codeFind);
});

const paid = (opts: { userId?: string; caseId?: string; totalAmount?: number; funded?: boolean } = {}): DomainEvent => ({
  eventId: "e1",
  type: DOMAIN_EVENTS.ORDER_PAID,
  actorId: null,
  occurredAt: new Date(),
  payload: {
    userId: opts.userId ?? "u1",
    orderId: "o1",
    totalAmount: opts.totalAmount ?? 49000,
    ...(opts.funded !== undefined ? { funded: opts.funded } : {}),
    items: [{ service_type: "cp2_audit", metadata_json: { case_id: opts.caseId ?? "c1" } }],
  },
});

test("first paid order mints one personal 40% single-use code bound to user, project, service", async () => {
  await grantFirstPurchaseCodes(paid());
  assert.equal(codes.length, 1);
  const c = codes[0]!;
  assert.equal(c["percent_off"], 40);
  assert.equal(c["max_redemptions"], 1);
  assert.deepEqual([c["owner_user_id"], c["case_id"], c["service_type_id"]], ["u1", "c1", "st-cp2"]);
  assert.match(String(c["code"]), /^[0-9A-HJKMNP-TV-Z]{8}$/);
  assert.equal(applyPercentOff(49000, 40), 29400);
  const days = ((c["expires_at"] as Date).getTime() - Date.now()) / 86_400_000;
  assert.ok(days > 29.9 && days <= 30, `expiry ${days} days`);

  assert.equal(outbox.length, 1);
  assert.equal(outbox[0]!.event_type, "discount.granted");
  // caseId would make resolveRecipients email every case member; the code belongs to the buyer only.
  assert.equal(outbox[0]!.payload_json["userId"], "u1");
  assert.equal("caseId" in outbox[0]!.payload_json, false);
  assert.equal(outbox[0]!.payload_json["expiresAt"], (c["expires_at"] as Date).toISOString());
});

test("replayed ORDER_PAID or another full-price order in the same project mints nothing more", async () => {
  await grantFirstPurchaseCodes(paid());
  await grantFirstPurchaseCodes(paid());
  assert.equal(codes.length, 1);
  assert.equal(outbox.length, 1);
});

test("a different project of the same user earns its own code", async () => {
  await grantFirstPurchaseCodes(paid());
  await grantFirstPurchaseCodes(paid({ caseId: "c2" }));
  assert.equal(codes.length, 2);
  assert.notEqual(codes[0]!["code"], codes[1]!["code"]);
});

test("order that used a discount, or moved no money, gets no code", async () => {
  redeemed = true;
  await grantFirstPurchaseCodes(paid());
  redeemed = false;
  await grantFirstPurchaseCodes(paid({ totalAmount: 0 }));
  assert.equal(codes.length, 0);
  assert.equal(outbox.length, 0);
});

test("sponsored (funded) order mints nothing for the system account", async () => {
  await grantFirstPurchaseCodes(paid({ funded: true }));
  assert.equal(codes.length, 0);
  assert.equal(outbox.length, 0);
});

test("granted code works only for its owner, project and service", async () => {
  await grantFirstPurchaseCodes(paid());
  const code = String(codes[0]!["code"]);
  const mine = [{ serviceTypeId: "st-cp2", caseId: "c1" }];

  assert.equal((await resolveDiscountCode(code.toLowerCase(), "u1", mine)).percentOff, 40);

  const refuse = (userId: string, targets: { serviceTypeId: string; caseId: string | null }[]) =>
    assert.rejects(resolveDiscountCode(code, userId, targets), (e: unknown) => e instanceof AppError && e.code === "DISCOUNT_INVALID");
  await refuse("u2", mine);
  await refuse("u1", [{ serviceTypeId: "st-cp2", caseId: "c2" }]);
  await refuse("u1", [{ serviceTypeId: "st-cp2", caseId: null }]);
  await refuse("u1", [{ serviceTypeId: "st-cp1", caseId: "c1" }]);
});

test("notification: in-app + email, stage-named copy, link carries the code", async () => {
  await grantFirstPurchaseCodes(paid());
  const payload = outbox[0]!.payload_json;
  const r = renderTemplate("discount.granted", payload, "student");
  assert.match(r.body!, /tặng mã giảm giá 40% cho lần mua lượt tiếp theo của dịch vụ Gói chấm Thị trường/);
  assert.ok(r.body!.includes(String(payload["code"])));
  assert.equal(r.link, `/dashboard/case/c1?tab=billing&code=${payload["code"]}`);
  assert.deepEqual(channelsFor("discount.granted", "student"), ["in_app", "email"]);
});
