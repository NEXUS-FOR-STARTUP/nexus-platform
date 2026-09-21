import type { LogEntry } from "../hooks/useCaseAiStatus";
import type { RadarStage } from "./RadarStagePipeline";

export const DEFAULT_STAGES: RadarStage[] = [
  {
    id: 1,
    num: "01",
    name: "Tiếp nhận dự án",
    desc: "Thu thập dữ liệu dự án và bóc tách thông tin cốt lõi",
  },
  {
    id: 2,
    num: "02",
    name: "Phân tích bài toán",
    desc: "Đối chiếu bài toán dự án và định vị giải pháp",
  },
  {
    id: 3,
    num: "03",
    name: "Đối chiếu 5 tiêu chí",
    desc: "Đánh giá chi tiết giả định, rủi ro và mô hình kinh doanh",
  },
  {
    id: 4,
    num: "04",
    name: "Lập báo cáo đánh giá",
    desc: "Tổng hợp kết quả và xuất báo cáo đánh giá hoàn chỉnh",
  },
];

export const DIRTY_LOG_KEYWORDS = [
  "[gọi tool]", "🔧", "[xong tool]", "✅", "[vòng lặp]", "🔄",
  "[lượt hoàn thành]", "⏱️", "tokens", "system_prompt", "read path:",
  "glob path:", "[model]", "sandbox runner", "todo", "omp-session",
  "omp runner", "omp process", "omp",
];

export const BADGE_CONFIG: Record<string, { cls: string; label: string; dot: boolean }> = {
  failed: {
    cls: "bg-danger-soft text-danger border-danger/20 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
    label: "Gián đoạn",
    dot: false,
  },
  cancelled: {
    cls: "bg-surface-muted text-text-muted border-border-app dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60",
    label: "Đã dừng",
    dot: false,
  },
  queued: {
    cls: "bg-warning-soft text-warning border-warning/20 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
    label: "Hàng đợi",
    dot: false,
  },
  running: {
    cls: "bg-brand-soft/40 text-brand border-brand/20 dark:bg-brand/20 dark:text-blue-300 dark:border-brand/40",
    label: "Đang đánh giá",
    dot: true,
  },
  completed: {
    cls: "bg-success-soft text-success border-success/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
    label: "Đã hoàn thành",
    dot: false,
  },
};

export function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function filterCleanLogs(logs: LogEntry[]): LogEntry[] {
  return logs
    .filter(
      (l) =>
        l.message &&
        !DIRTY_LOG_KEYWORDS.some((kw) => l.message.toLowerCase().includes(kw)),
    )
    .map((l) => ({
      ...l,
      message: l.message
        .replace(/[()[\]·]/g, "-")
        .replace(/\s+-\s+/g, " - ")
        .trim(),
    }));
}

export function calculateRadarProgress(status: string, logs: LogEntry[]) {
  if (status === "completed") {
    return { currentStep: 4, progressPercent: 100, statusText: "Đã hoàn tất báo cáo đánh giá dự án" };
  }
  if (status === "failed") {
    return { currentStep: 1, progressPercent: 20, statusText: "Tiến trình gặp gián đoạn, bạn có thể bấm Chạy lại" };
  }
  if (status === "cancelled") {
    return { currentStep: 1, progressPercent: 15, statusText: "Tiến trình đánh giá đã dừng theo yêu cầu" };
  }
  if (status === "queued") {
    return { currentStep: 1, progressPercent: 10, statusText: "Đang chuẩn bị môi trường đánh giá AI" };
  }
  if (logs.some((l) => l.message.includes("Cột mốc 3") || l.message.includes("hoàn tất báo cáo"))) {
    return { currentStep: 4, progressPercent: 95, statusText: "Đang tổng hợp kết quả và xuất báo cáo đánh giá" };
  }
  if (logs.some((l) => l.message.includes("Cột mốc 2") || l.message.includes("phản biện chuyên sâu"))) {
    return { currentStep: 3, progressPercent: 70, statusText: "Đang đánh giá chi tiết theo 5 nhóm tiêu chí" };
  }
  if (logs.some((l) => l.message.includes("Cột mốc 1") || l.message.includes("ma trận Vấn đề"))) {
    return { currentStep: 2, progressPercent: 45, statusText: "Đang phân tích bài toán và mô hình dự án" };
  }
  return { currentStep: 1, progressPercent: 25, statusText: "Đang tiếp nhận và bóc tách dữ liệu dự án" };
}
