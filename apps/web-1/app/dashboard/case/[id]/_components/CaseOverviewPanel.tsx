"use client";

import type { ReactNode } from "react";
import { Button } from "@mantine/core";
import type { Case, TeamFitReport } from "@/types";
import OverviewTeamSection from "./overview/OverviewTeamSection";
import OverviewIdeaSection from "./overview/OverviewIdeaSection";
import OverviewSupportSection from "./overview/OverviewSupportSection";
import OverviewMembersSection from "./overview/OverviewMembersSection";
import OverviewGapsSection from "./overview/OverviewGapsSection";
import { deriveOverviewData } from "./overview/caseOverviewData";

interface CaseOverviewPanelProps {
  caseData: Case;
  intakeSnapshot?: unknown;
  teamFitReport?: TeamFitReport | null;
  onSelectTab?: (tab: "overview" | "documents" | "discussion" | "timeline" | "settings" | "credits") => void;
  onEditIntake?: () => void;
  guidanceCard?: ReactNode;
  /** Inside the Tổng quan fold: the page already has its own heading. */
  embedded?: boolean;
}

export default function CaseOverviewPanel({
  caseData,
  intakeSnapshot,
  teamFitReport,
  onEditIntake,
  guidanceCard,
  embedded,
}: CaseOverviewPanelProps) {
  const d = deriveOverviewData(caseData, intakeSnapshot, teamFitReport);

  return (
    <div className={`space-y-5 animate-fade-in font-body text-sm text-text-app ${embedded ? "" : "pb-8"}`}>
      {guidanceCard && <div className="shrink-0">{guidanceCard}</div>}

      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-text-app">Tổng quan dự án</h2>
            <p className="text-sm font-normal text-text-muted mt-0.5">
              Thông tin chi tiết về đội ngũ, ý tưởng khởi nghiệp và nhu cầu phản biện.
            </p>
          </div>
          {onEditIntake && (
            <Button
              size="sm"
              variant="light"
              color="brand"
              className="cursor-pointer font-medium self-start sm:self-auto"
              onClick={onEditIntake}
            >
              Cập nhật dự án
            </Button>
          )}
        </div>
      )}

      <OverviewTeamSection data={d} />
      <OverviewIdeaSection data={d} />
      <OverviewSupportSection data={d} />
      {d.members.length > 0 && <OverviewMembersSection members={d.members} />}
      <OverviewGapsSection
        verdictLabel={d.verdictLabel}
        areas={d.areas}
        teamGaps={d.teamGaps}
        commercialGaps={d.commercialGaps}
      />
    </div>
  );
}
