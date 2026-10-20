import { test } from "node:test";
import assert from "node:assert";
import { resolveWalletDetails } from "../../../modules/wallet/application/describe-wallet-history.js";
import { describeTransaction } from "../../../modules/wallet/domain/wallet-display.constants.js";

process.env.NODE_ENV = "test";

interface FakeData {
  orders?: Array<{ id: string; items: Array<{ quantity: number; package: { name: string } | null }> }>;
  ledgers?: Array<{ reference_id: string; case: { team_name: string | null; case_code: string } }>;
  cases?: Array<{ id: string; team_name: string | null; case_code: string }>;
}

function fakeDb(data: FakeData) {
  const calls = { order: 0, creditLedger: 0, case: 0 };
  const db = {
    order: { findMany: async () => (calls.order++, data.orders ?? []) },
    creditLedger: { findMany: async () => (calls.creditLedger++, data.ledgers ?? []) },
    case: { findMany: async () => (calls.case++, data.cases ?? []) },
  };
  return { db: db as any, calls };
}

const row = (id: string, type: string, source_type: string | null, source_id: string | null) => ({ id, type, source_type, source_id });

test("empty page issues no queries", async () => {
  const { db, calls } = fakeDb({});
  assert.strictEqual((await resolveWalletDetails([], db)).size, 0);
  assert.deepStrictEqual(calls, { order: 0, creditLedger: 0, case: 0 });
});

test("deposit rows are untouched and trigger no queries", async () => {
  const { db, calls } = fakeDb({});
  const out = await resolveWalletDetails([row("t1", "deposit", "deposit", "d1")], db);
  assert.strictEqual(out.size, 0);
  assert.strictEqual(calls.order + calls.case, 0);
  assert.match(describeTransaction("deposit", 100000, out.get("t1")), /^Nạp tiền qua chuyển khoản ngân hàng \(\+100\.000 VND\)$/);
});

test("order debit names package, quantity and every project it funded", async () => {
  const { db } = fakeDb({
    orders: [{ id: "o1", items: [{ quantity: 1, package: { name: "Gói Thị trường" } }, { quantity: 2, package: { name: "Gói Ý tưởng" } }] }],
    ledgers: [{ reference_id: "o1", case: { team_name: "Alpha", case_code: "NX-1" } }, { reference_id: "o1", case: { team_name: "Beta", case_code: "NX-2" } }, { reference_id: "o1", case: { team_name: "Alpha", case_code: "NX-1" } }],
  });
  const out = await resolveWalletDetails([row("t1", "withdrawal", "order", "o1")], db);
  assert.strictEqual(out.get("t1"), "Mua Gói Thị trường ×1, Gói Ý tưởng ×2 cho dự án Alpha (NX-1), dự án Beta (NX-2)");
  assert.match(describeTransaction("order", -79000, out.get("t1")), /\(-79\.000 VND\)$/);
});

test("missing package, missing ledger and unnamed project degrade gracefully", async () => {
  const { db } = fakeDb({
    orders: [{ id: "o1", items: [{ quantity: 1, package: null }] }, { id: "o2", items: [{ quantity: 1, package: { name: "G" } }] }],
    ledgers: [{ reference_id: "o1", case: { team_name: "  ", case_code: "NX-3" } }],
  });
  const out = await resolveWalletDetails([row("a", "withdrawal", "order", "o1"), row("b", "withdrawal", "order", "o2"), row("c", "withdrawal", "order", "gone")], db);
  assert.strictEqual(out.get("a"), "Mua gói dịch vụ ×1 cho dự án chưa đặt tên (NX-3)");
  assert.strictEqual(out.get("b"), "Mua G ×1");
  assert.strictEqual(out.has("c"), false);
  assert.strictEqual(describeTransaction("order", -1, out.get("c")), "Thanh toán đơn hàng (-1 VND)");
});

test("refund names the project; unknown case falls back to generic label", async () => {
  const { db } = fakeDb({ cases: [{ id: "c1", team_name: "Alpha", case_code: "NX-1" }] });
  const out = await resolveWalletDetails([row("r1", "refund", "case_refund", "c1"), row("r2", "refund", "case_refund", "zzz")], db);
  assert.strictEqual(out.get("r1"), "Hoàn tiền cho dự án Alpha (NX-1)");
  assert.strictEqual(out.has("r2"), false);
  assert.strictEqual(describeTransaction("case_refund", 79000, out.get("r2")), "Hoàn tiền vào ví (+79.000 VND)");
});
