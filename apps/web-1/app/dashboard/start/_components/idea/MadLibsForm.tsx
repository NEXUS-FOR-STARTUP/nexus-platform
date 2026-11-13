"use client";

import { Text, Textarea } from "@mantine/core";
import { MAD_LIBS, TEXT_LIMITS } from "@repo/validation";

interface MadLibsFormProps {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

/** Six sentences; short answers are allowed, only the length floor is enforced. */
export function MadLibsForm({ values, onChange }: MadLibsFormProps) {
  return (
    <div className="space-y-4">
      {MAD_LIBS.map((field) => {
        const value = values[field.id] ?? "";
        const short = value.trim().length < field.min;
        return (
          <div key={field.id}>
            <Text size="sm" fw={600} lh={1.5}>
              {field.n}
            </Text>
            <Textarea
              autosize
              minRows={2}
              maxLength={TEXT_LIMITS.madlib}
              mt={6}
              placeholder={field.ph}
              value={value}
              onChange={(e) => onChange(field.id, e.currentTarget.value)}
            />
            <Text size="xs" mt={4} c={short && value ? "orange" : "dimmed"}>
              {short ? `Cần thêm ý, tối thiểu ${field.min} ký tự.` : `${value.trim().length} ký tự`}
            </Text>
          </div>
        );
      })}
    </div>
  );
}
