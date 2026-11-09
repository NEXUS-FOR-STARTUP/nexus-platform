"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { LabelRequest, LabelResult } from "@repo/validation";

const LABEL_TIMEOUT_MS = 25_000;

/**
 * One AI label call. The server answers 200 with aiOk:false when the model is
 * unavailable, so the flow can ask the user to tick labels by hand.
 */
export function usePreCp1Label() {
  return useMutation<LabelResult, Error, LabelRequest>({
    mutationFn: async (request) => {
      const res = await apiClient.post<{ ok: boolean } & LabelResult>("/pre-cp1/label", request, {
        timeout: LABEL_TIMEOUT_MS,
      });
      return { aiOk: res.data.aiOk, labels: res.data.labels ?? [] };
    },
  });
}
