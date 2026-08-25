"use client";

import { useEffect, useState } from "react";
import { Pagination, Button } from "@mantine/core";
import { FileText, ClipboardList, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useCasesList } from "../dashboard/hooks/useCasesList";
import CaseCard from "../dashboard/_components/CaseCard";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const PAGE_SIZE = 20;

const FILTER_STATUS: Record<"pending" | "submitted" | "completed" | "all", string | undefined> = {
  pending: "assigned,supporter_working,waiting_user",
  submitted: "report_ready_to_publish",
  completed: "done",
  all: undefined,
};

export default function SupporterDashboard() {
  const [activeFilter, setActiveFilter] = useState<"pending" | "submitted" | "completed" | "all">("pending");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const { data, isLoading, error, refetch } = useCasesList({
    page,
    limit: PAGE_SIZE,
    internal_status: FILTER_STATUS[activeFilter],
  });

  const cases = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8 font-body text-xs text-text-app pb-12 animate-fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
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
          <span>Cần phản biện{activeFilter === "pending" ? ` (${total})` : ""}</span>
        </button>

        <button
          onClick={() => setActiveFilter("submitted")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeFilter === "submitted"
              ? "border-brand text-brand"
              : "border-transparent text-text-muted hover:text-text-app"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Đã giao{activeFilter === "submitted" ? ` (${total})` : ""}</span>
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
          <span>Đã hoàn thành{activeFilter === "completed" ? ` (${total})` : ""}</span>
        </button>

        <button
          onClick={() => setActiveFilter("all")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeFilter === "all"
              ? "border-brand text-brand"
              : "border-transparent text-text-muted hover:text-text-app"
          }`}
        >
          <span>Tất cả{activeFilter === "all" ? ` (${total})` : ""}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-8">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      ) : error ? (
        <div className="p-4 bg-danger-soft border border-danger/10 text-danger rounded-xl font-body text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Không thể tải danh sách hồ sơ. Vui lòng thử lại sau.</span>
        </div>
      ) : cases.length === 0 ? (
        <div className="py-12 border border-border-app rounded-2xl bg-surface-app text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
            {activeFilter === "pending" ? (
              <ClipboardList className="w-6 h-6 text-text-subtle" />
            ) : activeFilter === "submitted" ? (
              <FileText className="w-6 h-6 text-text-subtle" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-success" />
            )}
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h4 className="font-heading font-semibold text-sm text-text-app">
              {activeFilter === "pending"
                ? "Không có hồ sơ cần phản biện"
                : activeFilter === "submitted"
                  ? "Chưa có hồ sơ nào được giao"
                  : activeFilter === "completed"
                    ? "Chưa có hồ sơ nào hoàn thành"
                    : "Không có hồ sơ nào được phân công"}
            </h4>
            <p className="font-body text-xs text-text-muted leading-relaxed">
              {activeFilter === "pending"
                ? "Không có hồ sơ cần phản biện — tất cả đã được xử lý hoặc chưa có phân công mới."
                : activeFilter === "submitted"
                  ? "Chưa có hồ sơ nào được giao — sau khi gửi báo cáo phản biện và chờ sinh viên xác nhận, hồ sơ sẽ hiển thị tại đây."
                  : "Các hồ sơ sau khi hoàn thành sẽ hiển thị tại danh sách này."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((item) => (
              <CaseCard key={item.id} item={item} hrefPrefix="/supporter/case" />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination total={totalPages} value={page} onChange={setPage} size="sm" color="brand" radius="md" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
