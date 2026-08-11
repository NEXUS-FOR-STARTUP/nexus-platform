"use client";

import { Stack, Paper, Center, Loader, Text } from "@mantine/core";
import { useWalletHistory } from "../hooks/useWallet";
import { WalletTransactionItem } from "./WalletTransactionItem";

export function WalletTransactionList() {
  const { data, isLoading, isError } = useWalletHistory();

  if (isLoading) {
    return (
      <Paper withBorder radius="md" p="xl" className="bg-surface-app">
        <Center>
          <Stack gap="sm" align="center">
            <Loader color="blue" size="md" />
            <Text size="sm" c="dimmed">Đang tải lịch sử giao dịch...</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper withBorder radius="md" p="xl" className="bg-surface-app">
        <Center>
          <Text size="sm" c="red">
            Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.
          </Text>
        </Center>
      </Paper>
    );
  }

  const transactions = data?.transactions ?? [];

  if (transactions.length === 0) {
    return (
      <Paper withBorder radius="md" p="xl" className="bg-surface-app">
        <Center>
          <Text size="sm" c="dimmed">Chưa có giao dịch nào</Text>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="xs">
      {transactions.map((tx) => (
        <WalletTransactionItem key={tx.id} transaction={tx} />
      ))}
    </Stack>
  );
}
