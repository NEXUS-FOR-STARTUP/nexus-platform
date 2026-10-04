import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  applyPaidCreditCaseUpdate,
  generateOrderIdempotencyKey,
  FREE_PACKAGE_KEY,
  AUDIT_PACKAGE_KEY,
} from "../../../modules/orders/application/credit-audit-order.helpers.js";

process.env.NODE_ENV = "test";

// ---------------------------------------------------------------------------
// 1. applyPaidCreditCaseUpdate logic
// ---------------------------------------------------------------------------

await test("applyPaidCreditCaseUpdate - FREE case upgrades to audit and creates event", async () => {
  const caseUpdates: any[] = [];
  const caseEvents: any[] = [];

  const fakeTx: any = {
    case: {
      update: async (args: any) => {
        caseUpdates.push(args);
        return args;
      },
    },
    caseEvent: {
      create: async (args: any) => {
        caseEvents.push(args);
        return args;
      },
    },
  };

  const caseRecord = {
    owner_auth_user_id: "user-1",
    internal_status: "triage_pending",
    package_id: FREE_PACKAGE_KEY,
    locked_price: 0,
  };

  await applyPaidCreditCaseUpdate(fakeTx, {
    caseId: "case-1",
    userId: "user-1",
    unitPrice: 579000,
    caseRecord,
  });

  assert.strictEqual(caseUpdates.length, 1);
  assert.deepStrictEqual(caseUpdates[0], {
    where: { id: "case-1" },
    data: {
      payment_status: "paid",
      package_id: AUDIT_PACKAGE_KEY,
      locked_price: 579000,
    },
  });

  assert.strictEqual(caseEvents.length, 1);
  assert.deepStrictEqual(caseEvents[0], {
    data: {
      case: { connect: { id: "case-1" } },
      actor: { connect: { id: "user-1" } },
      event_type: "package_upgraded",
      metadata_json: {
        from: FREE_PACKAGE_KEY,
        to: AUDIT_PACKAGE_KEY,
        locked_price: 579000,
      },
    },
  });
});

await test("applyPaidCreditCaseUpdate - case with locked_price === 0 upgrades even if other package_id", async () => {
  const caseUpdates: any[] = [];
  const caseEvents: any[] = [];

  const fakeTx: any = {
    case: {
      update: async (args: any) => {
        caseUpdates.push(args);
        return args;
      },
    },
    caseEvent: {
      create: async (args: any) => {
        caseEvents.push(args);
        return args;
      },
    },
  };

  const caseRecord = {
    owner_auth_user_id: "user-1",
    internal_status: "triage_pending",
    package_id: "pkg_custom",
    locked_price: 0,
  };

  await applyPaidCreditCaseUpdate(fakeTx, {
    caseId: "case-2",
    userId: "user-1",
    unitPrice: 579000,
    caseRecord,
  });

  assert.strictEqual(caseUpdates.length, 1);
  assert.strictEqual(caseUpdates[0].data.package_id, AUDIT_PACKAGE_KEY);
  assert.strictEqual(caseUpdates[0].data.locked_price, 579000);
  assert.strictEqual(caseEvents.length, 1);
  assert.strictEqual(caseEvents[0].data.event_type, "package_upgraded");
});

await test("applyPaidCreditCaseUpdate - already paid/audit case does NOT upgrade or create event", async () => {
  const caseUpdates: any[] = [];
  const caseEvents: any[] = [];

  const fakeTx: any = {
    case: {
      update: async (args: any) => {
        caseUpdates.push(args);
        return args;
      },
    },
    caseEvent: {
      create: async (args: any) => {
        caseEvents.push(args);
        return args;
      },
    },
  };

  const caseRecord = {
    owner_auth_user_id: "user-1",
    internal_status: "triage_pending",
    package_id: AUDIT_PACKAGE_KEY,
    locked_price: 579000,
  };

  await applyPaidCreditCaseUpdate(fakeTx, {
    caseId: "case-3",
    userId: "user-1",
    unitPrice: 579000,
    caseRecord,
  });

  assert.strictEqual(caseUpdates.length, 1);
  assert.deepStrictEqual(caseUpdates[0], {
    where: { id: "case-3" },
    data: {
      payment_status: "paid",
    },
  });

  assert.strictEqual(caseEvents.length, 0);
});

// ---------------------------------------------------------------------------
// 2. generateOrderIdempotencyKey
// ---------------------------------------------------------------------------

await test("generateOrderIdempotencyKey - produces stable hash key", () => {
  const key1 = generateOrderIdempotencyKey("user-1", [
    { service_type: "credit_audit", quantity: 1, metadata_json: { case_id: "case-1" } },
  ]);
  const key2 = generateOrderIdempotencyKey("user-1", [
    { service_type: "credit_audit", quantity: 1, metadata_json: { case_id: "case-1" } },
  ]);
  assert.strictEqual(key1, key2);
  assert.ok(key1.startsWith("order-user-1-"));
});

// ---------------------------------------------------------------------------
// 3. Invariant: CreditQuantityModal does not pre-upgrade
// ---------------------------------------------------------------------------

await test("invariant: CreditQuantityModal does not call upgrade-package", () => {
  const modalPath = fileURLToPath(
    new URL(
      "../../../../../web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx",
      import.meta.url,
    ),
  );
  const content = readFileSync(modalPath, "utf8");
  assert.strictEqual(content.includes("/upgrade-package"), false);
  assert.strictEqual(content.includes("currentPackageId"), false);
});
