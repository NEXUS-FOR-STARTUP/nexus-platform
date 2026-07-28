import { AppError } from "../../../shared/domain/app-error.js";
import { findReportById, publishReport } from "../infrastructure/persistence/report.repository.js";
import { auditLogger } from "../../../shared/infrastructure/audit-logger.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function approveReportUseCase(userId: string, reportId: string) {
  const start = performance.now();
  const timer = auditLogger.startTimer();
  try {
    const report = await findReportById(reportId);

    if (!report) {
      throw new AppError(404, "NOT_FOUND", "Không tìm thấy báo cáo");
    }

    if (report.status !== "draft") {
      auditLogger.warn({
        operation: "report.approve",
        actor_id: userId,
        case_id: report.case_id,
        resource_type: "report",
        resource_id: reportId,
        action: "invalid_status",
        old_state: { status: report.status },
        error_code: "INVALID_REPORT_STATUS",
        duration_ms: timer(),
      });
      throw new AppError(
        409,
        "INVALID_REPORT_STATUS",
        "Báo cáo đã được xuất bản hoặc đã chốt trạng thái",
      );
    }

    const result = await publishReport(reportId, report.case_id, userId);
    auditLogger.log({
      operation: "report.approve",
      actor_id: userId,
      case_id: report.case_id,
      resource_type: "report",
      resource_id: reportId,
      action: "published",
      old_state: { status: "draft" },
      new_state: { status: result.status },
      duration_ms: timer(),
    });
    logger.info({ caseId: report.case_id, reportId, duration_ms: Math.round(performance.now() - start) }, 'report approved');
    return result;
  } catch (error) {
    logger.error({ err: error, reportId, duration_ms: Math.round(performance.now() - start) }, 'report approve failed');
    throw error;
  }
}
