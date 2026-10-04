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

export function useWalletHistory(
  page = 1,
  limit = 10,
  type?: string | null,
  sortBy: "created_at" | "amount" = "created_at",
  sortOrder: "asc" | "desc" = "desc",
) {
  return useQuery<{ transactions: Array<{
    id: string;
    wallet_id: string;
    type: string;
    amount: number;
    balance_before: number;
    balance_after: number;
    source_type: string;
    source_id: string | null;
    source_description?: string;
    created_at: string;
  }>; total: number; page: number; limit: number }>({
    queryKey: ["wallet", "history", page, limit, type ?? "all", sortBy, sortOrder],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit, sortBy, sortOrder };
      if (type) params.type = type;
      const response = await apiClient.get("/wallet/history", { params });
      return response.data;
    },
    refetchInterval: 30_000,
  });
}

export interface WalletDeposit {
  id: string;
  amount: number;
  currency: string;
  transfer_content: string;
  status: "pending" | "verified" | "rejected" | "amount_mismatch";
  proof_file_url: string | null;
  verified_at: string | null;
  bank_transaction_id: string | null;
  created_at: string;
}

export function useMyDeposits() {
  return useQuery<{ deposits: WalletDeposit[] }>({
    queryKey: ["deposits"],
    queryFn: async () => {
      const response = await apiClient.get("/deposits", { params: { limit: 20, offset: 0 } });
      return response.data;
    },
    refetchInterval: 30_000,
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation<
    DepositResult,
    { response?: { data?: { message?: string } } },
    { amount: number; idempotency_key: string }
  >({
    mutationFn: async (input) => {
      const response = await apiClient.post("/deposits", input);
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
