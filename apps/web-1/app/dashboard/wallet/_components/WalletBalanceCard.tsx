"use client";

import { Wallet } from "lucide-react";
import { Loader } from "@mantine/core";
import { useWalletBalance } from "../hooks/useWallet";

export function WalletBalanceCard() {
  const { data, isLoading, isError } = useWalletBalance();

  if (isError) {
    return (
      <div className="bg-danger-soft border border-danger/10 text-danger rounded-xl p-5">
        <p className="text-sm font-medium">Không thể tải số dư ví. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-brand-soft/30 text-brand flex items-center justify-center shrink-0">
          <Wallet className="w-5.5 h-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-muted mb-0.5">Số dư ví</p>
          {isLoading ? (
            <Loader size="sm" className="mt-2" />
          ) : (
            <p className="text-2xl font-bold text-text-app tracking-tight">
              {(data?.balance ?? 0).toLocaleString("vi-VN")} VND
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
