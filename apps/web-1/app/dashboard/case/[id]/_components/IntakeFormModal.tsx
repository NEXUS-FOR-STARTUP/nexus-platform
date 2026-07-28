"use client";

import React, { useState, useRef } from "react";
import { Modal, Button, TextInput, Textarea, Select } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface IntakeFormModalProps {
  caseId: string;
  opened: boolean;
  onClose: () => void;
}

export default function IntakeFormModal({ caseId, opened, onClose }: IntakeFormModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [currentBlocker, setCurrentBlocker] = useState("");
  const [primaryNeed, setPrimaryNeed] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [boundaryConfirmations, setBoundaryConfirmations] = useState<string[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post(`/cases/${caseId}/documents/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post(`/cases/${caseId}/intake`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      notifications.show({
        title: "Cập nhật thành công",
        message: "Thông tin hồ sơ đã được cập nhật.",
        color: "teal",
      });
      handleClose();
    },
    onError: (err: any) => {
      notifications.show({
        title: "Cập nhật thất bại",
        message: err?.response?.data?.message || "Vui lòng thử lại sau.",
        color: "red",
      });
    },
  });

  const toggleBoundary = (item: string) => {
    setBoundaryConfirmations((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const payload: any = {
      contact: {
        full_name: contactName,
        email: contactEmail,
        zalo: contactPhone,
      },
      current_blocker: currentBlocker,
      support_needs: {
        primary_need: primaryNeed,
        extra_notes: extraNotes,
      },
      boundary_confirmations: boundaryConfirmations,
      documents: selectedFile ? [{ file_url: "pending_upload" }] : [],
    };

    // Upload file first if selected
    if (selectedFile) {
      try {
        await uploadMutation.mutateAsync(selectedFile);
      } catch {
        notifications.show({
          title: "Tải file thất bại",
          message: "Không thể tải lên tài liệu đính kèm.",
          color: "red",
        });
        return;
      }
    }

    submitMutation.mutate(payload);
  };

  const handleClose = () => {
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setCurrentBlocker("");
    setPrimaryNeed("");
    setExtraNotes("");
    setSelectedFile(null);
    setBoundaryConfirmations([]);
    onClose();
  };

  const isPending = submitMutation.isPending || uploadMutation.isPending;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <span className="font-heading font-bold text-base text-text-app">
          Cập nhật thông tin hồ sơ
        </span>
      }
      size="lg"
      radius="md"
      centered
    >
      <div className="space-y-5 font-body text-xs text-text-app max-h-[70vh] overflow-y-auto pr-2">
        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="font-heading font-semibold text-sm text-text-app border-b border-border-app pb-2">
            Thông tin liên hệ
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <TextInput
              label="Email"
              placeholder="nguyenvana@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <TextInput
              label="Số điện thoại / Zalo"
              placeholder="0909090909"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Blocker */}
        <div className="space-y-3">
          <h4 className="font-heading font-semibold text-sm text-text-app border-b border-border-app pb-2">
            Tình trạng hiện tại
          </h4>
          <Textarea
            label="Khó khăn / vướng mắc hiện tại"
            placeholder="Mô tả ngắn gọn khó khăn của nhóm bạn..."
            value={currentBlocker}
            onChange={(e) => setCurrentBlocker(e.target.value)}
            minRows={2}
            autosize
          />
        </div>

        {/* Support Needs */}
        <div className="space-y-3">
          <h4 className="font-heading font-semibold text-sm text-text-app border-b border-border-app pb-2">
            Nhu cầu hỗ trợ
          </h4>
          <Select
            label="Nhu cầu chính"
            placeholder="Chọn nhu cầu chính"
            value={primaryNeed}
            onChange={(val) => setPrimaryNeed(val || "")}
            data={[
              { value: "idea_validation", label: "Phản biện tính khả thi ý tưởng" },
              { value: "team_fit", label: "Đánh giá đội ngũ" },
              { value: "market_analysis", label: "Phân tích thị trường" },
              { value: "financial_planning", label: "Kế hoạch tài chính" },
              { value: "pitch_deck", label: "Hoàn thiện Pitch Deck" },
              { value: "other", label: "Khác" },
            ]}
          />
          <Textarea
            label="Ghi chú thêm"
            placeholder="Thông tin bổ sung về nhu cầu hỗ trợ..."
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            minRows={2}
            autosize
          />
        </div>

        {/* Document Upload */}
        <div className="space-y-3">
          <h4 className="font-heading font-semibold text-sm text-text-app border-b border-border-app pb-2">
            Tài liệu đính kèm
          </h4>
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border-strong hover:border-brand/40 rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Upload className="w-5 h-5 text-text-muted" />
              <p className="text-xs text-text-muted">Nhấp để tải lên tài liệu</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-surface-soft rounded-lg border border-border-app">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-brand shrink-0" />
                <span className="text-xs truncate">{selectedFile.name}</span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 hover:bg-surface-muted rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Boundary Confirmations */}
        <div className="space-y-3">
          <h4 className="font-heading font-semibold text-sm text-text-app border-b border-border-app pb-2">
            Xác nhận ranh giới
          </h4>
          <div className="space-y-2">
            {[
              { value: "no_nda", label: "Tôi hiểu đây là đánh giá công khai, không có NDA" },
              { value: "self_reviewed", label: "Nhóm đã tự rà soát nội dung trước khi gửi" },
              { value: "agree_tos", label: "Tôi đồng ý với điều khoản dịch vụ của nền tảng" },
            ].map((item) => (
              <label
                key={item.value}
                className="flex items-start gap-2 p-2 rounded hover:bg-surface-soft cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={boundaryConfirmations.includes(item.value)}
                  onChange={() => toggleBoundary(item.value)}
                  className="mt-0.5 cursor-pointer"
                />
                <span className="text-xs">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error state */}
        {submitMutation.error && (
          <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger/20 text-danger rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{submitMutation.error?.response?.data?.message || "Đã xảy ra lỗi."}</span>
          </div>
        )}

        {uploadMutation.error && (
          <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger/20 text-danger rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Không thể tải lên tài liệu. Vui lòng thử lại.</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-border-app">
        <Button
          onClick={handleClose}
          variant="default"
          disabled={isPending}
          className="font-body font-semibold text-xs h-9 px-4 cursor-pointer"
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          color="brand"
          loading={isPending}
          disabled={isPending}
          className="font-body font-semibold text-xs h-9 px-4 cursor-pointer"
        >
          {isPending ? "Đang lưu..." : "Lưu thông tin"}
        </Button>
      </div>
    </Modal>
  );
}
