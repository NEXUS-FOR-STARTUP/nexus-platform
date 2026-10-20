"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pagination } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useDisclosure } from "@mantine/hooks";
import { useCasesList } from "./hooks/useCasesList";
import { CreateProjectModal } from "./_components/CreateProjectModal";
import CaseCard from "./_components/CaseCard";
import CaseListFilters from "./_components/CaseListFilters";
import DashboardEmptyState from "./_components/DashboardEmptyState";
import ContactIncompleteBanner from "./_components/ContactIncompleteBanner";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const PAGE_SIZE = 20;

export default function StudentDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [stage, setStage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"created_at" | "case_code" | "team_name">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [opened, { open, close }] = useDisclosure(false);

  // `/dashboard?create=1` (landing pricing CTA) opens the create-project modal once, then drops the flag.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") !== "1") return;
    open();
    params.delete("create");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [open]);
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
          <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight text-text-app">Dự án phản biện</h1>
          <p className="font-body text-base text-text-muted mt-1">
            Quản lý các dự án phản biện ý tưởng khởi nghiệp.
          </p>
        </div>

        {!isLoading && (total > 0 || hasActiveFilters) && (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/team-fit"
              className="inline-flex items-center justify-center gap-2 font-body text-sm sm:text-base font-medium bg-brand hover:bg-brand-hover text-white px-5 sm:px-6 h-10 sm:h-12 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Đánh giá đội ngũ</span>
            </Link>
            <button
              onClick={open}
              className="inline-flex items-center justify-center gap-2 font-body text-sm sm:text-base font-medium bg-surface-app border border-border-app hover:border-brand text-text-app hover:text-brand px-5 sm:px-6 h-10 sm:h-12 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Tạo dự án</span>
            </button>
          </div>
        )}
      </div>

      <ContactIncompleteBanner cases={cases} />

      <CaseListFilters
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        stage={stage}
        onStageChange={(value) => {
          setStage(value);
          setPage(1);
        }}
        sortValue={`${sortBy}_${sortOrder}`}
        onSortChange={(value) => {
          const match = value.match(/^(created_at|case_code|team_name)_(asc|desc)$/);
          if (!match) return;
          setSortBy(match[1] as "created_at" | "case_code" | "team_name");
          setSortOrder(match[2] as "asc" | "desc");
          setPage(1);
        }}
      />

      {isLoading ? (
        <div className="py-8">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      ) : error ? (
        <div className="p-4 bg-danger-soft border border-danger/10 text-danger rounded-lg font-body text-sm">
          Không thể tải danh sách dự án. Vui lòng thử lại sau.
        </div>
      ) : total === 0 ? (
        hasActiveFilters ? (
          <div className="p-8 rounded-2xl bg-surface-soft text-center font-body text-base text-text-muted">
            Không tìm thấy dự án phù hợp.
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
      <CreateProjectModal opened={opened} onClose={close} />
    </div>
  );
}
