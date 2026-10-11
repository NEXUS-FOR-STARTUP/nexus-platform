"use client";

import { Badge, Text } from "@mantine/core";
import { depositDetailHref } from "@/lib/deposit-display";
import { WalletRowDetailAction } from "./WalletRowDetailAction";
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
        const description = (tx.source_description || typeLabel).replace(
          /\s*\([+-]?\d[\d.,]*\s*VND\)\s*$/i,
          "",
        );
        const depositHref =
          (tx.source_type === "deposit" || tx.source_type === "topup") && tx.source_id
            ? depositDetailHref(tx.source_id)
            : null;

        return (
          <div
            key={tx.id}
            className="p-3.5 space-y-2 bg-surface-app"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant="light"
                color={badgeColor}
                size="sm"
                radius="md"
                className="font-medium text-xs whitespace-nowrap"
              >
                {typeLabel}
              </Badge>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-text-app"
                }`}
              >
                {isPositive ? "+" : ""}
                {formatVND(tx.amount)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <Text className="text-sm font-medium text-text-app line-clamp-2 flex-1 min-w-0">
                {description}
              </Text>
              <WalletRowDetailAction href={depositHref} />
            </div>

            <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-border-app/40">
              <span>
                {time} · {date}
              </span>
              {tx.balance_after != null && (
                <span>
                  Số dư: <span className="text-text-app font-medium tabular-nums">{formatVND(tx.balance_after)}</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
 }
