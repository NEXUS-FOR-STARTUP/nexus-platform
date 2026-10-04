"use client";

import { Table, Badge, Text } from "@mantine/core";
import { depositDetailHref } from "@/lib/deposit-display";
import { WalletRowDetailAction } from "./WalletRowDetailAction";
import {
  WalletTransactionItem,
  SortField,
  SortState,
  TYPE_LABELS,
  TYPE_COLORS,
  formatVND,
  formatDateTime,
} from "./wallet-transaction.types";

interface Props {
  transactions: WalletTransactionItem[];
  sort: SortState;
  onSort: (field: SortField) => void;
}

export function WalletTransactionTable({
  transactions,
  sort,
  onSort,
}: Props) {
  const renderSortIndicator = (field: SortField) => {
    if (sort.field !== field) return <span className="opacity-30 ml-1">↕</span>;
    return <span className="ml-1 text-text-app">{sort.order === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <Table.ScrollContainer minWidth={820}>
      <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" className="w-full">
        <Table.Thead className="bg-surface-soft/40 border-b border-border-app">
          <Table.Tr>
            <Table.Th
              onClick={() => onSort("created_at")}
              className="text-base font-medium text-text-muted cursor-pointer select-none py-3.5 w-[160px]"
            >
              <span className="inline-flex items-center gap-1">
                Thời gian {renderSortIndicator("created_at")}
              </span>
            </Table.Th>

            <Table.Th className="text-base font-medium text-text-muted py-3.5 w-[130px]">
              Loại
            </Table.Th>

            <Table.Th className="text-base font-medium text-text-muted py-3.5">
              Nội dung giao dịch
            </Table.Th>

            <Table.Th
              ta="right"
              style={{ textAlign: "right" }}
              onClick={() => onSort("amount")}
              className="text-base font-medium text-text-muted cursor-pointer select-none py-3.5 w-[180px]"
            >
              <span className="inline-flex items-center justify-end gap-1">
                Số dư biến động {renderSortIndicator("amount")}
              </span>
            </Table.Th>

            <Table.Th
              ta="right"
              style={{ textAlign: "right" }}
              className="text-base font-medium text-text-muted py-3.5 w-[180px]"
            >
              Số dư sau giao dịch
            </Table.Th>
            <Table.Th
              ta="center"
              className="whitespace-nowrap px-2 py-3.5 text-base font-medium text-text-muted"
              style={{ width: 1 }}
            >
              Chi tiết
            </Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
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
              <Table.Tr
                key={tx.id}
                className="transition-colors hover:bg-surface-soft/60"
              >
                {/* Timestamp */}
                <Table.Td className="py-3.5">
                  <Text className="font-medium text-text-app leading-tight text-base">
                    {date}
                  </Text>
                  <Text c="dimmed" className="mt-0.5 text-base">
                    {time}
                  </Text>
                </Table.Td>

                {/* Transaction Type Badge */}
                <Table.Td className="py-3.5">
                  <Badge
                    variant="light"
                    color={badgeColor}
                    size="md"
                    radius="xl"
                    className="font-medium text-base"
                  >
                    {typeLabel}
                  </Badge>
                </Table.Td>

                {/* Description */}
                <Table.Td className="py-3.5">
                  <Text className="text-base font-medium text-text-app">
                    {description}
                  </Text>
                </Table.Td>

                {/* Amount */}
                <Table.Td ta="right" style={{ textAlign: "right" }} className="py-3.5">
                  <span
                    className={`text-base font-semibold tabular-nums ${
                      isPositive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : tx.amount < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-text-app"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {formatVND(tx.amount)}
                  </span>
                </Table.Td>

                {/* Balance After */}
                <Table.Td ta="right" style={{ textAlign: "right" }} className="py-3.5">
                  <Text c="dimmed" className="tabular-nums font-normal text-base">
                    {tx.balance_after != null ? formatVND(tx.balance_after) : "—"}
                  </Text>
                </Table.Td>
                <Table.Td ta="center" className="px-2 py-3.5" style={{ width: 1 }}>
                  <div className="flex justify-center">
                    <WalletRowDetailAction href={depositHref} />
                  </div>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
