"use client";

import React, { useState } from "react";
import { Case } from "@/types";
import { useCaseDetails } from "../hooks/useCaseDetails";
import { Settings, Save, Loader2 } from "lucide-react";
import { Button, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { isCaseContactComplete } from "@repo/validation";
import CaseContactFields from "./CaseContactFields";
import CaseDeleteSection from "./CaseDeleteSection";
import { contactFromSnapshot, validateCaseContact, type CaseContactValues } from "../../../_components/case-contact";

interface TabCaseSettingsProps {
  caseData: Case;
  intakeSnapshot?: any;
}

export default function TabCaseSettings({ caseData, intakeSnapshot }: TabCaseSettingsProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { updateSettings, isUpdatingSettings, contact: caseContact } = useCaseDetails(caseData.id);

  const intake = (intakeSnapshot as any) || {};
  const teamCtx = intake.team_context || {};

  // Fields matching simple settings configuration
  const [teamName, setTeamName] = useState(caseData.team_name || teamCtx.project_name || intake.team_name || "");
  const [groupNo, setGroupNo] = useState(caseData.group_no || teamCtx.group_no || intake.group_no || "");
  const [school, setSchool] = useState(caseData.school || teamCtx.school || intake.school || "");
  const [courseContext, setCourseContext] = useState(caseData.course_context || teamCtx.course_context || intake.course_context || "");

  // Contact is case-scoped: prefilled only from this case's contact (profile + intake).
  const [contact, setContact] = useState<CaseContactValues>(() => contactFromSnapshot(caseContact));
  const showContactHint = searchParams.get("tab") === "settings" && !isCaseContactComplete(caseContact);

  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!teamName.trim()) newErrors.teamName = "Tên nhóm / Tên đề tài là bắt buộc.";
    if (!school.trim()) newErrors.school = "Trường học / Viện đào tạo là bắt buộc.";
    if (!courseContext.trim()) newErrors.courseContext = "Lớp học / Môn học là bắt buộc.";

    const contactErrors = validateCaseContact(contact, true);
    Object.entries(contactErrors).forEach(([k, v]) => {
      if (v) newErrors[`contact_${k}`] = v;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notifications.show({
        title: "Chưa thể lưu cài đặt",
        message: "Vui lòng kiểm tra và điền đầy đủ các trường thông tin bắt buộc.",
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
        contact: Object.fromEntries(
          Object.entries(contact).map(([k, v]) => [k, v.trim()]),
        ),
      });
      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] });
      notifications.show({
        title: "Thành công",
        message: "Đã lưu thông tin dự án và liên hệ. Bạn sẽ nhận thông báo qua số điện thoại và email này.",
        color: "green",
      });
    } catch (err: any) {
      notifications.show({
        title: "Lỗi",
        message: err?.response?.data?.message || err?.response?.data?.error || "Gặp lỗi khi lưu thông tin cài đặt.",
        color: "red",
      });
    }
  };

  return (
    <div className="bg-surface-app border border-border-app rounded-lg p-6 font-body text-sm text-text-app animate-fade-in space-y-6">
      <div className="w-full space-y-6">
        <div>
          <div className="flex items-center gap-2 text-text-app">
            <Settings className="w-5.5 h-5.5 text-brand" />
            <h3 className="font-heading font-bold text-lg">Cài đặt thông tin dự án</h3>
          </div>
          <p className="text-text-muted text-sm mt-1">
            Cập nhật tên nhóm, trường học và bối cảnh lớp học để báo cáo phản biện hiển thị chính xác.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Tên nhóm / Tên đề tài"
              placeholder="Nhập tên nhóm hoặc đề tài"
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value);
                clearError("teamName");
              }}
              error={errors.teamName}
              radius="md"
              withAsterisk
            />

            <TextInput
              label="Mã số nhóm / Số thứ tự"
              placeholder="Ví dụ: 5"
              value={groupNo}
              onChange={(e) => {
                setGroupNo(e.target.value);
                clearError("groupNo");
              }}
              error={errors.groupNo}
              radius="md"
            />

            <TextInput
              label="Trường học / Viện đào tạo"
              placeholder="Ví dụ: Đại học FPT"
              value={school}
              onChange={(e) => {
                setSchool(e.target.value);
                clearError("school");
              }}
              error={errors.school}
              radius="md"
              withAsterisk
            />

            <TextInput
              label="Lớp học / Môn học"
              placeholder="Ví dụ: EXE101"
              value={courseContext}
              onChange={(e) => {
                setCourseContext(e.target.value);
                clearError("courseContext");
              }}
              error={errors.courseContext}
              radius="md"
              withAsterisk
            />
          </div>

          <CaseContactFields
            values={contact}
            errors={Object.fromEntries(
              Object.keys(contact).map((k) => [k, errors[`contact_${k}`]]),
            )}
            onChange={(field, value) => {
              setContact((prev) => ({ ...prev, [field]: value }));
              clearError(`contact_${field}`);
            }}
            showHint={showContactHint}
          />

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

        <CaseDeleteSection caseId={caseData.id} stage={caseData.user_facing_stage} />
      </div>
    </div>
  );
}
