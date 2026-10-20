"use client";

import { useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";

interface PlaceOrderInput {
  packageId: string;
  quantity: number;
  discountCode?: string;
}

export function usePlaceServiceOrder(caseId: string) {
  const queryClient = useQueryClient();
  const sessionKeyRef = useRef<string>(crypto.randomUUID());

  const resetSession = useCallback(() => {
    sessionKeyRef.current = crypto.randomUUID();
  }, []);

  const mutation = useMutation({
    mutationFn: async ({ packageId, quantity, discountCode }: PlaceOrderInput) => {
      const res = await apiClient.post("/orders", {
        idempotency_key: sessionKeyRef.current,
        items: [{ package_id: packageId, quantity, manual_trigger: true, metadata_json: { case_id: caseId } }],
        ...(discountCode ? { discount_code: discountCode } : {}),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      resetSession();
    },
    onError: (err, input) => {
      console.error("[place-service-order] failed", { caseId, packageId: input.packageId, quantity: input.quantity }, err);
      if (isAxiosError(err)) {
        const data = err.response?.data;
        if (
          err.response?.status === 409 &&
          typeof data === "object" &&
          data !== null &&
          "code" in data &&
          data.code === "ORDER_ALREADY_PAID"
        ) {
          queryClient.invalidateQueries({ queryKey: ["case", caseId] });
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
          resetSession();
          return;
        }
        const message =
          typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
            ? data.message
            : undefined;
        notifications.show({ color: "red", title: "Lỗi thanh toán", message: message || "Không thể hoàn tất đơn hàng." });
        return;
      }
      notifications.show({ color: "red", title: "Lỗi thanh toán", message: "Không thể hoàn tất đơn hàng." });
    },
  });

  /** Errors are surfaced by onError above; callers only react to success. */
  const placeOrder = (input: PlaceOrderInput, onSuccess: () => void) => mutation.mutate(input, { onSuccess });

  return { placeOrder, isPending: mutation.isPending, resetSession };
}
