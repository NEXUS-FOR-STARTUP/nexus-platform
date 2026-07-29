"use client";

import React, { useState } from "react";
import { Case } from "@/types";
import { useCaseDetails } from "../hooks/useCaseDetails";
import {
  Settings,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button, TextInput, Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface TabCaseSettingsProps {
  caseData: Case;
  intakeSnapshot?: any;
}

export default function TabCaseSettings({ caseData, intakeSnapshot }: TabCaseSettingsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { updateSettings, isUpdatingSettings, deleteCase, isDeletingCase } = useCaseDetails(caseData.id);

  const intake = (intakeSnapshot as any) || {};
  const teamCtx = intake.team_context || {};

  // Fields matching simple settings configuration
  const [teamName, setTeamName] = useState(caseData.team_name || teamCtx.project_name || intake.team_name || "");
  const [groupNo, setGroupNo] = useState(caseData.group_no || teamCtx.group_no || intake.group_no || "");
  const [school, setSchool] = useState(caseData.school || teamCtx.school || intake.school || "");
  const [courseContext, setCourseContext] = useState(caseData.course_context || teamCtx.course_context || intake.course_context || "");

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
    if (!teamName.trim()) newErrors.teamName = "Tên nhóm / Tên đề tài là bắt buộc.";
    if (!school.trim()) newErrors.school = "Trường học / Viện đào tạo là bắt buộc.";
    if (!courseContext.trim()) newErrors.courseContext = "Lớp học / Môn học là bắt buộc.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notifications.show({
        title: "Chưa thể lưu cấu hình",
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
      });
      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] });
      notifications.show({
        title: "Thành công",
        message: "Đã cập nhật thông tin hồ sơ thành công!",
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
            <h3 className="font-heading font-bold text-lg">Cấu hình thông tin hồ sơ</h3>
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
