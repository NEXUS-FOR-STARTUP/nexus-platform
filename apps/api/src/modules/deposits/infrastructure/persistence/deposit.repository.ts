import { prisma } from "../../../../db.js";
import type { Prisma } from "@prisma/client";

export async function createDeposit(params: {
  userId: string;
  amount: number;
  transferContent: string;
  idempotencyKey: string;
  metadataJson?: Record<string, unknown>;
}) {
  return prisma.deposit.create({
    data: {
      user_id: params.userId,
      amount: params.amount,
      transfer_content: params.transferContent,
      idempotency_key: params.idempotencyKey,
      status: "pending",
      metadata_json: params.metadataJson as any,
    },
  });
}

export async function findDepositById(id: string) {
  return prisma.deposit.findUnique({ where: { id } });
}

export async function findDepositByTransferContent(content: string) {
  return prisma.deposit.findFirst({
    where: { transfer_content: content, status: { notIn: ["verified", "rejected"] } },
  });
}

export async function findPendingDepositsByUser(userId: string) {
  return prisma.deposit.findMany({
    where: { user_id: userId, status: "pending" },
    orderBy: { created_at: "desc" },
  });
}

export async function updateDepositStatus(
  id: string,
  data: {
    status: "verified" | "rejected";
    rejectionReason?: string | null;
    adminId?: string;
    verificationSource: "manual" | "auto";
    bankTransactionId?: string;
    bankCreditedAt?: Date;
  },
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  return client.deposit.update({
    where: { id },
    data: {
      status: data.status,
      rejection_reason: data.rejectionReason ?? null,
      verified_by: data.adminId ?? null,
      verification_source: data.verificationSource,
      bank_transaction_id: data.bankTransactionId ?? undefined,
      bank_credited_at: data.bankCreditedAt ?? undefined,
    },
  });
}

export async function findDepositsByUser(userId: string, limit = 20, offset = 0) {
  return prisma.deposit.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function countDepositsByUser(userId: string): Promise<number> {
  return prisma.deposit.count({ where: { user_id: userId } });
}

export async function findDepositsAdmin(params: {
  status?: "pending" | "verified" | "rejected";
  limit?: number;
  offset?: number;
}) {
  return prisma.deposit.findMany({
    where: params.status ? { status: params.status } : undefined,
    include: {
      user: { select: { id: true, name: true, display_username: true, email: true } },
    },
    orderBy: { created_at: "desc" },
    take: params.limit ?? 50,
    skip: params.offset ?? 0,
  });
}

export async function countDepositsAdmin(status?: string): Promise<number> {
  return prisma.deposit.count({ where: status ? { status } : undefined });
}

export async function countDepositsExport(): Promise<number> {
  return prisma.deposit.count();
}

export async function findDepositsExportPage(offset: number, take: number) {
  return prisma.deposit.findMany({
    select: {
      id: true,
      user_id: true,
      amount: true,
      currency: true,
      transfer_content: true,
      status: true,
      rejection_reason: true,
      bank_transaction_id: true,
      bank_credited_at: true,
      verified_by: true,
      verification_source: true,
      created_at: true,
      updated_at: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    skip: offset,
    take,
  });
}

