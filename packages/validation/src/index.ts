import { z } from 'zod';

// ---------------------------------------------------------------------------
// Team role tracks — shared code ↔ label map (FE + BE)
// ---------------------------------------------------------------------------

export const ROLE_TRACK_CODES = [
  "ky_thuat",
  "marketing",
  "kinh_doanh_tai_chinh",
] as const;

export type RoleTrackCode = (typeof ROLE_TRACK_CODES)[number];

export const ROLE_TRACK_LABELS: Record<RoleTrackCode, string> = {
  ky_thuat: "Kỹ thuật",
  marketing: "Marketing",
  kinh_doanh_tai_chinh: "Kinh doanh – Tài chính",
};

// ---------------------------------------------------------------------------
// Team-Idea Fit — input schemas shared between frontend + API
// ---------------------------------------------------------------------------

export const IdeaInputSchema = z.object({
  projectName: z.string().min(2).max(200),
  field: z.string().min(2).max(100),
  targetCustomer: z.string().min(5).max(500),
  problem: z.string().min(10).max(1000),
  solution: z.string().min(10).max(1000),
  mvp: z.string().min(5).max(500),
});

export type IdeaInput = z.infer<typeof IdeaInputSchema>;

export const TeamMemberInputSchema = z.object({
  roleTrack: z.enum(ROLE_TRACK_CODES),
  major: z.string().min(2).max(100),
  strengths: z
    .array(z.string().min(2).max(200))
    .min(1)
    .max(10),
  experience: z
    .array(z.string().min(2).max(500))
    .max(10),
});

export type TeamMemberInput = z.infer<typeof TeamMemberInputSchema>;

export const TeamFitInputSchema = z.object({
  idea: IdeaInputSchema,
  team: z.array(TeamMemberInputSchema).min(1).max(6),
});

export type TeamFitInput = z.infer<typeof TeamFitInputSchema>;

// ---------------------------------------------------------------------------
// Team-Idea Fit Free — AI judgement (AI generates ONLY these 4 fields)
// Codes are stable machine values; Vietnamese labels live in the maps below so
// the AI never invents wording the UI has to trust.
// ---------------------------------------------------------------------------

export const TEAM_FIT_VERDICTS = ["san_sang", "can_can_nhac"] as const;

export type TeamFitVerdict = (typeof TEAM_FIT_VERDICTS)[number];

export const TEAM_FIT_VERDICT_LABELS: Record<TeamFitVerdict, string> = {
  san_sang: "Sẵn sàng đi tiếp",
  can_can_nhac: "Cần cân nhắc",
};

export const TEAM_FIT_AREA_STATES = ["on", "yeu"] as const;

export type TeamFitAreaState = (typeof TEAM_FIT_AREA_STATES)[number];

export const TEAM_FIT_AREA_STATE_LABELS: Record<TeamFitAreaState, string> = {
  on: "Ổn",
  yeu: "Yếu",
};

export const TEAM_FIT_LEVELS = ["cao", "vua", "thap"] as const;

export type TeamFitLevel = (typeof TEAM_FIT_LEVELS)[number];

export const TEAM_FIT_LEVEL_LABELS: Record<TeamFitLevel, string> = {
  cao: "Cao",
  vua: "Vừa",
  thap: "Thấp",
};

export const TeamFitAiOutputSchema = z.object({
  verdict: z
    .enum(TEAM_FIT_VERDICTS)
    .describe("Kết luận sơ bộ: san_sang = đội ngũ đã phủ vai trò cốt lõi, can_can_nhac = còn thiếu vai trò cốt lõi"),
  areas: z
    .array(
      z.object({
        ten: z.string().min(2).max(120).describe('Tên mảng, ví dụ "Kỹ thuật sản phẩm"'),
        trangThai: z.enum(TEAM_FIT_AREA_STATES).describe("on = mảng ổn, yeu = mảng yếu"),
        mucDo: z.enum(TEAM_FIT_LEVELS).describe("Mức độ của mảng này"),
        lyDo: z.string().min(2).max(500).describe("Vì sao mảng này ổn hoặc yếu với chính dự án này"),
        danChung: z
          .string()
          .min(2)
          .max(500)
          .describe("Trích câu khách đã viết (chuyên ngành, sở trường, kinh nghiệm, lĩnh vực) làm căn cứ"),
      }),
    )
    .min(2)
    .max(6),
  industryRoles: z
    .array(
      z.object({
        vaiTro: z.string().min(2).max(120).describe("Vai trò mà lĩnh vực dự án cần trong đội ngũ"),
        conThieu: z.boolean().describe("Đội ngũ hiện có thiếu vai trò này hay không"),
        lyDo: z.string().min(2).max(500).describe("Căn cứ đối chiếu với thông tin thành viên"),
      }),
    )
    .min(2)
    .max(8),
  committeeQuestions: z.array(z.string().min(5).max(300)).min(5).max(7),
});

export type TeamFitAiOutput = z.infer<typeof TeamFitAiOutputSchema>;
export type TeamFitIndustryRole = TeamFitAiOutput["industryRoles"][number];

// ---------------------------------------------------------------------------
// Team-Idea Fit Free — server-assembled report (v2)
// machineStats is counted from customer input by the server; handoff is fixed.
// `ai` is null when the AI call failed — parts A and C must survive that.
// ---------------------------------------------------------------------------

export const TeamFitMachineStatsSchema = z.object({
  distinctMajors: z.number().int().min(0),
  trackCoverage: z.record(z.enum(ROLE_TRACK_CODES), z.number().int().min(0)),
  experiencedCount: z.number().int().min(0),
  emptyFields: z.array(z.string()),
});

export type TeamFitMachineStats = z.infer<typeof TeamFitMachineStatsSchema>;

export const TEAM_FIT_HANDOFF_COUNT = 4;

export const TeamFitHandoffItemSchema = z.object({
  cauHoi: z.string(),
  canNopGi: z.string(),
});

export type TeamFitHandoffItem = z.infer<typeof TeamFitHandoffItemSchema>;

export const TeamFitFreeReportSchema = z.object({
  version: z.literal(2),
  machineStats: TeamFitMachineStatsSchema,
  ai: TeamFitAiOutputSchema.nullable(),
  handoff: z.array(TeamFitHandoffItemSchema).length(TEAM_FIT_HANDOFF_COUNT),
});

export type TeamFitFreeReport = z.infer<typeof TeamFitFreeReportSchema>;

// Legacy v1 shape — still stored on cases saved before the v2 report. Read sites
// accept it so old cases keep rendering instead of showing empty lists.
export const TeamFitLegacyFreeReportSchema = z.object({
  teamGaps: z.array(z.string()),
  commercialGaps: z.array(z.string()),
});

export type TeamFitLegacyFreeReport = z.infer<typeof TeamFitLegacyFreeReportSchema>;

export const TeamFitSavedResultSchema = z.union([
  TeamFitFreeReportSchema,
  TeamFitLegacyFreeReportSchema,
]);

export type TeamFitSavedResult = z.infer<typeof TeamFitSavedResultSchema>;

export function isTeamFitFreeReportV2(result: unknown): result is TeamFitFreeReport {
  return !!result && typeof result === "object" && "version" in result;
}

// ---------------------------------------------------------------------------
// Team-Idea Fit — paid tier rich report schema
// ---------------------------------------------------------------------------

export const TeamFitReportSchema = z.object({
  overview: z.string().describe('Tổng quan 1 câu: đánh giá mức độ phù hợp giữa đội ngũ và ý tưởng'),
  fitLevel: z.enum(['strong', 'moderate', 'weak', 'poor']).describe('Mức độ phù hợp'),
  fitLabel: z.string().describe('Nhãn tiếng Việt'),
  strengths: z.array(
    z.object({
      area: z.string(),
      detail: z.string(),
      evidence: z.string().default(''),
    }).describe('Một ưu điểm cụ thể'),
  ).describe('Các ưu điểm của đội ngũ so với ý tưởng'),
  weaknesses: z.array(
    z.object({
      area: z.string(),
      severity: z.enum(['critical', 'moderate', 'low']),
      detail: z.string(),
      recommendation: z.string(),
    }).describe('Một điểm yếu cụ thể'),
  ).describe('Các điểm yếu / rủi ro của đội ngũ so với ý tưởng'),
  recommendations: z.array(z.string()).describe('Các khuyến nghị hành động'),
});

export type TeamFitReport = z.infer<typeof TeamFitReportSchema>;

// ---------------------------------------------------------------------------
// ServicePackage — shared entity type (FE + BE)
// ---------------------------------------------------------------------------

export const ServicePackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number().int().min(0).max(2147483647),
  is_active: z.boolean().default(true),
  previous_price: z.number().int().min(0).max(2147483647).nullable().default(null),
  last_price_changed_at: z.string().datetime().nullable().default(null),
  last_price_changed_by: z.string().uuid().nullable().default(null),
  features: z.array(z.string()).or(z.record(z.string(), z.string())),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ServicePackage = z.infer<typeof ServicePackageSchema>;

// ---------------------------------------------------------------------------
// Payment — shared entity type (FE + BE)
// ---------------------------------------------------------------------------

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  case_id: z.string().uuid(),
  package_id: z.string().uuid(),
  amount: z.number().int().min(0).max(2147483647),
  status: z.enum(['unpaid', 'pending_verification', 'paid', 'rejected']),
  proof_file_url: z.string().url().nullable().default(null),
  rejection_reason: z.string().nullable().default(null),
  verified_by_auth_user_id: z.string().uuid().nullable().default(null),
  verified_at: z.string().datetime().nullable().default(null),
  verification_source: z.enum(['auto', 'manual']).nullable().default(null),
  currency: z.string().default('VND'),
  payment_method: z.string(),
  transfer_content: z.string().nullable().default(null),
  bank_transaction_id: z.string().nullable().default(null),
  bank_credited_at: z.string().datetime().nullable().default(null),
  payer_auth_user_id: z.string().uuid().nullable().default(null),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).passthrough();

export type Payment = z.infer<typeof PaymentSchema>;

export const PaymentHistoryItemSchema = z.object({
  id: z.string().uuid(),
  case_id: z.string().uuid(),
  case_code: z.string(),
  package_name: z.string().nullable().optional(),
  amount: z.number().int().min(0),
  currency: z.string(),
  status: z.enum(['unpaid', 'pending_verification', 'paid', 'rejected']),
  verified_at: z.string().datetime().nullable().optional(),
  bank_transaction_id: z.string().nullable().optional(),
  created_at: z.string().datetime(),
});

export type PaymentHistoryItem = z.infer<typeof PaymentHistoryItemSchema>;

// ---------------------------------------------------------------------------
// User & Session — shared entity types (FE + BE)
// ---------------------------------------------------------------------------

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  email_verified: z.boolean().default(false),
  image: z.string().url().nullable().default(null),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  role: z.enum(['user', 'supporter', 'admin', 'writer']),
  banned: z.boolean().default(false),
  ban_reason: z.string().nullable().default(null),
  ban_expires: z.string().datetime().nullable().default(null),
  username: z.string().nullable().default(null),
  display_username: z.string().nullable().default(null),
});

export type User = z.infer<typeof UserSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  expires_at: z.string().datetime(),
  token: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  ip_address: z.string().nullable().default(null),
  user_agent: z.string().nullable().default(null),
  user_id: z.string().uuid(),
});

export type Session = z.infer<typeof SessionSchema>;

// ---------------------------------------------------------------------------
// Case — shared entity type (FE + BE)
// ---------------------------------------------------------------------------

