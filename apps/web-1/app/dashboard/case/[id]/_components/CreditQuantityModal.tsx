"use client";

import { useState } from "react";
import { Modal, Button, NumberInput, Stack, Text, Group, Badge, Paper } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { Sparkles, CheckCircle2, Wallet, ArrowRight } from "lucide-react";
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

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/orders", {
        idempotency_key: crypto.randomUUID(),
        items: [{ service_type: serviceType, quantity: effectiveQuantity, metadata_json: { case_id: caseId } }],
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      notifications.show({
        title: "Thanh toán thành công",
        message: isManual
          ? `Đã mua ${isAiAudit ? 2 : effectiveQuantity} credit. Quay lại hồ sơ để chọn loại đánh giá và gửi.`
          : `Đơn hàng #${data.orderId} đã được thanh toán. AI đang tiến hành thẩm định.`,
        color: "teal",
      });
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
      title={
        <div className="flex items-center gap-2">
          {isAiAudit && <Sparkles className="w-4 h-4 text-brand" />}
          <Text fw={700} size="sm">{isAiAudit ? "Thanh toán Gói Basic AI Audit" : "Mua credit đánh giá"}</Text>
        </div>
      }
      size={isAiAudit ? "lg" : "md"}
      radius="md"
      centered
    >
      <Stack gap="md" className="pt-3">
        {isAiAudit ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="light" color="blue" size="lg">Basic AI Audit ({formatPrice(unitPrice)} / 2 lượt)</Badge>
              <span className="text-xs text-text-muted">Hoàn thành dưới 2 phút</span>
            </div>
            <Paper p="sm" withBorder radius="md" className="bg-surface-app/50 border-border-app space-y-2 text-xs">
              {[
                "Thẩm định 14 tiêu chí chuẩn theo rubric FPTU",
                "Đối chiếu 29 bẫy lỗi thực tế từ 12 nhóm sinh viên FPT",
                "Xuất báo cáo PDF A4 Vector chuẩn mực dưới 2 phút",
              ].map((text) => (
                <div key={text} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </Paper>
          </div>
        ) : (
          <>
            <Text size="sm" c="dimmed">Chọn số lượng credit muốn mua. Mỗi credit tương ứng với một lượt đánh giá từ Supporter.</Text>
            <NumberInput
              label="Số lượng credit"
              description="Từ 1 đến 50 credit"
              value={quantity}
              onChange={(val) => setQuantity(Number(val) || 1)}
              min={1}
              max={50}
              allowDecimal={false}
              allowNegative={false}
            />
          </>
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
            <span className="font-semibold">{isAiAudit ? "Tổng thanh toán (2 lượt đánh giá)" : "Tổng thanh toán"}</span>
            <span className="font-semibold text-brand text-base">{formatPrice(totalAmount)}</span>
          </div>
        </div>
        <Paper p="sm" withBorder radius="md" className="bg-surface-app border-border-app flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-text-muted" />
            <span className="text-text-muted">Số dư ví hiện tại:</span>
            <span className="font-semibold text-text-app">{formatPrice(walletBalance)}</span>
          </div>
          {hasSufficientBalance ? (
            <Badge variant="light" color="teal" size="sm">Đủ số dư ví</Badge>
          ) : (
            <Badge variant="light" color="orange" size="sm">Thiếu {formatPrice(shortage)}</Badge>
          )}
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
            rightSection={<ArrowRight className="w-4 h-4" />}
          >
            {hasSufficientBalance
              ? isAiAudit
                ? `Thanh toán ${formatPrice(totalAmount)} (2 lượt)`
                : `Thanh toán (${formatPrice(totalAmount)})`
              : `Nạp & Thanh toán qua VietQR`}
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
