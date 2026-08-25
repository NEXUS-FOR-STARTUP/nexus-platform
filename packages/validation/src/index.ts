import { z } from 'zod';

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
// Team-Idea Fit Free — lightweight report schema (no structured fields)
// ---------------------------------------------------------------------------

export const TeamFitFreeReportSchema = z.object({
  teamGaps: z.array(z.string()),
  commercialGaps: z.array(z.string()),
});

export type TeamFitFreeReport = z.infer<typeof TeamFitFreeReportSchema>;

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
  role: z.enum(['user', 'supporter', 'admin']),
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

export const CP1_MAX_DOCUMENTS = 10;
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

  // 3. Support needs validation
  const supportNeeds = data.support_needs;
  const hasPrimaryNeed = supportNeeds
    && typeof supportNeeds === 'object'
    && typeof (supportNeeds as Record<string, unknown>).primary_need === 'string'
    && ((supportNeeds as Record<string, unknown>).primary_need as string).trim().length >= 5;

  if (!hasPrimaryNeed) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cần chọn nhu cầu hỗ trợ chính", path: ["support_needs"] });
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
  "competitor_analysis",
  "customer_research",
  "task_assignment",
  "other",
] as const;

export type DocumentCategoryCode = (typeof DOCUMENT_CATEGORY_CODES)[number];

const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategoryCode, string> = {
  idea_report: "Báo cáo ý tưởng",
  pitch_deck: "Slide thuyết trình",
  competitor_analysis: "Phân tích đối thủ",
  customer_research: "Khảo sát khách hàng",
  task_assignment: "Đề cương phân công",
  other: "Tài liệu bổ sung",
};

export function docCategoryLabel(code: string): string {
  return DOCUMENT_CATEGORY_LABELS[code as DocumentCategoryCode] ?? code;
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
