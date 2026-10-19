import type { CaseEvent } from "@/types";
import { getEventDetails } from "@/lib/event-details";
import { formatEventTime } from "./activity-groups";
import classes from "./timeline.module.css";

const ROLE_LABELS: Record<string, string> = { admin: "Admin", supporter: "Supporter" };
const REASON_EVENT_TYPES = new Set(["case_rejected", "vetoed"]);

function reasonOf(event: CaseEvent): string | undefined {
  if (!REASON_EVENT_TYPES.has(event.event_type)) return undefined;
  const meta = event.metadata_json;
  if (meta && typeof meta === "object" && "reason" in meta && typeof meta.reason === "string") return meta.reason;
  return undefined;
}

export default function TimelineEventItem({ event }: { event: CaseEvent }) {
  const { label, desc, icon: Icon, colorClass } = getEventDetails(event.event_type);
  const reason = reasonOf(event);

  return (
    <li className={classes.item}>
      <span className={`${classes.marker} ${colorClass}`}>
        <Icon size={16} aria-hidden />
      </span>
      <div>
        <div className={classes.head}>
          <span className={classes.title}>{label}</span>
          <span className={classes.note}>{formatEventTime(event.created_at)}</span>
        </div>
        <p className={classes.note}>
          {desc}
          {reason && <> Lý do: {reason}</>}
        </p>
        {event.actor && (
          <p className={classes.note}>
            Thực hiện bởi {event.actor.name} ({ROLE_LABELS[event.actor.role] ?? "Sinh viên"})
          </p>
        )}
      </div>
    </li>
  );
}
