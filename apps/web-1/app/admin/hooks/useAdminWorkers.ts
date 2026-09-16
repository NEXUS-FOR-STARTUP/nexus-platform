import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import type {
  AdminWorkerStatsResponse as AdminWorkerStats,
  AdminWorkerJobListItem,
  AdminWorkerJobListResponse,
  AdminWorkerJobDetailResponse as AdminWorkerJobDetail,
  AdminRetryJobBody as RetryJobPayload,
  AdminHealStuckBody as HealStuckPayload,
  AdminWorkerJobStatusFilter,
  JobSandboxFileInfo,
} from "@repo/validation";

export type {
  AdminWorkerStats,
  AdminWorkerJobListItem,
  AdminWorkerJobListResponse,
  AdminWorkerJobDetail,
  RetryJobPayload,
  HealStuckPayload,
  AdminWorkerJobStatusFilter,
  JobSandboxFileInfo,
};

export interface WorkerJobsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim().length > 0) return apiMessage;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useAdminWorkerStats() {
  return useQuery<AdminWorkerStats>({
    queryKey: ["admin-worker-stats"],
    queryFn: async () => (await apiClient.get<AdminWorkerStats>("/admin/workers/stats")).data,
    refetchInterval: (q) => {
      const d = q.state.data;
      return d && (d.activeCount > 0 || d.stuckCount > 0) ? 5000 : 15000;
    },
  });
}

export function useAdminWorkerJobs(params: WorkerJobsParams) {
  return useQuery<AdminWorkerJobListResponse>({
    queryKey: ["admin-worker-jobs", params],
    queryFn: async () => (await apiClient.get<AdminWorkerJobListResponse>("/admin/workers/jobs", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status && params.status !== "all" ? params.status : undefined,
        search: params.search?.trim() || undefined,
      },
    })).data,
  });
}

export function useAdminWorkerJobDetail(jobId: string | null) {
  return useQuery<AdminWorkerJobDetail>({
    queryKey: ["admin-worker-job", jobId],
    queryFn: async () => {
      if (!jobId) throw new Error("jobId is required");
      return (await apiClient.get<AdminWorkerJobDetail>(`/admin/workers/jobs/${jobId}`)).data;
    },
    enabled: Boolean(jobId),
  });
}

export function useAdminWorkerLogs(jobId: string | null, isRunning: boolean = false) {
  return useQuery<{ logs: string[] | string }>({
    queryKey: ["admin-worker-logs", jobId],
    queryFn: async () => {
      if (!jobId) throw new Error("jobId is required");
      return (await apiClient.get<{ logs: string[] | string }>(`/admin/workers/jobs/${jobId}/logs`)).data;
    },
    enabled: Boolean(jobId),
    refetchInterval: isRunning ? 3000 : false,
    staleTime: isRunning ? 0 : 60000,
  });
}

export function useRetryWorkerJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, payload }: { jobId: string; payload: RetryJobPayload }) =>
      (await apiClient.post(`/admin/workers/jobs/${jobId}/retry`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-worker-jobs"] });
      qc.invalidateQueries({ queryKey: ["admin-worker-stats"] });
      notifications.show({ title: "Kích hoạt chạy lại", message: "Đã kích hoạt chạy lại tiến trình thẩm định AI", color: "green" });
    },
    onError: (err) => {
      notifications.show({ title: "Lỗi chạy lại tiến trình", message: extractErrorMessage(err, "Không thể kích hoạt chạy lại job"), color: "red" });
    },
  });
}

export function useHealStuckJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, payload }: { jobId: string; payload?: HealStuckPayload }) =>
      (await apiClient.post(`/admin/workers/jobs/${jobId}/heal-stuck`, payload ?? {})).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-worker-jobs"] });
      qc.invalidateQueries({ queryKey: ["admin-worker-stats"] });
      notifications.show({ title: "Giải phóng tiến trình kẹt", message: "Đã giải phóng tiến trình và hoàn trả credit thành công", color: "green" });
    },
    onError: (err) => {
      notifications.show({ title: "Lỗi giải phóng tiến trình", message: extractErrorMessage(err, "Không thể giải phóng job bị kẹt"), color: "red" });
    },
  });
}

export function useCancelWorkerJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => (await apiClient.post(`/admin/workers/jobs/${jobId}/cancel`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-worker-jobs"] });
      qc.invalidateQueries({ queryKey: ["admin-worker-stats"] });
      notifications.show({ title: "Hủy tiến trình", message: "Đã gửi tín hiệu hủy tiến trình thẩm định", color: "green" });
    },
    onError: (err) => {
      notifications.show({ title: "Lỗi hủy tiến trình", message: extractErrorMessage(err, "Không thể hủy job"), color: "red" });
    },
  });
}
