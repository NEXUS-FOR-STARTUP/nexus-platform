import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Order } from "@/types/payment";

const ORDER_STALE_MS = 5 * 60 * 1000;

/** Lazy single-order fetch; pass null to keep the query idle. */
export function useOrderSummary(orderId: string | null) {
  const { data, isLoading, isError } = useQuery<Order>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await apiClient.get<Order>(`/orders/${orderId}`);
      return res.data;
    },
    enabled: Boolean(orderId),
    staleTime: ORDER_STALE_MS,
  });
  return { order: data, isLoading, isError };
}
