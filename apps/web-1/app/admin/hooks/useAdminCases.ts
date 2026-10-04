import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@mantine/hooks";
import { apiClient } from "@/lib/api-client";
import { User } from "@/types";
import type { AdminCaseListView } from "@repo/validation";

export interface AdminCaseListItem {
  id: string;
  case_code: string;
  team_name: string | null;
  created_at: string;
  deadline: string | null;
  user_facing_stage: string;
  internal_status: string;
  payment_status: string;
  package_name: string;
  completeness: number;
  owner_name: string;
  assigned_supporter: { id: string; name: string } | null;
  sla_deadline_at: string | null;
}

interface AdminCaseListResponse {
  items: AdminCaseListItem[];
  total: number;
  page: number;
  limit: number;
}

const PAGE_SIZE = 20;

export function useAdminCases(view: AdminCaseListView = "all") {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [sortBy, setSortBy] = useState<"created_at" | "case_code" | "team_name">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setPage(1);
  }, [view, debouncedSearch, sortBy, sortOrder]);

  const listQuery = {
    view,
    search: debouncedSearch.trim() || undefined,
    sortBy,
    sortOrder,
    page,
    limit: PAGE_SIZE,
  };

  const {
    data,
    isLoading: isCasesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useQuery<AdminCaseListResponse>({
    queryKey: ["admin-cases", listQuery],
    queryFn: async () => {
      const response = await apiClient.get("/admin/cases", { params: listQuery });
      return response.data;
    },
    refetchInterval: 10000,
  });

  const supportersQuery = useQuery<User[]>({
    queryKey: ["admin-supporters"],
    queryFn: async () => {
      const response = await apiClient.get("/cases/supporters");
      return response.data;
    },
    refetchInterval: 10000,
  });

  const invalidateCases = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-cases"] });
    queryClient.invalidateQueries({ queryKey: ["admin-case-detail"] });
    queryClient.invalidateQueries({ queryKey: ["case"] });
  };

  const acceptCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const response = await apiClient.post(`/admin/cases/${caseId}/accept`);
      return response.data;
    },
    onSuccess: invalidateCases,
  });

  const rejectCaseMutation = useMutation({
    mutationFn: async ({ caseId, reason }: { caseId: string; reason: string }) => {
      const response = await apiClient.post(`/admin/cases/${caseId}/reject`, { reason });
      return response.data;
    },
    onSuccess: invalidateCases,
  });

  const assignSupporterMutation = useMutation({
    mutationFn: async ({ caseId, supporterId }: { caseId: string; supporterId: string }) => {
      const response = await apiClient.post(`/admin/cases/${caseId}/assign`, {
        supporter_id: supporterId,
      });
      return response.data;
    },
    onSuccess: invalidateCases,
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const response = await apiClient.delete(`/cases/${caseId}`);
      return response.data;
    },
    onSuccess: invalidateCases,
  });

  return {
    cases: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    limit: PAGE_SIZE,
    setPage,
    search,
    setSearch,
    sortBy,
    sortOrder,
    setSort: (nextSortBy: "created_at" | "case_code" | "team_name", nextOrder: "asc" | "desc") => {
      setSortBy(nextSortBy);
      setSortOrder(nextOrder);
    },
    isCasesLoading,
    casesError,
    refetchCases,
    supporters: supportersQuery.data || [],
    isSupportersLoading: supportersQuery.isLoading,
    acceptCase: acceptCaseMutation.mutateAsync,
    isAccepting: acceptCaseMutation.isPending,
    rejectCase: rejectCaseMutation.mutateAsync,
    isRejecting: rejectCaseMutation.isPending,
    assignSupporter: assignSupporterMutation.mutateAsync,
    isAssigning: assignSupporterMutation.isPending,
    deleteCase: deleteCaseMutation.mutateAsync,
    isDeleting: deleteCaseMutation.isPending,
  };
}

export function useAdminCaseDetail(caseId: string | null) {
  return useQuery<{
    case: any;
    intake_snapshot: any;
    allowed_transitions: string[];
  }>({
    queryKey: ["admin-case-detail", caseId],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/cases/${caseId}`);
      return response.data;
    },
    enabled: !!caseId,
    refetchInterval: 10000,
  });
}

