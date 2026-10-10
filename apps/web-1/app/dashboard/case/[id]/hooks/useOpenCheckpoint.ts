import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";

interface OpenCheckpointResponse {
  checkpoint_id: string;
  checkpoint_code: string;
}

export function useOpenCheckpoint(caseId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (code: "CP2") => {
      const response = await apiClient.post<OpenCheckpointResponse>(`/cases/${caseId}/checkpoints/${code}/open`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
    onError: () => {
      notifications.show({
        title: "Không thể bắt đầu Checkpoint 2",
        message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });

  return { openCheckpoint: mutation.mutate, isOpening: mutation.isPending };
}
