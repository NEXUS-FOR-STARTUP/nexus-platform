"use client";

import type { ReactNode } from "react";
import { CheckIcon, CircleIcon, HourglassMediumIcon, LockIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import { StatusChip } from "@/components/ui/StatusChip";
import type { StageStatus } from "../../hooks/useStageSummaries";
import { Button } from "../ui/Button";
import { STAGE_STATUS } from "./stage-status";
import r from "./stage-rows.module.css";

interface StageRowProps {
  name: string;
  note: string;
  /** Drives chip, button label and the icon tile. Ignored when `locked`. */
  status?: StageStatus;
  /** Opens the stage; the button is hidden when omitted or locked. */
  onOpen?: () => void;
  /** Not available yet: lock tile, "Sắp ra mắt" chip, no button. */
  locked?: boolean;
}

const TILE: Record<StageStatus | "locked", { tone: string; icon: ReactNode }> = {
  has_result: { tone: r.tileDone, icon: <CheckIcon size={20} weight="bold" aria-hidden /> },
  grading: { tone: r.tileAttn, icon: <HourglassMediumIcon size={20} aria-hidden /> },
  drafting: { tone: r.tileNext, icon: <PencilSimpleLineIcon size={20} aria-hidden /> },
  files_submitted: { tone: r.tileNext, icon: <PencilSimpleLineIcon size={20} aria-hidden /> },
  not_started: { tone: r.tileTodo, icon: <CircleIcon size={20} aria-hidden /> },
  locked: { tone: r.tileLocked, icon: <LockIcon size={20} aria-hidden /> },
};

export default function StageRow({ name, note, status = "not_started", onOpen, locked }: StageRowProps) {
  const meta = STAGE_STATUS[status];
  const tile = TILE[locked ? "locked" : status];

  return (
    <div className={`${r.row} ${locked ? r.locked : ""}`}>
      <div className={r.lead}>
        <span className={`${r.tile} ${tile.tone}`}>{tile.icon}</span>
        <div>
          <div className={r.name}>{name}</div>
          <div className={r.note}>{note}</div>
        </div>
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
