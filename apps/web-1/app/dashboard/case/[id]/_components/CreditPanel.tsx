"use client";

import React from "react";
import { Coins, AlertCircle } from "lucide-react";
import { Button } from "@mantine/core";
import CreditBalanceCard from "./CreditBalanceCard";
import CreditActions from "./CreditActions";
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
  onBuyCredits: () => void;
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
  const hasCredits = balance > 0;
  const isZero = balance === 0 && creditBalance !== null && creditBalance !== undefined;

  if (creditBalance === undefined || creditBalance === null) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="bg-surface-app border border-border-app rounded-xl p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-soft/30 text-brand flex items-center justify-center shrink-0">
            <Coins className="w-7 h-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-text-app">Mua credit để bắt đầu</h2>
            <p className="text-sm text-text-muted mt-1 max-w-md">
              Mua credit để mở khoá đầy đủ tính năng đánh giá chuyên sâu từ Supporter.
              Mỗi credit tương ứng một lượt đánh giá.
            </p>
          </div>
          <Button
            onClick={onBuyCredits}
            color="brand"
            size="md"
            leftSection={<Coins className="w-4 h-4" />}
            className="font-semibold shrink-0 cursor-pointer"
          >
            Mua credit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <CreditBalanceCard
        creditBalance={balance}
        packageName={packageName}
        pricePerCredit={pricePerCredit}
      />

      <CreditActions
        onBuyCredits={onBuyCredits}
        hasCredits={hasCredits}
      />

      {isZero && (
        <div className="bg-danger-soft border border-danger/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0" />
          <p className="text-sm font-medium text-danger">
            Bạn đã dùng hết credit. Mua thêm để tiếp tục sử dụng dịch vụ.
          </p>
        </div>
      )}

      <CreditTransactionHistory entries={creditLedger} orders={orders} pricePerCredit={pricePerCredit} />
    </div>
  );
}
