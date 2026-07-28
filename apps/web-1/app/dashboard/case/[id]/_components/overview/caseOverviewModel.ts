import type { Case, CaseMember, TeamFitReport } from "@/types";

type RecordValue = Record<string, unknown>;

export interface OverviewField {
  label: string;
  value: string;
}

export interface OverviewMember {
  name: string;
  detail: string;
  meta?: string;
}

export interface CaseOverviewModel {
  summary: {
    caseCode: string;
    packageName: string;
    stage: string;
    deadline: string;
    text: string | null;
  };
  teamFields: OverviewField[];
  contactFields: OverviewField[];
  ideaFields: OverviewField[];
  members: OverviewMember[];
  teamGaps: string[];
  commercialGaps: string[];
  currentBlocker: string | null;
  supportNeeds: string[];
  expectedOutputs: string | null;
  hasFreeAnalysis: boolean;
}

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : null;
}

function asRecordArray(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(asRecord).filter((item): item is RecordValue => item !== null) : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function textList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(text).filter((item): item is string => item !== null);
  }

  const single = text(value);
  return single ? [single] : [];
}

function field(label: string, value: unknown): OverviewField | null {
  const resolved = text(value);
  return resolved ? { label, value: resolved } : null;
}

function compactFields(fields: Array<OverviewField | null>): OverviewField[] {
  return fields.filter((item): item is OverviewField => item !== null);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Chưa có deadline";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có deadline";

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function mapFreeMembers(teamSnapshot: unknown): OverviewMember[] {
  return asRecordArray(teamSnapshot).map((member, index) => {
    const major = text(member.major);
    const strengths = text(member.strengths);
    const experience = text(member.experience);

    return {
      name: `Thành viên ${index + 1}`,
      detail: [major, strengths].filter(Boolean).join(" - ") || "Chưa có mô tả",
      meta: experience || undefined,
    };
  });
}

function mapCaseMembers(members: CaseMember[] | undefined): OverviewMember[] {
  return (members || []).map((member) => ({
    name: member.user?.name || member.user?.email || "Thành viên",
    detail: member.role_in_team || "Chưa khai báo vai trò",
    meta: member.access_level,
  }));
}

export function buildCaseOverviewModel(caseData: Case, intakeSnapshot: unknown, teamFitReport: TeamFitReport | null): CaseOverviewModel {
  const intake = asRecord(intakeSnapshot);
  const contact = asRecord(intake?.contact);
  const teamContext = asRecord(intake?.team_context);
  const supportNeedsRecord = asRecord(intake?.support_needs);
  const idea = asRecord(teamFitReport?.idea_snapshot);
  const result = asRecord(teamFitReport?.result_snapshot);

  const freeMembers = mapFreeMembers(teamFitReport?.team_snapshot);
  const caseMembers = mapCaseMembers(caseData.members);

  const supportNeeds = [
    ...textList(supportNeedsRecord?.primary_need),
    ...textList(supportNeedsRecord?.extra_notes),
  ];

  const teamGaps = textList(result?.teamGaps);
  const commercialGaps = textList(result?.commercialGaps);

  return {
    summary: {
      caseCode: caseData.case_code,
      packageName: caseData.package?.name || "Chưa chọn gói",
      stage: caseData.user_facing_stage,
      deadline: formatDate(caseData.sla_deadline_at || caseData.deadline),
      text: text(intake?.case_summary) || text(intake?.current_blocker),
    },
    teamFields: compactFields([
      field("Tên nhóm / dự án", teamContext?.project_name || caseData.team_name || idea?.projectName),
      field("Mã nhóm", teamContext?.group_no || caseData.group_no),
      field("Trường", intake?.school || caseData.school),
      field("Môn / lớp", intake?.course_context || caseData.course_context),
      field("Tình trạng nhóm", teamContext?.team_status_summary),
    ]),
    contactFields: compactFields([
      field("Họ tên", contact?.full_name),
      field("MSSV", contact?.student_code),
      field("Vai trò", contact?.team_role),
      field("Email", contact?.email),
      field("Zalo", contact?.zalo),
      field("Telegram", contact?.telegram),
    ]),
    ideaFields: compactFields([
      field("Lĩnh vực", idea?.field),
      field("Khách hàng mục tiêu", idea?.targetCustomer),
      field("Vấn đề", idea?.problem),
      field("Giải pháp", idea?.solution),
      field("MVP", idea?.mvp),
    ]),
    members: freeMembers.length > 0 ? freeMembers : caseMembers,
    teamGaps,
    commercialGaps,
    currentBlocker: text(intake?.current_blocker),
    supportNeeds,
    expectedOutputs: text(intake?.expected_outputs),
    hasFreeAnalysis: teamGaps.length > 0 || commercialGaps.length > 0 || freeMembers.length > 0 || Boolean(idea),
  };
}
