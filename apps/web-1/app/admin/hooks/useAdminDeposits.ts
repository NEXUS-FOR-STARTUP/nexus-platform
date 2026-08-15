import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Deposit } from "@/types/payment";

export function useAdminDeposits() {
  const queryClient = useQueryClient();

  const depositsQuery = useQuery<Deposit[]>({
    queryKey: ["admin-deposits"],
    queryFn: async () => {
      const response = await apiClient.get("/deposits/admin/all");
      return response.data.deposits || [];
    },
  });

  const verifyDepositMutation = useMutation({
    mutationFn: async ({
      depositId,
      status,
      rejectionReason,
    }: {
      depositId: string;
      status: "verified" | "rejected";
      rejectionReason?: string;
    }) => {
      const response = await apiClient.post(`/deposits/${depositId}/verify`, {
        status,
        rejectionReason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
    },
  });

  return {
    deposits: depositsQuery.data || [],
    isLoading: depositsQuery.isLoading,
    error: depositsQuery.error,
    verifyDeposit: verifyDepositMutation.mutateAsync,
    isVerifying: verifyDepositMutation.isPending,
  };
}
