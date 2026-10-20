import type { ChipTone } from "@/components/ui/StatusChip";
import type { CaseAiStatusResponse } from "../../../hooks/useCaseAiStatus";

export type GradingStatus = CaseAiStatusResponse["status"];
export type GradingAction = "retry" | "zalo" | "view" | "close" | "collapse";

export interface GradingState {
  tone: ChipTone;
  label: string;
  actions: GradingAction[];
}

const GRADING_STATES: Partial<Record<GradingStatus, GradingState>> = {
  queued: { tone: "warn", label: "Hàng đợi", actions: ["collapse"] },
  running: { tone: "draft", label: "Đang chấm", actions: ["collapse"] },
  completed: { tone: "ok", label: "Hoàn tất", actions: ["view", "close"] },
  failed: { tone: "error", label: "Gián đoạn", actions: ["retry", "zalo", "collapse"] },
  cancelled: { tone: "neutral", label: "Đã dừng", actions: ["retry", "collapse"] },
};

export function describeGradingState(status: GradingStatus): GradingState | null {
  return GRADING_STATES[status] ?? null;
}
