import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { isAxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { createSaveQueue, recoveredDraftIds, type Drafts, type SaveQueue } from '@/lib/save-queue';
import { guidedAnswersQueryKey } from './useGuidedAnswers';

/** Quiet time after the last keystroke before the draft is sent to the server. */
const AUTOSAVE_DEBOUNCE_MS = 2000;
/** Waits between retries of a failed save; one entry per retry. */
const SAVE_RETRY_DELAYS_MS = [1000, 3000, 8000];
/** Browsers cap a keepalive request body at 64 KB; stay below it. */
const KEEPALIVE_MAX_BYTES = 60_000;

export type SaveState = 'idle' | 'saving' | 'error';

type CachedAnswers = { items?: Array<{ question_id: string; answer_text: string }> } | undefined;

const storageKey = (caseId: string) => `nexus_guided_drafts:${caseId}`;

function readDrafts(caseId: string): Drafts {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey(caseId));
    return raw ? (JSON.parse(raw) as Drafts) : {};
  } catch {
    // Dữ liệu hỏng hoặc bị chặn: coi như chưa có bản nháp, không chặn người dùng soạn.
    return {};
  }
}

function writeDrafts(caseId: string, drafts: Drafts): void {
  try {
    if (Object.keys(drafts).length === 0) window.localStorage.removeItem(storageKey(caseId));
    else window.localStorage.setItem(storageKey(caseId), JSON.stringify(drafts));
  } catch {
    // Hết dung lượng hoặc bị chặn: bản nháp vẫn còn trong bộ nhớ của phiên làm việc này.
  }
}

/** 4xx means the server rejected the request itself, so retrying the same body cannot help. */
function isRetryable(error: unknown): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return status === undefined || status === 429 || status >= 500;
}

const delay = (ms: number) => {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
};

/** Unsaved drafts plus the actions that edit and persist them; passed as one prop to the editor and stage views. */
export interface GuidedDraftsApi {
  drafts: Record<string, string>;
  saveState: SaveState;
  setDraft: (questionId: string, value: string) => void;
  clearDraft: (questionId: string) => void;
  clearDrafts: (questionIds: readonly string[]) => void;
  /** True when this session edited the draft, so it is saved automatically. */
  isQueued: (questionId: string) => boolean;
  /** Ids of drafts that exist right now (reads live state, not the last render). */
  pendingIds: () => string[];
  /** Ids of drafts restored from an earlier visit and not yet saved or discarded by the user. */
  recoveredIds: () => string[];
  /**
   * Sends every auto-saved draft (plus `extraIds`, an explicit save) and resolves true once the
   * server has them all. Resolves false, after telling the user, on a save failure or while restored
   * drafts are unresolved: the server copy is stale then, so callers (DOCX, sync, grading) must stop.
   */
  flush: (extraIds?: readonly string[]) => Promise<boolean>;
}

/**
 * Bản nháp của từng câu hỏi, tự lưu lên server sau khi ngừng gõ.
 * - Bản nháp nằm ở localStorage nên còn sau khi reload hoặc đóng tab; chỉ bị xoá khi server xác nhận đã lưu.
 * - Chỉ bản nháp do phiên này gõ mới tự lưu. Bản nháp khôi phục từ lần trước được giữ lại để người dùng
 *   quyết định, vì có thể cũ hơn nội dung đã lưu từ thiết bị khác.
 * - Mọi lần lưu đi qua một hàng đợi tuần tự (`createSaveQueue`), nên bản cũ không thể ghi đè bản mới.
 */
