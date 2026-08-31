import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Case } from "@/types";

export interface CaseListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "created_at" | "case_code" | "team_name";
  sortOrder?: "asc" | "desc";
  internal_status?: string;
  stage?: string;
}

export interface CaseListResponse {
  items: Case[];
  total: number;
  page: number;
  limit: number;
}

export function useCasesList(query: CaseListQuery = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const search = query.search?.trim() || undefined;
  const sortBy = query.sortBy ?? "created_at";
  const sortOrder = query.sortOrder ?? "desc";
  const internal_status = query.internal_status || undefined;
  const stage = query.stage || undefined;

  return useQuery<CaseListResponse>({
    queryKey: ["cases", { page, limit, search, sortBy, sortOrder, internal_status, stage }],
    queryFn: async () => {
      const response = await apiClient.get("/cases", {
        params: { page, limit, search, sortBy, sortOrder, internal_status, stage },
      });
      const data = response.data;
      // Backward compat: API trước đây trả Case[] thuần; chuẩn hóa về paginated
      if (Array.isArray(data)) {
        return { items: data as Case[], total: data.length, page: 1, limit: data.length || 20 };
      }
      return data as CaseListResponse;
    },
  });
}
