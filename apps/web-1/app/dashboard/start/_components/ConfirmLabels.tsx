"use client";

import { useState } from "react";
import { Alert, Stack, Text } from "@mantine/core";
import { Info, Plus } from "@phosphor-icons/react/ssr";
import { AI_UNAVAILABLE } from "../_data/copy";

export type LabelTags = Record<string, "yes" | "no">;

interface ConfirmLabelsProps {
  catalog: ReadonlyArray<{ id: string; label: string }>;
  suggested: string[];
  aiOk: boolean;
  tags: LabelTags;
  onTags: (next: LabelTags) => void;
}

// Two states only: the confirm step requires a decision per suggested label and
// `assetTags` / `ideaTags` have no third value.
const ANSWERS = [
  { id: "yes", label: "Đúng" },
  { id: "no", label: "Không đúng" },
] as const;

/**
 * AI only proposes labels; a label counts only after the user marks it "Đúng".
 */
export function ConfirmLabels({ catalog, suggested, aiOk, tags, onTags }: ConfirmLabelsProps) {
  const [showAll, setShowAll] = useState(!aiOk || suggested.length === 0);
  const shown = showAll ? catalog : catalog.filter((rule) => suggested.includes(rule.id));
  const rest = catalog.filter((rule) => !shown.some((r) => r.id === rule.id));

  return (
    <Stack gap="md">
      {aiOk ? null : (
        <Alert color="orange" variant="light" icon={<Info className="h-4 w-4" />}>
          <Text size="sm">{AI_UNAVAILABLE}</Text>
        </Alert>
      )}
      {aiOk && suggested.length === 0 ? (
        <Text size="sm" c="dimmed">
          Hệ thống chưa nhận diện được đặc điểm nào từ mô tả vừa rồi — bạn có thể chọn thêm bên dưới nếu có, hoặc bấm tiếp tục.
        </Text>
      ) : null}

      <div className="divide-y divide-border-app">
        {shown.map((rule) => (
          <div key={rule.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <Text size="sm" lh={1.45}>
              {rule.label}
            </Text>
            <div role="group" aria-label={rule.label} className="flex shrink-0 gap-1">
              {ANSWERS.map((answer) => {
                const on = tags[rule.id] === answer.id;
                return (
                  <button
                    key={answer.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onTags({ ...tags, [rule.id]: answer.id })}
                    className={[
                      "rounded-[var(--ui-radius-sm)] border px-2.5 py-1 text-xs transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
                      on
                        ? answer.id === "yes"
                          ? "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success-ink)]"
                          : "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)]"
                        : "border-border-app text-text-muted hover:border-border-strong hover:text-text-app",
                    ].join(" ")}
                  >
                    {answer.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!showAll ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-app focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
        >
          <Plus className="h-3.5 w-3.5" /> Có mục khác chưa được nhắc
        </button>
      ) : null}

      {showAll
        ? rest.map((rule) => (
            <button
              type="button"
              key={rule.id}
              onClick={() => onTags({ ...tags, [rule.id]: "yes" })}
              className="flex items-center gap-1.5 text-left text-xs text-text-muted hover:text-text-app focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" /> Thêm: {rule.label}
            </button>
          ))
        : null}
    </Stack>
  );
}
