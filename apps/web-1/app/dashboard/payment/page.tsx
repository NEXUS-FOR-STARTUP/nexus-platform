"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button } from "@mantine/core";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { WALLET_COPY, getDepositDisplay } from "@/lib/deposit-display";
import { useDepositDetail } from "./hooks/usePayment";
import { ProofPreview } from "./_components/ProofPreview";
import { ProofUpload } from "./_components/ProofUpload";
import {
  readBuyCreditAfterDepositIntent,
  clearBuyCreditAfterDepositIntent,
} from "./credit-after-deposit-intent";
import { useFulfillCreditAfterDeposit } from "./hooks/use-fulfill-credit-after-deposit";
import { PaymentView } from "./_components/PaymentView";

const STATUS_ICONS: Record<string, LucideIcon> = {
  pending: Clock,
  verified: CheckCircle2,
  rejected: XCircle,
  amount_mismatch: AlertCircle,
};

export default function PaymentPage() {
  const router = useRouter();
  const paymentId = useSearchParams().get("pid");
  const { data: payment, isLoading, error } = useDepositDetail(paymentId);
  useFulfillCreditAfterDeposit(payment);

  if (!paymentId) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Alert color="red" title="Thiếu thông tin">
          Không tìm thấy mã giao dịch. Vui lòng thử lại.
        </Alert>
        <Button className="min-h-11" onClick={() => router.push("/dashboard/wallet")}>
          {WALLET_COPY.backToWallet}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  if (error || !payment) {
    const errorIntent = readBuyCreditAfterDepositIntent(paymentId);
    const handleErrorBack = () => {
      if (errorIntent?.caseId) {
        router.push(`/dashboard/case/${errorIntent.caseId}`);
      } else {
        clearBuyCreditAfterDepositIntent(paymentId);
        router.push("/dashboard/wallet");
      }
    };
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Alert color="red" title="Lỗi">
          Không thể tải thông tin nạp tiền.
        </Alert>
        <Button className="min-h-11" onClick={handleErrorBack}>
          {errorIntent?.caseId ? WALLET_COPY.backToCase : WALLET_COPY.backToWallet}
        </Button>
      </div>
    );
  }

  const hasProof = Boolean(payment.proof_file_url);
  const display = getDepositDisplay(payment.status, hasProof);
  const StatusIcon = STATUS_ICONS[payment.status] ?? AlertCircle;
  const createdAt = new Date(payment.created_at).toLocaleString("vi-VN");
  const bankCreditedAt = payment.bank_credited_at
    ? new Date(payment.bank_credited_at).toLocaleString("vi-VN")
    : null;

  const intent = readBuyCreditAfterDepositIntent(payment.id);
  const handleBack = () => {
    if (intent?.caseId) {
      router.push(`/dashboard/case/${intent.caseId}`);
    } else {
      clearBuyCreditAfterDepositIntent(payment.id);
      router.push("/dashboard/wallet");
    }
  };
  return (
    <PaymentView
      header={
        <button
          type="button"
          onClick={handleBack}
          className="flex min-h-11 cursor-pointer items-center gap-2 text-base text-text-muted hover:text-text-app"
        >
          <ArrowLeft className="h-4 w-4" />
          {intent?.caseId ? WALLET_COPY.backToCase : WALLET_COPY.backToWallet}
        </button>
      }
      title={WALLET_COPY.detailTitle}
      statusLabel={display.label}
      statusColor={display.color}
      StatusIcon={StatusIcon}
      explanation={display.explanation}
      meta={{
        createdAt,
        bankCreditedAt,
        amount: payment.amount,
        currency: payment.currency,
        transferContent: payment.transfer_content,
      }}
      bankInfo={payment.status === "pending" ? payment.bankInfo : undefined}
    >
      {hasProof && payment.proof_file_url ? (
        <div className="space-y-3 rounded-xl border border-border-app p-4">
          <h3 className="font-semibold text-text-app">{WALLET_COPY.hasProof}</h3>
          <ProofPreview proofFileUrl={payment.proof_file_url} />
        </div>
      ) : payment.status === "pending" ? (
        <p className="text-base text-text-muted">{WALLET_COPY.noProof}</p>
      ) : null}

      {payment.status === "pending" && !hasProof ? <ProofUpload depositId={payment.id} /> : null}

      {payment.status === "amount_mismatch" ? (
        <Alert color="yellow" title={display.label}>
          {display.explanation} Không thể gửi lại ảnh chứng minh cho yêu cầu này.
        </Alert>
      ) : null}

      {payment.status === "rejected" ? (
        <div className="space-y-3">
          <Alert color="red" title={display.label}>
            {payment.rejection_reason || "Minh chứng không hợp lệ."}
          </Alert>
          <Button
            className="min-h-11"
            color="brand"
            onClick={() => router.push(`/dashboard/wallet?amount=${payment.amount}`)}
          >
            {WALLET_COPY.newDeposit}
          </Button>
        </div>
      ) : null}
    </PaymentView>
  );
}
