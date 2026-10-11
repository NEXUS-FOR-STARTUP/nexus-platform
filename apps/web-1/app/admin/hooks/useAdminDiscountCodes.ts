import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { isAxiosError } from "axios";
import type {
  AdminDiscountCode,
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
} from "@repo/validation";
import { apiClient } from "@/lib/api-client";

export interface DiscountServiceType {
  id: string;
  code: string;
  name: string;
}

const QUERY_KEY = ["admin-discount-codes"];

function errorMessage(error: unknown): string {
  return isAxiosError<{ message?: string }>(error)
    ? (error.response?.data?.message ?? "Vui lòng thử lại sau.")
    : "Vui lòng thử lại sau.";
}

export function useAdminDiscountCodes() {
  const queryClient = useQueryClient();

  const codesQuery = useQuery<AdminDiscountCode[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<{ data: AdminDiscountCode[] }>("/admin/discount-codes");
      return response.data.data;
    },
  });

  const serviceTypesQuery = useQuery<DiscountServiceType[]>({
    queryKey: ["admin-service-types"],
    queryFn: async () => {
      const response = await apiClient.get<{ types: DiscountServiceType[] }>("/admin/service-types");
      return response.data.types;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateDiscountCodeInput) => {
      const response = await apiClient.post<{ data: AdminDiscountCode }>("/admin/discount-codes", input);
      return response.data.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      notifications.show({ title: "Đã tạo mã", message: created.code, color: "teal" });
    },
    onError: (error) => {
      notifications.show({ title: "Tạo mã thất bại", message: errorMessage(error), color: "red" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateDiscountCodeInput & { id: string }) => {
      const response = await apiClient.patch<{ data: AdminDiscountCode }>(`/admin/discount-codes/${id}`, input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      notifications.show({ title: "Cập nhật thất bại", message: errorMessage(error), color: "red" });
    },
  });

  return {
    codes: codesQuery.data ?? [],
    serviceTypes: serviceTypesQuery.data ?? [],
    isLoading: codesQuery.isLoading,
    createCode: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateCode: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