export function useGuidedDrafts(caseId: string): GuidedDraftsApi {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Drafts>(() => readDrafts(caseId));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  // The ref is the live source of truth; state only mirrors it for rendering.
  const draftsRef = useRef<Drafts>(drafts);
  const queuedRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const persistingRef = useRef<Promise<void> | null>(null);

  const commit = useCallback(
    (next: Drafts) => {
      draftsRef.current = next;
      writeDrafts(caseId, next);
      setDrafts(next);
    },
    [caseId],
  );

  // Created on first use (event time, never during render). Assumes `caseId` is fixed for the hook's lifetime, as `useState` above already does.
  const queueRef = useRef<SaveQueue | null>(null);
  const getQueue = useCallback(
    () =>
      (queueRef.current ??= createSaveQueue(
        {
          read: () => {
            const due: Drafts = {};
            for (const id of queuedRef.current) if (id in draftsRef.current) due[id] = draftsRef.current[id];
            return due;
          },
          clearIfUnchanged: (sent) => {
            const next = { ...draftsRef.current };
            for (const [id, text] of Object.entries(sent)) {
              if (next[id] === text) {
                delete next[id];
                queuedRef.current.delete(id);
              }
            }
            commit(next);
          },
        },
        async (sent) => {
          const answers = Object.entries(sent).map(([question_id, answer_text]) => ({ question_id, answer_text }));
          await apiClient.put(`/cases/${caseId}/guided-documents/answers`, { answers });
          // Update the cache first so the editor never falls back to the old server text between clear and refetch.
          queryClient.setQueryData<CachedAnswers>(guidedAnswersQueryKey(caseId), (old) => {
            const items = [...(old?.items ?? [])];
            for (const a of answers) {
              const i = items.findIndex((x) => x.question_id === a.question_id);
              if (i >= 0) items[i] = { ...items[i], answer_text: a.answer_text };
              else items.push(a);
            }
            return { ...old, items };
          });
          void queryClient.invalidateQueries({ queryKey: guidedAnswersQueryKey(caseId) });
        },
      )),
    [caseId, commit, queryClient],
  );

  /** Saves with retry on transient failures. Shared, so overlapping callers do not double the retries. */
  const persist = useCallback((): Promise<void> => {
    if (persistingRef.current) return persistingRef.current;
    const run = async () => {
      setSaveState('saving');
      for (let attempt = 0; ; attempt++) {
        try {
          await getQueue().flush();
          setSaveState('idle');
          return;
        } catch (error) {
          if (!isRetryable(error) || attempt >= SAVE_RETRY_DELAYS_MS.length) {
            setSaveState('error');
            throw error;
          }
          await delay(SAVE_RETRY_DELAYS_MS[attempt]);
        }
      }
    };
    const p = run().finally(() => {
      persistingRef.current = null;
    });
    persistingRef.current = p;
    return p;
  }, [getQueue]);

  // Background saves report through `saveState` (shown next to the answer), not through a toast per keystroke.
  const persistInBackground = useCallback(() => {
    persist().catch(() => undefined);
  }, [persist]);


  const setDraft = useCallback(
    (questionId: string, value: string) => {
      queuedRef.current.add(questionId);
      commit({ ...draftsRef.current, [questionId]: value });
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(persistInBackground, AUTOSAVE_DEBOUNCE_MS);
    },
    [commit, persistInBackground],
  );

  const clearDrafts = useCallback(
    (questionIds: readonly string[]) => {
      const next = { ...draftsRef.current };
      let changed = false;
      for (const id of questionIds) {
        queuedRef.current.delete(id);
        if (id in next) {
          delete next[id];
          changed = true;
        }
      }
      if (changed) commit(next);
    },
    [commit],
  );
  const clearDraft = useCallback((questionId: string) => clearDrafts([questionId]), [clearDrafts]);

  const flush = useCallback(
    async (extraIds: readonly string[] = []) => {
      for (const id of extraIds) queuedRef.current.add(id);
      if (recoveredDraftIds(draftsRef.current, queuedRef.current).length > 0) {
        notifications.show({
          title: 'Có bản nháp chưa lưu từ lần trước',
          message: 'Hãy lưu hoặc bỏ các bản nháp đó trong phần Soạn thảo trước khi tiếp tục.',
          color: 'orange',
        });
        return false;
      }
      clearTimeout(timerRef.current);
      try {
        await persist();
        return true;
      } catch (error) {
        notifications.show({
          title: 'Chưa lưu được',
          message: isAxiosError(error) && error.response?.data?.message
            ? String(error.response.data.message)
            : 'Không thể lưu câu trả lời. Kiểm tra kết nối rồi thử lại.',
          color: 'red',
        });
        return false;
      }
    },
    [persist],
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') persistInBackground();
    };
    // Best effort when the tab is closing: a normal request may be cancelled, a keepalive one usually survives.
    const onPageHide = () => {
      if (persistingRef.current) return;
      const answers = [...queuedRef.current]
        .filter((id) => id in draftsRef.current)
        .map((id) => ({ question_id: id, answer_text: draftsRef.current[id] }));
      if (answers.length === 0) return;
      const body = JSON.stringify({ answers });
      if (body.length > KEEPALIVE_MAX_BYTES) return;
      void fetch(`${apiClient.defaults.baseURL}/cases/${caseId}/guided-documents/answers`, {
        method: 'PUT',
        keepalive: true,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).catch(() => undefined); // The draft stays in localStorage and is restored on the next visit.
    };
    const onOnline = () => persistInBackground();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('online', onOnline);
      clearTimeout(timerRef.current);
      persistInBackground(); // Leaving the stage view must not strand text typed in the last 2 seconds.
    };
  }, [caseId, persistInBackground]);

  const isQueued = useCallback((questionId: string) => queuedRef.current.has(questionId), []);
  const pendingIds = useCallback(() => Object.keys(draftsRef.current), []);
  const recoveredIds = useCallback(() => recoveredDraftIds(draftsRef.current, queuedRef.current), []);

  return { drafts, saveState, setDraft, clearDraft, clearDrafts, isQueued, pendingIds, recoveredIds, flush };
}
