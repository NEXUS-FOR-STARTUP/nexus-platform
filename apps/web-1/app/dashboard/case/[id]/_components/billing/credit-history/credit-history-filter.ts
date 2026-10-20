import type { CreditEntry, CreditEntryType } from "../../credit-history.types";

export type CreditTypeFilter = "all" | CreditEntryType;
/** null = no time limit. */
export type CreditDaysFilter = number | null;

const DAY_MS = 24 * 60 * 60 * 1000;

export function filterCreditEntries(
  entries: CreditEntry[],
  { type, days, now }: { type: CreditTypeFilter; days: CreditDaysFilter; now: number },
): CreditEntry[] {
  const since = days === null ? null : now - days * DAY_MS;
  return entries.filter((e) => {
    if (type !== "all" && e.type !== type) return false;
    if (since === null) return true;
    const at = new Date(e.created_at).getTime();
    return at >= since && at <= now;
  });
}

export function countByType(entries: CreditEntry[]): Record<CreditTypeFilter, number> {
  const counts: Record<CreditTypeFilter, number> = { all: entries.length, purchase: 0, consumption: 0, refund: 0 };
  for (const e of entries) counts[e.type] += 1;
  return counts;
}
