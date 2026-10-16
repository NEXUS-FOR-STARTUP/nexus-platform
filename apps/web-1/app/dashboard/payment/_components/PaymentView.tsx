import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { PaymentBankInfo } from "./PaymentBankInfo";
import { PaymentDepositMeta } from "./PaymentDepositMeta";

const BADGE_CLASS: Record<string, string> = {
  green: "bg-success-soft text-success border-success/20",
  red: "bg-danger-soft text-danger border-danger/20",
  orange: "bg-warning-soft text-warning border-warning/20",
  yellow: "bg-warning-soft text-warning border-warning/20",
  gray: "bg-info-soft text-info border-info/20",
};

interface PaymentViewProps {
  /** Rendered above the card (e.g. back link). */
  header?: ReactNode;
  title: string;
  statusLabel: string;
  statusColor: string;
  StatusIcon: LucideIcon;
  explanation: string;
  /** Optional block between explanation and meta (e.g. amount summary). */
  summary?: ReactNode;
  meta: React.ComponentProps<typeof PaymentDepositMeta>;
  /** Shown only when provided (caller decides when to display the QR). */
  bankInfo?: React.ComponentProps<typeof PaymentBankInfo>["bankInfo"];
  qrAlt?: string;
  /** Flow-specific parts below the bank info (proof upload, actions...). */
  children?: ReactNode;
}

export function PaymentView({
  header,
  title,
  statusLabel,
  statusColor,
  StatusIcon,
  explanation,
  summary,
  meta,
  bankInfo,
  qrAlt,
  children,
}: PaymentViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 motion-reduce:animate-none sm:p-6">
      {header}

      <div className="space-y-6 rounded-2xl border border-border-app bg-surface-app p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold text-text-app">{title}</h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-semibold ${
              BADGE_CLASS[statusColor] ?? BADGE_CLASS.gray
            }`}
          >
            <StatusIcon className="h-4 w-4" />
            {statusLabel}
          </span>
        </div>
        <p className="text-base text-text-app">{explanation}</p>

        {summary}

        <PaymentDepositMeta {...meta} />

        {bankInfo?.accountNumber ? <PaymentBankInfo bankInfo={bankInfo} qrAlt={qrAlt} /> : null}

        {children}
      </div>
    </div>
  );
}
