"use client";

import { Badge, SimpleGrid, Stack, Text } from "@mantine/core";
import type { PreCp1Input, PreCp1Report } from "@repo/validation";
import { SectionHead } from "./SectionHead";

export function TeamSection({ report, input }: { report: PreCp1Report; input: PreCp1Input }) {
  const names = input.team.map((m, i) => m.name?.trim() || `Người ${i + 1}`);
  const covered = report.coverage.roles.filter((r) => r.members.length > 0).length;

  return (
    <section id="team" className="scroll-mt-24 space-y-6">
      <SectionHead title="Nhóm bạn đang có gì" note="Đếm theo số người bạn khai, kèm quy định của môn nếu có." />

      <div className="space-y-4 rounded-[var(--ui-radius)] border-[1.5px] border-border-app bg-surface-app p-4 sm:p-5">
        <SimpleGrid cols={3} spacing="sm">
          <Stat value={String(report.teamRule.size)} label="người trong nhóm" />
          <Stat value={String(report.teamRule.majors)} label="ngành khác nhau" />
          <Stat value={`${covered}/3`} label="mảng việc có người" />
        </SimpleGrid>

        {report.teamRule.fpt && (!report.teamRule.sizeOk || (!report.teamRule.majorsOk && report.teamRule.exe)) ? (
          <Stack gap={6} className="rounded-[var(--ui-radius)] p-4" style={{ background: "var(--color-warning-soft)" }}>
            {!report.teamRule.sizeOk ? (
              <Text fz="var(--ui-text-note)" lh={1.6} style={{ color: "var(--color-warning-ink)" }}>
                Nhóm chưa đúng quy định về số người ({report.teamRule.sizeMin}–{report.teamRule.sizeMax}). Kết quả bên dưới vẫn tính theo số người thật.
              </Text>
            ) : null}
            {!report.teamRule.majorsOk && report.teamRule.exe ? (
              <Text fz="var(--ui-text-note)" lh={1.6} style={{ color: "var(--color-warning-ink)" }}>
                Nhóm mới có {report.teamRule.majors} ngành, quy định môn cần ít nhất {report.teamRule.majorsMin}.
              </Text>
            ) : null}
          </Stack>
        ) : null}

        <ul className="space-y-4 border-t border-border-app pt-4">
          {report.coverage.roles.map((role) => (
            <li key={role.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <Text fz="var(--ui-text-body)" fw={600} lh={1.4}>
                  {role.label}
                </Text>
                <Text fz="var(--ui-text-note)" c="dimmed" lh={1.55}>
                  {role.need}
                </Text>
              </div>
              <Badge variant="light" color={role.members.length ? "green" : "red"} radius="var(--ui-radius-sm)" className="shrink-0 self-start">
                {role.members.length ? role.members.map((i) => names[i]).join(", ") : "chưa có ai"}
              </Badge>
            </li>
          ))}
        </ul>

        {report.coverage.overload.length ? (
          <Text fz="var(--ui-text-note)" lh={1.6} style={{ color: "var(--color-warning-ink)" }}>
            {report.coverage.overload
              .map((o) => `${names[o.i]} đang phải gánh ${o.roles.length} mảng việc cùng lúc`)
              .join("; ")}
            . Nhóm khó giữ nhịp lâu dài.
          </Text>
        ) : null}
        {report.coverage.empty.length === 0 && report.coverage.single.length === 0 ? (
          <Text fz="var(--ui-text-note)" c="dimmed" lh={1.55}>
            Không mảng việc nào bị trống, và cũng không ai phải làm một mình.
          </Text>
        ) : null}
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[var(--ui-radius)] bg-surface-soft px-4 py-3">
      <Text fz={{ base: 26, sm: 36 }} fw={600} lh={1} className="tabular-nums" style={{ letterSpacing: "-0.03em" }}>
        {value}
      </Text>
      <Text fz="var(--ui-text-note)" c="dimmed" mt={6} lh={1.4}>
        {label}
      </Text>
    </div>
  );
}
