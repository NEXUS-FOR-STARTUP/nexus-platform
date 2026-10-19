"use client";

import { useState, type ReactNode } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { BookOpenIcon, CaretDownIcon, CheckCircleIcon, LightbulbIcon, ListBulletsIcon } from "@phosphor-icons/react";
import type { Question } from "@repo/validation";
import { GUIDED_MOBILE_QUERY } from "../../hooks/useGuidedNavigation";
import { parseHint } from "./parse-hint";
import s from "./guided-hint-panel.module.css";

interface GuidedHintPanelProps {
  /** Catalog entry of the active question; the parent re-keys the panel per question. */
  question: Question | undefined;
}

type Tone = "need" | "example" | "check" | "read";

function HintSection({ icon, tone, title, children }: { icon: ReactNode; tone: Tone; title: string; children: ReactNode }) {
  return (
    <div className={s.section}>
      <h4 className={`${s.sectionTitle} ${s[tone]}`}>
        <span className={s.badge}>{icon}</span>
        {title}
      </h4>
      {children}
    </div>
  );
}

const Bullets = ({ items }: { items: string[] }) => (
  <ul className={s.bullets}>
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

export default function GuidedHintPanel({ question }: GuidedHintPanelProps) {
  const isMobile = useMediaQuery(GUIDED_MOBILE_QUERY);
  // null = follow the viewport default (open on desktop, collapsed on phones); boolean = user's choice.
  const [openedOverride, setOpenedOverride] = useState<boolean | null>(null);
  const opened = openedOverride ?? !isMobile;

  const actions = question?.suggested_actions ?? [];
  const readings = question?.further_reading ?? [];
  const hint = parseHint(question?.explanation ?? "");
  const hasExamples = Boolean(hint.bad || hint.good);
  if (!question?.explanation && actions.length === 0 && readings.length === 0) return null;

  return (
    <aside className={s.panel} aria-label="Gợi ý">
      <button type="button" className={s.fold} onClick={() => setOpenedOverride(!opened)} aria-expanded={opened}>
        <span className={s.foldTitle}>Gợi ý cho câu này</span>
        <CaretDownIcon size={16} className={`${s.chevron} ${opened ? s.chevronOpen : ""}`} aria-hidden />
      </button>

      {opened && (
        <div className={s.body}>
          <h3 className={s.title}>Gợi ý cho câu này</h3>
          {hint.lead && <p className={s.lead}>{hint.lead}</p>}
          {hint.need.length > 0 && (
            <HintSection icon={<ListBulletsIcon size={16} aria-hidden />} tone="need" title="Cần nêu">
              <Bullets items={hint.need} />
            </HintSection>
          )}
          {hasExamples ? (
            <HintSection icon={<LightbulbIcon size={16} aria-hidden />} tone="example" title="Ví dụ">
              {hint.bad && (
                <div className={s.ex}>
                  <span className={`${s.chip} ${s.chipWarn}`}>Chưa tốt</span>
                  {hint.bad}
                </div>
              )}
              {hint.good && (
                <div className={s.ex}>
                  <span className={`${s.chip} ${s.chipOk}`}>Tốt</span>
                  {hint.good}
                </div>
              )}
            </HintSection>
          ) : (
            hint.example && (
              <HintSection icon={<LightbulbIcon size={16} aria-hidden />} tone="example" title="Ví dụ">
                <div className={s.ex}>{hint.example}</div>
              </HintSection>
            )
          )}
          {actions.length > 0 && (
            <HintSection icon={<CheckCircleIcon size={16} aria-hidden />} tone="check" title="Tự kiểm tra trước khi lưu">
              <Bullets items={actions} />
            </HintSection>
          )}
          {readings.length > 0 && (
            <HintSection icon={<BookOpenIcon size={16} aria-hidden />} tone="read" title="Đọc thêm">
              {readings.map((link) => (
                <p key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.title}
                  </a>
                </p>
              ))}
            </HintSection>
          )}
          {hint.notes.length > 0 && (
            <details className={s.more}>
              <summary>
                Xem thêm lưu ý
                <CaretDownIcon size={16} className={s.moreIcon} aria-hidden />
              </summary>
              {hint.notes.map((n) => (
                <p key={n}>{n}</p>
              ))}
            </details>
          )}
        </div>
      )}
    </aside>
  );
}
