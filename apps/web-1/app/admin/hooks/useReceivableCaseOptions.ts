"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@mantine/hooks";
import { apiClient } from "@/lib/api-client";
import type { AdminCaseListItem } from "./useAdminCases";

export interface ReceivableSystemAccount {
  id: string;
  email: string;
  name: string | null;
}

/** The env-configured wallet owner for "Mua lượt hộ"; null = feature off. */
export function useReceivableSystemAccount() {
  return useQuery<ReceivableSystemAccount | null>({
    queryKey: ["admin-receivable-system-account"],
    queryFn: async () => (await apiClient.get("/admin/receivables/system-account")).data.data,
    staleTime: 5 * 60 * 1000,
  });
}

/** The signed-in system account's own cases (searchable), for the "Mua lượt hộ" picker. */
export function useReceivableCaseOptions(search: string) {
  const [debounced] = useDebouncedValue(search, 300);
  return useQuery<Pick<AdminCaseListItem, "id" | "case_code" | "team_name">[]>({
    queryKey: ["receivable-cases", debounced],
    queryFn: async () => {
      const response = await apiClient.get("/cases", {
        params: { search: debounced.trim() || undefined, limit: 20 },
      });
      return response.data.items;
    },
  });
}

export interface ReceivableCaseContact {
  full_name?: string;
  zalo?: string;
  email?: string;
}

/** Case-scoped contact (GET /cases/:id `contact`) the debt will snapshot; reuses GET /cases/:id, allowed for the owner. */
export function useReceivableCaseContact(caseId: string) {
  return useQuery<ReceivableCaseContact | null>({
    queryKey: ["receivable-case-contact", caseId],
    queryFn: async () => (await apiClient.get(`/cases/${caseId}`)).data.contact ?? null,
    enabled: !!caseId,
  });
}
