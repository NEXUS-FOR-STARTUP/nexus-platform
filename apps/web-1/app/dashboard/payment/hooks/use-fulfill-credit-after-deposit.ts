"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import type { DepositDetail } from "./usePayment";
import {
  readBuyCreditAfterDepositIntent,
  clearBuyCreditAfterDepositIntent,
} from "../credit-after-deposit-intent";
import { useCreateCreditOrder } from "./useCreateCreditOrder";

export function useFulfillCreditAfterDeposit(deposit?: DepositDetail) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync: createCreditOrder } = useCreateCreditOrder();
  const startedRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current ?? undefined);
    };
  }, []);

  useEffect(() => {
    if (!deposit || deposit.status !== "verified") return;

    const depositId = deposit.id;
    if (startedRef.current.has(depositId)) return;

    const intent = readBuyCreditAfterDepositIntent(depositId);
    if (!intent) return;

    startedRef.current.add(depositId);

    const fulfill = async () => {
      try {
        await createCreditOrder({
          orderIdempotencyKey: intent.orderIdempotencyKey,
          caseId: intent.caseId,
          quantity: intent.quantity,
          serviceType: intent.serviceType ?? "credit_audit",
        });

        clearBuyCreditAfterDepositIntent(depositId);
        queryClient.invalidateQueries({ queryKey: ["case", intent.caseId] });
        queryClient.invalidateQueries({ queryKey: ["wallet"] });

        notifications.show({
          title: "Mua credit thành công",
          message: `Đã mua thành công ${intent.quantity} lượt kiểm tra cho hồ sơ. Đang chuyển về hồ sơ trong 5 giây...`,
          color: "teal",
          autoClose: 5000,
        });

        timeoutRef.current = setTimeout(() => {
          router.replace(`/dashboard/case/${intent.caseId}`);
        }, 5000);
      } catch (err: unknown) {
        const errorData = (
          err as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        )?.response?.data;

        notifications.show({
          title: "Hoàn tất mua credit thất bại",
          message:
            errorData?.message ||
            "Tiền đã vào ví nhưng chưa thể tự động mua lượt. Vui lòng vào hồ sơ để mua lại.",
          color: "red",
        });
      }
    };

    void fulfill();
  }, [deposit, createCreditOrder, queryClient, router]);
}
