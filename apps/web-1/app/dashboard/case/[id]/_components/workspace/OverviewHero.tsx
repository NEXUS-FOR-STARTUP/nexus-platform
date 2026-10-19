"use client";

import type { NextAction } from "../../hooks/useNextActions";
import { Button } from "../ui/Button";
import s from "./overview.module.css";

interface OverviewHeroProps {
  action: NextAction | null;
  onOpenStage: (slug: string, view: "draft" | "files" | "results") => void;
}

export default function OverviewHero({ action, onOpenStage }: OverviewHeroProps) {
  if (!action) return null;

  return (
    <div className={s.card}>
      <h2 className={s.cardTitle}>{action.title}</h2>
      <p className={s.lead}>{action.description}</p>
      <Button variant="primary" onClick={() => onOpenStage(action.stageSlug, action.view)}>
        {action.cta}
      </Button>
    </div>
  );
}
