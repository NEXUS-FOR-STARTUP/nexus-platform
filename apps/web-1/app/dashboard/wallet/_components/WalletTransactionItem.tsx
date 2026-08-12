"use client";

import { Paper, Group, Stack, Text, Badge } from "@mantine/core";

const TYPE_LABELS: Record<string, string> = {
  deposit: "Nạp tiền",
  withdrawal: "Sử dụng",
  refund: "Hoàn tiền",
  adjustment: "Điều chỉnh",
  migration: "Chuyển đổi",
  service_payment: "Mua dịch vụ",
};

const TYPE_COLORS: Record<string, string> = {
  deposit: "green",
  withdrawal: "red",
  refund: "blue",
  adjustment: "orange",
  migration: "orange",
  service_payment: "orange",
};

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  balanceAfter?: number;
  createdAt: string;
}

export function WalletTransactionItem({ transaction }: { transaction: TransactionItem }) {
  const isPositive = transaction.amount > 0;
  const label = TYPE_LABELS[transaction.type] ?? transaction.type;
  const color = TYPE_COLORS[transaction.type] ?? "gray";

  return (
    <Paper withBorder radius="md" p="sm" className="bg-surface-app">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs">
            <Badge color={color} variant="light" size="md" className="font-semibold shrink-0">
              {label}
            </Badge>
            <Text size="xs" c="dimmed" truncate>
              {new Date(transaction.createdAt).toLocaleString("vi-VN")}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Số dư: {transaction.balanceAfter != null ? `${transaction.balanceAfter.toLocaleString("vi-VN")} VND` : "—"}
          </Text>
        </Stack>
        <Text size="sm" fw={600} c={isPositive ? "green" : "red"} className="shrink-0">
          {isPositive ? "+" : ""}
          {transaction.amount.toLocaleString("vi-VN")} VND
        </Text>
      </Group>
    </Paper>
  );
}
