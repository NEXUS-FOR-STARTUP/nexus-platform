"use client";

import { useEffect, useState } from "react";
import { Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  useAdminWorkerStats,
  useAdminWorkerJobs,
  useRetryWorkerJob,
  useHealStuckJob,
  useCancelWorkerJob,
  type AdminWorkerJobListItem,
  type RetryJobPayload,
} from "../hooks/useAdminWorkers";
import WorkerKpiCards from "./WorkerKpiCards";
import WorkerJobsTable from "./WorkerJobsTable";
import WorkerJobDetailDrawer from "./WorkerJobDetailDrawer";
import RetryJobModal from "./RetryJobModal";
import HealStuckJobModal from "./HealStuckJobModal";

export type WorkerFilter = "all" | "active" | "waiting" | "stuck" | "failed" | "completed";

interface AdminWorkerMonitoringProps {
  filter?: WorkerFilter;
}

export default function AdminWorkerMonitoring({ filter = "all" }: AdminWorkerMonitoringProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [retryingJob, setRetryingJob] = useState<AdminWorkerJobListItem | null>(null);
  const [healingJob, setHealingJob] = useState<AdminWorkerJobListItem | null>(null);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch]);

  const { data: stats, isLoading: isStatsLoading } = useAdminWorkerStats();
  const { data: jobsData, isLoading: isJobsLoading } = useAdminWorkerJobs({
    page,
    limit: 15,
    status: filter,
    search: debouncedSearch,
  });

  const retryMutation = useRetryWorkerJob();
  const healMutation = useHealStuckJob();
  const cancelMutation = useCancelWorkerJob();

  const handleConfirmRetry = async (jobId: string, payload: RetryJobPayload) => {
    await retryMutation.mutateAsync({ jobId, payload });
  };

  const handleConfirmHeal = async (jobId: string, reason?: string) => {
    await healMutation.mutateAsync({ jobId, payload: { reason } });
  };

  const handleCancel = async (jobId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy tiến trình thẩm định này không?")) {
      await cancelMutation.mutateAsync(jobId);
    }
  };

  return (
    <Stack gap="lg">
      <WorkerKpiCards data={stats} isLoading={isStatsLoading} />

      <WorkerJobsTable
        items={jobsData?.items ?? []}
        total={jobsData?.total ?? 0}
        page={page}
        totalPages={jobsData?.totalPages ?? 1}
        isLoading={isJobsLoading}
        search={search}
        onSearchChange={setSearch}
        onPageChange={setPage}
        onView={(jobId) => setSelectedJobId(jobId)}
        onRetry={(job) => setRetryingJob(job)}
        onHeal={(job) => setHealingJob(job)}
        onCancel={handleCancel}
      />

      <WorkerJobDetailDrawer
        jobId={selectedJobId}
        isOpen={Boolean(selectedJobId)}
        onClose={() => setSelectedJobId(null)}
      />

      <RetryJobModal
        job={retryingJob}
        isOpen={Boolean(retryingJob)}
        onClose={() => setRetryingJob(null)}
        onConfirm={handleConfirmRetry}
        isSubmitting={retryMutation.isPending}
      />

      <HealStuckJobModal
        job={healingJob}
        isOpen={Boolean(healingJob)}
        onClose={() => setHealingJob(null)}
        onConfirm={handleConfirmHeal}
        isSubmitting={healMutation.isPending}
      />
    </Stack>
  );
}
