"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircleIcon, CircleIcon, XIcon } from "@phosphor-icons/react";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import { Button } from "../../ui/Button";
import { hasStageInput } from "./stage-input";
import s from "./stage-start-guide.module.css";

interface StageStartGuideProps {
  caseId: string;
  stageCode: string;
  isCp2: boolean;
  summary?: StageSummary;
  creditsRemaining: number;
  onAnswer: () => void;
  onUpload: () => void;
  onBuyCredits: () => void;
  onAudit: () => void;
}

/** Dismissal is per phase: closing "answer or upload" must not hide "buy credits" or "grade" later. */
const dismissKey = (caseId: string, stageCode: string, phase: Phase) => `stage-guide-dismissed:${caseId}:${stageCode}:${phase}`;

const STEP_LABELS = ["Câu trả lời hoặc tài liệu", "Mua lượt chấm", "Chấm bài"] as const;
type StepState = "done" | "current" | "todo";
type Phase = "input" | "buy" | "grade";

/** Where the user is on the path input -> credits -> grading, from the same rule the audit modal uses. */
function stepStates(ready: boolean, hasCredits: boolean): StepState[] {
  if (!ready) return ["current", "todo", "todo"];
  if (!hasCredits) return ["done", "current", "todo"];
  return ["done", "done", "current"];
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") return <CheckCircleIcon size={20} weight="fill" aria-hidden="true" />;
  return <CircleIcon size={20} weight={state === "current" ? "fill" : "regular"} aria-hidden="true" />;
}

export default function StageStartGuide({
  caseId,
  stageCode,
  isCp2,
  summary,
  creditsRemaining,
  onAnswer,
  onUpload,
  onBuyCredits,
  onAudit,
}: StageStartGuideProps) {
  const ready = hasStageInput(isCp2, summary);
  const hasCredits = creditsRemaining > 0;
  const phase: Phase = !ready ? "input" : hasCredits ? "grade" : "buy";

  // Read after mount so the server render and the first client render match.
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    setDismissed(window.sessionStorage.getItem(dismissKey(caseId, stageCode, phase)) === "1");
  }, [caseId, stageCode, phase]);

  if (!summary || summary.status === "grading" || summary.status === "has_result" || dismissed) return null;

  const states = stepStates(ready, hasCredits);

  const close = () => {
    window.sessionStorage.setItem(dismissKey(caseId, stageCode, phase), "1");
    setDismissed(true);
  };

  let title: string;
  let lead: string;
  let primary: ReactNode;
  let secondary: ReactNode;
  if (!ready) {
    title = "Có hai cách để được chấm giai đoạn này";
    lead =
      "Trả lời câu hỏi, hoặc tải tài liệu bạn đã có. Nếu đã có tài liệu thì không cần trả lời câu hỏi. Sau đó mua lượt chấm và bấm Chấm bài.";
    primary = <Button onClick={onAnswer}>Trả lời câu hỏi</Button>;
    secondary = (
      <button type="button" className={s.link} onClick={onUpload}>
        Tải tài liệu có sẵn lên
      </button>
    );
  } else {
    const soft = (
      <button type="button" className={s.link} onClick={onAnswer}>
        Tiếp tục soạn thảo
      </button>
    );
    secondary = soft;
    if (hasCredits) {
      title = "Sẵn sàng chấm";
      lead = `Mỗi lần chấm dùng 1 lượt (còn ${creditsRemaining} lượt).`;
      primary = <Button onClick={onAudit}>Chấm bài</Button>;
    } else {
      title = "Bạn đã có đủ để chấm";
      lead = "Mua lượt chấm để gửi bài.";
      primary = <Button onClick={onBuyCredits}>Mua lượt chấm</Button>;
    }
  }

  return (
    <section className={s.root} aria-label="Hướng dẫn bắt đầu">
      <div className={s.main}>
        <h2 className={s.title}>{title}</h2>
        <p className={s.lead}>{lead}</p>
        <div className={s.actions}>
          <span className={s.cta}>{primary}</span>
          {secondary}
        </div>
      </div>

      <ol className={s.steps} aria-label="Các bước để được chấm">
        {STEP_LABELS.map((label, i) => (
          <li key={label} className={`${s.step} ${s[states[i]]}`} aria-current={states[i] === "current" ? "step" : undefined}>
            <StepIcon state={states[i]} />
            {label}
          </li>
        ))}
      </ol>

      <button type="button" className={s.close} onClick={close} aria-label="Đóng hướng dẫn">
        <XIcon size={18} aria-hidden="true" />
      </button>
    </section>
  );
}
