import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { notifications } from "@mantine/notifications";

export interface DepositResult {
  depositId: string;
  amount: number;
  transferContent: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankShortCode?: string;
    qrUrl?: string;
  };
}

export function useWalletBalance() {
  return useQuery<{ balance: number }>({
    queryKey: ["wallet", "balance"],
    queryFn: async () => {
      const response = await apiClient.get("/wallet/balance");
      return response.data;
    },
    refetchInterval: 30_000,
  });
}

export function useWalletHistory(limit = 20, offset = 0) {
  return useQuery<{ transactions: Array<{
    id: string;
    wallet_id: string;
    type: string;
    amount: number;
    balance_before: number;
    balance_after: number;
    source_type: string;
    source_id: string | null;
    created_at: string;
  }> }>({
    queryKey: ["wallet", "history", limit, offset],
    queryFn: async () => {
      const response = await apiClient.get("/wallet/history", { params: { limit, offset } });
      return response.data;
    },
    refetchInterval: 30_000,
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation<DepositResult, { response?: { data?: { message?: string } } }, number>({
    mutationFn: async (amount: number) => {
      const response = await apiClient.post("/deposits", { amount });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
    },
    onError: (error) => {
      notifications.show({
        title: "Tạo mã nạp tiền thất bại",
        message: error?.response?.data?.message || "Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });
}
