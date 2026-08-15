import { findDepositsAdmin, countDepositsAdmin } from "../infrastructure/persistence/deposit.repository.js";
import { AppError } from "../../../shared/domain/app-error.js";

export async function listAllDepositsUseCase(
  adminId: string,
  opts: { status?: string; limit?: number; offset?: number },
) {
  if (!adminId) throw new AppError(403, "FORBIDDEN", "Chỉ admin mới có quyền truy cập");

  const [deposits, total] = await Promise.all([
    findDepositsAdmin({ status: opts.status as any, limit: opts.limit, offset: opts.offset }),
    countDepositsAdmin(opts.status),
  ]);

  return {
    deposits: deposits.map((d) => ({
      id: d.id,
      user: d.user ? { id: d.user.id, name: d.user.name, display_username: d.user.display_username } : null,
      amount: d.amount,
      transfer_content: d.transfer_content,
      status: d.status,
      proof_file_url: d.proof_file_url,
      bank_transaction_id: d.bank_transaction_id,
      verified_by: d.verified_by,
      created_at: d.created_at.toISOString(),
    })),
    total,
  };
}
