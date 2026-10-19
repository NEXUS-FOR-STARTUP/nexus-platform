"use client";

import { useState } from "react";
import { Modal, Button, NumberInput, Stack, Text, Group, Paper, Select, Divider } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useWalletBalance } from "@/app/dashboard/wallet/hooks/useWallet";
import { useServiceCatalog, filterPackagesByService } from "@/hooks/useServiceCatalog";
import { useShortageDepositRedirect } from "../use-shortage-deposit-redirect";
import { usePlaceServiceOrder } from "./usePlaceServiceOrder";
import { formatVndAmount } from "@/lib/pricing";
import DiscountCodeInput from "../DiscountCodeInput";
import { MAX_TEAM_MEMBERS, type DiscountCodeCheckResult } from "@repo/validation";

interface ServiceCheckoutModalProps {
  caseId: string;
  serviceCode: string;
  stageName: string;
  opened: boolean;
  onClose: () => void;
  onPurchased?: () => void;
}

const MIN_TOPUP_AMOUNT = 2000;
/** Giá/thành viên luôn tính theo nhóm đủ người, độc lập với số thành viên đã khai. */
const PRICING_TEAM_SIZE = MAX_TEAM_MEMBERS;

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
  const [pickedPackageId, setPickedPackageId] = useState<string>("");
  const selectedPackageId = pickedPackageId || availablePackages[0]?.id || "";
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<DiscountCodeCheckResult | null>(null);

  const handleSelectPackage = (newId: string | null) => {
    if (newId && newId !== selectedPackageId) {
      setPickedPackageId(newId);
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
  const creditsPerPackage = selectedPkg?.credits_granted ?? 0;
  const totalCredits = quantity * creditsPerPackage;
  const perMemberPrice = totalAmount > 0 ? Math.round(totalAmount / PRICING_TEAM_SIZE) : null;
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
      placeOrder({ packageId: selectedPackageId, quantity, discountCode: discount?.code }, () => {
        notifications.show({
          color: "green",
          title: "Thành công",
          message: `Đã mua thành công ${quantity * (selectedPkg?.credits_granted ?? 1)} lượt chấm ${stageName}.`,
        });
        onPurchased?.();
        handleClose();
      });
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
    <Modal opened={opened} onClose={handleClose} title={`Mua lượt chấm - ${stageName}`} centered size="md">
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
              data={availablePackages.map((p) => ({ value: p.id, label: `${p.credits_granted ?? 0} lượt chấm (${formatVndAmount(p.price)})` }))}
            />
          )}

          <Paper p="md" radius="md" bg="var(--mantine-color-teal-0)">
            <Stack gap={4}>
              <Group justify="space-between" align="center">
                <Text size="sm" fw={600}>{`Gói chấm ${stageName}`}</Text>
                {creditsPerPackage > 0 && (
                  <Text size="xs" c="dimmed">{`${creditsPerPackage} lượt chấm / gói`}</Text>
                )}
              </Group>
              {perMemberPrice !== null && (
                <Group gap={6} align="baseline">
                  <Text fw={800} fz={30} c="teal.8" lh={1.1}>{formatVndAmount(perMemberPrice)}</Text>
                  <Text size="sm" c="dimmed">/ thành viên</Text>
                </Group>
              )}
              <Text size="xs" c="dimmed">
                {`Tổng ${formatVndAmount(totalAmount)} chia đều cho nhóm ${PRICING_TEAM_SIZE} người`}
              </Text>
            </Stack>
          </Paper>

          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="sm" fw={600}>Số gói muốn mua</Text>
            <NumberInput
              aria-label="Số gói muốn mua"
              w={120}
              value={quantity}
              onChange={(val) => setQuantity(typeof val === "number" && val >= 1 ? Math.min(val, 50) : 1)}
              min={1}
              max={50}
              allowDecimal={false}
            />
          </Group>

          <DiscountCodeInput
            packageId={selectedPackageId}
            applied={discount}
            onChange={setDiscount}
          />

          <Stack gap="xs">
            {creditsPerPackage > 0 && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Bạn nhận được</Text>
                <Text size="sm" fw={500}>{`${totalCredits} lượt chấm`}</Text>
              </Group>
            )}
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Số dư ví</Text>
              <Text size="sm">{formatVndAmount(walletBalance)}</Text>
            </Group>
            <Divider />
            <Group justify="space-between" align="baseline">
              <Text fw={600}>Tổng thanh toán</Text>
              <Text fw={700} fz="xl">{formatVndAmount(totalAmount)}</Text>
            </Group>
            {!hasSufficientBalance && (
              <Text size="xs" c="red" fw={500} ta="right">Ví thiếu {formatVndAmount(shortage)}</Text>
            )}
          </Stack>

          <Button
            fullWidth
            size="md"
            color="orange"
            loading={isOrderPending || isShortagePending}
            onClick={handlePay}
          >
            {hasSufficientBalance
              ? `Thanh toán ${formatVndAmount(totalAmount)} bằng ví`
              : `Nạp ${formatVndAmount(Math.max(shortage, MIN_TOPUP_AMOUNT))} & mua`}
          </Button>
        </Stack>
      )}
    </Modal>
  );
}
