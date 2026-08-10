"use client";

import React, { useMemo, useState } from "react";
import { Clock, ArrowUpRight, ArrowDownRight, RotateCcw, Receipt, Loader2, XCircle, Calendar, CheckCircle2 } from "lucide-react";
import { SegmentedControl } from "@mantine/core";
import type { Payment } from "@/types/payment";

interface CreditEntry {
  id: string;
  amount: number;
  balance_after: number;
  type: "purchase" | "consumption" | "refund";
  reference_id: string | null;
  created_at: string;
}

interface CreditTransactionHistoryProps {
  entries?: CreditEntry[];
  payments?: Payment[];
  pricePerCredit?: number;
  isLoading?: boolean;
}

type DateFilter = "all" | "today" | "7days" | "30days";

type UnifiedItem =
  | { kind: "payment"; id: string; timestamp: number; created_at: string; data: Payment }
  | { kind: "ledger"; id: string; timestamp: number; created_at: string; data: CreditEntry };

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
  const yesterdayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString();
  const targetStr = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();

  const formattedDate = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (targetStr === todayStr) {
    return `Hôm nay — ${formattedDate}`;
  }
  if (targetStr === yesterdayStr) {
    return `Hôm qua — ${formattedDate}`;
  }
  return formattedDate;
}

function formatTimeOnly(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ";
}

function formatRefCode(ref?: string | null, payments?: Payment[]) {
  if (!ref) return null;
  const matched = payments?.find((p) => p.id === ref || p.bank_transaction_id === ref);
  if (matched?.transfer_content) {
    return matched.transfer_content;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(ref)) {
    return `CR-${ref.substring(0, 8).toUpperCase()}`;
  }
  return ref;
}

