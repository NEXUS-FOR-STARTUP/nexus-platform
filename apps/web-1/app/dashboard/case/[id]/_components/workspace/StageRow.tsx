"use client";

import { LockIcon } from "@phosphor-icons/react";
import { StatusChip } from "@/components/ui/StatusChip";
import type { StageStatus } from "../../hooks/useStageSummaries";
import { Button } from "../ui/Button";
import { STAGE_STATUS } from "./stage-status";
import r from "./stage-rows.module.css";

interface StageRowProps {
  name: string;
  note: string;
  /** Drives chip + button label. Ignored when `locked`. */
  status?: StageStatus;
  /** Opens the stage; the button is hidden when omitted or locked. */
  onOpen?: () => void;
  /** Not available yet: lock icon, "Sắp ra mắt" chip, no button. */
  locked?: boolean;
}

export default function StageRow({ name, note, status = "not_started", onOpen, locked }: StageRowProps) {
  const meta = STAGE_STATUS[status];

  return (
    <div className={`${r.row} ${locked ? r.locked : ""}`}>
      <div>
        <div className={r.name}>
          {locked && <LockIcon size={16} aria-hidden />}
          {name}
        </div>
        <div className={r.note}>{note}</div>
      </div>
      <StatusChip tone={locked ? "neutral" : meta.tone}>{locked ? "Sắp ra mắt" : meta.label}</StatusChip>
      {!locked && onOpen ? (
        <Button variant="quiet" onClick={onOpen}>
          {meta.cta}
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}
