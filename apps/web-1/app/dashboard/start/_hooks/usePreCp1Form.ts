"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  ASSET_PROMPT_IDS,
  ASKED_MAJORS,
  MAD_LIBS,
  PreCp1InputSchema,
  type BudgetCode,
  type CapCode,
  type CourseCode,
  type GoalCode,
  type MajorLabel,
  type NetId,
  type PreCp1Input,
  type RoleTrackCode,
  type SchoolCode,
  type SensitiveId,
} from "@repo/validation";

export const STEPS = [
  "intro",
  "basics",
  "team",
  "assets",
  "assetsConfirm",
  "network",
  "idea",
  "form",
  "formConfirm",
  "sens",
  "result",
] as const;
export type StepId = (typeof STEPS)[number];

/** Progress bar counts these only: opening screen and result page are outside it. */
export const PROGRESS_STEPS: StepId[] = ["basics", "team", "assets", "network", "idea", "form", "sens"];

export type MemberForm = {
  name: string;
  major: MajorLabel | "";
  majorOther: string;
  roleTrackHint: RoleTrackCode | "";
  caps: Partial<Record<CapCode, 1 | 2 | 3>>;
  unsure: boolean;
  extra: string;
};

export type StartForm = {
  school: SchoolCode | null;
  schoolName: string;
  course: CourseCode | null;
  courseName: string;
  goal: GoalCode | null;
  budget: BudgetCode | null;
  team: MemberForm[];
  assets: Record<string, string>;
  assetsNone: string[];
  assetsOther: string;
  network: NetId[];
  networkOther: string;
  ideaMode: "none" | "draft" | "structured";
  pain: string;
  idea: string;
  madlibs: Record<string, string>;
  sensitive: SensitiveId[];
  assetTags: Record<string, "yes" | "no">;
  ideaTags: Record<string, "yes" | "no">;
};

export const EMPTY_MEMBER: MemberForm = {
  name: "",
  major: "",
  majorOther: "",
  roleTrackHint: "",
  caps: {},
  unsure: false,
  extra: "",
};

export const EMPTY_FORM: StartForm = {
  school: null,
  schoolName: "",
  course: null,
  courseName: "",
  goal: null,
  budget: null,
  team: [{ ...EMPTY_MEMBER }],
  assets: {},
  assetsNone: [],
  assetsOther: "",
  network: [],
  networkOther: "",
  ideaMode: "none",
  pain: "",
  idea: "",
  madlibs: {},
  sensitive: [],
  assetTags: {},
  ideaTags: {},
};

const DRAFT_KEY = "nexus:pre-cp1:draft:v1";

type SavedDraft = { form: StartForm; step: StepId; caseId?: string };

/** Hard ceiling from the school rule, or Infinity for schools without one. */
export function teamCap(form: StartForm): number {
  return form.school === "fpt" ? 6 : Infinity;
}

/** Filling eight people then switching to FPT must cut back, not keep eight. */
export function clampTeam(form: StartForm): StartForm {
  const cap = teamCap(form);
  if (form.team.length <= cap) return form;
  return { ...form, team: form.team.slice(0, cap) };
}

/**
 * The form keeps empty choices as null/""; the input contract is strict, so the
 * conversion is the single place that decides "answered enough to save".
 */
export function toInput(form: StartForm): PreCp1Input | null {
  const parsed = PreCp1InputSchema.safeParse({
    school: form.school,
    schoolName: form.schoolName || undefined,
    course: form.course ?? (form.school === "other" ? "other" : null),
    courseName: form.courseName || undefined,
    goal: form.goal,
    budget: form.budget,
    team: form.team.map((m) => ({
      name: m.name || undefined,
      major: m.major,
      majorOther: m.majorOther || undefined,
      roleTrackHint: m.roleTrackHint || undefined,
      caps: m.caps,
      unsure: m.unsure,
      extra: m.extra || undefined,
    })),
    assets: form.assets,
    assetsNone: form.assetsNone,
    assetsOther: form.assetsOther || undefined,
    network: form.network,
    networkOther: form.networkOther || undefined,
    ideaMode: form.ideaMode,
    pain: form.pain || undefined,
    idea: form.idea || undefined,
    madlibs: Object.keys(form.madlibs).length ? form.madlibs : undefined,
    sensitive: form.sensitive,
    assetTags: form.assetTags,
    ideaTags: form.ideaTags,
  });
  return parsed.success ? parsed.data : null;
}

