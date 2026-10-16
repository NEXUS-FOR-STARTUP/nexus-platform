"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import type {
  AdminReceivable,
  CreateReceivableInput,
  ReceivablePaymentLink,
  RecordReceivablePaymentInput,
  WriteOffReceivableInput,
} from "@repo/validation";

function notifyError(error: unknown) {
  const message =
    isAxiosError(error) && error.response?.data?.message
      ? String(error.response.data.message)
      : "Không thể thực hiện thao tác. Vui lòng thử lại.";
  notifications.show({ title: "Lỗi", message, color: "red" });
}

function useInvalidateReceivables() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin-receivables"] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
  };
}

export function useCreateReceivable() {
  const invalidate = useInvalidateReceivables();
  return useMutation({
    mutationFn: async (input: CreateReceivableInput) => {
      const response = await apiClient.post("/admin/receivables", input);
      return response.data.data as AdminReceivable;
    },
    onSuccess: invalidate,
    onError: notifyError,
  });
}

export function useRecordReceivablePayment() {
  const invalidate = useInvalidateReceivables();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RecordReceivablePaymentInput }) => {
      const response = await apiClient.post(`/admin/receivables/${id}/payments`, input);
      return response.data.data as AdminReceivable;
    },
    onSuccess: invalidate,
    onError: notifyError,
  });
}

export function useWriteOffReceivable() {
  const invalidate = useInvalidateReceivables();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: WriteOffReceivableInput }) => {
      const response = await apiClient.post(`/admin/receivables/${id}/write-off`, input);
      return response.data.data as AdminReceivable;
    },
    onSuccess: invalidate,
    onError: notifyError,
  });
}

export function useCreateReceivablePaymentLink() {
  const invalidate = useInvalidateReceivables();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/admin/receivables/${id}/payment-link`);
      return response.data.data as ReceivablePaymentLink;
    },
    onSuccess: invalidate,
    onError: notifyError,
  });
}
