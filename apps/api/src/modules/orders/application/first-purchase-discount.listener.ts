import { randomBytes } from "node:crypto";
import { STAGES } from "@app/shared";
import { DISCOUNT_DEFAULT_VALID_DAYS } from "@repo/validation";
import { prisma } from "../../../db.js";
import { DOMAIN_EVENTS, type DomainEvent } from "../../../shared/domain/domain-events.js";
import { onEvent } from "../../../shared/infrastructure/event-bus.js";
import logger from "../../../shared/infrastructure/logger.js";
import { insertOutboxEvent } from "../../../shared/infrastructure/persistence/outbox.repository.js";
import { SYSTEM_USER_ID } from "../../payments/infrastructure/persistence/payment.repository.js";

const DEFAULT_PERCENT = 40;
const MS_PER_DAY = 86_400_000;
const CODE_LENGTH = 8;
/** 32 symbols (digits + letters without I, L, O, U): no modulo bias on random bytes, hard to mistype from an email. */
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Percent off the follow-up purchase; env-overridable, falls back to the default if out of range. */
export function firstPurchaseDiscountPercent(): number {
  const raw = Number(process.env["FIRST_PURCHASE_DISCOUNT_PERCENT"] ?? DEFAULT_PERCENT);
  return Number.isInteger(raw) && raw >= 1 && raw <= 99 ? raw : DEFAULT_PERCENT;
}

/** Days a granted code stays usable; env-overridable, falls back to the default if not a positive integer. */
export function firstPurchaseDiscountValidDays(): number {
  const raw = Number(process.env["FIRST_PURCHASE_DISCOUNT_VALID_DAYS"] ?? DISCOUNT_DEFAULT_VALID_DAYS);
  return Number.isInteger(raw) && raw >= 1 ? raw : DISCOUNT_DEFAULT_VALID_DAYS;
}

export function randomDiscountCode(): string {
  return Array.from(randomBytes(CODE_LENGTH), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function initFirstPurchaseDiscountListener(): void {
  onEvent(DOMAIN_EVENTS.ORDER_PAID, (event: DomainEvent) => {
    void grantFirstPurchaseCodes(event).catch((error) => {
      logger.error({ eventId: event.eventId, err: error }, "first-purchase discount listener failed");
    });
  });
}

/**
 * One personal code per (user, project, service), granted on the first paid purchase of that service in that project.
 * The unique key on the code row makes a replayed ORDER_PAID a no-op.
 */
export async function grantFirstPurchaseCodes(event: DomainEvent): Promise<void> {
  const p = event.payload as Record<string, unknown>;
  const userId = typeof p["userId"] === "string" ? p["userId"] : null;
  const orderId = typeof p["orderId"] === "string" ? p["orderId"] : null;
  // Sponsored (pay-later / on-behalf) orders go to the system account: no code, no mail.
  if (!userId || !orderId || p["funded"] === true || !(Number(p["totalAmount"]) > 0)) return;

  // An order that already used a discount is a follow-up purchase, not a first one.
  if (await prisma.discountRedemption.findUnique({ where: { order_id: orderId } })) return;

  const items = Array.isArray(p["items"])
    ? (p["items"] as { service_type?: unknown; metadata_json?: { case_id?: unknown } | null }[])
    : [];
  const pairs = new Map<string, { serviceCode: string; caseId: string }>();
  for (const item of items) {
    const caseId = item.metadata_json?.case_id;
    if (typeof item.service_type !== "string" || typeof caseId !== "string") continue;
    pairs.set(`${item.service_type}|${caseId}`, { serviceCode: item.service_type, caseId });
  }

  const codes = [...new Set([...pairs.values()].map((x) => x.serviceCode))];
  const types = await prisma.serviceType.findMany({ where: { code: { in: codes } }, select: { id: true, code: true } });
  const percent = firstPurchaseDiscountPercent();
  const expiresAt = new Date(Date.now() + firstPurchaseDiscountValidDays() * MS_PER_DAY);

  for (const { serviceCode, caseId } of pairs.values()) {
    const type = types.find((t) => t.code === serviceCode);
    const stage = STAGES.find((s) => s.serviceType === serviceCode);
    if (!type || !stage) continue;
    const code = randomDiscountCode();
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.discountCode.createMany({
        data: [
          {
            code,
            percent_off: percent,
            service_type_id: type.id,
            max_redemptions: 1,
            expires_at: expiresAt,
            owner_user_id: userId,
            case_id: caseId,
            created_by: SYSTEM_USER_ID,
          },
        ],
        skipDuplicates: true,
      });
      if (count === 0) return; // already granted for this user + project + service
      await insertOutboxEvent(tx, {
        event_type: DOMAIN_EVENTS.DISCOUNT_GRANTED,
        payload_json: {
          userId,
          orderId,
          code,
          percentOff: percent,
          expiresAt: expiresAt.toISOString(),
          serviceLabel: `Gói chấm ${stage.name}`,
          linkCaseId: caseId,
        },
      });
    });
  }
}
