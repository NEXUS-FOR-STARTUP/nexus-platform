import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { StageCode } from "@app/shared/stages";

export type StageStatus = "not_started" | "drafting" | "files_submitted" | "grading" | "has_result";

export interface StageSummary {
  checkpoint_code: StageCode;
  status: StageStatus;
  answered_count: number;
  answers_ready_full: boolean;
  answers_ready_questionnaire: boolean;
  file_count: number;
  latest_report: { id: string; report_type: string; created_at: string } | null;
}

export interface StageSummariesResponse {
  stages: StageSummary[];
  active_audit: { checkpoint_code: string } | null;
}

export function useStageSummaries(caseId: string) {
  return useQuery<StageSummariesResponse>({
    queryKey: ["case", caseId, "stages"],
    queryFn: async () => {
      const res = await apiClient.get<StageSummariesResponse>(`/cases/${caseId}/stages`);
      return res.data;
    },
    enabled: Boolean(caseId),
    refetchInterval: (query) => {
      const active = query.state.data?.active_audit;
      return active ? 5000 : 30000;
    },
  });
}
