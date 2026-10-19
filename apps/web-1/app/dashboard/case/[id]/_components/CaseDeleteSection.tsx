"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, TextInput, Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useCaseDetails } from "../hooks/useCaseDetails";

interface CaseDeleteSectionProps {
  caseId: string;
  stage: string;
}

export default function CaseDeleteSection({ caseId, stage }: CaseDeleteSectionProps) {
  const router = useRouter();
  const { deleteCase, isDeletingCase } = useCaseDetails(caseId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDeleteCase = async () => {
    if (deleteConfirmText !== "DELETE") return;

    try {
      await deleteCase();
      setIsDeleteModalOpen(false);
      notifications.show({
        title: "Thành công",
        message: "Đã xóa dự án.",
        color: "green",
      });
      router.push("/dashboard");
    } catch (err: any) {
      notifications.show({
        title: "Lỗi",
        message: err?.response?.data?.error || "Gặp lỗi khi xóa dự án.",
        color: "red",
      });
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      {stage === "submitted" && (
          <div className="pt-6 border-t border-red-500/10 mt-6 space-y-4">
            <div>
              <h4 className="font-heading font-semibold text-sm text-red-500 flex items-center gap-2">
                <Trash2 className="w-4.5 h-4.5" />
                Vùng nguy hiểm
              </h4>
              <p className="text-text-muted text-xs mt-1">
                Dự án này chưa được admin duyệt. Bạn có thể xóa vĩnh viễn dự án này. Hành động này không thể hoàn tác.
              </p>
            </div>
            <div>
              <Button
                color="red"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(true)}
                className="font-semibold text-xs h-9 px-4 cursor-pointer hover:bg-red-50 hover:text-red-600 border-red-200 text-red-500 rounded-lg"
              >
                Xóa dự án
              </Button>
            </div>
          </div>
      )}

      <Modal
        opened={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmText("");
        }}
        title={
          <span className="font-heading font-semibold text-sm text-red-600 flex items-center gap-1.5">
            <Trash2 className="w-4.5 h-4.5" />
            Xác nhận xóa dự án
          </span>
        }
        centered
        radius="md"
        size="sm"
      >
        <div className="space-y-4 font-body text-xs">
          <p className="text-text-app leading-relaxed">
            Hành động này sẽ <strong className="text-red-600">xóa vĩnh viễn</strong> dự án này, bao gồm toàn bộ tài liệu đính kèm, các phiên bản và lịch sử trao đổi. <strong className="text-red-600">Dữ liệu đã xóa không thể khôi phục.</strong>
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
    </>
  );
}
