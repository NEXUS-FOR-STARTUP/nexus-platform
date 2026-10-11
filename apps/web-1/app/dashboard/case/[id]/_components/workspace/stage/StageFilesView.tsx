"use client";

import { useMemo, useState } from "react";
import { Stack, Paper, Text, Button, Group, FileButton, Alert } from "@mantine/core";
import { Upload, AlertCircle, FileText } from "lucide-react";
import { notifications } from "@mantine/notifications";
import { useStageDocumentUpload } from "../../../hooks/useStageDocumentUpload";
import { apiClient } from "@/lib/api-client";
import type { StageCode } from "@app/shared/stages";
import type { DocumentWorkspace } from "@/types";
import {
  buildSupportFlowRows,
  buildExternalFeedbackRows,
  type WorkspaceTab,
  type FilterRole,
} from "../../documents/document-workspace.types";
import { buildCategoryGroups } from "../../documents/document-groups";
import DocumentRowsTable from "../../documents/DocumentRowsTable";
import DocumentWorkspaceHeader from "../../documents/DocumentWorkspaceHeader";

interface StageFilesViewProps {
  caseId: string;
  checkpointCode: StageCode;
  checkpointId?: string;
  fileCount: number;
  documentWorkspace?: DocumentWorkspace | null;
}

export default function StageFilesView({
  caseId,
  checkpointCode,
  checkpointId,
  fileCount,
  documentWorkspace,
}: StageFilesViewProps) {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("documents");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const uploadMutation = useStageDocumentUpload(caseId, checkpointCode);
  const isMarketStage = checkpointCode === "CP2";

  const selectedCheckpoint = useMemo(() => {
    if (!documentWorkspace?.checkpoints.length) return null;
    return (
      documentWorkspace.checkpoints.find((cp) => cp.checkpoint_code === checkpointCode) ?? null
    );
  }, [documentWorkspace, checkpointCode]);

  const documentRows = useMemo(() => {
    if (!selectedCheckpoint) return [];
    return buildSupportFlowRows(selectedCheckpoint.support_flow_documents).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [selectedCheckpoint]);

  const feedbackRows = useMemo(() => {
    if (!selectedCheckpoint) return [];
    return buildExternalFeedbackRows(selectedCheckpoint.external_feedback_documents).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [selectedCheckpoint]);

  const displayedRows = useMemo(() => {
    if (activeTab === "external-feedback") return feedbackRows;
    if (filterRole === "student") {
      return documentRows.filter((r) => r.uploaderRole === "student");
    }
    if (filterRole === "supporter") {
      return documentRows.filter((r) => r.uploaderRole === "supporter" || r.uploaderRole === "admin");
    }
    return documentRows;
  }, [activeTab, documentRows, feedbackRows, filterRole]);

  const displayedGroups = useMemo(
    () => (activeTab === "documents" ? buildCategoryGroups(displayedRows) : []),
    [activeTab, displayedRows],
  );

  const studentDocCount = useMemo(
    () => documentRows.filter((r) => r.uploaderRole === "student").length,
    [documentRows],
  );
  const supporterDocCount = useMemo(
    () => documentRows.filter((r) => r.uploaderRole === "supporter" || r.uploaderRole === "admin").length,
    [documentRows],
  );

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

  const hasDocuments = documentRows.length > 0 || feedbackRows.length > 0;

  return (
    <Stack gap="md">
      {isMarketStage && (
        <Alert icon={<AlertCircle size={16} />} color="blue" title="Lưu ý quyền riêng tư">
          Nếu tải lên tệp khảo sát hoặc ghi chép phỏng vấn, vui lòng xóa hoặc ẩn các thông tin cá nhân (email, số điện thoại, tên ngườ
          i trả lờ
          i).
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

      {!documentWorkspace || !selectedCheckpoint || !hasDocuments ? (
        <Paper p="xl" withBorder radius="md" style={{ textAlign: "center" }}>
          <Stack align="center" gap="xs">
            <FileText size={32} className="text-gray-400" />
            <Text size="sm" c="dimmed">Chưa có tài liệu nào được nộp cho giai đoạn này.</Text>
            <Text size="xs" c="dimmed">Bạn có thể trả lờ
              i câu hỏi ở tab Soạn thảo hoặc tải tài liệu trực tiếp tại đây.</Text>
          </Stack>
        </Paper>
      ) : (
        <div className="bg-surface-app border border-border-app rounded-xl overflow-hidden">
          <DocumentWorkspaceHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filterRole={filterRole}
            setFilterRole={setFilterRole}
            documentCount={documentRows.length}
            feedbackCount={feedbackRows.length}
            reportCount={0}
            studentDocCount={studentDocCount}
            supporterDocCount={supporterDocCount}
            checkpoints={documentWorkspace.checkpoints}
            selectedCheckpointId={checkpointId || selectedCheckpoint.checkpoint_id}
            onSelectCheckpoint={() => {}}
            hideCheckpointSelector
          />

          {displayedRows.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base font-medium text-text-muted">
                {activeTab === "documents"
                  ? "Không có tài liệu nào thuộc bộ lọc này."
                  : "Chưa có tài liệu đánh giá bên ngoài trong giai đoạn này."}
              </p>
            </div>
          ) : (
            <DocumentRowsTable
              activeTab={activeTab}
              rows={displayedRows}
              groups={displayedGroups}
            />
          )}
        </div>
      )}
    </Stack>
  );
}