export const CaseSchema = z.object({
  id: z.string().uuid(),
  case_code: z.string(),
  group_no: z.string().nullable().default(null),
  owner_auth_user_id: z.string().uuid(),
  team_name: z.string().nullable().default(null),
  school: z.string().nullable().default(null),
  course_context: z.string().nullable().default(null),
  current_checkpoint: z.string().nullable().default(null),
  package_id: z.string().uuid().nullable().default(null),
  locked_price: z.number().int().min(0).nullable().default(null),
  assigned_supporter_auth_user_id: z.string().uuid().nullable().default(null),
  user_facing_stage: z.string(),
  internal_status: z.string(),
  payment_status: z.string(),
  sla_deadline_at: z.string().datetime().nullable().default(null),
  deadline: z.string().datetime().nullable().default(null),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Case = z.infer<typeof CaseSchema>;

// ---------------------------------------------------------------------------
// CP1 Intake — shared validation schema (FE + BE)
// ---------------------------------------------------------------------------

export const CP1_MAX_DOCUMENTS = 5;
export const CP1_SHORT_MAX = 100;
export const CP1_EMAIL_MAX = 254;
export const CP1_LONG_MAX = 20000;

function addCp1CapIssues(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  const contact = data.contact;
  if (contact && typeof contact === "object") {
    const c = contact as Record<string, unknown>;
    const shortFields: Array<[string, string]> = [
      ["full_name", "Họ tên người liên hệ"],
      ["student_code", "Mã số sinh viên"],
      ["team_role", "Vai trò trong nhóm"],
    ];
    for (const [field, label] of shortFields) {
      const value = c[field];
      if (typeof value === "string" && value.trim().length > CP1_SHORT_MAX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} không được vượt quá ${CP1_SHORT_MAX} ký tự`,
          path: ["contact", field],
        });
      }
    }
    const email = c.email;
    if (typeof email === "string" && email.trim().length > CP1_EMAIL_MAX) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Email liên hệ không được vượt quá ${CP1_EMAIL_MAX} ký tự`,
        path: ["contact", "email"],
      });
    }
  }

  const supportNeeds = data.support_needs;
  if (supportNeeds && typeof supportNeeds === "object") {
    const primaryNeed = (supportNeeds as Record<string, unknown>).primary_need;
    if (typeof primaryNeed === "string" && primaryNeed.trim().length > CP1_SHORT_MAX) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Nhu cầu hỗ trợ chính không được vượt quá ${CP1_SHORT_MAX} ký tự`,
        path: ["support_needs", "primary_need"],
      });
    }
  }

  const longFields: Array<[string, string]> = [
    ["current_blocker", "Điểm kẹt hiện tại"],
    ["case_summary", "Tóm tắt hồ sơ"],
  ];
  for (const [field, label] of longFields) {
    const value = data[field];
    if (typeof value === "string" && value.trim().length > CP1_LONG_MAX) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} không được vượt quá ${CP1_LONG_MAX} ký tự`,
        path: [field],
      });
    }
  }

  const situations = data.current_situations;
  if (Array.isArray(situations)) {
    situations.forEach((item: unknown, index: number) => {
      if (typeof item === "string" && item.trim().length > CP1_LONG_MAX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Tình huống hiện tại không được vượt quá ${CP1_LONG_MAX} ký tự`,
          path: ["current_situations", index],
        });
      }
    });
  }

  const documents = data.documents;
  if (Array.isArray(documents) && documents.length > CP1_MAX_DOCUMENTS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Thư mục tài liệu không được vượt quá ${CP1_MAX_DOCUMENTS} tài liệu`,
      path: ["documents"],
    });
  }
}

export const Cp1IntakeSchema = z.object({
  contact: z.unknown().optional(),
  current_blocker: z.unknown().optional(),
  case_summary: z.unknown().optional(),
  current_situations: z.unknown().optional(),
  support_needs: z.unknown().optional(),
  documents: z.unknown().optional(),
  boundary_confirmations: z.unknown().optional(),
}).passthrough().superRefine((data, ctx) => {
  addCp1CapIssues(data, ctx);

  // 1. Contact validation
  const contact = data.contact;
  if (!contact || typeof contact !== 'object') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thiếu thông tin liên hệ", path: ["contact"] });
  } else {
    const c = contact as Record<string, unknown>;
    if (typeof c.full_name !== 'string' || c.full_name.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Họ tên người liên hệ không hợp lệ (tối thiểu 2 ký tự)", path: ["contact", "full_name"] });
    }
    if (typeof c.student_code !== 'string' || c.student_code.trim().length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mã số sinh viên không hợp lệ (tối thiểu 5 ký tự)", path: ["contact", "student_code"] });
    }
    if (typeof c.team_role !== 'string' || c.team_role.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vai trò trong nhóm không hợp lệ", path: ["contact", "team_role"] });
    }
    if (typeof c.zalo !== 'string' || !/^\d{10}$/.test(c.zalo.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Số điện thoại Zalo không hợp lệ (phải bao gồm chính xác 10 chữ số)", path: ["contact", "zalo"] });
    }
    if (typeof c.email !== 'string' || !c.email.includes("@")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email liên hệ không hợp lệ", path: ["contact", "email"] });
    }
  }

  // 2. Current blocker / legacy context
  const blocker = typeof data.current_blocker === 'string' ? data.current_blocker.trim() : '';
  const summary = typeof data.case_summary === 'string' ? data.case_summary.trim() : '';
  const situations = Array.isArray(data.current_situations) ? data.current_situations : [];

  const hasBlocker = blocker.length >= 10;
  const hasLegacy = summary.length >= 20
    || situations.some((item: unknown) => typeof item === 'string' && item.trim().length >= 1);

  if (!hasBlocker && !hasLegacy) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cần mô tả ngắn điểm kẹt hiện tại của nhóm", path: ["current_blocker"] });
  }

  // 3. Support needs validation (tùy chọn, không bắt buộc)
  const supportNeeds = data.support_needs;
  if (supportNeeds && typeof supportNeeds === 'object') {
    const primaryNeed = (supportNeeds as Record<string, unknown>).primary_need;
    if (typeof primaryNeed === 'string' && primaryNeed.trim().length > 0 && primaryNeed.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nhu cầu hỗ trợ chính nếu có phải từ 5 ký tự trở lên",
        path: ["support_needs", "primary_need"],
      });
    }
  }

  // 4. Documents validation
  const documents = data.documents;
  if (!Array.isArray(documents) || documents.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thư mục tài liệu là bắt buộc", path: ["documents"] });
  } else {
    const doc = documents[0];
    if (doc && typeof doc === 'object') {
      const d = doc as Record<string, unknown>;
      const hasUrl = (typeof d.file_url === 'string' && d.file_url.trim().length > 0)
        || (typeof d.drive_url === 'string' && d.drive_url.trim().length > 0);
      if (!hasUrl) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tài liệu phải có file_url hoặc drive_url hợp lệ", path: ["documents", 0] });
      }
      if (typeof d.document_type !== 'string' || d.document_type.trim().length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui lòng chọn ít nhất một loại tài liệu có trong thư mục", path: ["documents", 0] });
      }
    }
  }

  // 5. Boundary confirmations
  const boundaryConfirmations = data.boundary_confirmations;
  if (!Array.isArray(boundaryConfirmations) || boundaryConfirmations.length < 3) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Phải xác nhận đầy đủ ít nhất 3 cam kết ranh giới", path: ["boundary_confirmations"] });
  }
});

export type Cp1Intake = z.infer<typeof Cp1IntakeSchema>;

export const Cp1IntakeCaps = z.object({
  contact: z.unknown().optional(),
  current_blocker: z.unknown().optional(),
  case_summary: z.unknown().optional(),
  current_situations: z.unknown().optional(),
  support_needs: z.unknown().optional(),
  documents: z.unknown().optional(),
}).passthrough().superRefine((data, ctx) => {
  addCp1CapIssues(data, ctx);
});

// ---------------------------------------------------------------------------
// Document categories — shared code ↔ label map (FE + BE)
// ---------------------------------------------------------------------------

export const DOCUMENT_CATEGORY_CODES = [
  "idea_report",
  "pitch_deck",
  "market_research",
  "financial_plan",
  "other",
] as const;

export type DocumentCategoryCode = (typeof DOCUMENT_CATEGORY_CODES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategoryCode, string> = {
  idea_report: "Thuyết minh ý tưởng",
  pitch_deck: "Slide thuyết trình",
  market_research: "Nghiên cứu thị trường",
  financial_plan: "Kế hoạch tài chính",
  other: "Tài liệu bổ sung",
};

export const LEGACY_CATEGORY_CANONICAL_MAP: Record<string, DocumentCategoryCode> = {
  competitor_analysis: "market_research",
  customer_research: "market_research",
};

export const LEGACY_DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  competitor_analysis: "Nghiên cứu thị trường",
  customer_research: "Nghiên cứu thị trường",
  task_assignment: "Đề cương phân công",
};

export function canonicalizeDocCategory(code: string | null | undefined): string {
  if (!code) return "other";
  return LEGACY_CATEGORY_CANONICAL_MAP[code] ?? code;
}

export function docCategoryLabel(code: string): string {
  if (code in DOCUMENT_CATEGORY_LABELS) {
    return DOCUMENT_CATEGORY_LABELS[code as DocumentCategoryCode];
  }
  if (code in LEGACY_DOCUMENT_CATEGORY_LABELS) {
    return LEGACY_DOCUMENT_CATEGORY_LABELS[code];
  }
  return code;
}

// ---------------------------------------------------------------------------
// Notification — shared entity types (FE + BE)
// ---------------------------------------------------------------------------

export const NOTIFICATION_TYPES = [
  "case.assigned",
  "case.approved",
  "case.rejected",
  "payment.proof_uploaded",
  "payment.verified",
  "payment.rejected",
  "case.stage_changed",
  "report.published",
  "request_more_info",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NotificationItemSchema = z.object({
  id: z.string(),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string(),
  body: z.string().nullable(),
  link: z.string().nullable(),
  read_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export type NotificationItem = z.infer<typeof NotificationItemSchema>;

export const ListNotificationsResponseSchema = z.object({
  items: z.array(NotificationItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export type ListNotificationsResponse = z.infer<typeof ListNotificationsResponseSchema>;

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  email_enabled: true,
} as const;

export const NotificationPreferenceSchema = z
  .object({
    email_enabled: z.boolean(),
  })
  .strict();

export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;

export const UpdateNotificationPreferenceSchema = NotificationPreferenceSchema;

export const NotificationPreferenceResponseSchema = NotificationPreferenceSchema;

export type NotificationPreferenceResponse = z.infer<typeof NotificationPreferenceResponseSchema>;

// ---------------------------------------------------------------------------
// Case list query + paginated envelope (GA-09)
// ---------------------------------------------------------------------------

export const CASE_LIST_SORT_FIELDS = ["created_at", "case_code", "team_name"] as const;
export type CaseListSortField = (typeof CASE_LIST_SORT_FIELDS)[number];

export const CASE_LIST_DEFAULT_LIMIT = 20;
export const CASE_LIST_MAX_LIMIT = 50;

export const ADMIN_CASE_LIST_VIEWS = [
  "all",
  "triage",
  "intake",
  "unassigned",
  "assigned",
  "crud",
] as const;
export type AdminCaseListView = (typeof ADMIN_CASE_LIST_VIEWS)[number];

export const CaseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(CASE_LIST_MAX_LIMIT).default(CASE_LIST_DEFAULT_LIMIT),
  search: z.string().trim().max(200).optional(),
  sortBy: z.enum(CASE_LIST_SORT_FIELDS).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  internal_status: z.string().optional(),
  stage: z.string().optional(),
});

export type CaseListQuery = z.infer<typeof CaseListQuerySchema>;

export const AdminCaseListQuerySchema = CaseListQuerySchema.extend({
  view: z.enum(ADMIN_CASE_LIST_VIEWS).optional(),
});

export type AdminCaseListQuery = z.infer<typeof AdminCaseListQuerySchema>;

export function paginatedListSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
  });
}

