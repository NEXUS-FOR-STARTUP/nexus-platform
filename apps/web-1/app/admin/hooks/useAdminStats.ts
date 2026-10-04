"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface RevenueTrendPoint {
  label: string;
  revenue: number;
  transactions: number;
}

export interface CaseTrendPoint {
  label: string;
  free: number;
  paid: number;
}

export interface AdminStatsResponse {
  totalCases: number;
  freeCases: number;
  paidCases: number;
  conversionRate: number;
  totalRevenue: number;
  slaBreachCount: number;
  casesByStage: Record<string, number>;
  supporterWorkload: { supporterId: string; name: string; caseCount: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  revenueTrend?: RevenueTrendPoint[];
  caseTrend?: CaseTrendPoint[];
  period?: string;
}

export function useAdminStats(period: string = "30d") {
  return useQuery<AdminStatsResponse>({
    queryKey: ["admin-stats", period],
    queryFn: async () => {
      const response = await apiClient.get("/admin/stats", {
        params: { period },
      });
      return response.data;
    },
    refetchInterval: 10000,
  });
}
