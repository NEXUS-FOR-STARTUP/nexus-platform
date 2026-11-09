"use client";

import { Stack, Text } from "@mantine/core";
import { INTERVIEW_QUESTIONS, type PreCp1Zone } from "@repo/validation";
import { INTERVIEW_LEAD, RESULT } from "../../_data/copy";

export function ZonesSection({ zones }: { zones: PreCp1Zone[] }) {
  return (
    <section id="zones" className="space-y-4">
      <Text fw={700} fz={20}>
        4. Hướng để đi hỏi thử
      </Text>
      {zones.length === 0 ? (
        <Text size="sm" c="dimmed" lh={1.6}>
          {RESULT.zonesEmpty}
        </Text>
      ) : (
        <Stack gap="sm">
          {zones.map((zone) => (
            <div key={`${zone.tag}-${zone.title}`} className="rounded-xl border border-gray-100 p-4">
              <Text size="sm" fw={600} lh={1.5}>
                {zone.title}
              </Text>
              <Text size="sm" mt={6} lh={1.7}>
                {zone.prose}
              </Text>
            </div>
          ))}
        </Stack>
      )}

      <div className="rounded-xl border border-gray-100 p-4">
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
