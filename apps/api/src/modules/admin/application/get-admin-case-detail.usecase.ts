import { AppError } from "../../../shared/domain/app-error.js";
import {
  findCaseByIdWithLifecycleUnitsAndEvents,
} from "../../cases/infrastructure/persistence/case.repository.js";
import { getAvailableTransitions } from "../../cases/domain/case-machine.js";

function normalizeIntakeSnapshot(rawContent: string | null) {
  if (!rawContent) return null;

  try {
    const parsed = JSON.parse(rawContent);
    const legacySituations = Array.isArray(parsed.current_situations)
      ? parsed.current_situations.filter((item: unknown) => typeof item === "string" && item.trim().length > 0)
      : [];

    return {
      ...parsed,
      current_situations: legacySituations,
      current_blocker:
        parsed.current_blocker ||
        parsed.case_summary ||
        legacySituations.join(" ") ||
        "",
    };
  } catch {
    return null;
  }
}

export async function getAdminCaseDetailUseCase(caseId: string) {
  if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "ID dự án không hợp lệ");
  }

  const item = await findCaseByIdWithLifecycleUnitsAndEvents(caseId);

  if (!item) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  const intakeUnit = item.lifecycle_units.find((u: any) => u.unit_type === "version" && u.unit_code === "v00");
  const intake_snapshot = normalizeIntakeSnapshot(intakeUnit?.content || null);

  const allowed_transitions = getAvailableTransitions(item.internal_status);

  return { case: item, intake_snapshot, allowed_transitions };
}
