import { onEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS, type DomainEvent } from "../../../shared/domain/domain-events.js";
import logger from "../../../shared/infrastructure/logger.js";
import {
  initOmpQueueListener,
  triggerOmpAuditForCase,
} from "./omp-audit-coordinator.js";
import { findFirstIntakeUnit } from "../../cases/infrastructure/persistence/case.repository.js";

/**
 * Initialize listener for ORDER_PAID domain event.
 * Automatically dispatches OMP evaluation into BullMQ queue.
 */
export function initAiAuditOrderListener(): void {
  // Initialize BullMQ QueueEvents listener for job completions
  initOmpQueueListener();

  onEvent(DOMAIN_EVENTS.ORDER_PAID, (event: DomainEvent) => {
    void handleOrderPaidForAiAudit(event).catch((error) => {
      logger.error({ eventId: event.eventId, err: error }, "ai-audit-order listener unhandled error");
    });
  });
}

async function handleOrderPaidForAiAudit(event: DomainEvent): Promise<void> {
  const payload = event.payload as Record<string, unknown> | null;
  if (!payload) return;

  const caseId = typeof payload["caseId"] === "string" ? (payload["caseId"] as string) : undefined;
  const orderId = typeof payload["orderId"] === "string" ? (payload["orderId"] as string) : undefined;
  // Default về "credit_audit" để backward compat với các order cũ không có serviceType trong payload
  const serviceType = typeof payload["serviceType"] === "string" ? payload["serviceType"] : "credit_audit";

  if (!caseId) {
    logger.debug({ orderId }, "ORDER_PAID event has no associated caseId, skipping AI audit");
    return;
  }

  // credit_audit_manual = mua credit cho đánh giá lần 2+.
  // Listener KHÔNG auto-trigger — user sẽ chọn loại đánh giá và trigger từ UI (StatusGuidanceCard).
  if (serviceType === "credit_audit_manual") {
    logger.info({ orderId, caseId }, "Manual credit purchase — skipping auto-trigger, user will trigger from UI");
    return;
  }

  // Guard: If student hasn't submitted intake form yet (e.g. upgraded package right after Team Fit),
  // skip auto-trigger. The audit will trigger automatically when student submits intake.
  const intakeUnit = await findFirstIntakeUnit(caseId);
  if (!intakeUnit) {
    logger.info(
      { orderId, caseId },
      "Case has no intake submission yet — skipping auto-trigger on ORDER_PAID. Audit will trigger when student submits intake."
    );
    return;
  }

  logger.info({ orderId, caseId }, "AI Audit Listener received ORDER_PAID. Dispatching OMP audit to BullMQ queue...");

  try {
    await triggerOmpAuditForCase(caseId);
    logger.info({ caseId, orderId }, "Case successfully enqueued to BullMQ OMP worker");
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error({ caseId, errMsg }, "Failed to trigger OMP audit workflow for paid order");
  }
}

