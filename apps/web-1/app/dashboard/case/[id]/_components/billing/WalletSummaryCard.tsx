"use client";

import { Paper, Group, Text, Button, Stack } from "@mantine/core";
import { Wallet, Plus } from "lucide-react";
import Link from "next/link";
import { useWalletBalance } from "@/app/dashboard/wallet/hooks/useWallet";

export default function WalletSummaryCard() {
  const { data } = useWalletBalance();
  const balance = data?.balance ?? 0;

  return (
    <Paper p="md" withBorder radius="md">
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm">
          <Wallet size={24} className="text-blue-600" />
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Số dư ví hiện tại</Text>
            <Text size="xl" fw={700} c="blue">{balance.toLocaleString("vi-VN")} VND</Text>
          </Stack>
        </Group>
        <Group gap="xs">
          <Button component={Link} href="/dashboard/wallet" variant="light" size="xs">
            Lịch sử ví
          </Button>
          <Button component={Link} href="/dashboard/wallet?action=deposit" size="xs" leftSection={<Plus size={14} />}>
            Nạp tiền
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}
