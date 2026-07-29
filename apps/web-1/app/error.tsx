"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "@mantine/core";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error details to console
    console.error("System Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-app p-6 font-body text-text-app text-center">
      <div className="max-w-md space-y-6">
        {/* Error icon */}
        <div className="w-16 h-16 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto shadow-sm">
          <AlertOctagon className="w-8 h-8" />
        </div>

        {/* Error content */}
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-semibold">Đã xảy ra lỗi hệ thống</h1>
          <p className="text-xs text-text-muted leading-relaxed">
            Hệ thống gặp sự cố ngoài ý muốn khi tải trang này. Bạn có thể thử tải lại hoặc quay về trang chủ.
          </p>
          {error.digest && (
            <p className="text-base text-text-subtle font-mono mt-1">
              Mã sự cố: {error.digest}
            </p>
          )}
        </div>

        {/* Retry Button */}
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            leftSection={<RefreshCw className="w-3.5 h-3.5" />}
            color="brand"
            className="font-body font-semibold text-xs h-10 px-5 cursor-pointer shadow-sm shadow-brand/10"
          >
            <span>Thử tải lại</span>
          </Button>
          <a
            href="/"
            className="inline-flex items-center justify-center font-body text-xs font-semibold border border-border-strong text-text-muted hover:text-text-app px-5 h-10 rounded-lg transition-colors cursor-pointer bg-surface-app"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
