"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useStore } from "@tanstack/react-form";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useIntakeForm } from "./hooks/useIntakeForm";
import IntakeProgressStepper from "./_components/IntakeProgressStepper";
import IntakeChatFlow, { checkStepValidity } from "./_components/IntakeChatFlow";
import { IntakeStep, IntakeData } from "./_types/intake.types";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import { Modal, Button, Alert } from "@mantine/core";
import { Trash2, AlertTriangle, Clock, AlertCircle, Zap } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import DemoDataFAB from "@/components/ui/DemoDataFAB";
import { DEMO_PRESETS } from "./_data/demo-presets";


function IntakePageContent() {
  const searchParams = useSearchParams();
  const packageId = searchParams.get("packageId") || "";
  const caseId = searchParams.get("caseId") || null;
  const isUpdateMode = !!caseId;

  const { data: existingCaseData, isLoading: isLoadingCase, isError: isCaseError } = useQuery({
    queryKey: ["case-intake", caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}`).then((r) => r.data),
    enabled: isUpdateMode,
  });

  // Fetch active packages for packageId validation (CREATE mode only)
  const { data: packagesData, isLoading: isLoadingPackages, isError: isPackagesError } = useQuery({
    queryKey: ["active-packages"],
    queryFn: () => apiClient.get("/packages").then((r) => r.data),
    enabled: !isUpdateMode,
  });

  const effectivePackageId = isUpdateMode
    ? (existingCaseData?.case?.package_id || existingCaseData?.package_id || "")
    : packageId;
  const isAiOnlyPackage = effectivePackageId === "pkg_ai_audit";

  const initialData: IntakeData | null = useMemo(() => {
    if (!existingCaseData) return null;
    const caseRow = existingCaseData.case ?? existingCaseData;
    const owner = caseRow.owner ?? existingCaseData.owner;
    const rawSnapshot = existingCaseData.intake_snapshot || {};
    const pkgId = caseRow.package_id || rawSnapshot.package_id || "";
    const isAi = pkgId === "pkg_ai_audit";
    return {
      ...rawSnapshot,
      package_id: pkgId,
      school: caseRow.school || rawSnapshot.school || rawSnapshot.team_context?.school || "Đại học FPT",
      course_context: caseRow.course_context || rawSnapshot.course_context || rawSnapshot.team_context?.course_context || "EXE101",
      current_blocker: rawSnapshot.current_blocker || "",
      current_situations: rawSnapshot.current_situations || [],
      case_summary: rawSnapshot.case_summary || "",
      contact: {
        full_name: rawSnapshot.contact?.full_name || owner?.name || "",
        student_code: rawSnapshot.contact?.student_code || "",
        team_role: rawSnapshot.contact?.team_role || rawSnapshot.contact?.role || "Trưởng nhóm",
        zalo: rawSnapshot.contact?.zalo || rawSnapshot.contact?.phone || "",
        email: rawSnapshot.contact?.email || owner?.email || "",
        telegram: rawSnapshot.contact?.telegram || "",
      },
      team_context: {
        group_no: caseRow.group_no || rawSnapshot.team_context?.group_no || "",
        project_name: caseRow.team_name || rawSnapshot.team_context?.project_name || "",
        team_status_summary: rawSnapshot.team_context?.team_status_summary || rawSnapshot.current_blocker || "",
      },
      support_needs: isAi
        ? { primary_need: "", extra_notes: "" }
        : {
            primary_need: rawSnapshot.support_needs?.primary_need || "clarify_customer_pain",
            extra_notes: rawSnapshot.support_needs?.extra_notes || "",
          },
      documents: rawSnapshot.documents || [],
      lecturer_feedback: rawSnapshot.lecturer_feedback || "",
      expected_outputs: isAi ? "" : (rawSnapshot.expected_outputs || ""),
      boundary_confirmations: rawSnapshot.boundary_confirmations || ["originality", "advisory_only", "accurate_contact"],
    };
  }, [existingCaseData]);

  const { form, isLoaded, saveDraft, clearDraft, isSubmitting, error } =
    useIntakeForm({
      packageId: effectivePackageId || packageId,
      caseId,
      initialData,
      isAiOnlyPackage,
    });

  const [currentStep, setCurrentStep] = useState<IntakeStep>(
    IntakeStep.SITUATION,
  );
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Hook up store value retrieval for validation
  const values = useStore(form.store, (state: any) => state.values);

  // Dynamic stepsList based on package
  const stepsList = useMemo(() => {
    if (isAiOnlyPackage) {
      return [
        IntakeStep.SITUATION,
        IntakeStep.CONTACT,
        IntakeStep.PROJECT_CONTEXT,
        IntakeStep.DOCUMENTS,
        IntakeStep.BOUNDARY,
        IntakeStep.REVIEW,
      ];
    }
    return [
      IntakeStep.SITUATION,
      IntakeStep.CONTACT,
      IntakeStep.PROJECT_CONTEXT,
      IntakeStep.SUPPORT_NEEDS,
      IntakeStep.DOCUMENTS,
      IntakeStep.BOUNDARY,
      IntakeStep.REVIEW,
    ];
  }, [isAiOnlyPackage]);

  // Guard against invalid currentStep when in AI-only package mode
  useEffect(() => {
    if (isAiOnlyPackage && currentStep === IntakeStep.SUPPORT_NEEDS) {
      setCurrentStep(IntakeStep.DOCUMENTS);
    }
  }, [isAiOnlyPackage, currentStep]);

  // Calculate selectable steps where all preceding steps are valid
  const selectableSteps: IntakeStep[] = useMemo(() => {
    const selectable: IntakeStep[] = [];
    for (let i = 0; i < stepsList.length; i++) {
      const stepVal = stepsList[i];
      if (i === 0) {
        selectable.push(stepVal);
      } else {
        let allPrevValid = true;
        for (let j = 0; j < i; j++) {
          const prevStep = stepsList[j];
          const isPrevValid =
            prevStep === IntakeStep.SUPPORT_NEEDS && !stepsList.includes(IntakeStep.SUPPORT_NEEDS)
              ? true
              : checkStepValidity(prevStep, values);
          if (!isPrevValid) {
            allPrevValid = false;
            break;
          }
        }
        if (allPrevValid) {
          selectable.push(stepVal);
        }
      }
    }
    return selectable;
  }, [stepsList, values]);

  const isLoadingForm =
    !isLoaded ||
    (isUpdateMode && isLoadingCase) ||
    (!isUpdateMode && isLoadingPackages);
  if (isUpdateMode && isCaseError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Alert
          icon={<AlertCircle className="w-5 h-5" />}
          title="Lỗi"
          color="red"
          radius="md"
          variant="light"
          className="max-w-md"
        >
          <p className="text-sm font-body">Không tải được hồ sơ. Vui lòng thử lại.</p>
        </Alert>
      </div>
    );
  }
  if (!isUpdateMode && isPackagesError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Alert
          icon={<AlertCircle className="w-5 h-5" />}
          title="Lỗi kết nối"
          color="red"
          radius="md"
          variant="light"
          className="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm font-body">
              Không thể tải danh sách gói dịch vụ. Vui lòng kiểm tra kết nối mạng và thử lại.
            </p>
            <Button
              component={Link}
              href="/"
              color="red"
              variant="outline"
              fullWidth
              className="font-body font-semibold cursor-pointer"
            >
              Quay lại trang chủ
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (isLoadingForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <LoadingSkeleton variant="text-block" count={2} />
        <p className="mt-4 text-sm text-text-muted font-body animate-pulse">
          {isUpdateMode
            ? "Đang tải dữ liệu hồ sơ..."
            : "Đang tải cấu hình biểu mẫu..."}
        </p>
      </div>
    );
  }

  // Validate packageId for CREATE mode
  if (!isUpdateMode && packagesData) {
    const isValidPackageId =
      !!packageId &&
      packagesData.some((pkg: { id: string }) => pkg.id === packageId);

    if (!isValidPackageId) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Alert
            icon={<AlertCircle className="w-5 h-5" />}
            title="Lỗi"
            color="red"
            radius="md"
            variant="light"
            className="max-w-md"
          >
            <div className="space-y-4">
              <p className="text-sm font-body">
                Gói dịch vụ không hợp lệ. Vui lòng quay lại.
              </p>
              <Button
                component={Link}
                href="/"
                color="red"
                variant="outline"
                fullWidth
                className="font-body font-semibold cursor-pointer"
              >
                Quay lại trang chủ
              </Button>
            </div>
          </Alert>
        </div>
      );
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="text-center space-y-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-app">
          {isUpdateMode ? "Cập nhật hồ sơ" : "Tạo hồ sơ mới"}
        </h1>
        <p className="font-body text-sm text-text-muted max-w-lg mx-auto">
          {isUpdateMode
            ? "Điều chỉnh thông tin hồ sơ hiện tại."
            : "Cấu trúc ý tưởng và thông tin minh chứng để bắt đầu chạy phản biện."}
        </p>

        {/* Dynamic SLA Banner */}
        <div className="max-w-lg mx-auto">
          <Alert
            variant="light"
            color={isAiOnlyPackage ? "teal" : "blue"}
            icon={
              isAiOnlyPackage ? (
                <Zap className="w-4 h-4 text-teal-600" />
              ) : (
                <Clock className="w-4 h-4 text-blue-600" />
              )
            }
            className="text-left text-xs font-body"
          >
            {isAiOnlyPackage
              ? "⚡ Thời gian xử lý: Kết quả thẩm định tự động hoàn tất trong vòng 1 phút sau khi gửi"
              : "⏱ Thời gian phản biện: 24h–48h có Mentor chuyên môn đồng hành và phản hồi"}
          </Alert>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Progress Stepper Sidebar */}
        <div className="lg:col-span-1 lg:sticky lg:top-6 flex flex-col gap-3">
          <IntakeProgressStepper
            stepsList={stepsList}
            currentStep={currentStep}
            selectableSteps={selectableSteps}
            onStepClick={(step) => {
              saveDraft(values);
              setCurrentStep(step);
            }}
          />
          <Button
            onClick={() => setIsResetOpen(true)}
            variant="outline"
            color="red"
            leftSection={<Trash2 className="w-3.5 h-3.5" />}
            className="w-full lg:w-full font-body font-semibold cursor-pointer border border-danger/10 hover:border-danger/30 hover:bg-danger-soft/20 text-danger rounded-xl text-xs py-2 flex items-center justify-center gap-1.5 h-10 max-w-[200px] lg:max-w-none mx-auto lg:mx-0"
          >
            <span>Xóa nháp &amp; Nhập lại</span>
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <IntakeChatFlow
            stepsList={stepsList}
            isAiOnlyPackage={isAiOnlyPackage}
            form={form}
            saveDraft={saveDraft}
            isSubmitting={isSubmitting}
            error={error}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        </div>
      </div>
      {/* Reset Confirmation Modal */}
      <Modal
        opened={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title={
          <div className="flex items-center gap-2 text-text-app">
            <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
            <span className="font-heading font-semibold text-lg leading-snug">
              Xác nhận xóa bản nháp
            </span>
          </div>
        }
        centered
        radius="md"
      >
        <div className="space-y-4 font-body">
          <p className="text-sm text-text-muted leading-relaxed">
            Bạn có chắc chắn muốn xóa toàn bộ thông tin nháp đã lưu? Hành động
            này sẽ đặt lại biểu mẫu về ban đầu và không thể hoàn tác.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-app">
            <Button
              onClick={() => setIsResetOpen(false)}
              variant="default"
              className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-xs bg-surface-app"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                clearDraft();
                setCurrentStep(IntakeStep.SITUATION);
                setIsResetOpen(false);
              }}
              color="red"
              className="font-body font-semibold cursor-pointer hover:bg-danger-hover shadow-sm h-10 px-4 rounded-xl text-xs"
            >
              Xóa nháp
            </Button>
          </div>
        </div>
      </Modal>

      {/* Demo data FAB */}
      <DemoDataFAB
        presets={DEMO_PRESETS}
        onSelect={(data) => {
          const preset = data as IntakeData;
          // Scalar fields
          form.setFieldValue("current_blocker", preset.current_blocker);
          form.setFieldValue("current_situations", preset.current_situations);
          form.setFieldValue("case_summary", preset.case_summary);
          // Contact
          form.setFieldValue("contact.full_name", preset.contact.full_name);
          form.setFieldValue("contact.student_code", preset.contact.student_code);
          form.setFieldValue("contact.team_role", preset.contact.team_role);
          form.setFieldValue("contact.zalo", preset.contact.zalo);
          form.setFieldValue("contact.email", preset.contact.email);
          // Team context
          form.setFieldValue("team_context.group_no", preset.team_context.group_no);
          form.setFieldValue("team_context.project_name", preset.team_context.project_name);
          form.setFieldValue("team_context.team_status_summary", preset.team_context.team_status_summary);
          // Support needs & outputs
          if (isAiOnlyPackage) {
            form.setFieldValue("support_needs.primary_need", "");
            form.setFieldValue("support_needs.extra_notes", "");
            form.setFieldValue("expected_outputs", "");
          } else {
            form.setFieldValue("support_needs.primary_need", preset.support_needs?.primary_need || "clarify_customer_pain");
            form.setFieldValue("support_needs.extra_notes", preset.support_needs?.extra_notes || "");
            form.setFieldValue("expected_outputs", preset.expected_outputs || "");
          }
          form.setFieldValue("boundary_confirmations", preset.boundary_confirmations);
          form.setFieldValue("school", preset.school);
          form.setFieldValue("course_context", preset.course_context);
        }}
        onClear={() => {
          clearDraft();
          setCurrentStep(IntakeStep.SITUATION);
        }}
      />
    </div>
  );
}

export default function IntakePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <LoadingSkeleton variant="text-block" count={2} />
          <p className="mt-4 text-sm text-text-muted font-body animate-pulse">
            Đang tải...
          </p>
        </div>
      }
    >
      <IntakePageContent />
    </Suspense>
  );
}
