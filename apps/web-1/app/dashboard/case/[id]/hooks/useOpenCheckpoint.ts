import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";
import type { AuditCheckpointCode } from "@app/shared";
import { AUDIT_STAGE_UI } from "@/lib/audit-stage-ui";

interface OpenCheckpointResponse {
  checkpoint_id: string;
  checkpoint_code: string;
}

export function useOpenCheckpoint(caseId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (code: AuditCheckpointCode) => {
      const response = await apiClient.post<OpenCheckpointResponse>(`/cases/${caseId}/checkpoints/${code}/open`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
    onError: (_error, code) => {
      notifications.show({
        title: AUDIT_STAGE_UI[code].openErrorTitle,
        message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });

  return { openCheckpoint: mutation.mutate, isOpening: mutation.isPending };
}
