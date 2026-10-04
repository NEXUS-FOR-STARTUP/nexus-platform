import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";

export interface DepositDetail {
  id: string;
  amount: number;
  currency: string;
  transfer_content: string;
  status: "pending" | "verified" | "rejected" | string;
  proof_file_url: string | null;
  rejection_reason: string | null;
  bank_transaction_id: string | null;
  bank_credited_at: string | null;
  verified_by: string | null;
  verification_source: string | null;
  created_at: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    transferContent?: string;
    qrUrl?: string;
  };
}

export function useDepositDetail(depositId: string | null) {
  return useQuery<DepositDetail>({
    queryKey: ["deposit", depositId],
    queryFn: () => apiClient.get(`/deposits/${depositId}`).then((response) => response.data),
    enabled: Boolean(depositId),
    refetchInterval: 5000,
  });
}

export interface PaymentProofUploadError {
  response?: { data?: { message?: string } };
}

export interface UseUploadPaymentProofOptions {
  onError?: (error: PaymentProofUploadError) => void;
}

export function useUploadPaymentProof(
  depositId: string | null,
  options: UseUploadPaymentProofOptions = {},
) {
  const queryClient = useQueryClient();

  return useMutation<void, PaymentProofUploadError, File>({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append("file", file);
      form.append("deposit_id", depositId ?? "");
      await apiClient.post("/payments/proof", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposit", depositId] });
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
      notifications.show({
        title: "Thành công",
        message: "Minh chứng đã được gửi. Quản trị viên sẽ kiểm tra.",
        color: "green",
      });
    },
    onError: (error) => {
      options.onError?.(error);
      notifications.show({
        title: "Lỗi",
        message: error.response?.data?.message || "Tải lên thất bại.",
        color: "red",
      });
    },
  });
}

export function getProofUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/api/")) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl.replace(/\/$/, "")}${url}`;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${baseUrl.replace(/\/$/, "")}/api/${url.replace(/^\//, "")}`;
}
