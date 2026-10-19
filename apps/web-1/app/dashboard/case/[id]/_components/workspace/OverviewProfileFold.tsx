"use client";

import { Accordion, Button, Group, Text } from "@mantine/core";
import type { Case, TeamFitReport } from "@/types";
import CaseOverviewPanel from "../CaseOverviewPanel";
import { countMissingProfileFields, deriveOverviewData } from "../overview/caseOverviewData";
import s from "./overview.module.css";

interface OverviewProfileFoldProps {
  caseData: Case;
  intakeSnapshot: unknown;
  teamFitReport?: TeamFitReport | null;
  onOpenSettings: () => void;
}

export default function OverviewProfileFold({
  caseData,
  intakeSnapshot,
  teamFitReport,
  onOpenSettings,
}: OverviewProfileFoldProps) {
  const missing = countMissingProfileFields(deriveOverviewData(caseData, intakeSnapshot, teamFitReport));

  return (
    <Accordion variant="separated" radius="md">
      <Accordion.Item value="profile">
        <Accordion.Control>
          <span className={s.sectionTitle}>Hồ sơ dự án</span>
        </Accordion.Control>
        <Accordion.Panel>
          {missing > 0 && (
            <Group gap="xs" mb="md">
              <Text className={s.body}>Còn thiếu {missing} thông tin</Text>
              <Button variant="subtle" size="sm" onClick={onOpenSettings}>
                Bổ sung
              </Button>
            </Group>
          )}
          <CaseOverviewPanel embedded caseData={caseData} intakeSnapshot={intakeSnapshot} teamFitReport={teamFitReport} />
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
