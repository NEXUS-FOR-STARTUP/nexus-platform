"use client";

import { ActionIcon, Alert, Checkbox, Select, SimpleGrid, Text, TextInput } from "@mantine/core";
import { Plus, Trash as Trash2 } from "@phosphor-icons/react/ssr";
import { ASKED_MAJORS, CAPS, LEVELS, MAJORS, TEAM_RULES, TEXT_LIMITS, TRACKS, type MajorLabel, type RoleTrackCode, type CapCode } from "@repo/validation";
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

/** Three levels of one chosen capability, drawn as one joined track. */
function LevelSeg({
  label,
  level,
  onPick,
}: {
  label: string;
  level: number;
  onPick: (next: 1 | 2 | 3) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex w-full sm:w-auto shrink-0 overflow-hidden rounded-lg border border-border-strong bg-surface-app"
    >
      {LEVELS.map((l) => {
        const on = level === l.v;
        return (
          <button
            key={l.v}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(l.v as 1 | 2 | 3)}
            className={[
              "flex-1 sm:flex-none whitespace-nowrap min-h-9 border-l border-border-strong px-2 sm:px-3 first:border-l-0 font-body text-xs transition-colors duration-150 cursor-pointer",
              "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
              on ? "bg-brand text-white font-semibold" : "text-text-app hover:bg-surface-muted",
            ].join(" ")}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

export function TeamStep({ form, patch, error, onBack, onNext }: TeamStepProps) {
  const cap = teamCap(form);
  const update = (index: number, next: Partial<MemberForm>) =>
    patch({ team: form.team.map((m, i) => (i === index ? { ...m, ...next } : m)) });

  return (
    <StepShell title="Nhóm bạn hiện có ai?" why={WHY.team} error={error} onBack={onBack} onNext={onNext}>
      <div className="space-y-4">
        {form.school === "fpt" ? (
          <Alert variant="light" color="brand" radius="md" className="font-body text-sm leading-relaxed">
            Quy định của môn: {TEAM_RULES.sizeMin}–{TEAM_RULES.sizeMax} người, ít nhất {TEAM_RULES.majorsMin} ngành.
            {form.team.length < TEAM_RULES.sizeMin
              ? ` Đang thiếu ${TEAM_RULES.sizeMin - form.team.length} người — cứ đi tiếp, phần kết quả sẽ gợi ý nên tìm ai.`
              : ""}
          </Alert>
        ) : null}

        {form.team.map((member, index) => {
          const chosen = CAPS.filter((c) => member.caps[c.id as CapCode]);
          return (
            <section
              key={index}
              aria-label={member.name.trim() || `Người ${index + 1}`}
              className="bg-surface-soft border border-border-app rounded-xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-text-app truncate">
                    {member.name.trim() || `Người ${index + 1}`}
                  </p>
                  <p className="font-body text-xs text-text-muted truncate">{member.major || "chưa chọn ngành"}</p>
                </div>
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
              </div>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <TextInput
                  label="Tên gọi"
                  placeholder="Để trống cũng được"
                  maxLength={TEXT_LIMITS.name}
                  value={member.name}
                  onChange={(e) => update(index, { name: e.currentTarget.value })}
                />
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
                  <TextInput
                    label="Ghi tên ngành"
                    placeholder="Ví dụ: Ngôn ngữ Anh"
                    maxLength={TEXT_LIMITS.majorOther}
                    value={member.majorOther}
                    onChange={(e) => update(index, { majorOther: e.currentTarget.value })}
                  />
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
                <p className="font-heading text-sm font-semibold text-text-app">Bạn này làm được việc nào?</p>
                <p className="font-body text-xs text-text-muted mt-0.5">Chọn những việc bạn này làm được; chọn lại để bỏ.</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CAPS.map((c) => {
                    const on = !!member.caps[c.id as CapCode];
                    return (
                      <button
                        type="button"
                        key={c.id}
                        aria-pressed={on}
                        onClick={() => {
                          const next = { ...member.caps };
                          if (on) delete next[c.id as CapCode];
                          else next[c.id as CapCode] = 2;
                          update(index, { caps: next, unsure: false });
                        }}
                        className={[
                          "min-h-11 flex items-center rounded-lg border px-3 py-2 text-left font-body text-sm leading-snug transition-colors duration-150 cursor-pointer",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                          on
                            ? "border-brand bg-brand text-white font-semibold"
                            : "border-border-strong bg-surface-app text-text-app hover:border-brand/50",
                        ].join(" ")}
                      >
                        <span className="min-w-0">
                          {on ? "✓ " : ""}
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {chosen.length ? (
                  <div className="mt-3 rounded-lg border border-border-strong bg-surface-app p-3">
                    <p className="font-body text-xs text-text-muted">Mỗi việc đã chọn, bạn ở mức nào?</p>
                    <div className="mt-2 space-y-2">
                      {chosen.map((c) => (
                        <div key={c.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <p className="min-w-0 font-body text-sm text-text-app leading-snug">{c.label}</p>
                          <LevelSeg
                            label={c.label}
                            level={member.caps[c.id as CapCode] ?? 2}
                            onPick={(nextLevel) => update(index, { caps: { ...member.caps, [c.id as CapCode]: nextLevel }, unsure: false })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <Checkbox
                  mt="sm"
                  label="Mình chưa rõ bạn này làm được gì"
                  checked={member.unsure}
                  onChange={(e) =>
                    update(index, { unsure: e.currentTarget.checked, caps: e.currentTarget.checked ? {} : member.caps })
                  }
                />
              </div>

              <TextInput
                label="Còn gì nữa không?"
                placeholder="Kinh nghiệm, sở thích, điều kiện riêng…"
                maxLength={TEXT_LIMITS.extra}
                value={member.extra}
                onChange={(e) => update(index, { extra: e.currentTarget.value })}
              />
            </section>
          );
        })}

        {form.team.length < cap ? (
          <button
            type="button"
            onClick={() => patch({ team: [...form.team, { ...EMPTY_MEMBER }] })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong py-3 font-body text-sm text-text-muted cursor-pointer transition-colors hover:border-brand/40 hover:text-text-app focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Plus className="h-4 w-4" /> Thêm người
          </button>
        ) : (
          <Text size="xs" c="dimmed">
            Đã đủ {cap} người, mức tối đa của môn.
          </Text>
        )}
      </div>
    </StepShell>
  );
}
