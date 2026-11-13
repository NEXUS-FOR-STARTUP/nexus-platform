"use client";

import { SENSITIVE } from "@repo/validation";
import { StepShell } from "../StepShell";
import { WHY } from "../../_data/copy";
import type { StartForm } from "../../_hooks/usePreCp1Form";

interface SensStepProps {
  form: StartForm;
  patch: (next: Partial<StartForm>) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
  busy: boolean;
}

export function SensStep({ form, patch, error, onBack, onNext, busy }: SensStepProps) {
  const toggle = (id: (typeof SENSITIVE)[number]["id"]) => {
    const withoutNone = form.sensitive.filter((s) => s !== "none");
    if (id === "none") {
      patch({ sensitive: form.sensitive.includes("none") ? [] : ["none"] });
      return;
    }
    patch({ sensitive: form.sensitive.includes(id) ? form.sensitive.filter((s) => s !== id) : [...withoutNone, id] });
  };

  return (
    <StepShell title="Ý tưởng của bạn có liên quan đến lĩnh vực nào dưới đây không?" why={WHY.sensitive} error={error} onBack={onBack} onNext={onNext} busy={busy} nextLabel="Bắt đầu phân tích">
      <div className="flex flex-wrap gap-2">
        {SENSITIVE.map((item) => {
          const on = form.sensitive.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(item.id)}
              className={[
                "min-h-11 flex items-center rounded-lg border px-3 py-2 font-body text-sm leading-snug transition-colors duration-150 cursor-pointer",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                on
                  ? "border-brand bg-brand text-white font-semibold"
                  : "border-border-strong bg-surface-app text-text-app hover:border-brand/50",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
