"use client";

import { useEffect, useRef } from "react";
import { DownloadSimpleIcon, DotsThreeIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import type { TemplateKey } from "@repo/validation";
import { useGuidedDocuments } from "../../../hooks/useGuidedDocuments";
import s from "./stage-actions-menu.module.css";

interface StageActionsMenuProps {
  caseId: string;
  templateKey: TemplateKey;
  /** Unsaved draft question ids, so sync never overwrites what the user is typing. */
  draftQuestionIds: string[];
}

export default function StageActionsMenu({ caseId, templateKey, draftQuestionIds }: StageActionsMenuProps) {
  const { syncAnswers, generateDocx, isSyncing, isGenerating } = useGuidedDocuments(caseId, templateKey);
  const ref = useRef<HTMLDetailsElement>(null);

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
    <details ref={ref} className={s.menu}>
      <summary aria-label="Thêm">
        <DotsThreeIcon size={18} aria-hidden />
      </summary>
      <div className={s.pop} role="menu">
        <button type="button" role="menuitem" disabled={isSyncing} onClick={run(() => syncAnswers(draftQuestionIds))}>
          <ArrowsClockwiseIcon size={16} aria-hidden />
          Đồng bộ thông tin
        </button>
        <button type="button" role="menuitem" disabled={isGenerating} onClick={run(() => generateDocx())}>
          <DownloadSimpleIcon size={16} aria-hidden />
          Xuất file DOCX
        </button>
      </div>
    </details>
  );
}
