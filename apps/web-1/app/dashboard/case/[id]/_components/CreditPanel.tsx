"use client";

import React from "react";
import { Button } from "@mantine/core";
import CreditBalanceCard from "./CreditBalanceCard";
import CreditTransactionHistory from "./CreditTransactionHistory";
import type { Order } from "@/types/payment";

interface CreditPanelProps {
  creditBalance: number | null | undefined;
  creditLedger?: Array<{
    id: string;
    amount: number;
    balance_after: number;
    type: "purchase" | "consumption" | "refund";
    reference_id: string | null;
    created_at: string;
  }>;
  orders?: Order[];
  packageName?: string;
  pricePerCredit?: number;
  onBuyCredits?: () => void;
}

export default function CreditPanel({
  creditBalance,
  creditLedger,
  orders,
  packageName,
  pricePerCredit,
  onBuyCredits,
}: CreditPanelProps) {
  const balance = creditBalance ?? 0;

  if (creditBalance === undefined || creditBalance === null) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="bg-surface-app border border-border-app rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="text-base font-semibold text-text-app">
              Quản lý lượt đánh giá
            </h2>
            <p className="text-xs text-text-muted mt-1 max-w-lg">
              Mua gói đánh giá để phân tích tài liệu và nhận báo cáo chi tiết. Gói 79.000đ bao gồm 2 lượt đánh giá dự án.
            </p>
          </div>
          {onBuyCredits && (
            <Button
              onClick={onBuyCredits}
              color="brand"
              size="sm"
              className="font-semibold shrink-0 cursor-pointer h-9 px-4 text-xs"
            >
              Mua lượt đánh giá
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <CreditBalanceCard
        creditBalance={balance}
        packageName={packageName}
        pricePerCredit={pricePerCredit}
        onBuyCredits={onBuyCredits}
      />

      <CreditTransactionHistory
        entries={creditLedger}
        orders={orders}
        pricePerCredit={pricePerCredit}
      />
    </div>
  );
}
