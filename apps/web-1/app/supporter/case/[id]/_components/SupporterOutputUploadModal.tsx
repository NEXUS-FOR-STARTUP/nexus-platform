"use client";

import React, { useState } from "react";
import { Modal, Button, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Send, AlertCircle, UploadCloud, FileText, X } from "lucide-react";
import { useSupporterOutputUpload } from "../../../../dashboard/case/[id]/hooks/useCaseDocumentUploads";

interface SupporterOutputUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
}

export default function SupporterOutputUploadModal({ isOpen, onClose, caseId }: SupporterOutputUploadModalProps) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { submitSupporterOutputUpload, isSubmitting } = useSupporterOutputUpload(caseId);

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
    } catch (err: any) {
      setError(err.response?.data?.message || "Đã xảy ra lỗi khi tải output.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    setFiles(selected);
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
      title={<span className="font-heading font-bold text-sm text-text-app">Tải output hỗ trợ</span>}
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
          <label className="border-2 border-dashed border-border-strong hover:border-brand/40 bg-surface-soft/40 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3">
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.pptx,.md,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-10 h-10 rounded-full bg-brand-soft/40 text-brand flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-body text-xs font-semibold text-text-app">
                Chọn một hoặc nhiều tệp output
              </p>
              <p className="font-body text-[10px] text-text-muted">
                Hỗ trợ PDF, DOCX, XLSX, PPTX, MD, TXT. Tối đa 15MB mỗi tệp.
              </p>
            </div>
          </label>

          {files.length > 0 && (
            <div className="space-y-2">
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
          placeholder="Mô tả ngắn về output này..."
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
            color="brand"
            leftSection={<Send className="w-3.5 h-3.5" />}
            className="flex-1 font-semibold cursor-pointer"
          >
            <span>{isSubmitting ? "Đang tải..." : "Tải output"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
