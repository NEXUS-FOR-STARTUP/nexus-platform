import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useAdminDocuments() {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery<any[]>({
    queryKey: ["admin-documents"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/documents");
      return response.data;
    },
    refetchInterval: 10000,
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiClient.delete(`/admin/documents/${documentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
    },
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    isDeleting: deleteDocumentMutation.isPending,
  };
}
