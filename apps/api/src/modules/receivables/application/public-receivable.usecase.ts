import type { PublicReceivable, ReceivablePaymentLink } from "@repo/validation";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { getDepositBankInfo } from "../../payments/domain/bank-info.js";
import { generatePublicToken, hashPublicToken } from "../domain/receivable.domain.js";
import { loadReceivable, stateOf } from "../infrastructure/receivables.repository.js";

/** Same response for wrong, unissued and rotated tokens. */
const NOT_FOUND = () => new AppError(404, "NOT_FOUND", "Liên kết không hợp lệ hoặc đã hết hạn");

export async function getPublicReceivableUseCase(token: string): Promise<PublicReceivable> {
  const found = await prisma.receivable.findUnique({
    where: { public_token_hash: hashPublicToken(token) },
    select: { id: true },
  });
  const row = found ? await loadReceivable(prisma, { id: found.id }) : null;
  if (!row) throw NOT_FOUND();

  const state = stateOf(row);
  const bank = getDepositBankInfo(row.code, state.outstanding);
  const lastPaid = row.payments.reduce<Date | null>((max, p) => (!max || p.paid_at > max ? p.paid_at : max), null);
  return {
    code: row.code,
    amount_due: row.amount_due,
    outstanding: state.outstanding,
    status: state.status,
    created_at: row.created_at.toISOString(),
    paid_at: state.status === "settled" && lastPaid ? lastPaid.toISOString() : null,
    bank_info: {
      bank_name: bank.bankName,
      bank_short_code: bank.bankShortCode,
      account_number: bank.accountNumber,
      account_name: bank.accountName,
      transfer_content: bank.transferContent,
      qr_url: bank.qrUrl,
    },
  };
}

/** First call issues the link, later calls rotate it (the old link dies at once). Only the hash is stored. */
export async function createPaymentLinkUseCase(receivableId: string): Promise<ReceivablePaymentLink> {
  const { token, hash } = generatePublicToken();
  const { count } = await prisma.receivable.updateMany({
    where: { id: receivableId },
    data: { public_token_hash: hash, public_token_rotated_at: new Date() },
  });
  if (count === 0) throw new AppError(404, "NOT_FOUND", "Không tìm thấy khoản nợ");
  const base = (process.env["PUBLIC_WEB_URL"] ?? "http://localhost:3001").replace(/\/+$/, "");
  return { token, pay_url: `${base}/pay/receivable/${token}` };
}
