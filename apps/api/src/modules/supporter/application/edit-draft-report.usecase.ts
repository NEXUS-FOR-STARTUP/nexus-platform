import { AppError } from "../../../shared/domain/app-error.js";
import { findReportById, updateReportDraftContent } from "../../reports/infrastructure/persistence/report.repository.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function editDraftReportUseCase(
  reportId: string,
  contentMd: string,
) {
  const start = performance.now();
  try {
    const report = await findReportById(reportId);

    if (!report) {
      throw new AppError(404, "NOT_FOUND", "Không tìm thấy báo cáo");
    }

    if (report.status !== "draft") {
      throw new AppError(
        409,
        "INVALID_REPORT_STATUS",
        "Báo cáo đã được xuất bản hoặc đã chốt trạng thái, không thể chỉnh sửa",
      );
    }

    const trimmedContent = typeof contentMd === "string" ? contentMd.trim() : "";
    if (!trimmedContent) {
      throw new AppError(400, "VALIDATION_ERROR", "Nội dung báo cáo không được để trống");
    }

    const result = await updateReportDraftContent(reportId, trimmedContent);
    logger.info({ caseId: report.case_id, reportId, duration_ms: Math.round(performance.now() - start) }, 'draft report edited');
    return result;
  } catch (error) {
    logger.error({ err: error, reportId, duration_ms: Math.round(performance.now() - start) }, 'draft report edit failed');
    throw error;
  }
}
