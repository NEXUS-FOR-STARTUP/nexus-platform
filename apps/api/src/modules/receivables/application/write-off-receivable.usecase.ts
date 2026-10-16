import { WriteOffReceivableSchema, type AdminReceivable } from "@repo/validation";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { loadReceivable, lockReceivable, stateOf, toAdminReceivable } from "../infrastructure/receivables.repository.js";

export async function writeOffReceivableUseCase(
  adminId: string,
  receivableId: string,
  body: unknown,
): Promise<AdminReceivable> {
  const parsed = WriteOffReceivableSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "INVALID_WRITE_OFF", parsed.error.issues[0]?.message ?? "Dữ liệu xoá nợ không hợp lệ");
  }
  const { amount, reason, request_key } = parsed.data;
  const idempotencyKey = `manual:${request_key}`;

  try {
    await prisma.$transaction(async (tx) => {
      await lockReceivable(tx, receivableId);
      const row = await loadReceivable(tx, { id: receivableId });
      if (!row) throw new AppError(404, "NOT_FOUND", "Không tìm thấy khoản nợ");
      if (amount > stateOf(row).outstanding) {
        throw new AppError(409, "WRITE_OFF_EXCEEDS_OUTSTANDING", "Số xoá vượt quá số còn nợ");
      }
      await tx.receivableAdjustment.create({
        data: { receivable_id: receivableId, kind: "manual", amount, reason, idempotency_key: idempotencyKey, created_by: adminId },
      });
    });
  } catch (error) {
    if ((error as { code?: string } | null)?.code !== "P2002") throw error;
    // Same request_key again: a replay only if it was this debt's own write-off.
    const prior = await prisma.receivableAdjustment.findUnique({ where: { idempotency_key: idempotencyKey } });
    if (!prior || prior.receivable_id !== receivableId) {
      throw new AppError(409, "REQUEST_KEY_REUSED", "request_key đã dùng cho một yêu cầu khác");
    }
  }
  return toAdminReceivable((await loadReceivable(prisma, { id: receivableId }))!);
}
