"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Tooltip } from "@mantine/core";
import { DownloadSimpleIcon, DotsThreeIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import type { TemplateKey } from "@repo/validation";
import { useGuidedDocuments } from "../../../hooks/useGuidedDocuments";
import type { GuidedDraftsApi } from "../../../hooks/useGuidedDrafts";
import { useSyncPending } from "../../../hooks/useSyncPending";
import s from "./stage-actions-menu.module.css";

const SYNC_TOOLTIP = "Điền các câu còn trống từ thông tin bạn đã lưu trước đó. Câu đã có nội dung được giữ nguyên.";
const DOCX_TOOLTIP = "Lưu câu trả lời rồi tải về file DOCX.";

const SEEN_EVENT = "nexus:sync-hint-seen";

function subscribeSeen(onChange: () => void) {
  window.addEventListener(SEEN_EVENT, onChange);
  return () => window.removeEventListener(SEEN_EVENT, onChange);
}

interface StageActionsMenuProps {
  caseId: string;
  templateKey: TemplateKey;
  /** Same drafts the editor edits: flushed before any action, and skipped by sync so typing is never overwritten. */
  draftsApi: GuidedDraftsApi;
}

export default function StageActionsMenu({ caseId, templateKey, draftsApi }: StageActionsMenuProps) {
  const { syncAnswers, generateDocx, isSyncing, isGenerating } = useGuidedDocuments(caseId, templateKey);
  const pending = useSyncPending(caseId, templateKey);
  // The first stage has no earlier answers to carry over; the hint is only for later stages.
  const hasHint = pending > 0 && templateKey !== "cp1";
  const ref = useRef<HTMLDetailsElement>(null);

  // The trigger dot is a one-time hint: opening the menu once dismisses it for this case + stage.
  const seenKey = `nexus:sync-hint-seen:${caseId}:${templateKey}`;
  const seen = useSyncExternalStore(subscribeSeen, () => localStorage.getItem(seenKey) === "1", () => true);
  const markSeen = () => {
    localStorage.setItem(seenKey, "1");
    window.dispatchEvent(new Event(SEEN_EVENT));
  };

  // A native <details> stays open on outside click/Escape, so close it the way a menu should.
  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  // Answers are saved first: sync and DOCX read the server copy, which would otherwise be stale.
  const run = (action: () => void) => async () => {
    if (ref.current) ref.current.open = false;
    if (await draftsApi.flush()) action();
  };

  return (
    <details ref={ref} className={s.menu} onToggle={(e) => e.currentTarget.open && hasHint && markSeen()}>
      <summary aria-label="Thêm">
        <DotsThreeIcon size={18} aria-hidden />
        {hasHint && !seen && <span className={s.dot} aria-label="Có thể đồng bộ thông tin" />}
      </summary>
      <div className={s.pop} role="menu">
        <Tooltip label={SYNC_TOOLTIP} position="left" multiline maw={280} withArrow>
          <button type="button" role="menuitem" disabled={isSyncing} onClick={run(() => syncAnswers(draftsApi.pendingIds()))}>
            <ArrowsClockwiseIcon size={16} aria-hidden />
            Đồng bộ thông tin
            {hasHint && <span className={`${s.dot} ${s.itemDot}`} aria-label="Có câu trả lời để đồng bộ" />}
          </button>
        </Tooltip>
        <Tooltip label={DOCX_TOOLTIP} position="left" multiline maw={280} withArrow>
          <button type="button" role="menuitem" disabled={isGenerating} onClick={run(() => generateDocx())}>
            <DownloadSimpleIcon size={16} aria-hidden />
            Xuất file DOCX
          </button>
        </Tooltip>
      </div>
    </details>
  );
}
