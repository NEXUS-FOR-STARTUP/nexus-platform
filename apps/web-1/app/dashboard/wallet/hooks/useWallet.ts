import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { notifications } from "@mantine/notifications";

export interface TopupResult {
  id: string;
  amount: number;
  transferContent: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
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
    walletId: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    sourceType: string;
    sourceId: string | null;
    createdAt: string;
  }> }>({
    queryKey: ["wallet", "history", limit, offset],
    queryFn: async () => {
      const response = await apiClient.get("/wallet/history", { params: { limit, offset } });
      return response.data;
    },
    refetchInterval: 30_000,
  });
}

export function useCreateTopup() {
  const queryClient = useQueryClient();

  return useMutation<TopupResult, { response?: { data?: { message?: string } } }, number>({
    mutationFn: async (amount: number) => {
      const response = await apiClient.post("/wallet/topups", { amount });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
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
