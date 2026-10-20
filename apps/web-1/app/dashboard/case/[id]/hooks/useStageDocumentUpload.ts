import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import type { StageCode } from "@app/shared/stages";

/** Stored kind for every file uploaded through the stage upload modal. */
const STAGE_DOC_TYPE = "revision_document";
const UPLOAD_FALLBACK_MESSAGE = "Đã xảy ra lỗi khi tải tài liệu.";

interface ManagedUpload {
  file_url: string;
  download_url: string;
  cloudinary_public_id: string;
  extension: string;
  mime_type: string;
}

export interface StageUploadInput {
  files: File[];
  /** Category code per file, same order as `files`. */
  categories: string[];
}

function uploadErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return UPLOAD_FALLBACK_MESSAGE;
}

export function useStageDocumentUpload(caseId: string, checkpointCode: StageCode) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ files, categories }: StageUploadInput) => {
      const documents = await Promise.all(
        files.map(async (file, i) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await apiClient.post<ManagedUpload>("/cases/uploads/managed-document", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const uploaded = res.data;
          return {
            original_name: file.name,
            file_url: uploaded.file_url,
            download_url: uploaded.download_url,
            cloudinary_public_id: uploaded.cloudinary_public_id,
            extension: uploaded.extension || "bin",
            mime_type: uploaded.mime_type || "application/octet-stream",
            doc_type: STAGE_DOC_TYPE,
            category: categories[i],
          };
        }),
      );
      const res = await apiClient.post(`/cases/${caseId}/stages/${checkpointCode}/documents`, { documents });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["case", caseId, "stages"] });
    },
  });

  return {
    upload: mutation.mutate,
    isUploading: mutation.isPending,
    error: mutation.error ? uploadErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
}
