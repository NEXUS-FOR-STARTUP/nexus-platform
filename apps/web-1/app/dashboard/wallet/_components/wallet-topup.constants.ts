export const MIN_TOPUP_AMOUNT = 2000;
export const DEFAULT_TOPUP_AMOUNT = 50000;
export const TOPUP_PRESET_AMOUNTS = [50_000, 79_000, 100_000, 200_000] as const;

export function parseTopupAmount(raw?: string | null): number | undefined {
  if (!raw) return undefined;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < MIN_TOPUP_AMOUNT) {
    return undefined;
  }
  return Math.round(num);
}
