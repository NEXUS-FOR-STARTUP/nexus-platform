// Catalog for the unified start flow (pre-CP1 team + idea check).
// Ids are stable English codes: they are stored in reports and must not change.
import { ROLE_TRACK_CODES, ROLE_TRACK_LABELS } from "../role-tracks.js";
import type { RoleTrackCode } from "../role-tracks.js";

export const SCHOOL_CODES = ["fpt", "other"] as const;
export type SchoolCode = (typeof SCHOOL_CODES)[number];

export const COURSE_CODES = ["exe101", "other"] as const;
export type CourseCode = (typeof COURSE_CODES)[number];

export const GOAL_CODES = ["pass", "real", "unsure"] as const;
export type GoalCode = (typeof GOAL_CODES)[number];

export const BUDGET_CODES = ["b0", "b1", "b2", "b3"] as const;
export type BudgetCode = (typeof BUDGET_CODES)[number];

export const IDEA_MODES = ["none", "draft", "structured"] as const;
export type IdeaMode = (typeof IDEA_MODES)[number];

/** 4–6 people and ≥2 majors is FPT's school rule (EXE101), not a rule of the flow. */
export const TEAM_RULES = { sizeMin: 4, sizeMax: 6, majorsMin: 2 } as const;

/** Technical ceiling of the API. Other schools have no ceiling of their own. */
export const MAX_TEAM_SIZE_API = 50;

/**
 * Ceilings the input contract enforces. The forms cap their inputs at the same
 * numbers, so a long answer stops at the field instead of failing on the last screen.
 */
export const TEXT_LIMITS = {
  name: 40,
  majorOther: 60,
  extra: 200,
  schoolName: 60,
  courseName: 60,
  assetAnswer: 600,
  assetsOther: 300,
  networkOther: 200,
  idea: 600,
  madlib: 1000,
} as const;

export const CAPS = [
  { id: "code", label: "Làm website, app, bảng tính tự động", hint: "Viết code, hoặc dùng thành thạo Google Sheet, Notion, công cụ no-code" },
  { id: "design", label: "Thiết kế hình ảnh, slide, dựng video", hint: "Canva, Figma, CapCut, chụp ảnh…" },
  { id: "write", label: "Viết bài, soạn nội dung, làm báo cáo", hint: "Viết rõ ràng, tóm tắt gọn, soạn tài liệu" },
  { id: "sell", label: "Nói chuyện, thuyết phục, bán hàng", hint: "Giới thiệu sản phẩm, chốt đơn, thuyết trình" },
  { id: "interview", label: "Làm quen và hỏi chuyện người lạ", hint: "Dám bắt chuyện, hỏi đến nơi đến chốn, ghi lại được" },
  { id: "finance", label: "Tính chi phí, giá bán, sổ sách", hint: "Biết tính lời lỗ, lập bảng chi tiêu" },
  { id: "ops", label: "Giữ nhịp việc cho cả nhóm", hint: "Chia việc, nhắc hạn, theo sát đến khi xong" },
  { id: "craft", label: "Làm đồ thật: thủ công, nấu ăn, chế tạo", hint: "Dùng tay hoặc dụng cụ để làm ra sản phẩm thật" },
  { id: "domain", label: "Hiểu sâu một nghề hoặc một lĩnh vực", hint: "Ví dụ: nông nghiệp, y tế, luật, bếp núc, cơ khí" },
] as const;

export const CAP_CODES = [
  "code", "design", "write", "sell", "interview", "finance", "ops", "craft", "domain",
] as const;
export type CapCode = (typeof CAP_CODES)[number];

export const LEVELS = [
  { v: 1, label: "Mới biết" },
  { v: 2, label: "Làm được" },
  { v: 3, label: "Làm chắc" },
] as const;

/** From "làm được" (2) up counts as being able to carry a role. */
export const COVER_LEVEL = 2;

