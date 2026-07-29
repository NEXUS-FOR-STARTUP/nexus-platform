"use client";

import React from "react";
import { Coins, AlertCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@mantine/core";
import CreditBalanceCard from "./CreditBalanceCard";
import CreditActions from "./CreditActions";
import CreditTransactionHistory from "./CreditTransactionHistory";
import type { Payment } from "@/types/payment";

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
  payments?: Payment[];
  packageName?: string;
  pricePerCredit?: number;
  paymentStatus?: string;
  onBuyCredits: () => void;
}

export default function CreditPanel({
  creditBalance,
  creditLedger,
  payments,
  packageName,
  pricePerCredit,
  paymentStatus,
  onBuyCredits,
}: CreditPanelProps) {
  const balance = creditBalance ?? 0;
  const hasCredits = balance > 0;
  const isZero = balance === 0 && creditBalance !== null && creditBalance !== undefined;
  const isPendingVerification = paymentStatus === "pending_verification";
  const isRejected = paymentStatus === "rejected";

  // State: never bought credits (balance is null/undefined)
  if (creditBalance === undefined || creditBalance === null) {
    return (
      <div className="space-y-5 animate-fade-in">
        {/* ── Pending Verification Notice if first time ── */}
        {isPendingVerification && (
          <div className="bg-warning-soft/50 border border-warning/30 rounded-xl px-5 py-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-warning shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-text-app">Minh chứng thanh toán đang chờ Admin duyệt</p>
              <p className="text-xs text-text-muted mt-0.5">
                Hệ thống đã nhận thông tin chuyển khoản của bạn. Quản trị viên đang xác thực giao dịch và sẽ cộng credit ngay sau khi duyệt.
              </p>
            </div>
          </div>
        )}

        {/* Hero CTA — gọn gàng, không bị kéo full width */}
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
      {/* ── Pending Verification Alert ── */}
      {isPendingVerification && (
        <div className="bg-warning-soft/50 border border-warning/30 rounded-xl px-5 py-4 flex items-center gap-3.5">
          <Clock className="w-5 h-5 text-warning shrink-0 animate-pulse" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-text-app">Minh chứng thanh toán đang chờ Admin xác thực</p>
            <p className="text-xs text-text-muted leading-relaxed">
              Hệ thống đã nhận minh chứng giao dịch của bạn. Quản trị viên đang tiến hành kiểm tra và sẽ duyệt cộng credit trong thời gian sớm nhất.
            </p>
          </div>
        </div>
      )}

      {/* ── Rejected Payment Alert ── */}
      {isRejected && (
        <div className="bg-danger-soft border border-danger/20 rounded-xl px-5 py-4 flex items-center gap-3.5">
          <XCircle className="w-5 h-5 text-danger shrink-0" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-danger">Giao dịch mua credit bị từ chối</p>
            <p className="text-xs text-text-muted leading-relaxed">
              Minh chứng giao dịch trước đó không hợp lệ. Vui lòng bấm "Mua credit" để gửi lại thông tin chuyển khoản mới.
            </p>
          </div>
        </div>
      )}

      {/* ── 3 stat cards: balance | price | package ── */}
      <CreditBalanceCard
        creditBalance={balance}
        packageName={packageName}
        pricePerCredit={pricePerCredit}
      />

      {/* ── Action bar ── */}
      <CreditActions
        onBuyCredits={onBuyCredits}
        hasCredits={hasCredits}
      />

      {/* ── Zero credit warning (chỉ hiện khi KHÔNG ĐANG CHỜ DUYỆT) ── */}
      {isZero && !isPendingVerification && (
        <div className="bg-danger-soft border border-danger/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0" />
          <p className="text-sm font-medium text-danger">
            Bạn đã dùng hết credit. Mua thêm để tiếp tục sử dụng dịch vụ.
          </p>
        </div>
      )}

      {/* ── Transaction history ── */}
      <CreditTransactionHistory entries={creditLedger} payments={payments} pricePerCredit={pricePerCredit} />
      {/* Add more credit-related sections here (auto-refill, promo, gifting, etc.) */}
    </div>
  );
}
