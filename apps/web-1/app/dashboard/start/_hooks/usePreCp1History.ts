"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PreCp1ReportRecord } from "@/types";

export interface PreCp1HistoryItem extends PreCp1ReportRecord {
  case_id: string | null;
  case: {
    id: string;
    case_code: string;
    team_name: string | null;
  } | null;
}

export function usePreCp1History() {
  return useQuery<PreCp1HistoryItem[]>({
    queryKey: ["pre-cp1-history"],
    queryFn: async () => {
      const res = await apiClient.get<{ ok: boolean; items: PreCp1HistoryItem[] }>("/pre-cp1/history");
      return res.data.items ?? [];
    },
  });
}
