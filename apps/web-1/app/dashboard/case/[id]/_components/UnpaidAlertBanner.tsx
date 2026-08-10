"use client";

import React from "react";
import { Case } from "@/types";
import { AlertCircle, CreditCard, Clock, XCircle } from "lucide-react";
import { Button } from "@mantine/core";
import { getCaseEffectivePrice } from "@/lib/pricing";

interface UnpaidAlertBannerProps {
  caseData: Case;
  onOpenPayment: () => void;
}

export default function UnpaidAlertBanner({ caseData, onOpenPayment }: UnpaidAlertBannerProps) {
  const effectivePrice = getCaseEffectivePrice(caseData);
  if (effectivePrice === 0) {
    return null;
  }

  const { payment_status, payments } = caseData;

  // Find the latest payment to get the rejection reason if applicable
  const latestPayment = payments && payments.length > 0 
    ? [...payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  if (payment_status === "unpaid") {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-xl bg-warning-soft border border-warning/40 animate-fade-in shadow-xs">
        <div className="flex items-center gap-4">
          <AlertCircle className="w-7 h-7 text-warning shrink-0" />
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-h3 text-text-app">Chờ thanh toán dịch vụ</h3>
            <p className="font-body text-lg text-text-muted leading-relaxed">
              Vui lòng thực hiện thanh toán phí dịch vụ để kích hoạt và bắt đầu quy trình phản biện.
            </p>
          </div>
        </div>
        <Button
          onClick={onOpenPayment}
          color="brand"
          leftSection={<CreditCard className="w-5 h-5" />}
          className="font-body font-semibold text-base h-11 px-6 shrink-0 cursor-pointer shadow-md shadow-brand/10"
        >
          <span>Thanh toán ngay</span>
        </Button>
      </div>
    );
  }

  if (payment_status === "pending_verification") {
    return (
      <div className="flex items-center gap-3.5 p-5 rounded-xl bg-warning-soft/50 border border-warning/20 shadow-xs">
        <Clock className="w-6 h-6 text-warning shrink-0 animate-pulse" />
        <div className="space-y-1">
          <h4 className="font-heading font-bold text-h4 text-text-app">Đang chờ xác thực thanh toán</h4>
          <p className="font-body text-base text-text-muted leading-relaxed">
            Hệ thống đã nhận được minh chứng thanh toán của bạn. Quản trị viên đang tiến hành kiểm tra giao dịch và sẽ duyệt trong thời gian sớm nhất.
          </p>
        </div>
      </div>
    );
  }

  if (payment_status === "rejected") {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-xl bg-danger-soft border border-danger/30 animate-fade-in shadow-xs">
        <div className="flex items-start gap-3.5">
          <XCircle className="w-6 h-6 text-danger shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="font-heading font-bold text-h4 text-danger">Giao dịch bị từ chối</h4>
            {latestPayment?.rejection_reason ? (
              <p className="font-body text-base text-text-app bg-surface-app/70 border border-danger/20 p-3 rounded-lg">
                <strong>Lý do từ chối:</strong> {latestPayment.rejection_reason}
              </p>
            ) : (
              <p className="font-body text-base text-text-muted">
                Minh chứng giao dịch của bạn không hợp lệ hoặc thông tin chuyển khoản chưa chính xác.
              </p>
            )}
            <p className="font-body text-sm text-text-muted italic">
              Vui lòng kiểm tra lại số tiền, nội dung giao dịch và tải lên minh chứng mới.
            </p>
          </div>
        </div>
        <Button
          onClick={onOpenPayment}
          color="red"
          leftSection={<CreditCard className="w-4.5 h-4.5" />}
          className="font-body font-semibold text-base h-10 px-5 shrink-0 cursor-pointer"
        >
          <span>Gửi lại minh chứng</span>
        </Button>
      </div>
    );
  }

  return null;
}
