"use client";

import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@mantine/core";
import { DownloadSimpleIcon, DotsThreeIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import type { TemplateKey } from "@repo/validation";
import { useGuidedDocuments } from "../../../hooks/useGuidedDocuments";
import { useSyncPending } from "../../../hooks/useSyncPending";
import s from "./stage-actions-menu.module.css";

const SYNC_TOOLTIP =
  "Tự điền các câu còn trống bằng thông tin đã lưu: câu trả lời ở các vòng trước (cùng nội dung câu hỏi), cùng ý tưởng và đội nhóm bạn đã khai. Câu đã có nội dung hoặc đang gõ dở được giữ nguyên.";
const DOCX_TOOLTIP =
  "Tạo và tải về file DOCX từ các câu trả lời đã lưu của bước này. Câu chưa lưu sẽ không có trong file.";

interface StageActionsMenuProps {
  caseId: string;
  templateKey: TemplateKey;
  /** Unsaved draft question ids, so sync never overwrites what the user is typing. */
  draftQuestionIds: string[];
}

export default function StageActionsMenu({ caseId, templateKey, draftQuestionIds }: StageActionsMenuProps) {
  const { syncAnswers, generateDocx, isSyncing, isGenerating } = useGuidedDocuments(caseId, templateKey);
  const pending = useSyncPending(caseId, templateKey);
  // The first stage has no earlier answers to carry over; the hint is only for later stages.
  const hasHint = pending > 0 && templateKey !== "cp1";
  const ref = useRef<HTMLDetailsElement>(null);

  // The trigger dot is a one-time hint: opening the menu once dismisses it for this case + stage.
  const seenKey = `nexus:sync-hint-seen:${caseId}:${templateKey}`;
  const [seen, setSeen] = useState(true);
  useEffect(() => setSeen(localStorage.getItem(seenKey) === "1"), [seenKey]);
  const markSeen = () => {
    localStorage.setItem(seenKey, "1");
    setSeen(true);
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

  const run = (action: () => void) => () => {
    if (ref.current) ref.current.open = false;
    action();
  };

  return (
    <details ref={ref} className={s.menu} onToggle={(e) => e.currentTarget.open && hasHint && markSeen()}>
      <summary aria-label="Thêm">
        <DotsThreeIcon size={18} aria-hidden />
        {hasHint && !seen && <span className={s.dot} aria-label="Có thể đồng bộ thông tin" />}
      </summary>
      <div className={s.pop} role="menu">
        <Tooltip label={SYNC_TOOLTIP} position="left" multiline maw={280} withArrow>
          <button type="button" role="menuitem" disabled={isSyncing} onClick={run(() => syncAnswers(draftQuestionIds))}>
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
