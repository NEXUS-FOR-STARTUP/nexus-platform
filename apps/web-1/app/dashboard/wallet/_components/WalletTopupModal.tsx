"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, NumberInput } from "@mantine/core";
import { useCreateDeposit } from "../hooks/useWallet";
import {
  MIN_TOPUP_AMOUNT,
  DEFAULT_TOPUP_AMOUNT,
} from "./wallet-topup.constants";
import { TopupPresetButtons } from "./TopupPresetButtons";
import styles from "../wallet.module.css";

interface Props {
  opened: boolean;
  onClose: () => void;
  initialAmount?: number;
}

function extractErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }
  return "Đã xảy ra lỗi khi tạo yêu cầu nạp tiền.";
}

function WalletTopupForm({
  onClose,
  initialAmount,
}: {
  onClose: () => void;
  initialAmount?: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(initialAmount ?? DEFAULT_TOPUP_AMOUNT);
  const [topupKey] = useState<string>(() => crypto.randomUUID());
  const submittingRef = useRef(false);
  const createDeposit = useCreateDeposit();

  const handleCreate = () => {
    if (amount < MIN_TOPUP_AMOUNT) return;
    if (submittingRef.current || createDeposit.isPending) return;
    submittingRef.current = true;
    createDeposit.mutate(
      { amount, idempotency_key: topupKey },
      {
        onSuccess: (result) => {
          onClose();
          router.push(`/dashboard/payment?pid=${result.depositId}`);
        },
        onSettled: () => {
          submittingRef.current = false;
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-text-app mb-1">
          Chọn nhanh mức nạp
        </p>
        <TopupPresetButtons
          selectedAmount={amount}
          onSelect={(val) => setAmount(val)}
        />
      </div>

      <NumberInput
        label="Số tiền nạp (VND)"
        description="Tối thiểu 2,000 VND · Số tiền sẽ được ghi nhận vào ví để thanh toán dịch vụ."
        value={amount}
        onChange={(val) => setAmount(Number(val) || 0)}
        min={MIN_TOPUP_AMOUNT}
        step={1000}
        thousandSeparator=","
        allowDecimal={false}
        allowNegative={false}
        size="sm"
      />

      {createDeposit.isError && (
        <p className="text-xs text-red-600">
          {extractErrorMessage(createDeposit.error)}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-border-app">
        <button
          type="button"
          className={`${styles.btn} ${styles.btnQuiet} ${styles.btnSm}`}
          onClick={onClose}
        >
          Hủy
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={handleCreate}
          disabled={amount < MIN_TOPUP_AMOUNT || createDeposit.isPending}
        >
          {createDeposit.isPending ? "Đang xử lý..." : "Tạo lệnh nạp tiền"}
        </button>
      </div>
    </div>
  );
}

export function WalletTopupModal({ opened, onClose, initialAmount }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<span className="font-medium text-base text-text-app">Nạp tiền vào ví</span>}
      size="md"
      radius="md"
      centered
    >
      {opened && (
        <WalletTopupForm
          onClose={onClose}
          initialAmount={initialAmount}
        />
      )}
    </Modal>
  );
}
