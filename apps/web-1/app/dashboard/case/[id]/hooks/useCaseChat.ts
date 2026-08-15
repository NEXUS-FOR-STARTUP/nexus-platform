import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { CaseMessage } from "@/types";

export function useCaseChat(caseId: string) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery<CaseMessage[]>({
    queryKey: ["case-messages", caseId],
    queryFn: async () => {
      const response = await apiClient.get(`/cases/${caseId}/messages`);
      return response.data;
    },
    enabled: !!caseId,
    refetchInterval: 60_000, // Fallback an toàn — realtime chính qua WebSocket (useRealtimeChat)
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(`/cases/${caseId}/messages`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-messages", caseId] });
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    isFetching: messagesQuery.isFetching,
    error: messagesQuery.error,
    refetch: messagesQuery.refetch,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error,
    resetSendError: sendMessageMutation.reset,
  };
}
