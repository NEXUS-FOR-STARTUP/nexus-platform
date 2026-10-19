"use client";

import { useState } from "react";
import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { Dropzone, type FileRejection } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { AlertCircle, UploadCloud } from "lucide-react";
import { DOCUMENT_CATEGORY_CODES, docCategoryLabel } from "@repo/validation";
import type { StageCode } from "@app/shared/stages";
import { useStageDocumentUpload } from "../../../hooks/useStageDocumentUpload";
import UploadFileRow from "./UploadFileRow";
import {
  ACCEPTED_FORMATS_LABEL,
  ACCEPTED_MIME_TYPES,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "./upload-limits";

interface StageDocumentUploadModalProps {
  opened: boolean;
  onClose: () => void;
  caseId: string;
  checkpointCode: StageCode;
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

export default function StageDocumentUploadModal({ opened, onClose, caseId, checkpointCode }: StageDocumentUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<(string | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { upload, isUploading, error: uploadError, reset } = useStageDocumentUpload(caseId, checkpointCode);

  const appendFiles = (selected: File[]) => {
    const combined = [...files, ...selected];
    if (combined.length > MAX_FILES) {
      setError(`Chỉ được tải tối đa ${MAX_FILES} tài liệu. Bạn đã chọn ${combined.length} tệp.`);
      return;
    }
    setError(null);
    reset();
    setFiles(combined);
    setCategories([...categories, ...selected.map(() => null)]);
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
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const setCategory = (index: number, value: string) => {
    setCategories((prev) => prev.map((c, i) => (i === index ? value : c)));
  };

  const handleClose = () => {
    setFiles([]);
    setCategories([]);
    setError(null);
    reset();
    onClose();
  };

  const handleSave = () => {
    setError(null);
    upload(
      { files, categories: categories.filter((c): c is string => c !== null) },
      {
        onSuccess: () => {
          notifications.show({ color: "green", title: "Tải tệp thành công", message: `Đã tải ${files.length} tài liệu.` });
          handleClose();
        },
      },
    );
  };

  const isFormValid = files.length > 0 && categories.every((c) => c !== null);
  const shownError = error ?? uploadError;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Tải tài liệu lên"
      size="lg"
      radius="lg"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">Chọn tệp, gắn loại cho từng tệp, rồi bấm Lưu</Text>

        {shownError && (
          <Alert color="red" icon={<AlertCircle size={16} />}>
            {shownError}
          </Alert>
        )}

        <Dropzone onDrop={appendFiles} onReject={handleRejectedFiles} maxSize={MAX_FILE_SIZE_BYTES} accept={ACCEPTED_MIME_TYPES} p="xl">
          <Stack align="center" gap="xs" style={{ pointerEvents: "none" }} py="md">
            <UploadCloud size={32} />
            <Text size="sm" fw={500}>Kéo thả tệp vào đây hoặc bấm để chọn</Text>
            <Text size="sm" c="dimmed">Tối đa {MAX_FILES} tệp, mỗi tệp {MAX_FILE_SIZE_MB}MB</Text>
            <Text size="sm" c="dimmed">{ACCEPTED_FORMATS_LABEL}</Text>
          </Stack>
        </Dropzone>

        {files.map((file, i) => (
          <UploadFileRow
            key={`${file.name}-${i}`}
            file={file}
            category={categories[i]}
            categoryOptions={TYPE_OPTIONS}
            onCategoryChange={(value) => setCategory(i, value)}
            onRemove={() => removeFile(i)}
          />
        ))}

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={handleClose} disabled={isUploading}>
            Hủy
          </Button>
          <Button loading={isUploading} disabled={!isFormValid} onClick={handleSave}>
            Lưu ({files.length} tệp)
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
