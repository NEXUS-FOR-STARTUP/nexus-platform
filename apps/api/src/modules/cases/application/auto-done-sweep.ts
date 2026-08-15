import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";
import { findLatestCaseEventByType } from "../infrastructure/persistence/case.repository.js";
import { executeTransition } from "../../../services/case-transition.service.js";

const SWEEP_INTERVAL_MS = 24 * 3600_000;
const SWEEP_JITTER_MS = 5 * 60_000;
export const AUTO_DONE_AFTER_MS = 7 * 24 * 3600_000;

export function isAutoDoneDue(
  latestT11CreatedAt: Date,
  now: number = Date.now(),
): boolean {
  return now - latestT11CreatedAt.getTime() >= AUTO_DONE_AFTER_MS;
}

let sweepTimer: ReturnType<typeof setTimeout> | null = null;

function nextSweepDelayMs(): number {
  return SWEEP_INTERVAL_MS + Math.floor(Math.random() * (2 * SWEEP_JITTER_MS + 1)) - SWEEP_JITTER_MS;
}

function scheduleNextSweep(): void {
  sweepTimer = setTimeout(() => {
    void runAutoDoneSweep();
    scheduleNextSweep();
  }, nextSweepDelayMs());
}

async function runAutoDoneSweep(): Promise<void> {
  const stuckCases = await prisma.case.findMany({
    where: { internal_status: "report_ready_to_publish" },
    select: { id: true },
  });
  if (stuckCases.length === 0) return;

  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });
  if (!admin) {
    logger.warn("auto-done sweep: no admin user found — skipping");
    return;
  }

  for (const caseItem of stuckCases) {
    try {
      const latestT11 = await findLatestCaseEventByType(caseItem.id, "T11_SUBMIT_OUTPUT");
      if (!latestT11 || !isAutoDoneDue(latestT11.created_at)) continue;

      const fresh = await prisma.case.findUnique({
        where: { id: caseItem.id },
        select: { internal_status: true },
      });
      if (fresh?.internal_status !== "report_ready_to_publish") continue;

      await executeTransition({
        transition: "T14_COMPLETE",
        caseId: caseItem.id,
        actorId: admin.id,
        roleVerified: "ADMIN",
        data: { note: "auto_completed" },
      });

      logger.info({ caseId: caseItem.id, actorId: admin.id }, "auto-done sweep: case auto-completed");
    } catch (err) {
      logger.error({ err, caseId: caseItem.id }, "auto-done sweep: transition failed");
    }
  }
}

export function startAutoDoneSweep(): void {
  if (sweepTimer) return;
  void runAutoDoneSweep();
  scheduleNextSweep();
  logger.info("auto-done sweep worker started");
}

export function stopAutoDoneSweep(): void {
  if (sweepTimer) {
    clearTimeout(sweepTimer);
    sweepTimer = null;
    logger.info("auto-done sweep worker stopped");
  }
}
