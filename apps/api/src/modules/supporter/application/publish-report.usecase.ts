import { approveReportUseCase } from "../../reports/application/approve-report.usecase.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function publishReportUseCase(userId: string, reportId: string) {
  const start = performance.now();
  try {
    const result = await approveReportUseCase(userId, reportId);
    logger.info({ reportId, duration_ms: Math.round(performance.now() - start) }, 'report published');
    return result;
  } catch (error) {
    logger.error({ err: error, reportId, duration_ms: Math.round(performance.now() - start) }, 'report publish failed');
    throw error;
  }
}
