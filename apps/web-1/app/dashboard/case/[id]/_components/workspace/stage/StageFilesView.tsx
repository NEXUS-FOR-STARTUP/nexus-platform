"use client";

import { useMemo, useState } from "react";
import { Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { isAxiosError } from "axios";
import { UploadSimpleIcon } from "@phosphor-icons/react";
import type { StageCode } from "@app/shared/stages";
import type { DocumentWorkspace } from "@/types";
import { getAuditStageUi } from "@/lib/audit-stage-ui";
import { useStageDocumentDelete } from "../../../hooks/useStageDocumentDelete";
import { buildExternalFeedbackRows, buildSupportFlowRows } from "../../documents/document-workspace.types";
import { Button } from "../../ui/Button";
import Notice from "../../ui/Notice";
import DocumentGroupList from "./DocumentGroupList";
import { groupDocumentsByCategory, missingCategories, type DocumentGroup } from "./document-groups";
import StageDocumentUploadModal from "./StageDocumentUploadModal";
import { ACCEPTED_FORMATS_LABEL, MAX_FILES, MAX_FILE_SIZE_MB } from "./upload-limits";
import s from "./stage-files.module.css";

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

  const privacyNotice = getAuditStageUi(checkpointCode)?.privacyNotice ?? null;
  const { groups, missing } = useMemo(() => {
    const checkpoint = documentWorkspace?.checkpoints.find((cp) => cp.checkpoint_code === checkpointCode);
    if (!checkpoint) return { groups: [] as DocumentGroup[], missing: [] as string[] };
    const categoryGroups = groupDocumentsByCategory(buildSupportFlowRows(checkpoint.support_flow_documents));
    const feedbackRows = buildExternalFeedbackRows(checkpoint.external_feedback_documents);
    const feedbackGroups = feedbackRows.length > 0 ? [{ label: FEEDBACK_GROUP_LABEL, rows: feedbackRows }] : [];
    return { groups: [...categoryGroups, ...feedbackGroups], missing: missingCategories(categoryGroups) };
  }, [documentWorkspace, checkpointCode]);

  return (
    <div>
      {privacyNotice && (
        <Notice kind="info" title="Lưu ý quyền riêng tư">
          {privacyNotice}
        </Notice>
      )}

      <div className={s.bar}>
        <div>
          <h2 className={s.title}>Tài liệu đã nộp ({fileCount})</h2>
          <p className={s.note}>
            {ACCEPTED_FORMATS_LABEL} · tối đa {MAX_FILES} tệp, mỗi tệp {MAX_FILE_SIZE_MB} MB
          </p>
        </div>
        <Button variant="quiet" leftSection={<UploadSimpleIcon size={16} aria-hidden />} onClick={() => setUploadOpen(true)}>
          Tải tài liệu lên
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className={s.empty}>
          <h2 className={s.title}>Chưa có tài liệu nào</h2>
          <p className={s.note}>
            Chưa có tài liệu nào được nộp cho giai đoạn này. Bạn có thể trả lời câu hỏi ở tab Soạn thảo hoặc tải tài liệu trực tiếp tại đây.
          </p>
        </div>
      ) : (
        <DocumentGroupList
          groups={groups}
          missing={missing}
          onDelete={(documentId, displayName) => setDeleteTarget({ documentId, displayName })}
          isDeleting={deleteMutation.isPending}
        />
      )}

      <StageDocumentUploadModal opened={uploadOpen} onClose={() => setUploadOpen(false)} caseId={caseId} checkpointCode={checkpointCode} />
      <Modal opened={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Xóa tài liệu" centered size="sm">
        <p className={s.dialogText}>
          Xóa tài liệu &ldquo;{deleteTarget?.displayName}&rdquo;? Tài liệu sai sẽ được gỡ khỏi danh sách chấm.
        </p>
        <div className={s.dialogActs}>
          <Button variant="quiet" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
            Hủy
          </Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={handleConfirmDelete}>
            Xóa tài liệu
          </Button>
        </div>
      </Modal>
    </div>
  );
}
