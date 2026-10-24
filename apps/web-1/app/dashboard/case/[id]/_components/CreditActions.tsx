"use client";

import React from "react";
import { ClockCountdown } from "@phosphor-icons/react";
import { Button } from "./ui/Button";
import RainbowBuyButton from "@/components/ui/RainbowBuyButton";
import { formatPrice, PACKAGE_KEYS } from "@/lib/pricing";
import { usePackagePrice } from "@/lib/usePackagePrice";

interface CreditActionsProps {
  onBuyCredits: () => void;
  onViewHistory?: () => void;
  hasCredits: boolean;
}

export default function CreditActions({ onBuyCredits, onViewHistory, hasCredits }: CreditActionsProps) {
  const { data: pkg } = usePackagePrice(PACKAGE_KEYS.AI_AUDIT);
  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        <RainbowBuyButton onClick={onBuyCredits} size="sm">
          {hasCredits ? "Mua thêm lượt đánh giá" : "Mua lượt đánh giá"}
        </RainbowBuyButton>

        {onViewHistory && (
          <Button
            onClick={onViewHistory}
            variant="quiet"
            size="sm"
            leftSection={<ClockCountdown className="w-4 h-4" />}
          >
            Lịch sử giao dịch
          </Button>
        )}

        {/* Future actions slot - add more buttons here without layout break */}
        <div className="flex-1" />
        <p className="text-base text-text-muted hidden sm:block">
          {pkg?.credits_granted ? `Gói ${formatPrice(pkg.price)} bao gồm ${pkg.credits_granted} lượt đánh giá dự án` : null}
        </p>
      </div>
    </div>
  );
}