export default function CreditTransactionHistory({ entries, payments, pricePerCredit = 39000, isLoading }: CreditTransactionHistoryProps) {
  const [filter, setFilter] = useState<DateFilter>("all");

  // Combine and sort all items
  const unifiedItems = useMemo(() => {
    const items: UnifiedItem[] = [];

    // Filter pending or rejected payments that haven't produced credit entries yet
    (payments || []).forEach((p) => {
      if (p.status === "pending_verification" || p.status === "rejected") {
        const d = new Date(p.created_at);
        items.push({
          kind: "payment",
          id: `payment-${p.id}`,
          timestamp: d.getTime(),
          created_at: p.created_at,
          data: p,
        });
      }
    });

    (entries || []).forEach((e) => {
      const d = new Date(e.created_at);
      items.push({
        kind: "ledger",
        id: `ledger-${e.id}`,
        timestamp: d.getTime(),
        created_at: e.created_at,
        data: e,
      });
    });

    // Sort newest first
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, payments]);

  // Apply Date Filter
  const filteredItems = useMemo(() => {
    if (filter === "all") return unifiedItems;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysStart = todayStart - 7 * 86400000;
    const thirtyDaysStart = todayStart - 30 * 86400000;

    return unifiedItems.filter((item) => {
      if (filter === "today") return item.timestamp >= todayStart;
      if (filter === "7days") return item.timestamp >= sevenDaysStart;
      if (filter === "30days") return item.timestamp >= thirtyDaysStart;
      return true;
    });
  }, [unifiedItems, filter]);

  // Group by Date
  const groupedItems = useMemo(() => {
    const groups: Array<{ dateHeader: string; items: UnifiedItem[] }> = [];

    filteredItems.forEach((item) => {
      const header = formatDateHeader(item.created_at);
      const existing = groups.find((g) => g.dateHeader === header);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ dateHeader: header, items: [item] });
      }
    });

    return groups;
  }, [filteredItems]);

  if (isLoading) {
    return (
      <div className="bg-surface-app border border-border-app rounded-xl p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-brand" />
      </div>
    );
  }

  const hasItems = unifiedItems.length > 0;

  if (!hasItems) {
    return (
      <div className="bg-surface-app border border-border-app rounded-xl p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center">
            <Clock className="w-5 h-5 text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-app">Chưa có giao dịch</p>
            <p className="text-xs text-text-muted mt-0.5">
              Lịch sử mua và sử dụng credit sẽ xuất hiện tại đây
            </p>
          </div>
        </div>
      </div>
    );
  }

  const effectiveUnitPrice = pricePerCredit > 0 ? pricePerCredit : 39000;

  return (
    <div className="bg-surface-app border border-border-app rounded-xl overflow-hidden shadow-xs">
      {/* ── Header with Date Filter Bar ── */}
      <div className="px-5 py-3.5 border-b border-border-app flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold text-text-app">Lịch sử giao dịch & Credit</h3>
        </div>

        {/* Quick Date Filters */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <SegmentedControl
            value={filter}
            onChange={(val) => setFilter(val as DateFilter)}
            size="xs"
            radius="md"
            data={[
              { label: "Tất cả", value: "all" },
              { label: "Hôm nay", value: "today" },
              { label: "7 ngày", value: "7days" },
              { label: "30 ngày", value: "30days" },
            ]}
            className="font-body font-semibold"
          />
        </div>
      </div>

      {/* ── Empty Filter State ── */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center">
          <Calendar className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-text-muted">Không có giao dịch nào trong khoảng thời gian đã chọn</p>
        </div>
      ) : (
        <div className="divide-y divide-border-app">
          {groupedItems.map((group) => (
            <div key={group.dateHeader} className="space-y-0">
              {/* Date Section Header */}
              <div className="bg-surface-soft/60 px-5 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-border-app/50">
                <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>{group.dateHeader}</span>
              </div>

              {/* Grouped Items */}
              <div className="divide-y divide-border-app/40">
                {group.items.map((item) => {
                  if (item.kind === "payment") {
                    const payment = item.data;
                    const isPending = payment.status === "pending_verification";
                    const estCredits = Math.max(1, Math.round(payment.amount / effectiveUnitPrice));

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-5 py-3.5 bg-warning-soft/10 hover:bg-warning-soft/20 transition-colors"
                      >
                        <div
                          className={`w-9 h-9 rounded-lg ${
                            isPending ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger"
                          } flex items-center justify-center shrink-0`}
                        >
                          {isPending ? (
                            <Clock className="w-4 h-4 animate-pulse" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-bold text-text-app">Mua credit</p>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                isPending ? "bg-warning-soft text-warning border-warning/20" : "bg-danger-soft text-danger border-danger/20"
                              }`}
                            >
                              {isPending ? "Đang chờ Admin duyệt" : "Bị từ chối"}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">
                            {formatTimeOnly(payment.created_at)}
                            {payment.transfer_content && ` • Nội dung: ${payment.transfer_content}`}
                          </p>
                          {payment.rejection_reason && (
                            <p className="text-xs text-danger mt-1">Lý do từ chối: {payment.rejection_reason}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className={`text-base font-bold ${isPending ? "text-warning" : "text-danger"}`}>
                              +{estCredits} credit
                            </span>
                            <span className="text-xs font-medium text-text-muted">
                              ({formatVND(payment.amount)})
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">
                            {isPending ? "Chờ xác nhận" : "Chưa hoàn tất"}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // Ledger Item (Success / Consumption / Refund)
                  const entry = item.data;
                  const isPositive = entry.amount > 0;
                  const absCredits = Math.abs(entry.amount);
                  const approxValue = absCredits * effectiveUnitPrice;

                  let title = "Mua credit";
                  let badgeText = "Đã hoàn tất";
                  let badgeStyle = "bg-success-soft text-success border border-success/20";
                  let Icon = ArrowDownRight;
                  let colorClass = "text-success";
                  let bgClass = "bg-success-soft";

                  if (entry.type === "consumption") {
                    title = "Sử dụng credit";
                    badgeText = "Đã trừ credit";
                    badgeStyle = "bg-brand-soft/30 text-brand border border-brand/20";
                    Icon = ArrowUpRight;
                    colorClass = "text-brand";
                    bgClass = "bg-brand-soft/30";
                  } else if (entry.type === "refund") {
                    title = "Hoàn trả credit";
                    badgeText = "Đã hoàn credit";
                    badgeStyle = "bg-warning-soft text-warning border border-warning/20";
                    Icon = RotateCcw;
                    colorClass = "text-warning";
                    bgClass = "bg-warning-soft";
                  }

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-soft/50 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${colorClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-text-app">{title}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatTimeOnly(entry.created_at)}
                          {entry.reference_id && ` • Nội dung: ${formatRefCode(entry.reference_id, payments)}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={`text-base font-bold ${isPositive ? "text-success" : colorClass}`}>
                            {isPositive ? `+${entry.amount}` : entry.amount} credit
                          </span>
                          <span className="text-xs font-medium text-text-muted">
                            ({formatVND(approxValue)})
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          Số dư sau GD: {entry.balance_after} credit
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
