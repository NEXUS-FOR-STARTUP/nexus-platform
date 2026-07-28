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
