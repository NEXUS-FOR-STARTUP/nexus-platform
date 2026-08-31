import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import { auditLogger } from "../../../shared/infrastructure/audit-logger.js";
import logger from "../../../shared/infrastructure/logger.js";

export type DeleteAccountResult = {
  success: boolean;
  message: string;
};

export type DeleteAccountDeps = {
  findUser?: (userId: string) => Promise<{ id: string; email: string; role: string; banned: boolean } | null>;
  countActiveAdmins?: () => Promise<number>;
  executeTransaction?: (userId: string, originalEmail: string, scrambledEmail: string) => Promise<void>;
  logAudit?: (entry: Parameters<typeof auditLogger.log>[0]) => void;
};

async function defaultFindUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, banned: true },
  });
}

async function defaultCountActiveAdmins() {
  return prisma.user.count({
    where: {
      role: "admin",
      banned: false,
    },
  });
}

async function defaultExecuteTransaction(userId: string, _originalEmail: string, scrambledEmail: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Soft-delete and anonymize User record
    await tx.user.update({
      where: { id: userId },
      data: {
        banned: true,
        ban_reason: "USER_DELETED_ACCOUNT",
        email: scrambledEmail,
        name: "Người dùng đã xóa",
        image: null,
        updated_at: new Date(),
      },
    });

    // 2. Revoke all active sessions
    await tx.session.deleteMany({
      where: { user_id: userId },
    });

    // 3. Delete accounts (credentials / OAuth bindings)
    await tx.account.deleteMany({
      where: { user_id: userId },
    });

    // 4. Delete TwoFactor credentials if any
    await tx.twoFactor.deleteMany({
      where: { user_id: userId },
    });
  });
}

export async function deleteAccountUseCase(
  userId: string,
  deps: DeleteAccountDeps = {},
): Promise<DeleteAccountResult> {
  const findUser = deps.findUser ?? defaultFindUser;
  const countActiveAdmins = deps.countActiveAdmins ?? defaultCountActiveAdmins;
  const executeTransaction = deps.executeTransaction ?? defaultExecuteTransaction;
  const logAudit = deps.logAudit ?? ((entry) => auditLogger.log(entry));

  if (!userId || typeof userId !== "string" || !userId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "ID người dùng không hợp lệ");
  }

  const user = await findUser(userId.trim());
  if (!user || user.banned) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy thông tin người dùng");
  }

  // Safety check: Prevent deleting the last active admin
  if (user.role === "admin") {
    const activeAdminCount = await countActiveAdmins();
    if (activeAdminCount <= 1) {
      throw new AppError(
        400,
        "CANNOT_DELETE_LAST_ADMIN",
        "Không thể xóa tài khoản Quản trị viên duy nhất của hệ thống",
      );
    }
  }

  const scrambledEmail = `deleted_${Date.now()}_${user.email.toLowerCase()}`;

  try {
    await executeTransaction(user.id, user.email, scrambledEmail);
  } catch (error) {
    logger.error({ err: error, userId: user.id }, "Failed to soft-delete account in transaction");
    throw error;
  }

  logAudit({
    operation: "user.delete_account",
    actor_id: user.id,
    actor_role: user.role,
    action: "soft_delete",
    resource_type: "user",
    resource_id: user.id,
    metadata: {
      original_email: user.email,
      scrambled_email: scrambledEmail,
    },
  });

  return {
    success: true,
    message: "Tài khoản đã được xóa thành công",
  };
}
