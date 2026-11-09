// Fixed rules for the unified start flow. Pure: no IO, no Date, no randomness,
// so the browser preview and the server recompute always agree.
// Thresholds are hypotheses, not measured: revisit after ~30 real runs.
import {
  ASSET_RULES,
  BUDGETS,
  CAPS,
  CORE_ROLES,
  IDEA_DOWNSCALE,
  IDEA_RULES,
  LEVELS,
  RECRUIT_ROLES,
  SENSITIVE,
  TEAM_RULES,
  TRACK_BY_MAJOR,
  type CapCode,
  type CoreRoleCode,
  type IdeaRuleId,
  type MajorLabel,
  type RecruitRoleCode,
} from "./catalog.js";
import { ASSET_ZONES, NET_ZONES, STRENGTH_ZONES, type ZoneText } from "./zone-text.js";
import type { RoleTrackCode } from "../role-tracks.js";
import type { PreCp1Input, PreCp1Member } from "./schemas.js";

export type FlagStatus = "ok" | "warn" | "hard" | "blocked";
export type IdeaModeOf = "none" | "draft" | "structured";

export interface PreCp1Flag {
  axis: string;
  status: FlagStatus;
  title: string;
  reason: string;
  fix: string;
}

export interface PreCp1Verdict {
  level: FlagStatus;
  title: string;
  detail: string;
}

export interface PreCp1Zone extends ZoneText {
  tag: "idea" | "pain" | "asset" | "net" | "strength";
}

export interface PreCp1RecruitRole {
  id: RecruitRoleCode;
  title: string;
  look: string;
  ask: string;
  why: string;
}

export interface PreCp1TeamRule {
  fpt: boolean;
  exe: boolean;
  size: number;
  majors: number;
  sizeOk: boolean;
  majorsOk: boolean;
  sizeMin: number | null;
  sizeMax: number | null;
  majorsMin: number;
}

export interface PreCp1CoverageRole {
  id: CoreRoleCode;
  label: string;
  duty: string;
  stage: string;
  need: string;
  members: number[];
}

export interface PreCp1Coverage {
  roles: PreCp1CoverageRole[];
  empty: CoreRoleCode[];
  single: CoreRoleCode[];
  overload: Array<{ i: number; roles: CoreRoleCode[] }>;
  want: number;
  need: number;
  /** null = the school sets no ceiling. Never Infinity: JSON round-trips it to null. */
  room: number | null;
  capped: boolean;
}

