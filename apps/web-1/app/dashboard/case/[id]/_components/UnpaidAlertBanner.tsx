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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-lg bg-warning-soft border border-warning/20 animate-fade-in">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-heading font-semibold text-sm text-text-app">Chưa hoàn tất thanh toán</h4>
            <p className="font-body text-xs text-text-muted leading-relaxed">
              Vui lòng thực hiện thanh toán phí dịch vụ để kích hoạt và bắt đầu quá trình phản biện phản hồi từ Supporter.
            </p>
          </div>
        </div>
        <Button
          onClick={onOpenPayment}
          color="brand"
          leftSection={<CreditCard className="w-4 h-4" />}
          className="font-body font-semibold text-xs h-9 px-4 shrink-0 cursor-pointer"
        >
          <span>Thanh toán ngay</span>
        </Button>
      </div>
    );
  }

  if (payment_status === "pending_verification") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-warning-soft/40 border border-warning/10">
        <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-0.5">
          <h4 className="font-heading font-semibold text-sm text-text-app">Đang chờ xác thực thanh toán</h4>
          <p className="font-body text-xs text-text-muted leading-relaxed">
            Hệ thống đã nhận được minh chứng thanh toán của bạn. Quản trị viên đang tiến hành kiểm tra giao dịch và sẽ duyệt trong thời gian sớm nhất.
          </p>
        </div>
      </div>
    );
  }

  if (payment_status === "rejected") {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-lg bg-danger-soft border border-danger/20 animate-fade-in">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-heading font-semibold text-sm text-danger">Giao dịch bị từ chối</h4>
            {latestPayment?.rejection_reason ? (
              <p className="font-body text-xs text-text-app bg-surface-app/50 border border-danger/10 p-2.5 rounded-lg">
                <strong>Lý do từ chối:</strong> {latestPayment.rejection_reason}
              </p>
            ) : (
              <p className="font-body text-xs text-text-muted">
                Minh chứng giao dịch của bạn không hợp lệ hoặc thông tin chuyển khoản chưa chính xác.
              </p>
            )}
            <p className="font-body text-text-muted italic">
              Vui lòng kiểm tra lại số tiền, nội dung giao dịch và tải lên minh chứng mới.
            </p>
          </div>
        </div>
        <Button
          onClick={onOpenPayment}
          color="red"
          leftSection={<CreditCard className="w-4 h-4" />}
          className="font-body font-semibold text-xs h-9 px-4 shrink-0 cursor-pointer"
        >
          <span>Gửi lại minh chứng</span>
        </Button>
      </div>
    );
  }

  return null;
}
