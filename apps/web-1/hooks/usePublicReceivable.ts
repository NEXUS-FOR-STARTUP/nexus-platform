"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { publicApiClient } from "@/lib/api-client";
import type { PublicReceivable } from "@repo/validation";

export function usePublicReceivable(token: string) {
  return useQuery<PublicReceivable>({
    queryKey: ["public-receivable", token],
    queryFn: async () => {
      const response = await publicApiClient.get(`/public/receivables/${encodeURIComponent(token)}`);
      return response.data.data;
    },
    // 404 = bad/expired token: neutral, do not retry or keep polling.
    retry: (count, error) => !(isAxiosError(error) && error.response?.status === 404) && count < 2,
    refetchInterval: (query) => (query.state.error ? false : 5000),
  });
}

export function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}
