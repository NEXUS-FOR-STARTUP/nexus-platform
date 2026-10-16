"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AdminReceivableList, ReceivableStatus } from "@repo/validation";

export interface UseReceivablesParams {
  status?: ReceivableStatus;
  search?: string;
  page?: number;
}

export function useReceivables(params: UseReceivablesParams = {}) {
  return useQuery<AdminReceivableList>({
    queryKey: ["admin-receivables", params],
    queryFn: async () => {
      const response = await apiClient.get("/admin/receivables", {
        params: {
          status: params.status || undefined,
          search: params.search?.trim() || undefined,
          page: params.page ?? 1,
        },
      });
      return response.data.data;
    },
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
  });
}
