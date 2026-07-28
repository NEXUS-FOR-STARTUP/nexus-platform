import logger from "../../../shared/infrastructure/logger.js";
import { findLatestApprovedReport } from "../infrastructure/persistence/report.repository.js";

export async function getLatestReportUseCase(caseId: string) {
  const start = performance.now();
  try {
    const result = await findLatestApprovedReport(caseId);
    const reportId = result?.id;
    logger.info({ caseId, reportId, duration_ms: Math.round(performance.now() - start) }, 'report retrieved');
    return result;
  } catch (error) {
    logger.error({ err: error, caseId, duration_ms: Math.round(performance.now() - start) }, 'report retrieve failed');
    throw error;
  }
}
