"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@mantine/core";
import { Upload } from "lucide-react";
import { validatePaymentProof } from "@/lib/pricing";
import { WALLET_COPY } from "@/lib/deposit-display";
import { useUploadPaymentProof } from "../hooks/usePayment";

export function ProofUpload({ depositId }: { depositId: string }) {
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadProofMutation = useUploadPaymentProof(depositId, {
    onError: (error) => {
      setUploadError(error.response?.data?.message || "Tải lên thất bại.");
    },
  });

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);
  const canPreviewSelectedFile = Boolean(
    selectedFile &&
      !/\.(?:heic|heif)$/i.test(selectedFile.name) &&
      !/^image\/hei[cf]$/i.test(selectedFile.type),
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const assignFile = (file: File) => {
    if (!validatePaymentProof(file)) return;
    setSelectedFile(file);
    setUploadError("");
  };

  return (
    <div className="space-y-3">
      <p className="text-base text-text-muted">
        Số dư chưa thay đổi. Thêm ảnh chứng minh để quản trị viên kiểm tra.
      </p>
      <div
        className="space-y-4 rounded-lg border border-border-app p-5"
        onPaste={(event) => {
          const items = event.clipboardData?.items;
          if (!items) return;
          for (let index = 0; index < items.length; index += 1) {
            const item = items[index];
            if (item?.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (file) assignFile(file);
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
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) assignFile(file);
          }}
        />
        {!selectedFile ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-11 w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-brand/30 bg-brand-subtle/10 px-4 py-8 text-brand/80 hover:border-brand/60 hover:bg-brand-subtle/20 hover:text-brand"
          >
            <Upload className="h-8 w-8" />
            <span className="text-base font-medium">Nhấn để chọn ảnh chụp</span>
            <span className="text-sm">Hoặc nhấn Ctrl+V để dán ảnh từ bộ nhớ tạm</span>
          </button>
        ) : (
          <div className="space-y-3">
            {previewUrl && canPreviewSelectedFile ? (
              <div className="aspect-video overflow-hidden rounded-lg border border-border-app bg-surface-app/40">
                <img
                  src={previewUrl}
                  alt="Xem trước ảnh chụp chuyển khoản"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <p className="rounded-lg border border-border-app p-4 text-base text-text-muted">
                Không thể xem trước định dạng này tại đây. Bạn vẫn có thể gửi tệp.
              </p>
            )}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border-app bg-surface-app/60 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-text-app">{selectedFile.name}</p>
                <p className="text-sm text-text-muted">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                type="button"
                className="min-h-11 shrink-0 text-base text-text-muted underline"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                Đổi file
              </button>
            </div>
          </div>
        )}
        {uploadError ? <p className="text-sm text-red-500">{uploadError}</p> : null}
        <Button
          onClick={() =>
            selectedFile &&
            uploadProofMutation.mutate(selectedFile, {
              onSuccess: () => setSelectedFile(null),
            })
          }
          fullWidth
          color={selectedFile ? "brand" : "gray"}
          loading={uploadProofMutation.isPending}
          disabled={!selectedFile || uploadProofMutation.isPending}
          className="min-h-11"
        >
          {uploadProofMutation.isPending ? "Đang tải lên..." : WALLET_COPY.addProof}
        </Button>
      </div>
    </div>
  );
}
