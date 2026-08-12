"use client";

import { useState } from "react";
import { Modal, Button, NumberInput, Stack, Text, Group, CopyButton, ActionIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Copy, Check } from "lucide-react";
import { useCreateDeposit, type DepositResult } from "../hooks/useWallet";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function WalletTopupModal({ opened, onClose }: Props) {
  const [amount, setAmount] = useState<number>(50000);
  const [depositResult, setDepositResult] = useState<DepositResult | null>(null);
  const createDeposit = useCreateDeposit();

  const handleCreate = () => {
    if (amount < 10000) return;
    createDeposit.mutate(amount, {
      onSuccess: (result) => {
        setDepositResult(result);
        notifications.show({
          title: "Tạo mã nạp tiền thành công",
          message: "Vui lòng chuyển khoản với nội dung bên dưới",
          color: "teal",
        });
      },
    });
  };

  const handleCloseAndReset = () => {
    createDeposit.reset();
    setDepositResult(null);
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
      {!depositResult ? (
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
      ) : (
        <Stack gap="md">
          <div className="bg-surface-soft rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Số tiền</span>
              <span className="font-semibold">
                {depositResult.amount.toLocaleString("vi-VN")} VND
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Ngân hàng</span>
              <span className="font-semibold">{depositResult.bankInfo.bankName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Số tài khoản</span>
              <span className="font-semibold">{depositResult.bankInfo.accountNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Chủ tài khoản</span>
              <span className="font-semibold">{depositResult.bankInfo.accountName}</span>
            </div>
            <div className="border-t border-border-app pt-2">
              <Text size="xs" c="dimmed" mb={4}>
                Nội dung chuyển khoản
              </Text>
              <Group gap="xs">
                <Text size="sm" fw={700} ff="monospace">
                  {depositResult.transferContent}
                </Text>
                <CopyButton value={depositResult.transferContent}>
                  {({ copied, copy }) => (
                    <ActionIcon
                      color={copied ? "teal" : "gray"}
                      onClick={copy}
                      variant="subtle"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </ActionIcon>
                  )}
                </CopyButton>
              </Group>
            </div>
          </div>

          <Text size="xs" c="dimmed">
            Vui lòng nhập CHÍNH XÁC nội dung chuyển khoản. Hệ thống sẽ tự động xác
            nhận sau khi nhận được tiền.
          </Text>

          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseAndReset}>
              Đóng
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