export const CaseListResponseSchema = paginatedListSchema(CaseSchema.passthrough());
export type CaseListResponse = z.infer<typeof CaseListResponseSchema>;

// ---------------------------------------------------------------------------
// Admin export (GA-10)
// ---------------------------------------------------------------------------

export const ADMIN_EXPORT_RESOURCES = ["cases", "deposits", "transactions", "orders"] as const;
export type AdminExportResource = (typeof ADMIN_EXPORT_RESOURCES)[number];

export const AdminExportQuerySchema = z.object({
  resource: z.enum(ADMIN_EXPORT_RESOURCES),
});

export type AdminExportQuery = z.infer<typeof AdminExportQuerySchema>;

// ---------------------------------------------------------------------------
// Case Chat Read State & Unread Count (GA-19)
// ---------------------------------------------------------------------------

export const MarkChatReadRequestSchema = z.object({
  last_read_message_id: z.string().optional(),
});

export type MarkChatReadRequest = z.infer<typeof MarkChatReadRequestSchema>;

export const MarkChatReadResponseSchema = z.object({
  success: z.boolean(),
  unread_count: z.number().int().nonnegative(),
  last_read_at: z.string().optional(),
});

export type MarkChatReadResponse = z.infer<typeof MarkChatReadResponseSchema>;

export const CaseUnreadCountResponseSchema = z.object({
  unread_count: z.number().int().nonnegative(),
  last_read_at: z.string().optional(),
});

export type CaseUnreadCountResponse = z.infer<typeof CaseUnreadCountResponseSchema>;


// ---------------------------------------------------------------------------
// Session Management (GA-06)
// ---------------------------------------------------------------------------

export const ActiveSessionDtoSchema = z.object({
  id: z.string().min(1),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  isCurrent: z.boolean(),
});
export type ActiveSessionDto = z.infer<typeof ActiveSessionDtoSchema>;

export const ActiveSessionsResponseSchema = z.object({
  data: z.array(ActiveSessionDtoSchema),
});
export type ActiveSessionsResponse = z.infer<typeof ActiveSessionsResponseSchema>;

export const RevokeSessionParamsSchema = z.object({
  id: z.string().min(1),
});
export type RevokeSessionParams = z.infer<typeof RevokeSessionParamsSchema>;
export interface ParsedUserAgent {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
}

export function parseUserAgent(uaString?: string | null): ParsedUserAgent {
  if (!uaString || typeof uaString !== "string") {
    return {
      browser: "Trình duyệt không xác định",
      os: "Hệ điều hành không xác định",
      deviceType: "unknown",
    };
  }

  const ua = uaString.slice(0, 500); // Guard chống ReDoS

  // 1. Phân tích OS
  let os = "Hệ điều hành khác";
  let deviceType: "desktop" | "mobile" | "tablet" | "unknown" = "desktop";

  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/iPad/i.test(ua)) {
    os = "iPadOS";
    deviceType = "tablet";
  } else if (/iPhone|iPod/i.test(ua)) {
    os = "iOS";
    deviceType = "mobile";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = "macOS";
    deviceType = "desktop";
  } else if (/Android/i.test(ua)) {
    os = "Android";
    deviceType = /Mobile/i.test(ua) ? "mobile" : "tablet";
  } else if (/CrOS/i.test(ua)) {
    os = "ChromeOS";
    deviceType = "desktop";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
    deviceType = "desktop";
  }

  // 2. Phân tích Browser (Thứ tự ưu tiên: Edge -> Opera -> CocCoc -> Brave -> Chrome -> Safari -> Firefox)
  let browser = "Trình duyệt khác";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/coc_coc/i.test(ua)) browser = "Cốc Cốc";
  else if (/Brave/i.test(ua)) browser = "Brave";
  else if (/Chrome\//i.test(ua)) browser = "Google Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Mozilla Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Apple Safari";

  return { browser, os, deviceType };
}

export function formatIpAddress(ip?: string | null): string {
  if (!ip) return "IP không xác định";
  if (ip === "::1" || ip === "127.0.0.1" || ip.includes("localhost")) {
    return "Localhost";
  }
  return ip.replace(/^::ffff:/, ""); // Bỏ prefix IPv4-mapped IPv6
}

// ---------------------------------------------------------------------------
// Admin OMP Worker Monitoring — shared schemas & contracts (FE + BE)
// ---------------------------------------------------------------------------

export const ADMIN_WORKER_JOB_STATUSES = [
  "all",
  "active",
  "waiting",
  "completed",
  "failed",
  "stuck",
] as const;
export type AdminWorkerJobStatusFilter = (typeof ADMIN_WORKER_JOB_STATUSES)[number];

export const AdminWorkerJobListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ADMIN_WORKER_JOB_STATUSES).default("all"),
  search: z.string().trim().max(100).optional(),
});
export type AdminWorkerJobListQuery = z.infer<typeof AdminWorkerJobListQuerySchema>;

export const AdminRetryJobBodySchema = z.object({
  model: z.string().trim().min(1).optional(),
  promptMode: z.enum(["full", "lite"]).default("full"),
  clearOldSandbox: z.boolean().default(true),
});
export type AdminRetryJobBody = z.infer<typeof AdminRetryJobBodySchema>;

export const AdminHealStuckBodySchema = z.object({
  reason: z.string().trim().optional(),
});
export type AdminHealStuckBody = z.infer<typeof AdminHealStuckBodySchema>;

export interface AdminWorkerStatsResponse {
  concurrencyLimit: number;
  activeCount: number;
  waitingCount: number;
  completed24hCount: number;
  failed24hCount: number;
  stuckCount: number;
  avgDurationMs24h: number;
}

export interface AdminWorkerJobListItem {
  id: string;
  caseId: string;
  caseCode: string;
  projectName: string;
  studentName: string;
  studentEmail: string;
  status: string;
  isStuck: boolean;
  submissionType: string;
  attemptNo?: number;
  model: string;
  startedAt: string;
  updatedAt: string;
  durationMs: number;
}

