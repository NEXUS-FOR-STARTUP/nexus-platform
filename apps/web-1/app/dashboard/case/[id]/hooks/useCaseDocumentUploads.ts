import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type DocumentTypeOption = {
  code: string;
  label: string;
  flow: string;
  unit_scope: string;
  sort_order: number;
};

async function uploadManagedDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post("/cases/uploads/managed-document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export function useDocumentTypeOptions(flow: string, unitScope?: string) {
  return useQuery<{ items: DocumentTypeOption[] }>({
    queryKey: ["document-types", flow, unitScope],
    queryFn: async () => {
      const response = await apiClient.get("/cases/document-types", {
        params: {
          flow,
          unit_scope: unitScope,
        },
      });
      return response.data;
    },
    enabled: !!flow,
  });
}

export function useCaseRevisionUpload(caseId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: {
      change_summary: string;
      remaining_blockers?: string;
      document_type_code: string;
      files: File[];
    }) => {
      const documents = await Promise.all(
        payload.files.map(async (file) => {
          const uploaded = await uploadManagedDocument(file);
          return {
            ...uploaded,
            doc_type: payload.document_type_code,
          };
        }),
      );

      const response = await apiClient.post(`/cases/${caseId}/revisions/upload`, {
        change_summary: payload.change_summary,
        remaining_blockers: payload.remaining_blockers || undefined,
        documents,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
  });

  return {
    submitRevisionUpload: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}

export function useSupporterOutputUpload(caseId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: {
      note?: string;
      files: File[];
    }) => {
      const documents = await Promise.all(
        payload.files.map(async (file) => {
          const uploaded = await uploadManagedDocument(file);
          return {
            ...uploaded,
            doc_type: "supporter_output",
          };
        }),
      );

      const response = await apiClient.post(`/cases/${caseId}/supporter-outputs/upload`, {
        note: payload.note || undefined,
        documents,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
  });

  return {
    submitSupporterOutputUpload: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}

export function useExternalFeedbackUpload(caseId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: {
      document_type_code: string;
      source: "lecturer" | "mentor" | "other";
      source_other_text?: string;
      timing: "pre_support" | "post_support";
      selected_version_no: number;
      note?: string;
      files: File[];
    }) => {
      const documents = await Promise.all(
        payload.files.map(async (file) => {
          const uploaded = await uploadManagedDocument(file);
          return {
            ...uploaded,
            doc_type: payload.document_type_code,
          };
        }),
      );

      const response = await apiClient.post(`/cases/${caseId}/external-feedback/upload`, {
        document_type_code: payload.document_type_code,
        source: payload.source,
        source_other_text: payload.source_other_text || undefined,
        timing: payload.timing,
        selected_version_no: payload.selected_version_no,
        note: payload.note || undefined,
        documents,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
  });

  return {
    submitExternalFeedbackUpload: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}

export function useStudentDocumentUpload(caseId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: { note?: string; files: File[] }) => {
      const documents = await Promise.all(
        payload.files.map(async (file) => {
          const uploaded = await uploadManagedDocument(file);
          return {
            ...uploaded,
            doc_type: "revision_document",
          };
        }),
      );

      const changeSummary = `Tải lên: ${payload.files.map(f => f.name).join(', ')}`;

      await apiClient.post(`/cases/${caseId}/revisions/upload`, {
        change_summary: changeSummary,
        documents,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
  });

  return {
    submitStudentUpload: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
