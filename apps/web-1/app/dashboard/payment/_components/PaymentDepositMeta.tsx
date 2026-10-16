import React from "react";
import { WALLET_COPY } from "@/lib/deposit-display";

interface PaymentDepositMetaProps {
  createdAt: string;
  bankCreditedAt: string | null;
  amount: number;
  currency: string;
  transferContent: string;
  /** Overrides the default deposit activity text. */
  activityText?: string;
  /** Pre-formatted amount; overrides amount + currency formatting. */
  amountText?: string;
}

export function PaymentDepositMeta({
  createdAt,
  bankCreditedAt,
  amount,
  currency,
  transferContent,
  activityText = WALLET_COPY.depositActivityText,
  amountText,
}: PaymentDepositMetaProps) {
  return (
    <div className="space-y-2 text-base">
      <div className="flex justify-between gap-3 border-b border-border-app/40 py-1.5">
        <span className="text-text-muted">{WALLET_COPY.requestCreated}</span>
        <span className="text-right font-medium">{createdAt}</span>
      </div>
      {bankCreditedAt ? (
        <div className="flex justify-between gap-3 border-b border-border-app/40 py-1.5">
          <span className="text-text-muted">{WALLET_COPY.bankCredited}</span>
          <span className="text-right font-medium">{bankCreditedAt}</span>
        </div>
      ) : null}
      <div className="flex justify-between gap-3 border-b border-border-app/40 py-1.5">
        <span className="text-text-muted">Số tiền</span>
        <span className="text-right font-semibold">
          {amountText ?? `${amount.toLocaleString("vi-VN")} ${currency}`}
        </span>
      </div>
      <div className="flex justify-between gap-3 border-b border-border-app/40 py-1.5">
        <span className="text-text-muted">{WALLET_COPY.activityDescription}</span>
        <span className="text-right font-medium">{activityText}</span>
      </div>
      <div className="flex justify-between gap-3 py-1.5">
        <span className="text-text-muted">{WALLET_COPY.transferContent}</span>
        <span className="text-right font-mono font-semibold">{transferContent}</span>
      </div>
    </div>
  );
}
