"use client";

import { useState } from "react";
import { Paper, Center, Loader, Text, Table, Badge, Pagination } from "@mantine/core";
import { useWalletHistory } from "../hooks/useWallet";

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

export function WalletTransactionList() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, isError } = useWalletHistory(page, limit);

  if (isLoading) {
    return (
      <Paper withBorder radius="md" p="xl" className="bg-surface-app">
        <Center>
          <Loader color="blue" size="md" />
        </Center>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper withBorder radius="md" p="xl" className="bg-surface-app">
        <Center>
          <Text size="sm" c="red">Không thể tải lịch sử giao dịch.</Text>
        </Center>
      </Paper>
    );
  }

  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  if (total === 0) {
    return (
      <Paper withBorder radius="md" p="xl" className="bg-surface-app">
        <Center>
          <Text size="sm" c="dimmed">Chưa có giao dịch nào</Text>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="md" className="bg-surface-app overflow-hidden">
      <Table striped highlightOnHover verticalSpacing="sm" className="table-fixed">
        <Table.Thead>
          <Table.Tr>
            <Table.Th className="text-xs font-semibold text-text-muted w-[20%]">Mô tả</Table.Th>
            <Table.Th className="text-xs font-semibold text-text-muted w-[18%]">Số tiền</Table.Th>
            <Table.Th className="text-xs font-semibold text-text-muted w-[12%]">Loại</Table.Th>
            <Table.Th className="text-xs font-semibold text-text-muted w-[25%]">Thời gian</Table.Th>
            <Table.Th className="text-xs font-semibold text-text-muted w-[25%]">Số dư</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {transactions.map((tx) => {
            const isPositive = tx.amount > 0;
            const label = TYPE_LABELS[tx.type] ?? tx.type;
            const color = TYPE_COLORS[tx.type] ?? "gray";

            return (
              <Table.Tr key={tx.id}>
                <Table.Td>
                  <Text size="xs" className="text-text-app leading-snug">{tx.source_description ?? (tx.type ? TYPE_LABELS[tx.type] : "—")}</Text>
                </Table.Td>
                <Table.Td>
                  <span className={`text-sm font-bold tabular-nums ${isPositive ? "text-green-600" : "text-red-600"}`}>
                    {isPositive ? "+" : ""}
                    {tx.amount.toLocaleString("vi-VN")}
                    <span className="text-xs font-medium ml-1">VND</span>
                  </span>
                </Table.Td>
                <Table.Td>
                  <Badge color={color} variant="light" size="md" className="font-semibold">{label}</Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{new Date(tx.created_at).toLocaleString("vi-VN")}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed" className="tabular-nums">
                    {tx.balance_after != null ? `${tx.balance_after.toLocaleString("vi-VN")} VND` : "—"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
      {totalPages > 1 && (
        <Center py="sm">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="md" />
        </Center>
      )}
    </Paper>
  );
}
