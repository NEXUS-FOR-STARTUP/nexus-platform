"use client";

import { Badge, SimpleGrid, Stack, Text } from "@mantine/core";
import type { PreCp1Input, PreCp1Report } from "@repo/validation";

export function TeamSection({ report, input }: { report: PreCp1Report; input: PreCp1Input }) {
  const names = input.team.map((m, i) => m.name?.trim() || `Người ${i + 1}`);
  return (
    <section id="team" className="scroll-mt-32 space-y-4">
      <Text fw={700} fz={20}>
        <Text span c="dimmed" fw={500} mr={8}>
          1
        </Text>
        Nhóm bạn đang có gì
      </Text>

      <SimpleGrid cols={{ base: 3, xs: 3 }} spacing="sm">
        <Stat value={String(report.teamRule.size)} label="người trong nhóm" />
        <Stat value={String(report.teamRule.majors)} label="ngành khác nhau" />
        <Stat value={`${report.coverage.roles.filter((r) => r.members.length > 0).length}/3`} label="mảng việc có người" />
      </SimpleGrid>

      {report.teamRule.fpt ? (
        <Stack gap={4}>
          {!report.teamRule.sizeOk ? (
            <Text size="sm" c="orange" lh={1.6}>
              Nhóm chưa đúng quy định về số người ({report.teamRule.sizeMin}–{report.teamRule.sizeMax}). Kết quả bên dưới vẫn tính theo số người thật.
            </Text>
          ) : null}
          {!report.teamRule.majorsOk && report.teamRule.exe ? (
            <Text size="sm" c="orange" lh={1.6}>
              Nhóm mới có {report.teamRule.majors} ngành, quy định môn cần ít nhất {report.teamRule.majorsMin}.
            </Text>
          ) : null}
        </Stack>
      ) : null}

      <div className="divide-y divide-border-app border-t border-border-app">
        {report.coverage.roles.map((role) => (
          <div key={role.id} className="flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <Text size="sm" fw={600} lh={1.4}>
                {role.label}
              </Text>
              <Text size="xs" c="dimmed" mt={2} lh={1.5}>
                {role.need}
              </Text>
            </div>
            <Badge variant="light" color={role.members.length ? "green" : "red"} radius="sm" className="shrink-0">
              {role.members.length ? role.members.map((i) => names[i]).join(", ") : "chưa có ai"}
            </Badge>
          </div>
        ))}
      </div>

      {report.coverage.overload.length ? (
        <Text size="sm" c="orange" lh={1.6}>
          {report.coverage.overload
            .map((o) => `${names[o.i]} đang phải gánh ${o.roles.length} mảng việc cùng lúc`)
            .join("; ")}
          . Nhóm khó giữ nhịp lâu dài.
        </Text>
      ) : null}
      {report.coverage.empty.length === 0 && report.coverage.single.length === 0 ? (
        <Text size="sm" c="dimmed" lh={1.6}>
          Không mảng việc nào bị trống, và cũng không ai phải làm một mình.
        </Text>
      ) : null}
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[var(--ui-radius)] bg-surface-soft px-3 py-2.5">
      <Text fz={{ base: 22, sm: 26 }} fw={600} lh={1.1} className="tabular-nums" style={{ letterSpacing: "-0.02em" }}>
        {value}
      </Text>
      <Text size="xs" c="dimmed" mt={2} lh={1.35}>
        {label}
      </Text>
    </div>
  );
}
