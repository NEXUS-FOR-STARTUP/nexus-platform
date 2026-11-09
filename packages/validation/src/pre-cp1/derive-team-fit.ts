// The user types only a major plus nine capability levels. The AI contract still
// needs roleTrack / strengths / experience, so we derive them here — one pure
// function shared by the browser preview and the server judgement.
import { TeamFitInputSchema, type TeamFitInput, type TeamMemberInput } from "../team-fit-contract.js";
import { CAPS, MAX_TEAM_SIZE_API, type CapCode } from "./catalog.js";
import { levelLabel, madlibsFilled, roleTrackOf } from "./rules.js";
import { madlibsAsIdea, type PreCp1Input, type PreCp1Member } from "./schemas.js";

const STRENGTH_LEVEL = 2;

const SHORT_LABEL: Record<CapCode, string> = {
  code: "làm web, app",
  design: "thiết kế hình ảnh",
  write: "viết nội dung",
  sell: "bán hàng, thuyết phục",
  interview: "hỏi chuyện người lạ",
  finance: "tính chi phí",
  ops: "giữ nhịp việc",
  craft: "làm đồ bằng tay",
  domain: "hiểu nghề",
};

/** Up to three capabilities at level 2+, strongest first, ties in catalog order. */
export function strengthsOf(member: PreCp1Member): string[] {
  const strong = CAPS
    .map((cap, index) => ({ cap, index, level: member.caps[cap.id] ?? 0 }))
    .filter((x) => x.level >= STRENGTH_LEVEL)
    .sort((a, b) => b.level - a.level || a.index - b.index)
    .slice(0, 3)
    .map((x) => `${SHORT_LABEL[x.cap.id]} (${levelLabel(x.level).toLowerCase()})`);
  return strong.length ? strong : ["chưa rõ mạnh việc gì"];
}

export function experienceOf(member: PreCp1Member): string[] {
  const extra = (member.extra ?? "").trim();
  return extra ? [extra] : [];
}

/** Why the AI cannot judge this team yet — one plain sentence, shown as-is. */
export function teamFitSkipReason(input: PreCp1Input): string | null {
  if (input.team.length === 0) return "Chưa nhập thành viên nào.";
  if (input.ideaMode !== "structured" || !madlibsFilled(input)) {
    return "Cần đủ sáu câu mô tả ý tưởng mới chấm được theo ngành.";
  }
  if (input.team.length > 6) {
    return "Phần đọc theo ngành xây cho nhóm 4–6 người; nhóm đông hơn chưa chấm được.";
  }
  if (input.team.length > MAX_TEAM_SIZE_API) return "Nhóm quá đông để chấm.";
  const missingTrack = input.team.some((member) => !roleTrackOf(member));
  if (missingTrack) return "Có người chưa rõ thuộc mảng công việc nào.";
  return null;
}

export function deriveTeamFitInput(input: PreCp1Input): TeamFitInput | null {
  if (teamFitSkipReason(input)) return null;
  const idea = madlibsAsIdea(input);
  if (!idea.success) return null;

  const team: TeamMemberInput[] = input.team.map((member) => ({
    roleTrack: roleTrackOf(member) as TeamMemberInput["roleTrack"],
    major: (member.major === "Ngành khác" ? member.majorOther : member.major)?.trim() || member.major,
    strengths: strengthsOf(member),
    experience: experienceOf(member),
  }));

  const parsed = TeamFitInputSchema.safeParse({ idea: idea.data, team });
  return parsed.success ? parsed.data : null;
}
