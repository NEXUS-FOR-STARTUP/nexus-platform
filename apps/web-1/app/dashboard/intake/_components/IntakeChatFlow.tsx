"use client";

import React from "react";
import { useStore } from "@tanstack/react-form";
import { IntakeStep, IntakeData } from "../_types/intake.types";
import { Button } from "@mantine/core";
import { ArrowLeft, ArrowRight, Bot, Send } from "lucide-react";

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

const hasLegacySituationText = (values: any) => {
  if (hasTrimmedText(values.case_summary, 20)) return true;
  if (!Array.isArray(values.current_situations)) return false;
  return values.current_situations.some((item: unknown) => hasTrimmedText(item, 1));
};

export const checkStepValidity = (step: IntakeStep, values: any): boolean => {
  switch (step) {
    case IntakeStep.SITUATION:
      return hasTrimmedText(values.current_blocker, 10) || hasLegacySituationText(values);
    case IntakeStep.CONTACT:
      return (
        !!values.contact?.full_name &&
        values.contact.full_name.trim().length >= 2 &&
        !!values.contact?.student_code &&
        values.contact.student_code.trim().length >= 5 &&
        !!values.contact?.team_role &&
        !!values.contact?.zalo &&
        /^\d{10}$/.test(values.contact.zalo.trim()) &&
        !!values.contact?.email &&
        values.contact.email.includes("@")
      );
    case IntakeStep.PROJECT_CONTEXT: {
      const isSchoolValid = !!values.school && values.school.trim().length > 0;
      const isCourseValid = !!values.course_context && values.course_context.trim().length > 0;
      const isProjectNameValid = !!values.team_context?.project_name && values.team_context.project_name.trim().length > 0;

      let isGroupNoValid = true;
      if (values.school === "Đại học FPT" && values.course_context === "EXE101") {
        isGroupNoValid = !!values.team_context?.group_no && /^\d+$/.test(values.team_context.group_no.trim());
      } else {
        isGroupNoValid = !!values.team_context?.group_no && values.team_context.group_no.trim().length > 0;
      }

      return isSchoolValid && isCourseValid && isProjectNameValid && isGroupNoValid;
    }
    case IntakeStep.SUPPORT_NEEDS:
      return !!values.support_needs?.primary_need && (!values.expected_outputs || values.expected_outputs.trim().length >= 5);
    case IntakeStep.DOCUMENTS:
      return (
        Array.isArray(values.documents) &&
        values.documents.length > 0 &&
        values.documents.every(
          (d: any) =>
            !!d.file_url &&
            d.file_url.trim().length > 0 &&
            !!d.document_type &&
            d.document_type.trim().length > 0,
        )
      );
    case IntakeStep.BOUNDARY:
      return Array.isArray(values.boundary_confirmations) && values.boundary_confirmations.length >= 3;
    case IntakeStep.REVIEW:
      return true;
    default:
      return false;
  }
};

interface IntakeChatFlowProps {
  form: any;
  saveDraft: (values: IntakeData) => void;
  isSubmitting: boolean;
  error: string | null;
  currentStep: IntakeStep;
  setCurrentStep: (step: IntakeStep) => void;
}

export default function IntakeChatFlow({
  form,
  saveDraft,
  isSubmitting,
  error,
  currentStep,
  setCurrentStep,
}: IntakeChatFlowProps) {
  const values = useStore(form.store, (state: any) => state.values);

  const isStepValid = () => checkStepValidity(currentStep, values);

  const handleNext = () => {
    if (isStepValid()) {
      saveDraft(values);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex gap-4 p-4 rounded-xl bg-brand-soft/20 border border-brand/10">
        <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-heading font-semibold text-brand text-sm">Trợ lý tạo Hồ sơ Phản biện</h4>
          <p className="font-body text-xs text-text-muted leading-relaxed">
            Xin chào! Mình sẽ hướng dẫn bạn hoàn thiện hồ sơ phản biện. Hãy điền thông tin qua từng bước để Supporter có đủ bối cảnh cần thiết.
          </p>
        </div>
      </div>

      <div className="bg-surface-app border border-border-app rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        {currentStep === IntakeStep.SITUATION && <SituationStep form={form} values={values} />}

        {currentStep === IntakeStep.CONTACT && <ContactStep form={form} values={values} />}

        {currentStep === IntakeStep.PROJECT_CONTEXT && <ProjectContextStep form={form} values={values} />}

        {currentStep === IntakeStep.SUPPORT_NEEDS && <SupportNeedsStep form={form} values={values} />}

        {currentStep === IntakeStep.DOCUMENTS && <DocumentInputStep form={form} values={values} />}

        {currentStep === IntakeStep.BOUNDARY && <BoundaryStep form={form} values={values} />}

        {currentStep === IntakeStep.REVIEW && <ReviewSubmitStep values={values} packages={undefined} error={error} />}

        <div className="flex justify-between items-center pt-6 border-t border-border-app">
          <Button
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            variant="default"
            leftSection={<ArrowLeft className="w-4 h-4" />}
            className="text-text-muted hover:text-text-app font-body font-semibold cursor-pointer h-9 px-4 text-xs"
          >
            <span>Quay lại</span>
          </Button>

          {currentStep === IntakeStep.REVIEW ? (
            <Button
              onClick={() => form.handleSubmit()}
              disabled={isSubmitting}
              color="brand"
              rightSection={<Send className="w-4 h-4" />}
              className="font-body font-semibold cursor-pointer h-9 px-4 text-xs"
            >
              <span>{isSubmitting ? "Đang gửi hồ sơ..." : "Xác nhận & Nộp hồ sơ"}</span>
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              color="brand"
              rightSection={<ArrowRight className="w-4 h-4" />}
              className="font-body font-semibold cursor-pointer disabled:opacity-50 h-9 px-4 text-xs"
            >
              <span>Tiếp tục</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
