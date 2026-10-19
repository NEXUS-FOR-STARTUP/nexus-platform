import { UnstyledButton } from "@mantine/core";
import { Circle, CircleAlert, CircleCheck, ChevronRight, Lock } from "lucide-react";
import { StatusChip } from "@/components/ui/StatusChip";
import s from "./guided-toc.module.css";

export type TocQuestionState = "answered" | "empty" | "thin" | "locked";

interface TocQuestionRowProps {
  title: string;
  /** "phase.question" label shown before the title. */
  number: string;
  state: TocQuestionState;
  important: boolean;
  selected: boolean;
  onSelect: () => void;
}

const ICON_SIZE = 16;

function StateIcon({ state }: { state: TocQuestionState }) {
  if (state === "locked") return <Lock size={ICON_SIZE} className={s.icon} aria-hidden />;
  if (state === "thin") return <CircleAlert size={ICON_SIZE} className={`${s.icon} ${s.iconThin}`} aria-hidden />;
  if (state === "answered") return <CircleCheck size={ICON_SIZE} className={`${s.icon} ${s.iconAnswered}`} aria-hidden />;
  return <Circle size={ICON_SIZE} className={s.icon} aria-hidden />;
}

export default function TocQuestionRow({ title, number, state, important, selected, onSelect }: TocQuestionRowProps) {
  const locked = state === "locked";
  const rowTitle = state === "thin" ? "Câu trả lời còn ngắn, bấm để viết thêm" : title;

  return (
    <UnstyledButton
      className={`${s.row} ${selected ? s.selected : ""} ${locked ? s.locked : ""}`}
      aria-current={selected ? "true" : undefined}
      aria-disabled={locked || undefined}
      title={rowTitle}
      // aria-disabled instead of disabled so the title stays reachable on locked rows.
      onClick={locked ? undefined : onSelect}
    >
      <StateIcon state={state} />
      <span className={s.name}>
        {number} {title}
      </span>
      {selected && <ChevronRight size={ICON_SIZE} className={s.chevron} aria-hidden />}
      {important && (
        <span className={s.chip}>
          <StatusChip tone="warn">Quan trọng</StatusChip>
        </span>
      )}
    </UnstyledButton>
  );
}
