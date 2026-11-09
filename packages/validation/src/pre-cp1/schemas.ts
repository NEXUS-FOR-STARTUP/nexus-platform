import { z } from "zod";
import { IdeaInputSchema } from "../team-fit-contract.js";
import {
  ASKED_MAJORS,
  ASSET_PROMPT_IDS,
  ASSET_RULE_IDS,
  BUDGET_CODES,
  CAP_CODES,
  COURSE_CODES,
  GOAL_CODES,
  IDEA_MODES,
  IDEA_RULE_IDS,
  MAD_LIB_IDS,
  MAJORS,
  MAX_TEAM_SIZE_API,
  NET_IDS,
  SCHOOL_CODES,
  SENSITIVE_IDS,
  TEAM_RULES,
  TEXT_LIMITS,
} from "./catalog.js";
import { ROLE_TRACK_CODES } from "../role-tracks.js";

const LEVEL_VALUES = [1, 2, 3] as const;

export const PreCp1MemberSchema = z
  .object({
    name: z.string().max(TEXT_LIMITS.name).optional(),
    major: z.enum(MAJORS),
    majorOther: z.string().max(TEXT_LIMITS.majorOther).optional(),
    /** Required only for "Ngành khác": the report counts people per work track. */
    roleTrackHint: z.enum(ROLE_TRACK_CODES).optional(),
    caps: z.partialRecord(z.enum(CAP_CODES), z.union([z.literal(1), z.literal(2), z.literal(3)])),
    unsure: z.boolean(),
    extra: z.string().max(TEXT_LIMITS.extra).optional(),
  })
  .superRefine((member, ctx) => {
    if (ASKED_MAJORS.includes(member.major) && !member.roleTrackHint) {
      ctx.addIssue({
        code: "custom",
        path: ["roleTrackHint"],
        message: 'Chọn phần việc thiên về đâu khi chuyên ngành là "Ngành khác".',
      });
    }
    for (const value of Object.values(member.caps)) {
      if (!LEVEL_VALUES.includes(value as (typeof LEVEL_VALUES)[number])) {
        ctx.addIssue({ code: "custom", path: ["caps"], message: "Mức năng lực chỉ nhận 1, 2 hoặc 3." });
      }
    }
  });

export type PreCp1Member = z.infer<typeof PreCp1MemberSchema>;

export const PreCp1InputSchema = z
  .object({
    school: z.enum(SCHOOL_CODES),
    schoolName: z.string().max(TEXT_LIMITS.schoolName).optional(),
    course: z.enum(COURSE_CODES),
    courseName: z.string().max(TEXT_LIMITS.courseName).optional(),
    goal: z.enum(GOAL_CODES),
    budget: z.enum(BUDGET_CODES),
    // Technical ceiling only: schools other than FPT set no team-size rule of their own.
    team: z.array(PreCp1MemberSchema).min(1).max(MAX_TEAM_SIZE_API),
    assets: z.partialRecord(z.enum(ASSET_PROMPT_IDS), z.string().max(TEXT_LIMITS.assetAnswer)),
    assetsNone: z.array(z.enum(ASSET_PROMPT_IDS)),
    assetsOther: z.string().max(TEXT_LIMITS.assetsOther).optional(),
    network: z.array(z.enum(NET_IDS)).max(8),
    networkOther: z.string().max(TEXT_LIMITS.networkOther).optional(),
    /** Branch the user picked: draft = "chưa có ý tưởng", structured = six boxes. */
    ideaMode: z.enum(IDEA_MODES),
    pain: z.string().max(TEXT_LIMITS.idea).optional(),
    idea: z.string().max(TEXT_LIMITS.idea).optional(),
    madlibs: z.partialRecord(z.enum(MAD_LIB_IDS), z.string().max(TEXT_LIMITS.madlib)).optional(),
    sensitive: z.array(z.enum(SENSITIVE_IDS)),
    assetTags: z.partialRecord(z.enum(ASSET_RULE_IDS), z.enum(["yes", "no"])),
    ideaTags: z.partialRecord(z.enum(IDEA_RULE_IDS), z.enum(["yes", "no"])),
  })
  .superRefine((input, ctx) => {
    if (input.school === "fpt" && input.team.length > TEAM_RULES.sizeMax) {
      ctx.addIssue({
        code: "custom",
        path: ["team"],
        message: `Trường FPT giới hạn nhóm tối đa ${TEAM_RULES.sizeMax} người.`,
      });
    }
  });

export type PreCp1Input = z.infer<typeof PreCp1InputSchema>;

/** Raw AI label: shown back to the user only, never fed into any rule. */
export const LabelQuoteSchema = z.object({
  id: z.string().max(40),
  quote: z.string().max(120),
});

export type LabelQuote = z.infer<typeof LabelQuoteSchema>;

export const LabelRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("assets"),
    payload: z.object({
      answers: z
        .array(z.object({ id: z.enum(ASSET_PROMPT_IDS), text: z.string().max(TEXT_LIMITS.assetAnswer) }))
        .min(1)
        .max(5),
    }),
  }),
  z.object({
    kind: z.literal("idea"),
    payload: z.object({
      pain: z.string().max(TEXT_LIMITS.idea).optional(),
      idea: z.string().max(TEXT_LIMITS.idea).optional(),
      madlibs: z.partialRecord(z.enum(MAD_LIB_IDS), z.string().max(TEXT_LIMITS.madlib)).optional(),
    }),
  }),
]);

export type LabelRequest = z.infer<typeof LabelRequestSchema>;

export type LabelResult = { aiOk: boolean; labels: LabelQuote[] };

/** Six boxes filled to their minimum lengths — the only shape the team-fit endpoint accepts. */
export function madlibsAsIdea(input: PreCp1Input) {
  return IdeaInputSchema.safeParse(input.madlibs ?? null);
}
