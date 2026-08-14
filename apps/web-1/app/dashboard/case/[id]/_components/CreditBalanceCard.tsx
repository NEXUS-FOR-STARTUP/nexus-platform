"use client";

import React from "react";
import { Badge, Button } from "@mantine/core";

interface CreditBalanceCardProps {
  creditBalance: number;
  packageName?: string;
  pricePerCredit?: number;
  onBuyCredits: () => void;
}

export default function CreditBalanceCard({
  creditBalance,
  packageName,
  pricePerCredit,
  onBuyCredits,
}: CreditBalanceCardProps) {
  const hasCredits = creditBalance > 0;
  const isZero = creditBalance === 0;

  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-5 md:px-6 md:py-4.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
        {/* Stats Group */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-10">
          {/* Balance */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-xs text-text-muted">Số dư credit</p>
              {isZero && (
                <Badge
                  size="xs"
                  color="red"
                  variant="light"
                  radius="sm"
                  className="font-medium"
                >
                  Hết credit
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-text-app tabular-nums">
                {creditBalance}
              </span>
              <span className="text-xs font-medium text-text-muted">credit</span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-border-app/60" />

          {/* Package */}
          <div>
            <p className="text-xs text-text-muted mb-0.5">Gói dịch vụ</p>
            <p className="text-sm font-semibold text-text-app">
              {packageName ?? "Chưa có gói"}
            </p>
          </div>

          <div className="hidden sm:block w-px h-8 bg-border-app/60" />

          {/* Unit Price */}
          <div>
            <p className="text-xs text-text-muted mb-0.5">Đơn giá</p>
            <p className="text-sm font-semibold text-text-app tabular-nums">
              {pricePerCredit
                ? `${pricePerCredit.toLocaleString("vi-VN")} VND`
                : "—"}{" "}
              <span className="text-xs font-normal text-text-muted">
                / lượt
              </span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-border-app/50">
          <Button
            onClick={onBuyCredits}
            color="brand"
            size="sm"
            className="font-semibold cursor-pointer h-9 px-4 text-xs w-full md:w-auto"
          >
            {hasCredits ? "Mua thêm credit" : "Mua credit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
