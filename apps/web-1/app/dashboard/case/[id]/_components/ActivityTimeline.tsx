"use client";

import { useMemo, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import type { Case } from "@/types";
import {
  groupEventsByDay,
  getEventCategory,
  type TimelineCategory,
} from "./activity/activity-groups";
import TimelineDayGroup from "./activity/TimelineDayGroup";
import classes from "./activity/timeline.module.css";
import FilterTabs from "./ui/FilterTabs";

// Must match the `take` of case events in apps/api case.repository.
const API_EVENT_LIMIT = 50;
const MOBILE_QUERY = "(max-width: 48em)";

const TABS: { id: TimelineCategory; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "grade", label: "Chấm bài" },
  { id: "pay", label: "Lượt chấm" },
  { id: "project", label: "Dự án" },
];

interface ActivityTimelineProps {
  caseData: Case;
}

export default function ActivityTimeline({ caseData }: ActivityTimelineProps) {
  const isMobile = useMediaQuery(MOBILE_QUERY, false);
  const [selectedTab, setSelectedTab] = useState<TimelineCategory>("all");

  // Chat messages would drown the timeline.
  const events = useMemo(
    () => (caseData.events ?? []).filter((e) => e.event_type !== "message_sent"),
    [caseData.events],
  );

  const counts = useMemo(() => {
    const map: Record<TimelineCategory, number> = { all: events.length, grade: 0, pay: 0, project: 0 };
    for (const e of events) {
      const cat = getEventCategory(e.event_type);
      map[cat] = (map[cat] ?? 0) + 1;
    }
    return map;
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (selectedTab === "all") return events;
    return events.filter((e) => getEventCategory(e.event_type) === selectedTab);
  }, [events, selectedTab]);

  const groups = useMemo(() => groupEventsByDay(filteredEvents), [filteredEvents]);

  const heading = (
    <>
      <h2 className={classes.title}>Lịch sử hoạt động</h2>
      <p className={classes.lead}>Mọi thay đổi trạng thái, lượt chấm và cập nhật của dự án.</p>
    </>
  );

  if (events.length === 0) {
    return (
      <div className={classes.root}>
        {heading}
        <p className={classes.empty}>Chưa có hoạt động nào được ghi nhận cho dự án này.</p>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      {heading}
      {(caseData.events?.length ?? 0) >= API_EVENT_LIMIT && (
        <p className={classes.lead}>Hiển thị {API_EVENT_LIMIT} sự kiện gần nhất.</p>
      )}

      <FilterTabs
        ariaLabel="Lọc theo loại sự kiện"
        value={selectedTab}
        onChange={setSelectedTab}
        items={TABS.map((tab) => ({ value: tab.id, label: `${tab.label} (${counts[tab.id] ?? 0})` }))}
      />

      {groups.length === 0 ? (
        <p className={classes.empty}>Chưa có hoạt động nào thuộc loại này.</p>
      ) : (
        groups.map((group, idx) => (
          <TimelineDayGroup
            key={group.dayKey}
            group={group}
            defaultOpen={isMobile ? idx === 0 : true}
          />
        ))
      )}
    </div>
  );
}
