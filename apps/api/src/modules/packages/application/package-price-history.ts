import type { Prisma } from "@prisma/client";

/** Only the delegates this writer touches, so a seed script can pass its own client. */
export type PriceHistoryClient = Pick<Prisma.TransactionClient, "servicePackage" | "servicePricing">;

export interface PriceChange {
  packageId: string;
  price: number;
  /** User id of the admin; null for seeds and scripts. */
  changedBy: string | null;
}

/**
 * The one place that changes a package price. Charged price is `service_pricing` (is_current) first,
 * `service_packages.price` only as fallback, so every writer must keep both in step and leave a history row.
 * Returns false when the price is already `price` (no row written).
 */
export async function applyPackagePrice(tx: PriceHistoryClient, change: PriceChange): Promise<boolean> {
  const { packageId, price, changedBy } = change;
  const pkg = await tx.servicePackage.findUniqueOrThrow({
    where: { id: packageId },
    include: { pricing_tiers: { where: { is_current: true }, take: 1 } },
  });
  const current = pkg.pricing_tiers[0];
  const effective = current?.price ?? pkg.price;
  if (effective === price) return false;

  const now = new Date();
  if (current) {
    await tx.servicePricing.update({ where: { id: current.id }, data: { is_current: false } });
  } else {
    // First tracked change: keep the old column price as the history baseline.
    await tx.servicePricing.create({
      data: {
        package_id: packageId,
        price: pkg.price,
        is_current: false,
        changed_at: pkg.last_price_changed_at ?? pkg.created_at,
      },
    });
  }
  await tx.servicePricing.create({
    data: {
      package_id: packageId,
      price,
      is_current: true,
      previous_price: effective,
      changed_by: changedBy,
      changed_at: now,
    },
  });
  await tx.servicePackage.update({
    where: { id: packageId },
    data: { price, previous_price: effective, last_price_changed_by: changedBy, last_price_changed_at: now },
  });
  return true;
}
