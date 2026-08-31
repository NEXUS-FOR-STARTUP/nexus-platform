import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useEffect, useRef, useCallback } from "react";
import { getCentrifugeClient } from "@/lib/realtime/centrifuge-client";
import type { CaseUnreadCountResponse, MarkChatReadResponse } from "@repo/validation";

export function useCaseUnreadCount(caseId: string) {
  const queryClient = useQueryClient();
  const lastMarkedMessageIdRef = useRef<string | null>(null);

  const query = useQuery<CaseUnreadCountResponse>({
    queryKey: ["cases", caseId, "unread-count"],
    queryFn: async () => {
      const res = await apiClient.get<CaseUnreadCountResponse>(`/cases/${caseId}/chat/unread`);
      return res.data;
    },
    enabled: Boolean(caseId),
    staleTime: Infinity, // Realtime push updates the count directly
    refetchOnWindowFocus: true, // Item 4: Sync on window focus
  });

  // Item 4: Listen for Centrifugo reconnect to sync any missed messages
  useEffect(() => {
    if (!caseId) return;
    const client = getCentrifugeClient();

    const handleConnected = () => {
      void queryClient.invalidateQueries({ queryKey: ["cases", caseId, "unread-count"] });
    };

    client.on("connected", handleConnected);
    return () => {
      client.removeListener("connected", handleConnected);
    };
  }, [caseId, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (lastReadMessageId?: string) => {
      if (lastReadMessageId && lastMarkedMessageIdRef.current === lastReadMessageId) {
        return;
      }
      lastMarkedMessageIdRef.current = lastReadMessageId ?? null;

      const res = await apiClient.post<MarkChatReadResponse>(`/cases/${caseId}/chat/read`, {
        last_read_message_id: lastReadMessageId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (!data) return;
      queryClient.setQueryData<CaseUnreadCountResponse>(["cases", caseId, "unread-count"], (old: CaseUnreadCountResponse | undefined) => ({
        unread_count: 0,
        last_read_at: data.last_read_at,
      }));
    },
  });

  const markAsRead = useCallback(
    async (lastReadMessageId?: string) => {
      try {
        await markAsReadMutation.mutateAsync(lastReadMessageId);
      } catch {
        // Silently tolerate transient mark-as-read failure
      }
    },
    [markAsReadMutation],
  );

  return {
    unreadCount: query.data?.unread_count ?? 0,
    isLoading: query.isLoading,
    markAsRead,
  };
}