/** Empty string = this step may move on. Sentences are plain and name the gap. */
export function validateStep(step: StepId, form: StartForm, pendingLabels: string[]): string {
  if (step === "basics") {
    if (!form.school) return "Chọn trường bạn đang học.";
    if (form.school === "fpt" && !form.course) return "Chọn môn: EXE101 hay môn khác.";
    if (!form.goal) return "Chọn mục tiêu gần đúng nhất.";
    if (!form.budget) return "Chọn khoảng tiền cả nhóm có thể bỏ ra.";
    return "";
  }
  if (step === "team") {
    const noMajor = form.team.map((m, i) => (m.major ? null : i + 1)).filter(Boolean);
    if (noMajor.length) return `Người ${noMajor.join(", ")} chưa chọn chuyên ngành.`;
    const noOther = form.team.map((m, i) => (m.major === "Ngành khác" && !m.majorOther.trim() ? i + 1 : null)).filter(Boolean);
    if (noOther.length) return `Người ${noOther.join(", ")} chọn “Ngành khác” nhưng chưa ghi tên ngành.`;
    const noTrack = form.team.map((m, i) => (ASKED_MAJORS.includes(m.major as MajorLabel) && !m.roleTrackHint ? i + 1 : null)).filter(Boolean);
    if (noTrack.length) return `Người ${noTrack.join(", ")} chưa chọn phần việc thiên về đâu.`;
    const empty = form.team.map((m, i) => (Object.keys(m.caps).length || m.unsure ? null : i + 1)).filter(Boolean);
    if (empty.length) return `Người ${empty.join(", ")} chưa chọn việc nào, hoặc tick “Mình chưa rõ”.`;
    return "";
  }
  if (step === "assets") {
    const left = ASSET_PROMPT_IDS.filter((id) => !(form.assets[id] ?? "").trim() && !form.assetsNone.includes(id)).length;
    return left ? `Còn ${left} câu chưa trả lời. Viết vài chữ, hoặc bấm “Mình không có / không nhớ”.` : "";
  }
  if (step === "network") {
    return form.networkOther.trim()
      ? ""
      : "Ghi ít nhất một nhóm hoặc một người bạn nhắn tin được. “Bạn cùng lớp” là đủ.";
  }
  if (step === "idea") return form.ideaMode === "none" ? "Chọn một trong hai: đã có ý tưởng cụ thể, hoặc chưa có." : "";
  if (step === "form") {
    if (form.ideaMode !== "structured") return "";
    const short = MAD_LIBS.filter((f) => (form.madlibs[f.id] ?? "").trim().length < f.min);
    return short.length
      ? `Còn ${short.length} ô chưa đủ ý: ${short.map((f) => f.n.toLowerCase().replace(/\?/g, "")).join("; ")}. Viết thêm vài chữ.`
      : "";
  }
  if (step === "sens") return form.sensitive.length ? "" : "Chọn các mục dính đến ý nghĩ của bạn, hoặc “Không có mục nào ở trên”.";
  if (step === "assetsConfirm" || step === "formConfirm") {
    const undecided = pendingLabels.filter((id) => {
      const tags = step === "assetsConfirm" ? form.assetTags : form.ideaTags;
      return !tags[id];
    });
    return undecided.length ? "Bấm “Đúng” hoặc “Không đúng” cho từng mục." : "";
  }
  return "";
}

export function nextStep(step: StepId): StepId {
  if (step === "assets") return "assetsConfirm";
  if (step === "assetsConfirm") return "network";
  if (step === "idea") return "form";
  if (step === "form") return "formConfirm";
  if (step === "formConfirm") return "sens";
  if (step === "sens") return "result";
  const i = STEPS.indexOf(step);
  return STEPS[Math.min(STEPS.length - 1, i + 1)] ?? "result";
}

export function prevStep(step: StepId): StepId {
  if (step === "assetsConfirm") return "assets";
  if (step === "form") return "idea";
  if (step === "formConfirm") return "form";
  if (step === "network") return "assetsConfirm";
  const i = STEPS.indexOf(step);
  return STEPS[Math.max(0, i - 1)] ?? "intro";
}

/** Storage is the external system here, so hydration is a store read, not an effect. */
const noopSubscribe = () => () => {};

let cachedRaw: string | null = null;
let cachedDraft: SavedDraft | null = null;
let cacheReady = false;

function readDraft(): SavedDraft | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(DRAFT_KEY);
  } catch {
    raw = null;
  }
  if (!cacheReady || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedDraft = parseDraft(raw);
    cacheReady = true;
  }
  return cachedDraft;
}

function parseDraft(raw: string | null): SavedDraft | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!("form" in parsed) || !parsed.form || typeof parsed.form !== "object") return null;
    const form = { ...EMPTY_FORM, ...parsed.form } as StartForm;
    const step = "step" in parsed && STEPS.includes(parsed.step as StepId) ? (parsed.step as StepId) : "intro";
    const caseId = "caseId" in parsed && typeof parsed.caseId === "string" ? parsed.caseId : undefined;
    return { form, step, caseId };
  } catch {
    return null;
  }
}

export function usePreCp1Form() {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const restored = useMemo(() => (isClient ? readDraft() : null), [isClient]);
  const [formState, setFormState] = useState<StartForm | null>(null);
  const form = formState ?? restored?.form ?? EMPTY_FORM;

  const setForm = useCallback(
    (update: (prev: StartForm) => StartForm) => {
      setFormState((prev) => update(prev ?? form));
    },
    [form],
  );

  const saveDraft = useCallback((step: StepId, caseId?: string) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, caseId } satisfies SavedDraft));
    } catch {
      // Storage blocked: the flow still works, only refresh loses answers.
    }
  }, [form]);

  const reset = useCallback(() => {
    setFormState(EMPTY_FORM);
    cachedRaw = null;
    cachedDraft = null;
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }, []);

  return { form, setForm, isClient, restored, saveDraft, reset };
}
