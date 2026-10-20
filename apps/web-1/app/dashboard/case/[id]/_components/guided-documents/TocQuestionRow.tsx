import { CaretRightIcon, CheckIcon, CircleIcon, LockSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import s from "./guided-toc.module.css";

export type TocQuestionState = "answered" | "empty" | "thin" | "locked";

interface TocQuestionRowProps {
  title: string;
  state: TocQuestionState;
  important: boolean;
  selected: boolean;
  onSelect: () => void;
}

function StateIcon({ state, selected }: { state: TocQuestionState; selected: boolean }) {
  if (state === "locked") return <LockSimpleIcon size={14} className={s.icon} aria-hidden />;
  if (state === "thin") {
    return (
      <span className={s.warnIcon}>
        <WarningCircleIcon size={14} aria-hidden />
      </span>
    );
  }
  if (state === "answered") {
    return (
      <span className={s.tick}>
        <CheckIcon size={10} weight="bold" aria-hidden />
      </span>
    );
  }
  return <CircleIcon size={14} className={selected ? s.iconOn : s.icon} aria-hidden />;
}

export default function TocQuestionRow({ title, state, important, selected, onSelect }: TocQuestionRowProps) {
  const locked = state === "locked";
  const rowTitle = state === "thin" ? "Câu trả lời còn ngắn, bấm để viết thêm" : title;

  return (
    <button
      type="button"
      className={`${s.row} ${selected ? s.on : ""} ${locked ? s.locked : ""} ${important ? s.hasCrit : ""}`}
      aria-current={selected ? "true" : undefined}
      // aria-disabled instead of disabled so the title stays reachable on locked rows.
      aria-disabled={locked || undefined}
      title={rowTitle}
      onClick={locked ? undefined : onSelect}
    >
      <StateIcon state={state} selected={selected} />
      <span className={s.label}>{title}</span>
      {important ? (
        <em className={s.crit}>Quan trọng</em>
      ) : (
        selected && <CaretRightIcon size={14} className={s.iconOn} aria-hidden />
      )}
    </button>
  );
}
