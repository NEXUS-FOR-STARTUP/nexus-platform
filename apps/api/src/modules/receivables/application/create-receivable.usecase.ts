import { CreateReceivableSchema, RECEIVABLE_GRANT_MAX_VND, isCaseContactComplete, type AdminReceivable, type CreateReceivableInput } from "@repo/validation";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { getEffectiveCaseContact } from "../../cases/infrastructure/persistence/case.repository.js";
import { createOrderInTx } from "../../orders/application/order-in-tx.js";
import { prepareOrder, type PreparedOrder } from "../../orders/application/order-prepare.js";
import { generateReceivableCode } from "../domain/receivable.domain.js";
import { loadReceivable, toAdminReceivable, type ReceivableRow } from "../infrastructure/receivables.repository.js";
import { findSystemAccount } from "../infrastructure/system-account.js";

const MAX_CODE_ATTEMPTS = 3;

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

/**
 * Same request_key must mean the same request; anything else is a client bug, not a replay.
 * Derived debtor fields are deliberately not compared: a profile edit must not break a replay.
 */
async function findReplay(input: CreateReceivableInput, beneficiaryId: string): Promise<ReceivableRow | null> {
  const existing = await prisma.receivable.findUnique({ where: { request_key: input.request_key }, select: { id: true } });
  if (!existing) return null;
  const row = await loadReceivable(prisma, { id: existing.id });
  if (!row) return null;

  const order = row.order_id
    ? await prisma.order.findUnique({ where: { id: row.order_id }, include: { items: true } })
    : null;
  const item = order?.items[0];
  const itemMeta = (item?.metadata_json ?? {}) as Record<string, unknown>;
  const itemCaseId = itemMeta["case_id"];
  const p = input.purchase;
  // Everything the request persisted must match, including whether the audit auto-starts (kept on the order item).
  const sameRequest =
    row.case_id === input.case_id &&
    row.amount_due === input.amount_due &&
    row.due_at.getTime() === new Date(input.due_at).getTime() &&
    (p
      ? !!order &&
        order.user_id === beneficiaryId &&
        !!item &&
        item.package_id === p.package_id &&
        item.quantity === p.quantity &&
        itemCaseId === input.case_id &&
        itemMeta["manual_trigger"] === (p.manual_trigger ?? true)
      : !order);
  if (!sameRequest) {
    throw new AppError(409, "REQUEST_KEY_REUSED", "request_key đã dùng cho một yêu cầu khác");
  }
  return row;
}

/** Everything that can reject the purchase, run before any write. */
async function planPurchase(input: CreateReceivableInput, beneficiaryId: string): Promise<{ beneficiaryId: string; prepared: PreparedOrder }> {
  const purchase = input.purchase!;

  const prepared = await prepareOrder(beneficiaryId, {
    idempotency_key: `receivable-order:${input.request_key}`,
    items: [{
      package_id: purchase.package_id,
      quantity: purchase.quantity,
      manual_trigger: purchase.manual_trigger ?? true,
      metadata_json: { case_id: input.case_id, manual_trigger: purchase.manual_trigger ?? true },
    }],
  });
  if (prepared.totalAmount > RECEIVABLE_GRANT_MAX_VND) {
    throw new AppError(400, "GRANT_TOO_LARGE", "Giá đơn vượt hạn mức cấp tối đa");
  }
  if (input.amount_due < prepared.totalAmount) {
    throw new AppError(400, "AMOUNT_DUE_TOO_LOW", "Số phải thu không được thấp hơn giá đơn");
  }
  return { beneficiaryId, prepared };
}

interface DebtorSnapshot {
  name: string;
  phone: string;
  email: string;
}

/** Debtor = the case's own contact (case profile + first intake unit), never the owner account's profile. */
async function loadDebtor(caseId: string, systemAccountId: string): Promise<DebtorSnapshot> {
  const caseRow = await prisma.case.findUnique({ where: { id: caseId }, select: { owner_auth_user_id: true } });
  if (!caseRow) throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  if (caseRow.owner_auth_user_id !== systemAccountId) {
    throw new AppError(403, "FORBIDDEN", "Dự án không thuộc tài khoản hệ thống");
  }
  const contact = await getEffectiveCaseContact(caseId);
  if (!isCaseContactComplete(contact)) {
    throw new AppError(409, "CASE_CONTACT_INCOMPLETE", "Dự án chưa có đủ thông tin liên hệ. Hãy cập nhật hồ sơ dự án (họ tên, số điện thoại, email) rồi tạo lại khoản nợ.");
  }
  const c = contact as Record<string, string>;
  return { name: c["full_name"]!.trim(), phone: c["zalo"]!.trim(), email: c["email"]!.trim() };
}

export async function createReceivableUseCase(adminId: string, body: unknown): Promise<AdminReceivable> {
  const parsed = CreateReceivableSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "INVALID_RECEIVABLE", parsed.error.issues[0]?.message ?? "Dữ liệu khoản nợ không hợp lệ");
  }
  const input = parsed.data;

  const beneficiaryId = (await findSystemAccount())?.id ?? null;
  if (!beneficiaryId) throw new AppError(409, "SYSTEM_ACCOUNT_NOT_CONFIGURED", "Chưa cấu hình tài khoản hệ thống để mua lượt hộ");

  const replay = await findReplay(input, beneficiaryId);
  if (replay) return toAdminReceivable(replay, true);

  const debtor = await loadDebtor(input.case_id, beneficiaryId);
  const plan = input.purchase ? await planPurchase(input, beneficiaryId) : null;

  for (let attempt = 1; ; attempt++) {
    try {
      const id = await prisma.$transaction(async (tx) => {
        const created = await tx.receivable.create({
          data: {
            code: generateReceivableCode(),
            request_key: input.request_key,
            customer_name: debtor.name,
            customer_phone: debtor.phone,
            customer_email: debtor.email,
            customer_contact: `${debtor.phone} · ${debtor.email}`,
            case_id: input.case_id,
            amount_due: input.amount_due,
            due_at: new Date(input.due_at),
            created_by: adminId,
          },
          select: { id: true },
        });
        if (plan) {
          const order = await createOrderInTx(tx, plan.beneficiaryId, plan.prepared, {
            receivableId: created.id,
            grantKey: `grant:${input.request_key}`,
          });
          await tx.receivable.update({
            where: { id: created.id },
            data: { order_id: order.orderId, grant_tx_id: order.grantTxId },
          });
        }
        return created.id;
      });
      return toAdminReceivable((await loadReceivable(prisma, { id }))!);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // A violation poisons the transaction, so it is handled out here: concurrent same key → replay.
      const again = await findReplay(input, beneficiaryId);
      if (again) return toAdminReceivable(again, true);
      // Otherwise the random code collided: retry with a fresh one.
      if (attempt >= MAX_CODE_ATTEMPTS) throw error;
    }
  }
}
