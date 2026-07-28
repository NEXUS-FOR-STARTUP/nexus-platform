"use client";

import React from "react";
import { CreditCard, Clock } from "lucide-react";
import { Button } from "@mantine/core";

interface CreditActionsProps {
  onBuyCredits: () => void;
  onViewHistory?: () => void;
  hasCredits: boolean;
}

export default function CreditActions({ onBuyCredits, onViewHistory, hasCredits }: CreditActionsProps) {
  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onBuyCredits}
          color="brand"
          leftSection={<CreditCard className="w-4 h-4" />}
          className="font-semibold text-xs h-9 cursor-pointer"
        >
          {hasCredits ? "Mua thêm credit" : "Mua credit"}
        </Button>

        {onViewHistory && (
          <Button
            onClick={onViewHistory}
            variant="default"
            leftSection={<Clock className="w-4 h-4" />}
            className="font-semibold text-xs h-9 cursor-pointer"
          >
            Lịch sử giao dịch
          </Button>
        )}

        {/* Future actions slot — add more buttons here without layout break */}
        <div className="flex-1" />
        <p className="text-[11px] text-text-muted hidden sm:block">
          Mỗi credit tương ứng một lượt đánh giá từ Supporter
        </p>
      </div>
    </div>
  );
}
