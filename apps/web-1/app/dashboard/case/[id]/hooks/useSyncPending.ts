import { useQuery } from '@tanstack/react-query';
import type { TemplateKey } from '@repo/validation';
import { apiClient } from '@/lib/api-client';
import { guidedAnswersQueryKey } from './useGuidedAnswers';

// Prefixed by the answers key so every save/sync invalidation also refreshes this count.
// shortcut: reuses the full sync proposal endpoint just to count; add a count-only route if payloads grow.
export function useSyncPending(caseId: string, templateKey: TemplateKey): number {
  const { data } = useQuery({
    queryKey: [...guidedAnswersQueryKey(caseId), 'sync-pending', templateKey],
    queryFn: async () => {
      const res = await apiClient.get<{ proposals: unknown[] }>(`/cases/${caseId}/guided-documents/sync`, {
        params: { templateKey },
      });
      return res.data.proposals.length;
    },
    enabled: !!caseId,
  });
  return data ?? 0;
}
