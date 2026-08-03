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
