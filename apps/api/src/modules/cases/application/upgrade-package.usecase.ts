import { AppError } from "../../../shared/domain/app-error.js";
import { isFinalCaseStage } from "../domain/case.types.js";
import {
  findCaseByIdWithMembers,
  upgradeCasePackage,
  createCaseEvent,
} from "../infrastructure/persistence/case.repository.js";
import { getPackageUseCase } from "../../packages/application/get-package.usecase.js";

const ALLOWED_UPGRADE_TARGET = "pkg_tf_audit";

export async function upgradePackageUseCase(
  userId: string,
  caseId: string,
  targetPackageId: string,
) {
  if (targetPackageId !== ALLOWED_UPGRADE_TARGET) {
    throw new AppError(400, "INVALID_PACKAGE", "Gói dịch vụ không hợp lệ để nâng cấp");
  }

  const existing = await findCaseByIdWithMembers(caseId);

  if (!existing) {
    throw new AppError(404, "CASE_NOT_FOUND", "Không tìm thấy hồ sơ");
  }

  const isOwner = existing.owner_auth_user_id === userId;
  const isMember = existing.members.some((m: any) => m.auth_user_id === userId);

  if (!isOwner && !isMember) {
    throw new AppError(403, "FORBIDDEN", "Bạn không có quyền nâng cấp gói cho hồ sơ này");
  }

  if (isFinalCaseStage(existing.user_facing_stage)) {
    throw new AppError(400, "INVALID_CASE_STAGE", "Hồ sơ đã ở trạng thái cuối, không thể nâng cấp");
  }

  if (existing.package_id === targetPackageId) {
    return { caseId, packageId: targetPackageId, upgraded: false };
  }

  const fromPackageId = existing.package_id;
  const targetPkg = await getPackageUseCase(targetPackageId);
  const lockedPrice = targetPkg.price;

  await upgradeCasePackage(caseId, targetPackageId, lockedPrice);

  await createCaseEvent(caseId, userId, "package_upgraded", {
    from: fromPackageId,
    to: targetPackageId,
    locked_price: lockedPrice,
  });

  return { caseId, packageId: targetPackageId, upgraded: true };
}
