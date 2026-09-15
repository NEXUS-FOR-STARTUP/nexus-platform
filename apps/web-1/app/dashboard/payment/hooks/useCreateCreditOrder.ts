import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CreateCreditOrderInput {
  orderIdempotencyKey: string;
  caseId: string;
  quantity: number;
  /** Loại service: "credit_audit" = auto-trigger, "credit_audit_manual" = user tự trigger từ UI. Default: "credit_audit" */
  serviceType?: "credit_audit" | "credit_audit_manual";
}

export interface CreateCreditOrderResponse {
  orderId: string;
  totalAmount: number;
  status: string;
}

export function useCreateCreditOrder() {
  return useMutation<CreateCreditOrderResponse, Error, CreateCreditOrderInput>({
    mutationFn: async ({ orderIdempotencyKey, caseId, quantity, serviceType = "credit_audit" }) => {
      const res = await apiClient.post("/orders", {
        idempotency_key: orderIdempotencyKey,
        items: [
          {
            service_type: serviceType,
            quantity,
            metadata_json: { case_id: caseId },
          },
        ],
      });
      return res.data;
    },
  });
}

