import { AppError } from "../../../shared/domain/app-error.js";
import { asNonEmptyString } from "../../../shared/infrastructure/http-helpers.js";
import { validateCp1Intake } from "../http/cases.schema.js";
import { validateDocumentWriteInputs } from "../../documents/application/validate-document-write.js";
import { isValidPrice } from "../domain/case.types.js";
import {
  createCaseWithCheckpointAndIntake,
} from "../infrastructure/persistence/case.repository.js";
import { findPackageById as defaultFindPackageById } from "../../packages/infrastructure/persistence/package.repository.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { CreateCaseRequest } from "./cases.dto.js";

type CreateCaseDeps = {
  findPackageById?: typeof defaultFindPackageById;
  createCaseWithCheckpointAndIntake?: typeof createCaseWithCheckpointAndIntake;
};

const defaultDeps = {
  findPackageById: defaultFindPackageById,
  createCaseWithCheckpointAndIntake,
};

function normalizeCreateCaseBody(body: CreateCaseRequest): CreateCaseRequest {
  const legacySituations = Array.isArray(body.current_situations)
    ? body.current_situations.filter((item) => typeof item === "string" && item.trim().length > 0)
    : [];

  const derivedBlocker =
    body.current_blocker?.trim() ||
    body.case_summary?.trim() ||
    legacySituations.join(" ").trim();

  return {
    ...body,
    current_blocker: derivedBlocker || undefined,
    current_situations: legacySituations,
    case_summary: typeof body.case_summary === "string" ? body.case_summary : "",
  };
}

const MAX_CODE_RETRIES = 5;

export async function createCaseUseCase(
  userId: string,
  body: CreateCaseRequest,
  deps: CreateCaseDeps = {},
) {
  const startTime = Date.now();
  const { findPackageById, createCaseWithCheckpointAndIntake } = {
    ...defaultDeps,
    ...deps,
  };

  const normalizedBody = normalizeCreateCaseBody(body);
  const validationErrors = validateCp1Intake(normalizedBody);
  if (validationErrors.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ", validationErrors);
  }

  const documentValidation = validateDocumentWriteInputs(normalizedBody.documents || []);
  if (!documentValidation.ok) {
    throw new AppError(400, "VALIDATION_ERROR", documentValidation.error);
  }

  const { package_id, deadline, team_context } = normalizedBody;

  if (!asNonEmptyString(package_id)) {
    throw new AppError(400, "VALIDATION_ERROR", "Thiếu gói dịch vụ (package_id)");
  }

  const parsedDeadline = deadline ? new Date(deadline) : null;
  if (deadline && Number.isNaN(parsedDeadline?.getTime())) {
    throw new AppError(400, "VALIDATION_ERROR", "Deadline không hợp lệ");
  }

  const team_name = team_context?.project_name || null;
  const school = normalizedBody.school || null;
  const course_context = normalizedBody.course_context || null;
  const group_no = team_context?.group_no || null;

  const servicePackage = await findPackageById(package_id);
  if (!servicePackage) {
    throw new AppError(400, "INVALID_PACKAGE", "Không tìm thấy gói dịch vụ hợp lệ");
  }
  if (!servicePackage.is_active) {
    throw new AppError(400, "PACKAGE_INACTIVE", "Gói dịch vụ này đã tạm ngưng nhận hồ sơ mới");
  }

  const lockedPrice = servicePackage.price;
  if (!isValidPrice(lockedPrice)) {
    throw new AppError(400, "INVALID_PACKAGE_PRICE", "Giá gói dịch vụ hiện tại không hợp lệ");
  }

  const isFree = lockedPrice === 0;

  // Optimistic retry: insert directly; let DB unique constraint catch collisions atomically.
  // No TOCTOU race window.
  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const caseCode = `NX-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const result = await createCaseWithCheckpointAndIntake({
        caseCode,
        userId,
        teamName: team_name,
        school,
        courseContext: course_context,
        groupNo: group_no,
        packageId: package_id,
        lockedPrice,
        deadline: parsedDeadline,
        isFree,
        rawBody: normalizedBody,
      });
      const caseId = result.id;
      logger.info({ caseId, actorId: userId, duration_ms: Date.now() - startTime }, 'case created');
      return result;
    } catch (err: any) {
      // P2002 = unique constraint violation on case_code → collision; retry with new code
      if (err?.code === "P2002") {
        continue;
      }
      logger.error({ err, actorId: userId, duration_ms: Date.now() - startTime }, 'case created failed');
      throw err;
    }
  }

  logger.error({ actorId: userId, duration_ms: Date.now() - startTime }, 'case created failed — unique code exhausted');
  throw new AppError(
    500,
    "INTERNAL_ERROR",
    "Không thể tạo mã case duy nhất, vui lòng thử lại.",
  );
}
