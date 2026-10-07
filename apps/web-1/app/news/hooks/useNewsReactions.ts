'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { NewsReactionSummary, NewsReactionType } from '@repo/validation';

export function useNewsReactions(idOrSlug: string) {
  const queryClient = useQueryClient();
  const queryKey = ['news-reactions', idOrSlug];

  const query = useQuery<NewsReactionSummary>({
    queryKey,
    queryFn: async () => {
      const res = await apiClient.get<NewsReactionSummary>(`/news/${idOrSlug}/reactions`);
      return res.data;
    },
    enabled: !!idOrSlug,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (type: NewsReactionType) => {
      const res = await apiClient.post<NewsReactionSummary>(`/news/${idOrSlug}/reactions`, { type });
      return res.data;
    },
    onMutate: async (newType: NewsReactionType) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NewsReactionSummary>(queryKey);

      if (previous) {
        let nextLikes = previous.likes;
        let nextDislikes = previous.dislikes;

        if (previous.user_reaction === null) {
          if (newType === 'LIKE') nextLikes += 1;
          else nextDislikes += 1;
        } else if (previous.user_reaction !== newType) {
          if (newType === 'LIKE') {
            nextLikes += 1;
            nextDislikes = Math.max(0, nextDislikes - 1);
          } else {
            nextDislikes += 1;
            nextLikes = Math.max(0, nextLikes - 1);
          }
        }
        // If previous.user_reaction === newType, no change (no-undo rule)

        queryClient.setQueryData<NewsReactionSummary>(queryKey, {
          likes: nextLikes,
          dislikes: nextDislikes,
          user_reaction: newType,
        });
      }

      return { previous };
    },
    onError: (_err, _newType, context) => {
      if (context?.previous) {
        queryClient.setQueryData<NewsReactionSummary>(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    summary: query.data ?? { likes: 0, dislikes: 0, user_reaction: null },
    isLoading: query.isLoading,
    isPending: mutation.isPending,
    toggleReaction: (type: NewsReactionType) => mutation.mutate(type),
  };
}
