"use client";

import type { ReactNode } from "react";
import { Button } from "@mantine/core";
import type { Case, TeamFitReport } from "@/types";
import OverviewTeamSection from "./overview/OverviewTeamSection";
import OverviewIdeaSection from "./overview/OverviewIdeaSection";
import OverviewSupportSection from "./overview/OverviewSupportSection";
import OverviewMembersSection from "./overview/OverviewMembersSection";
import OverviewGapsSection from "./overview/OverviewGapsSection";
import { mapTeamFitReportResult } from "./overview/caseOverviewModel";

interface IntakeContact {
  full_name?: string;
  student_code?: string;
  team_role?: string;
  role?: string;
  email?: string;
  zalo?: string;
  phone?: string;
  telegram?: string;
}

interface IntakeIdea {
  field?: string;
  target_customer?: string;
  targetCustomer?: string;
  problem?: string;
  solution?: string;
  mvp?: string;
}

interface IntakeTeamContext {
  school?: string;
  project_name?: string;
  course_context?: string;
  group_no?: string;
  team_status_summary?: string;
}

interface IntakeSupportNeeds {
  primary_need?: string;
  expected_outputs?: string;
  extra_notes?: string;
}

interface IntakeData {
  contact?: IntakeContact;
  idea_context?: IntakeIdea;
  idea?: IntakeIdea;
  idea_snapshot?: IntakeIdea;
  team_context?: IntakeTeamContext;
  support_needs?: IntakeSupportNeeds;
  school?: string;
  project_name?: string;
  team_name?: string;
  course_context?: string;
  field?: string;
  target_customer?: string;
  targetCustomer?: string;
  problem?: string;
  solution?: string;
  mvp?: string;
  current_blocker?: string;
  expected_outputs?: string;
}

interface TeamMemberSnapshot {
  fullName?: string;
  name?: string;
  major?: string;
  role?: string;
  skills?: string;
  strengths?: string[];
  experience?: string[] | string;
}

interface IdeaSnapshotData {
  projectName?: string;
  field?: string;
  targetCustomer?: string;
  target_customer?: string;
  problem?: string;
  solution?: string;
  mvp?: string;
}


interface CaseOverviewPanelProps {
  caseData: Case;
  intakeSnapshot?: unknown;
  teamFitReport?: TeamFitReport | null;
  onSelectTab?: (tab: "overview" | "documents" | "discussion" | "timeline" | "settings" | "credits") => void;
  onEditIntake?: () => void;
  guidanceCard?: ReactNode;
}

const PRIMARY_NEEDS_MAP: Record<string, string> = {
  filter_select_idea: "Cần hỗ trợ chọn hướng ý tưởng phù hợp để phát triển tiếp",
  clarify_customer_pain: "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi",
  critique_feasibility: "Cần phản biện để đánh giá giải pháp hiện tại có hợp lý và khả thi không",
  audit_cp1_draft: "Cần rà soát tài liệu dự án và chỉ ra điểm cần chỉnh sửa",
  improve_rejected_idea: "Cần góp ý để cải thiện ý tưởng sau phản hồi chưa tốt từ giảng viên",
};

export default function CaseOverviewPanel({
  caseData,
  intakeSnapshot,
  teamFitReport,
  onEditIntake,
  guidanceCard,
}: CaseOverviewPanelProps) {
  const intake: IntakeData =
    intakeSnapshot && typeof intakeSnapshot === "object" ? (intakeSnapshot as IntakeData) : {};
  const contact = intake.contact || {};
  const idea = intake.idea_context || intake.idea || intake.idea_snapshot || {};
  const teamCtx = intake.team_context || {};
  const supportNeeds = intake.support_needs || {};

  const teamFit = teamFitReport || caseData.team_fit_report || null;
  const tfIdea: IdeaSnapshotData =
    teamFit?.idea_snapshot && typeof teamFit.idea_snapshot === "object"
      ? (teamFit.idea_snapshot as IdeaSnapshotData)
      : {};
  const tfTeam: TeamMemberSnapshot[] = Array.isArray(teamFit?.team_snapshot)
    ? (teamFit.team_snapshot as TeamMemberSnapshot[])
    : [];

  const schoolName = caseData.school || teamCtx.school || intake.school || "Chưa cập nhật";
  const groupName =
    caseData.team_name ||
    tfIdea.projectName ||
    teamCtx.project_name ||
    intake.project_name ||
    intake.team_name ||
    "Chưa cập nhật";
  const courseContext =
    caseData.course_context || teamCtx.course_context || intake.course_context || "Chưa cập nhật";
  const groupNo = caseData.group_no || teamCtx.group_no || "";
  const currentBlocker =
    intake.current_blocker || teamCtx.team_status_summary || "";

  const contactName = contact.full_name || caseData.owner?.name || "Chưa cập nhật";
  const studentCode = contact.student_code || "Chưa cập nhật";
  const teamRole = contact.team_role || contact.role || "Trưởng nhóm";
  const contactEmail = contact.email || caseData.owner?.email || "Chưa cập nhật";
  const contactPhone = contact.zalo || contact.phone || "Chưa cập nhật";
  const contactTelegram = contact.telegram || "";

  const field = idea.field || tfIdea.field || intake.field || "Chưa cập nhật";
  const targetCustomer =
    idea.target_customer ||
    idea.targetCustomer ||
    tfIdea.targetCustomer ||
    tfIdea.target_customer ||
    intake.target_customer ||
    intake.targetCustomer ||
    "Chưa cập nhật";
  const problem = idea.problem || tfIdea.problem || intake.problem || "Chưa cập nhật";
  const solution = idea.solution || tfIdea.solution || intake.solution || "Chưa cập nhật";
  const mvp = idea.mvp || tfIdea.mvp || intake.mvp || "";

  const { verdictLabel, areas, teamGaps, commercialGaps } = mapTeamFitReportResult(teamFit?.result_snapshot);

  const rawPrimaryNeed = supportNeeds.primary_need || "";
  const primaryNeedText = rawPrimaryNeed ? PRIMARY_NEEDS_MAP[rawPrimaryNeed] || rawPrimaryNeed : "";
  const expectedOutputs = intake.expected_outputs || supportNeeds.expected_outputs || "";
  const extraNotes = supportNeeds.extra_notes || "";

  return (
    <div className="space-y-5 animate-fade-in font-body pb-8 text-sm text-text-app">
      {guidanceCard && <div className="shrink-0">{guidanceCard}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-text-app">
            Tổng quan hồ sơ
          </h2>
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
            Cập nhật hồ sơ
          </Button>
        )}
      </div>

      <OverviewTeamSection
        groupName={groupName}
        groupNo={groupNo}
        schoolName={schoolName}
        courseContext={courseContext}
        contactName={contactName}
        studentCode={studentCode}
        teamRole={teamRole}
        contactEmail={contactEmail}
        contactPhone={contactPhone}
        contactTelegram={contactTelegram}
      />

      <OverviewIdeaSection
        field={field}
        targetCustomer={targetCustomer}
        problem={problem}
        solution={solution}
        mvp={mvp}
      />

      <OverviewSupportSection
        currentBlocker={currentBlocker}
        primaryNeedText={primaryNeedText}
        expectedOutputs={expectedOutputs}
        extraNotes={extraNotes}
      />

      {tfTeam.length > 0 && <OverviewMembersSection members={tfTeam} />}

      <OverviewGapsSection verdictLabel={verdictLabel} areas={areas} teamGaps={teamGaps} commercialGaps={commercialGaps} />
    </div>
  );
}
