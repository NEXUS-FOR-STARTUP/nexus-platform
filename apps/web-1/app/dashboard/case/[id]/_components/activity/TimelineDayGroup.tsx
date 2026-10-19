import { Accordion } from "@mantine/core";
import type { DayGroup } from "./activity-groups";
import TimelineEventItem from "./TimelineEventItem";
import classes from "./timeline.module.css";

export default function TimelineDayGroup({ group }: { group: DayGroup }) {
  return (
    <Accordion.Item value={group.dayKey}>
      <Accordion.Control>
        <span className={classes.dayLabel}>{group.label}</span>
        <span className={classes.count}>{group.events.length} sự kiện</span>
      </Accordion.Control>
      <Accordion.Panel>
        <ol className={classes.list}>
          {group.events.map((event) => (
            <TimelineEventItem key={event.id} event={event} />
          ))}
        </ol>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
