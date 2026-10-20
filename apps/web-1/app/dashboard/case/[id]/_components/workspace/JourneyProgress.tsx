import type { StageSummary } from "../../hooks/useStageSummaries";
import { buildStageSteps, STAGE_STATE_LABEL } from "./stage-state";
import s from "./journey-progress.module.css";

interface JourneyProgressProps {
  stages?: StageSummary[];
}

/** One flat segment per stage, coloured by state; each name carries its state for screen readers. */
export default function JourneyProgress({ stages }: JourneyProgressProps) {
  const steps = buildStageSteps(stages);

  return (
    <ol className={s.bar} aria-label="Tiến độ hành trình">
      {steps.map((step) => (
        <li key={step.code} className={s.step}>
          <span className={`${s.seg} ${s[step.state]}`} aria-hidden />
          <span className={s.name}>
            {step.name}
            <span className={s.sr}> — {STAGE_STATE_LABEL[step.state]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
