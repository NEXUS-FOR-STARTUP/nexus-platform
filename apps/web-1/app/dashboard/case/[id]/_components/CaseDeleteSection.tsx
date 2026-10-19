"use client";

import { useState } from "react";
import { Trash as Trash2 } from "@phosphor-icons/react";
import { isAxiosError } from "axios";
import { Button, Modal, Stack, Text, TextInput } from "@mantine/core";
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
    } catch (err: unknown) {
      notifications.show({
        title: "Lỗi",
        message: (isAxiosError(err) && err.response?.data?.error) || "Gặp lỗi khi xóa dự án.",
        color: "red",
      });
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      {stage === "submitted" && (
        <Stack gap="sm">
          <div>
            <Text fw={500} size="lg" c="red" className="flex items-center gap-2">
              <Trash2 size={18} aria-hidden />
              Vùng nguy hiểm
            </Text>
            <Text size="sm" c="dimmed">
              Dự án này chưa được admin duyệt. Bạn có thể xóa vĩnh viễn dự án này. Hành động này không thể hoàn tác.
            </Text>
          </div>
          <div>
            <Button color="red" variant="outline" onClick={() => setIsDeleteModalOpen(true)}>
              Xóa dự án
            </Button>
          </div>
        </Stack>
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
