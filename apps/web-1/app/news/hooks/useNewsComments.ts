'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  NewsCommentListResponse,
  NewsCommentItem,
  CreateNewsCommentInput,
  NewsCommentReactionSummary,
  NewsReactionType,
} from '@repo/validation';

export function useNewsComments(idOrSlug: string) {
  const queryClient = useQueryClient();
  const queryKey = ['news-comments', idOrSlug];

  const query = useQuery<NewsCommentListResponse>({
    queryKey,
    queryFn: async () => {
      const res = await apiClient.get<NewsCommentListResponse>(`/news/${idOrSlug}/comments`);
      return res.data;
    },
    enabled: !!idOrSlug,
    staleTime: 10_000,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateNewsCommentInput) => {
      const res = await apiClient.post<NewsCommentItem>(`/news/${idOrSlug}/comments`, input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await apiClient.delete<{ success: boolean }>(`/news/comments/${commentId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({
      commentId,
      type,
    }: {
      commentId: string;
      type: NewsReactionType;
    }) => {
      const res = await apiClient.post<NewsCommentReactionSummary>(
        `/news/comments/${commentId}/reaction`,
        { type }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    comments: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createComment: createMutation.mutateAsync,
    deleteComment: deleteMutation.mutateAsync,
    reactComment: reactMutation.mutateAsync,
  };
}
