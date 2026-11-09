"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { TeamFitInput, TeamFitSavedResult } from "@repo/validation";

const EVALUATION_TIMEOUT_MS = 40_000;

/** The same classifier the team-fit screen used, called once at the end. */
export function useTeamFitEvaluation() {
  return useMutation<TeamFitSavedResult, Error, TeamFitInput>({
    mutationFn: async (input) => {
      const res = await apiClient.post<TeamFitSavedResult>("/ai-engine/team-fit", input, {
        timeout: EVALUATION_TIMEOUT_MS,
      });
      return res.data;
    },
  });
}
