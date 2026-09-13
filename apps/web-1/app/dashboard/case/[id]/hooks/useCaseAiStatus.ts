import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";

export interface LogEntry {
  timestamp: string;
  agent?: string;
  message: string;
}

export interface CaseAiStatusResponse {
  isAiPackage: boolean;
  jobId?: string;
  caseId?: string;
  caseCode?: string;
  projectName?: string;
  status: "queued" | "running" | "completed" | "cancelled" | "failed" | "unknown";
  startedAt?: string;
  elapsedSeconds?: number;
  logs?: LogEntry[];
  error?: string | null;
}

export function useCaseAiStatus(caseId: string, enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery<CaseAiStatusResponse>({
    queryKey: ["case-ai-status", caseId],
    queryFn: async () => {
      const response = await apiClient.get(`/cases/${caseId}/ai-status`);
      return response.data;
    },
    enabled: !!caseId && enabled,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status === "queued" || status === "running") {
        return 3000;
      }
      return false;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/cases/${caseId}/ai-cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-ai-status", caseId] });
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
    onError: () => {
      notifications.show({
        title: "Hủy thất bại",
        message: "Không hủy được tiến trình. Vui lòng thử lại.",
        color: "red",
      });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/cases/${caseId}/ai-retry`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-ai-status", caseId] });
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
    onError: (error: unknown) => {
      const errData = isAxiosError<{ code?: string; message?: string }>(error)
        ? error.response?.data
        : undefined;
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 402 || errData?.code === "NO_CREDITS") {
        notifications.show({
          title: "Không đủ credit",
          message: "Bạn đã hết credit đánh giá. Vui lòng mua thêm credit để tiếp tục.",
          color: "orange",
        });
        return;
      }
      if (status === 409) {
        notifications.show({
          title: "Đánh giá đang diễn ra",
          message: errData?.message || "Hệ thống đang thẩm định. Vui lòng chờ kết quả trước khi gửi lại.",
          color: "blue",
        });
        return;
      }
      notifications.show({
        title: "Chạy lại thất bại",
        message: errData?.message || "Đã xảy ra lỗi. Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });

  return {
    ...query,
    aiStatusData: query.data,
    cancel: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
    retry: retryMutation.mutate,
    isRetrying: retryMutation.isPending,
  };
}
