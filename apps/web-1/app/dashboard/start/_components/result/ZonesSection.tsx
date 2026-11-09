"use client";

import { Text } from "@mantine/core";
import { INTERVIEW_QUESTIONS, type PreCp1Zone } from "@repo/validation";
import { INTERVIEW_LEAD, RESULT } from "../../_data/copy";
import { Disclosure } from "./Disclosure";
import { SectionHead } from "./SectionHead";

export function ZonesSection({ zones }: { zones: PreCp1Zone[] }) {
  return (
    <section id="zones" className="scroll-mt-24 space-y-5">
      <SectionHead
        title="Hướng để đi hỏi thử"
        note={zones.length === 0 ? RESULT.zonesEmpty : "Không phải ý tưởng cụ thể, chỉ là nơi nên đi hỏi trước khi chốt."}
      />

      {zones.length === 0 ? null : (
        <div className="space-y-2">
          {zones.map((zone) => (
            <div key={`${zone.tag}-${zone.title}`} className="rounded-[var(--ui-radius)] border-[1.5px] border-border-app bg-surface-app px-4 py-2">
              <Disclosure label={zone.title}>
                <Text fz="var(--ui-text-body)" lh={1.65} style={{ maxWidth: "62ch" }}>
                  {zone.prose}
                </Text>
              </Disclosure>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[var(--ui-radius)] border-[1.5px] border-border-app bg-surface-soft p-4 sm:p-5">
        <Text fz="var(--ui-text-section)" fw={600} lh={1.35} style={{ letterSpacing: "-0.01em" }}>
          Năm câu để hỏi người thật
        </Text>
        <Text fz="var(--ui-text-note)" c="dimmed" mt={6} lh={1.55}>
          {INTERVIEW_LEAD}
        </Text>
        <ol className="mt-4 list-decimal space-y-2.5 pl-5">
          {INTERVIEW_QUESTIONS.map((question) => (
            <li key={question} className="text-base leading-relaxed">
              {question}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
