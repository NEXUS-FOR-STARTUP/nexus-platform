"use client";

import { CheckIcon } from "@phosphor-icons/react/ssr";
import { PROGRESS_STEPS, STEPS, type StepId } from "../_hooks/usePreCp1Form";
import { STEP_NAMES } from "../_data/copy";

interface StartStepperProps {
  step: StepId;
  /** Index into STEPS of the furthest step reached; nothing beyond it is clickable. */
  furthest: number;
  onStep: (step: StepId) => void;
}

/** One circle per step joined by a hairline — the intake flow's stepper. */
export function StartStepper({ step, furthest, onStep }: StartStepperProps) {
  const index = PROGRESS_STEPS.indexOf(step);
  if (index === -1) return null;
  // `furthest` indexes STEPS (which also holds setup and result screens); the list
  // below indexes PROGRESS_STEPS, so translate once instead of comparing two scales.
  const reach = PROGRESS_STEPS.reduce((acc, id, i) => (STEPS.indexOf(id) <= furthest ? i : acc), -1);

  return (
    <nav aria-label="Các bước" className="w-full">
      {/* Phones have no room for seven names, so the current one is spelled out here. */}
      <div className="mb-3 flex items-baseline justify-between gap-3 lg:justify-end">
        <span className="font-heading text-[15px] font-semibold text-text-app lg:hidden">{STEP_NAMES[index]}</span>
        <span className="font-body text-sm text-text-muted tabular-nums">
          Bước {index + 1}/{PROGRESS_STEPS.length}
        </span>
      </div>

      <ol className="flex items-start">
        {PROGRESS_STEPS.map((id, i) => {
          const isActive = i === index;
          const isDone = !isActive && i <= reach;
          const canGo = i <= reach;
          return (
            <li key={id} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span
                  className={`h-px flex-1 ${i === 0 ? "invisible" : i <= reach ? "bg-brand/40" : "bg-border-app"}`}
                  aria-hidden
                />
                <button
                  type="button"
                  disabled={!canGo}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${STEP_NAMES[i]}${isActive ? " (đang hỏi)" : isDone ? " (đã xong)" : canGo ? "" : " (chưa tới)"}`}
                  onClick={() => onStep(id)}
                  className={`mx-2 grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    canGo ? "cursor-pointer" : "cursor-default"
                  } ${
                    isActive
                      ? "bg-brand text-white ring-[3px] ring-brand/20"
                      : isDone
                        ? "bg-brand/20 text-brand hover:bg-brand/30"
                        : "border border-border-app text-text-subtle opacity-70"
                  }`}
                >
                  {isDone ? <CheckIcon className="h-4 w-4 stroke-[3]" /> : i + 1}
                </button>
                <span
                  className={`h-px flex-1 ${i === PROGRESS_STEPS.length - 1 ? "invisible" : i < reach ? "bg-brand/40" : "bg-border-app"}`}
                  aria-hidden
                />
              </div>
              <span
                className={`mt-2 hidden max-w-[7.5rem] text-center text-sm leading-snug lg:block ${
                  isActive ? "font-semibold text-text-app" : "text-text-muted"
                }`}
              >
                {STEP_NAMES[i]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
