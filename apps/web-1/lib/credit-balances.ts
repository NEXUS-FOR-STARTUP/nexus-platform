import { STAGES } from "@app/shared/stages";

/** Balances keyed by ServiceType.code (matches API case detail `credit_balances`). */
export type CreditBalances = Record<string, number | undefined>;

export function totalCredits(balances?: CreditBalances | null): number {
  if (!balances) return 0;
  return Object.values(balances).reduce((sum: number, n) => sum + (typeof n === "number" ? n : 0), 0);
}

/** Formatted summary, e.g. "Ý tưởng: 2 · Thị trường: 1" */
export function formatCreditBalances(balances?: CreditBalances | null): string {
  if (!balances) return "0 lượt";
  const parts = STAGES
    .filter((s) => s.serviceType && (balances[s.serviceType] ?? 0) > 0)
    .map((s) => `${s.name}: ${balances[s.serviceType!] ?? 0}`);
  return parts.length > 0 ? parts.join(" · ") : "0 lượt";
}
