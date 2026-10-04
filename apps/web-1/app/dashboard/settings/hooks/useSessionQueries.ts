"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ActiveSessionsResponse, ActiveSessionDto } from "@repo/validation";

export function useActiveSessionsQuery() {
  return useQuery<ActiveSessionDto[]>({
    queryKey: ["profile", "sessions"],
    queryFn: async () => {
      // apiClient đã có baseURL: ".../api", gọi relative path: "/profile/sessions"
      const res = await apiClient.get<ActiveSessionsResponse>("/profile/sessions");
      return res.data.data;
    },
  });
}
