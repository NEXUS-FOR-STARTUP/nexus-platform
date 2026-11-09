"use client";

import { Text } from "@mantine/core";
import { INTERVIEW_QUESTIONS, type PreCp1Zone } from "@repo/validation";
import { INTERVIEW_LEAD, RESULT } from "../../_data/copy";

export function ZonesSection({ zones }: { zones: PreCp1Zone[] }) {
  return (
    <section id="zones" className="scroll-mt-32 space-y-4">
      <Text fw={700} fz={20}>
        <Text span c="dimmed" fw={500} mr={8}>
          4
        </Text>
        Hướng để đi hỏi thử
      </Text>

      {zones.length === 0 ? (
        <Text size="sm" c="dimmed" lh={1.6} style={{ maxWidth: "62ch" }}>
          {RESULT.zonesEmpty}
        </Text>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => (
            <div key={`${zone.tag}-${zone.title}`} className="rounded-[var(--ui-radius)] bg-surface-soft p-4">
              <Text size="sm" fw={600} lh={1.45}>
                {zone.title}
              </Text>
              <Text size="sm" mt={4} lh={1.7} style={{ maxWidth: "62ch" }}>
                {zone.prose}
              </Text>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[var(--ui-radius)] bg-surface-soft p-4">
        <Text size="sm" fw={600}>
          Năm câu để hỏi người thật
        </Text>
        <Text size="xs" c="dimmed" mt={4} lh={1.6}>
          {INTERVIEW_LEAD}
        </Text>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {INTERVIEW_QUESTIONS.map((question) => (
            <li key={question} className="text-sm leading-relaxed">
              {question}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
