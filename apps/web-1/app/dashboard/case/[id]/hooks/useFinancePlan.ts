import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiClient } from '@/lib/api-client';
import type { FinancePlan } from '@repo/validation';

const financePlanQueryKey = (caseId: string) => ['finance-plan', caseId] as const;

export function useFinancePlan(caseId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: financePlanQueryKey(caseId),
    queryFn: async (): Promise<FinancePlan | null> => {
      const res = await apiClient.get<{ plan: FinancePlan | null }>(`/cases/${caseId}/finance`);
      return res.data.plan;
    },
    enabled: !!caseId,
  });

  const saveMutation = useMutation({
    mutationFn: async (plan: FinancePlan) => {
      await apiClient.put(`/cases/${caseId}/finance`, plan);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: financePlanQueryKey(caseId) });
      notifications.show({ title: 'Đã lưu', message: 'Bảng tài chính đã được lưu.', color: 'teal' });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      notifications.show({
        title: 'Lỗi khi lưu',
        message: err?.response?.data?.message || 'Không thể lưu bảng tài chính.',
        color: 'red',
      });
    },
  });

  return {
    plan: query.data ?? null,
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
    savePlan: saveMutation.mutateAsync,
  };
}