export const GOALS = [
  { id: "pass", title: "Chủ yếu để qua môn", sub: "Cần một dự án vừa sức, làm xong đúng hạn." },
  { id: "real", title: "Muốn làm thật, có thể làm tiếp sau môn", sub: "Chấp nhận vất vả hơn để có thứ dùng được." },
  { id: "unsure", title: "Chưa biết, đang tìm hiểu", sub: "Không sao. Bạn có thể đổi ý sau." },
] as const;

export const BUDGETS = [
  { id: "b0", title: "Gần như không tốn tiền", sub: "Chỉ dùng đồ miễn phí.", v: 0 },
  { id: "b1", title: "Dưới 500,000 VND", sub: "Đủ in vài tờ rơi hoặc chạy thử quảng cáo nhỏ.", v: 1 },
  { id: "b2", title: "500,000 VND đến 2,000,000 VND", sub: "Đủ mua nguyên liệu làm thử.", v: 2 },
  { id: "b3", title: "Trên 2,000,000 VND", sub: "Có thể thuê người làm giúp một phần.", v: 3 },
] as const;

/** Fixed list so counting majors never splits "CNTT" / "IT" into two majors. */
export const MAJORS = [
  "Công nghệ thông tin",
  "Kỹ thuật phần mềm",
  "An toàn thông tin",
  "Trí tuệ nhân tạo",
  "Kinh doanh",
  "Tài chính - Ngân hàng",
  "Marketing",
  "Thiết kế đồ hoạ",
  "Ngành khác",
] as const;
export type MajorLabel = (typeof MAJORS)[number];

/** Majors whose work track the user must pick, because no fixed map is honest. */
export const ASKED_MAJORS: readonly MajorLabel[] = ["Ngành khác"];

export const TRACKS = ROLE_TRACK_CODES.map((id) => ({
  id,
  label: ROLE_TRACK_LABELS[id],
}));

/** Graphic design maps to engineering: the core work is still making the product. */
export const TRACK_BY_MAJOR: Partial<Record<MajorLabel, RoleTrackCode>> = {
  "Công nghệ thông tin": "ky_thuat",
  "Kỹ thuật phần mềm": "ky_thuat",
  "An toàn thông tin": "ky_thuat",
  "Trí tuệ nhân tạo": "ky_thuat",
  "Kinh doanh": "kinh_doanh_tai_chinh",
  "Tài chính - Ngân hàng": "kinh_doanh_tai_chinh",
  "Marketing": "marketing",
  "Thiết kế đồ hoạ": "ky_thuat",
};

export const TRACK_WORK: Record<RoleTrackCode, string> = {
  ky_thuat: "phần làm ra sản phẩm và phần thiết kế",
  marketing: "phần nói cho khách hiểu và phần hình ảnh",
  kinh_doanh_tai_chinh: "phần tính giá, chi phí và kế hoạch",
};

/** The six boxes of the Mad Libs form — same fields (and min lengths) as IdeaInputSchema. */
export const MAD_LIBS = [
  { id: "projectName", n: "Dự án tạm gọi là gì?", min: 2, ph: "Ví dụ: Quán Xanh" },
  { id: "field", n: "Nó ở lĩnh vực nào?", min: 2, ph: "Ví dụ: đồ uống, quản lý quán, học tập" },
  { id: "targetCustomer", n: "Bạn làm cho ai? Càng cụ thể càng tốt.", min: 5, ph: "Ví dụ: quán cà phê nhỏ quanh trường có 1–3 nhân viên" },
  { id: "problem", n: "Họ đang gặp chuyện gì?", min: 10, ph: "Ví dụ: khách đặt món qua ba kênh khác nhau, chủ quán phải nhớ bằng đầu nên hay làm sót." },
  { id: "solution", n: "Bạn định giải quyết bằng cách nào?", min: 10, ph: "Ví dụ: một bảng Sheet chung và tin nhắn Zalo nhắc đơn, làm tay trước." },
  { id: "mvp", n: "Bản thử nhỏ nhất làm được trong 2 tuần là gì?", min: 5, ph: "Ví dụ: một quán quen dùng thử Sheet ghi đơn trong 1 tuần." },
] as const;

