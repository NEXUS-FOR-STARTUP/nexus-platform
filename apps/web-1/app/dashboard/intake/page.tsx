"use client";

import React, { useState, useMemo, Suspense } from "react";
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
import DemoDataFAB, { type PresetOption } from "@/components/ui/DemoDataFAB";

const NEXUS_INTAKE_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Nhóm đã hoàn thành 4 CP với điểm tốt nhưng chưa có doanh thu thật từ 9 team đã hỗ trợ (đều miễn phí do GV chuyển đến). Cần kiểm chứng willingness-to-pay và chuyển từ Concierge MVP sang Web App MVP. Cạnh tranh với ChatGPT/Gemini đang ngày càng mạnh.",
  current_situations: [
    "Đã test MVP với khách hàng thật (9 team)",
    "Đã phỏng vấn khách hàng (25 người)",
    "Đã có quy trình audit + template + checklist",
    "Đang xây web app (Next.js + Hono + Prisma)",
    "Đã có Lean Canvas + SWOT + kế hoạch tài chính 10 quý",
    "Chưa có doanh thu",
  ],
  case_summary:
    "Nexus là dịch vụ audit và refine ý tưởng khởi nghiệp cho sinh viên EXE101. Khách hàng: team FPT gặp khó ở CP1. Pain: không biết lỗi gốc, không biết sửa gì trước. Giải pháp: audit có cấu trúc → report lỗi + hướng sửa → re-audit. Bằng chứng: 9 team cải thiện từ ~3.5 lên >=8/10. Mô hình KD: 3 gói 149K-599K, bootstrapping. Tech: Next.js 16 + Hono + Prisma + AI SDK.",
  contact: {
    full_name: "Phùng Lưu Hoàng Long",
    student_code: "SE190377",
    team_role: "Project Manager & Tech Lead",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "13",
    project_name: "Nexus",
    team_status_summary:
      "Nhóm 6 người (3 CNPM + 3 Truyền thông ĐPT). Đã hoàn thành CP1-CP4 môn EXE101 kỳ Summer 2026. Đã hỗ trợ 9 team EXE101 cải thiện điểm CP1 từ ~3.5 lên >=8.0. Đang chuyển từ Concierge MVP sang Web App MVP.",
  },
  support_needs: {
    primary_need: "team_fit",
    extra_notes:
      "Team có đủ năng lực scale không? (3 CNPM + 3 Truyền thông). Rủi ro phụ thuộc founder. Cần thêm vai trò gì khi mở rộng? Đánh giá mô hình doanh thu 149K-599K.",
  },
  documents: [],
  lecturer_feedback:
    'CP2: "Làm web app hẳn hoi, không chỉ Google Form + Sheet". CP3: "Đừng phụ thuộc rubric — xây tiêu chí đánh giá riêng". CP4: "Không oversell — Nexus hỗ trợ, không cam kết điểm".',
  expected_outputs:
    "Báo cáo team-fit: điểm mạnh/yếu, gaps, rủi ro, vai trò cần bổ sung.",
  boundary_confirmations: [],
  school: "FPT University HCMC",
  course_context: "EXE101 - Summer 2026",
};

const DEMO_PRESETS: PresetOption[] = [
  {
    label: "Nexus - Nhóm 13 EXE101",
    description: "Dịch vụ audit idea khởi nghiệp cho sinh viên FPT",
    data: NEXUS_INTAKE_PRESET,
  },
];

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

  const initialData: IntakeData | null = useMemo(() => {
    if (!existingCaseData) return null;
    const rawSnapshot = existingCaseData.intake_snapshot || {};
    return {
      ...rawSnapshot,
      package_id: existingCaseData.package_id || rawSnapshot.package_id || "",
      school: existingCaseData.school || rawSnapshot.school || rawSnapshot.team_context?.school || "Đại học FPT",
      course_context: existingCaseData.course_context || rawSnapshot.course_context || rawSnapshot.team_context?.course_context || "EXE101",
      current_blocker: rawSnapshot.current_blocker || "",
      current_situations: rawSnapshot.current_situations || [],
      case_summary: rawSnapshot.case_summary || "",
      contact: {
        full_name: rawSnapshot.contact?.full_name || existingCaseData.owner?.name || "",
        student_code: rawSnapshot.contact?.student_code || "",
        team_role: rawSnapshot.contact?.team_role || rawSnapshot.contact?.role || "Trưởng nhóm",
        zalo: rawSnapshot.contact?.zalo || rawSnapshot.contact?.phone || "",
        email: rawSnapshot.contact?.email || existingCaseData.owner?.email || "",
        telegram: rawSnapshot.contact?.telegram || "",
      },
      team_context: {
        group_no: existingCaseData.group_no || rawSnapshot.team_context?.group_no || "",
        project_name: existingCaseData.team_name || rawSnapshot.team_context?.project_name || "",
        team_status_summary: rawSnapshot.team_context?.team_status_summary || rawSnapshot.current_blocker || "",
      },
      support_needs: {
        primary_need: rawSnapshot.support_needs?.primary_need || "clarify_customer_pain",
        extra_notes: rawSnapshot.support_needs?.extra_notes || "",
      },
      documents: rawSnapshot.documents || [],
      lecturer_feedback: rawSnapshot.lecturer_feedback || "",
      expected_outputs: rawSnapshot.expected_outputs || "",
      boundary_confirmations: rawSnapshot.boundary_confirmations || [],
    };
  }, [existingCaseData]);

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
          // Support needs
          form.setFieldValue("support_needs.primary_need", preset.support_needs.primary_need);
          form.setFieldValue("support_needs.extra_notes", preset.support_needs.extra_notes);
          // Other
          form.setFieldValue("lecturer_feedback", preset.lecturer_feedback);
          form.setFieldValue("expected_outputs", preset.expected_outputs);
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
