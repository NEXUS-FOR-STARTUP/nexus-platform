import { createHash, randomBytes } from "node:crypto";
import type { ReceivableStatus } from "@repo/validation";

/** Bắt đầu bằng "CR" để regex `CR[A-Z0-9]{6,}` của webhook SePay bắt được; khác `CRTOPUP` của nạp ví. */
export const RECEIVABLE_CODE_PREFIX = "CRDEBT";
export const RECEIVABLE_CODE_LENGTH = RECEIVABLE_CODE_PREFIX.length + 6;

export function generateReceivableCode(): string {
  return `${RECEIVABLE_CODE_PREFIX}${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function hashPublicToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generatePublicToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashPublicToken(token) };
}

export interface ReceivableTotals {
  amountDue: number;
  /** SUM(receivable_payments.applied_amount) */
  applied: number;
  /** SUM(receivable_payments.gross_amount) */
  gross: number;
  /** SUM(receivable_adjustments.amount) */
  writtenOff: number;
}

export interface ReceivableState {
  paid: number;
  writtenOff: number;
  outstanding: number;
  overpaid: number;
  status: ReceivableStatus;
}

/** Duy nhất một nơi tính còn nợ/trạng thái: danh sách, trang công khai và kiểm thanh toán dùng chung. */
export function computeReceivableState(totals: ReceivableTotals, dueAt: Date, now: Date): ReceivableState {
  const outstanding = Math.max(0, totals.amountDue - totals.applied - totals.writtenOff);
  const overpaid = totals.gross - totals.applied;
  let status: ReceivableStatus;
  if (outstanding === 0) status = totals.applied > 0 ? "settled" : "written_off";
  else if (dueAt.getTime() < now.getTime()) status = "overdue";
  else status = totals.applied > 0 ? "partial" : "open";
  return { paid: totals.applied, writtenOff: totals.writtenOff, outstanding, overpaid, status };
}

export interface FundedLot {
  receivableId: string;
  /** credits_granted of the sponsored purchase row */
  credits: number;
}

export interface LotAllocation {
  receivableId: string;
  credits: number;
}

/**
 * Splits a refund of `refundedCredits` across sponsored lots. Lots must be newest first (the order
 * `planServiceRefund` prices them). Older lots are assumed consumed first (FIFO), so the unused
 * credits sit in the newest lots: unused_i = min(credits_i, balance - unused of newer lots).
 */
export function allocateRefundToLots(
  lotsNewestFirst: FundedLot[],
  balanceBefore: number,
  refundedCredits: number,
): LotAllocation[] {
  let balanceLeft = balanceBefore;
  let refundLeft = refundedCredits;
  const out: LotAllocation[] = [];
  for (const lot of lotsNewestFirst) {
    const unused = Math.min(lot.credits, balanceLeft);
    balanceLeft -= unused;
    const take = Math.min(unused, refundLeft);
    refundLeft -= take;
    if (take > 0) out.push({ receivableId: lot.receivableId, credits: take });
  }
  if (refundLeft !== 0) {
    throw new Error(`refund allocation mismatch: ${refundLeft} credits unallocated`);
  }
  return out;
}

/**
 * Cumulative write-off so rounding never drifts: target = round(amountDue * cumCredits / lotCredits),
 * delta = target - already written off by refunds, capped by what is still owed.
 */
export function computeRefundWriteOff(params: {
  amountDue: number;
  lotCredits: number;
  cumulativeRefundedCredits: number;
  alreadyWrittenOffByRefund: number;
  outstanding: number;
}): number {
  const target = Math.round((params.amountDue * params.cumulativeRefundedCredits) / params.lotCredits);
  return Math.max(0, Math.min(params.outstanding, target - params.alreadyWrittenOffByRefund));
}
