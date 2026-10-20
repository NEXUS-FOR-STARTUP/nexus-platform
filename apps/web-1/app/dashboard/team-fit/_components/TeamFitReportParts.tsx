import {
  TEAM_FIT_AREA_STATE_LABELS,
  TEAM_FIT_LEVEL_LABELS,
  type TeamFitAiOutput,
  type TeamFitHandoffItem,
} from "@repo/validation";
import { Accordion, Badge, List, Paper, SimpleGrid, Text } from "@mantine/core";

const ACCORDION_CLASSES = { item: "border border-border-app" };

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text size="md" fw={700} mb="sm">
      {children}
    </Text>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text fz={28} fw={700} lh={1.1}>
        {value}
      </Text>
      <Text size="sm" c="dimmed" mt={4}>
        {label}
      </Text>
    </Paper>
  );
}

export function AreaList({ areas }: { areas: TeamFitAiOutput["areas"] }) {
  return (
    <Accordion variant="separated" radius="md" classNames={ACCORDION_CLASSES} multiple>
      {areas.map((area) => (
        <Accordion.Item key={area.ten} value={area.ten}>
          <Accordion.Control>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge size="sm" variant="light" color={area.trangThai === "yeu" ? "red" : "green"}>
                {TEAM_FIT_AREA_STATE_LABELS[area.trangThai]}
              </Badge>
              <Text size="sm" fw={600}>
                {area.ten}
              </Text>
              <Text size="sm" c="dimmed">
                {TEAM_FIT_LEVEL_LABELS[area.mucDo]}
              </Text>
            </div>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" lh={1.6}>
              {area.lyDo}
            </Text>
            <Text size="sm" c="dimmed" lh={1.6} mt="xs">
              Dẫn chứng: {area.danChung}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

export function GapDetails({ ai }: { ai: TeamFitAiOutput }) {
  const missingRoles = ai.industryRoles.filter((role) => role.conThieu);
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
      <section>
        <SectionTitle>Vai trò còn thiếu</SectionTitle>
        {missingRoles.length > 0 ? (
          <div className="space-y-3">
            {missingRoles.map((role) => (
              <div key={role.vaiTro}>
                <Text size="sm" fw={600}>
                  {role.vaiTro}
                </Text>
                <Text size="sm" c="dimmed" lh={1.6}>
                  {role.lyDo}
                </Text>
              </div>
            ))}
          </div>
        ) : (
          <Text size="sm" c="dimmed">
            Không thiếu vai trò cốt lõi nào.
          </Text>
        )}
      </section>
      <section>
        <SectionTitle>Hội đồng có thể hỏi</SectionTitle>
        <List type="ordered" spacing="xs" size="sm">
          {ai.committeeQuestions.map((question) => (
            <List.Item key={question}>{question}</List.Item>
          ))}
        </List>
      </section>
    </SimpleGrid>
  );
}

export function HandoffList({ handoff }: { handoff: TeamFitHandoffItem[] }) {
  return (
    <Accordion variant="separated" radius="md" classNames={ACCORDION_CLASSES}>
      {handoff.map((item) => (
        <Accordion.Item key={item.cauHoi} value={item.cauHoi}>
          <Accordion.Control>
            <Text size="sm" fw={600}>
              {item.cauHoi}
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed" lh={1.6}>
              Cần nộp: {item.canNopGi}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
