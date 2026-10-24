import { findStageByCode } from "@app/shared/stages";
import type { StageSummary } from "../hooks/useStageSummaries";

export interface NextAction {
  id: string;
  stageCode: string;
  stageSlug: string;
  title: string;
  description: string;
  cta: string;
  view: "draft" | "files" | "results";
  priority: number;
}

/** Pure rule-based derivation of the top next actions (max 3). */
export function buildNextActions(stages: StageSummary[] | undefined): NextAction[] {
  if (!stages) return [];
  const actions: NextAction[] = [];

  for (const s of stages) {
    const stage = findStageByCode(s.checkpoint_code);
    if (!stage) continue;

    if (s.status === "grading") {
      actions.push({
        id: `grading-${s.checkpoint_code}`,
        stageCode: s.checkpoint_code,
        stageSlug: stage.slug,
        title: `Đang chấm giai đoạn ${stage.name}`,
        description: "Hệ thống AI đang đọc tài liệu và chấm điểm. Kết quả sẽ có sau ít phút.",
        cta: "Xem tiến trình",
        view: "results",
        priority: 1,
      });
    } else if (s.status === "has_result") {
      actions.push({
        id: `result-${s.checkpoint_code}`,
        stageCode: s.checkpoint_code,
        stageSlug: stage.slug,
        title: `Có kết quả chấm mới cho ${stage.name}`,
        description: "Báo cáo phân tích đã sẵn sàng. Bạn có thể xem nhận xét và sửa đổi nội dung.",
        cta: "Xem báo cáo",
        view: "results",
        priority: 2,
      });
    } else if (s.status === "files_submitted" || s.status === "drafting") {
      actions.push({
        id: `continue-${s.checkpoint_code}`,
        stageCode: s.checkpoint_code,
        stageSlug: stage.slug,
        title: `Tiếp tục hoàn thiện ${stage.name}`,
        description: stage.serviceType
          ? `Đã trả lời ${s.answered_count} câu và tải lên ${s.file_count} tài liệu.`
          : `Đã trả lời ${s.answered_count} câu.`,
        cta: "Soạn thảo tiếp",
        view: "draft",
        priority: 3,
      });
    } else if (s.status === "not_started" && s.checkpoint_code === "CP1") {
      actions.push({
        id: `start-cp1`,
        stageCode: "CP1",
        stageSlug: "y-tuong",
        title: "Bắt đầu giai đoạn Ý tưởng",
        description: "Điền mẫu đề xuất hoặc tải tài liệu ý tưởng lên để bắt đầu thẩm định.",
        cta: "Bắt đầu ngay",
        view: "draft",
        priority: 4,
      });
    }
  }

  return actions.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
