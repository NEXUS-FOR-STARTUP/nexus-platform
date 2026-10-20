import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DepositDetail } from "@/app/dashboard/payment/hooks/usePayment";

const DEPOSIT_STALE_MS = 5 * 60 * 1000;

/** Lazy single-deposit fetch without polling; pass null to stay idle. */
export function useDepositSummary(depositId: string | null) {
  const { data, isLoading, isError, refetch } = useQuery<DepositDetail>({
    queryKey: ["deposit-summary", depositId],
    queryFn: async () => {
      const res = await apiClient.get<DepositDetail>(`/deposits/${depositId}`);
      return res.data;
    },
    enabled: Boolean(depositId),
    staleTime: DEPOSIT_STALE_MS,
    refetchInterval: false,
  });

  return { deposit: data, isLoading, isError, refetch };
}
