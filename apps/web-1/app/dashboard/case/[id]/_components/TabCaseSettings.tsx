"use client";

import React, { useState } from "react";
import { Case } from "@/types";
import { useCaseDetails } from "../hooks/useCaseDetails";
import { Settings, Save, AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { Button, TextInput, Modal } from "@mantine/core";
import { useRouter } from "next/navigation";

interface TabCaseSettingsProps {
  caseData: Case;
}

export default function TabCaseSettings({ caseData }: TabCaseSettingsProps) {
  const router = useRouter();
  const { updateSettings, isUpdatingSettings, deleteCase, isDeletingCase } = useCaseDetails(caseData.id);

  const [teamName, setTeamName] = useState(caseData.team_name || "");
  const [school, setSchool] = useState(caseData.school || "");
  const [courseContext, setCourseContext] = useState(caseData.course_context || "");
  const [groupNo, setGroupNo] = useState(caseData.group_no || "");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    try {
      await updateSettings({
        team_name: teamName,
        school,
        course_context: courseContext,
        group_no: groupNo,
      });
      setStatusMsg({ type: "success", text: "Đã cập nhật thông tin hồ sơ thành công!" });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err?.response?.data?.error || "Gặp lỗi khi lưu thông tin cấu hình.",
      });
    }
  };

  const handleDeleteCase = async () => {
    if (deleteConfirmText !== "DELETE") return;

    try {
      await deleteCase();
      setIsDeleteModalOpen(false);
      router.push("/dashboard");
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err?.response?.data?.error || "Gặp lỗi khi xóa hồ sơ dự án.",
      });
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="bg-surface-app border border-border-app rounded-lg p-6 font-body text-xs text-text-app animate-fade-in">
      <div className="max-w-xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-text-app">
            <Settings className="w-5 h-5 text-brand" />
            <h3 className="font-heading font-semibold text-base">Cấu hình thông tin hồ sơ</h3>
          </div>
          <p className="text-text-muted text-xs mt-1">
            Cập nhật tên nhóm, trường học và bối cảnh lớp học để báo cáo phản biện hiển thị chính xác.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs animate-fade-in ${
              statusMsg.type === "success"
                ? "bg-success-soft text-success border-success/15"
                : "bg-danger-soft text-danger border-danger/15"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Tên nhóm / Tên đề tài"
              placeholder="Ví dụ: MedTech, Team Sáng Tạo..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              variant="default"
              radius="md"
            />

            <TextInput
              label="Mã số nhóm / Số thứ tự"
              placeholder="Ví dụ: N03, Group 5..."
              value={groupNo}
              onChange={(e) => setGroupNo(e.target.value)}
              variant="default"
              radius="md"
            />

            <TextInput
              label="Trường học / Viện đào tạo"
              placeholder="Ví dụ: Đại học FPT, Đại học Bách Khoa..."
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              variant="default"
              radius="md"
            />

            <TextInput
              label="Lớp học / Môn học"
              placeholder="Ví dụ: EXE101, MKT301..."
              value={courseContext}
              onChange={(e) => setCourseContext(e.target.value)}
              variant="default"
              radius="md"
            />
          </div>

          <div className="pt-2 border-t border-border-app/40 flex justify-end">
            <Button
              type="submit"
              disabled={isUpdatingSettings}
              color="brand"
              leftSection={isUpdatingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              className="font-semibold text-xs h-9 px-4 cursor-pointer disabled:opacity-60"
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