export interface AdminWorkerJobListResponse {
  items: AdminWorkerJobListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JobSandboxFileInfo {
  name: string;
  sizeBytes: number;
  extension: string;
  downloadPath?: string;
}

export interface AdminWorkerJobDetailResponse {
  id: string;
  caseId: string;
  caseCode: string;
  projectName: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  isStuck: boolean;
  submissionType: string;
  attemptNo?: number;
  model: string;
  promptMode: "full" | "lite";
  startedAt: string;
  updatedAt: string;
  durationMs: number;
  milestones: {
    sandboxReady: boolean;
    triadPacket: boolean;
    auditReport: boolean;
    reportJson: boolean;
  };
  inputFiles: JobSandboxFileInfo[];
  outputFiles: JobSandboxFileInfo[];
  reportSummary?: {
    id: string;
    overallScore: number | null;
    scores: Record<string, number> | null;
    pdfUrl: string | null;
    createdAt: string;
  } | null;
  failedReason?: string | null;
  inputSnapshot?: {
    idea?: Record<string, unknown>;
    team?: Record<string, unknown>;
  } | null;
}

// ---------------------------------------------------------------------------
// Standard Report PDF Naming (Shared between API & Web)
// ---------------------------------------------------------------------------

export const SUBMISSION_TYPE_FILE_SLUGS: Record<string, string> = {
  initial: "lan_dau",
  resubmit: "da_sua",
  logic_check: "soi_logic",
};

export const SUBMISSION_TYPE_DISPLAY_LABELS: Record<string, string> = {
  initial: "Lần đầu",
  resubmit: "Đã sửa",
  logic_check: "Soi logic",
};

export function makeDownloadSlug(name: string): string {
  if (!name || typeof name !== "string") {
    return "de_an";
  }

  return (
    name
      .replace(/[đĐ]/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50) || "de_an"
  );
}

export function formatReportTimestamp(date?: Date | string | null): string {
  const d = date ? new Date(date) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${validDate.getFullYear()}${pad(validDate.getMonth() + 1)}${pad(validDate.getDate())}${pad(validDate.getHours())}${pad(validDate.getMinutes())}${pad(validDate.getSeconds())}`;
}

export function getSubmissionTypeFileSlug(submissionType?: string | null): string {
  if (!submissionType) return "phan_bien";
  return SUBMISSION_TYPE_FILE_SLUGS[submissionType] || "phan_bien";
}

export interface BuildReportPdfFilenameOptions {
  projectName: string;
  submissionType?: string | null;
  createdAt?: Date | string | null;
  versionNo?: number | null;
  customTypeSlug?: string;
}

export function buildStandardReportPdfFilename(opts: BuildReportPdfFilenameOptions): string {
  const slug = makeDownloadSlug(opts.projectName);
  const typeSlug = opts.customTypeSlug
    ? makeDownloadSlug(opts.customTypeSlug)
    : getSubmissionTypeFileSlug(opts.submissionType);
  const timestamp = formatReportTimestamp(opts.createdAt);
  const versionSuffix =
    opts.versionNo != null && !isNaN(opts.versionNo)
      ? `_v${String(opts.versionNo).padStart(2, "0")}`
      : "";
  return `${slug}_${typeSlug}_${timestamp}${versionSuffix}.pdf`;
}

// ---------------------------------------------------------------------------
// News Module — Shared contracts, DTOs & Validation
// ---------------------------------------------------------------------------

export const NEWS_TYPE = {
  ARTICLE: 'article',
  VIDEO: 'video',
} as const;

export type NewsType = (typeof NEWS_TYPE)[keyof typeof NEWS_TYPE];

export const NEWS_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type NewsStatus = (typeof NEWS_STATUS)[keyof typeof NEWS_STATUS];

export const NEWS_TITLE_MAX_LENGTH = 200;
export const NEWS_SLUG_MAX_LENGTH = 160;
export const NEWS_EXCERPT_MAX_LENGTH = 320;
export const NEWS_COVER_ALT_MAX_LENGTH = 200;
export const NEWS_MAX_CONTENT_JSON_BYTES = 512 * 1024; // 512 KiB

export const NEWS_CATEGORIES = [
  // Cốt lõi nền tảng & Khởi nghiệp
  { slug: 'khoi-nghiep', name: 'Khởi nghiệp' },
  { slug: 'cong-nghe', name: 'Khoa học - Công nghệ' },
  { slug: 'kinh-doanh', name: 'Kinh doanh' },
  { slug: 'tai-chinh', name: 'Tài chính' },
  { slug: 'quan-diem-tranh-luan', name: 'Quan điểm - Tranh luận' },
  { slug: 'goc-nhin-thoi-su', name: 'Góc nhìn thời sự' },
  { slug: 'phat-trien-ban-than', name: 'Phát triển bản thân' },
  { slug: 'tam-ly-hoc', name: 'Tâm lý học' },
  { slug: 'nguoi-trong-muon-nghe', name: 'Người trong muôn nghề' },
  { slug: 'san-pham', name: 'Sản phẩm' },
  { slug: 'the-brands', name: 'The Brands' },
  { slug: 'sach', name: 'Sách' },
  { slug: 'giao-duc', name: 'Giáo dục' },
  { slug: 'thinking-out-loud', name: 'Thinking Out Loud' },
  { slug: 'sang-tac', name: 'Sáng tác' },
  { slug: 'movie', name: 'Movie' },
  { slug: 'am-nhac', name: 'Âm nhạc' },
  { slug: 'game', name: 'Game' },
  { slug: 'the-thao', name: 'Thể thao' },
  { slug: 'fitness', name: 'Fitness' },
  { slug: 'du-lich', name: 'Du lịch' },
  { slug: 'am-thuc', name: 'Nấu ăn - Ẩm thực' },
  { slug: 'fashion', name: 'Fashion' },
  { slug: 'life-style', name: 'Life style' },
  { slug: 'yeu', name: 'Yêu' },
  { slug: 'chuyen-tham-kin', name: 'Chuyện thầm kín' },
  { slug: 'lich-su', name: 'Lịch sử' },
  { slug: 'kien-truc-my-thuat', name: 'Điêu khắc - Kiến trúc - Mỹ thuật' },
  { slug: 'nhiep-anh', name: 'Nhiếp ảnh' },
  { slug: 'o-to', name: 'Ô tô' },
  { slug: 'xe-may', name: 'Xe máy' },
  { slug: 'wtf', name: 'WTF' },
  { slug: 'su-kien-nexus', name: 'Sự kiện Nexus' },
  { slug: 'khac', name: 'Khác' },
] as const;

export type NewsCategorySlug = (typeof NEWS_CATEGORIES)[number]['slug'];

export const SORTED_NEWS_CATEGORIES: ReadonlyArray<(typeof NEWS_CATEGORIES)[number]> = [
  ...NEWS_CATEGORIES,
].sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));

export function getNewsCategoryName(slug: string | null | undefined): string {
  if (!slug) return 'Khởi nghiệp';
  const normalized = slug.trim().toLowerCase();
  const found = NEWS_CATEGORIES.find((c) => c.slug === normalized);
  if (found) return found.name;

  // Fallback map cho các slug cũ hoặc biến thể
  const fallbackMap: Record<string, string> = {
    'cong-nghe': 'Khoa học - Công nghệ',
    'khoa-hoc-cong-nghe': 'Khoa học - Công nghệ',
    'tai-chinh': 'Tài chính',
    'khoi-nghiep': 'Khởi nghiệp',
    'kinh-doanh': 'Kinh doanh',
    'ky-nang': 'Phát triển bản thân',
    'phat-trien-ban-than': 'Phát triển bản thân',
    'goc-nhin': 'Quan điểm - Tranh luận',
    'quan-diem-tranh-luan': 'Quan điểm - Tranh luận',
    'san-pham': 'Sản phẩm',
    'huong-dan': 'Phát triển bản thân',
    'nau-an-am-thuc': 'Nấu ăn - Ẩm thực',
    'am-thuc': 'Nấu ăn - Ẩm thực',
    'dieu-khac-kien-truc-my-thuat': 'Điêu khắc - Kiến trúc - Mỹ thuật',
    'kien-truc-my-thuat': 'Điêu khắc - Kiến trúc - Mỹ thuật',
    'su-kien-nexus': 'Sự kiện Nexus',
    'su-kien': 'Sự kiện Nexus',
    'khac': 'Khác',
  };

  return fallbackMap[normalized] || slug;
}

export const NEWS_PUBLIC_DEFAULT_LIMIT = 12;
export const NEWS_PUBLIC_MAX_LIMIT = 48;
export const NEWS_ADMIN_DEFAULT_LIMIT = 20;
export const NEWS_ADMIN_MAX_LIMIT = 100;

export const NewsTypeSchema = z.enum(['article', 'video']);
export const NewsStatusSchema = z.enum(['draft', 'published']);

export function isSafeHttpUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return !/[\r\n\t\0\\]/.test(trimmed);
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    if (/[\r\n\t\0\\]/.test(trimmed)) return false;
    return true;
  } catch {
    return false;
  }
}

export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase();
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com'
    ) {
      if (url.pathname === '/watch') {
        const v = url.searchParams.get('v');
        return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
      }
      if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')) {
        const parts = url.pathname.split('/');
        const id = parts[2];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function generateNewsSlug(title: string): string {
  if (!title) return '';
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, NEWS_SLUG_MAX_LENGTH);
}

// Closed recursive TipTap schema
export const TipTapLinkMarkSchema = z.object({
  type: z.literal('link'),
  attrs: z
    .object({
      href: z.string().refine(isSafeHttpUrl, { message: 'Invalid or unsafe link URL' }),
      target: z.string().optional(),
      rel: z.string().optional(),
    })
    .passthrough(),
});

export const TipTapMarkSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({ type: z.literal('strike') }),
  z.object({ type: z.literal('underline') }),
  TipTapLinkMarkSchema,
]);

export type TipTapMark = z.infer<typeof TipTapMarkSchema>;

export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
}

export const TipTapNodeSchema: z.ZodType<TipTapNode> = z.lazy(() =>
  z.object({
    type: z.enum([
      'doc',
      'paragraph',
      'text',
      'heading',
      'bulletList',
      'orderedList',
      'listItem',
      'blockquote',
      'horizontalRule',
      'hardBreak',
    ]),
    attrs: z
      .record(z.string(), z.any())
      .optional()
      .refine(
        (attrs) => {
          if (attrs && 'level' in attrs) {
            return attrs.level === 2 || attrs.level === 3;
          }
          return true;
        },
        { message: 'Heading level must be 2 or 3' }
      ),
    content: z.array(TipTapNodeSchema).optional(),
    marks: z.array(TipTapMarkSchema).optional(),
    text: z.string().optional(),
  })
);

export const TipTapDocSchema = TipTapNodeSchema.refine((val) => val.type === 'doc', {
  message: 'Root node must be doc',
}).refine(
  (val) => {
    try {
      return JSON.stringify(val).length <= NEWS_MAX_CONTENT_JSON_BYTES;
    } catch {
      return false;
    }
  },
  { message: `Content exceeds ${NEWS_MAX_CONTENT_JSON_BYTES} bytes` }
);

export type TipTapDoc = z.infer<typeof TipTapDocSchema>;

// Public DTOs
export const NewsArticlePublicCardSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('article'),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  category: z.string().default('khoi-nghiep'),
  tags: z.array(z.string()).default([]),
  cover_image_url: z.string().nullable(),
  cover_image_alt: z.string().nullable(),
  published_at: z.string(),
  author_byline: z.string().optional(),
  author_avatar_url: z.string().nullable().optional(),
});

export const NewsVideoPublicCardSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('video'),
  title: z.string(),
  excerpt: z.string(),
  category: z.string().default('khoi-nghiep'),
  tags: z.array(z.string()).default([]),
  youtube_video_id: z.string(),
  youtube_thumbnail_url: z.string(),
  published_at: z.string(),
  author_byline: z.string().optional(),
  author_avatar_url: z.string().nullable().optional(),
});

export const NewsItemPublicCardSchema = z.discriminatedUnion('type', [
  NewsArticlePublicCardSchema,
  NewsVideoPublicCardSchema,
]);

export type NewsItemPublicCard = z.infer<typeof NewsItemPublicCardSchema>;

export const NewsArticlePublicDetailSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('article'),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  category: z.string().default('khoi-nghiep'),
  tags: z.array(z.string()).default([]),
  content_json: z.any().nullable(),
  cover_image_url: z.string().nullable(),
  cover_image_alt: z.string().nullable(),
  published_at: z.string(),
  updated_at: z.string().optional(),
  author_byline: z.string(),
  author_avatar_url: z.string().nullable().optional(),
});

export type NewsArticlePublicDetail = z.infer<typeof NewsArticlePublicDetailSchema>;

// Admin DTOs
export const NewsItemAdminSchema = z.object({
  id: z.string().uuid(),
  type: NewsTypeSchema,
  status: NewsStatusSchema,
  title: z.string(),
  slug: z.string().nullable(),
  excerpt: z.string(),
  category: z.string().default('khoi-nghiep'),
  tags: z.array(z.string()).default([]),
  content_json: z.any().nullable(),
  youtube_video_id: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  cover_image_public_id: z.string().nullable(),
  cover_image_alt: z.string().nullable(),
  published_at: z.string().nullable(),
  created_by_auth_user_id: z.string(),
  updated_by_auth_user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type NewsItemAdmin = z.infer<typeof NewsItemAdminSchema>;

export const CreateNewsItemInputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('article'),
    title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(NEWS_TITLE_MAX_LENGTH),
    slug: z.string().trim().max(NEWS_SLUG_MAX_LENGTH).optional(),
    excerpt: z.string().trim().max(NEWS_EXCERPT_MAX_LENGTH).default(''),
    category: z.string().trim().max(50).default('khoi-nghiep'),
    tags: z.array(z.string().trim().max(50)).default([]),
    content_json: z.any().optional(),
    cover_image_url: z.string().nullable().optional(),
    cover_image_public_id: z.string().nullable().optional(),
    cover_image_alt: z.string().trim().max(NEWS_COVER_ALT_MAX_LENGTH).nullable().optional(),
  }),
  z.object({
    type: z.literal('video'),
    title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(NEWS_TITLE_MAX_LENGTH),
    excerpt: z.string().trim().max(NEWS_EXCERPT_MAX_LENGTH).default(''),
    category: z.string().trim().max(50).default('khoi-nghiep'),
    tags: z.array(z.string().trim().max(50)).default([]),
    youtube_url_or_id: z.string().trim().refine((val) => extractYouTubeVideoId(val) !== null, {
      message: 'URL hoặc ID video YouTube không hợp lệ',
    }),
  }),
]);

export type CreateNewsItemInput = z.infer<typeof CreateNewsItemInputSchema>;

export const UpdateNewsItemInputSchema = z.object({
  title: z.string().trim().min(1).max(NEWS_TITLE_MAX_LENGTH).optional(),
  slug: z.string().trim().max(NEWS_SLUG_MAX_LENGTH).optional(),
  excerpt: z.string().trim().max(NEWS_EXCERPT_MAX_LENGTH).optional(),
  category: z.string().trim().max(50).optional(),
  tags: z.array(z.string().trim().max(50)).optional(),
  content_json: z.any().optional(),
  youtube_url_or_id: z.string().trim().optional(),
  cover_image_url: z.string().nullable().optional(),
  cover_image_public_id: z.string().nullable().optional(),
  cover_image_alt: z.string().trim().max(NEWS_COVER_ALT_MAX_LENGTH).nullable().optional(),
  expected_updated_at: z.string().min(1, 'expected_updated_at is required for concurrency control'),
});

export type UpdateNewsItemInput = z.infer<typeof UpdateNewsItemInputSchema>;

export const PublicNewsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(NEWS_PUBLIC_MAX_LIMIT).default(NEWS_PUBLIC_DEFAULT_LIMIT),
  type: NewsTypeSchema.optional(),
  category: z.string().trim().max(50).optional(),
  tag: z.string().trim().max(50).optional(),
  search: z.string().trim().max(100).optional(),
});

export type PublicNewsListQuery = z.infer<typeof PublicNewsListQuerySchema>;

export const AdminNewsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(NEWS_ADMIN_MAX_LIMIT).default(NEWS_ADMIN_DEFAULT_LIMIT),
  type: NewsTypeSchema.optional(),
  status: NewsStatusSchema.optional(),
  category: z.string().trim().max(50).optional(),
  tag: z.string().trim().max(50).optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
  search: z.string().trim().max(100).optional(),
});

export type AdminNewsListQuery = z.infer<typeof AdminNewsListQuerySchema>;

export const NewsListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total_pages: z.number().int().min(0),
  });

export const NewsErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

// ---------------------------------------------------------------------------
// News Reactions & Comments Schemas
// ---------------------------------------------------------------------------

export const NewsReactionTypeSchema = z.enum(['LIKE', 'DISLIKE']);
export type NewsReactionType = z.infer<typeof NewsReactionTypeSchema>;

export const ToggleNewsReactionInputSchema = z.object({
  type: NewsReactionTypeSchema,
});
export type ToggleNewsReactionInput = z.infer<typeof ToggleNewsReactionInputSchema>;

export const NewsReactionSummarySchema = z.object({
  likes: z.number().int().min(0),
  dislikes: z.number().int().min(0),
  user_reaction: NewsReactionTypeSchema.nullable(),
});
export type NewsReactionSummary = z.infer<typeof NewsReactionSummarySchema>;

export const CreateNewsCommentInputSchema = z.object({
  content: z.string().trim().min(1, 'Nội dung bình luận không được để trống').max(1000, 'Bình luận tối đa 1000 ký tự'),
  parent_id: z.string().uuid().nullable().optional(),
});
export type CreateNewsCommentInput = z.infer<typeof CreateNewsCommentInputSchema>;

export const NewsCommentAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar_url: z.string().nullable().optional(),
  role: z.string().optional(),
});
export type NewsCommentAuthor = z.infer<typeof NewsCommentAuthorSchema>;

export const NewsCommentReplyItemSchema = z.object({
  id: z.string().uuid(),
  news_id: z.string().uuid(),
  user_id: z.string(),
  parent_id: z.string().uuid().nullable(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
  user: NewsCommentAuthorSchema,
  likes: z.number().int().min(0).default(0),
  dislikes: z.number().int().min(0).default(0),
  user_reaction: NewsReactionTypeSchema.nullable().default(null),
});
export type NewsCommentReplyItem = z.infer<typeof NewsCommentReplyItemSchema>;

export const NewsCommentItemSchema = z.object({
  id: z.string().uuid(),
  news_id: z.string().uuid(),
  user_id: z.string(),
  parent_id: z.string().uuid().nullable(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
  user: NewsCommentAuthorSchema,
  likes: z.number().int().min(0).default(0),
  dislikes: z.number().int().min(0).default(0),
  user_reaction: NewsReactionTypeSchema.nullable().default(null),
  replies: z.array(NewsCommentReplyItemSchema).default([]),
});
export type NewsCommentItem = z.infer<typeof NewsCommentItemSchema>;

export const ToggleNewsCommentReactionInputSchema = ToggleNewsReactionInputSchema;
export type ToggleNewsCommentReactionInput = ToggleNewsReactionInput;

export const NewsCommentReactionSummarySchema = NewsReactionSummarySchema;
export type NewsCommentReactionSummary = NewsReactionSummary;

export const NewsCommentListResponseSchema = z.object({
  items: z.array(NewsCommentItemSchema),
  total: z.number().int().min(0),
});
export type NewsCommentListResponse = z.infer<typeof NewsCommentListResponseSchema>;

// ---------------------------------------------------------------------------
// Guided Documents — ProjectAnswer & Catalogs Schemas
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Guided Documents Catalog & Templates (Inlined to support NodeNext & Turbopack)
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Catalog types — the two-level catalog lives in code (plan section 5, D2).
// Question ids are stable strings, never reused or renumbered. Classification
// lives on the template (not the question) so the same canonical question can
// be "required" in CP2 but "supplemental" in CP1.
// ---------------------------------------------------------------------------

export const CLASSIFICATIONS = ["required", "recommended", "supplemental"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

/** A canonical question. `id` matches its key in the question registry. */
export interface Question {
  id: string;
  text: string;
  explanation: string;
  suggested_actions: string[];
}

/** A question reference inside a template phase, with its per-template classification. */
export interface TemplateQuestion {
  question_id: string;
  classification: Classification;
  unlock_requires?: string[];
}

/** A phase groups questions and unlocks only when its `unlock_requires` questions are complete. */
export interface Phase {
  id: string;
  title: string;
  unlock_requires: string[];
  questions: TemplateQuestion[];
}

/** A template selects relevant questions and groups them into phases. */
export interface Template {
  template_key: string;
  title: string;
  phases: Phase[];
}

/** The combined catalog: version + question registry + templates. */
export interface Catalog {
  version: string;
  questions: Record<string, Question>;
  templates: Template[];
}

// ---------------------------------------------------------------------------
// Zod schemas — a catalog must satisfy these shapes (used at API boundaries).
// ---------------------------------------------------------------------------

export const ClassificationSchema = z.enum(CLASSIFICATIONS);

export const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  explanation: z.string(),
  suggested_actions: z.array(z.string()),
});

export const TemplateQuestionSchema = z.object({
  question_id: z.string().min(1),
  classification: ClassificationSchema,
  unlock_requires: z.array(z.string()).optional(),
});

export const PhaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  unlock_requires: z.array(z.string()),
  questions: z.array(TemplateQuestionSchema),
});

export const TemplateSchema = z.object({
  template_key: z.string().min(1),
  title: z.string().min(1),
  phases: z.array(PhaseSchema),
});

export const CatalogSchema = z.object({
  version: z.string().min(1),
  questions: z.record(z.string(), QuestionSchema),
  templates: z.array(TemplateSchema),
});




// ---------------------------------------------------------------------------
// Canonical question registry (plan section 5). One entry per stable question
// id. Every template references ids from this map; `validateCatalog` fails if a
// template references an id that is not here. Ids are stable strings, never
// reused or renumbered.
// ---------------------------------------------------------------------------

export const QUESTION_REGISTRY = {
  // ── CP1 — Startup Checkpoint 1 (idea validation) ─────────────────────────

  cp1_team_name: {
    id: "cp1_team_name",
    text: "Tên nhóm của bạn là gì?",
    explanation:
      "Ghi rõ tên nhóm dự án theo danh sách đăng ký môn học.",
    suggested_actions: ["Điền đúng tên nhóm đã đăng ký."],
  },

  cp1_team_members: {
    id: "cp1_team_members",
    text: "Nhóm gồm những thành viên nào và mỗi người phụ trách công việc gì?",
    explanation:
      "Liệt kê từng thành viên theo dạng: họ tên — vai trò — công việc phụ trách cụ thể. " +
      "Ví dụ: \"Nguyễn Văn A — Trưởng nhóm — phụ trách nghiên cứu khách hàng và phỏng vấn người dùng.\"",
    suggested_actions: [
      "Liệt kê đầy đủ thành viên kèm vai trò và đầu việc cụ thể.",
    ],
  },

  cp1_idea_name: {
    id: "cp1_idea_name",
    text: "Tên ý tưởng / sản phẩm của nhóm là gì?",
    explanation:
      "Tên phải mô tả được sản phẩm, không dùng slogan chung chung. " +
      "Ví dụ không đạt: \"Nền tảng kết nối thông minh.\" " +
      "Ví dụ đạt: \"Ứng dụng đặt chỗ học nhóm theo giờ tại quán cà phê gần trường đại học.\"",
    suggested_actions: [
      "Đặt tên mô tả đúng sản phẩm, tránh slogan mơ hồ.",
    ],
  },

  cp1_primary_customer: {
    id: "cp1_primary_customer",
    text: "Khách hàng chính của nhóm là ai?",
    explanation:
      "Mô tả đủ hẹp để nhóm tìm được người thật trong vòng một tuần. Cần trả lời đủ: " +
      "họ là ai, độ tuổi bao nhiêu, hoạt động trong bối cảnh nào, hành vi cụ thể liên quan đến vấn đề là gì, " +
      "khả năng chi trả ở mức nào, và lý do nhóm chọn nhóm người này trước tiên. " +
      "Ví dụ không đạt: \"Sinh viên\", \"Người đi làm\". " +
      "Ví dụ đạt: \"Sinh viên đại học năm 2 đến năm 3 tại TP.HCM, thường học nhóm 3 đến 6 người sau giờ học " +
      "ít nhất hai lần mỗi tuần để làm bài tập nhóm, có thể chi khoảng 30 đến 50 nghìn mỗi buổi.\"",
    suggested_actions: [
      "Mô tả đủ 6 yếu tố: là ai, độ tuổi, bối cảnh, hành vi, khả năng chi trả, lý do chọn trước.",
      "Đảm bảo có thể tìm được người thật để phỏng vấn trong 1 tuần.",
    ],
  },

  cp1_non_priority_customer: {
    id: "cp1_non_priority_customer",
    text: "Ai không phải là khách hàng ưu tiên trong giai đoạn đầu?",
    explanation:
      "Ghi rõ nhóm nào nhóm chưa phục vụ và lý do cụ thể. Đây không phải phần để liệt kê ai nhóm không thích — " +
      "mà là để nhóm tự biết mình đang cố tình bỏ ai ra ngoài và vì sao quyết định đó hợp lý trong giai đoạn đầu.",
    suggested_actions: [
      "Liệt kê nhóm bị loại và nêu lý do chiến lược cụ thể.",
    ],
  },

  cp1_role_breakdown: {
    id: "cp1_role_breakdown",
    text: "Các vai trong ý tưởng (User, Customer, Payer, Partner) là ai?",
    explanation:
      "Nếu chỉ có một bên duy nhất, ghi rõ: \"Chỉ có một bên duy nhất.\" Nếu có nhiều bên, mô tả từng vai theo cấu trúc: " +
      "\"[Tên vai] là [mô tả họ là ai]. Pain riêng của họ là [vấn đề họ gặp]. Lợi ích khi tham gia là [điều họ được]. " +
      "Lý do họ sẽ tham gia là [động lực cụ thể].\" Bốn vai cần xác định: User, Customer, Payer, Partner. " +
      "Nếu một bên vừa là User vừa là Payer, ghi rõ. Không được gộp lợi ích của nhiều bên thành một mô tả chung.",
    suggested_actions: [
      "Xác định 4 vai User / Customer / Payer / Partner, ghi rõ nếu trùng nhau.",
      "Mô tả từng vai theo pain, lợi ích, động lực riêng.",
    ],
  },

  cp1_customer_story: {
    id: "cp1_customer_story",
    text: "Câu chuyện về một khách hàng tiêu biểu cụ thể là gì?",
    explanation:
      "Kể về một người dùng tiêu biểu cụ thể — có tên, tuổi, bối cảnh, mục tiêu, rào cản. " +
      "Câu chuyện phải đủ cụ thể để hình dung được người thật. " +
      "Ví dụ không đạt: \"Người dùng là sinh viên gặp khó khăn khi học nhóm.\" " +
      "Ví dụ đạt: \"Minh, 20 tuổi, sinh viên năm 2 tại TP.HCM. Minh thường học nhóm 4 người vào tối thứ Ba và thứ Năm. " +
      "Mỗi lần tìm chỗ, Minh phải nhắn tin hỏi mấy bạn, đi thử 2 đến 3 quán rồi mới biết còn bàn lớn và có ổ điện không. " +
      "Hôm deadline môn Marketing, cả nhóm mất gần một tiếng tìm chỗ trước khi ngồi được.\"",
    suggested_actions: [
      "Viết câu chuyện có tên, tuổi, bối cảnh, mục tiêu, rào cản cụ thể.",
    ],
  },

  cp1_main_problem: {
    id: "cp1_main_problem",
    text: "Vấn đề chính của khách hàng là gì?",
    explanation:
      "Viết rõ vấn đề xảy ra trong tình huống nào, tần suất bao nhiêu, hậu quả cụ thể là gì — " +
      "tính bằng thời gian, tiền bạc, rủi ro, hoặc cơ hội bị mất. Đây là vấn đề của khách hàng, không phải quan sát của nhóm. " +
      "Ví dụ không đạt: \"Sinh viên mất thời gian tìm chỗ học nhóm.\" " +
      "Ví dụ đạt: \"Sinh viên năm 2 đến năm 3 phải mất 30 đến 60 phút để tìm chỗ học nhóm mỗi khi gần deadline. " +
      "Nếu không tìm được chỗ phù hợp, cả nhóm phải ngồi tạm hoặc đổi địa điểm nhiều lần, khiến buổi học bị trễ và mọi người mất tập trung.\"",
    suggested_actions: [
      "Nêu tình huống, tần suất, hậu quả đo được (thời gian / tiền / rủi ro).",
      "Viết theo góc nhìn vấn đề của khách hàng, không phải quan sát của nhóm.",
    ],
  },

  cp1_problem_severity: {
    id: "cp1_problem_severity",
    text: "Vì sao vấn đề này đủ đau để khách hàng chủ động tìm giải pháp?",
    explanation:
      "Trả lời thẳng: đây là vấn đề thật hay chỉ là \"hơi bất tiện\"? Điều gì xảy ra nếu không giải quyết? " +
      "Tần suất vấn đề lặp lại có đủ để khách hàng chịu thay đổi hành vi không?",
    suggested_actions: [
      "Phân biệt \"vấn đề thật\" với \"hơi bất tiện\".",
      "Nêu hậu quả nếu không giải quyết và tần suất lặp lại.",
    ],
  },

  cp1_current_alternatives: {
    id: "cp1_current_alternatives",
    text: "Hiện tại khách hàng đang dùng cách nào để giải quyết vấn đề?",
    explanation:
      "Liệt kê tất cả cách khách hàng đang tự xử lý vấn đề — kể cả \"không làm gì\" hoặc \"chấp nhận sống chung với vấn đề.\" " +
      "Mỗi cách viết thành một câu rõ ràng mô tả họ đang làm gì cụ thể.",
    suggested_actions: [
      "Liệt kê mọi cách hiện tại, kể cả \"không làm gì\".",
    ],
  },

  cp1_alternatives_analysis: {
    id: "cp1_alternatives_analysis",
    text: "Phân tích từng cách khách hàng đang dùng hiện tại?",
    explanation:
      "Với mỗi cách khách hàng đang dùng, phân tích theo bốn chiều: cách đó có tốn tiền không và bao nhiêu, " +
      "có tốn thời gian không và ở bước nào, bất tiện cụ thể ở đâu trong quy trình, và quan trọng nhất — " +
      "vì sao họ vẫn tiếp tục dùng dù biết nó bất tiện?",
    suggested_actions: [
      "Phân tích mỗi cách theo 4 chiều: tiền, thời gian, bất tiện, lý do vẫn dùng.",
    ],
  },

  cp1_required_improvement: {
    id: "cp1_required_improvement",
    text: "Sản phẩm phải tốt hơn ở điểm nào cụ thể để khách hàng chịu đổi hành vi?",
    explanation:
      "Trả lời thẳng: khách hàng phải thấy khác biệt gì rõ ràng so với cách họ đang làm thì mới chịu chuyển sang dùng sản phẩm của nhóm? " +
      "Không được viết chung chung kiểu \"tiện hơn\" hay \"nhanh hơn\" — phải nói nhanh hơn bao nhiêu, tiện ở bước cụ thể nào.",
    suggested_actions: [
      "Nêu khác biệt đo được (nhanh hơn bao nhiêu, tiện ở bước nào), tránh \"tiện hơn / nhanh hơn\" chung chung.",
    ],
  },

  cp1_solution_description: {
    id: "cp1_solution_description",
    text: "Sản phẩm làm gì, cho ai, trong tình huống nào?",
    explanation:
      "Mô tả sản phẩm theo ba chiều: làm gì cụ thể, cho ai cụ thể, trong tình huống nào cụ thể. " +
      "Không dùng các cụm từ mơ hồ như \"nền tảng thông minh\", \"tối ưu trải nghiệm\", \"AI tự động\", \"all-in-one\", \"kết nối.\" " +
      "Nếu buộc phải dùng, phải định nghĩa vận hành ngay bên dưới: từ này có nghĩa gì cụ thể, ai đánh giá được, đo bằng tiêu chí nào.",
    suggested_actions: [
      "Mô tả theo 3 chiều: làm gì, cho ai, tình huống nào.",
      "Định nghĩa vận hành mọi từ mơ hồ nếu buộc phải dùng.",
    ],
  },

  cp1_solution_mechanism: {
    id: "cp1_solution_mechanism",
    text: "Cơ chế tác động — sản phẩm giảm pain bằng cách nào?",
    explanation:
      "Mô tả theo luồng bốn bước. \"Input\": người dùng cung cấp gì cho sản phẩm? " +
      "\"Xử lý\": sản phẩm làm gì với input đó, theo cơ chế nào? " +
      "\"Output\": người dùng nhận được gì cụ thể? " +
      "\"Hành động\": output đó giúp người dùng làm gì tốt hơn so với trước?",
    suggested_actions: [
      "Viết đủ 4 bước: Input → Xử lý → Output → Hành động.",
    ],
  },

  cp1_core_features: {
    id: "cp1_core_features",
    text: "Tính năng lõi của bản đầu tiên là gì?",
    explanation:
      "Liệt kê từng tính năng nhóm sẽ làm trong bản đầu tiên. Với mỗi tính năng, ghi rõ: " +
      "tính năng đó giải quyết pain nào cụ thể, và có trong bản đầu tiên không. " +
      "Định dạng gợi ý: \"[Tên tính năng] — giải quyết [pain cụ thể] — Có / Không có trong bản đầu.\"",
    suggested_actions: [
      "Liệt kê tính năng kèm pain nó giải quyết và có / không trong bản đầu.",
    ],
  },

  cp1_out_of_scope: {
    id: "cp1_out_of_scope",
    text: "Những gì nhóm chủ động không làm ở giai đoạn đầu?",
    explanation:
      "Bắt buộc phải điền. Nhóm phải biết rõ mình đang cố tình bỏ ra những gì và vì sao. " +
      "Ghi cụ thể từng tính năng hoặc nhóm người dùng mà nhóm chủ động không phục vụ trong giai đoạn đầu, kèm lý do.",
    suggested_actions: [
      "Liệt kê tính năng / nhóm người dùng không phục vụ, kèm lý do.",
    ],
  },

  cp1_riskiest_assumption: {
    id: "cp1_riskiest_assumption",
    text: "Giả định nguy hiểm nhất cần test trước là gì?",
    explanation:
      "Trả lời: nếu giả định này sai, toàn bộ ý tưởng sẽ không hoạt động. " +
      "Chỉ chọn một giả định duy nhất quan trọng nhất, không liệt kê nhiều.",
    suggested_actions: [
      "Chọn đúng MỘT giả định mà nếu sai thì ý tưởng sụp đổ.",
    ],
  },

  cp1_mvp_definition: {
    id: "cp1_mvp_definition",
    text: "MVP của nhóm là gì?",
    explanation:
      "Mô tả bản test nhỏ nhất — có thể là Google Form, landing page, Zalo, Notion, hoặc concierge MVP (làm thủ công). " +
      "Không phải app đầy đủ. Giải thích tại sao cách này đủ để kiểm chứng giả định nguy hiểm nhất.",
    suggested_actions: [
      "Mô tả bản test nhỏ nhất (form / landing page / thủ công), không phải app đầy đủ.",
      "Giải thích vì sao cách này đủ test giả định nguy hiểm nhất.",
    ],
  },

  cp1_mvp_test_plan: {
    id: "cp1_mvp_test_plan",
    text: "Test MVP với ai, ở đâu, khi nào?",
    explanation:
      "Cụ thể đến mức có thể hành động ngay. Ví dụ đạt: \"10 đến 15 sinh viên năm 2 đến năm 3 tại Đại học Kinh tế TP.HCM, " +
      "tìm qua nhóm Facebook lớp học, test trong tuần từ ngày 14 đến ngày 20 tháng này.\"",
    suggested_actions: [
      "Nêu rõ ai, ở đâu, khi nào với số lượng và kênh tìm người cụ thể.",
    ],
  },

  cp1_mvp_pass_fail: {
    id: "cp1_mvp_pass_fail",
    text: "Tiêu chí pass và fail của MVP là gì?",
    explanation:
      "Viết thành ba đoạn rõ ràng. \"Pass\": kết quả nào, cụ thể và đo được, chứng minh giả định đúng? " +
      "\"Fail\": kết quả nào chứng minh giả định sai? " +
      "\"Học được gì nếu fail\": nếu kết quả là fail, nhóm sẽ điều chỉnh theo hướng nào?",
    suggested_actions: [
      "Xác định rõ Pass (số đo được), Fail, và hướng điều chỉnh nếu fail.",
    ],
  },

  cp1_evidence_assumptions: {
    id: "cp1_evidence_assumptions",
    text: "Đâu là dữ liệu thực tế (bằng chứng), đâu là giả định chưa kiểm chứng?",
    explanation:
      "Viết thành hai phần rõ ràng. Phần một — \"Những điều nhóm biết từ dữ liệu thực tế\": liệt kê từng điều kèm nguồn gốc " +
      "(phỏng vấn bao nhiêu người, khảo sát từ đâu, quan sát ở đâu; bằng chứng theo loại: phỏng vấn, khảo sát, quan sát thực tế, " +
      "thử nghiệm, số liệu thứ cấp kèm nguồn và năm). Phần hai — \"Những điều nhóm đang giả định và chưa kiểm chứng\": liệt kê từng giả định, " +
      "nêu \"nếu giả định này sai thì điều gì xảy ra\" và \"cách test nhỏ nhất để kiểm chứng\". " +
      "Nếu chưa có bằng chứng nào, ghi thẳng: \"Chưa có bằng chứng. Toàn bộ phần dưới là giả định cần kiểm chứng.\"",
    suggested_actions: [
      "Liệt kê bằng chứng theo loại kèm nguồn gốc (phỏng vấn / khảo sát / quan sát / thứ cấp).",
      "Liệt kê từng giả định kèm tác động nếu sai và cách test nhỏ nhất.",
      "Nếu chưa có gì, ghi rõ \"Chưa có bằng chứng\" thay vì để trống.",
    ],
  },

  cp1_revenue_model: {
    id: "cp1_revenue_model",
    text: "Mô hình doanh thu dự kiến là gì?",
    explanation:
      "Ở Checkpoint 1 chưa cần chứng minh doanh thu thật, nhưng phải xác định được ai có thể trả tiền và vì lý do gì. " +
      "Nếu người trả tiền không phải người dùng, phải giải thích vì sao họ có động lực trả. Trả lời bốn câu hỏi: " +
      "Ai là người trả tiền? Họ trả vì nhận được giá trị gì cụ thể? Hình thức thu tiền (một lần, định kỳ, theo lượt dùng, hoa hồng)? " +
      "Đây là dữ liệu thực tế hay giả định?",
    suggested_actions: [
      "Xác định ai trả tiền, giá trị họ nhận, hình thức thu, và dữ liệu / giả định.",
    ],
  },

  // ── CP2 — Startup Checkpoint 2 (market research + debate) ─────────────────

  cp2_problem_need: {
    id: "cp2_problem_need",
    text: "Vấn đề / Nhu cầu khách hàng mà nhóm giải quyết là gì?",
    explanation:
      "Nêu rõ vấn đề hoặc nhu cầu khách hàng — nền tảng của cơ hội (Cơ hội = Vấn đề/Nhu cầu + Giải pháp).",
    suggested_actions: ["Mô tả vấn đề / nhu cầu khách hàng cụ thể."],
  },

  cp2_solution: {
    id: "cp2_solution",
    text: "Giải pháp của nhóm là gì?",
    explanation:
      "Mô tả giải pháp nhóm đề xuất để giải quyết vấn đề / nhu cầu đã xác định.",
    suggested_actions: ["Mô tả giải pháp cụ thể gắn với vấn đề."],
  },

  cp2_opportunity: {
    id: "cp2_opportunity",
    text: "Cơ hội của nhóm là gì?",
    explanation:
      "Cơ hội = Vấn đề/Nhu cầu + Giải pháp. Nêu rõ vì sao sự kết hợp này tạo ra cơ hội kinh doanh.",
    suggested_actions: ["Kết hợp rõ Vấn đề + Giải pháp thành cơ hội."],
  },

  cp2_vpc_customer_profile: {
    id: "cp2_vpc_customer_profile",
    text: "Value Proposition Canvas — Bức tranh Khách hàng (Jobs to be done, Pains, Gains)?",
    explanation:
      "Xác định Jobs to be done (công việc khách muốn hoàn thành), Pains (nỗi đau), Gains (lợi ích mong muốn) của khách hàng mục tiêu.",
    suggested_actions: ["Liệt kê Jobs, Pains, Gains của khách hàng."],
  },

  cp2_vpc_value_map: {
    id: "cp2_vpc_value_map",
    text: "Value Proposition Canvas — Bức tranh Sản phẩm (Products & Services, Pain Relievers, Gain Creators)?",
    explanation:
      "Xác định Products & Services, Pain Relievers (giảm đau), Gain Creators (tạo lợi ích) mà sản phẩm cung cấp, đối chiếu với bức tranh khách hàng.",
    suggested_actions: [
      "Liệt kê Products / Services, Pain Relievers, Gain Creators.",
    ],
  },

  cp2_research_objectives: {
    id: "cp2_research_objectives",
    text: "Mục tiêu nghiên cứu (câu hỏi nghiên cứu cụ thể) là gì?",
    explanation:
      "Nêu mục tiêu nghiên cứu khách hàng dưới dạng các câu hỏi nghiên cứu cụ thể, rõ ràng.",
    suggested_actions: [
      "Viết mục tiêu nghiên cứu thành các câu hỏi nghiên cứu cụ thể.",
    ],
  },

  cp2_customer_discovery_process: {
    id: "cp2_customer_discovery_process",
    text: "Quá trình Khám phá khách hàng (Customer Discovery) diễn ra như thế nào?",
    explanation:
      "Mô tả quá trình thực hiện Customer Discovery: đã làm gì, theo trình tự nào, thu được gì.",
    suggested_actions: [
      "Mô tả các bước Customer Discovery và kết quả thu được.",
    ],
  },

  cp2_expert_interviews: {
    id: "cp2_expert_interviews",
    text: "Nhóm đã phỏng vấn chuyên gia nào và học được gì?",
    explanation:
      "BẮT BUỘC — trượt nếu thiếu. Phải phỏng vấn ít nhất 2 chuyên gia, mỗi người có ≥6 tháng kinh nghiệm. " +
      "Với mỗi chuyên gia: hồ sơ (profile) và thông tin liên hệ, cùng các learning points: market view (góc nhìn thị trường), " +
      "beware-of (điều cần cảnh giác), experience with target customers (kinh nghiệm với khách hàng mục tiêu), và các điểm khác.",
    suggested_actions: [
      "Phỏng vấn ≥2 chuyên gia, mỗi người ≥6 tháng kinh nghiệm.",
      "Ghi hồ sơ + liên hệ và learning points (market view, beware-of, kinh nghiệm với khách hàng mục tiêu).",
    ],
  },

  cp2_survey: {
    id: "cp2_survey",
    text: "Nhóm đã thực hiện khảo sát (survey) như thế nào và kết quả ra sao?",
    explanation:
      "BẮT BUỘC — trượt nếu thiếu. Khảo sát phải đạt ≥100 người trả lời. Cần nêu đầy đủ: mục tiêu và đối tượng khảo sát, " +
      "phương pháp, thiết kế bảng hỏi (≥2 loại câu hỏi và ≥7 câu), cách tuyển người trả lời, ưu đãi (incentives), " +
      "ẩn danh (phần demographic + email bắt buộc), công cụ sử dụng, lưu trữ dữ liệu, đồng thuận có hiểu biết (informed consent), " +
      "phương pháp chọn mẫu / tỷ lệ phản hồi, phân tích, và kết luận.",
    suggested_actions: [
      "Đảm bảo ≥100 người trả lời.",
      "Nêu đủ: mục tiêu, phương pháp, bảng hỏi ≥7 câu ≥2 loại, tuyển người, incentives, ẩn danh (demographic + email), công cụ, lưu trữ, consent, chọn mẫu, phân tích, kết luận.",
    ],
  },

  cp2_pain_point_interviews: {
    id: "cp2_pain_point_interviews",
    text: "[Không bắt buộc] Nhóm đã phỏng vấn pain point chưa?",
    explanation:
      "Không bắt buộc. Nếu làm: ≥10 người phỏng vấn mỗi nhóm liên quan (stakeholder), " +
      "tổng hợp 3 câu: có nỗi đau thật không? nỗi đau đó là gì? có nhiều người gặp không?",
    suggested_actions: [
      "Nếu làm, phỏng vấn ≥10 / stakeholder và tổng hợp 3 câu: có đau thật, là gì, có nhiều không.",
    ],
  },

  cp2_tam_sam_som: {
    id: "cp2_tam_sam_som",
    text: "Quy mô thị trường TAM / SAM / SOM của nhóm là bao nhiêu?",
    explanation:
      "Ước lượng TAM (tổng thị trường), SAM (thị trường có thể phục vụ), SOM (thị trường có thể chiếm). " +
      "Khuyến khích dùng cách tính bottom-up cho SOM.",
    suggested_actions: ["Tính TAM, SAM, SOM; ưu tiên bottom-up cho SOM."],
  },

  cp2_porters_five_forces: {
    id: "cp2_porters_five_forces",
    text: "Phân tích Porter's Five Forces cho thị trường của nhóm?",
    explanation:
      "Phân tích 5 lực lượng: rivalry (cạnh tranh nội bộ), new entrants (người mới), substitution (sản phẩm thay thế), " +
      "buyer power (quyền lực người mua), supplier power (quyền lực nhà cung cấp), và vị trí phòng thủ của nhóm.",
    suggested_actions: ["Phân tích đủ 5 lực lượng + vị trí phòng thủ."],
  },

  cp2_competitive_analysis: {
    id: "cp2_competitive_analysis",
    text: "Phân tích cạnh tranh (Competitive Analysis Framework) của nhóm?",
    explanation:
      "Phân loại đối thủ theo Direct / Indirect / Substitute / New entrants, " +
      "nêu các hành động cụ thể (Actionables) và điểm chung (commonalities) rút ra.",
    suggested_actions: [
      "Phân loại Direct / Indirect / Substitute / New entrants + Actionables + commonalities.",
    ],
  },

  cp2_invisible_competitors: {
    id: "cp2_invisible_competitors",
    text: "Đối thủ vô hình của nhóm là gì?",
    explanation:
      "Xác định đối thủ vô hình: sự trì hoãn, \"không làm gì cả\", thói quen hiện tại — " +
      "và cách nhóm thuyết phục khách đổi thói quen.",
    suggested_actions: [
      "Nêu đối thủ vô hình (trì hoãn, không làm gì, thói quen) và cách thuyết phục đổi thói quen.",
    ],
  },

  cp2_competitor_criteria_table: {
    id: "cp2_competitor_criteria_table",
    text: "[Không bắt buộc] Bảng tiêu chí so sánh đối thủ (Competitors' Criteria Table)?",
    explanation:
      "Không bắt buộc. Nếu làm để đạt điểm tối đa: so sánh theo các tiêu chí (metric), khoảng 9 đối thủ + startup của nhóm.",
    suggested_actions: [
      "Nếu làm, lập bảng theo metric với khoảng 9 đối thủ + startup mình.",
    ],
  },

  cp2_mvp_demo: {
    id: "cp2_mvp_demo",
    text: "Demo MVP / Prototype của nhóm là gì?",
    explanation: "Trình bày demo MVP hoặc prototype hiện có của sản phẩm.",
    suggested_actions: ["Chuẩn bị demo MVP / prototype có thể trình diễn."],
  },

  cp2_iteration_refinement: {
    id: "cp2_iteration_refinement",
    text: "Nhóm đã lặp và tinh chỉnh (Iterating & Refining) từ phản hồi khách hàng như thế nào?",
    explanation:
      "Từ phản hồi khách hàng: giả định nào sai, tính năng nào thêm / bớt / sửa.",
    suggested_actions: [
      "Nêu giả định sai và các tính năng thêm / bớt / sửa từ phản hồi.",
    ],
  },

  cp2_surprises_pivot: {
    id: "cp2_surprises_pivot",
    text: "Nhóm gặp bất ngờ gì và có pivot không?",
    explanation:
      "Nêu các bất ngờ và pivot: đổi tính năng, đổi B2C→B2B, đổi kênh / phân phối.",
    suggested_actions: [
      "Nêu bất ngờ và hướng pivot (tính năng, B2C→B2B, kênh / phân phối).",
    ],
  },

  cp2_pmf_signals: {
    id: "cp2_pmf_signals",
    text: "Dấu hiệu Product-Market Fit ban đầu của nhóm là gì?",
    explanation:
      "Nêu dấu hiệu PMF: sự hài lòng của khách hàng, tín hiệu nhu cầu, retention (tỷ lệ quay lại).",
    suggested_actions: [
      "Nêu dấu hiệu PMF: hài lòng, tín hiệu nhu cầu, retention.",
    ],
  },

  cp2_marketing_4p: {
    id: "cp2_marketing_4p",
    text: "Chiến lược 4P của nhóm là gì?",
    explanation:
      "Nêu 4P: Product (sản phẩm), Price (giá), Promotion (truyền thông), Place (kênh phân phối).",
    suggested_actions: ["Xác định rõ Product, Price, Promotion, Place."],
  },

  cp2_ai_disclosure: {
    id: "cp2_ai_disclosure",
    text: "Tuyên bố công bố dùng AI (AI disclosure statement) của nhóm?",
    explanation:
      "BẮT BUỘC — trượt nếu thiếu. Viết đoạn nêu rõ dùng AI để làm gì + các prompt đã dùng.",
    suggested_actions: [
      "Nêu rõ dùng AI làm gì + liệt kê prompt đã dùng.",
    ],
  },

  cp2_harvard_referencing: {
    id: "cp2_harvard_referencing",
    text: "Danh mục tài liệu tham khảo theo chuẩn Harvard?",
    explanation:
      "BẮT BUỘC. Trích dẫn nguồn theo chuẩn Harvard referencing.",
    suggested_actions: ["Lập danh mục tham khảo đúng chuẩn Harvard."],
  },

  cp2_appendix: {
    id: "cp2_appendix",
    text: "Phụ lục (Appendix) của nhóm gồm những gì?",
    explanation:
      "BẮT BUỘC. Đính kèm hồ sơ chuyên gia và dữ liệu survey raw.",
    suggested_actions: ["Đính kèm hồ sơ chuyên gia + dữ liệu survey raw."],
  },

  cp2_format: {
    id: "cp2_format",
    text: "Nhóm đã tuân thủ định dạng báo cáo chưa?",
    explanation:
      "BẮT BUỘC. Định dạng: body 12pt, headings 12-16pt, font Arial/Times New Roman, double-spacing, lề 2.5cm, độ dài 5-25 trang.",
    suggested_actions: [
      "Tuân thủ: 12pt body, 12-16pt headings, Arial/TNR, double-spacing, lề 2.5cm, 5-25 trang.",
    ],
  },

  cp2_debate_defense: {
    id: "cp2_debate_defense",
    text: "Nhóm chuẩn bị phòng thủ (trả lời phản biện) như thế nào?",
    explanation:
      "Chuẩn bị cho cột điểm trả lời phản biện: dùng dữ liệu phỏng vấn sâu làm \"tấm khiên\" để bảo vệ lập luận.",
    suggested_actions: [
      "Chuẩn bị dùng dữ liệu phỏng vấn sâu làm căn cứ phòng thủ.",
    ],
  },

  cp2_debate_attack: {
    id: "cp2_debate_attack",
    text: "Nhóm chuẩn bị tấn công (đặt câu hỏi phản biện) như thế nào?",
    explanation:
      "Chuẩn bị cho cột điểm đặt câu hỏi phản biện: soi SOM (\"chiếm 1% thị trường tỷ đô\" fallacy), " +
      "đối thủ vô hình, và retention nếu sản phẩm dễ sao chép.",
    suggested_actions: [
      "Chuẩn bị câu hỏi về SOM fallacy, đối thủ vô hình, retention nếu dễ sao chép.",
    ],
  },
} satisfies Record<string, Question>;

export type QuestionId = keyof typeof QUESTION_REGISTRY;
export const CATALOG_QUESTIONS = QUESTION_REGISTRY;
export const VALID_QUESTION_IDS = Object.keys(QUESTION_REGISTRY) as QuestionId[];



// ---------------------------------------------------------------------------
// CP1 template — Startup Checkpoint 1 (idea validation).
// Authored from E:/FPT/Semester_7/EXE101/prompt/TEMPLATE_STARTUP_CHECKPOINT1_V2.docx
// (plan ground-truth row 22). Dedup per plan section 5: §3.3 (data vs assumption)
// is merged with §7 (evidence/assumptions) into cp1_evidence_assumptions; §9 summary
// and the pre-submit checklist are DERIVED from already-answered fields, so they are
// NOT added as new questions. Core fields = required; others recommended/supplemental.
// ---------------------------------------------------------------------------

export const cp1: Template = {
  template_key: "cp1",
  title: "Startup Checkpoint 1 — Mô tả ý tưởng",
  phases: [
    {
      id: "thong_tin_nhom",
      title: "Thông tin nhóm",
      unlock_requires: [],
      questions: [
        { question_id: "cp1_team_name", classification: "recommended" },
        { question_id: "cp1_team_members", classification: "recommended" },
        { question_id: "cp1_idea_name", classification: "required" },
      ],
    },
    {
      id: "khach_hang_muc_tieu",
      title: "Khách hàng mục tiêu",
      unlock_requires: [],
      questions: [
        { question_id: "cp1_primary_customer", classification: "required" },
        { question_id: "cp1_non_priority_customer", classification: "recommended" },
        { question_id: "cp1_role_breakdown", classification: "recommended" },
      ],
    },
    {
      id: "cau_chuyen_khach_hang",
      title: "Câu chuyện khách hàng",
      unlock_requires: ["cp1_primary_customer"],
      questions: [
        { question_id: "cp1_customer_story", classification: "recommended" },
      ],
    },
    {
      id: "pain_point",
      title: "Pain Point",
      unlock_requires: ["cp1_primary_customer"],
      questions: [
        { question_id: "cp1_main_problem", classification: "required" },
        { question_id: "cp1_problem_severity", classification: "required" },
      ],
    },
    {
      id: "cach_giai_quyet_hien_tai",
      title: "Cách khách hàng đang giải quyết hiện tại",
      unlock_requires: ["cp1_main_problem"],
      questions: [
        { question_id: "cp1_current_alternatives", classification: "required" },
        { question_id: "cp1_alternatives_analysis", classification: "recommended" },
        { question_id: "cp1_required_improvement", classification: "required" },
      ],
    },
    {
      id: "giai_phap",
      title: "Giải pháp",
      unlock_requires: ["cp1_main_problem"],
      questions: [
        { question_id: "cp1_solution_description", classification: "required" },
        { question_id: "cp1_solution_mechanism", classification: "required" },
        { question_id: "cp1_core_features", classification: "recommended" },
        { question_id: "cp1_out_of_scope", classification: "recommended" },
      ],
    },
    {
      id: "mvp",
      title: "MVP / Bản thử nghiệm đầu tiên",
      unlock_requires: ["cp1_solution_description"],
      questions: [
        { question_id: "cp1_riskiest_assumption", classification: "required" },
        { question_id: "cp1_mvp_definition", classification: "required" },
        { question_id: "cp1_mvp_test_plan", classification: "required" },
        { question_id: "cp1_mvp_pass_fail", classification: "required" },
      ],
    },
    {
      id: "bang_chung_gia_dinh",
      title: "Bằng chứng và giả định",
      unlock_requires: [],
      questions: [
        { question_id: "cp1_evidence_assumptions", classification: "required" },
      ],
    },
    {
      id: "mo_hinh_doanh_thu",
      title: "Mô hình doanh thu dự kiến",
      unlock_requires: ["cp1_solution_description"],
      questions: [
        { question_id: "cp1_revenue_model", classification: "recommended" },
      ],
    },
  ],
};

export const CP1_TEMPLATE = cp1;



// ---------------------------------------------------------------------------
// CP2 template — Startup Checkpoint 2 (market research + paired debate).
// Authored from plan section 9 only (the reconciled rubric: 5 phases + cross-cutting
// mandatory items + debate prep). No rubric content is invented here.
// Auto-fail items (2 expert interviews ≥6 months, survey ≥100 respondents, AI
// disclosure statement) are classification "required".
// ---------------------------------------------------------------------------

export const cp2: Template = {
  template_key: "cp2",
  title: "Startup Checkpoint 2 — Nghiên cứu thị trường & Debate",
  phases: [
    {
      id: "tong_quan_y_tuong",
      title: "Tổng quan ý tưởng & cơ hội",
      unlock_requires: [],
      questions: [
        { question_id: "cp2_problem_need", classification: "required" },
        { question_id: "cp2_solution", classification: "required" },
        { question_id: "cp2_opportunity", classification: "required" },
        { question_id: "cp2_vpc_customer_profile", classification: "required" },
        { question_id: "cp2_vpc_value_map", classification: "required" },
      ],
    },
    {
      id: "customer_discovery",
      title: "Customer Discovery",
      unlock_requires: ["cp2_problem_need"],
      questions: [
        { question_id: "cp2_research_objectives", classification: "required" },
        { question_id: "cp2_customer_discovery_process", classification: "required" },
        { question_id: "cp2_expert_interviews", classification: "required" },
        { question_id: "cp2_survey", classification: "required" },
        { question_id: "cp2_pain_point_interviews", classification: "supplemental" },
      ],
    },
    {
      id: "quy_mo_thi_truong",
      title: "Quy mô thị trường & cấu trúc",
      unlock_requires: ["cp2_research_objectives"],
      questions: [
        { question_id: "cp2_tam_sam_som", classification: "required" },
        { question_id: "cp2_porters_five_forces", classification: "required" },
        { question_id: "cp2_competitive_analysis", classification: "required" },
        { question_id: "cp2_invisible_competitors", classification: "required" },
        { question_id: "cp2_competitor_criteria_table", classification: "supplemental" },
      ],
    },
    {
      id: "mvp_demo",
      title: "Trình diễn MVP & vòng lặp tinh chỉnh",
      unlock_requires: ["cp2_solution"],
      questions: [
        { question_id: "cp2_mvp_demo", classification: "required" },
        { question_id: "cp2_iteration_refinement", classification: "required" },
        { question_id: "cp2_surprises_pivot", classification: "required" },
      ],
    },
    {
      id: "pmf_4p",
      title: "PMF ban đầu & 4P",
      unlock_requires: ["cp2_mvp_demo"],
      questions: [
        { question_id: "cp2_pmf_signals", classification: "required" },
        { question_id: "cp2_marketing_4p", classification: "required" },
      ],
    },
    {
      id: "cross_cutting",
      title: "Yêu cầu bắt buộc (Cross-cutting)",
      unlock_requires: [],
      questions: [
        { question_id: "cp2_ai_disclosure", classification: "required" },
        { question_id: "cp2_harvard_referencing", classification: "required" },
        { question_id: "cp2_appendix", classification: "required" },
        { question_id: "cp2_format", classification: "required" },
      ],
    },
    {
      id: "debate_prep",
      title: "Chuẩn bị phản biện (Debate)",
      unlock_requires: ["cp2_expert_interviews"],
      questions: [
        { question_id: "cp2_debate_defense", classification: "recommended" },
        { question_id: "cp2_debate_attack", classification: "recommended" },
      ],
    },
  ],
};

export const CP2_TEMPLATE = cp2;




// Typed index access: QUESTION_REGISTRY is a literal-keyed object (so question ids
// stay a closed union), cast here to a string-indexed view for lookups by arbitrary ids.
const registry = QUESTION_REGISTRY as Record<string, Question | undefined>;

// ---------------------------------------------------------------------------
// validateCatalog — fail-fast guard run at module load (index.ts) and in tests.
// Rejects:
//   1. any question_id (in questions[] or unlock_requires) missing from the registry
//   2. any classification outside required | recommended | supplemental
//   3. any dependency cycle across phase unlock_requires edges
// Also rejects duplicate question placement and cross-template dependencies.
// ---------------------------------------------------------------------------

export function validateCatalog(template: Template): void {
  // Map each question_id in this template to the phase that owns it.
  const phaseByQuestion = new Map<string, string>();

  for (const phase of template.phases) {
    for (const { question_id, classification } of phase.questions) {
      if (!registry[question_id]) {
        throw new Error(
          `validateCatalog: question_id "${question_id}" (phase "${phase.id}") is not present in the question registry`,
        );
      }
      if (!CLASSIFICATIONS.includes(classification)) {
        throw new Error(
          `validateCatalog: invalid classification "${classification}" on question_id "${question_id}" (phase "${phase.id}")`,
        );
      }
      if (phaseByQuestion.has(question_id)) {
        throw new Error(
          `validateCatalog: question_id "${question_id}" appears in multiple phases`,
        );
      }
      phaseByQuestion.set(question_id, phase.id);
    }
  }

  // Build the phase dependency graph, then detect cycles.
  const adjacency = new Map<string, string[]>();
  for (const phase of template.phases) {
    adjacency.set(phase.id, []);
  }

  for (const phase of template.phases) {
    for (const depQuestionId of phase.unlock_requires) {
      if (!registry[depQuestionId]) {
        throw new Error(
          `validateCatalog: unlock_requires references question_id "${depQuestionId}" (phase "${phase.id}") not present in the question registry`,
        );
      }
      const depPhaseId = phaseByQuestion.get(depQuestionId);
      if (depPhaseId === undefined) {
        throw new Error(
          `validateCatalog: unlock_requires references question_id "${depQuestionId}" (phase "${phase.id}") that is not part of this template`,
        );
      }
      adjacency.get(phase.id)!.push(depPhaseId);
    }
  }

  assertNoDependencyCycles(adjacency);
}

function assertNoDependencyCycles(adjacency: Map<string, string[]>): void {
  const state = new Map<string, "visiting" | "visited">();

  const visit = (phaseId: string, path: string[]): void => {
    const current = state.get(phaseId);
    if (current === "visited") return;
    if (current === "visiting") {
      throw new Error(
        `validateCatalog: dependency cycle detected: ${[...path, phaseId].join(" -> ")}`,
      );
    }
    state.set(phaseId, "visiting");
    for (const dep of adjacency.get(phaseId) ?? []) {
      visit(dep, [...path, phaseId]);
    }
    state.set(phaseId, "visited");
  };

  for (const phaseId of adjacency.keys()) {
    visit(phaseId, []);
  }
}


export const CATALOG_VERSION = "2026-10-05.1";
validateCatalog(cp1);
validateCatalog(cp2);


export const UpsertProjectAnswerInputSchema = z.object({
  question_id: z.string().min(1, 'Question ID không được để trống'),
  answer_text: z.string(),
});
export type UpsertProjectAnswerInput = z.infer<typeof UpsertProjectAnswerInputSchema>;

export const BatchUpsertProjectAnswersInputSchema = z.object({
  answers: z.array(UpsertProjectAnswerInputSchema),
});
export type BatchUpsertProjectAnswersInput = z.infer<typeof BatchUpsertProjectAnswersInputSchema>;

export const ProjectAnswerSchema = z.object({
  id: z.string(),
  case_id: z.string(),
  question_id: z.string(),
  answer_text: z.string(),
  updated_at: z.union([z.date(), z.string()]),
});
export type ProjectAnswerEntity = z.infer<typeof ProjectAnswerSchema>;


