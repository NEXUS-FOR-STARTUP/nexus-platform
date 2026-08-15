"use client";

import React from "react";
import { AlertCircle, Coins } from "lucide-react";
import { Button } from "@mantine/core";

interface UnpaidAlertBannerProps {
  creditBalance?: number | null;
  onBuyCredits: () => void;
}

export default function UnpaidAlertBanner({ creditBalance, onBuyCredits }: UnpaidAlertBannerProps) {
  const hasCredits = (creditBalance ?? 0) > 0;
  if (hasCredits) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-lg bg-warning-soft border border-warning/20 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="font-heading font-semibold text-sm text-text-app">Chưa có credit</h4>
          <p className="font-body text-xs text-text-muted leading-relaxed">
            Bạn cần mua credit để kích hoạt quy trình phản biện từ Supporter. Mỗi credit tương ứng với một lượt đánh giá.
          </p>
        </div>
      </div>
      <Button
        onClick={onBuyCredits}
        color="brand"
        leftSection={<Coins className="w-4 h-4" />}
        className="font-body font-semibold text-xs h-9 px-4 shrink-0 cursor-pointer"
      >
        Mua credit
      </Button>
    </div>
  );
}
