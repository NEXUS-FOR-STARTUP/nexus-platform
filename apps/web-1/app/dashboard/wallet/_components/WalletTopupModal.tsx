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

const MIN_TOPUP_AMOUNT = 2000;
const DEFAULT_TOPUP_AMOUNT = 50000;

export function WalletTopupModal({ opened, onClose, initialAmount }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(initialAmount ?? DEFAULT_TOPUP_AMOUNT);
  const createDeposit = useCreateDeposit();

  const handleCreate = () => {
    if (amount < MIN_TOPUP_AMOUNT) return;
    createDeposit.mutate(amount, {
      onSuccess: (result) => {
        onClose();
        router.push(`/dashboard/payment?pid=${result.depositId}`);
      },
    });
  };

  const handleCloseAndReset = () => {
    createDeposit.reset();
    setAmount(DEFAULT_TOPUP_AMOUNT);
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
          description="Tối thiểu 2,000 VND"
          value={amount}
          onChange={(val) => setAmount(Number(val) || 0)}
          min={MIN_TOPUP_AMOUNT}
          step={1000}
          thousandSeparator=","
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
            disabled={amount < MIN_TOPUP_AMOUNT || createDeposit.isPending}
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
