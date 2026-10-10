import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CreateCreditOrderInput {
  orderIdempotencyKey: string;
  caseId: string;
  quantity: number;
  packageId: string;
  /** true = user tự trigger audit từ UI sau khi mua. Default: auto-trigger. */
  manualTrigger?: boolean;
  discountCode?: string;
}

export interface CreateCreditOrderResponse {
  orderId: string;
  totalAmount: number;
  status: string;
}

export function useCreateCreditOrder() {
  return useMutation<CreateCreditOrderResponse, Error, CreateCreditOrderInput>({
    mutationFn: async ({ orderIdempotencyKey, caseId, quantity, packageId, manualTrigger = false, discountCode }) => {
      const res = await apiClient.post("/orders", {
        idempotency_key: orderIdempotencyKey,
        items: [
          {
            package_id: packageId,
            quantity,
            manual_trigger: manualTrigger,
            metadata_json: { case_id: caseId },
          },
        ],
        ...(discountCode ? { discount_code: discountCode } : {}),
      });
      return res.data;
    },
  });
}

