import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  TeamMemberInput as SharedTeamMemberInput,
  TeamFitInput as SharedTeamFitInput,
  TeamFitFreeReport as SharedTeamFitFreeReport,
  IdeaInput as SharedIdeaInput,
} from "@repo/validation";

// ── Re-exports for backward compatibility ──

export type TeamMemberInput = SharedTeamMemberInput;
export type TeamFitInput = SharedTeamFitInput;
export type TeamFitFreeReport = SharedTeamFitFreeReport;
export type IdeaInput = SharedIdeaInput;

// ── Save mutation input ──

export type SaveInput = {
  idea: IdeaInput;
  team: TeamMemberInput[];
  result: TeamFitFreeReport;
  packageId?: string;
};

// ── Helpers ──

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosErr = error as {
      response?: { data?: { message?: string } };
    };
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

// ── Analyze mutation ──

export function useTeamFitMutation() {
  return useMutation<TeamFitFreeReport, Error, TeamFitInput>({
    mutationFn: async (input: TeamFitInput) => {
      const res = await apiClient.post<TeamFitFreeReport>(
        "/ai-engine/team-fit",
        input,
      );
      return res.data;
    },
    onError: (error) => {
      const message = extractErrorMessage(error);
      console.error("[useTeamFitMutation]", message);
    },
  });
}

// ── Save mutation ──

export function useTeamFitSaveMutation(
  options?: UseMutationOptions<
    { caseId: string; caseCode: string },
    Error,
    SaveInput
  >,
): UseMutationResult<
  { caseId: string; caseCode: string },
  Error,
  SaveInput
> {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...rest } = options ?? {};

  return useMutation<{ caseId: string; caseCode: string }, Error, SaveInput>({
    mutationFn: async (input: SaveInput) => {
      const res = await apiClient.post<{ caseId: string; caseCode: string }>(
        "/ai-engine/team-fit/save",
        input,
      );
      return res.data;
    },
    ...rest,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      onSuccess?.(...args);
    },
    onError: (...args) => {
      const message = extractErrorMessage(args[0]);
      console.error("[useTeamFitSaveMutation]", message);
      onError?.(...args);
    },
  });
}

export default useTeamFitMutation;
