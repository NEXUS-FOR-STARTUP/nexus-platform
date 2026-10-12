import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import type { AuditProgressStepState } from "@app/shared";
import { apiClient } from "@/lib/api-client";

export interface LogEntry {
  timestamp: string;
  agent?: string;
  message: string;
}

export interface CaseAiStatusResponse {
  /** "unknown" = this checkpoint has no audit job yet. */
  status: "queued" | "running" | "completed" | "cancelled" | "failed" | "unknown";
  checkpoint?: string;
  scope?: string;
  inputSource?: string;
  steps: AuditProgressStepState[];
  jobId?: string;
  startedAt?: string;
  logs?: LogEntry[];
  error?: string | null;
}

/** Poll cadence while a job is active; status + steps + logs all come from one endpoint, so no SSE. */
const ACTIVE_POLL_MS = 5000;

/** Status of the latest audit job of ONE checkpoint (never the case-wide latest). */
export function useCaseAiStatus(caseId: string, checkpoint: string) {
  const queryClient = useQueryClient();

  const query = useQuery<CaseAiStatusResponse>({
    queryKey: ["case-ai-status", caseId, checkpoint],
    queryFn: async () => {
      const response = await apiClient.get(`/cases/${caseId}/ai-status`, { params: { checkpoint } });
      return response.data;
    },
    enabled: Boolean(caseId),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "queued" || status === "running" ? ACTIVE_POLL_MS : false;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/cases/${caseId}/ai-cancel`)).data,
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

  return { ...query, cancel: cancelMutation.mutate, isCancelling: cancelMutation.isPending };
}
