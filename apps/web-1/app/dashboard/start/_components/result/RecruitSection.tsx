"use client";

import { useState } from "react";
import { Button, Group, Text } from "@mantine/core";
import { Copy } from "@phosphor-icons/react/ssr";
import { recruitPost, type PreCp1Input, type PreCp1RecruitRole } from "@repo/validation";
import { RECRUIT_NOTE, RESULT } from "../../_data/copy";
import { Disclosure } from "./Disclosure";
import { SectionHead } from "./SectionHead";

export function RecruitSection({ recruit, input }: { recruit: PreCp1RecruitRole[]; input: PreCp1Input }) {
  return (
    <section id="recruit" className="scroll-mt-24 space-y-5">
      <SectionHead
        title="Nên tìm thêm ai"
        note={
          recruit.length === 0
            ? "Không mảng việc nào đang thiếu người theo những gì bạn khai. Nếu nhóm muốn lớn hơn, ưu tiên người làm ra sản phẩm."
            : RECRUIT_NOTE
        }
      />

      {recruit.length === 0 ? null : (
        <div className="space-y-4">
          {recruit.map((role) => (
            <div key={role.id} className="rounded-[var(--ui-radius)] border-[1.5px] border-border-app bg-surface-app p-4 sm:p-5">
              <Text fz="var(--ui-text-section)" fw={600} lh={1.35} style={{ letterSpacing: "-0.01em" }}>
                {role.title}
              </Text>
              <Text fz="var(--ui-text-note)" c="dimmed" mt={6} lh={1.55}>
                {role.why}
              </Text>

              <div className="mt-4 space-y-3">
                <div>
                  <Text fz="var(--ui-text-note)" c="dimmed" fw={600} lh={1.4}>
                    Cần người
                  </Text>
                  <Text fz="var(--ui-text-body)" mt={1} lh={1.55}>
                    {role.look}
                  </Text>
                </div>
                <div>
                  <Text fz="var(--ui-text-note)" c="dimmed" fw={600} lh={1.4}>
                    Nên hỏi
                  </Text>
                  <Text fz="var(--ui-text-body)" mt={1} lh={1.55}>
                    {role.ask}
                  </Text>
                </div>
              </div>

              <Disclosure label={RESULT.postHint} note={RESULT.postHintNote}>
                <div className="rounded-[var(--ui-radius)] bg-surface-soft p-3">
                  <Text fz="var(--ui-text-note)" style={{ whiteSpace: "pre-wrap" }} lh={1.6}>
                    {recruitPost(input, role)}
                  </Text>
                  <CopyButton text={recruitPost(input, role)} />
                </div>
              </Disclosure>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
  };
  return (
    <Group mt="xs" gap="xs">
      <Button size="compact-xs" variant="light" leftSection={<Copy className="h-3.5 w-3.5" />} onClick={copy}>
        {state === "copied" ? RESULT.copied : RESULT.copyPost}
      </Button>
      {state === "failed" ? (
        <Text fz="var(--ui-text-note)" c="orange">
          {RESULT.copyFailed}
        </Text>
      ) : null}
    </Group>
  );
}
