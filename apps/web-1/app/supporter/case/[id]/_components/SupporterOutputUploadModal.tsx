"use client";

import React, { useState } from "react";
import { Modal, Button, Textarea } from "@mantine/core";
import { Dropzone, type FileRejection } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { Send, AlertCircle, UploadCloud, FileText, X, CheckCircle2 } from "lucide-react";
import { useSupporterOutputUpload } from "../../../../dashboard/case/[id]/hooks/useCaseDocumentUploads";

interface SupporterOutputUploadModalProps {
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

export default function SupporterOutputUploadModal({ isOpen, onClose, caseId }: SupporterOutputUploadModalProps) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { submitSupporterOutputUpload, isSubmitting } = useSupporterOutputUpload(caseId);

  const appendFiles = (selected: File[]) => {
    const combined = [...files, ...selected];
    if (combined.length > MAX_FILES) {
      setError(`Chỉ được tải tối đa ${MAX_FILES} tệp output. Bạn đã chọn ${combined.length} tệp.`);
      return;
    }
    setError(null);
    setFiles(combined);
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      await submitSupporterOutputUpload({
        note: note || undefined,
        files,
      });
      notifications.show({
        title: "Tải output thành công",
        message: "Đã tải tài liệu output hỗ trợ thành công.",
        color: "green",
      });
      handleClose();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(message || "Đã xảy ra lỗi khi tải output.");
    }
  };

  const handleRejectedFiles = (rejections: FileRejection[]) => {
    const firstErrorCode = rejections[0]?.errors[0]?.code;
    if (firstErrorCode === "file-too-large") {
      setError(`Mỗi tệp tối đa ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setError("Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp PDF, DOCX, XLSX, PPTX, MD hoặc TXT.");
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
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-soft/40 text-brand flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-h3 text-text-app">Tải output hỗ trợ</h3>
        </div>
      }
      size="lg"
      radius="md"
      centered
    >
      <div className="space-y-4 font-body text-base pt-1">
        {error && (
          <div className="p-3 bg-danger-soft border border-danger/10 text-danger rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-app">Tệp output đính kèm</label>
            <span className="text-xs text-text-subtle font-medium">Tối đa {MAX_FILES} tệp</span>
          </div>

          <Dropzone
            onDrop={appendFiles}
            onReject={handleRejectedFiles}
            accept={ACCEPTED_MIME_TYPES}
            maxSize={MAX_FILE_SIZE_BYTES}
            maxFiles={MAX_FILES}
            multiple
            disabled={isSubmitting}
            className="border-2 border-dashed border-border-strong hover:border-brand/50 bg-surface-soft/30 hover:bg-surface-soft/70 rounded-xl p-5 text-center cursor-pointer transition-all duration-200"
          >
            <Dropzone.Accept>
              <div className="flex flex-col items-center justify-center gap-2 py-2 text-success">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
                <p className="font-semibold text-sm">Thả tệp vào đây để tải lên</p>
              </div>
            </Dropzone.Accept>

            <Dropzone.Reject>
              <div className="flex flex-col items-center justify-center gap-2 py-2 text-danger">
                <AlertCircle className="w-8 h-8" />
                <p className="font-semibold text-sm">Tệp không đúng định dạng hoặc vượt quá {MAX_FILE_SIZE_MB}MB</p>
              </div>
            </Dropzone.Reject>

            <Dropzone.Idle>
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-brand-soft/40 text-brand flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-text-app">
                    Kéo thả hoặc <span className="text-brand underline decoration-brand/30">bấm để chọn tệp</span> output
                  </p>
                  <p className="text-sm text-text-subtle">
                    Hỗ trợ PDF, DOCX, XLSX, PPTX, MD, TXT. Tối đa {MAX_FILE_SIZE_MB}MB mỗi tệp.
                  </p>
                </div>
              </div>
            </Dropzone.Idle>
          </Dropzone>

          {files.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-text-subtle px-1">
                <span>Danh sách tệp đã chọn:</span>
                <span className="font-medium text-text-app">{files.length}/{MAX_FILES} tệp</span>
              </div>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="border border-border-app rounded-xl p-3 bg-surface-app flex items-center justify-between gap-3 shadow-xs hover:border-border-strong transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-soft/40 text-brand flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 font-body text-sm">
                      <p className="font-semibold text-text-app truncate">{file.name}</p>
                      <p className="text-text-subtle">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  {!isSubmitting && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1.5 rounded-lg hover:bg-danger-soft hover:text-danger text-text-subtle cursor-pointer transition-colors"
                      title="Gỡ tệp"
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
          placeholder="Mô tả ngắn gọn hoặc lưu ý cho sinh viên về bản output này..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          minRows={2}
          autosize
          variant="default"
          radius="md"
          className="font-body text-sm"
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-app">
          <Button onClick={handleClose} variant="default" className="font-semibold text-base h-10">
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            loading={isSubmitting}
            color="brand"
            leftSection={<Send className="w-4 h-4" />}
            className="font-semibold cursor-pointer text-base h-10"
          >
            <span>{isSubmitting ? "Đang tải lên..." : "Tải output hỗ trợ"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
