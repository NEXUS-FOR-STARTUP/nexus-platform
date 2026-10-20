"use client";

import { Suspense, useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Center, Loader } from "@mantine/core";
import { useSession } from "@/lib/auth-client";
import StepIndicator from "./_components/StepIndicator";
import IdeaMadLibsStep from "./_components/IdeaMadLibsStep";
import TeamInputStep from "./_components/TeamInputStep";
import TeamFitResultStep from "./_components/TeamFitResultStep";
import TeamFitUpsellCard from "./_components/TeamFitUpsellCard";
import ErrorBanner from "./_components/ErrorBanner";
import NavigationButtons from "./_components/NavigationButtons";
import { useTeamFitMutation, useTeamFitSaveMutation } from "./hooks/useTeamFitMutation";
import { TeamFitInputSchema } from "@repo/validation";
import { LS_KEY_BLANKS, LS_KEY_MEMBERS, loadSaved, saveToLS, removeFromLS } from "./lib/storage";
import { INITIAL_BLANKS, validateBlank, validateAllBlanks, formatIssue } from "./lib/validation";
import type { TeamMemberInput } from "./hooks/useTeamFitMutation";
import DemoDataFAB from "@/components/ui/DemoDataFAB";
import { NEXUS_PRESET, DEMO_PRESETS } from "./_data/demo-preset";

type Step = 0 | 1 | 2;

const STEP_PARAM = "step";
const LAST_STEP_NUMBER = 3;

function parseStepParam(raw: string | null): Step {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= LAST_STEP_NUMBER ? ((n - 1) as Step) : 0;
}

export default function TeamFitPage() {
  return (
    <Suspense fallback={null}>
      <TeamFitContent />
    </Suspense>
  );
}

