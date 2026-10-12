"use client";

import { useMemo, useState } from "react";
import { Stack, Paper, Text, Button, Group, Alert } from "@mantine/core";
import { Upload, AlertCircle, FileText } from "lucide-react";
import type { StageCode } from "@app/shared/stages";
import type { DocumentWorkspace } from "@/types";
import StageDocumentUploadModal from "./StageDocumentUploadModal";
import {
  buildSupportFlowRows,
  buildExternalFeedbackRows,
  type WorkspaceTab,
  type FilterRole,
} from "../../documents/document-workspace.types";
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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("documents");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
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

  const studentDocCount = useMemo(
    () => documentRows.filter((r) => r.uploaderRole === "student").length,
    [documentRows],
  );
  const supporterDocCount = useMemo(
    () => documentRows.filter((r) => r.uploaderRole === "supporter" || r.uploaderRole === "admin").length,
    [documentRows],
  );

  const hasDocuments = documentRows.length > 0 || feedbackRows.length > 0;


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
          <Button size="sm" leftSection={<Upload size={16} />} onClick={() => setUploadOpen(true)}>
            Tải tài liệu mới
          </Button>
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
            />
          )}
        </div>
      )}
      <StageDocumentUploadModal
        opened={uploadOpen}
        onClose={() => setUploadOpen(false)}
        caseId={caseId}
        checkpointCode={checkpointCode}
      />
    </Stack>
  );
}
