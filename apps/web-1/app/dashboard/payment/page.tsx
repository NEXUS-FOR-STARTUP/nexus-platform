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

const STATUS_ICONS: Record<string, LucideIcon> = {
  pending: Clock,
  verified: CheckCircle2,
  rejected: XCircle,
  amount_mismatch: AlertCircle,
};

const BADGE_CLASS: Record<string, string> = {
  green: "bg-success-soft text-success border-success/20",
  red: "bg-danger-soft text-danger border-danger/20",
  orange: "bg-warning-soft text-warning border-warning/20",
  yellow: "bg-warning-soft text-warning border-warning/20",
  gray: "bg-info-soft text-info border-info/20",
};

export default function PaymentPage() {
  const router = useRouter();
  const paymentId = useSearchParams().get("pid");
  const { data: payment, isLoading, error } = useDepositDetail(paymentId);

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
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Alert color="red" title="Lỗi">
          Không thể tải thông tin nạp tiền.
        </Alert>
        <Button className="min-h-11" onClick={() => router.push("/dashboard/wallet")}>
          {WALLET_COPY.backToWallet}
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 motion-reduce:animate-none sm:p-6">
      <button
        type="button"
        onClick={() => router.push("/dashboard/wallet")}
        className="flex min-h-11 cursor-pointer items-center gap-2 text-base text-text-muted hover:text-text-app"
      >
        <ArrowLeft className="h-4 w-4" />
        {WALLET_COPY.backToWallet}
      </button>

      <div className="space-y-6 rounded-2xl border border-border-app bg-surface-app p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold text-text-app">
            {WALLET_COPY.detailTitle}
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-semibold ${
              BADGE_CLASS[display.color] ?? BADGE_CLASS.gray
            }`}
          >
            <StatusIcon className="h-4 w-4" />
            {display.label}
          </span>
        </div>
        <p className="text-base text-text-app">{display.explanation}</p>

        <div className="space-y-2 text-base">
          <div className="flex justify-between gap-3 border-b border-border-app/40 py-1.5">
            <span className="text-text-muted">{WALLET_COPY.requestCreated}</span>
            <span className="text-right font-medium">{createdAt}</span>
          </div>
          {bankCreditedAt ? (
            <div className="flex justify-between gap-3 border-b border-border-app/40 py-1.5">
              <span className="text-text-muted">{WALLET_COPY.bankCredited}</span>
              <span className="text-right font-medium">{bankCreditedAt}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-3 border-b border-border-app/40 py-1.5">
            <span className="text-text-muted">Số tiền</span>
            <span className="text-right font-semibold">
              {payment.amount.toLocaleString("vi-VN")} {payment.currency}
            </span>
          </div>
          <div className="flex justify-between gap-3 border-b border-border-app/40 py-1.5">
            <span className="text-text-muted">{WALLET_COPY.activityDescription}</span>
            <span className="text-right font-medium">{WALLET_COPY.depositActivityText}</span>
          </div>
          <div className="flex justify-between gap-3 py-1.5">
            <span className="text-text-muted">{WALLET_COPY.transferContent}</span>
            <span className="text-right font-mono font-semibold">
              {payment.transfer_content}
            </span>
          </div>
        </div>

        {payment.status === "pending" && payment.bankInfo?.accountNumber ? (
          <div className="rounded-xl bg-brand-subtle/20 p-4">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              {payment.bankInfo.qrUrl ? (
                <img
                  src={payment.bankInfo.qrUrl}
                  alt="QR chuyển khoản nạp tiền"
                  className="h-56 w-56 rounded-xl bg-white"
                />
              ) : null}
              <div className="w-full min-w-0 flex-1 space-y-3 text-base">
                <div className="flex justify-between py-1.5">
                  <span className="text-text-muted">Ngân hàng</span>
                  <span className="font-semibold">{payment.bankInfo.bankName}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-text-muted">Số tài khoản</span>
                  <span className="font-semibold">{payment.bankInfo.accountNumber}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-text-muted">Chủ tài khoản</span>
                  <span className="font-semibold">{payment.bankInfo.accountName}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

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
      </div>
    </div>
  );
}
