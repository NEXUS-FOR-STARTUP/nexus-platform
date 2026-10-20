import { TEMPLATE_REGISTRY, type TemplateKey } from "@repo/validation";
import type { ChipTone } from "@/components/ui/StatusChip";
import type { StageView } from "./stage-view";
import type { StageStatus } from "../../hooks/useStageSummaries";

/** Shared by Overview and Journey rows: chip, secondary-button label and the view it opens. */
export const STAGE_STATUS: Record<StageStatus, { tone: ChipTone; label: string; cta: string; view: StageView }> = {
  not_started: { tone: "neutral", label: "Chưa bắt đầu", cta: "Bắt đầu", view: "draft" },
  drafting: { tone: "draft", label: "Đang soạn", cta: "Tiếp tục", view: "draft" },
  files_submitted: { tone: "draft", label: "Đã nộp tài liệu", cta: "Tiếp tục", view: "draft" },
  grading: { tone: "warn", label: "Đang chấm", cta: "Xem tiến trình", view: "results" },
  has_result: { tone: "ok", label: "Đã có kết quả", cta: "Xem kết quả", view: "results" },
};

export function stageQuestionTotal(templateKey: string): number {
  return TEMPLATE_REGISTRY[templateKey as TemplateKey]?.phases.flatMap((p) => p.questions).length ?? 0;
}
