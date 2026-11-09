"use client";

import type { ReactNode } from "react";
import { Button } from "@mantine/core";
import { Warning as AlertTriangle } from "@phosphor-icons/react/ssr";
import { InfoTip } from "./InfoTip";
import styles from "./StepShell.module.css";

interface StepShellProps {
  title: string;
  why: string;
  /** Longer background for the step, kept out of the way in the same tooltip. */
  lead?: string;
  children: ReactNode;
  error?: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  busy?: boolean;
}

/** One question per screen. Explanations live in the tooltip; the card keeps only the question. */
export function StepShell({ title, why, lead, children, error, onBack, onNext, nextLabel = "Tiếp", busy }: StepShellProps) {
  return (
    <div className="bg-surface-app border border-border-app rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex items-start gap-1.5">
        <h2 className="font-heading text-lg sm:text-xl font-semibold text-text-app leading-snug">{title}</h2>
        <InfoTip
          width={320}
          title={title}
          label={
            <div className="space-y-1.5 leading-relaxed">
              <p className="font-body text-xs">{why}</p>
              {lead ? <p className="font-body text-xs opacity-80">{lead}</p> : null}
            </div>
          }
        />
      </div>

      <div className={styles.fields}>{children}</div>

      <div className="pt-6 border-t border-border-app space-y-3">
        {error ? (
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-danger" />
            <p className="font-body text-sm leading-relaxed text-danger">{error}</p>
          </div>
        ) : null}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          {onBack ? (
            <Button
              onClick={onBack}
              disabled={busy}
              variant="default"
              className="w-full sm:w-auto font-body font-semibold cursor-pointer h-10 sm:h-9 px-4 text-xs text-text-muted hover:text-text-app rounded-xl"
            >
              Quay lại
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          {onNext ? (
            <Button
              onClick={onNext}
              loading={busy}
              color="brand"
              className="w-full sm:w-auto font-body font-semibold cursor-pointer h-10 sm:h-9 px-4 text-xs rounded-xl"
            >
              {nextLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
