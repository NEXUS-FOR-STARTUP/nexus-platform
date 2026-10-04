import { findDepositsByUser, countDepositsByUser } from "../infrastructure/persistence/deposit.repository.js";
import type { ListDepositsResponse, DepositHistoryItem } from "./deposits.dto.js";

export async function listDepositsUseCase(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<ListDepositsResponse> {
  const [deposits] = await Promise.all([
    findDepositsByUser(userId, limit, offset),
    countDepositsByUser(userId),
  ]);

  const items: DepositHistoryItem[] = deposits.map((d) => ({
    id: d.id,
    amount: d.amount,
    currency: d.currency,
    status: d.status,
    transfer_content: d.transfer_content,
    proof_file_url: d.proof_file_url,
    verified_at: d.status === "verified" ? d.updated_at.toISOString() : null,
    bank_transaction_id: d.bank_transaction_id ?? null,
    created_at: d.created_at.toISOString(),
  }));

  return { deposits: items };
}
