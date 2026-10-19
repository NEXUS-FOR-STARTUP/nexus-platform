"use client";

import { Alert } from "@mantine/core";
import { CheckCircle as CheckCircle2, Clock, XCircle } from "@phosphor-icons/react";
import { type Icon } from "@phosphor-icons/react";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { getReceivableDisplay } from "@/lib/deposit-display";
import { isNotFoundError, usePublicReceivable } from "@/hooks/usePublicReceivable";
import { PaymentView } from "@/app/dashboard/payment/_components/PaymentView";

const STATUS_ICONS: Record<string, Icon> = {
  settled: CheckCircle2,
  written_off: XCircle,
};

const vnd = (value: number) => `${value.toLocaleString("en-US")} VND`;

export default function PayReceivableView({ token }: { token: string }) {
  const { data, isLoading, error } = usePublicReceivable(token);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Alert color={isNotFoundError(error) ? "gray" : "red"} title="Không mở được trang thanh toán">
          {isNotFoundError(error)
            ? "Liên kết không hợp lệ hoặc đã hết hạn."
            : "Không thể tải thông tin thanh toán. Vui lòng thử lại sau."}
        </Alert>
      </div>
    );
  }

  const display = getReceivableDisplay(data.status);
  const isOpen = data.status !== "settled" && data.status !== "written_off";
  const bank = data.bank_info;

  return (
    <PaymentView
      title="Thanh toán dịch vụ"
      statusLabel={display.label}
      statusColor={display.color}
      StatusIcon={STATUS_ICONS[data.status] ?? Clock}
      explanation={display.explanation}
      meta={{
        createdAt: new Date(data.created_at).toLocaleString("vi-VN"),
        bankCreditedAt: data.paid_at ? new Date(data.paid_at).toLocaleString("vi-VN") : null,
        amount: data.outstanding,
        currency: "VND",
        amountText: vnd(isOpen ? data.outstanding : data.amount_due),
        transferContent: bank.transfer_content,
        activityText: "Thanh toán dịch vụ",
      }}
      bankInfo={
        isOpen
          ? {
              bankName: bank.bank_name,
              accountNumber: bank.account_number,
              accountName: bank.account_name,
              qrUrl: bank.qr_url,
            }
          : undefined
      }
      qrAlt="QR chuyển khoản thanh toán"
    />
  );
}
