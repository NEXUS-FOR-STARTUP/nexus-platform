"use client";

import { useState, useEffect } from "react";
import { Modal, Button, NumberInput, Stack, Text, Group, Paper, Select } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useWalletBalance } from "@/app/dashboard/wallet/hooks/useWallet";
import { useServiceCatalog, filterPackagesByService } from "@/hooks/useServiceCatalog";
import { useShortageDepositRedirect } from "../use-shortage-deposit-redirect";
import { usePlaceServiceOrder } from "./usePlaceServiceOrder";
import DiscountCodeInput from "../DiscountCodeInput";
import type { DiscountCodeCheckResult } from "@repo/validation";

interface ServiceCheckoutModalProps {
  caseId: string;
  serviceCode: string;
  stageName: string;
  opened: boolean;
  onClose: () => void;
  onPurchased?: () => void;
}

const MIN_TOPUP_AMOUNT = 2000;

export default function ServiceCheckoutModal({
  caseId,
  serviceCode,
  stageName,
  opened,
  onClose,
  onPurchased,
}: ServiceCheckoutModalProps) {
  const { data: allPackages, isLoading: isCatalogLoading } = useServiceCatalog();
  const availablePackages = filterPackagesByService(allPackages, serviceCode);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<DiscountCodeCheckResult | null>(null);

  useEffect(() => {
    if (availablePackages.length > 0 && !selectedPackageId) {
      setSelectedPackageId(availablePackages[0]!.id);
    }
  }, [availablePackages, selectedPackageId]);

  const handleSelectPackage = (newId: string | null) => {
    if (newId && newId !== selectedPackageId) {
      setSelectedPackageId(newId);
      setDiscount(null);
    }
  };

  const { data: walletData } = useWalletBalance();
  const walletBalance = walletData?.balance ?? 0;
  const { startShortageDeposit, isPending: isShortagePending } = useShortageDepositRedirect(caseId);
  const { placeOrder, isPending: isOrderPending, resetSession } = usePlaceServiceOrder(caseId);

  const selectedPkg = availablePackages.find((p) => p.id === selectedPackageId);
  const listPrice = selectedPkg?.price ?? 0;
  const unitPrice = discount?.discounted_price ?? listPrice;
  const totalAmount = quantity * unitPrice;
  const shortage = Math.max(totalAmount - walletBalance, 0);
  const hasSufficientBalance = shortage === 0;

  const handleClose = () => {
    resetSession();
    setDiscount(null);
    onClose();
  };

  const handlePay = async () => {
    if (!selectedPackageId) return;
    if (hasSufficientBalance) {
      try {
        await placeOrder({ packageId: selectedPackageId, quantity, discountCode: discount?.code });
        notifications.show({
          color: "green",
          title: "Thành công",
          message: `Đã mua thành công ${quantity * (selectedPkg?.credits_granted ?? 1)} lượt chấm ${stageName}.`,
        });
        onPurchased?.();
        handleClose();
      } catch {
        // handled in hook
      }
    } else {
      const suggested = Math.max(shortage, MIN_TOPUP_AMOUNT);
      await startShortageDeposit({
        quantity,
        suggestedTopup: suggested,
        packageId: selectedPackageId,
        discountCode: discount?.code,
      });
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={`Mua lượt chấm — ${stageName}`} centered size="md">
      {isCatalogLoading ? (
        <Text c="dimmed" size="sm">Đang tải gói dịch vụ...</Text>
      ) : availablePackages.length === 0 ? (
        <Stack py="md">
          <Text c="dimmed" size="sm">Dịch vụ này hiện chưa mở bán gói. Vui lòng quay lại sau.</Text>
          <Button variant="default" onClick={handleClose}>Đóng</Button>
        </Stack>
      ) : (
        <Stack gap="md">
          {availablePackages.length > 1 && (
            <Select
              label="Chọn gói"
              value={selectedPackageId}
              onChange={handleSelectPackage}
              data={availablePackages.map((p) => ({ value: p.id, label: `${p.name} (${p.price.toLocaleString("vi-VN")} VND)` }))}
            />
          )}

          <NumberInput
            label="Số lượng gói"
            description={selectedPkg?.credits_granted ? `Mỗi gói gồm ${selectedPkg.credits_granted} lượt chấm.` : undefined}
            value={quantity}
            onChange={(val) => setQuantity(typeof val === "number" && val >= 1 ? Math.min(val, 50) : 1)}
            min={1}
            max={50}
          />

          <DiscountCodeInput
            packageId={selectedPackageId}
            applied={discount}
            onChange={setDiscount}
          />
          <Paper p="sm" withBorder bg="var(--mantine-color-gray-0)">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Đơn giá:</Text>
                <Text size="sm" fw={500}>{unitPrice.toLocaleString("vi-VN")} VND</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={600}>Tổng thanh toán:</Text>
                <Text size="sm" fw={700} c="blue">{totalAmount.toLocaleString("vi-VN")} VND</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Số dư ví:</Text>
                <Text size="xs" c="dimmed">{walletBalance.toLocaleString("vi-VN")} VND</Text>
              </Group>
              {!hasSufficientBalance && (
                <Text size="xs" c="red" fw={500}>Ví thiếu {shortage.toLocaleString("vi-VN")} VND</Text>
              )}
            </Stack>
          </Paper>

          <Button
            fullWidth
            color={hasSufficientBalance ? "blue" : "orange"}
            loading={isOrderPending || isShortagePending}
            onClick={handlePay}
          >
            {hasSufficientBalance
              ? `Thanh toán ${totalAmount.toLocaleString("vi-VN")} VND bằng ví`
              : `Nạp ${Math.max(shortage, MIN_TOPUP_AMOUNT).toLocaleString("vi-VN")} VND & mua`}
          </Button>
        </Stack>
      )}
    </Modal>
  );
}
