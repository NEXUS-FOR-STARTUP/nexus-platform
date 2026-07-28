"use client";

import React, { useState, Suspense } from "react";
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
import { Trash2, AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";

function IntakePageContent() {
  const searchParams = useSearchParams();
  const packageId = searchParams.get("packageId") || "";
  const caseId = searchParams.get("caseId") || null;
  const isUpdateMode = !!caseId;

  // Fetch existing case data for UPDATE mode
  const { data: existingCaseData, isLoading: isLoadingCase } = useQuery({
    queryKey: ["case-intake", caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}`).then((r) => r.data),
    enabled: isUpdateMode,
  });

  // Fetch active packages for packageId validation (CREATE mode only)
  const { data: packagesData, isLoading: isLoadingPackages } = useQuery({
    queryKey: ["active-packages"],
    queryFn: () => apiClient.get("/packages").then((r) => r.data),
    enabled: !isUpdateMode,
  });

  const initialData: IntakeData | null =
    existingCaseData?.intake_snapshot ?? null;

  const { form, isLoaded, saveDraft, clearDraft, isSubmitting, error } =
    useIntakeForm({ packageId, caseId, initialData });

  const [currentStep, setCurrentStep] = useState<IntakeStep>(
    IntakeStep.SITUATION,
  );
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Hook up store value retrieval for validation
  const values = useStore(form.store, (state: any) => state.values);

  // Steps definition — PACKAGE & DEADLINE removed
  const stepsList = [
    IntakeStep.SITUATION,
    IntakeStep.CONTACT,
    IntakeStep.PROJECT_CONTEXT,
    IntakeStep.SUPPORT_NEEDS,
    IntakeStep.DOCUMENTS,
    IntakeStep.BOUNDARY,
    IntakeStep.REVIEW,
  ];

  // Calculate selectable steps where all preceding steps are valid
  const selectableSteps: IntakeStep[] = [];
  for (let i = 0; i < stepsList.length; i++) {
    const stepVal = stepsList[i];
    if (i === 0) {
      selectableSteps.push(stepVal);
    } else {
      let allPrevValid = true;
      for (let j = 0; j < i; j++) {
        if (!checkStepValidity(stepsList[j], values)) {
          allPrevValid = false;
          break;
        }
      }
      if (allPrevValid) {
        selectableSteps.push(stepVal);
      }
    }
  }

  const isLoadingForm = !isLoaded || (isUpdateMode && isLoadingCase) || (!isUpdateMode && isLoadingPackages);

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

        {/* SLA 48h Banner */}
        <div className="max-w-lg mx-auto">
          <Alert
            variant="light"
            color="blue"
            icon={<Clock className="w-4 h-4" />}
            className="text-left text-xs font-body"
          >
            ⏱ Thời gian phản biện: 48h kể từ khi thanh toán và có Supporter phân
            công
          </Alert>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Progress Stepper Sidebar */}
        <div className="lg:col-span-1 lg:sticky lg:top-6 flex flex-col gap-3">
          <IntakeProgressStepper
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
            <span className="font-heading font-bold text-lg leading-snug">
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
