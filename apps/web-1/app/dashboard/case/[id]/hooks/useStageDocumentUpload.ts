import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { StageCode } from "@app/shared/stages";

export interface StageDocumentInput {
  original_name: string;
  file_url: string;
  download_url: string;
  cloudinary_public_id: string;
  extension: string;
  mime_type: string;
  doc_type: string;
  /** Student-facing type from the shared intake catalog. */
  category?: string;
}

export function useStageDocumentUpload(caseId: string, checkpointCode: StageCode) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documents: StageDocumentInput[]) => {
      const res = await apiClient.post(`/cases/${caseId}/stages/${checkpointCode}/documents`, { documents });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["case", caseId, "stages"] });
    },
  });
}
