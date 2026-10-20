import { CaretDown } from "@phosphor-icons/react";
import type { DayGroup } from "./activity-groups";
import TimelineEventItem from "./TimelineEventItem";
import classes from "./timeline.module.css";

interface TimelineDayGroupProps {
  group: DayGroup;
  defaultOpen?: boolean;
}

export default function TimelineDayGroup({ group, defaultOpen = true }: TimelineDayGroupProps) {
  return (
    <details className={classes.fold} open={defaultOpen}>
      <summary className={classes.summary}>
        {group.label}
        <span className={`${classes.note} ${classes.count}`}>{group.events.length} sự kiện</span>
        <CaretDown size={18} className={classes.chevron} aria-hidden />
      </summary>
      <ol className={classes.list}>
        {group.events.map((event) => (
          <TimelineEventItem key={event.id} event={event} />
        ))}
      </ol>
    </details>
  );
}
