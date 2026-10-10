import type { Prisma } from "@prisma/client";
import {
  CreateDiscountCodeSchema,
  UpdateDiscountCodeSchema,
  type AdminDiscountCode,
} from "@repo/validation";
import { AppError } from "../../../shared/domain/app-error.js";
import { auditLogger } from "../../../shared/infrastructure/audit-logger.js";
import { prisma } from "../../../db.js";
import {
  createDiscountCode,
  findDiscountCodeByCode,
  listDiscountCodes,
  updateDiscountCode,
} from "../../orders/infrastructure/persistence/discount-code.repository.js";

type DiscountCodeRow = Prisma.DiscountCodeGetPayload<{ include: { service_type: { select: { code: true } } } }>;

function toAdminDiscountCode(row: DiscountCodeRow): AdminDiscountCode {
  return {
    id: row.id,
    code: row.code,
    percent_off: row.percent_off,
    service_type_id: row.service_type_id,
    service_type_code: row.service_type.code,
    max_redemptions: row.max_redemptions,
    redeemed_count: row.redeemed_count,
    expires_at: row.expires_at ? row.expires_at.toISOString() : null,
    is_active: row.is_active,
    created_at: row.created_at.toISOString(),
  };
}

export async function listDiscountCodesUseCase(): Promise<AdminDiscountCode[]> {
  return (await listDiscountCodes()).map(toAdminDiscountCode);
}

export async function createDiscountCodeUseCase(adminId: string, body: unknown): Promise<AdminDiscountCode> {
  const parsed = CreateDiscountCodeSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "INVALID_DISCOUNT_CODE", parsed.error.issues[0]?.message ?? "Dữ liệu mã giảm giá không hợp lệ");
  }
  const input = parsed.data;

  const serviceType = await prisma.serviceType.findUnique({ where: { id: input.service_type_id }, select: { id: true } });
  if (!serviceType) {
    throw new AppError(404, "SERVICE_TYPE_NOT_FOUND", "Không tìm thấy loại dịch vụ");
  }
  if (await findDiscountCodeByCode(input.code)) {
    throw new AppError(409, "DISCOUNT_CODE_EXISTS", "Mã giảm giá này đã tồn tại");
  }

  const row = await createDiscountCode({
    code: input.code,
    percent_off: input.percent_off,
    service_type_id: input.service_type_id,
    max_redemptions: input.max_redemptions ?? null,
    expires_at: input.expires_at ? new Date(input.expires_at) : null,
    created_by: adminId,
  });

  auditLogger.log({
    operation: "discount_code.create",
    actor_id: adminId,
    actor_role: "admin",
    resource_type: "discount_code",
    resource_id: row.id,
    action: "create",
    new_state: toAdminDiscountCode(row),
  });
  return toAdminDiscountCode(row);
}

export async function updateDiscountCodeUseCase(
  adminId: string,
  id: string,
  body: unknown,
): Promise<AdminDiscountCode> {
  const parsed = UpdateDiscountCodeSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "INVALID_DISCOUNT_CODE", parsed.error.issues[0]?.message ?? "Dữ liệu mã giảm giá không hợp lệ");
  }
  const input = parsed.data;

  const existing = await prisma.discountCode.findUnique({
    where: { id },
    include: { service_type: { select: { code: true } } },
  });
  if (!existing) {
    throw new AppError(404, "DISCOUNT_CODE_NOT_FOUND", "Không tìm thấy mã giảm giá");
  }
  if (input.max_redemptions != null && input.max_redemptions < existing.redeemed_count) {
    throw new AppError(400, "INVALID_DISCOUNT_CODE", "Giới hạn không được nhỏ hơn số lượt đã dùng");
  }

  const row = await updateDiscountCode(id, {
    ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
    ...(input.max_redemptions !== undefined ? { max_redemptions: input.max_redemptions } : {}),
    ...(input.expires_at !== undefined
      ? { expires_at: input.expires_at ? new Date(input.expires_at) : null }
      : {}),
  });

  auditLogger.log({
    operation: "discount_code.update",
    actor_id: adminId,
    actor_role: "admin",
    resource_type: "discount_code",
    resource_id: id,
    action: "update",
    old_state: toAdminDiscountCode(existing),
    new_state: toAdminDiscountCode(row),
  });
  return toAdminDiscountCode(row);
}
