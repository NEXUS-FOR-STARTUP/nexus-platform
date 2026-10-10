import { useCallback, useState } from 'react';

type Drafts = Record<string, string>;

const storageKey = (caseId: string) => `nexus_guided_drafts:${caseId}`;

function readDrafts(caseId: string): Drafts {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(storageKey(caseId));
    return raw ? (JSON.parse(raw) as Drafts) : {};
  } catch {
    // Dữ liệu hỏng hoặc bị chặn: coi như chưa có bản nháp, không chặn người dùng soạn.
    return {};
  }
}

function writeDrafts(caseId: string, drafts: Drafts): void {
  try {
    window.sessionStorage.setItem(storageKey(caseId), JSON.stringify(drafts));
  } catch {
    // Hết dung lượng hoặc bị chặn: bản nháp vẫn còn trong bộ nhớ của phiên làm việc này.
  }
}

/**
 * Bản nháp chưa lưu của từng câu hỏi. Nằm ở sessionStorage nên sống qua việc đổi câu,
 * đổi tab, reload; mất khi đóng tab.
 */
export function useGuidedDrafts(caseId: string) {
  const [drafts, setDrafts] = useState<Drafts>(() => readDrafts(caseId));

  const setDraft = useCallback(
    (questionId: string, value: string) => {
      setDrafts((prev) => {
        const next = { ...prev, [questionId]: value };
        writeDrafts(caseId, next);
        return next;
      });
    },
    [caseId],
  );

  const clearDraft = useCallback(
    (questionId: string) => {
      setDrafts((prev) => {
        if (!(questionId in prev)) return prev;
        const rest = { ...prev };
        delete rest[questionId];
        writeDrafts(caseId, rest);
        return rest;
      });
    },
    [caseId],
  );

  return { drafts, setDraft, clearDraft };
}
