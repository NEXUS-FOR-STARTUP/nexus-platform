import assert from "node:assert/strict";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db.js";
import { AppError } from "../../domain/app-error.js";
import { walletService } from "../../../modules/wallet/application/wallet.service.js";

export const REQUEST_KEY = "7b1d9c2e-4f3a-4e8b-9a61-0c5d2f7e8a10";

const PKG = {
  id: "pkg_ai_audit",
  is_active: true,
  price: 79_000,
  credits_granted: 2,
  service_type: { id: "st-cp1", code: "cp1_audit" },
  pricing_tiers: [{ price: 79_000 }],
};

interface Rec {
  id: string;
  code: string;
  request_key: string;
  amount_due: number;
  order_id: string | null;
  grant_tx_id: string | null;
  customer_name: string;
  customer_contact: string;
  customer_phone: string | null;
  customer_email: string | null;
  case_id: string | null;
  due_at: Date;
  created_at: Date;
  review_reason: null;
  public_token_hash: null;
  payments: [];
  adjustments: [];
  case: { case_code: string } | null;
}

/** Mutable world the fakes read and write; tests inspect it after each call. */
export const world: {
  receivables: Rec[];
  calls: string[];
  ledger: { metadata_json: Record<string, unknown>; type: string; amount: number }[];
  orderCreates: number;
  systemUser: { id: string; email: string; name: string | null } | null;
  caseOwner: string;
  /** `content.contact` of the case's first intake unit; null = no intake unit. */
  contact: Record<string, string> | null;
  caseMissing: boolean;
} = { receivables: [], calls: [], ledger: [], orderCreates: 0, systemUser: null, caseOwner: "op-1", contact: null, caseMissing: false };

export const GOOD_CONTACT = { full_name: "Nguyen Van A", zalo: "0909000111", email: "a@fpt.edu.vn", student_code: "SE12345", team_role: "Leader", telegram: "" };

const saved = {
  tx: prisma.$transaction,
  recFind: prisma.receivable.findUnique,
  userFirst: prisma.user.findFirst,
  caseFind: prisma.case.findUnique,
  unitFirst: prisma.lifecycleUnit.findFirst,
  pkgFind: prisma.servicePackage.findUnique,
  orderFind: prisma.order.findUnique,
  grant: walletService.grant,
  withdraw: walletService.withdraw,
};

function makeTx(): Prisma.TransactionClient {
  const tx = {
    $queryRaw: async () => [],
    receivable: {
      create: async ({ data }: { data: Partial<Rec> }) => {
        const rec = {
          id: `rec-${world.receivables.length + 1}`,
          order_id: null,
          grant_tx_id: null,
          review_reason: null,
          public_token_hash: null,
          payments: [],
          adjustments: [],
          created_at: new Date(),
          case: { case_code: "C-1" },
          ...data,
        } as Rec;
        world.receivables.push(rec);
        return { id: rec.id };
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<Rec> }) => {
        Object.assign(world.receivables.find((r) => r.id === where.id)!, data);
      },
    },
    order: {
      create: async () => {
        world.orderCreates++;
        world.calls.push("order.create");
        return { id: "order-1", items: [] };
      },
      update: async () => ({}),
    },
    creditLedger: {
      findMany: async () => world.ledger,
      aggregate: async () => ({ _sum: { amount: 0 } }),
      create: async ({ data }: { data: { metadata_json: Record<string, unknown> } }) => {
        world.calls.push("ledger.create");
        world.ledger.push({ metadata_json: data.metadata_json, type: "purchase", amount: 2 });
      },
    },
    case: {
      findUnique: async () => ({
        owner_auth_user_id: world.caseOwner,
        internal_status: "triage_pending",
        package_id: "pkg_tf_free",
        locked_price: 0,
      }),
      update: async () => ({}),
    },
    caseEvent: { create: async () => ({}) },
    domainEventOutbox: { create: async () => ({}) },
  };
  // The fake implements only the delegates the code under test calls.
  return tx as unknown as Prisma.TransactionClient;
}

export function installCreateFakes(): void {
  delete process.env["DUAL_WRITE_PAYMENT"];
  Object.assign(world, { receivables: [], calls: [], ledger: [], orderCreates: 0, caseOwner: "op-1", contact: { ...GOOD_CONTACT }, caseMissing: false });
  world.systemUser = { id: "op-1", email: "team@nexus.test", name: "Đội ngũ Nexus" };
  process.env["RECEIVABLE_SYSTEM_USER_EMAIL"] = "team@nexus.test";

  Reflect.set(prisma, "$transaction", async (cb: (tx: Prisma.TransactionClient) => unknown) => {
    const snapshot = [world.receivables.length, world.ledger.length] as const;
    try {
      return await cb(makeTx());
    } catch (error) {
      world.receivables.length = snapshot[0]; // rollback like Postgres would
      world.ledger.length = snapshot[1];
      throw error;
    }
  });
  Reflect.set(prisma.receivable, "findUnique", async ({ where }: { where: { id?: string; request_key?: string } }) =>
    world.receivables.find((r) => (where.id && r.id === where.id) || (where.request_key && r.request_key === where.request_key)) ?? null);
  Reflect.set(prisma.user, "findFirst", async () => world.systemUser);
  Reflect.set(prisma.case, "findUnique", async () => (world.caseMissing ? null : { owner_auth_user_id: world.caseOwner }));
  Reflect.set(prisma.lifecycleUnit, "findFirst", async () =>
    world.contact ? { content: JSON.stringify({ contact: world.contact }) } : null);
  Reflect.set(prisma.servicePackage, "findUnique", async () => PKG);
  Reflect.set(prisma.order, "findUnique", async () => ({
    user_id: "op-1",
    items: [{ package_id: "pkg_ai_audit", quantity: 1, metadata_json: { case_id: "case-1", manual_trigger: true } }],
  }));
  Reflect.set(walletService, "grant", async (_user: string, amount: number) => {
    world.calls.push(`grant:${amount}`);
    return { id: "grant-tx-1" };
  });
  Reflect.set(walletService, "withdraw", async (_user: string, amount: number) => {
    world.calls.push(`withdraw:${amount}`);
  });
}

export function restoreCreateFakes(): void {
  Reflect.set(prisma, "$transaction", saved.tx);
  Reflect.set(prisma.receivable, "findUnique", saved.recFind);
  Reflect.set(prisma.user, "findFirst", saved.userFirst);
  delete process.env["RECEIVABLE_SYSTEM_USER_EMAIL"];
  Reflect.set(prisma.case, "findUnique", saved.caseFind);
  Reflect.set(prisma.lifecycleUnit, "findFirst", saved.unitFirst);
  Reflect.set(prisma.servicePackage, "findUnique", saved.pkgFind);
  Reflect.set(prisma.order, "findUnique", saved.orderFind);
  Reflect.set(walletService, "grant", saved.grant);
  Reflect.set(walletService, "withdraw", saved.withdraw);
}

export const body = (over: Record<string, unknown> = {}) => ({
  request_key: REQUEST_KEY,
  case_id: "case-1",
  amount_due: 79_000,
  due_at: "2026-10-20T00:00:00.000Z",
  purchase: { package_id: "pkg_ai_audit", quantity: 1 },
  ...over,
});

export const rejectsWith = (p: Promise<unknown>, status: number) =>
  assert.rejects(p, (e: unknown) => e instanceof AppError && e.status === status);
