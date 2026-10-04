import { AppError } from "../../../shared/domain/app-error.js";
import { findDepositById as defaultFindDepositById } from "../infrastructure/persistence/deposit.repository.js";
import { getDepositBankInfo } from "../../payments/domain/bank-info.js";
import type { GetDepositResponse } from "./deposits.dto.js";

type GetDepositDeps = {
  findDepositById?: typeof defaultFindDepositById;
};

const defaultDeps = {
  findDepositById: defaultFindDepositById,
};

export async function getDepositUseCase(
  userId: string,
  depositId: string,
  deps: GetDepositDeps = {},
): Promise<GetDepositResponse> {
  const { findDepositById } = { ...defaultDeps, ...deps };
  const deposit = await findDepositById(depositId);
  if (!deposit) {
    throw new AppError(404, "DEPOSIT_NOT_FOUND", "Không tìm thấy thông tin nạp tiền");
  }

  if (deposit.user_id !== userId) {
    throw new AppError(403, "FORBIDDEN", "Bạn không có quyền xem giao dịch này");
  }

  const bankInfo = getDepositBankInfo(deposit.transfer_content, deposit.amount);

  return {
    id: deposit.id,
    user_id: deposit.user_id,
    amount: deposit.amount,
    currency: deposit.currency,
    transfer_content: deposit.transfer_content,
    status: deposit.status,
    proof_file_url: deposit.proof_file_url,
    rejection_reason: deposit.rejection_reason,
    bank_transaction_id: deposit.bank_transaction_id,
    bank_credited_at: deposit.bank_credited_at?.toISOString() ?? null,
    verified_by: deposit.verified_by,
    verification_source: deposit.verification_source,
    created_at: deposit.created_at.toISOString(),
    bankInfo,
  };
}