export const MAD_LIB_IDS = [
  "projectName", "field", "targetCustomer", "problem", "solution", "mvp",
] as const;
export type MadLibId = (typeof MAD_LIB_IDS)[number];

export const CORE_ROLE_CODES = ["build", "reach", "money"] as const;
export type CoreRoleCode = (typeof CORE_ROLE_CODES)[number];

export const CORE_ROLES = [
  {
    id: "build", label: "làm ra sản phẩm", duty: "phần làm sản phẩm", caps: ["code", "craft"],
    stage: "lúc làm sản phẩm cho khách dùng thử",
    need: "một người trực tiếp làm ra thứ khách dùng được, bằng code hoặc bằng tay",
  },
  {
    id: "reach", label: "đi gặp khách và hỏi chuyện", duty: "phần gặp khách", caps: ["sell", "interview"],
    stage: "lúc đi phỏng vấn khách",
    need: "một người dám đi gặp khách và hỏi chuyện người lạ",
  },
  {
    id: "money", label: "tính tiền và lập kế hoạch", duty: "phần tính tiền", caps: ["finance"],
    stage: "lúc tính chi phí, giá bán và làm kế hoạch",
    need: "một người tính được chi phí, giá bán và dòng tiền",
  },
] as const satisfies ReadonlyArray<{
  id: CoreRoleCode; label: string; duty: string; caps: readonly CapCode[]; stage: string; need: string;
}>;

export const ASSET_PROMPTS = [
  {
    id: "family", title: "Gia đình hoặc họ hàng của bạn hoặc các bạn trong nhóm làm nghề gì?",
    why: "Nhiều nhóm tìm ra hướng đi từ chính nghề của gia đình. Bạn thấy bình thường, nhưng người ngoài thì không có.",
    ph: "Ví dụ: Nhà mình mở cửa hàng bán vật tư nông nghiệp ở quê. Mình thường phụ bán cuối tuần.",
  },
  {
    id: "work", title: "Ai trong nhóm từng làm thêm, bán hàng hoặc làm việc gì ngoài trường?",
    why: "Việc đã làm thật cho biết bạn hiểu khách hàng nào và quy trình nào.",
    ph: "Ví dụ: Mình làm phục vụ quán cà phê 1 năm. Mình có bán đồ handmade trên Facebook.",
  },
  {
    id: "people", title: "Nhóm quen ai làm nghề đặc biệt, hoặc có thể nhờ giúp?",
    why: "Một người quen đúng nghề có thể thay cho cả tháng tự mò.",
    ph: "Ví dụ: Cô mình là kế toán. Anh họ có xưởng mộc nhỏ. Bạn thân đang làm ở nhà thuốc.",
  },
  {
    id: "tools", title: "Ai trong nhóm có sẵn dụng cụ, máy móc, chỗ làm nào không?",
    why: "Máy móc hoặc chỗ làm sẵn có giúp bạn làm được những thứ nhóm khác không dám nghĩ tới.",
    ph: "Ví dụ: Nhà có máy may. Mình dùng được phòng lab ở trường. Mình có máy in 3D.",
  },
  {
    id: "own", title: "Ai trong nhóm có sở thích hoặc kiến thức riêng mà người khác thường không có?",
    why: "Người hiểu rõ một thứ thường nhìn ra điều khó chịu mà người ngoài không thấy.",
    ph: "Ví dụ: Mình chơi nhiều năm với cây cảnh. Mình rành giày sneaker. Mình học nấu ăn chay.",
  },
] as const;

export const ASSET_PROMPT_IDS = ["family", "work", "people", "tools", "own"] as const;
export type AssetPromptId = (typeof ASSET_PROMPT_IDS)[number];

