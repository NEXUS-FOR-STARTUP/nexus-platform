"use client";

import React, { useState } from "react";
import {
  Modal,
  Button,
  FileButton,
  Checkbox,
  Badge,
} from "@mantine/core";
import { FileText, CheckCircle2 } from "lucide-react";
import { QUESTION_REGISTRY, type Question } from "@repo/validation";

interface Proposal {
  question_id: string;
  proposed_text: string;
  confidence: number;
}

interface GuidedImportModalProps {
  opened: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<{ proposals: Proposal[] }>;
  onApplyProposals: (answers: Array<{ question_id: string; answer_text: string }>) => Promise<void>;
}

export default function GuidedImportModal({
  opened,
  onClose,
  onImport,
  onApplyProposals,
}: GuidedImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleFileChange = async (payload: File | null) => {
    if (!payload) return;
    setFile(payload);
    setIsLoading(true);
    try {
      const res = await onImport(payload);
      setProposals(res.proposals || []);
      setSelectedIds(new Set((res.proposals || []).map((p) => p.question_id)));
    } catch {
      // Error handled by hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    const toApply = proposals
      .filter((p) => selectedIds.has(p.question_id))
      .map((p) => ({
        question_id: p.question_id,
        answer_text: p.proposed_text,
      }));
    await onApplyProposals(toApply);
    onClose();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Nhập tài liệu có sẵn (.docx, .pdf, .md)"
      size="lg"
      centered
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          Hệ thống sẽ trích xuất văn bản trong bộ nhớ và tự động gợi ý câu trả lời tương ứng với
          các câu hỏi trong biểu mẫu. Bạn có thể xem lại và duyệt trước khi lưu.
        </p>

        {/* File Picker */}
        <div className="flex items-center gap-3 p-4 bg-surface-soft border border-border-app rounded-xl">
          <FileText className="w-8 h-8 text-brand shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-text-app">
              {file ? file.name : "Chưa chọn tệp"}
            </p>
            <p className="text-xs text-text-muted">Hỗ trợ file Word (.docx), PDF (.pdf) hoặc Markdown</p>
          </div>
          <FileButton onChange={handleFileChange} accept=".docx,.pdf,.md,.txt">
            {(props) => (
              <Button {...props} variant="default" size="xs" loading={isLoading}>
                Chọn tệp
              </Button>
            )}
          </FileButton>
        </div>

        {/* Proposals List */}
        {proposals.length > 0 && (
          <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
              <span>Đã tìm thấy {proposals.length} gợi ý phù hợp:</span>
              <span>Đã chọn {selectedIds.size}</span>
            </div>

            {proposals.map((prop) => {
              const q = (QUESTION_REGISTRY as Record<string, Question | undefined>)[prop.question_id];
              const isChecked = selectedIds.has(prop.question_id);

              return (
                <div
                  key={prop.question_id}
                  className={`p-3 rounded-lg border text-xs flex flex-col gap-1.5 transition-colors ${
                    isChecked
                      ? "bg-brand/5 border-brand/40"
                      : "bg-surface-app border-border-app opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Checkbox
                      checked={isChecked}
                      onChange={() => toggleSelect(prop.question_id)}
                      label={<span className="font-semibold text-text-app">{q?.text || prop.question_id}</span>}
                    />
                    <Badge size="xs" color={prop.confidence > 0.6 ? "teal" : "blue"}>
                      Độ khớp: {Math.round(prop.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-text-muted line-clamp-2 pl-6">{prop.proposed_text}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-app">
          <Button variant="default" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="filled"
            color="blue"
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={handleApply}
            leftSection={<CheckCircle2 className="w-4 h-4" />}
          >
            Áp dụng {selectedIds.size} câu trả lời
          </Button>
        </div>
      </div>
    </Modal>
  );
}
