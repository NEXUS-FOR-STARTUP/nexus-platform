"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Center, Loader } from "@mantine/core";
import { useSession } from "@/lib/auth-client";
import { apiClient } from "@/lib/api-client";
import StepIndicator from "./_components/StepIndicator";
import IdeaMadLibsStep from "./_components/IdeaMadLibsStep";
import TeamInputStep from "./_components/TeamInputStep";
import TeamFitResultStep from "./_components/TeamFitResultStep";
import ErrorBanner from "./_components/ErrorBanner";
import NavigationButtons from "./_components/NavigationButtons";
import { useTeamFitMutation, useTeamFitSaveMutation } from "./hooks/useTeamFitMutation";
import { TeamFitInputSchema } from "@repo/validation";
import { LS_KEY_BLANKS, LS_KEY_MEMBERS, loadSaved, saveToLS, removeFromLS } from "./lib/storage";
import { INITIAL_BLANKS, validateBlank, validateAllBlanks, formatIssue } from "./lib/validation";
import type { TeamMemberInput } from "./hooks/useTeamFitMutation";

export default function TeamFitPage() {
  // ── Auth guard ──
  const { data: session, isPending } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth");
    }
  }, [isPending, session, router]);

  // ── Page state ──
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
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
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Auto-save blanks & members to localStorage on change
  useEffect(() => { saveToLS(LS_KEY_BLANKS, blanks); }, [blanks]);
  useEffect(() => { saveToLS(LS_KEY_MEMBERS, members); }, [members]);


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
    setCurrentStep(1);
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
      setCurrentStep(0);
      return;
    }

    setValidationErrors([]);
    setCurrentStep(2);
    mutation.mutate(payload);
  };

  const handleReset = () => {
    setCurrentStep(0);
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
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Lưu kết quả thất bại");
    }
  };

  const handleXemCase = () => {
    if (savedCaseId) {
      router.push(`/dashboard/case/${savedCaseId}`);
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    setSaveError(null);
    try {
      let targetCaseId = savedCaseId;

      // Save first if not yet saved
      if (!targetCaseId) {
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
        targetCaseId = data.caseId;
        setHasSaved(true);
        setSavedCaseId(targetCaseId);
      }

      await apiClient.post(`/cases/${targetCaseId}/upgrade-package`, {
        packageId: "pkg_tf_audit",
      });

      router.push(`/dashboard/case/${targetCaseId}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Nâng cấp thất bại");
    } finally {
      setIsUpgrading(false);
    }
  };

  const displayErrors = saveError
    ? [saveError]
    : validationErrors.length > 0
      ? validationErrors
      : mutation.error
        ? [mutation.error.message]
        : [];

  // ── Render ──

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="text-center space-y-2">
        <h1 className="font-heading text-2xl font-bold text-text-app">
          Đánh giá Team-Idea Fit
        </h1>
        <p className="font-body text-sm text-text-muted">
          Điền thông tin dự án và đội ngũ để AI phân tích sự phù hợp
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />

      {/* Step content */}
      <div className="bg-surface-app border border-border-app rounded-2xl p-6">
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
            error={mutation.error?.message ?? null}
            onReset={handleReset}
            onSave={handleSave}
            onXemCase={handleXemCase}
            onUpgrade={handleUpgrade}
            isSaving={saveMutation.isPending}
            isUpgrading={isUpgrading}
            hasSaved={hasSaved}
          />
        )}
      </div>

      {/* Navigation buttons (step 0 & 1 only) */}
      <NavigationButtons
        currentStep={currentStep}
        canProceedToStep1={allFilledNoErrors}
        membersCount={members.length}
        onBack={() => setCurrentStep((currentStep - 1) as 0 | 1 | 2)}
        onNextFromStep0={handleNextFromStep0}
        onEvaluate={handleEvaluate}
      />
    </div>
  );
}
