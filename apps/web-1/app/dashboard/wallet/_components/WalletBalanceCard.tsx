"use client";

import { Wallet } from "lucide-react";
import { Skeleton } from "@mantine/core";
import { useWalletBalance } from "../hooks/useWallet";

export function WalletBalanceCard() {
  const { data, isLoading, isError } = useWalletBalance();

  if (isError) {
    return (
      <div className="bg-danger-soft border border-danger/10 text-danger rounded-2xl p-6">
        <p className="text-sm font-medium">Không thể tải số dư ví. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand/90 to-brand p-6 text-white">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />

      <div className="relative space-y-3">
        <div className="flex items-center gap-2 opacity-80">
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">Số dư ví</span>
        </div>

        {isLoading ? (
          <Skeleton height={48} radius="sm" className="opacity-30" />
        ) : (
          <p className="text-4xl font-extrabold tracking-tight tabular-nums">
            {(data?.balance ?? 0).toLocaleString("vi-VN")}
            <span className="text-xl font-semibold opacity-70 ml-2">VND</span>
          </p>
        )}
      </div>
    </div>
  );
}
