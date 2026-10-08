import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { notifications } from '@mantine/notifications';
import { cp1, cp2, type Template } from '@repo/validation';

export function useGuidedDocuments(caseId: string) {
  const queryClient = useQueryClient();
  const [templateKey, setTemplateKey] = useState<'cp1' | 'cp2'>('cp1');
  const template: Template = templateKey === 'cp2' ? cp2 : cp1;

  // 1. Fetch saved answers
  const answersQuery = useQuery({
    queryKey: ['guided-documents-answers', caseId],
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

  // 2. Save mutation (batch upsert)
  const saveMutation = useMutation({
    mutationFn: async (answers: Array<{ question_id: string; answer_text: string }>) => {
      const res = await apiClient.put(`/cases/${caseId}/guided-documents/answers`, { answers });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guided-documents-answers', caseId] });
      notifications.show({
        title: 'Đã lưu',
        message: 'Nội dung câu trả lời đã được lưu thành công.',
        color: 'teal',
      });
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Lỗi khi lưu',
        message: err?.response?.data?.message || 'Không thể lưu câu trả lời.',
        color: 'red',
      });
    },
  });

  // 3. Import proposal mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post(`/cases/${caseId}/guided-documents/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
  });

  // 4. Generate DOCX mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/cases/${caseId}/guided-documents/generate`, {
        templateKey,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      notifications.show({
        title: 'Tạo tài liệu thành công',
        message: 'Đã xuất file DOCX và lưu vào danh sách tài liệu của hồ sơ.',
        color: 'teal',
      });
      if (data?.document?.file_url && typeof data.document.file_url === 'string') {
        const link = document.createElement('a');
        link.href = data.document.file_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Lỗi khi xuất tài liệu',
        message: err?.response?.data?.message || 'Không thể xuất file DOCX.',
        color: 'red',
      });
    },
  });

  // 5. Question-level 1-way lock calculation
  const isQuestionUnlocked = useCallback(
    (currentPhaseIndex: number, currentQuestionIndex: number): boolean => {
      const targetPhase = template.phases[currentPhaseIndex];
      if (!targetPhase) return true;
      const targetQuestion = targetPhase.questions[currentQuestionIndex];
      if (!targetQuestion) return true;

      // Check explicit unlock_requires if defined
      if (targetQuestion.unlock_requires && targetQuestion.unlock_requires.length > 0) {
        return targetQuestion.unlock_requires.every((reqId) => {
          const ans = answersMap[reqId];
          return typeof ans === 'string' && ans.trim().length > 0;
        });
      }

      // Check phase unlock_requires if first question of phase
      if (currentQuestionIndex === 0 && targetPhase.unlock_requires && targetPhase.unlock_requires.length > 0) {
        return targetPhase.unlock_requires.every((reqId) => {
          const ans = answersMap[reqId];
          return typeof ans === 'string' && ans.trim().length > 0;
        });
      }

      // Default 1-way forward: If preceding required question in same phase is answered
      if (currentQuestionIndex > 0) {
        const prevQ = targetPhase.questions[currentQuestionIndex - 1];
        if (prevQ && prevQ.classification === 'required') {
          const prevAns = answersMap[prevQ.question_id];
          return typeof prevAns === 'string' && prevAns.trim().length > 0;
        }
      }

      return true;
    },
    [template, answersMap],
  );

  return {
    templateKey,
    setTemplateKey,
    template,
    answersMap,
    isLoading: answersQuery.isLoading,
    isSaving: saveMutation.isPending,
    isImporting: importMutation.isPending,
    isGenerating: generateMutation.isPending,
    saveAnswers: saveMutation.mutateAsync,
    importFile: importMutation.mutateAsync,
    generateDocx: generateMutation.mutateAsync,
    isQuestionUnlocked,
    refetch: answersQuery.refetch,
  };
}
