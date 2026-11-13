import type { Case, TeamFitReport } from "@/types";
import { missingContactLabels } from "@/app/dashboard/_components/case-contact";
import { mapTeamFitReportResult, type OverviewArea } from "./caseOverviewModel";
import { derivePreCp1Overview, type PreCp1Overview } from "./preCp1Overview";

interface IntakeIdea {
  field?: string;
  target_customer?: string;
  targetCustomer?: string;
  problem?: string;
  solution?: string;
  mvp?: string;
}

interface IntakeData {
  contact?: {
    full_name?: string;
    student_code?: string;
    team_role?: string;
    role?: string;
    email?: string;
    zalo?: string;
    phone?: string;
    telegram?: string;
  };
  idea_context?: IntakeIdea;
  idea?: IntakeIdea;
  idea_snapshot?: IntakeIdea;
  team_context?: {
    school?: string;
    project_name?: string;
    course_context?: string;
    group_no?: string;
    team_status_summary?: string;
  };
  support_needs?: { primary_need?: string; expected_outputs?: string; extra_notes?: string };
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

export interface TeamMemberSnapshot {
  fullName?: string;
  name?: string;
  major?: string;
  role?: string;
  skills?: string;
  strengths?: string[];
  experience?: string[] | string;
}

interface IdeaSnapshotData extends IntakeIdea {
  projectName?: string;
}

const PRIMARY_NEEDS_MAP: Record<string, string> = {
  filter_select_idea: "Cần hỗ trợ chọn hướng ý tưởng phù hợp để phát triển tiếp",
  clarify_customer_pain: "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi",
  critique_feasibility: "Cần phản biện để đánh giá giải pháp hiện tại có hợp lý và khả thi không",
  audit_cp1_draft: "Cần rà soát tài liệu dự án và chỉ ra điểm cần chỉnh sửa",
  improve_rejected_idea: "Cần góp ý để cải thiện ý tưởng sau phản hồi chưa tốt từ giảng viên",
};

/** Every profile value as a plain string; "" means the project has no data for it. */
export interface OverviewData {
  contactSource: unknown;
  groupName: string;
  groupNo: string;
  schoolName: string;
  courseContext: string;
  contactName: string;
  studentCode: string;
  teamRole: string;
  contactEmail: string;
  contactPhone: string;
  contactTelegram: string;
  field: string;
  targetCustomer: string;
  problem: string;
  solution: string;
  mvp: string;
  currentBlocker: string;
  primaryNeedText: string;
  expectedOutputs: string;
  extraNotes: string;
  members: TeamMemberSnapshot[];
  verdictLabel: string | null;
  areas: OverviewArea[];
  teamGaps: string[];
  commercialGaps: string[];
  preCp1: PreCp1Overview | null;
}

export function deriveOverviewData(
  caseData: Case,
  intakeSnapshot: unknown,
  teamFitReport?: TeamFitReport | null,
): OverviewData {
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
  const members: TeamMemberSnapshot[] = Array.isArray(teamFit?.team_snapshot)
    ? (teamFit.team_snapshot as TeamMemberSnapshot[])
    : [];
  const preCp1 = derivePreCp1Overview(caseData.pre_cp1_reports?.[0]);
  const effectiveMembers = members.length > 0 ? members : (preCp1?.members ?? []);

  const rawPrimaryNeed = supportNeeds.primary_need || "";

  return {
    contactSource: contact,
    groupName:
      caseData.team_name ||
      tfIdea.projectName ||
      preCp1?.projectName ||
      teamCtx.project_name ||
      intake.project_name ||
      intake.team_name ||
      "",
    groupNo: caseData.group_no || teamCtx.group_no || "",
    schoolName: caseData.school || teamCtx.school || intake.school || preCp1?.schoolLabel || "",
    courseContext: caseData.course_context || teamCtx.course_context || intake.course_context || preCp1?.courseLabel || "",
    contactName: contact.full_name || "",
    studentCode: contact.student_code || "",
    teamRole: contact.team_role || contact.role || "Trưởng nhóm",
    contactEmail: contact.email || "",
    contactPhone: contact.zalo || contact.phone || "",
    contactTelegram: contact.telegram || "",
    field: idea.field || tfIdea.field || preCp1?.field || intake.field || "",
    targetCustomer:
      idea.target_customer ||
      idea.targetCustomer ||
      tfIdea.targetCustomer ||
      tfIdea.target_customer ||
      preCp1?.targetCustomer ||
      intake.target_customer ||
      intake.targetCustomer ||
      "",
    problem: idea.problem || tfIdea.problem || preCp1?.problem || intake.problem || "",
    solution: idea.solution || tfIdea.solution || preCp1?.solution || intake.solution || "",
    mvp: idea.mvp || tfIdea.mvp || preCp1?.mvp || intake.mvp || "",
    currentBlocker: intake.current_blocker || teamCtx.team_status_summary || "",
    primaryNeedText: rawPrimaryNeed ? PRIMARY_NEEDS_MAP[rawPrimaryNeed] || rawPrimaryNeed : "",
    expectedOutputs: intake.expected_outputs || supportNeeds.expected_outputs || "",
    extraNotes: supportNeeds.extra_notes || "",
    members: effectiveMembers,
    preCp1,
    ...mapTeamFitReportResult(teamFit?.result_snapshot),
  };
}

/** Same required set Settings enforces: project name, school, course + core contact (name, phone, email). */
export function countMissingProfileFields(data: OverviewData): number {
  const required = [data.groupName, data.schoolName, data.courseContext];
  return required.filter((v) => !v.trim()).length + missingContactLabels(data.contactSource).length;
}
