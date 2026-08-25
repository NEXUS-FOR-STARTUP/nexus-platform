import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Payment } from "@/types";

export function useAdminPayments() {
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery<Payment[]>({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const response = await apiClient.get("/payments");
      return response.data;
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({
      paymentId,
      status,
      rejectionReason,
    }: {
      paymentId: string;
      status: "paid" | "rejected";
      rejectionReason?: string;
    }) => {
      const response = await apiClient.post(`/payments/${paymentId}/verify`, {
        status,
        rejection_reason: rejectionReason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      // Invalidate specific case details if needed
      queryClient.invalidateQueries({ queryKey: ["case"] });
    },
  });

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    verifyPayment: verifyPaymentMutation.mutateAsync,
    isVerifying: verifyPaymentMutation.isPending,
  };
}
