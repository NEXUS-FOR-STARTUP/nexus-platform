"use client";

import { Badge, Text } from "@mantine/core";
import {
  WalletTransactionItem,
  TYPE_LABELS,
  TYPE_COLORS,
  formatVND,
  formatDateTime,
} from "./wallet-transaction.types";

interface Props {
  transactions: WalletTransactionItem[];
}

export function WalletTransactionCardList({
  transactions,
}: Props) {
  return (
    <div className="divide-y divide-border-app">
      {transactions.map((tx) => {
        const isPositive = tx.amount > 0;
        const typeLabel = TYPE_LABELS[tx.type] ?? tx.type;
        const badgeColor = TYPE_COLORS[tx.type] ?? "gray";
        const { date, time } = formatDateTime(tx.created_at);
        const description = tx.source_description || typeLabel;

        return (
          <div
            key={tx.id}
            className="p-4 flex items-start justify-between gap-3"
          >
            {/* Left side: Type & Description & Time */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge
                  variant="light"
                  color={badgeColor}
                  size="md"
                  radius="xl"
                  className="font-medium text-base"
                >
                  {typeLabel}
                </Badge>
                <span className="text-base text-text-muted">
                  {time} · {date}
                </span>
              </div>

              <Text className="font-medium text-text-app line-clamp-1 text-base">
                {description}
              </Text>

              {tx.balance_after != null && (
                <Text c="dimmed" className="text-base mt-1 tabular-nums">
                  Số dư sau giao dịch: {formatVND(tx.balance_after)}
                </Text>
              )}
            </div>

            {/* Right side: Amount */}
            <div className="text-right shrink-0">
              <span
                className={`text-base font-semibold tabular-nums ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-text-app"
                }`}
              >
                {isPositive ? "+" : ""}
                {formatVND(tx.amount)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
