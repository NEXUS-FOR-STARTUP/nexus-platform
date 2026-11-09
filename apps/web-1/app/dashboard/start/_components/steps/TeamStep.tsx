"use client";

import { ActionIcon, Button, Checkbox, Divider, Group, SegmentedControl, Select, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
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

export function TeamStep({ form, patch, error, onBack, onNext }: TeamStepProps) {
  const cap = teamCap(form);
  const update = (index: number, next: Partial<MemberForm>) =>
    patch({ team: form.team.map((m, i) => (i === index ? { ...m, ...next } : m)) });

  return (
    <StepShell title="Nhóm bạn hiện có ai?" why={WHY.team} error={error} onBack={onBack} onNext={onNext}>
      <Stack gap="xl">
        {form.school === "fpt" ? (
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              Quy định của môn: từ {TEAM_RULES.sizeMin} đến {TEAM_RULES.sizeMax} người, ít nhất {TEAM_RULES.majorsMin} ngành. Bạn khai ít hơn vẫn được, phần kết quả sẽ nhắc.
            </Text>
            {form.team.length < TEAM_RULES.sizeMin ? (
              <Text size="xs" c="orange">
                Nhóm đang thiếu {TEAM_RULES.sizeMin - form.team.length} người so với quy định. Cứ đi tiếp, kết quả sẽ gợi ý nên tìm ai.
              </Text>
            ) : null}
          </Stack>
        ) : null}

        {form.team.map((member, index) => (
          <Stack key={index} gap="md">
            {index > 0 ? <Divider /> : null}
            <Group justify="space-between">
              <Text size="sm" fw={600}>
                {member.name.trim() || `Người ${index + 1}`}
              </Text>
              {form.team.length > 1 ? (
                <ActionIcon variant="subtle" color="gray" aria-label={`Xoá người ${index + 1}`} onClick={() => patch({ team: form.team.filter((_, i) => i !== index) })}>
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

            <Stack gap="xs">
              <Text size="sm" fw={600}>
                Bạn này làm được việc nào? Chọn mức độ.
              </Text>
              {CAPS.map((c) => {
                const level = member.caps[c.id as CapCode];
                return (
                  <div key={c.id} className="rounded-lg border border-gray-100 p-3">
                    <Checkbox
                      checked={Boolean(level)}
                      label={c.label}
                      description={c.hint}
                      onChange={(e) => {
                        const next = { ...member.caps };
                        if (e.currentTarget.checked) next[c.id as CapCode] = 2;
                        else delete next[c.id as CapCode];
                        update(index, { caps: next, unsure: false });
                      }}
                    />
                    {level ? (
                      <SegmentedControl
                        mt="xs"
                        size="xs"
                        value={String(level)}
                        onChange={(value) => update(index, { caps: { ...member.caps, [c.id as CapCode]: Number(value) as 1 | 2 | 3 } })}
                        data={LEVELS.map((l) => ({ value: String(l.v), label: l.label }))}
                      />
                    ) : null}
                  </div>
                );
              })}
              <Checkbox
                label="Mình chưa rõ bạn này làm được gì"
                checked={member.unsure}
                onChange={(e) => update(index, { unsure: e.currentTarget.checked, caps: e.currentTarget.checked ? {} : member.caps })}
              />
            </Stack>

            <TextInput label="Còn gì nữa không?" placeholder="Kinh nghiệm, sở thích, điều kiện riêng…" value={member.extra} onChange={(e) => update(index, { extra: e.currentTarget.value })} />
          </Stack>
        ))}

        {form.team.length < cap ? (
          <Button variant="light" leftSection={<Plus className="h-4 w-4" />} onClick={() => patch({ team: [...form.team, { ...EMPTY_MEMBER }] })}>
            Thêm người
          </Button>
        ) : (
          <Text size="xs" c="dimmed">
            Đã đủ {cap} người, mức tối đa của môn.
          </Text>
        )}
      </Stack>
    </StepShell>
  );
}
