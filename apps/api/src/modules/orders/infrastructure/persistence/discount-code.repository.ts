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

/** Hard cap: the admin screen filters/summarises in memory, so the list must stay bounded. */
const ADMIN_LIST_LIMIT = 2000;

export function listDiscountCodes() {
  return prisma.discountCode.findMany({
    orderBy: { created_at: "desc" },
    take: ADMIN_LIST_LIMIT,
    include: { service_type: { select: { code: true } } },
  });
}

export function listUserDiscountCodes(userId: string, caseId: string) {
  return prisma.discountCode.findMany({
    where: { owner_user_id: userId, case_id: caseId },
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
