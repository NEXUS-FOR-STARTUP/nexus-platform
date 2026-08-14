import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/**
 * Supporter machine actions (D14): T7/T8/T10/T14.
 * T11 (submit output) is handled by useSupporterOutputUpload.
 */
export function useSupporterActions(caseId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    queryClient.invalidateQueries({ queryKey: ["cases"] });
  };

  // T7_START_WORK: assigned → supporter_working
  const startWorkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/cases/${caseId}/status`, {
        user_facing_stage: "under_review",
        internal_status: "supporter_working",
      });
      return response.data;
    },
    onSuccess: invalidate,
  });

  // T8_REQUEST_INFO: supporter_working → waiting_user
  const requestMoreInfoMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiClient.post(`/supporter/cases/${caseId}/request-more-info`, { query });
      return response.data;
    },
    onSuccess: invalidate,
  });

  // T10_START_REVIEW_REVISION: supporter_working → supporter_working (self-loop)
  const startReviewRevisionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/cases/${caseId}/status`, {
        user_facing_stage: "under_review",
        internal_status: "supporter_working",
      });
      return response.data;
    },
    onSuccess: invalidate,
  });

  // T14_COMPLETE: report_ready_to_publish → done
  const completeCaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/cases/${caseId}/complete`);
      return response.data;
    },
    onSuccess: invalidate,
  });

  return {
    startWork: startWorkMutation.mutateAsync,
    isStartingWork: startWorkMutation.isPending,
    requestMoreInfo: requestMoreInfoMutation.mutateAsync,
    isRequestingMoreInfo: requestMoreInfoMutation.isPending,
    startReviewRevision: startReviewRevisionMutation.mutateAsync,
    isStartingReviewRevision: startReviewRevisionMutation.isPending,
    completeCase: completeCaseMutation.mutateAsync,
    isCompletingCase: completeCaseMutation.isPending,
  };
}
