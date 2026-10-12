import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const guidedAnswersQueryKey = (caseId: string) => ['guided-documents-answers', caseId] as const;

export function useGuidedAnswers(caseId: string) {
  const answersQuery = useQuery({
    queryKey: guidedAnswersQueryKey(caseId),
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseId}/guided-documents/answers`);
      return res.data;
    },
    enabled: !!caseId,
  });

  const answersMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (answersQuery.data?.items) {
      for (const item of answersQuery.data.items) {
        map[item.question_id] = item.answer_text;
      }
    }
    return map;
  }, [answersQuery.data]);

  return { answersMap, isLoading: answersQuery.isLoading, refetch: answersQuery.refetch };
}
