"use client";

import React from "react";
import { Coins, TrendingUp, Package } from "lucide-react";

interface CreditBalanceCardProps {
  creditBalance: number;
  packageName?: string;
  pricePerCredit?: number;
}

export default function CreditBalanceCard({
  creditBalance,
  packageName,
  pricePerCredit,
}: CreditBalanceCardProps) {
  const hasCredits = creditBalance > 0;
  const isZero = creditBalance === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Balance — hero stat */}
      <div className="bg-surface-app border border-border-app rounded-xl p-5 col-span-1">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              hasCredits
                ? "bg-success-soft text-success"
                : isZero
                  ? "bg-danger-soft text-danger"
                  : "bg-brand-soft/30 text-brand"
            }`}
          >
            <Coins className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted mb-0.5">Số dư credit</p>
            <p className="text-2xl font-bold text-text-app tracking-tight">
              {creditBalance}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {hasCredits
                ? `Còn ${creditBalance} lượt đánh giá`
                : isZero
                  ? "Hết lượt đánh giá"
                  : "Chưa mua gói nào"}
            </p>
          </div>
        </div>
      </div>

      {/* Usage stat */}
      <div className="bg-surface-app border border-border-app rounded-xl p-5 col-span-1">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-soft/30 text-brand flex items-center justify-center shrink-0">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted mb-0.5">Đơn giá</p>
            <p className="text-2xl font-bold text-text-app tracking-tight">
              {pricePerCredit
                ? `${pricePerCredit.toLocaleString("vi-VN")}₫`
                : "—"}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">mỗi lượt đánh giá</p>
          </div>
        </div>
      </div>

      {/* Package info */}
      <div className="bg-surface-app border border-border-app rounded-xl p-5 col-span-1">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-surface-soft text-text-muted flex items-center justify-center shrink-0">
            <Package className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted mb-0.5">Gói dịch vụ</p>
            <p className="text-base font-bold text-text-app truncate">
              {packageName ?? "Chưa có gói"}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {pricePerCredit ? `${pricePerCredit.toLocaleString("vi-VN")}₫ / credit` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
