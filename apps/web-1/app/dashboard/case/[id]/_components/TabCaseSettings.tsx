"use client";

import React, { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import type { Case } from "@/types";
import { useCaseDetails } from "../hooks/useCaseDetails";
import { contactFromSnapshot, validateCaseContact, type CaseContactValues } from "../../../_components/case-contact";
import CaseContactFields from "./CaseContactFields";
import CaseDeleteSection from "./CaseDeleteSection";
import CaseProjectFields, { type CaseProjectValues } from "./CaseProjectFields";
import { Button } from "./ui/Button";
import Notice, { type NoticeKind } from "./ui/Notice";
import PageHead from "./ui/PageHead";
import s from "./settings-tab.module.css";

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

interface NoticeState {
  kind: NoticeKind;
  title: string;
  message: string;
}

export default function TabCaseSettings({ caseData, intakeSnapshot }: TabCaseSettingsProps) {
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
  const [notice, setNotice] = useState<NoticeState | null>(null);

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
      setNotice({
        kind: "bad",
        title: "Chưa thể lưu cài đặt",
        message: "Vui lòng kiểm tra và điền đầy đủ các trường thông tin bắt buộc.",
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
      setNotice({
        kind: "ok",
        title: "Thành công",
        message: "Đã lưu thông tin dự án và liên hệ. Bạn sẽ nhận thông báo qua số điện thoại và email này.",
      });
    } catch (err: unknown) {
      const data = isAxiosError(err) ? err.response?.data : undefined;
      setNotice({
        kind: "bad",
        title: "Lỗi",
        message: data?.message || data?.error || "Gặp lỗi khi lưu thông tin cài đặt.",
      });
    }
  };

  return (
    <div className={s.page}>
      <PageHead
        title="Cài đặt"
        note="Cập nhật tên nhóm, trường học và bối cảnh lớp học để báo cáo phản biện hiển thị chính xác. Mục có dấu * là bắt buộc."
      />

      <div>
        {notice && (
          <Notice kind={notice.kind} title={notice.title}>
            {notice.message}
          </Notice>
        )}
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
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
          />

          <div className={s.save}>
            <Button type="submit" disabled={!isDirty} loading={isUpdatingSettings}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>

      <CaseDeleteSection caseId={caseData.id} stage={caseData.user_facing_stage} />
    </div>
  );
}
