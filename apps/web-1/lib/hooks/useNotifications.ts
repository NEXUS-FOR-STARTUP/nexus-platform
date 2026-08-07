"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Notification } from "@/types/notification";

const SSE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/notifications/stream`;

export function useNotifications() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications?page=1&limit=20");
      return res.data.items as Notification[];
    },
    refetchOnWindowFocus: false,
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications/unread-count");
      return res.data.count as number;
    },
    refetchInterval: 60_000, // polling phụ — SSE mất vẫn cập nhật
    refetchOnWindowFocus: false,
  });

  // SSE — ping → refetch cả 2
  useEffect(() => {
    const es = new EventSource(SSE_URL, { withCredentials: true });
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // M1 fix (review): v5 exact matching — invalidate cả unread-count, không chỉ list
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    };
    es.onmessage = (e) => {
      if (e.data === "hb") return; // heartbeat — ignore
      refresh();
    };
    es.onerror = () => {
      /* EventSource tự reconnect; refetch khi onopen */
    };
    // SECURITY (audit 2026-08-07): session hết hạn/ban → REST trả 401 → đóng SSE, không nhận thêm ping
    const stopOnUnauthorized = () => {
      const q = queryClient.getQueryState(["notifications"]);
      if (q?.status === "error") {
        const status = (q.error as { response?: { status?: number } } | null | undefined)?.response?.status;
        if (status === 401) es.close();
      }
    };
    es.onopen = () => { refresh(); stopOnUnauthorized(); }; // reconnect thành công → sync lại
    return () => es.close();
  }, [queryClient]);

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
  const markAllRead = useMutation({
    mutationFn: () => apiClient.patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  return { listQuery, unreadQuery, markRead, markAllRead };
}
