import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";
import type { Case, DocumentWorkspace } from "@/types";

/** Open request-more-info / close-case event surfaced for the student workspace. */
export interface OpenInfoRequest {
  metadata_json?: { query?: string; reason?: string } | null;
}

interface CaseDetailsResponse {
  case: Case;
  intake_snapshot?: unknown;
  latest_report?: unknown;
  latest_user_action?: unknown;
  document_board_sections?: unknown;
  round_history?: unknown;
  open_requests_for_more_info?: OpenInfoRequest[] | null;
  document_workspace?: DocumentWorkspace | null;
}

export function useCaseDetails(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const caseQuery = useQuery<CaseDetailsResponse>({
    queryKey: ["case", id],
    queryFn: async () => {
      const response = await apiClient.get(`/cases/${id}`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!caseQuery.error || !isAxiosError(caseQuery.error) || caseQuery.error.response?.status !== 404) {
      return;
    }
    notifications.show({
      title: "Hồ sơ đã bị xóa",
      message: "Hồ sơ này không còn tồn tại. Bạn sẽ được chuyển về trang tổng quan.",
      color: "red",
    });
    queryClient.invalidateQueries();
    router.replace("/dashboard");
  }, [caseQuery.error, router, queryClient]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: {
      team_name?: string;
      school?: string;
      course_context?: string;
      group_no?: string;
      contact?: Record<string, any>;
      idea?: Record<string, any>;
      current_blocker?: string;
      support_needs?: Record<string, any>;
      boundary_confirmations?: string[];
    }) => {
      const response = await apiClient.put(`/cases/${id}/settings`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cases"] });
    },
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`/cases/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cases"] });
    },
  });

  const confirmCompleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/cases/${id}/complete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      notifications.show({
        title: "Đã xác nhận hoàn thành",
        message: "Quy trình phản biện đã được đóng.",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Lỗi",
        message: "Không thể xác nhận hoàn thành. Vui lòng thử lại.",
        color: "red",
      });
    },
  });

  return {
    caseData: caseQuery.data?.case || null,
    creditBalance: caseQuery.data?.case?.credit_balance ?? 0,
    slaDeadlineAt: caseQuery.data?.case?.sla_deadline_at || null,
    allowedTransitions: caseQuery.data?.case?.allowed_transitions || [],
    intakeSnapshot: caseQuery.data?.intake_snapshot || null,
    latestReport: caseQuery.data?.latest_report || null,
    teamFitReport: caseQuery.data?.case?.team_fit_report || null,
    latestUserAction: caseQuery.data?.latest_user_action || null,
    documentBoardSections: caseQuery.data?.document_board_sections || null,
    roundHistory: caseQuery.data?.round_history || null,
    openRequestsForMoreInfo: caseQuery.data?.open_requests_for_more_info || null,
    documentWorkspace: caseQuery.data?.document_workspace || null,
    isLoading: caseQuery.isLoading,
    error: caseQuery.error,
    refetch: caseQuery.refetch,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdatingSettings: updateSettingsMutation.isPending,
    deleteCase: deleteCaseMutation.mutateAsync,
    isDeletingCase: deleteCaseMutation.isPending,
    confirmComplete: confirmCompleteMutation.mutateAsync,
    isConfirmingComplete: confirmCompleteMutation.isPending,
  };
}
