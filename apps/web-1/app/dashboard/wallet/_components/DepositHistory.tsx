"use client";

import Link from "next/link";
import { AlertCircle, ChevronRight, Clock, RotateCcw, XCircle } from "lucide-react";
import { Button, Skeleton } from "@mantine/core";
import { depositDetailHref, getDepositDisplay } from "@/lib/deposit-display";
import { useMyDeposits } from "../hooks/useWallet";
import { formatVND } from "./wallet-transaction.types";

const STATUS_ICON: Partial<Record<string, typeof Clock>> = {
  pending: Clock,
  rejected: XCircle,
  amount_mismatch: AlertCircle,
};

function bannerTitle(status: string): string {
  if (status === "rejected") return "Khoản nạp bị từ chối";
  if (status === "amount_mismatch") return "Số tiền chuyển chưa khớp";
  return "Khoản nạp chưa vào ví";
}

export function DepositStuckBanner({ onRetry }: { onRetry: (amount: number) => void }) {
  const { data, isLoading, isError, refetch } = useMyDeposits();
  const deposits = data?.deposits ?? [];
  const newest = [...deposits].sort(
    (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
  )[0];
  const isStuck =
    newest &&
    (newest.status === "pending" ||
      newest.status === "rejected" ||
      newest.status === "amount_mismatch");

  if (isLoading) {
    return <Skeleton height={96} radius="lg" />;
  }
  if (isError) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border-app bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base text-text-muted">Không tải được yêu cầu nạp đang chờ.</p>
        <Button variant="subtle" className="min-h-11 shrink-0" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }
  if (!isStuck || !newest) return null;

  const display = getDepositDisplay(newest.status);
  const rejected = newest.status === "rejected";
  const danger = rejected;
  const StatusIcon = STATUS_ICON[newest.status] ?? Clock;

  return (
    <div
      role="status"
      className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
        danger ? "border-danger/20 bg-danger-soft" : "border-warning/20 bg-warning-soft"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            danger ? "bg-danger/10 text-danger" : "bg-warning/15 text-warning"
          }`}
        >
          <StatusIcon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1.5">
          <h2 className="font-heading text-base font-semibold text-text-app">{bannerTitle(newest.status)}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold tabular-nums tracking-tight text-text-app">
              {formatVND(newest.amount)}
            </p>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold ${
                danger
                  ? "border-danger/20 bg-surface-app text-danger"
                  : "border-warning/30 bg-surface-app text-warning"
              }`}
            >
              {display.label}
            </span>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-text-muted">{display.explanation}</p>
        </div>
      </div>

      {rejected ? (
        <Button
          color="brand"
          className="min-h-11 shrink-0"
          leftSection={<RotateCcw className="h-4 w-4" />}
          onClick={() => onRetry(newest.amount)}
        >
          Nạp lại
        </Button>
      ) : (
        <Button
          component={Link}
          href={depositDetailHref(newest.id)}
          color="brand"
          className="min-h-11 shrink-0"
          rightSection={<ChevronRight className="h-4 w-4" />}
        >
          {display.actionLabel}
        </Button>
      )}
    </div>
  );
}
