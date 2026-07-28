"use client";

import React, { useState } from "react";
import { Modal, Button, Textarea } from "@mantine/core";
import { Dropzone, type FileRejection } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { Send, AlertCircle, UploadCloud, FileText, X } from "lucide-react";
import { useStudentDocumentUpload } from "../hooks/useCaseDocumentUploads";

interface StudentDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_MIME_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/markdown": [".md"],
  "text/plain": [".txt", ".md"],
};

export default function StudentDocumentUploadModal({ isOpen, onClose, caseId }: StudentDocumentUploadModalProps) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { submitStudentUpload, isSubmitting } = useStudentDocumentUpload(caseId);

  const appendFiles = (selected: File[]) => {
    const combined = [...files, ...selected];
    if (combined.length > MAX_FILES) {
      setError(`Chỉ được tải tối đa ${MAX_FILES} tài liệu. Bạn đã chọn ${combined.length} tệp.`);
      return;
    }
    setError(null);
    setFiles(combined);
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      await submitStudentUpload({
        note: note || undefined,
        files,
      });
      notifications.show({
        title: "Tải tài liệu thành công",
        message: "Đã tải tài liệu bản sửa thành công.",
        color: "green",
      });
      handleClose();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(message || "Đã xảy ra lỗi khi tải tài liệu.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    appendFiles(selected);
    event.target.value = "";
  };

  const handleRejectedFiles = (rejections: FileRejection[]) => {
    const firstErrorCode = rejections[0]?.errors[0]?.code;
    if (firstErrorCode === "file-too-large") {
      setError(`Mỗi tệp tối đa ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setError("Định dạng tệp không được hỗ trợ. Vui lòng dùng PDF, DOCX, XLSX, PPTX, MD hoặc TXT.");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleClose = () => {
    setNote("");
    setFiles([]);
    setError(null);
    onClose();
  };

  const isFormValid = files.length > 0;

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title={<span className="font-heading font-bold text-sm text-text-app">Tải tài liệu</span>}
      size="lg"
      radius="md"
      centered
    >
      <div className="space-y-4 font-body">
        {error && (
          <div className="p-3 bg-danger-soft border border-danger/10 text-danger rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-app block">Tệp đính kèm</label>
          <Dropzone
            onDrop={appendFiles}
            onReject={handleRejectedFiles}
            accept={ACCEPTED_MIME_TYPES}
            maxSize={MAX_FILE_SIZE_BYTES}
            maxFiles={MAX_FILES}
            multiple
            disabled={isSubmitting}
            className="border-2 border-dashed border-border-strong hover:border-brand/40 bg-surface-soft/40 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
          >
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.pptx,.md,.txt"
              className="hidden"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            <div className="w-10 h-10 rounded-full bg-brand-soft/40 text-brand flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-body text-xs font-semibold text-text-app">
                Tải lên tài liệu bản sửa của nhóm...
              </p>
              <p className="font-body text-[10px] text-text-muted">
                Hỗ trợ PDF, DOCX, XLSX, PPTX, MD, TXT. Tối đa {MAX_FILE_SIZE_MB}MB mỗi tệp. Tối đa {MAX_FILES} tài liệu.
              </p>
            </div>
          </Dropzone>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">
                  {files.length}/{MAX_FILES} tài liệu
                </p>
              </div>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="border border-border-app rounded-xl p-3 bg-surface-soft/40 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-soft/40 text-brand flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 font-body text-xs">
                      <p className="font-semibold text-text-app truncate">{file.name}</p>
                      <p className="text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  {!isSubmitting && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1.5 rounded-full hover:bg-surface-muted text-text-muted hover:text-text-app cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Textarea
          label="Ghi chú (Tùy chọn)"
          placeholder="Mô tả ngắn về tài liệu này..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          minRows={2}
          autosize
          variant="default"
          radius="md"
        />

        <div className="flex gap-3 pt-4 border-t border-border-app">
          <Button onClick={handleClose} variant="default" className="flex-1">
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            loading={isSubmitting}
            color="brand"
            leftSection={<Send className="w-3.5 h-3.5" />}
            className="flex-1 font-semibold cursor-pointer"
          >
            <span>{isSubmitting ? "Đang tải..." : "Tải lên"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
