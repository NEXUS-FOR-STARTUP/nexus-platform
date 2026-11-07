import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { DiscountCodeCheckResult } from "@repo/validation";
import { apiClient } from "@/lib/api-client";

interface CheckDiscountCodeInput {
  code: string;
  packageId: string;
  caseId: string;
}

const FALLBACK_ERROR = "Không kiểm tra được mã. Vui lòng thử lại.";

export function useCheckDiscountCode() {
  const mutation = useMutation<DiscountCodeCheckResult, unknown, CheckDiscountCodeInput>({
    mutationFn: async ({ code, packageId, caseId }) => {
      const res = await apiClient.post<DiscountCodeCheckResult>("/orders/discount-check", {
        code,
        package_id: packageId,
        case_id: caseId,
      });
      return res.data;
    },
  });

  const errorMessage = isAxiosError<{ message?: string }>(mutation.error)
    ? (mutation.error.response?.data?.message ?? FALLBACK_ERROR)
    : mutation.isError
      ? FALLBACK_ERROR
      : null;

  return {
    check: mutation.mutate,
    isChecking: mutation.isPending,
    errorMessage,
    reset: mutation.reset,
  };
}