/** Asset labels the AI may assign; the user confirms every one of them. */
export const ASSET_RULES = [
  { id: "agri", label: "Cửa hàng hoặc nghề nông nghiệp" },
  { id: "fnb", label: "Quán ăn, quán cà phê, bếp" },
  { id: "retail", label: "Cửa hàng, tiệm bán lẻ" },
  { id: "online", label: "Bán hàng online" },
  { id: "print", label: "Tiệm in, photo" },
  { id: "beauty", label: "Spa, tóc, làm đẹp" },
  { id: "auto", label: "Xe cộ, sửa xe" },
  { id: "tutoring", label: "Dạy học, gia sư" },
  { id: "workshop", label: "Xưởng, máy móc" },
  { id: "lab", label: "Phòng thí nghiệm, phòng lab" },
  { id: "fashion", label: "May mặc, thời trang, vải" },
  { id: "hospitality", label: "Du lịch, homestay, khách sạn" },
  { id: "health", label: "Phòng khám, nhà thuốc" },
  { id: "pro", label: "Kế toán, luật, văn phòng" },
  { id: "dorm", label: "Ký túc xá, nhà trọ" },
  { id: "club", label: "CLB, đội nhóm, sự kiện" },
] as const;

export const ASSET_RULE_IDS = [
  "agri", "fnb", "retail", "online", "print", "beauty", "auto", "tutoring",
  "workshop", "lab", "fashion", "hospitality", "health", "pro", "dorm", "club",
] as const;
export type AssetRuleId = (typeof ASSET_RULE_IDS)[number];

export const NET_OPTIONS = [
  { id: "classmates", label: "Bạn cùng lớp, cùng trường" },
  { id: "dorm", label: "Người ở ký túc xá, xóm trọ" },
  { id: "eatery", label: "Quán ăn, quán cà phê quen" },
  { id: "online", label: "Người bán hàng online quen" },
  { id: "club", label: "CLB, đội nhóm, người làm sự kiện" },
  { id: "family", label: "Gia đình, họ hàng đang kinh doanh nhỏ" },
  { id: "work", label: "Nơi bạn làm thêm" },
  { id: "mentor", label: "Thầy cô, người đi làm quen biết" },
] as const;

export const NET_IDS = [
  "classmates", "dorm", "eatery", "online", "club", "family", "work", "mentor",
] as const;
export type NetId = (typeof NET_IDS)[number];

export const SENSITIVE = [
  { id: "health", label: "Thuốc, bệnh, khám chữa bệnh" },
  { id: "money", label: "Tiền bạc, đầu tư, cho vay" },
  { id: "food", label: "Thực phẩm, đồ uống bán ra thị trường" },
  { id: "data", label: "Thông tin cá nhân, ảnh trẻ em" },
  { id: "copyright", label: "Tài liệu có bản quyền, đề thi, bài làm của người khác" },
  { id: "none", label: "Không có mục nào ở trên" },
] as const;

export const SENSITIVE_IDS = ["health", "money", "food", "data", "copyright", "none"] as const;
export type SensitiveId = (typeof SENSITIVE_IDS)[number];

export const IDEA_RULES = [
  { id: "forbidden", label: "Có liên quan vũ khí, chất nổ, hạt nhân hoặc chất cấm" },
  { id: "illegal", label: "Có thể vi phạm pháp luật hoặc bản quyền" },
  { id: "ai", label: "Có tự xây phần AI" },
  { id: "physical", label: "Làm ra sản phẩm thật bằng vật liệu hoặc máy móc" },
  { id: "marketplace", label: "Sàn kết nối người mua và người bán" },
  { id: "superapp", label: "Cả hệ thống lớn làm cùng một lúc" },
  { id: "logistics", label: "Giao hàng hoặc vận chuyển" },
  { id: "b2bLarge", label: "Bán cho doanh nghiệp lớn hoặc cơ quan lớn" },
  { id: "regulated", label: "Dính đến sức khoẻ hoặc tiền bạc người khác" },
  { id: "software", label: "Là website, app hoặc phần mềm" },
] as const;

