"use client";

import { ActionIcon, Checkbox, Divider, Group, Select, SimpleGrid, Stack, Text, TextInput, UnstyledButton } from "@mantine/core";
import { Plus, Trash as Trash2 } from "@phosphor-icons/react/ssr";
import { ASKED_MAJORS, CAPS, LEVELS, MAJORS, TEAM_RULES, TRACKS, type MajorLabel, type RoleTrackCode, type CapCode } from "@repo/validation";
import { StepShell } from "../StepShell";
import { WHY } from "../../_data/copy";
import { EMPTY_MEMBER, teamCap, type MemberForm, type StartForm } from "../../_hooks/usePreCp1Form";

interface TeamStepProps {
  form: StartForm;
  patch: (next: Partial<StartForm>) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
}

/** Nine capabilities as nine rows of three buttons, instead of nine bordered boxes. */
function CapRow({
  label,
  hint,
  level,
  onPick,
}: {
  label: string;
  hint: unknown;
  level: number | undefined;
  onPick: (next: 1 | 2 | 3 | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border-app py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <Text size="sm" fw={500} lh={1.35}>
          {label}
        </Text>
        {hint ? (
          <Text size="xs" c="dimmed" lh={1.4}>
            {String(hint)}
          </Text>
        ) : null}
      </div>
      <div role="group" aria-label={label} className="flex shrink-0 gap-1">
        {LEVELS.map((l) => {
          const on = level === l.v;
          return (
            <button
              key={l.v}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(on ? null : (l.v as 1 | 2 | 3))}
              className={[
                "rounded-[var(--ui-radius-sm)] border px-2.5 py-1 text-xs transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
                on
                  ? "border-brand bg-brand text-white"
                  : "border-border-app text-text-muted hover:border-brand-mid hover:text-text-app",
              ].join(" ")}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TeamStep({ form, patch, error, onBack, onNext }: TeamStepProps) {
  const cap = teamCap(form);
  const update = (index: number, next: Partial<MemberForm>) =>
    patch({ team: form.team.map((m, i) => (i === index ? { ...m, ...next } : m)) });

  return (
    <StepShell title="Nhóm bạn hiện có ai?" why={WHY.team} error={error} onBack={onBack} onNext={onNext}>
      <Stack gap="xl">
        {form.school === "fpt" ? (
          <Text size="xs" c="dimmed" lh={1.5}>
            Quy định của môn: {TEAM_RULES.sizeMin}–{TEAM_RULES.sizeMax} người, ít nhất {TEAM_RULES.majorsMin} ngành.
            {form.team.length < TEAM_RULES.sizeMin
              ? ` Đang thiếu ${TEAM_RULES.sizeMin - form.team.length} người — cứ đi tiếp, phần kết quả sẽ gợi ý nên tìm ai.`
              : ""}
          </Text>
        ) : null}

        {form.team.map((member, index) => (
          <div key={index} className="space-y-3">
            {index > 0 ? <Divider /> : null}

            <Group justify="space-between">
              <Text size="sm" fw={600}>
                {member.name.trim() || `Người ${index + 1}`}
              </Text>
              {form.team.length > 1 ? (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label={`Xoá người ${index + 1}`}
                  onClick={() => patch({ team: form.team.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="h-4 w-4" />
                </ActionIcon>
              ) : null}
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput label="Tên gọi" placeholder="Để trống cũng được" value={member.name} onChange={(e) => update(index, { name: e.currentTarget.value })} />
              <Select
                label="Học ngành gì?"
                placeholder="Chọn ngành"
                data={[...MAJORS]}
                value={member.major || null}
                onChange={(value) => update(index, { major: (value as MajorLabel | null) ?? "", majorOther: "", roleTrackHint: "" })}
              />
            </SimpleGrid>

            {member.major && ASKED_MAJORS.includes(member.major) ? (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <TextInput label="Ghi tên ngành" placeholder="Ví dụ: Ngôn ngữ Anh" value={member.majorOther} onChange={(e) => update(index, { majorOther: e.currentTarget.value })} />
                <Select
                  label="Phần việc thiên về đâu?"
                  placeholder="Chọn phần việc"
                  data={TRACKS.map((t) => ({ value: t.id, label: t.label }))}
                  value={member.roleTrackHint || null}
                  onChange={(value) => update(index, { roleTrackHint: (value as RoleTrackCode | null) ?? "" })}
                />
              </SimpleGrid>
            ) : null}

            <div>
              <Text size="sm" fw={600} lh={1.4}>
                Bạn này làm được việc nào?
              </Text>
              <Text size="xs" c="dimmed" mb={4}>
                Bấm mức độ; bấm lại để bỏ.
              </Text>
              <div>
                {CAPS.map((c) => (
                  <CapRow
                    key={c.id}
                    label={c.label}
                    hint={c.hint}
                    level={member.caps[c.id as CapCode]}
                    onPick={(nextLevel) => {
                      const next = { ...member.caps };
                      if (nextLevel) next[c.id as CapCode] = nextLevel;
                      else delete next[c.id as CapCode];
                      update(index, { caps: next, unsure: false });
                    }}
                  />
                ))}
              </div>
              <Checkbox
                mt="xs"
                label="Mình chưa rõ bạn này làm được gì"
                checked={member.unsure}
                onChange={(e) => update(index, { unsure: e.currentTarget.checked, caps: e.currentTarget.checked ? {} : member.caps })}
              />
            </div>

            <TextInput label="Còn gì nữa không?" placeholder="Kinh nghiệm, sở thích, điều kiện riêng…" value={member.extra} onChange={(e) => update(index, { extra: e.currentTarget.value })} />
          </div>
        ))}

        {form.team.length < cap ? (
          <UnstyledButton
            onClick={() => patch({ team: [...form.team, { ...EMPTY_MEMBER }] })}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--ui-radius)] border border-dashed border-border-strong py-3 text-sm text-text-muted transition-colors hover:border-brand-mid hover:text-text-app focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
          >
            <Plus className="h-4 w-4" /> Thêm người
          </UnstyledButton>
        ) : (
          <Text size="xs" c="dimmed">
            Đã đủ {cap} người, mức tối đa của môn.
          </Text>
        )}
      </Stack>
    </StepShell>
  );
}
