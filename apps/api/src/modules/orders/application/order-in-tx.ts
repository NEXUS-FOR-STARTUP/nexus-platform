import type { Prisma } from "@prisma/client";
import { walletService } from "../../wallet/application/wallet.service.js";
import { insertOutboxEvent } from "../../../shared/infrastructure/persistence/outbox.repository.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { CreateOrderResponse } from "./orders.dto.js";
import {
  CP1_AUDIT_SERVICE_CODE,
  getCreditBalance,
} from "../../cases/infrastructure/persistence/credit-ledger.repository.js";
import { applyPaidCreditCaseUpdate } from "./credit-audit-order.helpers.js";
import { redeemDiscountInTx } from "./discount.helpers.js";
import { FUNDED_BY_RECEIVABLE_KEY, assertLotsNotMixed, lockAndValidateCases } from "./funded-lot.guard.js";
import type { PreparedOrder } from "./order-prepare.js";

/** Pay-later: the wallet is granted exactly the order total just before paying, lots are priced 0. */
export interface FundedOrderOptions {
  receivableId: string;
  grantKey: string;
}

export interface OrderInTxResult extends CreateOrderResponse {
  grantTxId: string | null;
}


/** The whole order write path, composable into a caller's transaction. P2002 replay stays with the caller. */
export async function createOrderInTx(
  tx: Prisma.TransactionClient,
  userId: string,
  prepared: PreparedOrder,
  funded?: FundedOrderOptions,
): Promise<OrderInTxResult> {
  const { resolvedItems, discount, totalAmount, listTotal, idempotencyKey } = prepared;

  const caseRecords = await lockAndValidateCases(tx, userId, resolvedItems.map((r) => r.caseId));
  for (const { caseId, pkg } of resolvedItems) {
    await assertLotsNotMixed(tx, caseId, pkg.serviceTypeId, !!funded);
  }

  const order = await tx.order.create({
    data: {
      user_id: userId,
      total_amount: totalAmount,
      status: "pending",
      idempotency_key: idempotencyKey,
      metadata_json: discount
        ? { list_price: listTotal, discount_code: discount.code, percent_off: discount.percentOff }
        : {},
      items: {
        create: resolvedItems.map(({ item, pkg, unitPrice }) => ({
          service_type: pkg.serviceTypeCode,
          package_id: pkg.id,
          quantity: item.quantity,
          unit_price: unitPrice,
          amount: item.quantity * unitPrice,
          metadata_json: (item.metadata_json ?? {}) as Prisma.InputJsonValue,
        })),
      },
    },
    include: { items: true },
  });

  // Sponsored orders must not count as revenue, so they skip the legacy payment mirror.
  if (process.env["DUAL_WRITE_PAYMENT"] === "true" && !funded) {
    await tx.payment.create({
      data: {
        case_id: resolvedItems[0]!.caseId,
        amount: totalAmount,
        status: "paid",
        verified_by_auth_user_id: "system",
        verification_source: "auto",
        verified_at: new Date(),
        type: "deposit",
        transfer_content: idempotencyKey,
        currency: "VND",
      },
    });
  }

  if (discount) {
    await redeemDiscountInTx(tx, {
      discountId: discount.id,
      userId,
      orderId: order.id,
      limited: discount.limited,
    });
  }

  let grantTxId: string | null = null;
  // A fully discounted order moves no money: skip the wallet but still mark it paid.
  if (totalAmount > 0) {
    if (funded) {
      const grant = await walletService.grant(userId, totalAmount, funded.receivableId, funded.grantKey, tx);
      grantTxId = grant.id;
    }
    await walletService.withdraw(userId, totalAmount, idempotencyKey, {
      referenceType: "order",
      referenceId: order.id,
    }, tx);
  }

  await tx.order.update({
    where: { id: order.id },
    data: {
      status: "paid",
      wallet_transaction_id: totalAmount > 0 ? order.id : null,
    },
  });

  let totalCredits = 0;
  for (const { item, caseId, pkg, unitPrice } of resolvedItems) {
    const caseRecord = caseRecords.get(caseId)!;

    const creditsGranted = pkg.creditsGranted * item.quantity;
    totalCredits += creditsGranted;
    const currentBalance = await getCreditBalance(tx, caseId, pkg.serviceTypeId);
    const paidForPackage = unitPrice * item.quantity;
    const pricePerCredit = funded ? 0 : Math.round(paidForPackage / creditsGranted);

    await tx.creditLedger.create({
      data: {
        case_id: caseId,
        service_type_id: pkg.serviceTypeId,
        amount: creditsGranted,
        balance_after: currentBalance + creditsGranted,
        type: "purchase",
        reference_type: "order",
        reference_id: order.id,
        idempotency_key: `credit-purchase-${order.id}-${pkg.id}-${caseId}`,
        metadata_json: {
          order_id: order.id,
          package_id: pkg.id,
          quantity: item.quantity,
          unit_price: pricePerCredit,
          package_unit_price: pkg.unitPrice,
          price_per_credit: pricePerCredit,
          credits_granted: creditsGranted,
          ...(funded ? { [FUNDED_BY_RECEIVABLE_KEY]: funded.receivableId } : {}),
        },
      },
    });

    // Only CP1 purchases touch the CP1 case (payment status, free-case upgrade, reopen).
    if (pkg.serviceTypeCode !== CP1_AUDIT_SERVICE_CODE) continue;

    await applyPaidCreditCaseUpdate(tx, {
      caseId,
      userId,
      unitPrice: pkg.unitPrice,
      packageId: pkg.id,
      caseRecord,
    });
  }

  const first = resolvedItems[0]!;
  await insertOutboxEvent(tx, {
    event_type: DOMAIN_EVENTS.ORDER_PAID,
    payload_json: {
      orderId: order.id,
      userId,
      caseId: first.caseId,
      // Listener auto-triggers the audit only for CP1 purchases that are not manual.
      serviceTypeCode: first.pkg.serviceTypeCode,
      manualTrigger: first.item.manual_trigger === true,
      totalAmount,
      totalCredits,
      items: resolvedItems.map(({ item, pkg }) => ({
        package_id: pkg.id,
        service_type: pkg.serviceTypeCode,
        quantity: item.quantity,
        metadata_json: item.metadata_json,
      })),
    },
  });

  logger.info({ orderId: order.id, userId, totalAmount, items: resolvedItems.length, funded: !!funded }, "order created and paid");

  return {
    orderId: order.id,
    totalAmount,
    status: "paid",
    paidAt: new Date().toISOString(),
    totalCredits,
    grantTxId,
  };
}
