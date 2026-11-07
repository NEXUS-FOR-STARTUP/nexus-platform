import { test } from "node:test";
import assert from "node:assert/strict";

import { applyPackagePrice, type PriceHistoryClient } from "../../../modules/packages/application/package-price-history.js";

type Tier = { id: string; package_id: string; price: number; is_current: boolean; previous_price: number | null; changed_by: string | null; changed_at: Date | null };
type Pkg = { id: string; price: number; previous_price: number | null; last_price_changed_at: Date | null; last_price_changed_by: string | null; created_at: Date };

/** In-memory stand-in for the two Prisma delegates the writer uses. */
function fakeDb(pkg: Pkg, tiers: Tier[] = []): { tx: PriceHistoryClient; pkg: Pkg; tiers: Tier[] } {
  let seq = tiers.length;
  const tx = {
    servicePackage: {
      findUniqueOrThrow: async () => ({ ...pkg, pricing_tiers: tiers.filter((t) => t.is_current).slice(0, 1) }),
      update: async ({ data }: { data: Partial<Pkg> }) => void Object.assign(pkg, data),
    },
    servicePricing: {
      update: async ({ where, data }: { where: { id: string }; data: Partial<Tier> }) =>
        void Object.assign(tiers.find((t) => t.id === where.id)!, data),
      create: async ({ data }: { data: Partial<Tier> & { package_id: string; price: number } }) =>
        void tiers.push({ id: `t${++seq}`, is_current: true, previous_price: null, changed_by: null, changed_at: null, ...data }),
    },
  } as unknown as PriceHistoryClient;
  return { tx, pkg, tiers };
}

const created = new Date("2026-07-25T00:00:00Z");
const basePkg = (): Pkg => ({ id: "p1", price: 79000, previous_price: null, last_price_changed_at: null, last_price_changed_by: null, created_at: created });

test("first change keeps the old column price as baseline, then a current row", async () => {
  const db = fakeDb(basePkg());
  assert.equal(await applyPackagePrice(db.tx, { packageId: "p1", price: 49000, changedBy: null }), true);

  assert.deepEqual(db.tiers.map((t) => [t.price, t.is_current, t.previous_price]), [[79000, false, null], [49000, true, 79000]]);
  assert.equal(db.tiers[0]!.changed_at, created);
  assert.deepEqual([db.pkg.price, db.pkg.previous_price], [49000, 79000]);
});

test("same price writes nothing; the current tier wins over a stale column", async () => {
  const same = fakeDb(basePkg());
  assert.equal(await applyPackagePrice(same.tx, { packageId: "p1", price: 79000, changedBy: null }), false);
  assert.equal(same.tiers.length, 0);

  const stale = fakeDb({ ...basePkg(), price: 100 }, [
    { id: "t1", package_id: "p1", price: 49000, is_current: true, previous_price: null, changed_by: null, changed_at: null },
  ]);
  assert.equal(await applyPackagePrice(stale.tx, { packageId: "p1", price: 49000, changedBy: "a1" }), false);
  assert.equal(stale.pkg.price, 100);
});

test("later change closes the current tier and records who changed it", async () => {
  const db = fakeDb(basePkg());
  await applyPackagePrice(db.tx, { packageId: "p1", price: 49000, changedBy: null });
  await applyPackagePrice(db.tx, { packageId: "p1", price: 59000, changedBy: "admin-1" });

  assert.deepEqual(db.tiers.map((t) => [t.price, t.is_current]), [[79000, false], [49000, false], [59000, true]]);
  const now = db.tiers[2]!;
  assert.deepEqual([now.previous_price, now.changed_by], [49000, "admin-1"]);
  assert.deepEqual([db.pkg.price, db.pkg.previous_price, db.pkg.last_price_changed_by], [59000, 49000, "admin-1"]);
});
