import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaymentHistoryItem } from "@/types";

export function useMyPayments() {
  return useQuery<PaymentHistoryItem[]>({
    queryKey: ["my-payments"],
    queryFn: async () => {
      const response = await apiClient.get("/payments/my");
      return response.data.payments;
    },
  });
}
