"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pagination } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useDisclosure } from "@mantine/hooks";
import { useCasesList } from "./hooks/useCasesList";
import { PackageSelectionModal } from "./_components/PackageSelectionModal";
import CaseCard from "./_components/CaseCard";
import CaseListFilters from "./_components/CaseListFilters";
import DashboardEmptyState from "./_components/DashboardEmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const PAGE_SIZE = 20;

export default function StudentDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [stage, setStage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"created_at" | "case_code" | "team_name">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stage, sortBy, sortOrder]);
  const [opened, { open, close }] = useDisclosure(false);
  const { data, isLoading, error } = useCasesList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    stage: stage ?? undefined,
    sortBy,
    sortOrder,
  });

  const cases = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = Boolean(debouncedSearch || stage);

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-app">Hồ sơ phản biện</h1>
          <p className="font-body text-sm text-text-muted">
            Quản lý các hồ sơ phản biện ý tưởng khởi nghiệp.
          </p>
        </div>

        {!isLoading && (total > 0 || hasActiveFilters) && (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/team-fit"
              className="inline-flex items-center justify-center gap-2 font-body text-sm font-semibold bg-brand hover:bg-brand-hover text-white px-4 py-2 h-10 rounded-lg shadow-sm shadow-brand/10 transition-colors cursor-pointer"
            >
              <span>Đánh giá đội ngũ</span>
            </Link>
            <button
              onClick={open}
              className="inline-flex items-center justify-center gap-2 font-body text-sm font-semibold bg-surface-app border border-border-app hover:border-brand/40 text-text-app px-4 py-2 h-10 rounded-lg transition-colors cursor-pointer"
            >
              <span>Mua gói kiểm tra</span>
            </button>
          </div>
        )}
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
      />

      {isLoading ? (
        <div className="py-8">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      ) : error ? (
        <div className="p-4 bg-danger-soft border border-danger/10 text-danger rounded-lg font-body text-sm">
          Không thể tải danh sách hồ sơ. Vui lòng thử lại sau.
        </div>
      ) : total === 0 ? (
        hasActiveFilters ? (
          <div className="p-8 border border-border-app rounded-lg bg-surface-app text-center font-body text-sm text-text-muted">
            Không tìm thấy hồ sơ phù hợp.
          </div>
        ) : (
          <DashboardEmptyState />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((item) => (
              <CaseCard key={item.id} item={item} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination total={totalPages} value={page} onChange={setPage} size="sm" color="brand" radius="md" />
            </div>
          )}
        </>
      )}
      <PackageSelectionModal opened={opened} onClose={close} />
    </div>
  );
}
