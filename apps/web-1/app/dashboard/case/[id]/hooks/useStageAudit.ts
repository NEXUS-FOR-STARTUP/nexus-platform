import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import { findStageByCode, type StageCode } from "@app/shared/stages";

interface TriggerStageAuditInput {
  checkpoint: StageCode;
  scope?: string;
  submission_type?: "initial" | "resubmit" | "logic_check";
  change_summary?: string;
}

export function useStageAudit(caseId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: TriggerStageAuditInput) => {
      const res = await apiClient.post(`/cases/${caseId}/ai-status`, {
        checkpoint: payload.checkpoint,
        scope: payload.scope ?? "full",
        submission_type: payload.submission_type ?? "initial",
        ...(payload.change_summary ? { change_summary: payload.change_summary } : {}),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["case", caseId, "stages"] });
      notifications.show({ color: "green", title: "Bắt đầu chấm bài", message: "Hệ thống AI đang phân tích bài nộp của bạn." });
    },
    onError: (err) => {
      if (isAxiosError(err)) {
        const data = err.response?.data;
        const details = typeof data === "object" && data !== null && "details" in data ? (data.details as Record<string, unknown>) : undefined;
        const runningCode = typeof details?.checkpoint_code === "string" ? details.checkpoint_code : undefined;

        if (err.response?.status === 409 && (data as { code?: string })?.code === "AUDIT_IN_PROGRESS") {
          const runningStage = runningCode ? findStageByCode(runningCode)?.name ?? runningCode : "giai đoạn khác";
          notifications.show({
            color: "red",
            title: `Đang chấm ${runningStage}`,
            message: "Mỗi dự án chỉ chấm một giai đoạn một lúc. Khi xong bạn có thể chấm tiếp.",
          });
          return;
        }

        if (err.response?.status === 409 && (data as { code?: string })?.code === "STAGE_INPUT_REQUIRED") {
          notifications.show({
            color: "red",
            title: "Chưa có nội dung để chấm",
            message: typeof (data as { message?: string })?.message === "string"
              ? (data as { message: string }).message
              : "Vui lòng trả lời ít nhất một câu trong mẫu hoặc tải tài liệu lên trước khi chấm.",
          });
          return;
        }

        const message = typeof (data as { message?: string })?.message === "string" ? (data as { message: string }).message : undefined;
        notifications.show({ color: "red", title: "Không thể chấm bài", message: message || "Đã có lỗi xảy ra." });
        return;
      }
      notifications.show({ color: "red", title: "Không thể chấm bài", message: "Đã có lỗi xảy ra." });
    },
  });

  return { triggerAudit: mutation.mutateAsync, isPending: mutation.isPending };
}
