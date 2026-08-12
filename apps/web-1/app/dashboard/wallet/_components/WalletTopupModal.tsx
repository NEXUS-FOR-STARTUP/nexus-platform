"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, NumberInput, Stack, Text, Group } from "@mantine/core";
import { useCreateDeposit } from "../hooks/useWallet";

interface Props {
  opened: boolean;
  onClose: () => void;
  initialAmount?: number;
}

export function WalletTopupModal({ opened, onClose, initialAmount }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(initialAmount ?? 50000);
  const createDeposit = useCreateDeposit();

  const handleCreate = () => {
    if (amount < 10000) return;
    createDeposit.mutate(amount, {
      onSuccess: (result) => {
        onClose();
        router.push(`/dashboard/payment?pid=${result.depositId}`);
      },
    });
  };

  const handleCloseAndReset = () => {
    createDeposit.reset();
    setAmount(50000);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleCloseAndReset}
      title={<Text fw={700} size="sm">Nạp tiền vào ví</Text>}
      size="md"
      radius="md"
      centered
    >
      <Stack gap="md">
        <NumberInput
          label="Số tiền (VND)"
          description="Tối thiểu 10,000 VND"
          value={amount}
          onChange={(val) => setAmount(Number(val) || 0)}
          min={10000}
          step={10000}
          allowDecimal={false}
          allowNegative={false}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={handleCloseAndReset}>
            Hủy
          </Button>
          <Button
            onClick={handleCreate}
            loading={createDeposit.isPending}
            disabled={amount < 10000 || createDeposit.isPending}
          >
            Tạo mã nạp tiền
          </Button>
        </Group>

        {createDeposit.isError && (
          <Text c="red" size="xs">
            {(createDeposit.error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Đã xảy ra lỗi."}
          </Text>
        )}
      </Stack>
    </Modal>
  );
}
