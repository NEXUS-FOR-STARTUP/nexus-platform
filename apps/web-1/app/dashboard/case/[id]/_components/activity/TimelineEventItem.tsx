import type { CaseEvent } from "@/types";
import { getEventDetails } from "@/lib/event-details";
import { formatEventTime, getEventTone, type TimelineTone } from "./activity-groups";
import classes from "./timeline.module.css";

const ROLE_LABELS: Record<string, string> = { admin: "Admin", supporter: "Supporter", system: "Hệ thống" };
const REASON_EVENT_TYPES = new Set(["case_rejected", "vetoed"]);

function reasonOf(event: CaseEvent): string | undefined {
  if (!REASON_EVENT_TYPES.has(event.event_type)) return undefined;
  const meta = event.metadata_json;
  if (meta && typeof meta === "object" && "reason" in meta && typeof meta.reason === "string") return meta.reason;
  return undefined;
}

const MARKER_BY_TONE: Record<TimelineTone, string> = {
  ai: classes.markerAi,
  ok: classes.markerOk,
  doc: classes.markerDoc,
  flow: classes.markerFlow,
  alert: classes.markerAlert,
  neutral: "",
};

export default function TimelineEventItem({ event }: { event: CaseEvent }) {
  const { label, desc, icon: Icon } = getEventDetails(event.event_type, event.metadata_json);
  const reason = reasonOf(event);

  const markerClass = MARKER_BY_TONE[getEventTone(event.event_type)];

  return (
    <li className={classes.event}>
      <span className={`${classes.marker} ${markerClass}`}>
        <Icon size={16} aria-hidden />
      </span>
      <div>
        <div className={classes.head}>
          <span className={classes.eventTitle}>{label}</span>
          <span className={classes.note}>{formatEventTime(event.created_at)}</span>
        </div>
        <p className={classes.eventNote}>
          {desc}
          {reason && <> Lý do: {reason}</>}
        </p>
        {event.actor && event.actor_role !== "system" && (
          <p className={classes.eventNote}>
            Thực hiện bởi {event.actor.name} ({ROLE_LABELS[event.actor.role] ?? "Sinh viên"})
          </p>
        )}
      </div>
    </li>
  );
}
