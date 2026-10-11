"use client";

import { useState } from "react";
import { Stack, Paper, Text, Button, Group, FileButton, Alert, Table } from "@mantine/core";
import { Upload, AlertCircle, FileText } from "lucide-react";
import { notifications } from "@mantine/notifications";
import { useStageDocumentUpload } from "../../../hooks/useStageDocumentUpload";
import { apiClient } from "@/lib/api-client";
import type { StageCode } from "@app/shared/stages";

interface StageFilesViewProps {
  caseId: string;
  checkpointCode: StageCode;
  fileCount: number;
}

export default function StageFilesView({
  caseId,
  checkpointCode,
  fileCount,
}: StageFilesViewProps) {
  const [uploading, setUploading] = useState(false);
  const uploadMutation = useStageDocumentUpload(caseId, checkpointCode);
  const isMarketStage = checkpointCode === "CP2";

  const handleUploadFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post("/cases/uploads/managed-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploaded = res.data as {
        file_url: string;
        download_url: string;
        cloudinary_public_id: string;
        extension: string;
        mime_type: string;
      };
      await uploadMutation.mutateAsync([
        {
          original_name: file.name,
          file_url: uploaded.file_url,
          download_url: uploaded.download_url,
          cloudinary_public_id: uploaded.cloudinary_public_id,
          extension: uploaded.extension || "bin",
          mime_type: uploaded.mime_type || "application/octet-stream",
          doc_type: "pitch_deck",
        },
      ]);
      notifications.show({ color: "green", title: "Tải tệp thành công", message: file.name });
    } catch {
      notifications.show({ color: "red", title: "Lỗi tải tệp", message: "Không thể tải tài liệu lên." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack gap="md">
      {isMarketStage && (
        <Alert icon={<AlertCircle size={16} />} color="blue" title="Lưu ý quyền riêng tư">
          Nếu tải lên tệp khảo sát hoặc ghi chép phỏng vấn, vui lòng xóa hoặc ẩn các thông tin cá nhân (email, số điện thoại, tên người trả lời).
        </Alert>
      )}

      <Paper p="md" withBorder radius="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Text fw={600} size="sm">Tài liệu đã nộp ({fileCount})</Text>
            <Text size="xs" c="dimmed">Định dạng hỗ trợ: PDF, DOCX, XLSX, PPTX (tối đa 25MB)</Text>
          </Stack>
          <FileButton onChange={handleUploadFile} accept=".pdf,.docx,.xlsx,.pptx,.txt">
            {(props) => (
              <Button {...props} size="xs" leftSection={<Upload size={14} />} loading={uploading}>
                Tải tài liệu mới
              </Button>
            )}
          </FileButton>
        </Group>
      </Paper>

      {fileCount === 0 ? (
        <Paper p="xl" withBorder radius="md" style={{ textAlign: "center" }}>
          <Stack align="center" gap="xs">
            <FileText size={32} className="text-gray-400" />
            <Text size="sm" c="dimmed">Chưa có tài liệu nào được nộp cho giai đoạn này.</Text>
            <Text size="xs" c="dimmed">Bạn có thể trả lời câu hỏi ở tab Soạn thảo hoặc tải tài liệu trực tiếp tại đây.</Text>
          </Stack>
        </Paper>
      ) : (
        <Paper withBorder radius="md" p="sm">
          <Table verticalSpacing="xs">
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>
                  <Group gap="xs">
                    <FileText size={16} className="text-blue-600" />
                    <Text size="sm">Đã ghi nhận {fileCount} tài liệu đính kèm cho giai đoạn này.</Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
