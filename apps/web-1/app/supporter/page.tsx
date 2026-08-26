"use client";

import { useEffect, useState } from "react";
import { Pagination, Button } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { AlertCircle, ClipboardList, RefreshCw } from "lucide-react";
import { useCasesList } from "../dashboard/hooks/useCasesList";
import CaseCard from "../dashboard/_components/CaseCard";
import CaseListFilters, { SUPPORTER_STATUS_OPTIONS } from "../dashboard/_components/CaseListFilters";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const PAGE_SIZE = 20;

export default function SupporterDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [stage, setStage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"created_at" | "case_code" | "team_name">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stage, sortBy, sortOrder]);

  const { data, isLoading, error, refetch } = useCasesList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    internal_status: stage ?? undefined,
    sortBy,
    sortOrder,
  });

  const cases = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = Boolean(debouncedSearch || stage);

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

      <CaseListFilters
        search={search}
        onSearchChange={setSearch}
        stage={stage}
        onStageChange={setStage}
        sortValue={`${sortBy}_${sortOrder}`}
        onSortChange={(value) => {
          const match = value.match(/^(created_at|case_code|team_name)_(asc|desc)$/);
          if (!match) return;
          setSortBy(match[1] as "created_at" | "case_code" | "team_name");
          setSortOrder(match[2] as "asc" | "desc");
        }}
        stageOptions={SUPPORTER_STATUS_OPTIONS}
      />

      {isLoading ? (
        <div className="py-8">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      ) : error ? (
        <div className="p-4 bg-danger-soft border border-danger/10 text-danger rounded-xl font-body text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Không thể tải danh sách hồ sơ. Vui lòng thử lại sau.</span>
        </div>
      ) : total === 0 ? (
        hasActiveFilters ? (
          <div className="p-8 border border-border-app rounded-lg bg-surface-app text-center font-body text-sm text-text-muted">
            Không tìm thấy hồ sơ phù hợp.
          </div>
        ) : (
          <div className="py-12 border border-border-app rounded-2xl bg-surface-app text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-text-subtle" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-heading font-semibold text-sm text-text-app">
                Không có hồ sơ nào được phân công
              </h4>
              <p className="font-body text-xs text-text-muted leading-relaxed">
                Không có hồ sơ cần phản biện — tất cả đã được xử lý hoặc chưa có phân công mới.
              </p>
            </div>
          </div>
        )
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