export interface PreCp1Report {
  version: 1;
  teamRule: PreCp1TeamRule;
  coverage: PreCp1Coverage;
  flags: PreCp1Flag[];
  verdict: PreCp1Verdict;
  recruit: PreCp1RecruitRole[];
  zones: PreCp1Zone[];
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export function clip(value: string | undefined, n = 90): string {
  const t = String(value ?? "").trim().replace(/\s+/g, " ");
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

export function madlibsFilled(input: PreCp1Input): boolean {
  const m = input.madlibs ?? {};
  return MAD_LIB_MIN.every((f) => (m[f.id] ?? "").trim().length >= f.min);
}

const MAD_LIB_MIN = [
  { id: "projectName", min: 2 }, { id: "field", min: 2 }, { id: "targetCustomer", min: 5 },
  { id: "problem", min: 10 }, { id: "solution", min: 10 }, { id: "mvp", min: 5 },
] as const;

/** Structured only when all six boxes reach their minimum; otherwise it is a draft. */
export function ideaModeOf(input: PreCp1Input): IdeaModeOf {
  if (input.ideaMode === "structured") return madlibsFilled(input) ? "structured" : "draft";
  return [input.pain, input.idea].some((t) => (t ?? "").trim()) ? "draft" : "none";
}

export function ideaTextOf(input: PreCp1Input): string {
  if (input.ideaMode !== "structured") {
    return [input.pain, input.idea].filter((t) => (t ?? "").trim()).join(". ");
  }
  const m = input.madlibs ?? {};
  return MAD_LIB_MIN.map((f) => (m[f.id] ?? "").trim()).filter(Boolean).join(". ");
}

export function ideaTitle(input: PreCp1Input): string {
  const m = input.madlibs ?? {};
  if (input.ideaMode === "structured" && (m.projectName ?? "").trim()) {
    return `${clip(m.projectName, 40)} — ${clip(m.problem, 70)}`;
  }
  return clip(input.idea || input.pain, 120);
}

/** Confirmed labels only: prod never guesses from the user's own wording. */
export function confirmedAssetIds(input: PreCp1Input) {
  return ASSET_RULES.filter((r) => input.assetTags[r.id] === "yes");
}

export function confirmedKinds(input: PreCp1Input): Set<IdeaRuleId> {
  return new Set(IDEA_RULES.filter((r) => input.ideaTags[r.id] === "yes").map((r) => r.id));
}

export function roleTrackOf(member: PreCp1Member): RoleTrackCode | "" {
  return member.roleTrackHint ?? TRACK_BY_MAJOR[member.major as MajorLabel] ?? "";
}

export function trackCoverage(input: PreCp1Input): Record<RoleTrackCode, number> {
  const counts: Record<RoleTrackCode, number> = { ky_thuat: 0, marketing: 0, kinh_doanh_tai_chinh: 0 };
  for (const member of input.team) {
    const track = roleTrackOf(member);
    if (track) counts[track] += 1;
  }
  return counts;
}

export function teamStats(input: PreCp1Input) {
  const best = {} as Record<CapCode, number>;
  const count = {} as Record<CapCode, number>;
  for (const cap of CAPS) { best[cap.id] = 0; count[cap.id] = 0; }
  for (const member of input.team) {
    for (const [cap, level] of Object.entries(member.caps)) {
      if (!level) continue;
      const id = cap as CapCode;
      best[id] = Math.max(best[id], level);
      count[id] += 1;
    }
  }
  return { best, count };
}

const COVER_LEVEL = 2;

export function teamRule(input: PreCp1Input): PreCp1TeamRule {
  const fpt = input.school === "fpt";
  const exe = fpt && input.course === "exe101";
  const size = input.team.length;
  const majors = new Set(
    input.team
      .map((m) => (m.major === "Ngành khác" ? (m.majorOther ?? "") : m.major).trim().toLowerCase())
      .filter(Boolean),
  ).size;
  return {
    fpt,
    exe,
    size,
    majors,
    sizeOk: !fpt || (size >= TEAM_RULES.sizeMin && size <= TEAM_RULES.sizeMax),
    majorsOk: !exe || majors >= TEAM_RULES.majorsMin,
    sizeMin: fpt ? TEAM_RULES.sizeMin : null,
    sizeMax: fpt ? TEAM_RULES.sizeMax : null,
    majorsMin: TEAM_RULES.majorsMin,
  };
}

export function computeCoverage(input: PreCp1Input): PreCp1Coverage {
  const rule = teamRule(input);
  const roles: PreCp1CoverageRole[] = CORE_ROLES.map((role) => ({
    id: role.id,
    label: role.label,
    duty: role.duty,
    stage: role.stage,
    need: role.need,
    members: input.team
      .map((member, i) => (role.caps.some((c) => (member.caps[c] ?? 0) >= COVER_LEVEL) ? i : -1))
      .filter((i) => i >= 0),
  }));

  const empty = roles.filter((r) => r.members.length === 0).map((r) => r.id);
  const single = roles.filter((r) => r.members.length === 1).map((r) => r.id);
  const overload = input.team
    .map((_, i) => ({ i, roles: roles.filter((r) => r.members.includes(i)).map((r) => r.id) }))
    .filter((x) => x.roles.length > 1 && x.roles.some((id) => single.includes(id)));
  const room = rule.sizeMax == null ? null : Math.max(0, rule.sizeMax - rule.size);
  const byLaw = rule.sizeMin == null ? 0 : Math.max(0, rule.sizeMin - rule.size);
  const want = Math.max(byLaw, empty.length);
  const need = room == null ? want : Math.min(want, room);
  return { roles, empty, single, overload, want, need, room, capped: want > need };
}

const mk = (axis: string, status: FlagStatus, title: string, reason: string, fix: string): PreCp1Flag =>
  ({ axis, status, title, reason, fix });

export function computeFlags(input: PreCp1Input): PreCp1Flag[] {
  const { best } = teamStats(input);
  const kinds = confirmedKinds(input);
  const assets = confirmedAssetIds(input).map((r) => r.id);
  const hasIdea = kinds.size > 0;
  const budget = BUDGETS.find((b) => b.id === input.budget)?.v ?? 0;
  const makerAsset = assets.includes("workshop") || assets.includes("lab");
  const hasMake = best.craft >= COVER_LEVEL || best.domain >= COVER_LEVEL || makerAsset;
  const flags: PreCp1Flag[] = [];

  if (kinds.has("physical") && !hasMake) {
    flags.push(mk("Năng lực của nhóm", "hard", "Chưa ai làm chắc việc chế tạo sản phẩm thật",
      "Ý tưởng cần làm ra vật thật bằng vật liệu hoặc máy móc. Hiện chưa ai trong nhóm làm chắc việc này, và chưa có xưởng hay phòng lab.",
      "Đừng tự chế tạo trong kỳ này. Thử bán hoặc phân phối sản phẩm có sẵn, hoặc làm dịch vụ đi kèm. Muốn chế tạo thật thì phải có một người làm chắc hoặc một chỗ làm ra sản phẩm."));
  } else if (kinds.has("ai") && best.code < 3) {
    flags.push(mk("Năng lực của nhóm", best.code < 2 ? "hard" : "warn", "Tự xây AI cần người làm chắc phần kỹ thuật",
      best.code < 2 ? "Chưa ai trong nhóm viết code ở mức làm được. Tự xây một hệ thống AI là việc rất nặng." : "Nhóm có người viết code nhưng chưa ai làm chắc. Hệ thống AI thật cần nhiều dữ liệu và nhiều lần thử.",
      "Dùng công cụ AI có sẵn hoặc làm tay trước để kiểm tra người ta có cần không. Chưa cần tự xây AI."));
  } else if (kinds.has("software") && best.code < 2) {
    flags.push(mk("Năng lực của nhóm", "hard", "Muốn làm phần mềm nhưng chưa ai viết được",
      "Ý tưởng là website hoặc app. Chưa ai trong nhóm chọn “làm được” trở lên ở mục làm website, app.",
      "Bắt đầu bằng bảng Sheet, biểu mẫu Google hoặc tin nhắn Zalo làm tay. Muốn làm app thật thì tuyển một người viết code."));
  } else if (!hasIdea && best.code < 2 && !hasMake) {
    flags.push(mk("Năng lực của nhóm", "warn", "Chưa ai trực tiếp làm ra sản phẩm",
      "Chưa ai chọn “làm được” trở lên ở việc làm website hoặc làm đồ thật.",
      "Bắt đầu bằng dịch vụ làm tay. Hoặc tuyển một người làm ra sản phẩm, xem mục “Nên tuyển thêm ai”."));
  } else {
    flags.push(mk("Năng lực của nhóm", "ok", "Chưa thấy chỗ nào lệch quá", "Năng lực trong nhóm không mâu thuẫn với hướng bạn nêu.", "Vẫn nên chia việc rõ ràng ngay từ đầu."));
  }

  const heavy = (["physical", "logistics", "marketplace", "superapp"] as IdeaRuleId[]).some((k) => kinds.has(k));
  if (kinds.has("physical") && budget <= 1 && !makerAsset) {
    flags.push(mk("Tiền và nguồn lực", "hard", "Làm đồ thật cần tiền và máy móc nhiều hơn bạn đang có",
      "Làm đồ thật cần nguyên liệu, máy, và nhiều lần làm thử hỏng. Ngân sách của nhóm hiện rất nhỏ.",
      "Chưa chọn hướng tự sản xuất. Thử bán sản phẩm làm sẵn hoặc làm dịch vụ liên quan trước."));
  } else if (heavy && budget <= 1) {
    flags.push(mk("Tiền và nguồn lực", "warn", "Hướng này thường tốn tiền để chạy thử",
      "Giao hàng, sàn kết nối hoặc hệ thống lớn đều cần tiền và người vận hành.", "Chọn một phần nhỏ nhất và làm tay bằng nhóm Zalo trước."));
  } else if (!hasIdea && budget === 0) {
    flags.push(mk("Tiền và nguồn lực", "warn", "Gần như không có tiền",
      "Không có vốn thì chỉ nên chọn hướng làm tay, không cần mua gì.", "Ưu tiên dịch vụ làm tay, bảng Sheet, nhóm Zalo."));
  } else {
    flags.push(mk("Tiền và nguồn lực", "ok", "Tiền vừa đủ cho một lần thử nhỏ", "Chưa thấy hướng nào vượt quá ngân sách bạn khai.", "Ghi lại mỗi khoản đã chi để biết khi nào nên dừng."));
  }

  const timeHeavy = (["superapp", "marketplace", "logistics", "physical", "ai"] as IdeaRuleId[]).some((k) => kinds.has(k));
  if (timeHeavy) {
    const huge = kinds.has("superapp");
    flags.push(mk("Thời gian", huge ? "hard" : "warn", huge ? "Khó xong trong một học kỳ" : "Hướng này ngốn thời gian hơn vẻ ngoài của nó",
      "Hướng này cần nhiều tuần làm, nhiều lần thử. Kỳ nào nhiều môn nặng và deadline dày thì rất dễ trễ.", "Thu nhỏ còn một việc thử được trong 1 tuần, và đặt mốc theo từng tuần."));
  } else {
    flags.push(mk("Thời gian", "ok", "Thời gian không phải vấn đề lớn", "Hướng này làm được từng phần nhỏ.", "Đặt hạn cho từng việc, đừng để dồn cuối kỳ."));
  }

  const sensitive = input.sensitive.filter((x) => x !== "none");
  if (kinds.has("forbidden") || kinds.has("illegal")) {
    flags.push(mk("Luật và an toàn", "blocked", "Hướng này nằm ngoài những gì Nexus có thể hỗ trợ",
      kinds.has("forbidden") ? "Liên quan vũ khí, chất nổ, hạt nhân hoặc chất cấm: không hợp pháp với người không có giấy phép và cực kỳ nguy hiểm." : "Có thể vi phạm pháp luật hoặc bản quyền.",
      "Giữ lại nhu cầu phía sau (ví dụ cần điện, cần an toàn, cần học tốt hơn) và nghĩ lại cách giải quyết hợp pháp."));
  } else if (kinds.has("regulated") || sensitive.some((x) => x === "health" || x === "money")) {
    flags.push(mk("Luật và an toàn", "warn", "Lĩnh vực cần giấy phép hoặc rất cẩn thận",
      "Liên quan sức khoẻ hoặc tiền bạc của người khác. Sai sót có thể gây hại thật.", "Chỉ làm phần thông tin chung hoặc tìm hiểu, không đưa lời khuyên chuyên môn. Hỏi thầy cô trước khi đi tiếp."));
  } else if (sensitive.length) {
    const labels = sensitive.map((x) => (SENSITIVE.find((s) => s.id === x)?.label ?? x).toLowerCase()).join(", ");
    flags.push(mk("Luật và an toàn", "warn", "Có điểm cần kiểm tra", `Bạn đã đánh dấu: ${labels}.`, "Đọc kỹ quy định liên quan trước khi bán hoặc thu thập dữ liệu."));
  } else {
    flags.push(mk("Luật và an toàn", "ok", "Chưa thấy vấn đề", "Chưa thấy điểm nào đụng đến luật hoặc an toàn.", "Nếu sau này đổi hướng, hãy kiểm tra lại mục này."));
  }

  const groups: string[] = [...input.network];
  if ((input.networkOther ?? "").trim()) groups.push("other");
  const knowsDecider = groups.includes("work") || groups.includes("mentor");
  if (kinds.has("b2bLarge") && !knowsDecider) {
    flags.push(mk("Gặp được khách", "hard", "Chưa thấy đường tới người ra quyết định",
      "Khách là doanh nghiệp hoặc cơ quan lớn. Bạn chưa chọn nhóm người nào (nơi làm thêm, thầy cô, người đi làm) có thể dẫn tới họ.", "Hạ khách xuống nhóm tiếp cận được ngay: chủ quán nhỏ, bạn cùng lớp, người bán online."));
  } else if (!groups.length) {
    flags.push(mk("Gặp được khách", "warn", "Chưa có nhóm người nào để hỏi", "Không có người để hỏi thì mọi hướng đều chỉ là đoán.",
      "Nhờ bạn bè giới thiệu hoặc đi hỏi thẳng chủ quán nhỏ quanh trường."));
  } else {
    flags.push(mk("Gặp được khách", "ok", "Có nhóm người để hỏi", "Bạn đã chọn những nhóm người có thể trò chuyện cùng.", "Nhớ hỏi người thật, đừng chỉ nhờ bạn bè nói cho vui."));
  }
  return flags;
}

const RANK: Record<FlagStatus, number> = { ok: 0, warn: 1, hard: 2, blocked: 3 };

export function verdict(flags: PreCp1Flag[]): PreCp1Verdict {
  const worst = flags.reduce<number>((m, f) => Math.max(m, RANK[f.status]), 0) as 0 | 1 | 2 | 3;
  return [
    { level: "ok", title: "Chưa thấy chỗ nào quá vô lý", detail: "Nhưng đây chưa phải xác nhận có khách cần. Phần đó chỉ biết sau khi bạn đi hỏi người thật." },
    { level: "warn", title: "Làm được, nhưng cần chú ý vài chỗ", detail: "Đọc các mục màu vàng và làm theo cách xử lý." },
    { level: "hard", title: "Có chỗ rất khó", detail: "Đừng bỏ ngay. Mỗi chỗ khó đều có cách đổi hướng nhỏ hơn bên dưới." },
    { level: "blocked", title: "Hướng này nằm ngoài khả năng hỗ trợ", detail: "Hãy giữ lại nhu cầu phía sau và nghĩ cách khác. Xem gợi ý bên dưới." },
  ][worst] as PreCp1Verdict;
}

/** Max four hypotheses: each one is something to go and check, not a conclusion. */
export function computeZones(input: PreCp1Input): PreCp1Zone[] {
  const zones: PreCp1Zone[] = [];
  const used = new Set<string>();
  const add = (zone: ZoneText, tag: PreCp1Zone["tag"]) => {
    if (zones.length >= 4 || used.has(zone.title)) return;
    used.add(zone.title);
    zones.push({ ...zone, tag });
  };
  const kinds = confirmedKinds(input);
  const downscaled = (["ai", "physical", "marketplace", "superapp", "logistics", "b2bLarge", "software", "regulated"] as IdeaRuleId[])
    .filter((k) => kinds.has(k))
    .flatMap((k) => (IDEA_DOWNSCALE[k] ? [IDEA_DOWNSCALE[k] as string] : []));

  if (ideaModeOf(input) !== "none") {
    const forbidden = kinds.has("forbidden") || kinds.has("illegal");
    add({
      title: forbidden ? "Nhu cầu phía sau ý tưởng của bạn" : "Ý tưởng nháp của bạn, thu nhỏ lại",
      prose: forbidden
        ? `Từ ý tưởng “${clip(ideaTitle(input), 60)}” bạn đã nêu, cách an toàn là dừng lại ở việc viết rõ nhu cầu của chính mình, tức là bạn đang muốn giải quyết chuyện gì cho ai. Sau khi ghi rõ nhu cầu đó, bạn mới đi tìm cách giải quyết hợp pháp và vừa sức.`
        : `Từ ý tưởng “${clip(ideaTitle(input), 60)}” bạn đã nêu, trước hết hãy tới hỏi người bạn muốn phục vụ, rồi làm bản thử nhỏ nhất chứ đừng vội làm lớn. Bản thử đó là ${downscaled.length ? downscaled.join("; ") : "giữ nguyên ý tưởng nhưng chỉ thử với 5 người đầu tiên"}. Điều cần kiểm chứng là ý tưởng này giúp được ai trong số họ, và hiện tại họ đang xử lý chuyện đó bằng cách nào.`,
    }, "idea");
  }
  if ((input.pain ?? "").trim()) {
    add({
      title: "Điều khó chịu bạn đã kể",
      prose: `“${clip(input.pain, 60)}” — câu chuyện bạn kể là chuyện không phải chỉ mình bạn gặp, nên trước hết hãy hỏi thêm vài người cũng đang gặp chuyện này xem họ có gặp tương tự không. Bạn chưa cần nghĩ giải pháp lúc này; điều cần kiểm chứng là chuyện này xảy ra bao lâu một lần và họ đang tạm xử lý bằng cách nào.`,
    }, "pain");
  }
  for (const rule of confirmedAssetIds(input)) add(ASSET_ZONES[rule.id], "asset");
  if ((input.assetsOther ?? "").trim()) {
    add({
      title: "Nguồn lực bạn kể thêm",
      prose: `“${clip(input.assetsOther, 60)}” — thứ này không nằm trong danh sách nên mình chưa biết nó mạnh tới đâu. Hỏi người liên quan hai câu: họ đang có khách từ đâu, và việc gì trong nghề đó tốn thời gian nhất.`,
    }, "asset");
  }
  for (const id of input.network) add(NET_ZONES[id], "net");
  const { best } = teamStats(input);
  for (const cap of ["sell", "design", "code", "ops", "craft"] as CapCode[]) {
    const zone = STRENGTH_ZONES[cap as keyof typeof STRENGTH_ZONES];
    if (best[cap] >= COVER_LEVEL && zone) add(zone, "strength");
  }
  return zones.slice(0, 4);
}

export function computeRecruit(input: PreCp1Input): PreCp1RecruitRole[] {
  const { best } = teamStats(input);
  const kinds = confirmedKinds(input);
  const assets = confirmedAssetIds(input).map((r) => r.id);
  const makerAsset = assets.includes("workshop") || assets.includes("lab");
  const roles: Array<[RecruitRoleCode, string]> = [];
  const noMaker = best.code < 2 && best.craft < 2 && best.domain < 2 && !makerAsset;

  if (kinds.has("physical") && best.craft < 2 && !makerAsset) roles.push(["maker_physical", "Ý tưởng cần làm đồ thật mà chưa ai làm chắc việc đó."]);
  else if ((kinds.has("ai") || kinds.has("software")) && best.code < 2) roles.push(["maker_digital", "Ý tưởng là sản phẩm số mà chưa ai làm được phần kỹ thuật."]);
  else if (noMaker) roles.push(["maker_any", "Hiện chưa ai trong nhóm trực tiếp làm ra sản phẩm."]);

  const cov = computeCoverage(input);
  const hasMakerRole = roles.some(([r]) => r.startsWith("maker"));
  if (cov.empty.includes("reach")) {
    roles.push(["talker", "Chưa ai trong nhóm ở mức “làm được” ở việc nói chuyện, bán hàng, hỏi chuyện người lạ. Mà sắp tới phải đi hỏi khách thật."]);
  }
  if (best.ops < 2 && best.write < 2) roles.push(["organizer", "Chưa ai giữ nhịp việc hoặc viết tài liệu ở mức làm được."]);
  if ((kinds.has("physical") || kinds.has("marketplace") || kinds.has("logistics")) && best.finance < 2) {
    roles.push(["numbers", "Hướng này dễ lỗ nếu không ai tính chi phí."]);
  }
  if (cov.empty.includes("build") && !hasMakerRole) {
    roles.push(["maker_any", "Nhóm chưa có ai trực tiếp làm ra sản phẩm, tới lúc khách cần dùng thử thì không ai làm được."]);
  }
  if (cov.empty.includes("money") && !roles.some(([r]) => r === "numbers")) {
    roles.push(["numbers", "Nhóm chưa có ai tính tiền, tới lúc làm chi phí, giá bán và kế hoạch thì không ai làm được."]);
  }
  return roles.map(([id, why]) => ({ id, ...RECRUIT_ROLES[id], why }));
}

export function recruitPost(input: PreCp1Input, role: PreCp1RecruitRole): string {
  const n = input.team.length;
  const { best } = teamStats(input);
  const strengths = CAPS.filter((c) => best[c.id] >= COVER_LEVEL)
    .map((c) => c.label.toLowerCase())
    .slice(0, 3);
  return `[Tìm bạn cùng nhóm] ${n > 1 ? `Nhóm mình hiện có ${n} người` : "Mình đang làm một mình"}, làm dự án môn khởi nghiệp. Đang thiếu: ${role.title.toLowerCase()}. `
    + `Bạn chỉ cần biết ${role.ask} ở mức làm được. `
    + (strengths.length ? `Phía mình có người ${strengths.join("; ")}. ` : "")
    + "Nếu bạn quan tâm, nhắn mình để nói chuyện 15 phút.";
}

export function buildPreCp1Report(input: PreCp1Input): PreCp1Report {
  const flags = computeFlags(input);
  return {
    version: 1,
    teamRule: teamRule(input),
    coverage: computeCoverage(input),
    flags,
    verdict: verdict(flags),
    recruit: computeRecruit(input),
    zones: computeZones(input),
  };
}

export function levelLabel(level: number): string {
  return LEVELS.find((l) => l.v === level)?.label ?? "";
}
