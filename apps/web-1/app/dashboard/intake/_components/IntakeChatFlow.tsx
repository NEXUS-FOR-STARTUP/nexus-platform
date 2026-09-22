"use client";

import React from "react";
import { useStore } from "@tanstack/react-form";
import { IntakeStep, IntakeData } from "../_types/intake.types";
import { Button, Modal } from "@mantine/core";
import { Bot } from "lucide-react";
import { BOUNDARY_RULE_IDS } from "./Steps/BoundaryStep";
// Import step components
import SituationStep from "./Steps/SituationStep";
import ContactStep from "./Steps/ContactStep";
import ProjectContextStep from "./Steps/ProjectContextStep";
import SupportNeedsStep from "./Steps/SupportNeedsStep";
import DocumentInputStep from "./Steps/DocumentInputStep";
import BoundaryStep from "./Steps/BoundaryStep";
import ReviewSubmitStep from "./Steps/ReviewSubmitStep";

const hasTrimmedText = (value: unknown, minLength = 1) => {
  return typeof value === "string" && value.trim().length >= minLength;
};

type FormValues = Partial<IntakeData> & Record<string, unknown>;

const hasLegacySituationText = (values: FormValues) => {
  if (hasTrimmedText(values.case_summary, 20)) return true;
  if (!Array.isArray(values.current_situations)) return false;
  return values.current_situations.some((item: unknown) => hasTrimmedText(item, 1));
};

export const checkStepValidity = (
  step: IntakeStep,
  values: FormValues,
  options?: boolean | { isAiOnlyPackage?: boolean; stepsList?: IntakeStep[] },
  stepsListParam?: IntakeStep[],
): boolean => {
  const isAiOnly =
    typeof options === "boolean"
      ? options
      : (options?.isAiOnlyPackage ?? (values?.package_id === "pkg_ai_audit"));
  const effectiveStepsList =
    typeof options === "object" && options?.stepsList
      ? options.stepsList
      : stepsListParam;

  switch (step) {
    case IntakeStep.SITUATION:
      return hasTrimmedText(values?.current_blocker, 10) || hasLegacySituationText(values);
    case IntakeStep.CONTACT:
      return (
        !!values?.contact?.full_name &&
        values.contact.full_name.trim().length >= 2 &&
        !!values?.contact?.student_code &&
        values.contact.student_code.trim().length >= 5 &&
        !!values?.contact?.team_role &&
        !!values?.contact?.zalo &&
        /^\d{10}$/.test(values.contact.zalo.trim()) &&
        !!values?.contact?.email &&
        values.contact.email.includes("@")
      );
    case IntakeStep.PROJECT_CONTEXT: {
      const isSchoolValid = !!values?.school && values.school.trim().length > 0;
      const isCourseValid = !!values?.course_context && values.course_context.trim().length > 0;
      const isProjectNameValid =
        !!values?.team_context?.project_name && values.team_context.project_name.trim().length > 0;

      let isGroupNoValid = true;
      if (values?.school === "Đại học FPT" && values?.course_context === "EXE101") {
        isGroupNoValid = !!values?.team_context?.group_no && /^\d+$/.test(values.team_context.group_no.trim());
      } else {
        isGroupNoValid = !!values?.team_context?.group_no && values.team_context.group_no.trim().length > 0;
      }

      return isSchoolValid && isCourseValid && isProjectNameValid && isGroupNoValid;
    }
    case IntakeStep.SUPPORT_NEEDS:
      if (isAiOnly || (effectiveStepsList && !effectiveStepsList.includes(IntakeStep.SUPPORT_NEEDS))) {
        return true;
      }
      return (
        !!values?.support_needs?.primary_need &&
        (!values?.expected_outputs || values.expected_outputs.trim().length >= 5)
      );
    case IntakeStep.DOCUMENTS: {
      const docs = values?.documents;
      return (
        Array.isArray(docs) &&
        docs.length > 0 &&
        docs.every(
          (d) =>
            typeof d?.file_url === "string" &&
            d.file_url.trim().length > 0 &&
            typeof d?.document_type === "string" &&
            d.document_type.trim().length > 0,
        )
      );
    }
    case IntakeStep.BOUNDARY: {
      const confirmations = values?.boundary_confirmations;
      return (
        Array.isArray(confirmations) &&
        BOUNDARY_RULE_IDS.every((id: string) => confirmations.includes(id))
      );
    }
    case IntakeStep.REVIEW:
      return true;
    default:
      return false;
  }
};

const DEFAULT_STEPS_LIST: IntakeStep[] = [
  IntakeStep.SITUATION,
  IntakeStep.CONTACT,
  IntakeStep.PROJECT_CONTEXT,
  IntakeStep.SUPPORT_NEEDS,
  IntakeStep.DOCUMENTS,
  IntakeStep.BOUNDARY,
  IntakeStep.REVIEW,
];

interface IntakeChatFlowProps {
  form: any;
  saveDraft: (values: IntakeData) => void;
  isSubmitting: boolean;
  error: string | null;
  currentStep: IntakeStep;
  setCurrentStep: (step: IntakeStep) => void;
  stepsList?: IntakeStep[];
  isAiOnlyPackage?: boolean;
}

