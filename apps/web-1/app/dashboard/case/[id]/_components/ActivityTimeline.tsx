"use client";

import { useMemo, useState } from "react";
import { Accordion, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Clock } from "lucide-react";
import type { Case } from "@/types";
import { groupEventsByDay } from "./activity/activity-groups";
import TimelineDayGroup from "./activity/TimelineDayGroup";

// Must match the `take` of case events in apps/api case.repository.
const API_EVENT_LIMIT = 50;
const MOBILE_QUERY = "(max-width: 48em)";

interface ActivityTimelineProps {
  caseData: Case;
}

export default function ActivityTimeline({ caseData }: ActivityTimelineProps) {
  const isMobile = useMediaQuery(MOBILE_QUERY, false);
  const [opened, setOpened] = useState<string[] | null>(null);

  // Chat messages would drown the timeline.
  const events = useMemo(
    () => (caseData.events ?? []).filter((e) => e.event_type !== "message_sent"),
    [caseData.events],
  );
  const groups = useMemo(() => groupEventsByDay(events), [events]);

  if (events.length === 0) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <Clock size={32} aria-hidden />
        <Text size="sm" c="dimmed">Chưa có hoạt động nào được ghi nhận cho dự án này.</Text>
      </Stack>
    );
  }

  const defaultOpen = isMobile ? groups.slice(0, 1).map((g) => g.dayKey) : groups.map((g) => g.dayKey);

  return (
    <Stack gap="md">
      {(caseData.events?.length ?? 0) >= API_EVENT_LIMIT && (
        <Text size="sm" c="dimmed">Hiển thị {API_EVENT_LIMIT} sự kiện gần nhất.</Text>
      )}

      <Accordion multiple value={opened ?? defaultOpen} onChange={setOpened} variant="default">
        {groups.map((group) => (
          <TimelineDayGroup key={group.dayKey} group={group} />
        ))}
      </Accordion>
    </Stack>
  );
}
