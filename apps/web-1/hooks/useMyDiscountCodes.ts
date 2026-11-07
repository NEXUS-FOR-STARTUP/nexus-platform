import { useQuery } from "@tanstack/react-query";
import type { MyDiscountCode } from "@repo/validation";
import { apiClient } from "@/lib/api-client";

export function useMyDiscountCodes(caseId: string) {
  return useQuery<MyDiscountCode[]>({
    queryKey: ["my-discount-codes", caseId],
    queryFn: async () => {
      const res = await apiClient.get<MyDiscountCode[]>("/orders/my-discount-codes", { params: { case_id: caseId } });
      return res.data;
    },
  });
}
