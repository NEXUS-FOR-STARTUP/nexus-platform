"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { LabelQuote, PreCp1Input, TeamFitSavedResult } from "@repo/validation";

export type SavePreCp1Payload = {
  caseId: string;
  input: PreCp1Input;
  aiLabels?: LabelQuote[];
  aiResult?: TeamFitSavedResult;
};

export type SavePreCp1Response = { reportId: string; isNew: boolean };

const SAVE_TIMEOUT_MS = 30_000;

export function usePreCp1Save() {
  return useMutation<SavePreCp1Response, Error, SavePreCp1Payload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<{ ok: boolean } & SavePreCp1Response>("/pre-cp1/save", payload, {
        timeout: SAVE_TIMEOUT_MS,
      });
      return { reportId: res.data.reportId, isNew: res.data.isNew };
    },
  });
}
