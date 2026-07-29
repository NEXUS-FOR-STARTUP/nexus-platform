"use client";

import React, { useState } from "react";
import { Case } from "@/types";
import { useCaseDetails } from "../hooks/useCaseDetails";
import {
  Settings,
  Save,
  Loader2,
  Trash2,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { Button, TextInput, Textarea, Select, Modal, Tooltip, Alert, Checkbox } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const PRIMARY_NEEDS = [
  { key: "filter_select_idea", label: "Cần hỗ trợ chọn hướng ý tưởng phù hợp để phát triển tiếp" },
  { key: "clarify_customer_pain", label: "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi" },
  { key: "critique_feasibility", label: "Cần phản biện để đánh giá giải pháp hiện tại có hợp lý và khả thi không" },
  { key: "audit_cp1_draft", label: "Cần rà soát báo cáo Checkpoint 1 và chỉ ra điểm cần chỉnh sửa" },
  { key: "improve_rejected_idea", label: "Cần góp ý để cải thiện ý tưởng sau phản hồi chưa tốt từ giảng viên" },
];

const BOUNDARY_RULES = [
  { id: "originality", label: "Chúng tôi cam kết tài liệu đính kèm là do nhóm tự nghiên cứu và xây dựng, không sao chép trái phép." },
  { id: "advisory_only", label: "Chúng tôi hiểu rằng các đánh giá và phản biện từ Nexus mang tính chất tư vấn phản biện, không thay thế điểm số của giảng viên." },
  { id: "accurate_contact", label: "Chúng tôi cam kết cung cấp đúng thông tin liên hệ để Supporter trao đổi khi cần làm rõ hồ sơ." }
];

interface TabCaseSettingsProps {
  caseData: Case;
  intakeSnapshot?: any;
}

export default function TabCaseSettings({ caseData, intakeSnapshot }: TabCaseSettingsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { updateSettings, isUpdatingSettings, deleteCase, isDeletingCase } = useCaseDetails(caseData.id);

  const intake = (intakeSnapshot as any) || {};
  const contact = intake.contact || {};
  const idea = intake.idea_context || intake.idea || {};
  const teamCtx = intake.team_context || {};

  // 1. Team & Context
  const [school, setSchool] = useState(caseData.school || teamCtx.school || intake.school || "Đại học FPT");
  const [courseContext, setCourseContext] = useState(caseData.course_context || teamCtx.course_context || intake.course_context || "EXE101");
  const [groupNo, setGroupNo] = useState(caseData.group_no || teamCtx.group_no || "");
  const [teamName, setTeamName] = useState(caseData.team_name || teamCtx.project_name || "");
  const [teamStatusSummary, setTeamStatusSummary] = useState(teamCtx.team_status_summary || intake.current_blocker || "");

  // 2. Contact Person
  const [contactName, setContactName] = useState(contact.full_name || (caseData.owner as any)?.name || "");
  const [studentCode, setStudentCode] = useState(contact.student_code || "");
  const [teamRole, setTeamRole] = useState(contact.team_role || contact.role || "Trưởng nhóm");
  const [contactEmail, setContactEmail] = useState(contact.email || (caseData.owner as any)?.email || "");
  const [contactPhone, setContactPhone] = useState(contact.zalo || contact.phone || "");
  const [contactTelegram, setContactTelegram] = useState(contact.telegram || "");

  // 3. Idea & Problem
  const [field, setField] = useState(idea.field || intake.field || "");
  const [targetCustomer, setTargetCustomer] = useState(idea.targetCustomer || idea.target_customer || intake.targetCustomer || intake.target_customer || "");
  const [problem, setProblem] = useState(idea.problem || intake.problem || "");
  const [solution, setSolution] = useState(idea.solution || intake.solution || "");
  const [mvp, setMvp] = useState(idea.mvp || intake.mvp || "");

  // 4. Support Needs
  const supportNeeds = intake.support_needs || {};
  const [primaryNeed, setPrimaryNeed] = useState(supportNeeds.primary_need || "clarify_customer_pain");
  const [expectedOutputs, setExpectedOutputs] = useState(intake.expected_outputs || supportNeeds.expected_outputs || "");
  const [extraNotes, setExtraNotes] = useState(supportNeeds.extra_notes || "");

  // 5. Boundary Confirmations
  const [boundaryConfirmations, setBoundaryConfirmations] = useState<string[]>(
    intake.boundary_confirmations || ["originality", "advisory_only", "accurate_contact"]
  );

  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const clearError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    // Section 1 Validation
    if (!school) newErrors.school = "Trường học là bắt buộc.";
    if (!courseContext) newErrors.courseContext = "Mã môn học là bắt buộc.";
    if (school === "Đại học FPT" && courseContext === "EXE101" && !groupNo.trim()) {
      newErrors.groupNo = "Số thứ tự nhóm (Group No) là bắt buộc.";
    }
    if (!teamName.trim()) newErrors.teamName = "Tên đề tài / Tên nhóm là bắt buộc.";

    // Section 2 Validation
    if (!contactName.trim()) newErrors.contactName = "Họ và tên người liên hệ là bắt buộc.";
    if (!studentCode.trim()) newErrors.studentCode = "Mã số sinh viên là bắt buộc.";
    if (!contactEmail.trim()) {
      newErrors.contactEmail = "Email liên hệ là bắt buộc.";
    } else if (!contactEmail.includes("@")) {
      newErrors.contactEmail = "Email không đúng định dạng.";
    }
    if (!contactPhone.trim()) newErrors.contactPhone = "Số điện thoại / Zalo là bắt buộc.";
    if (!teamRole.trim()) newErrors.teamRole = "Vai trò trong nhóm là bắt buộc.";

    // Section 3 Validation
    if (!field.trim()) newErrors.field = "Lĩnh vực hoạt động là bắt buộc.";
    if (!targetCustomer.trim()) newErrors.targetCustomer = "Khách hàng mục tiêu là bắt buộc.";
    if (!problem.trim()) newErrors.problem = "Vấn đề cốt lõi (Problem) là bắt buộc.";
    if (!solution.trim()) newErrors.solution = "Giải pháp đề xuất (Solution) là bắt buộc.";

    // Section 4 Validation
    if (!primaryNeed) newErrors.primaryNeed = "Nhu cầu hỗ trợ chính là bắt buộc.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notifications.show({
        title: "Chưa thể lưu cấu hình",
        message: "Vui lòng kiểm tra và điền đầy đủ các trường thông tin bắt buộc (*).",
        color: "red",
      });
      return;
    }

    setErrors({});

    try {
      await updateSettings({
        team_name: teamName,
        school,
        course_context: courseContext,
        group_no: groupNo,
        contact: {
          full_name: contactName,
          student_code: studentCode,
          team_role: teamRole,
          email: contactEmail,
          zalo: contactPhone,
          phone: contactPhone,
          telegram: contactTelegram,
        },
        idea: {
          field,
          targetCustomer,
          target_customer: targetCustomer,
          problem,
          solution,
          mvp,
        },
        current_blocker: teamStatusSummary,
        support_needs: {
          primary_need: primaryNeed,
          expected_outputs: expectedOutputs,
          extra_notes: extraNotes,
        },
        boundary_confirmations: boundaryConfirmations,
      });
      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] });
      notifications.show({
        title: "Thành công",
        message: "Đã cập nhật thông tin hồ sơ và ý tưởng thành công!",
        color: "green",
      });
    } catch (err: any) {
      notifications.show({
        title: "Lỗi",
        message: err?.response?.data?.message || err?.response?.data?.error || "Gặp lỗi khi lưu thông tin cấu hình.",
        color: "red",
      });
    }
  };

  const handleDeleteCase = async () => {
    if (deleteConfirmText !== "DELETE") return;

    try {
      await deleteCase();
      setIsDeleteModalOpen(false);
      notifications.show({
        title: "Thành công",
        message: "Đã xóa hồ sơ dự án.",
        color: "green",
      });
      router.push("/dashboard");
    } catch (err: any) {
      notifications.show({
        title: "Lỗi",
        message: err?.response?.data?.error || "Gặp lỗi khi xóa hồ sơ dự án.",
        color: "red",
      });
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="bg-surface-app border border-border-app rounded-lg p-6 font-body text-sm text-text-app animate-fade-in space-y-6">
      <div className="w-full space-y-6">
        <div>
          <div className="flex items-center gap-2 text-text-app">
            <Settings className="w-5.5 h-5.5 text-brand" />
            <h3 className="font-heading font-bold text-lg">Cấu hình & Cập nhật Hồ sơ Dự án</h3>
          </div>
          <p className="text-text-muted text-sm mt-1">
            Cập nhật thông tin đội ngũ, thông tin người đại diện, chi tiết ý tưởng khởi nghiệp, nhu cầu hỗ trợ và cam kết ranh giới.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Project & Team Context (Format matching Intake ProjectContextStep) */}
          <div className="bg-surface-app border border-border-app/80 rounded-xl p-5.5 space-y-4 shadow-xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-border-app/60">
              <h3 className="font-heading text-base font-bold text-text-app">Thông tin Nhóm / Đề tài</h3>
              <Tooltip label="Thông tin bối cảnh học tập và hoạt động của nhóm." position="top" withArrow>
                <span className="flex items-center">
                  <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-app cursor-help" />
                </span>
              </Tooltip>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Trường học"
                placeholder="Chọn trường học"
                data={[
                  { value: "Đại học FPT", label: "Đại học FPT" },
                  { value: "Khác", label: "Khác" },
                ]}
                value={school}
                onChange={(val) => {
                  setSchool(val || "");
                  clearError("school");
                  if (val === "Khác") {
                    setCourseContext("Khác");
                    setGroupNo("Khác");
                  } else if (val === "Đại học FPT") {
                    setCourseContext("EXE101");
                  }
                }}
                error={errors.school}
                radius="md"
                withAsterisk
              />

              <Select
                label="Mã môn học"
                placeholder="Chọn mã môn học"
                data={
                  school === "Đại học FPT"
                    ? [
                        { value: "EXE101", label: "EXE101" },
                        { value: "Khác", label: "Khác" },
                      ]
                    : [{ value: "Khác", label: "Khác" }]
                }
                value={courseContext}
                onChange={(val) => {
                  setCourseContext(val || "");
                  clearError("courseContext");
                  if (val === "Khác") {
                    setGroupNo("Khác");
                  }
                }}
                error={errors.courseContext}
                radius="md"
                withAsterisk
              />

              {school === "Đại học FPT" && courseContext === "EXE101" && (
                <TextInput
                  label="Số thứ tự nhóm (Group No)"
                  placeholder="Ví dụ: 5"
                  value={groupNo}
                  onChange={(e) => {
                    setGroupNo(e.target.value);
                    clearError("groupNo");
                  }}
                  error={errors.groupNo}
                  radius="md"
                  withAsterisk
                />
              )}

              <div className={school === "Đại học FPT" && courseContext === "EXE101" ? "" : "md:col-span-2"}>
                <TextInput
                  label="Tên đề tài"
                  placeholder="Ví dụ: EduMap"
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    clearError("teamName");
                  }}
                  error={errors.teamName}
                  radius="md"
                  withAsterisk
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label={
                    <div className="flex items-center gap-1.5">
                      <span>Tóm tắt hiện trạng nhóm</span>
                      <Tooltip
                        label="Mô tả ngắn gọn về tình hình hiện tại (ví dụ: đã phân chia công việc xong, đang gặp khó khăn trong thống nhất ý tưởng...)."
                        multiline
                        w={220}
                        withArrow
                      >
                        <span className="flex items-center">
                          <HelpCircle className="w-3.5 h-3.5 text-text-muted hover:text-text-app cursor-help" />
                        </span>
                      </Tooltip>
                    </div>
                  }
                  placeholder="Ví dụ: Nhóm đã thống nhất ý tưởng, đang viết đề cương phân tích thị trường..."
                  value={teamStatusSummary}
                  onChange={(e) => setTeamStatusSummary(e.target.value)}
                  minRows={2}
                  autosize
                  radius="md"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Person (Format matching Intake ContactStep) */}
          <div className="bg-surface-app border border-border-app/80 rounded-xl p-5.5 space-y-4 shadow-xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-border-app/60">
              <h3 className="font-heading text-base font-bold text-text-app">Thông tin người liên hệ</h3>
              <Tooltip label="Thông tin của bạn để Supporter tiện liên hệ hỗ trợ khi cần thiết." position="top" withArrow>
                <span className="flex items-center">
                  <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-app cursor-help" />
                </span>
              </Tooltip>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label={
                  <div className="flex items-center gap-1">
                    <span>Họ và tên <span className="text-red-500">*</span></span>
                  </div>
                }
                placeholder="Ví dụ: Nguyễn Văn A"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  clearError("contactName");
                }}
                error={errors.contactName}
                radius="md"
              />

              <TextInput
                label={
                  <div className="flex items-center gap-1.5">
                    <span>Mã số sinh viên <span className="text-red-500">*</span></span>
                    <Tooltip label="Nhập mã số sinh viên của bạn (ví dụ: HE150123) để xác thực bối cảnh Campus." multiline w={220} withArrow>
                      <span className="flex items-center">
                        <HelpCircle className="w-3.5 h-3.5 text-text-muted hover:text-text-app cursor-help" />
                      </span>
                    </Tooltip>
                  </div>
                }
                placeholder="Ví dụ: SE123456"
                value={studentCode}
                onChange={(e) => {
                  setStudentCode(e.target.value);
                  clearError("studentCode");
                }}
                error={errors.studentCode}
                radius="md"
              />

              <TextInput
                withAsterisk
                label="Email liên hệ"
                placeholder="Ví dụ: a@abc.com"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  clearError("contactEmail");
                }}
                error={errors.contactEmail}
                radius="md"
              />

              <TextInput
                withAsterisk
                label="Số điện thoại / Zalo"
                placeholder="Ví dụ: 0987654321"
                value={contactPhone}
                onChange={(e) => {
                  setContactPhone(e.target.value);
                  clearError("contactPhone");
                }}
                error={errors.contactPhone}
                radius="md"
              />

              <TextInput
                withAsterisk
                label="Vai trò trong nhóm"
                placeholder="Ví dụ: Trưởng nhóm, Founder..."
                value={teamRole}
                onChange={(e) => {
                  setTeamRole(e.target.value);
                  clearError("teamRole");
                }}
                error={errors.teamRole}
                radius="md"
              />

              <TextInput
                label="Telegram Username (Tùy chọn)"
                placeholder="Ví dụ: @annguyen_fpt"
                value={contactTelegram}
                onChange={(e) => setContactTelegram(e.target.value)}
                radius="md"
              />
            </div>
          </div>

          {/* Section 3: Startup Idea Details */}
          <div className="bg-surface-app border border-border-app/80 rounded-xl p-5.5 space-y-4 shadow-xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-border-app/60">
              <h3 className="font-heading text-base font-bold text-text-app">Chi tiết Ý tưởng Khởi nghiệp</h3>
              <Tooltip label="Mô tả ý tưởng, nỗi đau khách hàng và giải pháp của nhóm." position="top" withArrow>
                <span className="flex items-center">
                  <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-app cursor-help" />
                </span>
              </Tooltip>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Lĩnh vực hoạt động"
                  placeholder="Ví dụ: EdTech, HealthTech, E-Commerce..."
                  value={field}
                  onChange={(e) => {
                    setField(e.target.value);
                    clearError("field");
                  }}
                  error={errors.field}
                  radius="md"
                  withAsterisk
                />

                <TextInput
                  label="Khách hàng mục tiêu"
                  placeholder="Ví dụ: Sinh viên đại học, Doanh nghiệp SME..."
                  value={targetCustomer}
                  onChange={(e) => {
                    setTargetCustomer(e.target.value);
                    clearError("targetCustomer");
                  }}
                  error={errors.targetCustomer}
                  radius="md"
                  withAsterisk
                />
              </div>

              <Textarea
                label="Vấn đề cốt lõi (Problem)"
                placeholder="Mô tả thực trạng nỗi đau hoặc vấn đề mà nhóm bạn muốn giải quyết..."
                value={problem}
                onChange={(e) => {
                  setProblem(e.target.value);
                  clearError("problem");
                }}
                error={errors.problem}
                minRows={3}
                autosize
                radius="md"
                withAsterisk
              />

              <Textarea
                label="Giải pháp đề xuất (Solution)"
                placeholder="Mô tả cách thức sản phẩm/dịch vụ của bạn giải quyết vấn đề trên..."
                value={solution}
                onChange={(e) => {
                  setSolution(e.target.value);
                  clearError("solution");
                }}
                error={errors.solution}
                minRows={3}
                autosize
                radius="md"
                withAsterisk
              />

              <Textarea
                label="Sản phẩm khả thi tối thiểu (MVP)"
                placeholder="Mô tả tính năng chính của bản MVP mà bạn đã hoặc đang xây dựng..."
                value={mvp}
                onChange={(e) => setMvp(e.target.value)}
                minRows={2}
                autosize
                radius="md"
              />
            </div>
          </div>

          {/* Section 4: Support Needs (Format matching Intake SupportNeedsStep) */}
          <div className="bg-surface-app border border-border-app/80 rounded-xl p-5.5 space-y-4 shadow-xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-border-app/60">
              <h3 className="font-heading text-base font-bold text-text-app">Nhu cầu hỗ trợ</h3>
              <Tooltip
                label="Chỉ cần chọn hướng hỗ trợ chính. Phần ghi chú thêm và kỳ vọng đầu ra là tùy chọn."
                position="top"
                multiline
                w={240}
                withArrow
              >
                <span className="flex items-center">
                  <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-app cursor-help" />
                </span>
              </Tooltip>
            </div>

            <div className="space-y-4">
              <Select
                withAsterisk
                label="Nhu cầu hỗ trợ chính"
                placeholder="Chọn nhu cầu chính của nhóm bạn"
                data={PRIMARY_NEEDS.map((item) => ({ value: item.key, label: item.label }))}
                value={primaryNeed}
                onChange={(val) => {
                  setPrimaryNeed(val || "");
                  clearError("primaryNeed");
                }}
                error={errors.primaryNeed}
                radius="md"
              />

              <Textarea
                label={
                  <div className="flex items-center gap-1.5">
                    <span>Kết quả mong đợi sau phản biện (Tùy chọn)</span>
                    <Tooltip
                      label="Nếu muốn, hãy nói rõ supporter nên trả về dạng góp ý nào: chỉ điểm yếu logic, hỏi câu phản biện, hay gợi ý cách sửa."
                      multiline
                      w={220}
                      withArrow
                    >
                      <span className="flex items-center">
                        <HelpCircle className="w-3.5 h-3.5 text-text-muted hover:text-text-app cursor-help" />
                      </span>
                    </Tooltip>
                  </div>
                }
                placeholder="Ví dụ: Chỉ ra các điểm yếu chính trong logic khách hàng mục tiêu và đề xuất câu hỏi phản biện cụ thể..."
                value={expectedOutputs}
                onChange={(e) => setExpectedOutputs(e.target.value)}
                minRows={3}
                autosize
                radius="md"
              />

              <Textarea
                label="Ghi chú thêm cho Supporter (Tùy chọn)"
                placeholder="Bất kỳ thông tin bổ sung nào khác giúp Supporter hiểu rõ hơn vấn đề của nhóm."
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                minRows={2}
                autosize
                radius="md"
              />
            </div>
          </div>

          {/* Section 5: Cam kết ranh giới (Format matching Intake BoundaryStep) */}
          <div className="bg-surface-app border border-border-app/80 rounded-xl p-5.5 space-y-4 shadow-xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-border-app/60">
              <h3 className="font-heading text-base font-bold text-text-app">Cam kết ranh giới</h3>
              <Tooltip label="Đọc kỹ và xác nhận các điều khoản cam kết khi gửi hồ sơ dự án." position="top" withArrow>
                <span className="flex items-center">
                  <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-app cursor-help" />
                </span>
              </Tooltip>
            </div>

            <Alert
              variant="light"
              color="red"
              radius="md"
              title="ĐIỀU KHOẢN QUAN TRỌNG"
              icon={<AlertTriangle className="w-4.5 h-4.5 text-red-600" />}
              className="bg-red-500/10 border border-red-500/20 text-red-700 font-body text-xs leading-relaxed"
            >
              Bạn cần xác nhận các cam kết bên dưới để gửi hồ sơ. Nexus từ chối hỗ trợ tài liệu sao chép hoặc yêu cầu cam kết điểm số/kết quả đánh giá chính thức.
            </Alert>

            <div className="p-4 border rounded-xl space-y-3.5 bg-surface-soft/60 border-border-app/80">
              {BOUNDARY_RULES.map((rule) => {
                return (
                  <Checkbox
                    key={rule.id}
                    checked={true}
                    disabled={true}
                    label={rule.label}
                    size="sm"
                    radius="sm"
                    className="py-1 text-sm font-medium leading-relaxed"
                  />
                );
              })}
            </div>

            {errors.boundary && (
              <p className="text-xs text-red-500 font-body pl-1">
                {errors.boundary}
              </p>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isUpdatingSettings}
              color="brand"
              leftSection={isUpdatingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              className="font-semibold text-xs h-9 px-6 cursor-pointer disabled:opacity-60"
            >
              <span>{isUpdatingSettings ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </Button>
          </div>
        </form>

        {caseData.user_facing_stage === "submitted" && (
          <div className="pt-6 border-t border-red-500/10 mt-6 space-y-4">
            <div>
              <h4 className="font-heading font-semibold text-sm text-red-500 flex items-center gap-2">
                <Trash2 className="w-4.5 h-4.5" />
                Vùng nguy hiểm
              </h4>
              <p className="text-text-muted text-xs mt-1">
                Hồ sơ này chưa được admin duyệt. Bạn có thể xóa vĩnh viễn hồ sơ này. Hành động này không thể hoàn tác.
              </p>
            </div>
            <div>
              <Button
                color="red"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(true)}
                className="font-semibold text-xs h-9 px-4 cursor-pointer hover:bg-red-50 hover:text-red-600 border-red-200 text-red-500 rounded-lg"
              >
                Xóa hồ sơ dự án
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        opened={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmText("");
        }}
        title={
          <span className="font-heading font-semibold text-sm text-red-600 flex items-center gap-1.5">
            <Trash2 className="w-4.5 h-4.5" />
            Xác nhận xóa hồ sơ dự án
          </span>
        }
        centered
        radius="md"
        size="sm"
      >
        <div className="space-y-4 font-body text-xs">
          <p className="text-text-app leading-relaxed">
            Hành động này sẽ <strong className="text-red-600">xóa vĩnh viễn</strong> hồ sơ dự án này, bao gồm toàn bộ tài liệu đính kèm, các phiên bản và lịch sử trao đổi. <strong className="text-red-600">Dữ liệu đã xóa không thể khôi phục.</strong>
          </p>

          <TextInput
            label="Để xác nhận, vui lòng nhập chính xác chữ 'DELETE' vào ô bên dưới:"
            placeholder="DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            radius="md"
            className="mt-2"
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border-app/40">
            <Button
              variant="default"
              size="xs"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteConfirmText("");
              }}
              className="font-semibold text-xs h-9 px-4 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              color="red"
              size="xs"
              disabled={deleteConfirmText !== "DELETE" || isDeletingCase}
              onClick={handleDeleteCase}
              className="font-semibold text-xs h-9 px-4 cursor-pointer disabled:opacity-50"
            >
              {isDeletingCase ? "Đang xóa..." : "Tôi hiểu và muốn xóa"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
