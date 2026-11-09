import { z } from "zod";
import { ROLE_TRACK_CODES } from "./role-tracks.js";

// ---------------------------------------------------------------------------
// Team-Idea Fit — input schemas shared between frontend + API
// Lives outside index.ts so pre-cp1 modules can import it without a cycle.
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
  strengths: z.array(z.string().min(2).max(200)).min(1).max(10),
  experience: z.array(z.string().min(2).max(500)).max(10),
});

export type TeamMemberInput = z.infer<typeof TeamMemberInputSchema>;

export const MAX_TEAM_MEMBERS = 6;

export const TeamFitInputSchema = z.object({
  idea: IdeaInputSchema,
  team: z.array(TeamMemberInputSchema).min(1).max(MAX_TEAM_MEMBERS),
});

export type TeamFitInput = z.infer<typeof TeamFitInputSchema>;
