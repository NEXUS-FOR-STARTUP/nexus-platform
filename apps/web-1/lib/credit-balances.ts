/** Số lượt còn lại theo dịch vụ (ServiceType.code), khớp `credit_balances` của API case detail. */
export type CreditBalances = Partial<Record<"cp1_audit" | "cp2_audit", number>>;

export function totalCredits(balances?: CreditBalances | null): number {
  return (balances?.cp1_audit ?? 0) + (balances?.cp2_audit ?? 0);
}

export function formatCreditBalances(balances?: CreditBalances | null): string {
  return `CP1: ${balances?.cp1_audit ?? 0} lượt · CP2: ${balances?.cp2_audit ?? 0} lượt`;
}