function TeamFitContent() {
  // ── Auth guard ──
  const { data: session, isPending } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth");
    }
  }, [isPending, session, router]);

  // ── Page state ──
  const searchParams = useSearchParams();
  const rawStep = searchParams.get(STEP_PARAM);
  const requestedStep = parseStepParam(rawStep);
  const [blanks, setBlanks] = useState<Record<string, string>>(() =>
    loadSaved(LS_KEY_BLANKS, INITIAL_BLANKS),
  );
  const [members, setMembers] = useState<TeamMemberInput[]>(() =>
    loadSaved(LS_KEY_MEMBERS, []),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const mutation = useTeamFitMutation();
  const saveMutation = useTeamFitSaveMutation();
  const [hasSaved, setHasSaved] = useState(false);
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-save blanks & members to localStorage on change
  useEffect(() => { saveToLS(LS_KEY_BLANKS, blanks); }, [blanks]);
  useEffect(() => { saveToLS(LS_KEY_MEMBERS, members); }, [members]);

  // Step trên URL chỉ hợp lệ khi các bước trước đã đủ dữ liệu; reload/dán link thẳng vào bước 3
  // (kết quả AI không được lưu) sẽ lùi về bước gần nhất còn hợp lệ.
  const ideaReady = Object.keys(validateAllBlanks(blanks)).length === 0;
  const hasResultState = mutation.isPending || mutation.isError || mutation.data !== undefined;
  let currentStep: Step = requestedStep;
  if (currentStep === 2 && !hasResultState) currentStep = 1;
  if (currentStep === 1 && !ideaReady) currentStep = 0;

  const goToStep = useCallback(
    (step: Step, mode: "push" | "replace" = "push") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(STEP_PARAM, String(step + 1));
      router[mode](`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (rawStep !== String(currentStep + 1)) goToStep(currentStep, "replace");
  }, [rawStep, currentStep, goToStep]);

  // ── Auth guard early returns ──
  if (isPending) {
    return (
      <Center className="min-h-[60vh]">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!session) {
    return null;
  }

  // ── Handlers ──

  const handleBlurBlank = (key: string) => {
    const error = validateBlank(key, blanks[key] ?? "");
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });
  };

  const handleChangeBlank = (key: string, val: string) => {
    setBlanks((prev) => ({ ...prev, [key]: val }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const allFilledNoErrors =
    Object.values(blanks).every((v) => v.trim().length > 0) &&
    Object.keys(fieldErrors).length === 0;

  const handleNextFromStep0 = () => {
    const errors = validateAllBlanks(blanks);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    goToStep(1);
  };

  const handleEvaluate = () => {
    const payload = {
      idea: {
        projectName: blanks.projectName,
        field: blanks.field,
        targetCustomer: blanks.targetCustomer,
        problem: blanks.problem,
        solution: blanks.solution,
        mvp: blanks.mvp,
      },
      team: members,
    };

    const parsed = TeamFitInputSchema.safeParse(payload);
    if (!parsed.success) {
      setValidationErrors(
        parsed.error.issues.map((issue) => formatIssue(issue.path, issue.message)),
      );
      goToStep(0);
      return;
    }

    setValidationErrors([]);
    mutation.mutate(payload);
    goToStep(2);
  };

  const handleReset = () => {
    goToStep(0);
    setBlanks(INITIAL_BLANKS);
    setMembers([]);
    setFieldErrors({});
    setValidationErrors([]);
    setHasSaved(false);
    setSavedCaseId(null);
    setSaveError(null);
    mutation.reset();
    removeFromLS(LS_KEY_BLANKS, LS_KEY_MEMBERS);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      const payload = {
        idea: {
          projectName: blanks.projectName,
          field: blanks.field,
          targetCustomer: blanks.targetCustomer,
          problem: blanks.problem,
          solution: blanks.solution,
          mvp: blanks.mvp,
        },
        team: members,
        result: mutation.data!,
        packageId: "pkg_tf_free",
      };
      const data = await saveMutation.mutateAsync(payload);
      setHasSaved(true);
      setSavedCaseId(data.caseId);
      router.push(`/dashboard/case/${data.caseId}`);
    } catch {
      setSaveError(FRIENDLY_ERROR_MESSAGE);
    }
  };

  const handleXemCase = () => {
    if (savedCaseId) {
      router.push(`/dashboard/case/${savedCaseId}`);
    }
  };

  const handleUpgrade = async () => {
    // Nếu đã lưu rồi thì vào thẳng case
    if (savedCaseId) {
      router.push(`/dashboard/case/${savedCaseId}`);
      return;
    }

    // Chưa lưu: save team-fit trước, sau đó vào case để chọn lượt audit + thanh toán
    setSaveError(null);
    try {
      const payload = {
        idea: {
          projectName: blanks.projectName,
          field: blanks.field,
          targetCustomer: blanks.targetCustomer,
          problem: blanks.problem,
          solution: blanks.solution,
          mvp: blanks.mvp,
        },
        team: members,
        result: mutation.data!,
        packageId: "pkg_tf_free",
      };
      const data = await saveMutation.mutateAsync(payload);
      setHasSaved(true);
      setSavedCaseId(data.caseId);
      router.push(`/dashboard/case/${data.caseId}`);
    } catch {
      setSaveError(FRIENDLY_ERROR_MESSAGE);
    }
  };

  const FRIENDLY_ERROR_MESSAGE =
    "Hệ thống đang bận hoặc gián đoạn kết nối. Nhóm bạn vui lòng thử lại sau ít phút.";

  const displayErrors = saveError
    ? [FRIENDLY_ERROR_MESSAGE]
    : validationErrors.length > 0
      ? validationErrors
      : mutation.error
        ? [FRIENDLY_ERROR_MESSAGE]
        : [];
  // ── Render ──

  return (
    <div
      className={`mx-auto w-full space-y-6 sm:space-y-8 px-4 pt-6 pb-28 sm:py-8 sm:px-6 ${
        currentStep === 2 ? "max-w-4xl" : "max-w-3xl"
      }`}
    >
      {/* Page header */}
      <div className="text-center space-y-2">
        <h1 className="font-heading text-2xl font-bold text-text-app">
          Kiểm tra nhanh ý tưởng & đội ngũ
        </h1>
        <p className="font-body text-sm text-text-muted">
          Mô tả ý tưởng và đội ngũ để Nexus chỉ ra điểm còn thiếu.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} onStepClick={(step) => goToStep(step)} />

      {/* Step content */}
      <div className="bg-surface-app border border-border-app rounded-2xl p-4 sm:p-6">
        <ErrorBanner errors={displayErrors} />

        {currentStep === 0 && (
          <IdeaMadLibsStep
            blanks={blanks}
            onChange={handleChangeBlank}
            errors={fieldErrors}
            onBlur={handleBlurBlank}
          />
        )}

        {currentStep === 1 && (
          <TeamInputStep members={members} onChange={setMembers} />
        )}

        {currentStep === 2 && (
          <TeamFitResultStep
            result={mutation.data ?? null}
            isLoading={mutation.isPending}
            error={mutation.error ? FRIENDLY_ERROR_MESSAGE : null}
            onReset={handleReset}
            onSave={handleSave}
            onXemCase={handleXemCase}
            isSaving={saveMutation.isPending}
            hasSaved={hasSaved}
          />
        )}
      </div>

      {currentStep === 2 && mutation.data && (
        <TeamFitUpsellCard onUpgrade={handleUpgrade} isUpgrading={saveMutation.isPending} />
      )}

      {/* Navigation buttons (step 0 & 1 only) */}
      <NavigationButtons
        currentStep={currentStep}
        canProceedToStep1={allFilledNoErrors}
        membersCount={members.length}
        onBack={() => goToStep((currentStep - 1) as Step)}
        onNextFromStep0={handleNextFromStep0}
        onEvaluate={handleEvaluate}
        onReset={handleReset}
      />

      {/* Demo data FAB */}
      <DemoDataFAB
        presets={DEMO_PRESETS}
        onSelect={(data) => {
          const preset = data as typeof NEXUS_PRESET;
          setBlanks(preset.blanks);
          setMembers(preset.members);
          setFieldErrors({});
        }}
        onClear={handleReset}
      />
    </div>
  );
}
