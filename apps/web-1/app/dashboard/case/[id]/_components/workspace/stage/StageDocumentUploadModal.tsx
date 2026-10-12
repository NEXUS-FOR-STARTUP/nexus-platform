"use client";

import { useState } from "react";
import { Modal, Button, Select, Group, Stack, Text, Paper } from "@mantine/core";
import { Dropzone, type FileRejection } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { UploadCloud, AlertCircle, X } from "lucide-react";
import { DOCUMENT_CATEGORY_CODES, docCategoryLabel } from "@repo/validation";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import { useStageDocumentUpload } from "../../../hooks/useStageDocumentUpload";
import type { StageCode } from "@app/shared/stages";

interface StageDocumentUploadModalProps {
  opened: boolean;
  onClose: () => void;
  caseId: string;
  checkpointCode: StageCode;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_MIME_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
};

function readApiMessage(err: unknown): string | undefined {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return undefined;
}

/**
 * Stage document upload: pick files, assign a type to each, save once.
 * Types are the same catalog the intake step offers, so a student who picked
 * "Slide thuyết trình" in intake picks the same label here. The server keeps the
 * stored kind (`revision_document`) and saves the pick as the file's category.
 */
const TYPE_OPTIONS = DOCUMENT_CATEGORY_CODES.map((code) => ({
  value: code,
  label: docCategoryLabel(code),
}));

/** Stored kind for every file uploaded through this modal. */
const STAGE_DOC_TYPE = "revision_document";

export default function StageDocumentUploadModal({ opened, onClose, caseId, checkpointCode }: StageDocumentUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [typeByIndex, setTypeByIndex] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const uploadMutation = useStageDocumentUpload(caseId, checkpointCode);

  const appendFiles = (selected: File[]) => {
    const combined = [...files, ...selected];
    if (combined.length > MAX_FILES) {
      setError(`Chỉ được tải tối đa ${MAX_FILES} tài liệu. Bạn đã chọn ${combined.length} tệp.`);
      return;
    }
    setError(null);
    setFiles(combined);
  };

  const handleRejectedFiles = (rejections: FileRejection[]) => {
    const firstErrorCode = rejections[0]?.errors[0]?.code;
    if (firstErrorCode === "file-too-large") {
      setError(`Mỗi tệp tối đa ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setError("Định dạng tệp không được hỗ trợ. Vui lòng dùng PDF, DOCX, XLSX, PPTX hoặc TXT.");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setTypeByIndex((prev) => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const n = Number(k);
        if (n < index) next[n] = v;
        else if (n > index) next[n - 1] = v;
      }
      return next;
    });
  };

  const handleClose = () => {
    setFiles([]);
    setTypeByIndex({});
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const documents = await Promise.all(
        files.map(async (file, i) => {
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
          return {
            original_name: file.name,
            file_url: uploaded.file_url,
            download_url: uploaded.download_url,
            cloudinary_public_id: uploaded.cloudinary_public_id,
            extension: uploaded.extension || "bin",
            mime_type: uploaded.mime_type || "application/octet-stream",
            doc_type: STAGE_DOC_TYPE,
            category: typeByIndex[i],
          };
        }),
      );
      await uploadMutation.mutateAsync(documents);
      notifications.show({ color: "green", title: "Tải tệp thành công", message: `Đã tải ${files.length} tài liệu.` });
      handleClose();
    } catch (err: unknown) {
      setError(readApiMessage(err) || "Đã xảy ra lỗi khi tải tài liệu.");
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = files.length > 0 && files.every((_, i) => Boolean(typeByIndex[i]));

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-soft/40 text-brand flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading font-semibold text-base text-text-app">Tải tài liệu mới</div>
            <div className="font-body text-xs text-text-muted">Chọn tệp, gắn loại cho từng tệp, rồi bấm Lưu</div>
          </div>
        </div>
      }
      size="xl"
      radius="lg"
      centered
      padding="xl"
    >
      <Stack gap="lg" mt="md">
        {error && (
          <div className="p-3 bg-danger-soft border border-danger/10 text-danger rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Dropzone
          onDrop={appendFiles}
          onReject={handleRejectedFiles}
          maxSize={MAX_FILE_SIZE_BYTES}
          accept={ACCEPTED_MIME_TYPES}
          p="xl"
        >
          <Stack align="center" gap="xs" style={{ pointerEvents: "none" }} py="md">
            <UploadCloud className="w-8 h-8 text-text-muted" />
            <Text size="sm" fw={600}>Kéo thả tệp vào đây hoặc bấm để chọn</Text>
            <Text size="xs" c="dimmed">Tối đa {MAX_FILES} tệp, mỗi tệp {MAX_FILE_SIZE_MB}MB</Text>
            <Text size="xs" c="dimmed">PDF, DOCX, XLSX, PPTX, TXT</Text>
          </Stack>
        </Dropzone>

        {files.map((file, i) => (
          <Paper key={`${file.name}-${i}`} withBorder radius="md" p="md">
            <Stack gap="sm">
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                  <FileTypeIcon name={file.name} size={36} />
                  <Stack gap={0} style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} truncate>{file.name}</Text>
                    <Text size="xs" c="dimmed">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                  </Stack>
                </Group>
                <Button variant="subtle" size="xs" color="red" onClick={() => removeFile(i)} aria-label={`Xóa ${file.name}`}>
                  <X size={14} />
                </Button>
              </Group>
              <Select
                label="Loại tài liệu"
                placeholder="Chọn loại tài liệu"
                description="AI dùng loại này để phân loại tài liệu của bạn"
                data={TYPE_OPTIONS}
                value={typeByIndex[i] || null}
                onChange={(val) => val && setTypeByIndex((prev) => ({ ...prev, [i]: val }))}
              />
            </Stack>
          </Paper>
        ))}

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={handleClose} disabled={saving}>
            Hủy
          </Button>
          <Button color="blue" loading={saving} disabled={!isFormValid} onClick={handleSave}>
            Lưu ({files.length} tệp)
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