export default function IntakeChatFlow({
  form,
  saveDraft,
  isSubmitting,
  error,
  currentStep,
  setCurrentStep,
  stepsList,
  isAiOnlyPackage,
}: IntakeChatFlowProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
  const values = useStore(form.store, (state: any) => state.values);

  const activeSteps =
    stepsList ??
    (isAiOnlyPackage
      ? DEFAULT_STEPS_LIST.filter((s) => s !== IntakeStep.SUPPORT_NEEDS)
      : DEFAULT_STEPS_LIST);

  // Safety guard: if currentStep is not in activeSteps, move to nearest step
  React.useEffect(() => {
    if (!activeSteps.includes(currentStep)) {
      const nextStep = activeSteps.find((s) => s > currentStep) ?? activeSteps[0];
      if (nextStep !== undefined) {
        setCurrentStep(nextStep);
      }
    }
  }, [activeSteps, currentStep, setCurrentStep]);

  const isStepValid = () =>
    checkStepValidity(currentStep, values, {
      isAiOnlyPackage,
      stepsList: activeSteps,
    });

  const currentIdx = activeSteps.indexOf(currentStep);

  const handleNext = () => {
    if (isStepValid()) {
      saveDraft(values);
      if (currentIdx >= 0 && currentIdx < activeSteps.length - 1) {
        setCurrentStep(activeSteps[currentIdx + 1]);
      }
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentStep(activeSteps[currentIdx - 1]);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex gap-4 p-4 rounded-xl bg-brand-soft/20 border border-brand/10">
        <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-heading font-semibold text-brand text-sm">Trợ lý Đăng ký Đánh giá</h4>
          <p className="font-body text-xs text-text-muted leading-relaxed">
            Xin chào! Mình sẽ hướng dẫn bạn cung cấp thông tin dự án. Hãy điền thông tin qua từng bước để{" "}
            {isAiOnlyPackage
              ? "hệ thống Nexus AI có đủ bối cảnh để đánh giá dự án của nhóm bạn."
              : "hệ thống có đủ bối cảnh cần thiết để tiến hành đánh giá."}
          </p>
        </div>
      </div>

      <div className="bg-surface-app border border-border-app rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
        {currentStep === IntakeStep.SITUATION && <SituationStep form={form} values={values} />}

        {currentStep === IntakeStep.CONTACT && <ContactStep form={form} values={values} />}

        {currentStep === IntakeStep.PROJECT_CONTEXT && <ProjectContextStep form={form} values={values} />}

        {currentStep === IntakeStep.SUPPORT_NEEDS && activeSteps.includes(IntakeStep.SUPPORT_NEEDS) && (
          <SupportNeedsStep form={form} values={values} />
        )}

        {currentStep === IntakeStep.DOCUMENTS && <DocumentInputStep form={form} values={values} />}

        {currentStep === IntakeStep.BOUNDARY && <BoundaryStep form={form} values={values} />}

        {currentStep === IntakeStep.REVIEW && (
          <ReviewSubmitStep
            values={values}
            packages={undefined}
            error={error}
            isAiOnlyPackage={isAiOnlyPackage}
          />
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-6 border-t border-border-app">
          <Button
            onClick={handleBack}
            disabled={currentIdx <= 0 || isSubmitting}
            variant="default"
            className="w-full sm:w-auto text-text-muted hover:text-text-app font-body font-semibold cursor-pointer h-10 sm:h-9 px-4 text-xs"
          >
            <span>Quay lại</span>
          </Button>

          {currentStep === IntakeStep.REVIEW ? (
            <Button
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={isSubmitting}
              color="brand"
              className="w-full sm:w-auto font-body font-semibold cursor-pointer h-10 sm:h-9 px-4 text-xs"
            >
              <span>Tạo dự án &amp; Tiếp tục thanh toán</span>
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              color="brand"
              className="w-full sm:w-auto font-body font-semibold cursor-pointer disabled:opacity-50 h-10 sm:h-9 px-4 text-xs"
            >
              <span>Tiếp tục</span>
            </Button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        opened={isConfirmModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsConfirmModalOpen(false);
        }}
        title={
          <span className="font-heading font-semibold text-lg leading-snug text-text-app">
            Xác nhận đăng ký đánh giá
          </span>
        }
        centered
        radius="md"
      >
        <div className="space-y-4 font-body">
          <p className="text-sm text-text-muted leading-relaxed">
            Bạn có chắc chắn muốn gửi thông tin dự án này? Sau khi gửi, bạn sẽ tiến hành chọn gói và bắt đầu quy trình đánh giá.
          </p>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-border-app">
            <Button
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isSubmitting}
              variant="default"
              className="font-body font-semibold cursor-pointer h-10 sm:h-9 px-4 text-xs w-full sm:w-auto"
            >
              Kiểm tra lại
            </Button>
            <Button
              onClick={() => {
                setIsConfirmModalOpen(false);
                form.handleSubmit();
              }}
              loading={isSubmitting}
              color="brand"
              className="font-body font-semibold cursor-pointer h-10 sm:h-9 px-4 text-xs w-full sm:w-auto"
            >
              Xác nhận gửi thông tin
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