export const IDEA_RULE_IDS = [
  "forbidden", "illegal", "ai", "physical", "marketplace", "superapp",
  "logistics", "b2bLarge", "regulated", "software",
] as const;
export type IdeaRuleId = (typeof IDEA_RULE_IDS)[number];

export const RECRUIT_ROLE_CODES = [
  "maker_digital", "maker_physical", "maker_any", "talker", "organizer", "numbers",
] as const;
export type RecruitRoleCode = (typeof RECRUIT_ROLE_CODES)[number];

export const RECRUIT_ROLES: Record<RecruitRoleCode, { title: string; look: string; ask: string }> = {
  maker_digital: {
    title: "Người làm ra sản phẩm số (web, app, bảng tính tự động)",
    look: "“Bạn đã tự làm được thứ gì chạy thật chưa? Cho mình xem.” Một sản phẩm nhỏ đã làm xong có giá trị hơn một bảng điểm đẹp.",
    ask: "làm web, app hoặc bảng tính tự động",
  },
  maker_physical: {
    title: "Người làm ra sản phẩm thật (thủ công, nấu ăn, chế tạo) hoặc có xưởng",
    look: "“Bạn đã tự làm ra món gì bằng tay chưa? Có chỗ làm không?”",
    ask: "làm đồ bằng tay hoặc có chỗ làm",
  },
  maker_any: {
    title: "Người trực tiếp làm ra sản phẩm",
    look: "“Bạn đã tự làm được thứ gì dùng được chưa?” Tuỳ hướng sau này mà là code hay làm thủ công.",
    ask: "trực tiếp làm ra sản phẩm",
  },
  talker: {
    title: "Người nói chuyện và gặp khách",
    look: "“Tuần trước bạn có bắt chuyện với người lạ để hỏi một việc gì không?”",
    ask: "nói chuyện, gặp khách",
  },
  organizer: {
    title: "Người giữ nhịp việc và soạn tài liệu",
    look: "“Bạn đã từng giữ việc cho một nhóm đến khi xong chưa? Lần gần nhất thế nào?”",
    ask: "giữ tiến độ và viết tài liệu",
  },
  numbers: {
    title: "Người tính tiền",
    look: "“Nếu bán một cái giá X, nhóm lời hay lỗ bao nhiêu? Bạn tính thế nào?”",
    ask: "tính chi phí và giá bán",
  },
};

export const INTERVIEW_QUESTIONS = [
  "Khi làm [việc X], điều gì làm bạn khó chịu hoặc mất thời gian nhất?",
  "Lần gần nhất bạn gặp chuyện đó là khi nào? Hôm đó chuyện gì đã xảy ra?",
  "Hiện giờ bạn xử lý chuyện đó bằng cách nào?",
  "Cách đó bất tiện ở chỗ nào, và bao lâu bạn gặp một lần?",
  "Bạn đã từng bỏ tiền, thời gian hay công sức để giải quyết chuyện này chưa? Cụ thể là gì?",
] as const;

/** Ways an idea gets smaller — used when the idea itself is too heavy for one semester. */
export const IDEA_DOWNSCALE: Partial<Record<IdeaRuleId, string>> = {
  ai: "việc làm tay hoặc dùng công cụ AI có sẵn, còn việc tự xây AI thì chưa",
  physical: "việc bán hoặc phân phối sản phẩm có sẵn, hoặc làm dịch vụ đi kèm, thay vì tự sản xuất",
  marketplace: "việc làm người trung gian thủ công qua nhóm Zalo để kết nối vài người đầu tiên",
  superapp: "một việc nhỏ nhất trong cả hệ thống đó, làm bằng Google Sheet",
  logistics: "việc gom đơn theo nhóm nhỏ qua Zalo, chưa tự giao hàng",
  b2bLarge: "nhóm khách gặp được ngay như chủ quán nhỏ, bạn cùng lớp và người bán online",
  software: "bản Sheet, Form hoặc trang web một trang trước khi làm app",
  regulated: "phần thông tin chung hoặc hỗ trợ việc không cần giấy phép",
};
