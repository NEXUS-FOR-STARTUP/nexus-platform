"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { CheckCircle2, Clock, XCircle, AlertCircle, ArrowLeft, Upload, ChevronDown } from "lucide-react";
import { validatePaymentProof } from "@/lib/pricing";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("pid");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ["deposit", paymentId],
    queryFn: async () => {
      const res = await apiClient.get(`/deposits/${paymentId}`);
      return res.data;
    },
    enabled: !!paymentId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (payment?.status !== "verified") return;

    setRedirectCountdown(5);
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/dashboard/wallet");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [payment?.status, router]);

  if (!paymentId) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Alert color="red" title="Thiếu thông tin">
          Không tìm thấy mã giao dịch. Vui lòng thử lại.
        </Alert>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Alert color="red" title="Lỗi">
          Không thể tải thông tin thanh toán.
        </Alert>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Chờ thanh toán", color: "orange", icon: Clock },
    verified: { label: "Đã thanh toán", color: "green", icon: CheckCircle2 },
    rejected: { label: "Bị từ chối", color: "red", icon: XCircle },
  };

  const statusInfo = statusConfig[payment.status] || { label: payment.status, color: "gray", icon: AlertCircle };
  const StatusIcon = statusInfo.icon;

  async function handleUploadProof() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("deposit_id", payment.id);
      await apiClient.post("/payments/proof", form);
      setUploadOpen(false);
      setSelectedFile(null);
      notifications.show({ title: "Thành công", message: "Minh chứng đã được gửi. Quản trị viên sẽ kiểm tra.", color: "green" });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Tải lên thất bại.";
      setUploadError(msg);
      notifications.show({ title: "Lỗi", message: msg, color: "red" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-text-muted hover:text-text-app text-sm">
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </button>

      <div className="bg-surface-app border border-border-app rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg text-text-app">Thanh toán</h2>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${
            statusInfo.color === "green" ? "bg-success-soft text-success border-success/20" :
            statusInfo.color === "red" ? "bg-danger-soft text-danger border-danger/20" :
            statusInfo.color === "orange" ? "bg-warning-soft text-warning border-warning/20" :
            "bg-info-soft text-info border-info/20"
          }`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusInfo.label}
          </span>
        </div>

	        {/* Bank info + QR */}
	        <div className="bg-brand-subtle/20 rounded-xl p-4">
	          {payment.bankInfo?.accountNumber ? (
	            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
	              {/* QR Code */}
	              <div className="shrink-0">
	                <img
	                  src={payment.bankInfo.qrUrl}
	                  alt="QR thanh toán"
	                  className="w-56 h-56 rounded-xl bg-white"
	                />
	              </div>

	              {/* Bank details */}
	              <div className="flex-1 w-full min-w-0 space-y-3 text-sm">
	                <div className="flex justify-between py-1.5 border-b border-border-app/40 last:border-b-0">
	                  <span className="text-text-muted">Ngân hàng</span>
	                  <span className="font-semibold text-right">{payment.bankInfo.bankName}</span>
	                </div>
	                <div className="flex justify-between py-1.5 border-b border-border-app/40 last:border-b-0">
	                  <span className="text-text-muted">Số tài khoản</span>
	                  <span className="font-semibold text-right">{payment.bankInfo.accountNumber}</span>
	                </div>
	                <div className="flex justify-between py-1.5 border-b border-border-app/40 last:border-b-0">
	                  <span className="text-text-muted">Chủ tài khoản</span>
	                  <span className="font-semibold text-right">{payment.bankInfo.accountName}</span>
	                </div>
	                <div className="flex justify-between py-1.5 border-b border-border-app/40 last:border-b-0">
	                  <span className="text-text-muted">Số tiền</span>
	                  <span className="font-semibold text-red-600 text-right">{payment.amount?.toLocaleString("vi-VN")} VND</span>
	                </div>
	                <div className="flex justify-between py-1.5 border-b border-border-app/40 last:border-b-0">
	                  <span className="text-text-muted">Nội dung CK</span>
	                  <span className="font-semibold text-right break-all max-w-[260px]">
	                    {payment.bankInfo.transferContent}
	                  </span>
	                </div>
	              </div>
	            </div>
	          ) : (
	            <div className="space-y-3 text-sm">
	              <div className="flex justify-between py-1">
	                <span className="text-text-muted">Số tiền</span>
	                <span className="font-semibold text-red-600">{payment.amount?.toLocaleString("vi-VN")} VND</span>
	              </div>
	              <p className="text-sm text-text-muted italic">Thông tin ngân hàng sẽ được cập nhật sau.</p>
	            </div>
	          )}
	        </div>


        {payment.status === "pending" && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-text-muted">
                Nếu sau 1 phút vẫn chưa được xác nhận chuyển khoản, hãy tải ảnh chuyển khoản lên để quản trị viên kiểm tra.
              </p>
              <button
                onClick={() => setUploadOpen(!uploadOpen)}
                className={`shrink-0 mt-0.5 w-7 h-7 flex items-center justify-center rounded-md border text-text-muted hover:text-text-app hover:border-border-app transition-all ${uploadOpen ? "border-border-app bg-surface-app" : "border-border-app/40"}`}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${uploadOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {uploadOpen && (
              <div
                className="border border-border-app rounded-lg p-5 space-y-4"
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item.type.startsWith("image/")) {
                      const file = item.getAsFile();
                      if (file && validatePaymentProof(file)) {
                        setSelectedFile(file);
                        setUploadError("");
                      }
                      break;
                    }
                  }
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && validatePaymentProof(file)) setSelectedFile(file);
                    setUploadError("");
                  }}
                />

                {!selectedFile ? (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 py-8 px-4 border-2 border-dashed border-brand/30 bg-brand-subtle/10 rounded-xl text-brand/80 hover:border-brand/60 hover:bg-brand-subtle/20 hover:text-brand transition-colors cursor-pointer"
                  >
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Nhấn để chọn ảnh chụp</span>
                    <span className="text-xs">Hoặc nhấn Ctrl+V để dán ảnh từ bộ nhớ tạm</span>
                    <span className="text-xs text-text-muted">Ảnh chụp màn hình chuyển khoản</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    {previewUrl && (
                      <div className="rounded-lg overflow-hidden border border-border-app bg-surface-app/40">
                        <img src={previewUrl} alt="Xem trước ảnh chụp chuyển khoản" className="w-full max-h-[300px] object-contain" />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-app/60 border border-border-app rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-app truncate">{selectedFile.name}</p>
                          <p className="text-xs text-text-muted">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="text-xs text-text-muted hover:text-red-500 underline transition-colors shrink-0"
                      >
                        Đổi file
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

                <Button onClick={handleUploadProof} fullWidth color={selectedFile ? "brand" : "gray"} loading={uploading} disabled={!selectedFile || uploading}>
                  {uploading ? "Đang tải lên..." : "Gửi minh chứng"}
                </Button>
              </div>
            )}
          </div>
        )}

        {payment.status === "verified" && (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
            <p className="text-sm font-semibold text-text-app">Nạp tiền thành công</p>
            <p className="text-xs text-text-muted">
              Tự động chuyển hướng sau {redirectCountdown} giây...
            </p>
            <Button
              onClick={() => router.push("/dashboard/wallet")}
              color="brand"
            >
              Về trang ví
            </Button>
            {payment.bank_transaction_id && (
              <div className="text-center">
                <p className="text-xs text-text-muted">
                  Mã giao dịch: <span className="font-mono font-semibold">{payment.bank_transaction_id}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {payment.status === "rejected" && (
          <Alert color="red" title="Giao dịch bị từ chối">
            <p className="text-xs">{payment.rejection_reason || "Minh chứng không hợp lệ."}</p>
          </Alert>
        )}
      </div>
    </div>
  );
}
