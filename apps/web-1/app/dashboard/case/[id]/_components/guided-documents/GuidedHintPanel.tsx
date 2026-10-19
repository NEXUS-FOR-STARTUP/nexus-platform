"use client";

import { useState, type ReactNode } from "react";
import { Anchor, Collapse, UnstyledButton } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { BookOpen, CaretDown as ChevronDown, ArrowSquareOut as ExternalLink, ListChecks } from "@phosphor-icons/react";
import type { Question } from "@repo/validation";
import { GUIDED_MOBILE_QUERY } from "../../hooks/useGuidedNavigation";
import editor from "./guided-editor.module.css";
import s from "./guided-hint-panel.module.css";

interface GuidedHintPanelProps {
  /** Catalog entry of the active question; the parent re-keys the panel per question. */
  question: Question | undefined;
}

function HintSection({ icon, tone, title, children }: { icon: ReactNode; tone: string; title: string; children: ReactNode }) {
  return (
    <div className={s.section}>
      <h4 className={s.sectionTitle}>
        <span className={`${s.badge} ${tone}`}>{icon}</span>
        {title}
      </h4>
      {children}
    </div>
  );
}

export default function GuidedHintPanel({ question }: GuidedHintPanelProps) {
  const isMobile = useMediaQuery(GUIDED_MOBILE_QUERY);
  // null = follow the viewport default (open on desktop, collapsed on phones); boolean = user's choice.
  const [openedOverride, setOpenedOverride] = useState<boolean | null>(null);
  const opened = openedOverride ?? !isMobile;

  const actions = question?.suggested_actions ?? [];
  const readings = question?.further_reading ?? [];
  const explanation = question?.explanation;
  if (!explanation && actions.length === 0 && readings.length === 0) return null;

  return (
    <div className={`${editor.panel} ${s.panel}`}>
      <UnstyledButton className={editor.foldHead} onClick={() => setOpenedOverride(!opened)} aria-expanded={opened}>
        <span className={editor.foldTitle}>
          <ChevronDown size={16} className={`${editor.chevron} ${opened ? "" : editor.chevronClosed}`} aria-hidden />
          Gợi ý cho câu này
        </span>
      </UnstyledButton>

      <Collapse expanded={opened}>
        <div className={s.body}>
          {explanation && <p className={s.lead}>{explanation}</p>}
          {actions.length > 0 && (
            <HintSection icon={<ListChecks size={16} aria-hidden />} tone={s.success} title="Tự kiểm tra trước khi lưu">
              <ul className={s.items}>
                {actions.map((act) => (
                  <li key={act}>{act}</li>
                ))}
              </ul>
            </HintSection>
          )}
          {readings.length > 0 && (
            <HintSection icon={<BookOpen size={16} aria-hidden />} tone={s.violet} title="Đọc thêm">
              <ul className={s.items}>
                {readings.map((link) => (
                  <li key={link.url}>
                    <Anchor href={link.url} target="_blank" rel="noopener noreferrer" size="sm" className={s.link}>
                      {link.title}
                      <ExternalLink size={14} aria-hidden />
                    </Anchor>
                  </li>
                ))}
              </ul>
            </HintSection>
          )}
        </div>
      </Collapse>
    </div>
  );
}
