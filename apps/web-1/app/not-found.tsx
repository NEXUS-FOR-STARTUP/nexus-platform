"use client";

import React from "react";
import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-app p-6 font-body text-text-app text-center">
      <div className="max-w-md space-y-6">
        {/* Animated Compass Icon */}
        <div className="w-16 h-16 rounded-full bg-brand-soft/40 text-brand flex items-center justify-center mx-auto shadow-sm">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        {/* 404 Titles */}
        <div className="space-y-2">
          <h1 className="font-heading text-display font-extrabold tracking-tight text-brand">404</h1>
          <h2 className="font-heading text-h3 font-semibold">Không tìm thấy trang</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Đường dẫn bạn truy cập có thể đã thay đổi hoặc không tồn tại. Vui lòng quay lại trang chủ hoặc liên hệ hỗ trợ kỹ thuật.
          </p>
        </div>

        {/* Action Link */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 font-body text-sm font-semibold bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-lg shadow-sm shadow-brand/10 transition-colors cursor-pointer"
        >
          <span>Quay về trang chủ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
