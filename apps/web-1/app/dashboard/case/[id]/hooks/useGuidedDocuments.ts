import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { notifications } from '@mantine/notifications';
import { TEMPLATE_REGISTRY, type Template, type TemplateKey } from '@repo/validation';
import { useGuidedAnswers, guidedAnswersQueryKey } from './useGuidedAnswers';

export function useGuidedDocuments(caseId: string, templateKey: TemplateKey) {
  const queryClient = useQueryClient();
  const template: Template = TEMPLATE_REGISTRY[templateKey];
  const { answersMap, isLoading, refetch } = useGuidedAnswers(caseId);

  // 2. Save mutation (batch upsert)
  const saveMutation = useMutation({
    mutationFn: async (answers: Array<{ question_id: string; answer_text: string }>) => {
      const res = await apiClient.put(`/cases/${caseId}/guided-documents/answers`, { answers });
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: guidedAnswersQueryKey(caseId) });
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

  // Đồng bộ: server đề xuất nội dung từ dữ liệu đã lưu chính thức; chỉ điền câu còn trống.
  // `skipQuestionIds` là các câu người dùng đang gõ dở (bản nháp) để không đè lên.
  const syncMutation = useMutation({
    mutationFn: async (skipQuestionIds: string[]) => {
      const res = await apiClient.get<{
        proposals: Array<{ question_id: string; answer_text: string }>;
        skipped_filled: number;
      }>(`/cases/${caseId}/guided-documents/sync`, { params: { templateKey } });
      const skip = new Set(skipQuestionIds);
      const usable = res.data.proposals.filter((p) => !skip.has(p.question_id));
      if (usable.length > 0) {
        await apiClient.put(`/cases/${caseId}/guided-documents/answers`, { answers: usable });
        await queryClient.invalidateQueries({ queryKey: guidedAnswersQueryKey(caseId) });
      }
      return {
        filled: usable.length,
        kept: res.data.skipped_filled + (res.data.proposals.length - usable.length),
      };
    },
    onSuccess: ({ filled, kept }) => {
      const keptNote = kept > 0 ? ` Giữ nguyên ${kept} câu đã có nội dung.` : '';
      notifications.show({
        title: filled > 0 ? 'Đã đồng bộ' : 'Không có gì để đồng bộ',
        message:
          filled > 0
            ? `Đã điền ${filled} câu từ thông tin đã lưu.${keptNote}`
            : `Chưa có thông tin mới để điền vào các câu còn trống.${keptNote}`,
        color: filled > 0 ? 'teal' : 'blue',
      });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      notifications.show({
        title: 'Lỗi khi đồng bộ',
        message: err?.response?.data?.message || 'Không thể đồng bộ thông tin.',
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
      const downloadTarget = data?.document?.download_url || data?.document?.file_url;
      if (downloadTarget && typeof downloadTarget === 'string') {
        const targetFilename =
          data.document.canonical_name ||
          data.document.original_name ||
          'tai_lieu_huong_dan.docx';
        const finalName = targetFilename.endsWith('.docx') ? targetFilename : `${targetFilename}.docx`;

        const link = document.createElement('a');
        link.href = downloadTarget;
        link.download = finalName;
        // Never set target = '_blank'. The attachment header triggers direct file download in the current window without opening tabs.
        document.body.append(link);
        link.click();
        link.remove();
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
    template,
    answersMap,
    isLoading,
    isSaving: saveMutation.isPending,
    isImporting: importMutation.isPending,
    isGenerating: generateMutation.isPending,
    isSyncing: syncMutation.isPending,
    saveAnswers: saveMutation.mutateAsync,
    syncAnswers: syncMutation.mutateAsync,
    importFile: importMutation.mutateAsync,
    generateDocx: generateMutation.mutateAsync,
    isQuestionUnlocked,
    refetch,
  };
}
