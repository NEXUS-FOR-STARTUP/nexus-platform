"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Group, Modal, Paper, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { isAxiosError } from "axios";
import { UploadSimple as Upload } from "@phosphor-icons/react";
import type { StageCode } from "@app/shared/stages";
import type { DocumentWorkspace } from "@/types";
import { useStageDocumentDelete } from "../../../hooks/useStageDocumentDelete";
import { buildExternalFeedbackRows, buildSupportFlowRows } from "../../documents/document-workspace.types";
import DocumentGroupList from "./DocumentGroupList";
import { groupDocumentsByCategory, missingCategories, type DocumentGroup } from "./document-groups";
import StageDocumentUploadModal from "./StageDocumentUploadModal";
import { ACCEPTED_FORMATS_LABEL, MAX_FILES, MAX_FILE_SIZE_MB } from "./upload-limits";

const FEEDBACK_GROUP_LABEL = "Phản hồi ngoài";
const DELETE_FALLBACK_MESSAGE = "Xóa tài liệu thất bại.";

interface StageFilesViewProps {
  caseId: string;
  checkpointCode: StageCode;
  fileCount: number;
  documentWorkspace?: DocumentWorkspace | null;
}

export default function StageFilesView({ caseId, checkpointCode, fileCount, documentWorkspace }: StageFilesViewProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ documentId: string; displayName: string } | null>(null);
  const deleteMutation = useStageDocumentDelete(caseId);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    deleteMutation.mutate(target.documentId, {
      onError: (error: unknown) => {
        const message = isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ?? DELETE_FALLBACK_MESSAGE)
          : DELETE_FALLBACK_MESSAGE;
        notifications.show({ title: "Xóa thất bại", message, color: "red" });
      },
    });
  };

  const { groups, missing } = useMemo(() => {
    const checkpoint = documentWorkspace?.checkpoints.find((cp) => cp.checkpoint_code === checkpointCode);
    if (!checkpoint) return { groups: [] as DocumentGroup[], missing: [] as string[] };
    const categoryGroups = groupDocumentsByCategory(buildSupportFlowRows(checkpoint.support_flow_documents));
    const feedbackRows = buildExternalFeedbackRows(checkpoint.external_feedback_documents);
    const feedbackGroups = feedbackRows.length > 0 ? [{ label: FEEDBACK_GROUP_LABEL, rows: feedbackRows }] : [];
    return { groups: [...categoryGroups, ...feedbackGroups], missing: missingCategories(categoryGroups) };
  }, [documentWorkspace, checkpointCode]);

  return (
    <Stack gap="md">
      {checkpointCode === "CP2" && (
        <Alert color="blue" title="Lưu ý quyền riêng tư">
          Nếu tải lên tệp khảo sát hoặc ghi chép phỏng vấn, vui lòng xóa hoặc ẩn các thông tin cá nhân (email, số điện thoại, tên người trả lời).
        </Alert>
      )}

      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Stack gap={2}>
          <Text size="lg" fw={500}>Tài liệu đã nộp ({fileCount})</Text>
          <Text size="sm" c="dimmed">{ACCEPTED_FORMATS_LABEL}</Text>
          <Text size="sm" c="dimmed">Tối đa {MAX_FILES} tệp, mỗi tệp {MAX_FILE_SIZE_MB}MB</Text>
        </Stack>
        <Button variant="default" leftSection={<Upload size={16} />} onClick={() => setUploadOpen(true)}>
          Tải tài liệu lên
        </Button>
      </Group>

      {groups.length === 0 ? (
        <Paper p="xl" withBorder radius="md">
          <Stack align="center" gap="xs">
            <Text size="lg" fw={500}>Chưa có tài liệu nào</Text>
            <Text size="sm" c="dimmed" ta="center">
              Chưa có tài liệu nào được nộp cho giai đoạn này.
              <br />
              Bạn có thể trả lời câu hỏi ở tab Soạn thảo hoặc tải tài liệu trực tiếp tại đây.
            </Text>
            <Button leftSection={<Upload size={16} />} onClick={() => setUploadOpen(true)}>
              Tải tài liệu lên
            </Button>
          </Stack>
        </Paper>
      ) : (
        <DocumentGroupList groups={groups} missing={missing} onDelete={(documentId, displayName) => setDeleteTarget({ documentId, displayName })} isDeleting={deleteMutation.isPending} />
      )}

      <StageDocumentUploadModal opened={uploadOpen} onClose={() => setUploadOpen(false)} caseId={caseId} checkpointCode={checkpointCode} />
      <Modal opened={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Xóa tài liệu" centered size="sm">
        <Stack gap="md">
          <Text size="sm">
            Xóa tài liệu &ldquo;{deleteTarget?.displayName}&rdquo;? Tài liệu sai sẽ được gỡ khỏi danh sách chấm.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              Hủy
            </Button>
            <Button color="red" loading={deleteMutation.isPending} onClick={handleConfirmDelete}>
              Xóa tài liệu
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
