import type { Prisma } from "@prisma/client";
import { prisma } from "../../../../db.js";

type Db = Prisma.TransactionClient | typeof prisma;

export function findDiscountCodeByCode(code: string, db: Db = prisma) {
  return db.discountCode.findUnique({ where: { code } });
}

export function findUserRedemption(codeId: string, userId: string, db: Db = prisma) {
  return db.discountRedemption.findUnique({
    where: { code_id_user_id: { code_id: codeId, user_id: userId } },
    select: { id: true },
  });
}

export function listDiscountCodes() {
  return prisma.discountCode.findMany({
    orderBy: { created_at: "desc" },
    include: { service_type: { select: { code: true } } },
  });
}

export function createDiscountCode(data: Prisma.DiscountCodeUncheckedCreateInput) {
  return prisma.discountCode.create({
    data,
    include: { service_type: { select: { code: true } } },
  });
}

export function updateDiscountCode(id: string, data: Prisma.DiscountCodeUpdateInput) {
  return prisma.discountCode.update({
    where: { id },
    data,
    include: { service_type: { select: { code: true } } },
  });
}
