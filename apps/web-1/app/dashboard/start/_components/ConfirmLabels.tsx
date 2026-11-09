"use client";

import { useState } from "react";
import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { Info, Plus } from "@phosphor-icons/react/ssr";
import { AI_UNAVAILABLE, CONFIRM_LEAD_ASSETS, CONFIRM_LEAD_IDEA } from "../_data/copy";

export type LabelTags = Record<string, "yes" | "no">;

interface ConfirmLabelsProps {
  kind: "assets" | "idea";
  catalog: ReadonlyArray<{ id: string; label: string }>;
  suggested: string[];
  aiOk: boolean;
  tags: LabelTags;
  onTags: (next: LabelTags) => void;
}

/**
 * AI only proposes labels; a label counts only after the user marks it "Đúng".
 * When the model is unavailable the whole catalog is shown, so nobody is stuck.
 */
export function ConfirmLabels({ kind, catalog, suggested, aiOk, tags, onTags }: ConfirmLabelsProps) {
  const [showAll, setShowAll] = useState(!aiOk);
  const shown = showAll ? catalog : catalog.filter((rule) => suggested.includes(rule.id));
  const rest = catalog.filter((rule) => !shown.some((r) => r.id === rule.id));

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed" lh={1.6}>
        {kind === "assets" ? CONFIRM_LEAD_ASSETS : CONFIRM_LEAD_IDEA}
      </Text>
      {aiOk ? null : (
        <Alert color="orange" variant="light" icon={<Info className="h-4 w-4" />}>
          <Text size="sm">{AI_UNAVAILABLE}</Text>
        </Alert>
      )}

      {shown.map((rule) => (
        <Group key={rule.id} justify="space-between" wrap="nowrap" gap="sm" className="rounded-lg border border-gray-100 p-3">
          <Text size="sm" lh={1.5}>
            {rule.label}
          </Text>
          <Group gap={6} wrap="nowrap">
            <Button
              size="compact-sm"
              variant={tags[rule.id] === "yes" ? "filled" : "light"}
              color={tags[rule.id] === "yes" ? "green" : "gray"}
              onClick={() => onTags({ ...tags, [rule.id]: "yes" })}
            >
              Đúng
            </Button>
            <Button
              size="compact-sm"
              variant={tags[rule.id] === "no" ? "filled" : "light"}
              color={tags[rule.id] === "no" ? "red" : "gray"}
              onClick={() => onTags({ ...tags, [rule.id]: "no" })}
            >
              Không đúng
            </Button>
          </Group>
        </Group>
      ))}

      {!showAll ? (
        <Button variant="subtle" size="compact-sm" leftSection={<Plus className="h-4 w-4" />} onClick={() => setShowAll(true)}>
          Có mục khác chưa được nhắc
        </Button>
      ) : null}

      {showAll
        ? rest.map((rule) => (
            <Button key={rule.id} variant="subtle" size="compact-sm" justify="flex-start" onClick={() => onTags({ ...tags, [rule.id]: "yes" })}>
              + Thêm: {rule.label}
            </Button>
          ))
        : null}
    </Stack>
  );
}
