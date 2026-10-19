"use client";

import React, { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Case } from "@/types";
import { useCaseDetails } from "../hooks/useCaseDetails";
import { Save, Loader2 } from "lucide-react";
import { Button, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { isCaseContactComplete } from "@repo/validation";
import CaseContactFields from "./CaseContactFields";
import CaseProjectFields, { type CaseProjectValues } from "./CaseProjectFields";
import CaseDeleteSection from "./CaseDeleteSection";
import { contactFromSnapshot, validateCaseContact, type CaseContactValues } from "../../../_components/case-contact";

interface IntakeSnapshotLike {
  team_name?: string;
  group_no?: string;
  school?: string;
  course_context?: string;
  team_context?: { project_name?: string; group_no?: string; school?: string; course_context?: string };
}

interface TabCaseSettingsProps {
  caseData: Case;
  intakeSnapshot?: unknown;
}

interface SettingsValues {
  project: CaseProjectValues;
  contact: CaseContactValues;
}

export default function TabCaseSettings({ caseData, intakeSnapshot }: TabCaseSettingsProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const { updateSettings, isUpdatingSettings, contact: caseContact } = useCaseDetails(caseData.id);

  const intake = (typeof intakeSnapshot === "object" && intakeSnapshot !== null ? intakeSnapshot : {}) as IntakeSnapshotLike;
  const teamCtx = intake.team_context || {};

  // Contact is case-scoped: prefilled only from this case's contact (profile + intake).
  const [initial, setInitial] = useState<SettingsValues>(() => ({
    project: {
      teamName: caseData.team_name || teamCtx.project_name || intake.team_name || "",
      groupNo: caseData.group_no || teamCtx.group_no || intake.group_no || "",
      school: caseData.school || teamCtx.school || intake.school || "",
      courseContext: caseData.course_context || teamCtx.course_context || intake.course_context || "",
    },
    contact: contactFromSnapshot(caseContact),
  }));
  const [project, setProject] = useState<CaseProjectValues>(initial.project);
  const [contact, setContact] = useState<CaseContactValues>(initial.contact);
  const showContactHint = searchParams.get("tab") === "settings" && !isCaseContactComplete(caseContact);

  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = JSON.stringify({ project, contact }) !== JSON.stringify(initial);

  const clearError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  // Input `name`s in DOM order; errors are keyed `<name>` (project) or `contact_<name>`.
  const focusFirstError = (found: Record<string, string>) => {
    const fieldNames = [...Object.keys(project), ...Object.keys(contact)];
    const target = fieldNames.find((n) => found[n] || found[`contact_${n}`]);
    const el = target && formRef.current?.querySelector<HTMLInputElement>(`[name="${target}"]`);
    if (el) {
      el.scrollIntoView({ block: "center" });
      el.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!project.teamName.trim()) newErrors.teamName = "Tên nhóm / Tên đề tài là bắt buộc.";
    if (!project.school.trim()) newErrors.school = "Trường học / Viện đào tạo là bắt buộc.";
    if (!project.courseContext.trim()) newErrors.courseContext = "Lớp học / Môn học là bắt buộc.";

    const contactErrors = validateCaseContact(contact, true);
    Object.entries(contactErrors).forEach(([k, v]) => {
      if (v) newErrors[`contact_${k}`] = v;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      focusFirstError(newErrors);
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
        team_name: project.teamName,
        school: project.school,
        course_context: project.courseContext,
        group_no: project.groupNo,
        contact: Object.fromEntries(
          Object.entries(contact).map(([k, v]) => [k, v.trim()]),
        ),
      });
      setInitial({ project, contact });
      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] });
      notifications.show({
        title: "Thành công",
        message: "Đã lưu thông tin dự án và liên hệ. Bạn sẽ nhận thông báo qua số điện thoại và email này.",
        color: "green",
      });
    } catch (err: unknown) {
      const data = isAxiosError(err) ? err.response?.data : undefined;
      notifications.show({
        title: "Lỗi",
        message: data?.message || data?.error || "Gặp lỗi khi lưu thông tin cài đặt.",
        color: "red",
      });
    }
  };

  return (
    <Stack gap="xl">
      <div>
        <Text fw={500} size="xl">Cài đặt dự án</Text>
        <Text size="sm" c="dimmed">Thông tin dưới đây áp dụng cho dự án này.</Text>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <Stack gap="xl">
          <CaseProjectFields
            values={project}
            errors={errors}
            onChange={(field, value) => {
              setProject((prev) => ({ ...prev, [field]: value }));
              clearError(field);
            }}
          />

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

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isDirty || isUpdatingSettings}
              color="brand"
              leftSection={isUpdatingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            >
              {isUpdatingSettings ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </Stack>
      </form>

      <CaseDeleteSection caseId={caseData.id} stage={caseData.user_facing_stage} />
    </Stack>
  );
}
