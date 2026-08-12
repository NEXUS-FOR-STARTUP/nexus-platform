"use client";

import React, { useMemo, useState } from "react";
import { Clock, ArrowUpRight, ArrowDownRight, RotateCcw, Loader2, Calendar, Receipt } from "lucide-react";
import { SegmentedControl, Badge } from "@mantine/core";
import type { Order } from "@/types/payment";

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
  orders?: Order[];
  pricePerCredit?: number;
  isLoading?: boolean;
}

type DateFilter = "all" | "today" | "7days" | "30days";

type UnifiedItem =
  | { kind: "order"; id: string; timestamp: number; created_at: string; data: Order }
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

function getOrderItemSummary(order: Order): string {
  if (!order.items || order.items.length === 0) return "Mua credit";
  return order.items
    .map((item) => `${item.service_type === "credit_audit" ? "Credit" : item.service_type} x${item.quantity}`)
    .join(", ");
}

export default function CreditTransactionHistory({ entries, orders, pricePerCredit = 39000, isLoading }: CreditTransactionHistoryProps) {
  const [filter, setFilter] = useState<DateFilter>("all");

  const unifiedItems = useMemo(() => {
    const items: UnifiedItem[] = [];

    (orders || []).forEach((o) => {
      const d = new Date(o.created_at);
      items.push({
        kind: "order",
        id: `order-${o.id}`,
        timestamp: d.getTime(),
        created_at: o.created_at,
        data: o,
      });
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

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, orders]);

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

  const effectiveUnitPrice = pricePerCredit && pricePerCredit > 0 ? pricePerCredit : 39000;

  return (
    <div className="bg-surface-app border border-border-app rounded-xl overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 border-b border-border-app flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold text-text-app">Lịch sử giao dịch & Credit</h3>
        </div>

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

      {filteredItems.length === 0 ? (
        <div className="p-8 text-center">
          <Calendar className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-text-muted">Không có giao dịch nào trong khoảng thời gian đã chọn</p>
        </div>
      ) : (
        <div className="divide-y divide-border-app">
          {groupedItems.map((group) => (
            <div key={group.dateHeader} className="space-y-0">
              <div className="bg-surface-soft/60 px-5 py-2 text-base font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-border-app/50">
                <Calendar className="w-3 h-3 text-text-muted shrink-0" />
                <span>{group.dateHeader}</span>
              </div>

              <div className="divide-y divide-border-app/40">
                {group.items.map((item) => {
                  if (item.kind === "order") {
                    const order = item.data;
                    const isPending = order.status === "pending";
                    const isPaid = order.status === "paid";

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-5 py-3.5 bg-warning-soft/10 hover:bg-warning-soft/20 transition-colors"
                      >
                        <div
                          className={`w-9 h-9 rounded-lg ${
                            isPaid ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                          } flex items-center justify-center shrink-0`}
                        >
                          {isPaid ? (
                            <Receipt className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4 animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-text-app">Mua credit</p>
                            <Badge
                              color={isPaid ? "green" : "yellow"}
                              variant="light"
                              size="sm"
                              className="font-semibold"
                            >
                              {isPaid ? "Đã thanh toán" : "Đang xử lý"}
                            </Badge>
                          </div>
                          <p className="text-base text-text-muted mt-0.5">
                            {formatTimeOnly(order.created_at)}
                            {" • "}
                            {getOrderItemSummary(order)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className={`text-sm font-semibold ${isPaid ? "text-success" : "text-warning"}`}>
                              {formatVND(order.total_amount)}
                            </span>
                          </div>
                          <p className="text-base text-text-muted mt-0.5">
                            {isPaid ? "Đã hoàn tất" : "Chờ xác nhận"}
                          </p>
                        </div>
                      </div>
                    );
                  }

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
                          <p className="text-sm font-semibold text-text-app">{title}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-base text-text-muted mt-0.5">
                          {formatTimeOnly(entry.created_at)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={`text-sm font-semibold ${isPositive ? "text-success" : colorClass}`}>
                            {isPositive ? `+${entry.amount}` : entry.amount} credit
                          </span>
                          <span className="text-xs font-semibold text-text-muted">
                            ({formatVND(approxValue)})
                          </span>
                        </div>
                        <p className="text-base text-text-muted mt-0.5">
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
