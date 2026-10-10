"use client";

import { useRouter } from "next/navigation";
import { useCreateDeposit } from "@/app/dashboard/wallet/hooks/useWallet";
import { saveBuyCreditAfterDepositIntent } from "@/app/dashboard/payment/credit-after-deposit-intent";

interface StartShortageDepositParams {
  quantity: number;
  suggestedTopup: number;
  packageId: string;
  manualTrigger?: boolean;
}

export function useShortageDepositRedirect(caseId: string) {
  const router = useRouter();
  const createDeposit = useCreateDeposit();

  const startShortageDeposit = async ({
    quantity,
    suggestedTopup,
    packageId,
    manualTrigger = false,
  }: StartShortageDepositParams) => {
    try {
      const deposit = await createDeposit.mutateAsync({
        amount: suggestedTopup,
        idempotency_key: crypto.randomUUID(),
      });

      saveBuyCreditAfterDepositIntent(deposit.depositId, {
        caseId,
        quantity,
        orderIdempotencyKey: crypto.randomUUID(),
        packageId,
        manualTrigger,
      });

      router.push(`/dashboard/payment?pid=${deposit.depositId}`);
    } catch {
      // Error notification handled by useCreateDeposit
    }
  };

  return {
    startShortageDeposit,
    isPending: createDeposit.isPending,
  };
}
