import { useQuery } from "@tanstack/react-query";
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
  userNote?: string;
  steps: AuditProgressStepState[];
  jobId?: string;
  startedAt?: string;
  logs?: LogEntry[];
  error?: string | null;
}

/** Poll cadence while a job is active; status + steps + logs all come from one endpoint, so no SSE. */
const ACTIVE_POLL_MS = 5000;

/**
 * Status of the latest audit job of ONE checkpoint (never the case-wide latest).
 * Read-only for students: stopping a running job is support/admin only (admin job drawer).
 */
export function useCaseAiStatus(caseId: string, checkpoint: string) {
  return useQuery<CaseAiStatusResponse>({
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
}
