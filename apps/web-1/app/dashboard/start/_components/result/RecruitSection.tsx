"use client";

import { useState } from "react";
import { Button, Group, Text } from "@mantine/core";
import { Copy } from "@phosphor-icons/react/ssr";
import { recruitPost, type PreCp1Input, type PreCp1RecruitRole } from "@repo/validation";
import { RECRUIT_NOTE, RESULT } from "../../_data/copy";

export function RecruitSection({ recruit, input }: { recruit: PreCp1RecruitRole[]; input: PreCp1Input }) {
  return (
    <section id="recruit" className="scroll-mt-32 space-y-4">
      <Text fw={700} fz={20}>
        <Text span c="dimmed" fw={500} mr={8}>
          2
        </Text>
        Nên tìm thêm ai
      </Text>

      {recruit.length === 0 ? (
        <Text size="sm" c="dimmed" lh={1.6} style={{ maxWidth: "62ch" }}>
          Không mảng việc nào đang thiếu người theo những gì bạn khai. Nếu nhóm muốn lớn hơn, ưu tiên người làm ra sản phẩm.
        </Text>
      ) : (
        <>
          <Text size="sm" c="dimmed" lh={1.6} style={{ maxWidth: "62ch" }}>
            {RECRUIT_NOTE}
          </Text>
          <div className="space-y-4">
            {recruit.map((role) => (
              <div key={role.id} className="rounded-[var(--ui-radius)] bg-surface-soft p-4">
                <Text size="sm" fw={600} lh={1.4}>
                  {role.title}
                </Text>
                <Text size="sm" c="dimmed" mt={4} lh={1.6}>
                  {role.why}
                </Text>
                <Text size="sm" mt={6} lh={1.6}>
                  <Text span fw={600}>
                    Cần người:{" "}
                  </Text>
                  {role.look}
                </Text>
                <Text size="sm" mt={2} lh={1.6}>
                  <Text span fw={600}>
                    Nên hỏi:{" "}
                  </Text>
                  {role.ask}
                </Text>
                <CopyPost text={recruitPost(input, role)} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function CopyPost({ text }: { text: string }) {
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
    <div className="mt-3 rounded-[var(--ui-radius-sm)] bg-surface-app p-3">
      <Text size="xs" style={{ whiteSpace: "pre-wrap" }} lh={1.6}>
        {text}
      </Text>
      <Group mt="xs" gap="xs">
        <Button size="compact-xs" variant="light" leftSection={<Copy className="h-3.5 w-3.5" />} onClick={copy}>
          {state === "copied" ? RESULT.copied : RESULT.copyPost}
        </Button>
        {state === "failed" ? (
          <Text size="xs" c="orange">
            {RESULT.copyFailed}
          </Text>
        ) : null}
      </Group>
    </div>
  );
}
