"use client";

import { useState } from "react";
import { Button, Group, Stack, Text } from "@mantine/core";
import { Copy } from "@phosphor-icons/react/ssr";
import { recruitPost, type PreCp1Input, type PreCp1RecruitRole } from "@repo/validation";
import { RECRUIT_NOTE, RESULT } from "../../_data/copy";

export function RecruitSection({ recruit, input }: { recruit: PreCp1RecruitRole[]; input: PreCp1Input }) {
  return (
    <section id="recruit" className="space-y-4">
      <Text fw={700} fz={20}>
        2. Nên tìm thêm ai
      </Text>
      {recruit.length === 0 ? (
        <Text size="sm" c="dimmed" lh={1.6}>
          Không mảng việc nào đang thiếu người theo những gì bạn khai. Nếu nhóm muốn lớn hơn, ưu tiên người làm ra sản phẩm.
        </Text>
      ) : (
        <>
          <Text size="sm" c="dimmed" lh={1.6}>
            {RECRUIT_NOTE}
          </Text>
          <Stack gap="sm">
            {recruit.map((role, index) => (
              <div key={role.id} className="rounded-xl border border-gray-100 p-4">
                <Text size="sm" fw={600}>
                  {index + 1}. {role.title}
                </Text>
                <Text size="sm" c="dimmed" mt={6} lh={1.6}>
                  {role.why}
                </Text>
                <Text size="sm" mt={6} lh={1.6}>
                  <Text span fw={600}>Cần người: </Text>
                  {role.look}
                </Text>
                <Text size="sm" mt={2} lh={1.6}>
                  <Text span fw={600}>Nên hỏi: </Text>
                  {role.ask}
                </Text>
                <CopyPost text={recruitPost(input, role)} />
              </div>
            ))}
          </Stack>
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
    <div className="mt-3 rounded-lg bg-gray-50 p-3">
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
