import React from "react";

interface PaymentBankInfoProps {
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    qrUrl?: string;
  };
}

export function PaymentBankInfo({ bankInfo }: PaymentBankInfoProps) {
  return (
    <div className="rounded-xl bg-brand-subtle/20 p-4">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        {bankInfo.qrUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={bankInfo.qrUrl}
            alt="QR chuyển khoản nạp tiền"
            className="h-56 w-56 rounded-xl bg-white"
          />
        ) : null}
        <div className="w-full min-w-0 flex-1 space-y-3 text-base">
          <div className="flex justify-between py-1.5">
            <span className="text-text-muted">Ngân hàng</span>
            <span className="font-semibold">{bankInfo.bankName}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-text-muted">Số tài khoản</span>
            <span className="font-semibold">{bankInfo.accountNumber}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-text-muted">Chủ tài khoản</span>
            <span className="font-semibold">{bankInfo.accountName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
