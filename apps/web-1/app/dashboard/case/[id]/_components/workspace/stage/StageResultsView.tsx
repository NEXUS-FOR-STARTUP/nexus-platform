"use client";

import { useMemo, useState } from "react";
import { Accordion, Button, Paper, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { FileText as FileCheck } from "@phosphor-icons/react";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import type { RoundHistoryEntry } from "@/types";
import { formatDateShort } from "../../report.utils";
import ResultPdfViewer, { ResultPdfActions } from "./ResultPdfViewer";
import ResultRunList from "./ResultRunList";
import { toResultRuns } from "./result-runs";
import styles from "./result-runs.module.css";

interface StageResultsViewProps {
  caseId: string;
  summary?: StageSummary;
  roundHistory?: RoundHistoryEntry[] | null;
  checkpointId?: string;
  projectName?: string;
  caseCode?: string;
  onGoDraft?: () => void;
  onGoFiles?: () => void;
  onAudit?: () => void;
}

export default function StageResultsView({
  caseId,
  summary,
  roundHistory,
  checkpointId,
  projectName,
  onGoDraft,
  onGoFiles,
  onAudit,
}: StageResultsViewProps) {
  const isDesktop = useMediaQuery("(min-width: 48em)");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const runs = useMemo(
    () => toResultRuns(roundHistory, checkpointId, summary?.checkpoint_code),
    [roundHistory, checkpointId, summary?.checkpoint_code],
  );

  if (runs.length === 0) {
    return (
      <Paper p="xl" withBorder radius="md" ta="center">
        <Stack align="center" gap="md">
          <FileCheck size={40} aria-hidden />
          <Text fw={500} size="lg">Chưa có kết quả chấm</Text>
          <Text size="sm" c="dimmed">3 bước để có kết quả:</Text>
          <Stack gap="xs" align="center">
            <Button variant="subtle" onClick={onGoDraft}>1. Trả lời câu hỏi ở tab Soạn thảo</Button>
            <Button variant="subtle" onClick={onGoFiles}>2. Tải tài liệu ở tab Tài liệu</Button>
            <Button onClick={onAudit}>3. Chấm bài</Button>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  if (!isDesktop) {
    return (
      <Accordion variant="separated" radius="md" defaultValue={runs[0].id}>
        {runs.map((run) => (
          <Accordion.Item key={run.id} value={run.id}>
            <Accordion.Control>
              <Text>Lịch sử chấm</Text>
              <Text size="sm" c="dimmed">{`${run.label}, ${formatDateShort(run.submittedAt)}`}</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <ResultPdfActions run={run} caseId={caseId} openLabel="Mở PDF" />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  }

  const selected = runs.find((run) => run.id === pickedId) ?? runs[0];
  return (
    <div className={styles.layout}>
      <ResultRunList runs={runs} selectedId={selected.id} onSelect={setPickedId} />
      <ResultPdfViewer run={selected} caseId={caseId} projectName={projectName} />
    </div>
  );
}
