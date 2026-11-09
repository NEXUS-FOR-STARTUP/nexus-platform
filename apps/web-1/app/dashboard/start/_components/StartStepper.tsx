"use client";

import { CheckIcon } from "@phosphor-icons/react/ssr";
import { PROGRESS_STEPS, STEPS, type StepId } from "../_hooks/usePreCp1Form";
import { STEP_MINUTES, STEP_NAMES } from "../_data/copy";

interface StartStepperProps {
  step: StepId;
  /** Index into STEPS of the furthest step reached; nothing beyond it is clickable. */
  furthest: number;
  onStep: (step: StepId) => void;
}

/** Vertical list on desktop, one-line progress on phones — the intake flow's stepper. */
export function StartStepper({ step, furthest, onStep }: StartStepperProps) {
  const index = PROGRESS_STEPS.indexOf(step);
  if (index === -1) return null;
  // `furthest` indexes STEPS (which also holds setup and result screens); the list
  // below indexes PROGRESS_STEPS, so translate once instead of comparing two scales.
  const reach = PROGRESS_STEPS.reduce((acc, id, i) => (STEPS.indexOf(id) <= furthest ? i : acc), -1);
  const left = STEP_MINUTES.slice(index).reduce((sum, m) => sum + m, 0);

  return (
    <>
      <nav aria-label="Các bước" className="hidden lg:flex flex-col gap-2 w-full">
        {PROGRESS_STEPS.map((id, i) => {
          const isActive = i === index;
          const isDone = !isActive && i <= reach;
          const canGo = i <= reach;
          return (
            <button
              key={id}
              type="button"
              disabled={!canGo}
              aria-current={isActive ? "step" : undefined}
              onClick={() => onStep(id)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border w-full text-left transition-colors duration-150 ${
                canGo ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" : "cursor-default"
              } ${
                isActive
                  ? "bg-brand text-white border-brand shadow-sm"
                  : isDone
                    ? "bg-brand-soft/20 border-brand/10 text-brand hover:bg-brand-soft/40"
                    : "bg-surface-app border-border-app text-text-subtle opacity-65"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  isActive
                    ? "bg-white text-brand"
                    : isDone
                      ? "bg-brand text-white"
                      : "bg-surface-muted text-text-subtle border border-border-app"
                }`}
              >
                {isDone ? <CheckIcon className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-xs font-heading font-semibold leading-tight block truncate">{STEP_NAMES[i]}</span>
                <span className={`text-[11px] leading-none mt-1 ${isActive ? "text-white/80" : "text-text-muted"}`}>
                  {isActive ? "Đang hỏi" : isDone ? "Đã xong" : "Chưa tới"}
                </span>
              </span>
            </button>
          );
        })}
        <p className="px-1 pt-1 font-body text-xs text-text-muted">
          Còn khoảng {left} phút cho {PROGRESS_STEPS.length - index} câu.
        </p>
      </nav>

      <div className="lg:hidden w-full space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-heading text-sm font-semibold text-text-app">{STEP_NAMES[index]}</span>
          <span className="font-body text-xs text-text-muted tabular-nums">
            Bước {index + 1}/{PROGRESS_STEPS.length} · còn ~{left} phút
          </span>
        </div>
        <nav aria-label="Các bước" className="flex gap-1">
          {PROGRESS_STEPS.map((id, i) => {
            const canGo = i <= reach;
            return (
              <button
                key={id}
                type="button"
                disabled={!canGo}
                aria-label={`${STEP_NAMES[i]}${canGo ? "" : " (chưa tới)"}`}
                aria-current={i === index ? "step" : undefined}
                onClick={() => onStep(id)}
                className="flex-1 py-2 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand rounded"
              >
                <span className={`block h-1 rounded-full ${i <= reach ? "bg-brand" : "bg-border-app"}`} />
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
