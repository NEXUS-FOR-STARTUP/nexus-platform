"use client";

import { useEffect, useRef, useState } from "react";
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
  // One stable idempotency key per modal-open: double-submits share it,
  // backend dedups on deposits.idempotency_key.
  const [topupKey, setTopupKey] = useState<string>(() => crypto.randomUUID());
  const submittingRef = useRef(false);
  const createDeposit = useCreateDeposit();

  useEffect(() => {
    if (!opened) return;
    setTopupKey(crypto.randomUUID());
    setAmount(initialAmount ?? DEFAULT_TOPUP_AMOUNT);
  }, [opened, initialAmount]);

  const handleCreate = () => {
    if (amount < MIN_TOPUP_AMOUNT) return;
    if (submittingRef.current || createDeposit.isPending) return;
    submittingRef.current = true;
    createDeposit.mutate({ amount, idempotency_key: topupKey }, {
      onSuccess: (result) => {
        onClose();
        router.push(`/dashboard/payment?pid=${result.depositId}`);
      },
      onSettled: () => {
        submittingRef.current = false;
      },
    });
  };

  const handleCloseAndReset = () => {
    submittingRef.current = false;
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
