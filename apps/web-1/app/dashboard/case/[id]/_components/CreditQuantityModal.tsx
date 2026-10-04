"use client";

import { useState } from "react";
import { Modal, Button, NumberInput, Stack, Text, Group, Paper } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import { formatPrice, PACKAGE_KEYS } from "@/lib/pricing";
import { usePackagePrice } from "@/lib/usePackagePrice";
import { useWalletBalance } from "@/app/dashboard/wallet/hooks/useWallet";
import { useShortageDepositRedirect } from "./use-shortage-deposit-redirect";

interface CreditQuantityModalProps {
  caseId: string;
  opened: boolean;
  onClose: () => void;
  packageId: string;
  /** true = mua credit cho đánh giá lần 2+, listener sẽ không auto-trigger */
  isManual?: boolean;
}

interface CreateOrderResponse {
  orderId: string;
  totalAmount: number;
  status: string;
  paidAt: string | null;
  totalCredits: number;
}

const MIN_TOPUP_AMOUNT = 2000;

export default function CreditQuantityModal({ caseId, opened, onClose, packageId, isManual = false }: CreditQuantityModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState<number>(1);

  const serviceType = isManual ? "credit_audit_manual" : "credit_audit";

  const { startShortageDeposit, isPending: isShortagePending } = useShortageDepositRedirect(caseId);
  const { data: pkg } = usePackagePrice(packageId, opened);
  const { data: walletData } = useWalletBalance();

  const walletBalance = walletData?.balance ?? 0;
  const isAiAudit = packageId === PACKAGE_KEYS.AI_AUDIT || pkg?.id === PACKAGE_KEYS.AI_AUDIT || pkg?.price === 79000;
  const effectiveQuantity = isAiAudit ? 1 : quantity;
  const unitPrice = pkg?.price ?? (isAiAudit ? 79000 : 0);
  const totalAmount = effectiveQuantity * unitPrice;
  const shortage = Math.max(totalAmount - walletBalance, 0);
  const hasSufficientBalance = shortage === 0;

  const mutation = useMutation<CreateOrderResponse, unknown>({
    mutationFn: async () => {
      const res = await apiClient.post<CreateOrderResponse>("/orders", {
        idempotency_key: crypto.randomUUID(),
        items: [{ service_type: serviceType, quantity: effectiveQuantity, metadata_json: { case_id: caseId } }],
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      if (data.status === "paid" && data.totalCredits > 0) {
        notifications.show({
          title: "Thanh toán thành công!",
          message: `Đã thêm ${data.totalCredits} lượt đánh giá cho dự án. Hãy nhấn "Bắt đầu đánh giá" để tiến hành phân tích.`,
          color: "teal",
        });
      } else {
        notifications.show({
          title: "Đã tạo đơn hàng",
          message: `Đơn hàng #${data.orderId} đang chờ thanh toán.`,
          color: "blue",
        });
      }
      router.refresh();
      handleClose();
    },
    onError: (error: unknown) => {
      const errData = isAxiosError<{ code?: string; message?: string; details?: { current?: number; required?: number } }>(error)
        ? error.response?.data
        : undefined;

      if (errData?.code === "INSUFFICIENT_BALANCE") {
        const needed = errData.details ? Math.max(Number(errData.details.required) - Number(errData.details.current), 0) : totalAmount;
        const suggestedTopup = Math.max(needed, MIN_TOPUP_AMOUNT);
        void startShortageDeposit({ quantity: effectiveQuantity, suggestedTopup, serviceType }).finally(handleClose);
        return;
      }
      notifications.show({
        title: "Tạo đơn hàng thất bại",
        message: errData?.message || "Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  const handleAction = () => {
    if (hasSufficientBalance) {
      mutation.mutate();
    } else {
      const suggestedTopup = Math.max(shortage, MIN_TOPUP_AMOUNT);
      void startShortageDeposit({ quantity: effectiveQuantity, suggestedTopup, serviceType }).finally(handleClose);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} size="sm">Mua gói đánh giá dự án</Text>}
      size="md"
      radius="md"
      centered
    >
      <Stack gap="md" className="pt-3">
        {!isAiAudit ? (
          <NumberInput
            label="Số lượng gói (79.000đ / gói 2 lượt)"
            description="Từ 1 đến 50 gói"
            value={quantity}
            onChange={(val) => setQuantity(Number(val) || 1)}
            min={1}
            max={50}
            allowDecimal={false}
            allowNegative={false}
          />
        ) : (
          <div className="flex justify-between items-center text-sm py-1">
            <span className="text-text-muted">Gói dịch vụ</span>
            <span className="font-semibold text-text-app">Đánh giá Dự án Tự động (2 lượt)</span>
          </div>
        )}

        <div className="bg-surface-soft rounded-lg p-4 space-y-2 border border-border-app text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Đơn giá</span>
            <span className="font-semibold">{formatPrice(unitPrice)}</span>
          </div>
          {!isAiAudit && (
            <div className="flex justify-between">
              <span className="text-text-muted">Số lượng</span>
              <span className="font-semibold">{effectiveQuantity}</span>
            </div>
          )}
          <div className="border-t border-border-app pt-2 flex justify-between">
            <span className="font-semibold">Tổng thanh toán</span>
            <span className="font-semibold text-brand text-base">{formatPrice(totalAmount)}</span>
          </div>
        </div>

        <Paper p="sm" withBorder radius="md" className="bg-surface-app border-border-app text-xs">
          <Stack gap="xs">
            <Group justify="space-between">
              <span className="text-text-muted">Số dư ví hiện tại</span>
              <strong className="text-text-app">{formatPrice(walletBalance)}</strong>
            </Group>
            <Group justify="space-between">
              <span className="text-text-muted">Số dư sau thanh toán</span>
              <strong className="text-text-app">{formatPrice(walletBalance - totalAmount)}</strong>
            </Group>
            <div className="pt-1 border-t border-border-app flex justify-between items-center">
              <span className="text-text-muted">Tình trạng ví</span>
              <span className={hasSufficientBalance ? "text-teal-600 font-semibold" : "text-red-600 font-semibold"}>
                {hasSufficientBalance ? "Đủ số dư ví" : `Số dư chưa đủ — cần nạp thêm ${formatPrice(shortage)} để mua gói đánh giá`}
              </span>
            </div>
          </Stack>
        </Paper>

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={handleClose} disabled={mutation.isPending || isShortagePending}>
            Hủy
          </Button>
          <Button
            color="brand"
            onClick={handleAction}
            loading={mutation.isPending || isShortagePending}
            disabled={mutation.isPending || isShortagePending}
          >
            {hasSufficientBalance ? `Thanh toán ${formatPrice(totalAmount)}` : "Nạp tiền & Mua gói qua VietQR"}
          </Button>
        </Group>

        {mutation.isError && (
          <Text c="red" size="xs">
            {isAxiosError<{ message?: string }>(mutation.error)
              ? mutation.error.response?.data?.message || "Đã xảy ra lỗi khi tạo đơn hàng."
              : "Đã xảy ra lỗi khi tạo đơn hàng."}
          </Text>
        )}
      </Stack>
    </Modal>
  );
}
