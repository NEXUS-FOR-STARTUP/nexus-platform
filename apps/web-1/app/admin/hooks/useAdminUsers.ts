"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { admin } from "@/lib/auth-client";

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
      const result = await admin.listUsers({
        query: {
          searchValue: params.searchValue,
          searchField: "name",
          searchOperator: "contains",
          limit: params.limit || 20,
          offset: params.offset || 0,
          sortBy: params.sortBy || "created_at",
          sortDirection: params.sortDirection || "desc",
          filterField: params.filterField,
          filterValue: params.filterValue,
        },
      });
      return result.data;
    },
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
    error: usersQuery.error,

    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,

    banUser: banUserMutation.mutateAsync,
    isBanning: banUserMutation.isPending,

    unbanUser: unbanUserMutation.mutateAsync,
    isUnbanning: unbanUserMutation.isPending,
  };
}
