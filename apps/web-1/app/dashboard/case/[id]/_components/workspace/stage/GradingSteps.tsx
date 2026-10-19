"use client";

import { Progress, Stack, Stepper, Text, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { CaseAiStatusResponse } from "../../../hooks/useCaseAiStatus";
import RadarLogsViewer from "../../RadarLogsViewer";
import { filterCleanLogs } from "../../radar.utils";

/** Cap on the raw error shown in the support tooltip. */
const RAW_ERROR_MAX_CHARS = 300;

interface GradingStepsProps {
  data: CaseAiStatusResponse;
  doneCount: number;
  readsWhat: string | null;
}

export default function GradingSteps({ data, doneCount, readsWhat }: GradingStepsProps) {
  const isNarrow = useMediaQuery("(max-width: 48em)");
  const failed = data.status === "failed";
  return (
    <Stack gap="md" mt="md">
      {readsWhat && <Text size="sm" c="dimmed">{readsWhat}</Text>}
      {failed && data.error && (
        // Raw worker/queue text is English and internal: keep it in a tooltip for support, never in the layout.
        <Tooltip label={data.error.slice(0, RAW_ERROR_MAX_CHARS)} multiline maw={360} withArrow>
          <Text size="sm" c="red" w="fit-content">Hệ thống chưa tạo được báo cáo hoàn chỉnh. Di chuột để xem chi tiết kỹ thuật cho hỗ trợ.</Text>
        </Tooltip>
      )}
      <Progress value={(doneCount / Math.max(data.steps.length, 1)) * 100} animated={data.status === "running"} color={failed ? "red" : "blue"} size="sm" radius="xl" />
      <Stepper active={doneCount} size="sm" orientation={isNarrow ? "vertical" : "horizontal"} color={failed ? "red" : "blue"} allowNextStepsSelect={false}>
        {data.steps.map((step) => (
          <Stepper.Step key={step.id} label={step.label} loading={step.state === "active"} />
        ))}
      </Stepper>
      <RadarLogsViewer logs={filterCleanLogs(data.logs ?? [])} />
    </Stack>
  );
}
