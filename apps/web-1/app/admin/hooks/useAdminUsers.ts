"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface UseAdminUsersParams {
  searchValue?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  filterField?: string;
  filterValue?: string;
}

export function useAdminUsers(params: UseAdminUsersParams = {}) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin-users", params],
    queryFn: async () => {
      const response = await apiClient.get("/admin/users", {
        params: {
          search: params.searchValue,
          role: params.filterField === "role" ? params.filterValue : undefined,
          banned: params.filterField === "banned" ? params.filterValue : undefined,
          limit: params.limit || 10,
          offset: params.offset || 0,
          sortBy: params.sortBy || "createdAt",
          sortDirection: params.sortDirection || "desc",
        },
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; role?: string }) => {
      const result = await apiClient.post("/admin/users", data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({
      userId,
      banReason,
    }: {
      userId: string;
      banReason?: string;
    }) => {
      return apiClient.post(`/admin/users/${userId}/ban`, { ban_reason: banReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient.post(`/admin/users/${userId}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return {
    users: usersQuery.data?.users || [],
    total: usersQuery.data?.total || 0,
    isLoading: usersQuery.isLoading,
    isFetching: usersQuery.isFetching,
    error: usersQuery.error,
    refetch: usersQuery.refetch,

    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,

    banUser: banUserMutation.mutateAsync,
    isBanning: banUserMutation.isPending,

    unbanUser: unbanUserMutation.mutateAsync,
    isUnbanning: unbanUserMutation.isPending,
  };
}
