"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCasesList } from "../dashboard/hooks/useCasesList";
import CaseCard from "../dashboard/_components/CaseCard";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { Sparkles, ClipboardList, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@mantine/core";

export default function SupporterDashboard() {
  const { data: cases, isLoading, error, refetch } = useCasesList();
  const [activeFilter, setActiveFilter] = useState<"pending" | "completed" | "all">("pending");

  // Filter cases assigned to the supporter
  const pendingCases = cases?.filter(
    (c) => c.internal_status === "assigned" || c.internal_status === "auditing" || c.internal_status === "need_clarification"
  ) || [];

  const completedCases = cases?.filter(
    (c) => c.internal_status === "completed" || c.internal_status === "approved"
  ) || [];

  const displayedCases = 
    activeFilter === "pending" 
      ? pendingCases 
      : activeFilter === "completed" 
      ? completedCases 
      : cases || [];

  return (
    <div className="space-y-8 font-body text-xs text-text-app pb-12 animate-fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Supporter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-app">
            Hồ sơ phụ trách
          </h1>
          <p className="font-body text-sm text-text-muted mt-1">
            Đánh giá, phản biện logic ý tưởng khởi nghiệp và hỗ trợ chuyên môn cho sinh viên.
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          variant="default"
          leftSection={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-text-muted hover:text-brand text-xs font-semibold font-body h-9 px-3 cursor-pointer"
        >
          <span>Tải lại</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border-app gap-6">
        <button
          onClick={() => setActiveFilter("pending")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeFilter === "pending"
              ? "border-brand text-brand"
              : "border-transparent text-text-muted hover:text-text-app"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Cần phản biện ({pendingCases.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter("completed")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeFilter === "completed"
              ? "border-brand text-brand"
              : "border-transparent text-text-muted hover:text-text-app"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã hoàn thành ({completedCases.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter("all")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeFilter === "all"
              ? "border-brand text-brand"
              : "border-transparent text-text-muted hover:text-text-app"
          }`}
        >
          <span>Tất cả ({cases?.length || 0})</span>
        </button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="py-8">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      ) : error ? (
        <div className="p-4 bg-danger-soft border border-danger/10 text-danger rounded-xl font-body text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Không thể tải danh sách hồ sơ. Vui lòng thử lại sau.</span>
        </div>
      ) : displayedCases.length === 0 ? (
        <div className="py-12 border border-border-app rounded-2xl bg-surface-app text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
            {activeFilter === "pending" ? (
              <CheckCircle2 className="w-6 h-6 text-success" />
            ) : (
              <ClipboardList className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h4 className="font-heading font-semibold text-sm text-text-app">
              {activeFilter === "pending" 
                ? "Không có hồ sơ cần phản biện" 
                : activeFilter === "completed"
                ? "Chưa có hồ sơ nào hoàn thành"
                : "Không có hồ sơ nào được phân công"}
            </h4>
            <p className="font-body text-xs text-text-muted leading-relaxed">
              {activeFilter === "pending"
                ? "Tất cả các hồ sơ được phân công đã được xuất báo cáo phản biện thành công hoặc chưa có hồ sơ mới được phân công."
                : "Các hồ sơ sau khi bạn xuất báo cáo và phê duyệt chính thức sẽ hiển thị tại danh sách này."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCases.map((item) => (
            <CaseCard key={item.id} item={item} hrefPrefix="/supporter/case" />
          ))}
        </div>
      )}
    </div>
  );
}
