"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ASSET_PROMPTS,
  buildPreCp1Report,
  deriveTeamFitInput,
  type LabelQuote, type PreCp1Input,
} from "@repo/validation";
import {
  PROGRESS_STEPS,
  STEPS,
  nextStep,
  prevStep,
  stepForField,
  toInput,
  toInputResult,
  usePreCp1Form,
  validateStep,
  type StartForm,
  type StepId,
} from "./usePreCp1Form";
import { STEP_NAMES } from "../_data/copy";
import { usePreCp1Label } from "./usePreCp1Label";
import { usePreCp1Save } from "./usePreCp1Save";
import { useTeamFitEvaluation } from "./useTeamFitEvaluation";

export type LabelRun = { aiOk: boolean; labels: LabelQuote[]; signature: string };

function labelSignature(kind: "assets" | "idea", form: StartForm): string {
  return kind === "assets"
    ? JSON.stringify(ASSET_PROMPTS.map((p) => (form.assets[p.id] ?? "").trim()))
    : JSON.stringify([form.pain, form.idea, form.madlibs]);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useStartFlow() {
  const router = useRouter();
  const { form, setForm, isClient, restored, saveDraft, reset } = usePreCp1Form();
  const [stepState, setStepState] = useState<StepId | null>(null);
  const [furthestState, setFurthestState] = useState<number | null>(null);
  const [caseIdState, setCaseIdState] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [labels, setLabels] = useState<{ assets: LabelRun | null; idea: LabelRun | null }>({ assets: null, idea: null });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [saveFailed, setSaveFailed] = useState(false);
  const savedFor = useRef<string | null>(null);

  const labelMutation = usePreCp1Label();
  const saveMutation = usePreCp1Save();
  const evaluation = useTeamFitEvaluation();

  const patch = useCallback(
    (next: Partial<StartForm>) => {
      // The warning described the answer that this edit just changed; keeping it would scold a filled field.
      setError("");
      setForm((prev) => ({ ...prev, ...next }));
    },
    [setForm],
  );

  const input = useMemo(() => toInput(form), [form]);
  const report = useMemo(() => (input ? buildPreCp1Report(input) : null), [input]);

  // Deep link and saved draft are read once per client mount; nothing else is trusted.
  const initial = useMemo(() => {
    if (!isClient) return null;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("step");
    const caseParam = params.get("case");
    const step = STEPS.includes(fromUrl as StepId) ? (fromUrl as StepId) : (restored?.step ?? "intro");
    const caseId = caseParam && UUID_RE.test(caseParam) ? caseParam : (restored?.caseId ?? null);
    return { step, caseId };
  }, [isClient, restored]);

  const step = stepState ?? initial?.step ?? "intro";
  // "" means the user restarted: it must beat the case id restored from the draft.
  const caseId = caseIdState === "" ? null : (caseIdState ?? initial?.caseId ?? null);

  useEffect(() => {
    if (isClient) saveDraft(step, caseId ?? undefined);
  }, [isClient, form, step, caseId, saveDraft]);

  const persist = useCallback(
    async (targetCase: string, nextInput: PreCp1Input) => {
      setSaveState("saving");
      setSaveFailed(false);
      try {
        await saveMutation.mutateAsync({
          caseId: targetCase,
          input: nextInput,
          aiLabels: [...(labels.assets?.labels ?? []), ...(labels.idea?.labels ?? [])],
          aiResult: evaluation.data ?? undefined,
        });
        setSaveState("saved");
        return true;
      } catch {
        setSaveState("failed");
        setSaveFailed(true);
        return false;
      }
    },
    [saveMutation, labels, evaluation.data],
  );

  // One save per (case, content) pair: the later AI verdict triggers a second, final save.
  const saveKey = caseId && input ? `${caseId}:${evaluation.data ? "ai" : "noai"}` : null;
  useEffect(() => {
    if (step !== "result" || !caseId || !input || !saveKey) return;
    if (savedFor.current === saveKey) return;
    savedFor.current = saveKey;
    void persist(caseId, input);
  }, [step, caseId, input, saveKey, persist]);

  const go = useCallback(
    (target: StepId) => {
      setError("");
      setStepState(target);
      // The furthest step visited, so the sidebar can go back and return without re-walking.
      setFurthestState((prev) => Math.max(prev ?? STEPS.indexOf(step), STEPS.indexOf(target)));
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (target === "intro") url.searchParams.delete("step");
        else url.searchParams.set("step", target);
        window.history.replaceState(null, "", url.toString());
      }
    },
    [step],
  );

  const back = useCallback(() => go(prevStep(step)), [go, step]);

  const runLabels = useCallback(
    async (kind: "assets" | "idea") => {
      // Back → Next must not re-ask the model: same text means the same labels.
      const signature = labelSignature(kind, form);
      if (labels[kind]?.signature === signature) return;
      try {
        const request =
          kind === "assets"
            ? {
                kind: "assets" as const,
                payload: {
                  answers: ASSET_PROMPTS.filter((p) => (form.assets[p.id] ?? "").trim()).map((p) => ({
                    id: p.id,
                    text: (form.assets[p.id] ?? "").slice(0, 600),
                  })),
                },
              }
            : {
                kind: "idea" as const,
                payload: {
                  pain: form.pain.slice(0, 600) || undefined,
                  idea: form.idea.slice(0, 600) || undefined,
                  madlibs: Object.keys(form.madlibs).length ? form.madlibs : undefined,
                },
              };
        if (kind === "assets" && request.kind === "assets" && request.payload.answers.length === 0) {
          setLabels((prev) => ({ ...prev, assets: { aiOk: false, labels: [], signature } }));
          return;
        }
        const result = await labelMutation.mutateAsync(request);
        setLabels((prev) => ({ ...prev, [kind]: { aiOk: result.aiOk, labels: result.labels, signature } }));
      } catch {
        setLabels((prev) => ({ ...prev, [kind]: { aiOk: false, labels: [], signature } }));
      }
    },
    [form, labels, labelMutation],
  );

  const next = useCallback(async () => {
    const pending =
      step === "assetsConfirm"
        ? (labels.assets?.labels.map((l) => l.id) ?? [])
        : step === "formConfirm"
          ? (labels.idea?.labels.map((l) => l.id) ?? [])
          : [];
    const problem = validateStep(step, form, pending);
    if (problem) {
      setError(problem);
      return;
    }

    if (step === "assets") {
      // Nothing written means nothing to label: skip the confirm screen entirely.
      const answered = ASSET_PROMPTS.some((p) => (form.assets[p.id] ?? "").trim());
      if (!answered) {
        go("network");
        return;
      }
      await runLabels("assets");
      go("assetsConfirm");
      return;
    }
    if (step === "idea") {
      go(form.ideaMode === "none" ? "sens" : "form");
      return;
    }
    if (step === "form") {
      await runLabels("idea");
      go("formConfirm");
      const teamFit = input ? deriveTeamFitInput(input) : null;
      if (teamFit && !evaluation.data && !evaluation.isPending) evaluation.mutate(teamFit);
      return;
    }
    if (step === "sens") {
      const built = toInputResult(form);
      if (!built.data) {
        const target = stepForField(built.field ?? "");
        setError(
          target
            ? `Còn thông tin chưa hợp lệ ở bước “${STEP_NAMES[PROGRESS_STEPS.indexOf(target)]}”. Bấm vào bước đó để kiểm tra.`
            : "Còn thông tin chưa hợp lệ. Quay lại các bước trước kiểm tra giúp mình.",
        );
        return;
      }
      go("result");
      return;
    }
    go(nextStep(step));
  }, [step, form, labels, go, runLabels, input, evaluation]);

  const onCaseCreated = useCallback(
    (createdCaseId: string) => {
      setCaseIdState(createdCaseId);
      savedFor.current = `${createdCaseId}:${evaluation.data ? "ai" : "noai"}`;
      if (input) {
        void persist(createdCaseId, input).then((ok) => {
          if (ok) router.push(`/dashboard/case/${createdCaseId}`);
        });
      }
    },
    [input, persist, router, evaluation.data],
  );

  const restart = useCallback(() => {
    reset();
    setLabels({ assets: null, idea: null });
    setCaseIdState("");
    setFurthestState(null);
    setSaveState("idle");
    setSaveFailed(false);
    savedFor.current = null;
    evaluation.reset();
    go("intro");
  }, [reset, evaluation, go]);

  return {
    form,
    patch,
    isClient,
    step,
    error,
    labels,
    caseId,
    input,
    report,

    saving: saveState === "saving",
    saveFailed,
    savedCaseId: saveState === "saved" ? caseId : null,
    aiResult: evaluation.data ?? null,
    aiFailed: evaluation.isError,
    aiLoading: evaluation.isPending,
    labelBusy: labelMutation.isPending,
    hasSaved: Boolean(restored?.caseId) || restored?.step === "result",
    go,
    /** Index into STEPS of the furthest step reached; earlier steps stay reachable. */
    furthest: furthestState ?? STEPS.indexOf(step),
    back,
    next,
    restart,
    onCaseCreated,
  };
}

export type StartFlow = ReturnType<typeof useStartFlow>;
